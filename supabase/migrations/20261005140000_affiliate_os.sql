-- Soldiers Platform — Affiliate OS (Plano Mestre cap. 8): creators, ciclo de vida, amostras, outreach e
-- qualidade do cliente por cupom. Só cadastro e leitura: nada aqui convida creator, envia amostra ou paga comissão.
-- O cadastro, por enquanto, é pelo SQL editor; pela tela virá com login + aprovação (Fase 3).
--
-- Aplicar no Supabase (SQL editor ou `supabase db push`). Não altera nenhuma tabela existente.
-- LGPD: creator é identificado por nome público e @. Sem e-mail, telefone, documento ou endereço aqui.

-- ---------------------------------------------------------------------------------------------
-- 1) Creator canônico (cap. 2.4: uma entidade Creator para todos os canais)
create table if not exists public.affiliate_creator (
  id                 uuid primary key default gen_random_uuid(),
  nome               text not null check (length(nome) between 2 and 120),
  tiktok_username    text,
  instagram_username text,
  ml_username        text,
  cupom              text,
  nicho              text,
  tier               text check (tier is null or tier in ('nano','micro','medio','macro','mega')),
  seguidores         int check (seguidores is null or seguidores >= 0),
  estagio            text not null default 'encontrado' check (estagio in (
                       'encontrado','qualificado','convidado','aceitou','amostra','conteudo',
                       'primeira_venda','vendas_recorrentes','escala','embaixador','reativacao','descartado')),
  origem             text not null default 'manual' check (origem in ('tiktok','mercado_livre','instagram','indicacao','manual','importacao')),
  concorrentes       text[] not null default '{}',     -- marcas concorrentes que o creator já divulga
  observacao         text,
  criado_em          timestamptz not null default now(),
  criado_por         text not null,
  atualizado_em      timestamptz,
  atualizado_por     text
);
create unique index if not exists affiliate_creator_tiktok on public.affiliate_creator (lower(tiktok_username)) where tiktok_username is not null;
create unique index if not exists affiliate_creator_ml on public.affiliate_creator (lower(ml_username)) where ml_username is not null;
create unique index if not exists affiliate_creator_cupom on public.affiliate_creator (upper(cupom)) where cupom is not null;

-- Histórico do ciclo de vida (preenchido por gatilho a cada mudança de estágio)
create table if not exists public.affiliate_creator_estagio (
  id          bigint generated always as identity primary key,
  creator_id  uuid not null references public.affiliate_creator(id) on delete cascade,
  de          text,
  para        text not null,
  quando      timestamptz not null default now(),
  por         text
);
create or replace function public.affiliate_creator_registra_estagio() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.estagio is distinct from old.estagio then
    insert into public.affiliate_creator_estagio (creator_id, de, para, por)
    values (new.id, case when tg_op = 'INSERT' then null else old.estagio end, new.estagio, coalesce(new.atualizado_por, new.criado_por));
  end if;
  return new;
end $$;
drop trigger if exists affiliate_creator_registra_estagio on public.affiliate_creator;
create trigger affiliate_creator_registra_estagio after insert or update on public.affiliate_creator
  for each row execute function public.affiliate_creator_registra_estagio();

