// Subida de criativos em massa (Meta Ads → biblioteca de criativos). Plano Mestre caps. 22–25.
// Toda função exige login (Supabase Auth) E e-mail na lista CRIATIVOS_EMAILS. Sem a variável, ninguém usa.
// O navegador nunca vê o token do Meta: o envio é feito pela Edge Function meta-criativos-enviar,
// só para lotes confirmados, com registro em meta_criativo_auditoria.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enviaToken } from "@/lib/auth-client";
import { validaItem, tipoDoMime, CTAS, LIMITES } from "@/domain/criativos";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;
const BUCKET = "meta-criativos";

async function admin(): Promise<Db> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as Db;
}

function emailAutorizado(claims: Record<string, unknown>): string {
  const email = String(claims["email"] ?? "").toLowerCase();
  const lista = String(process.env["CRIATIVOS_EMAILS"] ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!email || !lista.includes(email))
    throw new Error(
      "Sem permissão para subir criativos. Peça para incluir seu e-mail em CRIATIVOS_EMAILS.",
    );
  return email;
}

const comLogin = () => [enviaToken, requireSupabaseAuth] as const;

async function auditoria(
  c: Db,
  lote_id: string | null,
  acao: string,
  ator: string,
  detalhe: Record<string, unknown> = {},
  item_id: string | null = null,
) {
  await c.from("meta_criativo_auditoria").insert({ lote_id, item_id, acao, ator, detalhe });
}

async function loteDoAtor(c: Db, id: string) {
  const { data, error } = await c.from("meta_criativo_lote").select("*").eq("id", id).single();
  if (error || !data) throw new Error("Lote não encontrado.");
  return data as Record<string, unknown>;
}

