-- Affiliate OS: o refresh da mv_cupom_cliente_qualidade estoura o statement_timeout padrão do cron.
-- Desliga o timeout na sessão da função; se CONCURRENTLY falhar (ex.: 1ª carga), faz refresh normal.
create or replace function public.affiliate_atualiza_qualidade_cupom() returns void
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('statement_timeout', '0', true);
  begin
    refresh materialized view concurrently public.mv_cupom_cliente_qualidade;
  exception when others then
    refresh materialized view public.mv_cupom_cliente_qualidade;
  end;
end;
$$;
revoke all on function public.affiliate_atualiza_qualidade_cupom() from public, anon, authenticated;
