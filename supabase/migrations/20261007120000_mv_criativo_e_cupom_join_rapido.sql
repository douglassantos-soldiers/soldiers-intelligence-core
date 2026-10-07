-- Soldiers Platform — refresh rápido de mv_criativo_cliente e mv_cupom_cliente_qualidade.
--
-- Por que o refresh passava de 1 hora:
--   1) o join do pedido com o anúncio era "utm_content = ad_id OR lower(utm_content) = lower(ad_name)".
--      Um OR no join impede hash join: o Postgres compara cada pedido com cada anúncio (laço aninhado);
--   2) o join com o cliente era "order_customer_id in (cliente_id::text, 'gid://shopify/Customer/' || cliente_id)".
--      O cast e a concatenação do lado da dim_cliente têm o mesmo efeito (pedido × cliente).
-- Correção: normalizar as chaves uma vez (tirar o prefixo gid do id do cliente; anúncio por id OU por nome em
-- dois left joins de igualdade) e juntar só por igualdade, o que permite hash join.
--
-- Mudança de regra (para não contar a mesma receita duas vezes): se o utm_content bate com o NOME de mais de um
-- anúncio, o pedido vai para o menor ad_id com esse nome. Antes, ia para todos os anúncios com o mesmo nome.
--
-- Também:
--   - set_config('statement_timeout', ...) dentro da função não muda o tempo limite do comando que já está
--     rodando: o limite que vale é o da sessão quando o comando começou. Por isso o cron agora faz
--     "SET statement_timeout TO 0;" antes de chamar a função;
--   - sai o job "a cada minuto" de carga inicial: se a função falhasse, ele nunca se desagendava e empilhava
--     refresh. A carga inicial é manual (ver o fim do arquivo).
--
-- As duas MVs são recriadas WITH NO DATA (MV não aceita "create or replace"); a tela já trata MV vazia.
-- Depende de 20261005140000_affiliate_os.sql e 20261005151000_criativo_cliente.sql. Pode rodar mais de uma vez.

-- ---------------------------------------------------------------------------------------------
-- 1) Criativo → cliente → LTV
drop materialized view if exists public.mv_criativo_cliente;

create materialized view public.mv_criativo_cliente as
with pedidos as (
  select distinct on (s.order_id)
         s.order_id,
         s.order_created_at::timestamptz::date                                  as data,
         trim(s.order_customer_last_visit_utm_content)                           as utm_content,
         regexp_replace(coalesce(s.order_customer_id, ''), '^gid://shopify/Customer/', '') as customer_id,
         s.order_total_price::numeric                                            as receita
  from public.stg_shopify_orders_item s
  where s.order_cancelled_at is null
    and coalesce(trim(s.order_customer_last_visit_utm_content), '') <> ''
  order by s.order_id, s._loaded_at desc nulls last
), anuncio_id as (
  select distinct ad_id::text as ad_id from public.dim_meta_anuncio where ad_id is not null
), anuncio_nome as (
  select lower(ad_name) as nome, min(ad_id::text) as ad_id
  from public.dim_meta_anuncio
  where ad_id is not null and coalesce(trim(ad_name), '') <> ''
  group by 1
), ligados as (
  select p.order_id, p.data, p.customer_id, p.receita, coalesce(i.ad_id, n.ad_id) as ad_id
  from pedidos p
  left join anuncio_id i on i.ad_id = p.utm_content
  left join anuncio_nome n on n.nome = lower(p.utm_content)
  where coalesce(i.ad_id, n.ad_id) is not null
), clientes as (
  select cliente_id::text as customer_id, cliente_chave from public.dim_cliente where cliente_id is not null
), com_cliente as (
  select l.*, d.cliente_chave
  from ligados l
  left join clientes d on d.customer_id = l.customer_id
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
group by c.ad_id
with no data;

create unique index if not exists mv_criativo_cliente_ad on public.mv_criativo_cliente (ad_id);
revoke all on public.mv_criativo_cliente from anon, authenticated;

create or replace function public.criativo_atualiza_cliente() returns void
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from pg_matviews where schemaname = 'public' and matviewname = 'mv_criativo_cliente' and ispopulated) then
    refresh materialized view concurrently public.mv_criativo_cliente;
  else
    refresh materialized view public.mv_criativo_cliente;  -- 1ª carga: concurrently exige MV populada
  end if;
