-- Soldiers Platform — Fechamento de comissões: cópia da planilha "Vendas gerais" do mês, para a tela
-- /affiliate/fechamento conferir linha a linha se a plataforma bate com o que o time paga.
-- Só inserção: recarregar o mês = importar de novo; a tela usa a carga mais recente (carregado_em) de cada mês.
-- Sem dado pessoal: cupom, @ público do TikTok, % e valores.
--
-- Como carregar: Supabase → Table Editor → affiliate_fechamento_planilha → Insert → Import data from CSV,
-- com o arquivo fechamento_planilha_AAAA-MM.csv (mesmas colunas abaixo, sem carregado_em/carregado_por).

create table if not exists public.affiliate_fechamento_planilha (
  id                bigint generated always as identity primary key,
  competencia       date not null check (competencia = date_trunc('month', competencia)::date),
  registro          text,
  cupom             text not null,
  tiktok_username   text,
  comissao_pct      numeric(6,3),
  venda_cupom       numeric(14,2) not null default 0,
  venda_up          numeric(14,2) not null default 0,
  venda_considerada numeric(14,2) not null default 0,
  venda_tiktok      numeric(14,2) not null default 0,
  total             numeric(14,2) not null default 0,
  comissao          numeric(14,2) not null default 0,
  carregado_em      timestamptz not null default now(),
  carregado_por     text not null default current_user
);
create index if not exists affiliate_fechamento_planilha_mes
  on public.affiliate_fechamento_planilha (competencia, carregado_em desc);

create or replace function public.affiliate_fechamento_planilha_so_insercao() returns trigger
language plpgsql as $$
begin
  raise exception 'affiliate_fechamento_planilha é só inserção: importe o mês de novo para corrigir';
end;
$$;
drop trigger if exists affiliate_fechamento_planilha_so_insercao on public.affiliate_fechamento_planilha;
create trigger affiliate_fechamento_planilha_so_insercao
  before update or delete on public.affiliate_fechamento_planilha
  for each row execute function public.affiliate_fechamento_planilha_so_insercao();

-- Carga mais recente de cada mês: linhas importadas até 15 minutos antes da última linha do mês.
create or replace view public.vw_affiliate_fechamento_planilha_atual as
select p.*
from public.affiliate_fechamento_planilha p
join (
  select competencia, max(carregado_em) as ultima
  from public.affiliate_fechamento_planilha
  group by competencia
) u using (competencia)
where p.carregado_em >= u.ultima - interval '15 minutes';

alter table public.affiliate_fechamento_planilha enable row level security;
revoke all on public.affiliate_fechamento_planilha from anon, authenticated;
revoke all on public.vw_affiliate_fechamento_planilha_atual from anon, authenticated;
