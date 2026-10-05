-- Soldiers Platform — DNA do conteúdo (Plano Mestre caps. 7.5 e 8).
-- Etiqueta manual de gancho, ângulo e CTA por peça (criativo do Meta, vídeo de creator no TikTok etc.).
-- Só inserção: corrigir = inserir nova linha; a vigente é a mais recente por (canal, peça, dimensão).
-- A regra automática da tela (texto do anúncio / título do vídeo) vale até existir etiqueta manual.
-- Sem dado pessoal: a peça é identificada pelo id da plataforma.

create table if not exists public.conteudo_etiqueta (
  id          bigint generated always as identity primary key,
  canal       text not null check (canal in ('meta', 'tiktok_ads', 'tiktok_creator', 'meli_dsp', 'google')),
  conteudo_id text not null check (length(trim(conteudo_id)) > 0),
  dimensao    text not null check (dimensao in ('gancho', 'angulo', 'cta')),
  valor       text not null check (length(trim(valor)) between 1 and 60),
  fonte       text not null default 'manual' check (fonte in ('manual', 'ia_aprovada')),
  observacao  text,
  criado_por  text not null default current_user,
  criado_em   timestamptz not null default now()
);
create index if not exists conteudo_etiqueta_peca on public.conteudo_etiqueta (canal, conteudo_id, dimensao, criado_em desc);

create or replace function public.conteudo_etiqueta_so_insercao() returns trigger
language plpgsql as $$
begin
  raise exception 'conteudo_etiqueta é só inserção: grave uma nova linha para corrigir';
end;
$$;
drop trigger if exists conteudo_etiqueta_so_insercao on public.conteudo_etiqueta;
create trigger conteudo_etiqueta_so_insercao before update or delete on public.conteudo_etiqueta
  for each row execute function public.conteudo_etiqueta_so_insercao();

create or replace view public.vw_conteudo_etiqueta_atual as
select distinct on (canal, conteudo_id, dimensao)
       canal, conteudo_id, dimensao, valor, fonte, criado_em
from public.conteudo_etiqueta
order by canal, conteudo_id, dimensao, criado_em desc, id desc;

alter table public.conteudo_etiqueta enable row level security;
revoke all on public.conteudo_etiqueta from anon, authenticated;
revoke all on public.vw_conteudo_etiqueta_atual from anon, authenticated;

-- Exemplo (SQL editor), valores iguais aos da tela para agrupar junto:
-- gancho: História / POV, Erro / mito, Resultado, Lista / número, Novidade, Oferta, Pergunta
-- angulo: Ciência / pureza, Prova social, Autoridade, Preço / oferta, Resultado / shape, Sabor / experiência,
--         Rotina / praticidade, Dor / problema
-- cta:    Cupom, Link / carrinho, Urgência, Compre agora, Saiba mais
-- insert into public.conteudo_etiqueta (canal, conteudo_id, dimensao, valor)
-- values ('meta', '<creative_id>', 'gancho', 'Erro / mito');
