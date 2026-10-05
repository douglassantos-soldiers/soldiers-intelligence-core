-- Soldiers Platform — Central de criativos: criativo → cliente → LTV (Plano Mestre cap. 7.5).
-- Liga o pedido do site ao anúncio do Meta pelo utm_content da última visita e, pelo cliente, ao LTV.
-- Uma linha por anúncio; sem dado pessoal. Não altera nenhuma tabela existente.
--
-- [HIPÓTESE] Os anúncios do Meta usam utm_content = {{ad.id}} ou {{ad.name}} (o que estiver nos links).
-- [HIPÓTESE] dim_cliente.cliente_id é o id do cliente no Shopify.
-- Pedido sem utm_content que case com um anúncio não entra (fica como "sem anúncio identificado").

create materialized view if not exists public.mv_criativo_cliente as
with pedidos as (
  select distinct on (s.order_id)
         s.order_id,
         s.order_created_at::timestamptz::date              as data,
         nullif(trim(s.order_customer_last_visit_utm_content), '') as utm_content,
         s.order_customer_id,
         s.order_total_price::numeric                         as receita
  from public.stg_shopify_orders_item s
  where s.order_cancelled_at is null
    and coalesce(trim(s.order_customer_last_visit_utm_content), '') <> ''
  order by s.order_id, s._loaded_at desc nulls last
), anuncios as (
  select distinct ad_id, ad_name from public.dim_meta_anuncio where ad_id is not null
), ligados as (
  select p.*, a.ad_id
  from pedidos p
  join anuncios a on p.utm_content = a.ad_id or lower(p.utm_content) = lower(a.ad_name)
), com_cliente as (
  select l.*, d.cliente_chave
  from ligados l
  left join public.dim_cliente d
    on l.order_customer_id in (d.cliente_id::text, 'gid://shopify/Customer/' || d.cliente_id::text)
)
select c.ad_id,
       count(distinct c.order_id)::int                                                     as pedidos,
       sum(c.receita)                                                                      as receita,
       count(distinct c.cliente_chave)::int                                                as clientes,
       count(distinct c.cliente_chave) filter (where p.primeira_compra::date = c.data)::int as clientes_novos,
       count(distinct c.cliente_chave) filter (where p.primeira_compra::date = c.data and p.pedidos >= 2)::int as novos_que_recompraram,
       avg(p.valor_total) filter (where p.primeira_compra::date = c.data)                  as ltv_medio_novos,
       min(c.data)                                                                         as primeiro_pedido,
       max(c.data)                                                                         as ultimo_pedido,
       now()                                                                               as gerado_em
from com_cliente c
left join public.mv_growth_cliente_perfil p on p.cliente_chave = c.cliente_chave
group by c.ad_id;
create unique index if not exists mv_criativo_cliente_ad on public.mv_criativo_cliente (ad_id);

create or replace function public.criativo_atualiza_cliente() returns void
language sql security definer set search_path = public as $$
  refresh materialized view concurrently public.mv_criativo_cliente;
$$;

revoke all on public.mv_criativo_cliente from anon, authenticated;
revoke all on function public.criativo_atualiza_cliente() from public, anon, authenticated;

-- (Opcional) Atualizar todo dia depois do atualiza_growth_mv:
-- select cron.schedule('criativo-cliente', '45 7 * * *', $$ select public.criativo_atualiza_cliente(); $$);
