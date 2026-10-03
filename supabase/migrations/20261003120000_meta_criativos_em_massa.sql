-- Soldiers Platform — Meta Ads: subida de criativos em massa (biblioteca de criativos).
-- Plano Mestre caps. 22–25: a IA e as telas não chamam a API do Meta direto. O fluxo é
--   rascunho → validado → confirmado (por uma pessoa, registrado) → fila → executor (Edge Function) → auditoria.
-- Escopo escolhido: só biblioteca de criativos (imagem/vídeo + adcreative). NÃO cria anúncios nem gasta verba.
--
-- Aplicar no Supabase (SQL editor ou `supabase db push`). Não altera nenhuma tabela existente.

-- ---------------------------------------------------------------------------------------------
-- 1) Lote
create table if not exists public.meta_criativo_lote (
  id               uuid primary key default gen_random_uuid(),
  nome             text not null check (length(nome) between 3 and 120),
  ad_account_id    text not null check (ad_account_id ~ '^(act_)?[0-9]+$'),
  page_id          text not null check (page_id ~ '^[0-9]+$'),
  instagram_user_id text check (instagram_user_id is null or instagram_user_id ~ '^[0-9]+$'),
  link_padrao      text check (link_padrao is null or link_padrao ~ '^https://'),
  url_tags_padrao  text,
  cta_padrao       text not null default 'SHOP_NOW',
  status           text not null default 'rascunho'
                   check (status in ('rascunho','confirmado','enviando','concluido','concluido_com_erros','cancelado')),
  total            int not null default 0,
  criado_por       text not null,           -- e-mail de quem montou
  criado_em        timestamptz not null default now(),
  confirmado_por   text,
  confirmado_em    timestamptz,
  concluido_em     timestamptz
);

-- ---------------------------------------------------------------------------------------------
-- 2) Itens (um por arquivo)
create table if not exists public.meta_criativo_item (
  id               uuid primary key default gen_random_uuid(),
  lote_id          uuid not null references public.meta_criativo_lote(id) on delete cascade,
  ordem            int not null,
  arquivo_path     text not null,           -- caminho no bucket meta-criativos
  arquivo_nome     text not null,
  tipo             text not null check (tipo in ('imagem','video')),
  mime             text not null,
  bytes            bigint not null check (bytes > 0),
  sha256           text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  largura          int,
  altura           int,
  duracao_seg      numeric,
  nome_criativo    text not null check (length(nome_criativo) between 1 and 255),
  texto_principal  text,
  titulo           text,
  descricao        text,
  cta              text not null,
  link             text not null check (link ~ '^https://'),
  url_tags         text,
  thumbnail_path   text,                    -- opcional: capa do vídeo
  status           text not null default 'validado'
                   check (status in ('validado','invalido','na_fila','enviando','processando_video','enviado','erro','cancelado')),
  avisos           jsonb not null default '[]'::jsonb,
  erros_validacao  jsonb not null default '[]'::jsonb,
  -- passos do envio (cada um é salvo antes do próximo: reenvio não duplica nada no Meta)
  meta_image_hash  text,
  meta_video_id    text,
  meta_creative_id text,
  tentativas       int not null default 0,
  proximo_em       timestamptz,             -- backoff (limite de uso da API)
  reservado_em     timestamptz,
  ultimo_erro      text,
  enviado_em       timestamptz,
  unique (lote_id, sha256),                 -- mesmo arquivo duas vezes no lote
  unique (lote_id, nome_criativo)
);
create index if not exists meta_criativo_item_fila_idx
  on public.meta_criativo_item (status, proximo_em) where status in ('na_fila','processando_video','erro');

-- ---------------------------------------------------------------------------------------------
-- 3) Auditoria (só inserção: não dá para editar nem apagar)
create table if not exists public.meta_criativo_auditoria (
  id         bigserial primary key,
  lote_id    uuid references public.meta_criativo_lote(id) on delete set null,
  item_id    uuid,
  acao       text not null,
  ator       text not null,                 -- e-mail ou 'executor'
  detalhe    jsonb not null default '{}'::jsonb,
  criado_em  timestamptz not null default now()
);
create or replace function public.meta_criativo_auditoria_imutavel() returns trigger
language plpgsql as $$
begin
  raise exception 'meta_criativo_auditoria é somente inserção';
end $$;
drop trigger if exists meta_criativo_auditoria_imutavel on public.meta_criativo_auditoria;
create trigger meta_criativo_auditoria_imutavel
  before update or delete on public.meta_criativo_auditoria
  for each row execute function public.meta_criativo_auditoria_imutavel();

