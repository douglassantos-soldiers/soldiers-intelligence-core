-- Soldiers Platform — Affiliate OS, onda 2 do benchmark Cruva (benchmarks/cruva/ANALISE.md §10).
-- 1) Regra de comissão por faixas de contribuição, versionada e só inserção: mudar a regra = inserir nova versão.
--    A tela usa a de maior vigente_desde até hoje (empate: maior versão). Sem nenhuma linha, vale a regra padrão do
--    código (5% base, 7% ≥ R$ 1 mil e 9% ≥ R$ 3 mil de contribuição em 30 dias), marcada como hipótese.
-- 2) Direitos de uso de vídeo de creator (Spark Ads no TikTok, anúncio de parceria no Meta), com histórico de status.
--    O código Spark NUNCA é guardado aqui: só se ele foi recebido (tem_codigo).
-- Só cadastro e leitura: nada aqui muda comissão, pede código ou paga creator. Depende de 20261005140000_affiliate_os.sql.
-- Pode rodar mais de uma vez. LGPD: creator só por id do cadastro; sem dado pessoal.

-- ---------------------------------------------------------------------------------------------
-- 1) Regra de comissão
create table if not exists public.affiliate_regra_comissao (
  id             bigint generated always as identity primary key,
  nome           text not null check (length(trim(nome)) between 2 and 80),
  versao         int not null check (versao >= 1),
  vigente_desde  date not null,
  canal          text not null default 'tiktok_shop' check (canal in ('tiktok_shop')),
  base           text not null default 'contribuicao' check (base in ('contribuicao','gmv')),
  janela_dias    int not null default 30 check (janela_dias between 7 and 90),
  -- [{"de": 0, "comissao_pct": 5}, {"de": 1000, "comissao_pct": 7}, ...]; a primeira faixa começa em 0.
  faixas         jsonb not null check (jsonb_typeof(faixas) = 'array' and jsonb_array_length(faixas) between 1 and 10),
  observacao     text,
  criado_por     text not null default current_user,
  criado_em      timestamptz not null default now(),
  unique (nome, versao)
);

create or replace function public.affiliate_regra_comissao_so_insercao() returns trigger
language plpgsql as $$
begin
  raise exception 'affiliate_regra_comissao é só inserção: grave uma nova versão para mudar a regra';
end $$;
drop trigger if exists affiliate_regra_comissao_so_insercao on public.affiliate_regra_comissao;
create trigger affiliate_regra_comissao_so_insercao before update or delete on public.affiliate_regra_comissao
  for each row execute function public.affiliate_regra_comissao_so_insercao();

-- ---------------------------------------------------------------------------------------------
-- 2) Direitos de uso
create table if not exists public.affiliate_direito_uso (
  id              uuid primary key default gen_random_uuid(),
  creator_id      uuid not null references public.affiliate_creator(id) on delete restrict,
  video_id        text not null check (length(trim(video_id)) > 0),
  plataforma      text not null check (plataforma in ('tiktok_spark','meta_partnership')),
  status          text not null default 'solicitado' check (status in (
                    'solicitado','ativo','pagamento_pendente','expirado','rejeitado','cancelado')),
  valor           numeric(12,2) not null default 0 check (valor >= 0),
  inicio          date,
  fim             date,
  tem_codigo      boolean not null default false,
  observacao      text,
  criado_em       timestamptz not null default now(),
  criado_por      text not null,
  atualizado_em   timestamptz not null default now(),
  atualizado_por  text not null,
  check (fim is null or inicio is null or fim >= inicio)
);
comment on column public.affiliate_direito_uso.tem_codigo is
  'Só indica se o código de autorização foi recebido. O código em si fica no gerenciador de anúncios, nunca aqui.';
-- Um pedido em andamento por vídeo e plataforma (histórico de expirados/cancelados fica).
create unique index if not exists affiliate_direito_uso_em_andamento on public.affiliate_direito_uso (plataforma, video_id)
  where status in ('solicitado','ativo','pagamento_pendente');
