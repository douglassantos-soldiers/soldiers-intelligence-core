// Montagem do adcreative e classificação de erros da API do Meta.
// Sem dependências: usado pela Edge Function (Deno) e pelos testes (vitest).
//
// Formato do object_story_spec (link_data para imagem, video_data para vídeo) e dos códigos de erro de
// limite de uso: conferir na referência da Marketing API antes de ligar em produção
// (https://developers.facebook.com/docs/marketing-api/reference/ad-creative/).

export type LoteMeta = {
  ad_account_id: string;
  page_id: string;
  instagram_user_id?: string | null;
};

export type ItemMeta = {
  tipo: "imagem" | "video";
  nome_criativo: string;
  texto_principal?: string | null;
  titulo?: string | null;
  descricao?: string | null;
  cta: string;
  link: string;
  url_tags?: string | null;
  meta_image_hash?: string | null;
  meta_video_id?: string | null;
};

export const contaAct = (id: string) => (id.startsWith("act_") ? id : `act_${id}`);

/** Campos do POST /act_<id>/adcreatives. Para vídeo é preciso uma capa: image_hash ou image_url. */
export function montaCreative(
  item: ItemMeta,
  lote: LoteMeta,
  capa?: { image_hash?: string; image_url?: string },
) {
  const cta = { type: item.cta, value: { link: item.link } };
  const vazioNull = (s?: string | null) => (s && s.trim() ? s.trim() : undefined);
  let spec: Record<string, unknown>;
  if (item.tipo === "imagem") {
    if (!item.meta_image_hash) throw new Error("imagem sem image_hash");
    spec = {
      page_id: lote.page_id,
      link_data: {
        image_hash: item.meta_image_hash,
        link: item.link,
        message: vazioNull(item.texto_principal),
        name: vazioNull(item.titulo),
        description: vazioNull(item.descricao),
        call_to_action: cta,
      },
    };
  } else {
    if (!item.meta_video_id) throw new Error("vídeo sem video_id");
    if (!capa?.image_hash && !capa?.image_url) throw new Error("vídeo sem capa");
    spec = {
      page_id: lote.page_id,
      video_data: {
        video_id: item.meta_video_id,
        ...(capa.image_hash ? { image_hash: capa.image_hash } : { image_url: capa.image_url }),
        message: vazioNull(item.texto_principal),
        title: vazioNull(item.titulo),
        link_description: vazioNull(item.descricao),
        call_to_action: cta,
      },
    };
  }
  if (lote.instagram_user_id) spec["instagram_user_id"] = lote.instagram_user_id;
  const campos: Record<string, string> = {
    name: item.nome_criativo,
    object_story_spec: JSON.stringify(spec, (_k, v) => (v === undefined ? undefined : v)),
  };
  if (item.url_tags && item.url_tags.trim()) campos["url_tags"] = item.url_tags.trim();
  return campos;
}

export type ErroMeta = {
  tipo: "limite" | "token" | "temporario" | "permanente";
  mensagem: string;
  esperarSeg: number;
};

/**
 * Classifica a resposta de erro da Graph API.
 * - limite: códigos de limite de uso (4, 17, 32, 613, 80000–80014) → esperar e tentar de novo;
 * - token: 190 (token inválido/expirado) ou 10/200–299 (permissão) → parar tudo e avisar;
 * - temporario: 1, 2 ou HTTP 5xx → tentar de novo;
 * - permanente: o resto (parâmetro inválido, arquivo recusado) → marcar erro no item.
 */
export function classificaErro(status: number, corpo: unknown, tentativas = 1): ErroMeta {
  const e =
    (
      corpo as {
        error?: {
          code?: number;
          error_subcode?: number;
          message?: string;
          error_user_msg?: string;
        };
      }
    )?.error ?? {};
  const code = Number(e.code ?? 0);
  const mensagem = String(e.error_user_msg || e.message || `HTTP ${status}`).slice(0, 500);
  const espera = Math.min(30 * 60, 60 * 2 ** Math.max(0, tentativas - 1));
  if ([4, 17, 32, 613].includes(code) || (code >= 80000 && code <= 80014))
    return { tipo: "limite", mensagem, esperarSeg: espera };
  if (code === 190 || code === 10 || (code >= 200 && code <= 299))
    return { tipo: "token", mensagem, esperarSeg: 0 };
  if (code === 1 || code === 2 || status >= 500)
    return { tipo: "temporario", mensagem, esperarSeg: espera };
  return { tipo: "permanente", mensagem, esperarSeg: 0 };
}

/** Lê o cabeçalho x-business-use-case-usage e devolve quantos segundos esperar (0 = pode seguir). */
export function esperaPorUso(cabecalho: string | null): number {
  if (!cabecalho) return 0;
  try {
    const obj = JSON.parse(cabecalho) as Record<
      string,
      {
        estimated_time_to_regain_access?: number;
        call_count?: number;
        total_time?: number;
        total_cputime?: number;
      }[]
    >;
    let espera = 0;
    for (const lista of Object.values(obj))
      for (const u of lista ?? []) {
        if (u.estimated_time_to_regain_access)
          espera = Math.max(espera, u.estimated_time_to_regain_access * 60);
        if (Math.max(u.call_count ?? 0, u.total_time ?? 0, u.total_cputime ?? 0) >= 90)
          espera = Math.max(espera, 120);
      }
    return espera;
  } catch {
    return 0;
  }
}
