-- Soldiers Platform — Motor de experimentos (Plano Mestre cap. 16).
-- Todo experimento registra: hipótese, grupos (com controle), período, métrica, resultado, decisão e aprendizado.
-- A tela /intelligence lê estas tabelas e calcula lift, p-valor e amostra necessária. Nada aqui dispara campanha.
--
-- Aplicar no Supabase (SQL editor ou `supabase db push`). Não altera nenhuma tabela existente.
-- Ligação opcional com growth_acoes pelo id (texto), sem chave estrangeira para não depender do tipo da coluna.

create table if not exists public.experimento (
  id                uuid primary key default gen_random_uuid(),
  titulo            text not null check (length(titulo) between 3 and 160),
  hipotese          text not null check (length(hipotese) >= 10),
  area              text not null check (area in ('media','affiliate','crm','commerce')),
  metrica_principal text not null check (metrica_principal in ('conversao','receita','margem','recompra')),
  inicio            date not null,
  fim               date,
  status            text not null default 'planejado' check (status in ('planejado','rodando','encerrado','cancelado')),
  growth_acao_id    text,                       -- growth_acoes.id, quando o experimento nasce de uma ação
  decisao           text check (decisao is null or decisao in ('adotar','descartar','repetir','sem decisao')),
  aprendizado       text,
  criado_por        text not null,
  criado_em         timestamptz not null default now(),
  alterado_por      text,
  alterado_em       timestamptz,
  check (fim is null or fim >= inicio),
  check (status <> 'encerrado' or fim is not null)
);

create table if not exists public.experimento_grupo (
  id              bigint generated always as identity primary key,
  experimento_id  uuid not null references public.experimento(id) on delete cascade,
  grupo           text not null check (grupo in ('controle','tratamento','tratamento_b','tratamento_c')),
  descricao       text not null,               -- o que este grupo recebeu (ex.: "e-mail com 10% off")
  participantes   int not null default 0 check (participantes >= 0),
  convertidos     int not null default 0 check (convertidos >= 0),
  receita         numeric not null default 0 check (receita >= 0),
  margem          numeric,
  atualizado_em   timestamptz not null default now(),
  unique (experimento_id, grupo),
  check (convertidos <= participantes)
);

-- Histórico de alterações (decisão, status, números dos grupos): só inserção.
create table if not exists public.experimento_auditoria (
  id             bigint generated always as identity primary key,
  experimento_id uuid not null,
  tabela         text not null,
  acao           text not null,
  antes          jsonb,
  depois         jsonb,
  quando         timestamptz not null default now()
);

create or replace function public.experimento_audita() returns trigger language plpgsql as $$
declare v_id uuid;
begin
  if tg_table_name = 'experimento' then
    v_id := case when tg_op = 'DELETE' then old.id else new.id end;
  else
    v_id := case when tg_op = 'DELETE' then old.experimento_id else new.experimento_id end;
  end if;
  insert into public.experimento_auditoria (experimento_id, tabela, acao, antes, depois)
  values (
    v_id, tg_table_name, tg_op,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

drop trigger if exists experimento_audita on public.experimento;
create trigger experimento_audita after insert or update or delete on public.experimento
  for each row execute function public.experimento_audita();
drop trigger if exists experimento_grupo_audita on public.experimento_grupo;
create trigger experimento_grupo_audita after insert or update or delete on public.experimento_grupo
  for each row execute function public.experimento_audita();

create or replace function public.experimento_auditoria_imutavel() returns trigger language plpgsql as $$
begin
  raise exception 'experimento_auditoria é só inserção';
end $$;
drop trigger if exists experimento_auditoria_imutavel on public.experimento_auditoria;
create trigger experimento_auditoria_imutavel before update or delete on public.experimento_auditoria
  for each row execute function public.experimento_auditoria_imutavel();

-- Acesso: só o servidor (service role).
alter table public.experimento            enable row level security;
alter table public.experimento_grupo      enable row level security;
alter table public.experimento_auditoria  enable row level security;
revoke all on public.experimento, public.experimento_grupo, public.experimento_auditoria from anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Exemplo de uso (rodar no SQL editor):
-- with e as (
--   insert into public.experimento (titulo, hipotese, area, metrica_principal, inicio, status, criado_por)
--   values ('Lembrete de reposição da creatina no dia 33',
--           'Lembrar 5 dias antes do ciclo aumenta a recompra em 90 dias',
--           'crm', 'recompra', current_date, 'rodando', 'malu@soldiersnutrition.com.br')
--   returning id)
-- insert into public.experimento_grupo (experimento_id, grupo, descricao)
-- select id, 'controle', 'sem lembrete' from e union all
-- select id, 'tratamento', 'e-mail de lembrete no dia 33' from e;
--
-- Ao fim, atualizar participantes/convertidos/receita de cada grupo e registrar decisão e aprendizado:
-- update public.experimento set status='encerrado', fim=current_date, decisao='adotar',
--   aprendizado='...', alterado_por='...', alterado_em=now() where id='...';
