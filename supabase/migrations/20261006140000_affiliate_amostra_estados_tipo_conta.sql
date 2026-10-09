-- Soldiers Platform — Affiliate OS, onda 1 do benchmark Cruva (benchmarks/cruva/ANALISE.md §10.4).
-- 1) Amostras: estados de encerramento que o TikTok Shop usa além de "cancelado" (rejeitado, expirado, ignorado),
--    com a data em que a amostra saiu do fluxo. "Atrasado" e "para revisar" não são estados: a tela calcula.
-- 2) Creator: tipo de conta informado à mão (creator, loja, agência). Vence a regra automática da tela, que marca como
--    "provável conta de loja" quem vende muito sem audiência própria.
-- Depende de 20261005140000_affiliate_os.sql. Pode rodar mais de uma vez.

alter table public.affiliate_amostra drop constraint if exists affiliate_amostra_status_check;
alter table public.affiliate_amostra add constraint affiliate_amostra_status_check check (status in (
  'solicitou','aprovado','aguardando_envio','enviado','recebido','conteudo_pendente','publicado','vendeu',
  'rejeitado','expirado','ignorado','cancelado'));
alter table public.affiliate_amostra add column if not exists encerrado_em date;

create or replace function public.affiliate_amostra_datas() returns trigger language plpgsql as $$
begin
  if new.status = 'aprovado' and new.aprovado_em is null then new.aprovado_em := current_date; end if;
  if new.status = 'enviado' and new.enviado_em is null then new.enviado_em := current_date; end if;
  if new.status = 'recebido' and new.recebido_em is null then new.recebido_em := current_date; end if;
  if new.status = 'publicado' and new.publicado_em is null then new.publicado_em := current_date; end if;
  if new.status = 'vendeu' and new.primeira_venda_em is null then new.primeira_venda_em := current_date; end if;
  if new.status in ('rejeitado','expirado','ignorado','cancelado') and new.encerrado_em is null then
    new.encerrado_em := current_date;
  end if;
  new.atualizado_em := now();
  return new;
end $$;

alter table public.affiliate_creator add column if not exists tipo_conta text
  check (tipo_conta is null or tipo_conta in ('creator','loja','agencia'));
comment on column public.affiliate_creator.tipo_conta is
  'Informado à mão. Vazio = a tela usa a regra automática (vende muito com pouca audiência = provável conta de loja).';