-- ---------------------------------------------------------------------------------------------
-- 4) RLS: nada para anon/authenticated. Só o servidor (service role) lê e escreve, depois de checar o login
--    e a lista de e-mails autorizados (CRIATIVOS_EMAILS) nas server functions.
alter table public.meta_criativo_lote      enable row level security;
alter table public.meta_criativo_item      enable row level security;
alter table public.meta_criativo_auditoria enable row level security;
revoke all on public.meta_criativo_lote, public.meta_criativo_item, public.meta_criativo_auditoria from anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- 5) Confirmar lote: só se todos os itens estão válidos; registra quem confirmou e enfileira.
create or replace function public.meta_criativo_confirmar(p_lote uuid, p_ator text, p_total_digitado int)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_lote public.meta_criativo_lote;
  v_total int;
  v_invalidos int;
begin
  select * into v_lote from public.meta_criativo_lote where id = p_lote for update;
  if not found then raise exception 'lote não encontrado'; end if;
  if v_lote.status <> 'rascunho' then raise exception 'lote não está em rascunho (status %)', v_lote.status; end if;
  select count(*), count(*) filter (where status <> 'validado') into v_total, v_invalidos
    from public.meta_criativo_item where lote_id = p_lote;
  if v_total = 0 then raise exception 'lote sem criativos'; end if;
  if v_invalidos > 0 then raise exception '% criativo(s) com erro de validação', v_invalidos; end if;
  if p_total_digitado is distinct from v_total then
    raise exception 'confirmação não confere: digitado %, lote tem %', p_total_digitado, v_total;
  end if;
  update public.meta_criativo_item set status = 'na_fila', proximo_em = now() where lote_id = p_lote;
  update public.meta_criativo_lote
     set status = 'confirmado', total = v_total, confirmado_por = p_ator, confirmado_em = now()
   where id = p_lote;
  insert into public.meta_criativo_auditoria (lote_id, acao, ator, detalhe)
  values (p_lote, 'lote_confirmado', p_ator, jsonb_build_object('total', v_total, 'conta', v_lote.ad_account_id));
end $$;
revoke all on function public.meta_criativo_confirmar(uuid, text, int) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- 6) Reservar itens para o executor (vários executores podem rodar juntos sem pegar o mesmo item).
--    Reserva parada há mais de 15 min volta para a fila.
create or replace function public.meta_criativo_reservar(p_limite int default 10)
returns setof public.meta_criativo_item language plpgsql security definer set search_path = public as $$
begin
  update public.meta_criativo_item set status = 'na_fila', reservado_em = null
   where status = 'enviando' and reservado_em < now() - interval '15 minutes';
  return query
  update public.meta_criativo_item i
     set status = case when i.status = 'processando_video' then 'processando_video' else 'enviando' end,
         reservado_em = now(),
         -- conferir o processamento do vídeo não conta como nova tentativa
         tentativas = i.tentativas + case when i.status = 'na_fila' then 1 else 0 end
   where i.id in (
     select id from public.meta_criativo_item
      where status in ('na_fila','processando_video')
        and coalesce(proximo_em, now()) <= now()
        and (reservado_em is null or reservado_em < now() - interval '15 minutes')
        and tentativas < 8
      order by proximo_em nulls first, ordem
      limit greatest(1, least(p_limite, 50))
      for update skip locked)
  returning i.*;
end $$;
revoke all on function public.meta_criativo_reservar(int) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- 7) Fecha o lote quando não há mais nada pendente.
create or replace function public.meta_criativo_fechar_lotes()
returns void language sql security definer set search_path = public as $$
  update public.meta_criativo_lote l
     set status = case when exists (select 1 from public.meta_criativo_item i where i.lote_id = l.id and i.status = 'erro')
                       then 'concluido_com_erros' else 'concluido' end,
         concluido_em = now()
   where l.status in ('confirmado','enviando')
     and not exists (select 1 from public.meta_criativo_item i
                      where i.lote_id = l.id and i.status in ('na_fila','enviando','processando_video'));
$$;
revoke all on function public.meta_criativo_fechar_lotes() from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- 8) Bucket privado para os arquivos (o upload é feito com URL assinada criada no servidor).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meta-criativos', 'meta-criativos', false, 209715200, -- 200 MB por arquivo
        array['image/jpeg','image/png','video/mp4','video/quicktime'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------------------------
-- 9) (Opcional) Rodar o executor a cada minuto com pg_cron + pg_net.
--    Habilite as extensões em Database → Extensions e troque <PROJETO> e <SEGREDO> antes de rodar.
-- select cron.schedule('meta-criativos-enviar', '* * * * *', $$
--   select net.http_post(
--     url := 'https://<PROJETO>.supabase.co/functions/v1/meta-criativos-enviar',
--     headers := jsonb_build_object('content-type','application/json','x-criativos-segredo','<SEGREDO>'),
--     body := '{}'::jsonb);
-- $$);