-- ---------------------------------------------------------------------------------------------
-- 2) Amostras (Kanban do cap. 8.9) com custos para o Sample ROI (cap. 8.10)
create table if not exists public.affiliate_amostra (
  id               uuid primary key default gen_random_uuid(),
  creator_id       uuid not null references public.affiliate_creator(id) on delete cascade,
  sku              text not null,
  produto          text,
  status           text not null default 'solicitou' check (status in (
                     'solicitou','aprovado','aguardando_envio','enviado','recebido','conteudo_pendente','publicado','vendeu','cancelado')),
  solicitado_em    date not null default current_date,
  aprovado_em      date,
  enviado_em       date,
  recebido_em      date,
  publicado_em     date,
  primeira_venda_em date,
  custo_produto    numeric not null default 0 check (custo_produto >= 0),
  frete            numeric not null default 0 check (frete >= 0),
  desconto         numeric not null default 0 check (desconto >= 0),
  outros_custos    numeric not null default 0 check (outros_custos >= 0),
  conteudo_url     text check (conteudo_url is null or conteudo_url ~ '^https://'),
  observacao       text,
  atualizado_em    timestamptz not null default now(),
  atualizado_por   text not null
);
-- Data de cada etapa preenchida sozinha quando o status muda (se ainda estiver vazia)
create or replace function public.affiliate_amostra_datas() returns trigger language plpgsql as $$
begin
  if new.status = 'aprovado' and new.aprovado_em is null then new.aprovado_em := current_date; end if;
  if new.status = 'enviado' and new.enviado_em is null then new.enviado_em := current_date; end if;
  if new.status = 'recebido' and new.recebido_em is null then new.recebido_em := current_date; end if;
  if new.status = 'publicado' and new.publicado_em is null then new.publicado_em := current_date; end if;
  if new.status = 'vendeu' and new.primeira_venda_em is null then new.primeira_venda_em := current_date; end if;
  new.atualizado_em := now();
  return new;
end $$;
drop trigger if exists affiliate_amostra_datas on public.affiliate_amostra;
create trigger affiliate_amostra_datas before insert or update on public.affiliate_amostra
  for each row execute function public.affiliate_amostra_datas();

-- ---------------------------------------------------------------------------------------------
-- 3) Outreach (cap. 8.8): campanha de convite com critérios, e os convites
create table if not exists public.affiliate_outreach_campanha (
  id                uuid primary key default gen_random_uuid(),
  nome              text not null,
  sku               text,
  comissao_pct      numeric check (comissao_pct is null or comissao_pct between 0 and 100),
  creator_score_min int check (creator_score_min is null or creator_score_min between 0 and 100),
  product_fit_min   int check (product_fit_min is null or product_fit_min between 0 and 100),
  seguidores_min    int,
  gmv_min           numeric,
  nicho             text,
  com_amostra       boolean not null default false,
  prazo             date,
  mensagem          text,
  objetivo          text,
  status            text not null default 'rascunho' check (status in ('rascunho','ativa','encerrada')),
  criado_em         timestamptz not null default now(),
  criado_por        text not null
);
create table if not exists public.affiliate_convite (
  id           uuid primary key default gen_random_uuid(),
  campanha_id  uuid not null references public.affiliate_outreach_campanha(id) on delete cascade,
  creator_id   uuid not null references public.affiliate_creator(id) on delete cascade,
  status       text not null default 'sugerido' check (status in ('sugerido','convidado','aceitou','recusou','sem_resposta')),
  atualizado_em timestamptz not null default now(),
  atualizado_por text not null,
  unique (campanha_id, creator_id)
);

-- ---------------------------------------------------------------------------------------------
-- 4) Auditoria (só inserção) de creators, amostras, campanhas e convites
create table if not exists public.affiliate_auditoria (
  id       bigint generated always as identity primary key,
  tabela   text not null,
  acao     text not null,
  registro uuid,
  antes    jsonb,
  depois   jsonb,
  quando   timestamptz not null default now()
);
create or replace function public.affiliate_audita() returns trigger language plpgsql as $$
begin
  insert into public.affiliate_auditoria (tabela, acao, registro, antes, depois)
  values (tg_table_name, tg_op, (case when tg_op = 'DELETE' then old.id else new.id end),
          case when tg_op = 'INSERT' then null else to_jsonb(old) end,
          case when tg_op = 'DELETE' then null else to_jsonb(new) end);
  return coalesce(new, old);
end $$;
do $$
declare t text;
begin
  foreach t in array array['affiliate_creator','affiliate_amostra','affiliate_outreach_campanha','affiliate_convite'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_audita', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.affiliate_audita()', t || '_audita', t);
  end loop;
