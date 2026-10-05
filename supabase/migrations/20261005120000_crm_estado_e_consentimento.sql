-- Soldiers Platform — CRM: linha do tempo do estado do cliente e consentimento por canal.
-- Plano Mestre caps. 11.3 (Customer State dinâmico), 11.8 (Customer Health) e 32 (LGPD: consentimento,
-- preferências, auditoria).
--
-- O que cria:
--   1) crm_estado_dia            — quantos clientes em cada estado, por dia (foto diária da base).
--   2) crm_estado_historico      — o estado de cada cliente só quando muda (de → para, desde quando).
--   3) crm_registra_estados()    — tira a foto do dia a partir de mv_growth_cliente_perfil.
--   4) cliente_consentimento     — registro (só inserção) de concessão/revogação por canal: e-mail, WhatsApp, SMS.
--   5) vw_cliente_consentimento_atual — a situação vigente de cada cliente em cada canal.
--   6) crm_importa_consentimento_shopify() — traz o accepts_marketing dos pedidos do Shopify como e-mail.
--
-- Aplicar no Supabase (SQL editor ou `supabase db push`). Não altera nenhuma tabela existente.
-- As regras de estado são as mesmas da tela (src/lib/clientes360.ts → REGRA_ESTADO). Mudou lá, mude aqui.

-- ---------------------------------------------------------------------------------------------
-- 1) Foto diária por estado
create table if not exists public.crm_estado_dia (
  data      date not null,
  estado    text not null check (estado in ('novo','recorrente','fiel','em_risco','adormecido','perdido','sem_dado')),
  clientes  int  not null check (clientes >= 0),
  gerado_em timestamptz not null default now(),
  primary key (data, estado)
);

-- ---------------------------------------------------------------------------------------------
-- 2) Histórico por cliente (uma linha por mudança de estado; a aberta tem ate = null)
create table if not exists public.crm_estado_historico (
  id              bigint generated always as identity primary key,
  cliente_chave   text not null,
  estado          text not null check (estado in ('novo','recorrente','fiel','em_risco','adormecido','perdido','sem_dado')),
  estado_anterior text check (estado_anterior is null or estado_anterior in ('novo','recorrente','fiel','em_risco','adormecido','perdido','sem_dado')),
  desde           date not null,
  ate             date,
  check (ate is null or ate >= desde)
);
create unique index if not exists crm_estado_historico_aberto on public.crm_estado_historico (cliente_chave) where ate is null;
create index if not exists crm_estado_historico_desde on public.crm_estado_historico (desde);

-- ---------------------------------------------------------------------------------------------
-- 3) Classificação (mesma ordem da tela): perdido → adormecido → em risco → novo → fiel → recorrente
create or replace function public.crm_estado_de(p_dias numeric, p_pedidos numeric, p_razao numeric)
returns text language sql immutable as $$
  select case
    when p_dias is null then 'sem_dado'
    when p_dias > 180 then 'perdido'
    when p_dias > 90 then 'adormecido'
    when coalesce(p_pedidos, 0) >= 2 and p_razao is not null and p_razao > 1.5 then 'em_risco'
    when coalesce(p_pedidos, 0) <= 1 then 'novo'
    when p_pedidos >= 4 then 'fiel'
    else 'recorrente'
  end
$$;

-- Tira a foto do dia. Idempotente: rodar duas vezes no mesmo dia não duplica nada.
-- Rodar depois de atualizar mv_growth_cliente_perfil (atualiza_growth_mv).
create or replace function public.crm_registra_estados(p_data date default current_date)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_mudaram int := 0;
  v_novos   int := 0;
begin
  create temporary table if not exists _crm_estado_hoje (cliente_chave text primary key, estado text) on commit drop;
  truncate _crm_estado_hoje;
  insert into _crm_estado_hoje (cliente_chave, estado)
  select cliente_chave, public.crm_estado_de(dias_ultima_compra, pedidos, razao_ritmo)
  from public.mv_growth_cliente_perfil
  where cliente_chave is not null
  on conflict (cliente_chave) do nothing;

  -- Contagem do dia
  insert into public.crm_estado_dia (data, estado, clientes, gerado_em)
  select p_data, estado, count(*), now() from _crm_estado_hoje group by estado
  on conflict (data, estado) do update set clientes = excluded.clientes, gerado_em = excluded.gerado_em;
  -- Estado que sumiu hoje fica com zero (para o gráfico não repetir o valor de ontem)
  update public.crm_estado_dia d set clientes = 0, gerado_em = now()
  where d.data = p_data and not exists (select 1 from _crm_estado_hoje h where h.estado = d.estado);

  -- Fecha a linha de quem mudou de estado e abre a nova
  with mudou as (
    update public.crm_estado_historico h
       set ate = p_data - 1
      from _crm_estado_hoje n
     where h.cliente_chave = n.cliente_chave and h.ate is null and h.estado <> n.estado and h.desde < p_data
    returning h.cliente_chave, h.estado as anterior, n.estado as novo
  )
  insert into public.crm_estado_historico (cliente_chave, estado, estado_anterior, desde)
  select cliente_chave, novo, anterior, p_data from mudou;
  get diagnostics v_mudaram = row_count;

  -- Cliente que ainda não tinha linha aberta
  insert into public.crm_estado_historico (cliente_chave, estado, estado_anterior, desde)
  select n.cliente_chave, n.estado, null, p_data
  from _crm_estado_hoje n
  where not exists (select 1 from public.crm_estado_historico h where h.cliente_chave = n.cliente_chave and h.ate is null);
  get diagnostics v_novos = row_count;

  return jsonb_build_object('data', p_data, 'mudaram', v_mudaram, 'entraram', v_novos);
