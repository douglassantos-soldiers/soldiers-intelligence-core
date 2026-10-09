-- Plano B do scripts/exportar-schema.ps1 (sem Docker) e exportação dos agendamentos do pg_cron.
-- SOMENTE LEITURA. Rodar no SQL editor do Supabase, uma consulta por vez, e baixar o resultado em CSV:
--   1) views.csv  2) views_materializadas.csv  3) funcoes.csv  4) cron_jobs.csv
-- Salvar os arquivos nesta pasta (supabase/schema/). Tokens JWT e "Bearer ..." saem trocados por <REMOVIDO>.

-- 1) Views do schema public
select c.relname as objeto,
       regexp_replace(regexp_replace(
         'create or replace view public.' || quote_ident(c.relname) || ' as' || chr(10) || pg_get_viewdef(c.oid, true),
         'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', '<JWT_REMOVIDO>', 'g'),
         '(Bearer\s+)[A-Za-z0-9_.-]{16,}', '\1<TOKEN_REMOVIDO>', 'g') as definicao
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'v'
 order by 1;

-- 2) Views materializadas
select c.relname as objeto,
       'create materialized view public.' || quote_ident(c.relname) || ' as' || chr(10) || pg_get_viewdef(c.oid, true) as definicao,
       m.ispopulated as preenchida
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join pg_matviews m on m.schemaname = n.nspname and m.matviewname = c.relname
 where n.nspname = 'public' and c.relkind = 'm'
 order by 1;

-- 3) Funções do schema public (sem as de extensões)
select p.proname as objeto,
       pg_get_function_identity_arguments(p.oid) as argumentos,
       regexp_replace(regexp_replace(pg_get_functiondef(p.oid),
         'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', '<JWT_REMOVIDO>', 'g'),
         '(Bearer\s+)[A-Za-z0-9_.-]{16,}', '\1<TOKEN_REMOVIDO>', 'g') as definicao
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.prokind in ('f', 'p')
   and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
 order by 1, 2;

-- 4) Agendamentos do pg_cron (quem roda o quê e quando)
select jobid, jobname, schedule, active,
       regexp_replace(regexp_replace(command,
         'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', '<JWT_REMOVIDO>', 'g'),
         '(Bearer\s+)[A-Za-z0-9_.-]{16,}', '\1<TOKEN_REMOVIDO>', 'g') as comando
  from cron.job
 order by jobname;
