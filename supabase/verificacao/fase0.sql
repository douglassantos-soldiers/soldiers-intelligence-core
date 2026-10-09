-- Fase 0 — conferência do banco. SOMENTE LEITURA. Rodar no SQL editor do Supabase, bloco por bloco.

-- 1) Migrations do repositório: aplicada ou pendente?
with esperadas(versao, nome) as (values
  ('20261003120000', 'meta_criativos_em_massa'),
  ('20261005120000', 'crm_estado_e_consentimento'),
  ('20261005130000', 'experimentos'),
  ('20261005140000', 'affiliate_os'),
  ('20261005150000', 'affiliate_mv_refresh_timeout'),
  ('20261005151000', 'criativo_cliente'),
  ('20261005160000', 'conteudo_etiqueta'),
  ('20261006120000', 'conteudo_etiqueta_dimensoes'),
  ('20261006130000', 'affiliate_fechamento_planilha'),
  ('20261006140000', 'affiliate_amostra_estados_tipo_conta'),
  ('20261006150000', 'affiliate_onda2'),
  ('20261006160000', 'affiliate_workflow'),
  ('20261006170000', 'criativo_cliente_refresh_timeout'),
  ('20261007120000', 'mv_criativo_e_cupom_join_rapido'),
  ('20261007130000', 'amazon_dsp'))
select e.versao, e.nome,
       case when m.version is null then 'PENDENTE' else 'aplicada' end as situacao
  from esperadas e
  left join supabase_migrations.schema_migrations m on m.version = e.versao
 order by e.versao;

-- 2) Os objetos de cada migration existem? (cobre o caso de migration marcada com "repair" sem ter rodado)
select objeto, to_regclass('public.' || objeto) is not null as existe
  from (values
    ('meta_criativo_lote'), ('meta_criativo_auditoria'),
    ('crm_estado_dia'), ('cliente_consentimento'),
    ('experimento'), ('experimento_auditoria'),
    ('affiliate_creator'), ('affiliate_amostra'), ('mv_cupom_cliente_qualidade'),
    ('mv_criativo_cliente'),
    ('conteudo_etiqueta'), ('vw_conteudo_etiqueta_atual'),
    ('affiliate_fechamento_planilha'),
    ('affiliate_regra_comissao'), ('affiliate_direito_uso'),
    ('affiliate_workflow'),
    ('fact_amazon_dsp_dia'), ('vw_amazon_dsp_dia')
  ) as t(objeto)
 order by 1;

-- 3) Views materializadas do repositório: preenchidas?
select matviewname, ispopulated
  from pg_matviews
 where schemaname = 'public'
   and matviewname in ('mv_criativo_cliente', 'mv_cupom_cliente_qualidade')
 order by 1;

-- 4) Agendamentos ativos (sem o comando, que pode ter token)
select jobname, schedule, active from cron.job order by jobname;

-- 5) Agendamentos que falharam nos últimos 7 dias
select j.jobname, count(*) as falhas, max(d.start_time) as ultima_falha,
       left(max(d.return_message), 200) as mensagem
  from cron.job_run_details d
  join cron.job j on j.jobid = d.jobid
 where d.status = 'failed' and d.start_time >= now() - interval '7 days'
 group by j.jobname
 order by falhas desc;
