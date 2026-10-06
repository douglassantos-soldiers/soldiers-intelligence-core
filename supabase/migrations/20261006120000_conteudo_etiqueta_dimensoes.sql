-- Soldiers Platform — Content DNA completo (Plano Mestre cap. 8.11): além de gancho, ângulo e CTA,
-- aceita etiqueta manual de formato, produto e público. Creator já vem do próprio vídeo (@ público).
-- Depende de 20261005160000_conteudo_etiqueta.sql. Pode rodar mais de uma vez.

alter table public.conteudo_etiqueta drop constraint if exists conteudo_etiqueta_dimensao_check;
alter table public.conteudo_etiqueta add constraint conteudo_etiqueta_dimensao_check
  check (dimensao in ('gancho', 'angulo', 'formato', 'produto', 'cta', 'publico'));

-- Valores usados pela regra automática (use os mesmos para agrupar junto):
-- formato: Unboxing, Antes e depois, Comparação, Receita / preparo, Tutorial / dica, Review, Depoimento, Rotina / vlog
--          (Talking head, Demonstração etc. só por etiqueta manual: a regra não vê o vídeo)
-- produto: Creatina, Whey, Pré-treino, Glutamina, BCAA, Colágeno, Vitaminas
-- publico: livre e curto, ex.: Iniciante, Atleta, Mulheres 25-34, Emagrecimento (sem dado pessoal)
-- insert into public.conteudo_etiqueta (canal, conteudo_id, dimensao, valor)
-- values ('tiktok_creator', '<video_id>', 'formato', 'Talking head');