end $$;

-- ---------------------------------------------------------------------------------------------
-- 4) Consentimento por canal (LGPD). Só inserção: corrigir = inserir um novo registro.
create table if not exists public.cliente_consentimento (
  id             bigint generated always as identity primary key,
  cliente_chave  text not null,
  canal          text not null check (canal in ('email','whatsapp','sms')),
  status         text not null check (status in ('concedido','revogado')),
  origem         text not null check (origem in ('shopify','rd_station','klaviyo','formulario','atendimento','importacao')),
  ocorrido_em    timestamptz not null,          -- quando o cliente concedeu/revogou na origem
  registrado_em  timestamptz not null default now(),
  registrado_por text not null,                 -- job ou e-mail de quem registrou
  evidencia      text                           -- ex.: id do pedido, id do formulário (nunca o e-mail/telefone)
);
create index if not exists cliente_consentimento_cliente on public.cliente_consentimento (cliente_chave, canal, ocorrido_em desc);

create or replace function public.cliente_consentimento_imutavel() returns trigger language plpgsql as $$
begin
  raise exception 'cliente_consentimento é só inserção: registre uma nova linha em vez de alterar ou apagar';
end $$;
drop trigger if exists cliente_consentimento_imutavel on public.cliente_consentimento;
create trigger cliente_consentimento_imutavel before update or delete on public.cliente_consentimento
  for each row execute function public.cliente_consentimento_imutavel();

-- 5) Situação vigente: o registro mais recente por cliente e canal
create or replace view public.vw_cliente_consentimento_atual as
select distinct on (cliente_chave, canal)
  cliente_chave, canal, status, origem, ocorrido_em
from public.cliente_consentimento
order by cliente_chave, canal, ocorrido_em desc, id desc;

-- ---------------------------------------------------------------------------------------------
-- 6) Importa o accepts_marketing do Shopify como consentimento de e-mail.
-- [HIPÓTESE] dim_cliente.cliente_id é o id numérico do cliente no Shopify (order_customer_id pode vir
-- como número ou como gid://shopify/Customer/<id>). Só grava quando a situação muda.
create or replace function public.crm_importa_consentimento_shopify(p_desde date default current_date - 30)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v int := 0;
begin
  with pedidos as (
    select distinct on (d.cliente_chave)
      d.cliente_chave,
      case when s.order_customer_accepts_marketing then 'concedido' else 'revogado' end as status,
      s.order_created_at::timestamptz as ocorrido_em,
      s.order_id
    from public.stg_shopify_orders_item s
    join public.dim_cliente d
      on s.order_customer_id in (d.cliente_id::text, 'gid://shopify/Customer/' || d.cliente_id::text)
    where s.order_customer_accepts_marketing is not null
      and s.order_created_at::timestamptz >= p_desde
    order by d.cliente_chave, s.order_created_at::timestamptz desc
  ), atual as (
    select cliente_chave, status from public.vw_cliente_consentimento_atual where canal = 'email'
  )
  insert into public.cliente_consentimento (cliente_chave, canal, status, origem, ocorrido_em, registrado_por, evidencia)
  select p.cliente_chave, 'email', p.status, 'shopify', p.ocorrido_em, 'job:crm_importa_consentimento_shopify', 'pedido ' || p.order_id
  from pedidos p
  left join atual a on a.cliente_chave = p.cliente_chave
  where a.status is distinct from p.status;
  get diagnostics v = row_count;
  return jsonb_build_object('desde', p_desde, 'registrados', v);
end $$;

-- ---------------------------------------------------------------------------------------------
-- 7) Acesso: só o servidor (service role). Telas leem pelas server functions.
alter table public.crm_estado_dia        enable row level security;
alter table public.crm_estado_historico  enable row level security;
alter table public.cliente_consentimento enable row level security;
revoke all on public.crm_estado_dia, public.crm_estado_historico, public.cliente_consentimento from anon, authenticated;
revoke all on public.vw_cliente_consentimento_atual from anon, authenticated;
revoke all on function public.crm_registra_estados(date) from public, anon, authenticated;
revoke all on function public.crm_importa_consentimento_shopify(date) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- 8) (Opcional) Rodar todo dia depois da atualização do growth. Ajuste o horário ao do atualiza_growth_mv.
-- select cron.schedule('crm-estado-diario', '30 7 * * *', $$
--   select public.crm_importa_consentimento_shopify(current_date - 2);
--   select public.crm_registra_estados(current_date);
-- $$);
--
-- Primeira carga do consentimento (todo o histórico):
-- select public.crm_importa_consentimento_shopify('2000-01-01');
