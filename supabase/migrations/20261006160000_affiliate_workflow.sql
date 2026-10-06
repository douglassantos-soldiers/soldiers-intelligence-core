-- Soldiers Platform — Affiliate OS, onda 3 do benchmark Cruva (benchmarks/cruva/ANALISE.md §10.2).
-- Workflows de relacionamento com creators: só a DEFINIÇÃO, versionada e só inserção. Mudar um workflow = inserir
-- nova versão; desligar = inserir versão com ativo = false. A tela simula "quem dispararia hoje" pelo gatilho.
-- Nada aqui executa: o motor (espera, envio, mudança de estado) entra na Fase 3 com Policy + Approval + Audit, e toda
-- ação já é tratada como "com aprovação" pela tela, mesmo que o cadastro diga o contrário.
-- Sem nenhuma linha, valem os 6 modelos do código (chaves: outreach_lista, amostra_ate_post, amostra_ate_venda,
-- oferta_por_contribuicao, outro_produto, primeira_venda_vip); a mesma chave aqui substitui o modelo.
-- Pode rodar mais de uma vez. Sem dado pessoal.

create table if not exists public.affiliate_workflow (
  id             bigint generated always as identity primary key,
  chave          text not null check (chave ~ '^[a-z0-9_]{3,60}$'),
  nome           text not null check (length(trim(nome)) between 2 and 80),
  versao         int not null check (versao >= 1),
  vigente_desde  date not null,
  gatilho        text not null check (gatilho in ('lista_outreach','amostra_enviada','amostra_publicada',
                                                  'contribuicao_diaria','venda_categoria','primeira_venda')),
  -- [{"tipo":"gatilho|condicao|espera|acao","texto":"..."}], na ordem
  passos         jsonb not null check (jsonb_typeof(passos) = 'array' and jsonb_array_length(passos) between 1 and 20),
  ativo          boolean not null default true,
  observacao     text,
  criado_por     text not null default current_user,
  criado_em      timestamptz not null default now(),
  unique (chave, versao)
);

create or replace function public.affiliate_workflow_so_insercao() returns trigger
language plpgsql as $$
begin
  raise exception 'affiliate_workflow é só inserção: grave uma nova versão para mudar ou desligar';
end $$;
drop trigger if exists affiliate_workflow_so_insercao on public.affiliate_workflow;
create trigger affiliate_workflow_so_insercao before update or delete on public.affiliate_workflow
  for each row execute function public.affiliate_workflow_so_insercao();

alter table public.affiliate_workflow enable row level security;
revoke all on public.affiliate_workflow from anon, authenticated;

-- Exemplo (SQL editor): desligar o modelo "Outro produto"
-- insert into public.affiliate_workflow (chave, nome, versao, vigente_desde, gatilho, passos, ativo, criado_por)
-- values ('outro_produto', 'Outro produto', 1, current_date, 'venda_categoria',
--         '[{"tipo":"gatilho","texto":"Vendeu R$ 500+ numa categoria"},{"tipo":"acao","texto":"Convite e amostra"}]',
--         false, 'malu');