end;
$$;
revoke all on function public.criativo_atualiza_cliente() from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- 2) Qualidade do cliente por cupom (mesmo problema no join com o cliente)
drop materialized view if exists public.mv_cupom_cliente_qualidade;

create materialized view public.mv_cupom_cliente_qualidade as
with uso as (
  select upper(trim(s.order_discount_code))                                               as cupom,
         regexp_replace(coalesce(s.order_customer_id, ''), '^gid://shopify/Customer/', '') as customer_id,
         min(s.order_created_at::timestamptz)::date                                        as primeiro_uso
  from public.stg_shopify_orders_item s
  where coalesce(trim(s.order_discount_code), '') <> ''
  group by 1, 2
), clientes as (
  select cliente_id::text as customer_id, cliente_chave from public.dim_cliente where cliente_id is not null
), uso_cliente as (
  -- Um cliente pode aparecer com o id puro e com o gid: depois de normalizar, junta os dois.
  select u.cupom, d.cliente_chave, min(u.primeiro_uso) as primeiro_uso
  from uso u
  join clientes d on d.customer_id = u.customer_id
  group by 1, 2
)
select u.cupom,
       count(*)::int                                                               as clientes,
       count(*) filter (where p.primeira_compra::date >= u.primeiro_uso)::int      as clientes_novos,
       count(*) filter (where p.pedidos >= 2 and p.ultima_compra::date > u.primeiro_uso)::int as recompraram,
       avg(p.valor_total)                                                          as ltv_medio,
       avg(p.pedidos)                                                              as pedidos_medio,
       now()                                                                       as gerado_em
from uso_cliente u
join public.mv_growth_cliente_perfil p on p.cliente_chave = u.cliente_chave
group by u.cupom
with no data;

create unique index if not exists mv_cupom_cliente_qualidade_cupom on public.mv_cupom_cliente_qualidade (cupom);
revoke all on public.mv_cupom_cliente_qualidade from anon, authenticated;

create or replace function public.affiliate_atualiza_qualidade_cupom() returns void
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from pg_matviews where schemaname = 'public' and matviewname = 'mv_cupom_cliente_qualidade' and ispopulated) then
    refresh materialized view concurrently public.mv_cupom_cliente_qualidade;
  else
    refresh materialized view public.mv_cupom_cliente_qualidade;
  end if;
end;
$$;
revoke all on function public.affiliate_atualiza_qualidade_cupom() from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- 3) Agenda diária, sem job de carga inicial a cada minuto
select cron.unschedule(jobid)
  from cron.job
 where jobname in ('criativo-cliente', 'criativo-cliente-init', 'criativo-cliente-once', 'affiliate-qualidade-cupom');

select cron.schedule('criativo-cliente', '45 7 * * *',
  $$SET statement_timeout TO 0; SELECT public.criativo_atualiza_cliente();$$);
select cron.schedule('affiliate-qualidade-cupom', '40 7 * * *',
  $$SET statement_timeout TO 0; SELECT public.affiliate_atualiza_qualidade_cupom();$$);

-- ---------------------------------------------------------------------------------------------
-- Carga inicial (manual, uma vez, no SQL editor do Supabase), depois de aplicar:
--   set statement_timeout = 0;
--   select public.affiliate_atualiza_qualidade_cupom();
--   select public.criativo_atualiza_cliente();
--   select matviewname, ispopulated from pg_matviews where matviewname in ('mv_criativo_cliente','mv_cupom_cliente_qualidade');
-- Se ainda demorar, o próximo suspeito é o "distinct on (order_id)" sobre stg_shopify_orders_item inteira:
--   explain (analyze, buffers) da consulta da MV mostra onde está o tempo.
