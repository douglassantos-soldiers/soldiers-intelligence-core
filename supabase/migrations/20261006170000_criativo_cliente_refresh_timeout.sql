-- Fill da mv_criativo_cliente: timeout na função e no cron (sem empilhar a cada minuto).
-- A MV já existe; isto só corrige o refresh (timeout ~2 min cancelava o fill).

create or replace function public.criativo_atualiza_cliente() returns void
language plpgsql security definer set search_path = public
set statement_timeout to 0
as $$
begin
  begin
    refresh materialized view concurrently public.mv_criativo_cliente;
  exception when others then
    refresh materialized view public.mv_criativo_cliente;
  end;
end;
$$;

revoke all on function public.criativo_atualiza_cliente() from public, anon, authenticated;

select cron.unschedule(jobid)
  from cron.job
 where jobname in ('criativo-cliente-init', 'criativo-cliente-once');

select cron.unschedule(jobid) from cron.job where jobname = 'criativo-cliente';
select cron.schedule(
  'criativo-cliente',
  '45 7 * * *',
  $$SET statement_timeout TO 0; SELECT public.criativo_atualiza_cliente();$$
);
