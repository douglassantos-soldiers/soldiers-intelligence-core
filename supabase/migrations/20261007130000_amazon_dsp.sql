-- Soldiers Platform — Amazon DSP (mídia programática da Amazon).
-- Hoje o banco só tem Sponsored Products, Brands e Display. DSP é outra conta (entidade/anunciante DSP), outro acesso
-- e outro relatório da Amazon Ads API, então não vem pela coleta atual. Esta migration só cria o destino canônico:
--   fact_amazon_dsp_dia  — um registro por dia × pedido (order) × line item, com a origem preservada (fonte + payload).
--   amazon_dsp_grava_lote(fonte, linhas jsonb) — carga idempotente (reprocessar o mesmo dia substitui, não duplica).
--   vw_amazon_dsp_dia    — leitura da tela.
-- O carregador (conector Amazon DSP do Windsor.ai ou coletor próprio com o convite da conta DSP) chama a função com
-- as chaves canônicas abaixo; o mapeamento dos nomes da fonte fica no carregador, e o original vai em payload.
-- Receita = venda ATRIBUÍDA pela Amazon (não somar com a venda realizada do canal). Pode rodar mais de uma vez.
-- Sem dado pessoal. Escrita só pelo service role (carregador); a tela só lê.

create table if not exists public.fact_amazon_dsp_dia (
  data             date not null,
  advertiser_id    text not null default '',
  advertiser_name  text,
  order_id         text not null,
  order_name       text,
  line_item_id     text not null default '',
  line_item_name   text,
  line_item_type   text,
  status           text,
  investimento     numeric(14,2) not null default 0 check (investimento >= 0),
  impressoes       bigint not null default 0 check (impressoes >= 0),
  cliques          bigint not null default 0 check (cliques >= 0),
  dpv              bigint,           -- visualizações da página de detalhe
  add_to_cart      bigint,
  compras          bigint,
  unidades         bigint,
  receita          numeric(14,2),    -- vendas atribuídas pela Amazon
  ntb_compras      bigint,           -- compras de clientes novos para a marca
  ntb_receita      numeric(14,2),
  janela           text,             -- janela de atribuição informada pela fonte (ex.: '14d')
  moeda            text not null default 'BRL',
  fonte            text not null check (fonte in ('windsor', 'amazon_ads_api', 'manual')),
  payload          jsonb not null default '{}'::jsonb,
  carregado_em     timestamptz not null default now(),
  primary key (data, order_id, line_item_id)
);
comment on table public.fact_amazon_dsp_dia is
  'Amazon DSP por dia × order × line item. Receita é atribuída pela Amazon. Origem em fonte/payload.';

create index if not exists fact_amazon_dsp_dia_data on public.fact_amazon_dsp_dia (data);

-- Carga idempotente: substitui as linhas recebidas (mesma data/order/line item) e devolve quantas gravou.
create or replace function public.amazon_dsp_grava_lote(p_fonte text, p_linhas jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  if p_fonte not in ('windsor', 'amazon_ads_api', 'manual') then
    raise exception 'fonte inválida: %', p_fonte;
  end if;
  if jsonb_typeof(p_linhas) <> 'array' then
    raise exception 'p_linhas deve ser um array JSON';
  end if;

  insert into public.fact_amazon_dsp_dia as f (
    data, advertiser_id, advertiser_name, order_id, order_name, line_item_id, line_item_name, line_item_type, status,
    investimento, impressoes, cliques, dpv, add_to_cart, compras, unidades, receita, ntb_compras, ntb_receita,
    janela, moeda, fonte, payload, carregado_em)
  select
    (l->>'data')::date,
    coalesce(l->>'advertiser_id', ''),
    l->>'advertiser_name',
    l->>'order_id',
    l->>'order_name',
    coalesce(l->>'line_item_id', ''),
    l->>'line_item_name',
    l->>'line_item_type',
    l->>'status',
    coalesce((l->>'investimento')::numeric, 0),
    coalesce((l->>'impressoes')::numeric, 0)::bigint,
    coalesce((l->>'cliques')::numeric, 0)::bigint,
    (l->>'dpv')::numeric::bigint,
    (l->>'add_to_cart')::numeric::bigint,
    (l->>'compras')::numeric::bigint,
    (l->>'unidades')::numeric::bigint,
    (l->>'receita')::numeric,
    (l->>'ntb_compras')::numeric::bigint,
    (l->>'ntb_receita')::numeric,
    l->>'janela',
    coalesce(l->>'moeda', 'BRL'),
    p_fonte,
    coalesce(l->'payload', '{}'::jsonb),
    now()
  from jsonb_array_elements(p_linhas) as l
  where l->>'data' is not null and coalesce(l->>'order_id', '') <> ''
  on conflict (data, order_id, line_item_id) do update set
    advertiser_id = excluded.advertiser_id, advertiser_name = excluded.advertiser_name,
    order_name = excluded.order_name, line_item_name = excluded.line_item_name,
    line_item_type = excluded.line_item_type, status = excluded.status,
    investimento = excluded.investimento, impressoes = excluded.impressoes, cliques = excluded.cliques,
    dpv = excluded.dpv, add_to_cart = excluded.add_to_cart, compras = excluded.compras, unidades = excluded.unidades,
    receita = excluded.receita, ntb_compras = excluded.ntb_compras, ntb_receita = excluded.ntb_receita,
    janela = excluded.janela, moeda = excluded.moeda, fonte = excluded.fonte, payload = excluded.payload,
    carregado_em = excluded.carregado_em;
  get diagnostics n = row_count;
  return n;
end $$;

create or replace view public.vw_amazon_dsp_dia as
select data, advertiser_id, advertiser_name, order_id, order_name, line_item_id, line_item_name, line_item_type,
       status, investimento, impressoes, cliques, dpv, add_to_cart, compras, unidades, receita, ntb_compras,
       ntb_receita, janela, fonte, carregado_em
  from public.fact_amazon_dsp_dia;

alter table public.fact_amazon_dsp_dia enable row level security;
revoke all on public.fact_amazon_dsp_dia from anon, authenticated;
revoke all on public.vw_amazon_dsp_dia from anon, authenticated;
revoke all on function public.amazon_dsp_grava_lote(text, jsonb) from public, anon, authenticated;
grant select on public.fact_amazon_dsp_dia, public.vw_amazon_dsp_dia to service_role;
grant execute on function public.amazon_dsp_grava_lote(text, jsonb) to service_role;