/** Dispara o executor (Edge Function). Sem as variáveis, o pg_cron pega na próxima volta. */
async function disparaExecutor() {
  const url = process.env["SUPABASE_URL"];
  const segredo = process.env["CRIATIVOS_FUNCTION_SECRET"];
  if (!url || !segredo) return false;
  try {
    await fetch(`${url}/functions/v1/meta-criativos-enviar`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-criativos-segredo": segredo },
      body: "{}",
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // o executor continua rodando do lado do Supabase; o tempo limite aqui é só para não travar a tela
  }
  return true;
}

// ---------------------------------------------------------------------------------------------

export const getCriativosInicio = createServerFn({ method: "GET" })
  .middleware(comLogin())
  .handler(async ({ context }) => {
    const email = emailAutorizado(context.claims as Record<string, unknown>);
    const c = await admin();
    const [contas, lotes] = await Promise.all([
      c.from("meta_credentials").select("ad_account_id,token_scopes"),
      c
        .from("meta_criativo_lote")
        .select(
          "id,nome,ad_account_id,status,total,criado_por,criado_em,confirmado_em,concluido_em",
        )
        .order("criado_em", { ascending: false })
        .limit(30),
    ]);
    const ids: string[] = ((lotes.data ?? []) as { id: string }[]).map((l) => l.id);
    const contagem: Record<string, Record<string, number>> = {};
    if (ids.length) {
      const { data: itens } = await c
        .from("meta_criativo_item")
        .select("lote_id,status")
        .in("lote_id", ids);
      for (const i of (itens ?? []) as { lote_id: string; status: string }[]) {
        const m = (contagem[i.lote_id] ??= {});
        m[i.status] = (m[i.status] ?? 0) + 1;
      }
    }
    return {
      email,
      contas: [
        ...new Set(
          ((contas.data ?? []) as { ad_account_id: string | null }[])
            .map((r) => String(r.ad_account_id ?? ""))
            .filter(Boolean),
        ),
      ],
      // Para criar criativos o token precisa da permissão ads_management (só leitura não basta).
      contasSemPermissao: (
        (contas.data ?? []) as { ad_account_id: string | null; token_scopes: string | null }[]
      )
        .filter(
          (r) =>
            r.ad_account_id &&
            r.token_scopes != null &&
            !/ads_management/.test(String(r.token_scopes)),
        )
        .map((r) => String(r.ad_account_id)),
      lotes: ((lotes.data ?? []) as Record<string, unknown>[]).map((l) => ({
        id: String(l["id"]),
        nome: String(l["nome"]),
        conta: String(l["ad_account_id"]),
        status: String(l["status"]),
        criadoPor: String(l["criado_por"]),
        criadoEm: String(l["criado_em"]),
        contagem: contagem[String(l["id"])] ?? {},
      })),
      ctas: CTAS,
      limites: {
        maxItens: LIMITES.maxItensPorLote,
        imagemMB: LIMITES.imagem.maxBytes / 1048576,
        videoMB: LIMITES.video.maxBytes / 1048576,
      },
      executorConfigurado: !!process.env["CRIATIVOS_FUNCTION_SECRET"],
    };
  });

const NovoLote = z.object({
  nome: z.string().trim().min(3).max(120),
  adAccountId: z.string().regex(/^(act_)?\d+$/),
  pageId: z.string().regex(/^\d+$/),
  instagramUserId: z.string().regex(/^\d+$/).optional().or(z.literal("")),
  linkPadrao: z.string().url().startsWith("https://").optional().or(z.literal("")),
  urlTagsPadrao: z.string().max(500).optional(),
  ctaPadrao: z.string().refine((v) => v in CTAS),
});

export const criarLote = createServerFn({ method: "POST" })
  .middleware(comLogin())
  .inputValidator((d) => NovoLote.parse(d))
  .handler(async ({ data, context }) => {
    const email = emailAutorizado(context.claims as Record<string, unknown>);
    const c = await admin();
    const { data: contas } = await c.from("meta_credentials").select("ad_account_id");
    const norm = (s: string) => s.replace(/^act_/, "");
    if (
      !((contas ?? []) as { ad_account_id: string | null }[]).some(
        (r) => norm(String(r.ad_account_id ?? "")) === norm(data.adAccountId),
      )
    )
      throw new Error("Conta de anúncio não está entre as conectadas.");
    const { data: lote, error } = await c
      .from("meta_criativo_lote")
      .insert({
        nome: data.nome,
        ad_account_id: data.adAccountId,
        page_id: data.pageId,
        instagram_user_id: data.instagramUserId || null,
        link_padrao: data.linkPadrao || null,
        url_tags_padrao: data.urlTagsPadrao || null,
        cta_padrao: data.ctaPadrao,
        criado_por: email,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await auditoria(c, lote.id, "lote_criado", email, { nome: data.nome, conta: data.adAccountId });
    return { id: String(lote.id) };
  });

const ArquivosIn = z.object({
  loteId: z.string().uuid(),
  arquivos: z
    .array(
      z.object({
        sha256: z.string().regex(/^[0-9a-f]{64}$/),
        mime: z.string(),
        bytes: z.number().int().positive(),
        capa: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(LIMITES.maxItensPorLote * 2),
});

/** URLs assinadas para o navegador subir os arquivos direto no bucket privado (sem passar pelo app). */
export const urlsDeUpload = createServerFn({ method: "POST" })
  .middleware(comLogin())
  .inputValidator((d) => ArquivosIn.parse(d))
  .handler(async ({ data, context }) => {
    emailAutorizado(context.claims as Record<string, unknown>);
    const c = await admin();
    const lote = await loteDoAtor(c, data.loteId);
    if (lote["status"] !== "rascunho")
      throw new Error("Só dá para adicionar arquivos a um lote em rascunho.");
    const ext: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "video/mp4": "mp4",
      "video/quicktime": "mov",
    };
    const out: { sha256: string; path: string; token: string }[] = [];
    for (const a of data.arquivos) {
      const tipo = tipoDoMime(a.mime);
      if (!tipo) throw new Error(`Formato não aceito: ${a.mime}`);
      const max = tipo === "video" ? LIMITES.video.maxBytes : LIMITES.imagem.maxBytes;
      if (a.bytes > max)
        throw new Error(`Arquivo acima do limite (${Math.round(max / 1048576)} MB).`);
      const path = `${data.loteId}/${a.capa ? "capa_" : ""}${a.sha256}.${ext[a.mime]}`;
      const { data: s, error } = await c.storage
        .from(BUCKET)
        .createSignedUploadUrl(path, { upsert: true });
      if (error) throw new Error(error.message);
      out.push({ sha256: a.sha256, path, token: String(s.token) });
    }
    return out;
  });

const ItemIn = z.object({
  arquivoPath: z.string().min(10).max(300),
  arquivoNome: z.string().min(1).max(300),
  tipo: z.enum(["imagem", "video"]),
  mime: z.string(),
  bytes: z.number().int().positive(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  largura: z.number().int().positive().nullable(),
  altura: z.number().int().positive().nullable(),
  duracaoSeg: z.number().nonnegative().nullable(),
  nomeCriativo: z.string().trim().min(1).max(255),
  textoPrincipal: z.string().max(5000).default(""),
  titulo: z.string().max(500).default(""),
  descricao: z.string().max(500).default(""),
  cta: z.string(),
  link: z.string().max(2000),
  urlTags: z.string().max(1000).default(""),
  thumbnailPath: z.string().max(300).nullable().default(null),
});

/**
 * Grava os itens do lote. A validação do servidor é a que vale: refaz todas as regras e confere que o
 * arquivo está no bucket, no caminho do lote, com o tamanho declarado.
 */
export const salvarItens = createServerFn({ method: "POST" })
  .middleware(comLogin())
  .inputValidator((d) =>
    z
      .object({
        loteId: z.string().uuid(),
        itens: z.array(ItemIn).min(1).max(LIMITES.maxItensPorLote),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const email = emailAutorizado(context.claims as Record<string, unknown>);
    const c = await admin();
    const lote = await loteDoAtor(c, data.loteId);
    if (lote["status"] !== "rascunho") throw new Error("Lote não está em rascunho.");

    const noBucket = new Map<string, number>();
    for (let off = 0; ; off += 1000) {
      const { data: lista, error } = await c.storage
        .from(BUCKET)
        .list(data.loteId, { limit: 1000, offset: off });
      if (error) throw new Error(error.message);
      for (const o of (lista ?? []) as { name: string; metadata?: { size?: number } }[])
        noBucket.set(`${data.loteId}/${o.name}`, Number(o.metadata?.size ?? 0));
      if (!lista || lista.length < 1000) break;
    }

    const hashes = new Set<string>();
    const nomes = new Set<string>();
    const linhas = data.itens.map((i, ordem) => {
      const v = validaItem(i);
      if (!i.arquivoPath.startsWith(`${data.loteId}/`))
        v.erros.push("arquivo fora da pasta do lote");
      else if (!noBucket.has(i.arquivoPath)) v.erros.push("arquivo não chegou ao armazenamento");
      else if (noBucket.get(i.arquivoPath) !== i.bytes)
        v.erros.push("tamanho do arquivo no armazenamento não confere");
      if (i.thumbnailPath && !noBucket.has(i.thumbnailPath))
        v.erros.push("capa não chegou ao armazenamento");
      if (hashes.has(i.sha256)) v.erros.push("arquivo repetido no lote");
      const nk = i.nomeCriativo.trim().toLowerCase();
      if (nomes.has(nk)) v.erros.push("nome repetido no lote");
      hashes.add(i.sha256);
      nomes.add(nk);
      return {
        lote_id: data.loteId,
        ordem,
        arquivo_path: i.arquivoPath,
        arquivo_nome: i.arquivoNome,
        tipo: i.tipo,
        mime: i.mime,
        bytes: i.bytes,
        sha256: i.sha256,
        largura: i.largura,
        altura: i.altura,
        duracao_seg: i.duracaoSeg,
        nome_criativo: i.nomeCriativo.trim(),
        texto_principal: i.textoPrincipal || null,
        titulo: i.titulo || null,
        descricao: i.descricao || null,
        cta: i.cta,
        link: i.link,
        url_tags: i.urlTags || null,
        thumbnail_path: i.thumbnailPath,
        status: v.erros.length ? "invalido" : "validado",
        erros_validacao: v.erros,
        avisos: v.avisos,
      };
    });

    // Rascunho: substitui os itens (sem status de envio ainda, então não há risco de perder histórico).
    const del = await c.from("meta_criativo_item").delete().eq("lote_id", data.loteId);
    if (del.error) throw new Error(del.error.message);
    const ins = await c.from("meta_criativo_item").insert(linhas);
    if (ins.error) throw new Error(ins.error.message);
    await c.from("meta_criativo_lote").update({ total: linhas.length }).eq("id", data.loteId);
    const invalidos = linhas.filter((l) => l.status === "invalido").length;
    await auditoria(c, data.loteId, "itens_salvos", email, { total: linhas.length, invalidos });
    return {
      total: linhas.length,
      invalidos,
      erros: linhas
        .filter((l) => l.erros_validacao.length)
        .map((l) => ({ nome: l.nome_criativo, erros: l.erros_validacao })),
    };
  });

export const confirmarLote = createServerFn({ method: "POST" })
  .middleware(comLogin())
  .inputValidator((d) =>
    z.object({ loteId: z.string().uuid(), totalDigitado: z.number().int().positive() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const email = emailAutorizado(context.claims as Record<string, unknown>);
    const c = await admin();
    const { error } = await c.rpc("meta_criativo_confirmar", {
      p_lote: data.loteId,
      p_ator: email,
      p_total_digitado: data.totalDigitado,
    });
    if (error) throw new Error(error.message);
    const disparado = await disparaExecutor();
    return { ok: true, disparado };
  });

export const getLote = createServerFn({ method: "GET" })
  .middleware(comLogin())
  .inputValidator((d) => z.object({ loteId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    emailAutorizado(context.claims as Record<string, unknown>);
    const c = await admin();
    const lote = await loteDoAtor(c, data.loteId);
    const [{ data: itens }, { data: aud }] = await Promise.all([
      c
        .from("meta_criativo_item")
        .select(
          "id,ordem,arquivo_nome,tipo,bytes,largura,altura,nome_criativo,cta,link,status,avisos,erros_validacao,meta_creative_id,tentativas,ultimo_erro,enviado_em",
        )
        .eq("lote_id", data.loteId)
        .order("ordem"),
      c
        .from("meta_criativo_auditoria")
        .select("acao,ator,detalhe,criado_em")
        .eq("lote_id", data.loteId)
        .order("criado_em", { ascending: false })
        .limit(50),
    ]);
    return {
      lote: {
        id: String(lote["id"]),
        nome: String(lote["nome"]),
        conta: String(lote["ad_account_id"]),
        pageId: String(lote["page_id"]),
        instagramUserId: lote["instagram_user_id"] ? String(lote["instagram_user_id"]) : "",
        linkPadrao: lote["link_padrao"] ? String(lote["link_padrao"]) : "",
        urlTagsPadrao: lote["url_tags_padrao"] ? String(lote["url_tags_padrao"]) : "",
        ctaPadrao: String(lote["cta_padrao"]),
        status: String(lote["status"]),
        criadoPor: String(lote["criado_por"]),
        confirmadoPor: lote["confirmado_por"] ? String(lote["confirmado_por"]) : null,
        confirmadoEm: lote["confirmado_em"] ? String(lote["confirmado_em"]) : null,
      },
      itens: ((itens ?? []) as Record<string, unknown>[]).map((i) => ({
        id: String(i["id"]),
        ordem: Number(i["ordem"]),
        arquivo: String(i["arquivo_nome"]),
        tipo: String(i["tipo"]),
        nome: String(i["nome_criativo"]),
        status: String(i["status"]),
        avisos: (i["avisos"] ?? []) as string[],
        erros: (i["erros_validacao"] ?? []) as string[],
        creativeId: i["meta_creative_id"] ? String(i["meta_creative_id"]) : null,
        tentativas: Number(i["tentativas"] ?? 0),
        ultimoErro: i["ultimo_erro"] ? String(i["ultimo_erro"]) : null,
      })),
      auditoria: ((aud ?? []) as Record<string, unknown>[]).map((a) => ({
        acao: String(a["acao"]),
        ator: String(a["ator"]),
        quando: String(a["criado_em"]),
        detalhe: JSON.stringify(a["detalhe"] ?? {}),
      })),
    };
  });

export const reenviarErros = createServerFn({ method: "POST" })
  .middleware(comLogin())
  .inputValidator((d) => z.object({ loteId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const email = emailAutorizado(context.claims as Record<string, unknown>);
    const c = await admin();
    const lote = await loteDoAtor(c, data.loteId);
    if (!["concluido_com_erros", "enviando", "confirmado"].includes(String(lote["status"])))
      throw new Error("Lote sem erros para reenviar.");
    const { data: itens, error } = await c
      .from("meta_criativo_item")
      .update({
        status: "na_fila",
        tentativas: 0,
        proximo_em: new Date().toISOString(),
        ultimo_erro: null,
      })
      .eq("lote_id", data.loteId)
      .eq("status", "erro")
      .select("id");
    if (error) throw new Error(error.message);
    await c
      .from("meta_criativo_lote")
      .update({ status: "enviando", concluido_em: null })
      .eq("id", data.loteId);
    await auditoria(c, data.loteId, "reenvio_de_erros", email, { itens: (itens ?? []).length });
    await disparaExecutor();
    return { reenviados: (itens ?? []).length };
  });

export const cancelarLote = createServerFn({ method: "POST" })
  .middleware(comLogin())
  .inputValidator((d) => z.object({ loteId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const email = emailAutorizado(context.claims as Record<string, unknown>);
    const c = await admin();
    const lote = await loteDoAtor(c, data.loteId);
    if (!["rascunho", "confirmado", "enviando"].includes(String(lote["status"])))
      throw new Error("Lote já terminou.");
    // O que já foi criado no Meta fica na biblioteca (não gasta verba); só para o que ainda não foi.
    await c
      .from("meta_criativo_item")
      .update({ status: "cancelado" })
      .eq("lote_id", data.loteId)
      .in("status", ["validado", "invalido", "na_fila", "erro"]);
    await c
      .from("meta_criativo_lote")
      .update({ status: "cancelado", concluido_em: new Date().toISOString() })
      .eq("id", data.loteId);
    await auditoria(c, data.loteId, "lote_cancelado", email);
    return { ok: true };
  });