end $$;
create or replace function public.affiliate_auditoria_imutavel() returns trigger language plpgsql as $$
begin raise exception 'affiliate_auditoria é só inserção'; end $$;
drop trigger if exists affiliate_auditoria_imutavel on public.affiliate_auditoria;
create trigger affiliate_auditoria_imutavel before update or delete on public.affiliate_auditoria
  for each row execute function public.affiliate_auditoria_imutavel();

-- ---------------------------------------------------------------------------------------------
-- 5) Qualidade do cliente por cupom (cap. 8.14): quem entrou pelo cupom, se era novo, se recomprou e o LTV.
-- [HIPÓTESE] stg_shopify_orders_item.order_discount_code é o cupom do pedido e dim_cliente.cliente_id é o id
-- do cliente no Shopify. Uma linha por cupom; sem dado pessoal.
create materialized view if not exists public.mv_cupom_cliente_qualidade as
with uso as (
  select upper(trim(s.order_discount_code)) as cupom,
         d.cliente_chave,
         min(s.order_created_at::timestamptz)::date as primeiro_uso
  from public.stg_shopify_orders_item s
  join public.dim_cliente d
    on s.order_customer_id in (d.cliente_id::text, 'gid://shopify/Customer/' || d.cliente_id::text)
  where coalesce(trim(s.order_discount_code), '') <> ''
  group by 1, 2
)
select u.cupom,
       count(*)::int                                                               as clientes,
       count(*) filter (where p.primeira_compra::date >= u.primeiro_uso)::int      as clientes_novos,
       count(*) filter (where p.pedidos >= 2 and p.ultima_compra::date > u.primeiro_uso)::int as recompraram,
       avg(p.valor_total)                                                          as ltv_medio,
       avg(p.pedidos)                                                              as pedidos_medio,
       now()                                                                       as gerado_em
from uso u
join public.mv_growth_cliente_perfil p on p.cliente_chave = u.cliente_chave
group by u.cupom;
create unique index if not exists mv_cupom_cliente_qualidade_cupom on public.mv_cupom_cliente_qualidade (cupom);

create or replace function public.affiliate_atualiza_qualidade_cupom() returns void
language sql security definer set search_path = public as $$
  refresh materialized view concurrently public.mv_cupom_cliente_qualidade;
$$;

-- ---------------------------------------------------------------------------------------------
-- 6) Acesso: só o servidor (service role)
alter table public.affiliate_creator           enable row level security;
alter table public.affiliate_creator_estagio   enable row level security;
alter table public.affiliate_amostra           enable row level security;
alter table public.affiliate_outreach_campanha enable row level security;
alter table public.affiliate_convite           enable row level security;
alter table public.affiliate_auditoria         enable row level security;
revoke all on public.affiliate_creator, public.affiliate_creator_estagio, public.affiliate_amostra,
              public.affiliate_outreach_campanha, public.affiliate_convite, public.affiliate_auditoria,
              public.mv_cupom_cliente_qualidade from anon, authenticated;
revoke all on function public.affiliate_atualiza_qualidade_cupom() from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- 7) (Opcional) Atualizar a qualidade por cupom todo dia, depois do atualiza_growth_mv
-- select cron.schedule('affiliate-qualidade-cupom', '40 7 * * *', $$ select public.affiliate_atualiza_qualidade_cupom(); $$);
--
-- Exemplo: cadastrar um creator e uma amostra
-- with c as (insert into public.affiliate_creator (nome, tiktok_username, cupom, nicho, tier, estagio, origem, criado_por)
--            values ('Creator Exemplo', 'creator.exemplo', 'EXEMPLO10', 'fitness', 'micro', 'aceitou', 'tiktok', 'malu@soldiersnutrition.com.br')
--            returning id)
-- insert into public.affiliate_amostra (creator_id, sku, produto, status, custo_produto, frete, atualizado_por)
-- select id, 'CREA300', 'Creatina 300g', 'enviado', 45, 18, 'malu@soldiersnutrition.com.br' from c;