create index if not exists affiliate_direito_uso_creator on public.affiliate_direito_uso (creator_id);

-- Histórico de status (como affiliate_creator_estagio), preenchido por gatilho.
create table if not exists public.affiliate_direito_uso_status (
  id          bigint generated always as identity primary key,
  direito_id  uuid not null references public.affiliate_direito_uso(id) on delete restrict,
  de          text,
  para        text not null,
  quando      timestamptz not null default now(),
  por         text
);
create or replace function public.affiliate_direito_uso_registra() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then new.atualizado_em := now(); end if;
  return new;
end $$;
drop trigger if exists affiliate_direito_uso_atualizado on public.affiliate_direito_uso;
create trigger affiliate_direito_uso_atualizado before update on public.affiliate_direito_uso
  for each row execute function public.affiliate_direito_uso_registra();

create or replace function public.affiliate_direito_uso_registra_status() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.affiliate_direito_uso_status (direito_id, de, para, por)
    values (new.id, case when tg_op = 'INSERT' then null else old.status end, new.status,
            coalesce(new.atualizado_por, new.criado_por));
  end if;
  return new;
end $$;
drop trigger if exists affiliate_direito_uso_registra_status on public.affiliate_direito_uso;
create trigger affiliate_direito_uso_registra_status after insert or update on public.affiliate_direito_uso
  for each row execute function public.affiliate_direito_uso_registra_status();

-- Histórico de status também é só inserção; apagar um direito não é permitido (cancelar = mudar o status).
create or replace function public.affiliate_direito_uso_status_imutavel() returns trigger language plpgsql as $$
begin raise exception 'affiliate_direito_uso_status é só inserção'; end $$;
drop trigger if exists affiliate_direito_uso_status_imutavel on public.affiliate_direito_uso_status;
create trigger affiliate_direito_uso_status_imutavel before update or delete on public.affiliate_direito_uso_status
  for each row execute function public.affiliate_direito_uso_status_imutavel();
create or replace function public.affiliate_direito_uso_sem_delete() returns trigger language plpgsql as $$
begin raise exception 'affiliate_direito_uso não se apaga: mude o status para cancelado'; end $$;
drop trigger if exists affiliate_direito_uso_sem_delete on public.affiliate_direito_uso;
create trigger affiliate_direito_uso_sem_delete before delete on public.affiliate_direito_uso
  for each row execute function public.affiliate_direito_uso_sem_delete();

-- Auditoria completa (antes/depois) na affiliate_auditoria da migração 20261005140000.
drop trigger if exists affiliate_direito_uso_audita on public.affiliate_direito_uso;
create trigger affiliate_direito_uso_audita after insert or update or delete on public.affiliate_direito_uso
  for each row execute function public.affiliate_audita();

-- ---------------------------------------------------------------------------------------------
-- 3) Acesso: só o servidor (service role)
alter table public.affiliate_regra_comissao     enable row level security;
alter table public.affiliate_direito_uso        enable row level security;
alter table public.affiliate_direito_uso_status enable row level security;
revoke all on public.affiliate_regra_comissao, public.affiliate_direito_uso, public.affiliate_direito_uso_status
  from anon, authenticated;

-- Exemplos (SQL editor):
-- insert into public.affiliate_regra_comissao (nome, versao, vigente_desde, base, janela_dias, faixas, criado_por)
-- values ('Faixas TikTok Shop', 1, '2026-11-01', 'contribuicao', 30,
--         '[{"de":0,"comissao_pct":5},{"de":1000,"comissao_pct":7},{"de":3000,"comissao_pct":9}]', 'malu');
-- insert into public.affiliate_direito_uso (creator_id, video_id, plataforma, status, valor, inicio, fim, tem_codigo, criado_por, atualizado_por)
-- values ('<id do creator>', '<id do vídeo>', 'tiktok_spark', 'ativo', 300, '2026-10-01', '2026-10-31', true, 'malu', 'malu');
