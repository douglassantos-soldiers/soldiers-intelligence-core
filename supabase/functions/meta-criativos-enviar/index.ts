// Edge Function: executor da fila de criativos (meta_criativo_item).
// Plano Mestre caps. 22–25: só envia itens de lotes CONFIRMADOS por uma pessoa; registra cada passo na
// auditoria; nunca cria anúncio nem mexe em orçamento (escopo: biblioteca de criativos).
//
// Fluxo por item (cada passo é salvo antes do próximo, então reenviar não duplica nada no Meta):
//   imagem: adimages → image_hash → adcreatives → creative_id
//   vídeo:  advideos (upload em partes) → video_id → espera processar → capa → adcreatives → creative_id
//
// Variáveis de ambiente (Supabase → Edge Functions → Secrets):
//   CRIATIVOS_FUNCTION_SECRET  segredo compartilhado com o app e com o pg_cron (cabeçalho x-criativos-segredo)
//   META_GRAPH_VERSION         versão da Graph API (ex.: v21.0). Conferir a versão vigente antes de ligar.
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY já existem no ambiente das Edge Functions.
// Deploy: supabase functions deploy meta-criativos-enviar --no-verify-jwt

import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  classificaErro,
  contaAct,
  esperaPorUso,
  montaCreative,
  type ItemMeta,
  type LoteMeta,
} from "../_shared/meta-criativo.ts";

const VERSAO = Deno.env.get("META_GRAPH_VERSION") ?? "v21.0";
const GRAPH = `https://graph.facebook.com/${VERSAO}`;
const GRAPH_VIDEO = `https://graph-video.facebook.com/${VERSAO}`;
const BUCKET = "meta-criativos";
const ORCAMENTO_MS = 110_000; // para antes do limite de execução da Edge Function
const PARTE_VIDEO = 8 * 1024 * 1024;

type Item = ItemMeta & {
  id: string;
  lote_id: string;
  arquivo_path: string;
  arquivo_nome: string;
  mime: string;
  bytes: number;
  thumbnail_path: string | null;
  tentativas: number;
  status: string;
};

class ErroGraph extends Error {
  constructor(
    public status: number,
    public corpo: unknown,
    public uso: string | null,
  ) {
    super(`Graph ${status}`);
  }
}

Deno.serve(async (req) => {
  const segredo = Deno.env.get("CRIATIVOS_FUNCTION_SECRET");
  if (!segredo || req.headers.get("x-criativos-segredo") !== segredo)
    return new Response("não autorizado", { status: 401 });

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  const inicio = Date.now();
  const resumo = { processados: 0, enviados: 0, erros: 0, adiados: 0 };
  const lotes = new Map<string, LoteMeta & { id: string }>();
  const tokens = new Map<string, string>();
  let pausaGeral = 0;

  const audit = (
    lote_id: string,
    item_id: string | null,
    acao: string,
    detalhe: Record<string, unknown> = {},
  ) =>
    db
      .from("meta_criativo_auditoria")
      .insert({ lote_id, item_id, acao, ator: "executor", detalhe });

  async function lote(id: string) {
    if (!lotes.has(id)) {
      const { data, error } = await db
        .from("meta_criativo_lote")
        .select("id,ad_account_id,page_id,instagram_user_id,status")
        .eq("id", id)
        .single();
      if (error || !data) throw new Error(`lote ${id} não encontrado`);
      if (!["confirmado", "enviando"].includes(data.status))
        throw new Error(`lote ${id} não está confirmado (${data.status})`);
      lotes.set(id, data);
      if (data.status === "confirmado")
        await db.from("meta_criativo_lote").update({ status: "enviando" }).eq("id", id);
    }
    return lotes.get(id)!;
  }

  // O token fica só aqui no servidor; nunca vai para o navegador nem para a auditoria.
  async function token(conta: string) {
    const act = contaAct(conta);
    if (!tokens.has(act)) {
      const { data } = await db.from("meta_credentials").select("ad_account_id,access_token");
      const linha = (data ?? []).find(
        (r: { ad_account_id: string | null }) =>
          r.ad_account_id && contaAct(r.ad_account_id) === act,
      );
      if (!linha?.access_token) throw new Error(`sem token para a conta ${act}`);
      tokens.set(act, linha.access_token);
    }
    return tokens.get(act)!;
  }

  async function graph(url: string, init: RequestInit, tk: string) {
    const sep = url.includes("?") ? "&" : "?";
    const r = await fetch(`${url}${sep}access_token=${encodeURIComponent(tk)}`, init);
    const uso = r.headers.get("x-business-use-case-usage");
    const corpo = await r.json().catch(() => ({}));
    pausaGeral = Math.max(pausaGeral, esperaPorUso(uso));
    if (!r.ok || (corpo as { error?: unknown }).error) throw new ErroGraph(r.status, corpo, uso);
    return corpo as Record<string, unknown>;
  }

  async function baixa(path: string) {
    const { data, error } = await db.storage.from(BUCKET).download(path);
    if (error || !data) throw new Error(`arquivo não encontrado no storage: ${path}`);
    return data;
  }

  async function sobeImagem(act: string, tk: string, arquivo: Blob, nome: string) {
    const fd = new FormData();
    fd.append("filename", arquivo, nome);
    const r = await graph(`${GRAPH}/${act}/adimages`, { method: "POST", body: fd }, tk);
    const imgs = (r["images"] ?? {}) as Record<string, { hash?: string }>;
    const hash = Object.values(imgs)[0]?.hash;
    if (!hash) throw new Error("resposta de adimages sem hash");
    return hash;
  }

  // Lê só um pedaço do arquivo (cabeçalho Range): o vídeo inteiro não precisa caber na memória.
  async function pedaco(urlAssinada: string, de: number, ate: number) {
    const r = await fetch(urlAssinada, { headers: { Range: `bytes=${de}-${ate - 1}` } });
    if (!r.ok) throw new Error(`falha ao ler o arquivo (${r.status})`);
    return await r.blob();
  }

  // Upload de vídeo em partes (start → transfer → finish).
  async function sobeVideo(act: string, tk: string, path: string, tamanho: number, titulo: string) {
    const { data: assinado, error } = await db.storage.from(BUCKET).createSignedUrl(path, 3600);
    if (error || !assinado) throw new Error(`arquivo não encontrado no storage: ${path}`);
    const ini = new FormData();
    ini.append("upload_phase", "start");
    ini.append("file_size", String(tamanho));
    const s = await graph(`${GRAPH_VIDEO}/${act}/advideos`, { method: "POST", body: ini }, tk);
    const sessao = String(s["upload_session_id"]);
    const videoId = String(s["video_id"]);
    let de = Number(s["start_offset"]);
    let ate = Number(s["end_offset"]);
    while (de < ate) {
      const fd = new FormData();
      fd.append("upload_phase", "transfer");
      fd.append("upload_session_id", sessao);
      fd.append("start_offset", String(de));
      fd.append(
        "video_file_chunk",
        await pedaco(assinado.signedUrl, de, Math.min(ate, de + PARTE_VIDEO)),
        "parte",
      );
      const t = await graph(`${GRAPH_VIDEO}/${act}/advideos`, { method: "POST", body: fd }, tk);
      de = Number(t["start_offset"]);
      ate = Number(t["end_offset"]);
    }
    const fim = new FormData();
    fim.append("upload_phase", "finish");
    fim.append("upload_session_id", sessao);
    fim.append("title", titulo);
    await graph(`${GRAPH_VIDEO}/${act}/advideos`, { method: "POST", body: fim }, tk);
    return videoId;
  }

  async function processa(item: Item) {
    const l = await lote(item.lote_id);
    const act = contaAct(l.ad_account_id);
    const tk = await token(act);
    const salva = (campos: Record<string, unknown>) =>
      db.from("meta_criativo_item").update(campos).eq("id", item.id);

    if (item.tipo === "imagem") {
      if (!item.meta_image_hash) {
        item.meta_image_hash = await sobeImagem(
          act,
          tk,
          await baixa(item.arquivo_path),
          item.arquivo_nome,
        );
        await salva({ meta_image_hash: item.meta_image_hash });
        await audit(item.lote_id, item.id, "imagem_enviada", { image_hash: item.meta_image_hash });
      }
      const c = await graph(
        `${GRAPH}/${act}/adcreatives`,
        { method: "POST", body: new URLSearchParams(montaCreative(item, l)) },
        tk,
      );
      return finaliza(item, String(c["id"]));
    }

    // vídeo
    if (!item.meta_video_id) {
      item.meta_video_id = await sobeVideo(
        act,
        tk,
        item.arquivo_path,
        item.bytes,
        item.nome_criativo,
      );
      await salva({
        meta_video_id: item.meta_video_id,
        status: "processando_video",
        proximo_em: new Date(Date.now() + 60_000).toISOString(),
        reservado_em: null,
      });
      await audit(item.lote_id, item.id, "video_enviado", { video_id: item.meta_video_id });
      resumo.adiados++;
      return;
    }
    const v = await graph(
      `${GRAPH}/${item.meta_video_id}?fields=status,picture`,
      { method: "GET" },
      tk,
    );
    const estado = String(
      (v["status"] as { video_status?: string } | undefined)?.video_status ?? "",
    );
    if (estado === "error")
      throw new ErroGraph(
        400,
        { error: { message: "o Meta recusou o vídeo no processamento", code: 100 } },
        null,
      );
    if (estado !== "ready") {
      await salva({
        status: "processando_video",
        proximo_em: new Date(Date.now() + 90_000).toISOString(),
        reservado_em: null,
      });
      resumo.adiados++;
      return;
    }
    let capa: { image_hash?: string; image_url?: string };
    if (item.thumbnail_path)
      capa = {
        image_hash: await sobeImagem(
          act,
          tk,
          await baixa(item.thumbnail_path),
          `capa_${item.arquivo_nome}.jpg`,
        ),
      };
    else if (v["picture"]) capa = { image_url: String(v["picture"]) };
    else throw new Error("vídeo pronto sem capa disponível");
    const c = await graph(
      `${GRAPH}/${act}/adcreatives`,
      { method: "POST", body: new URLSearchParams(montaCreative(item, l, capa)) },
      tk,
    );
    return finaliza(item, String(c["id"]));
  }

  async function finaliza(item: Item, creativeId: string) {
    await db
      .from("meta_criativo_item")
      .update({
        meta_creative_id: creativeId,
        status: "enviado",
        enviado_em: new Date().toISOString(),
        ultimo_erro: null,
        reservado_em: null,
      })
      .eq("id", item.id);
    await audit(item.lote_id, item.id, "criativo_criado", {
      creative_id: creativeId,
      nome: item.nome_criativo,
    });
    resumo.enviados++;
  }

  async function falha(item: Item, e: unknown) {
    const err =
      e instanceof ErroGraph
        ? classificaErro(e.status, e.corpo, item.tentativas)
        : {
            tipo: "permanente" as const,
            mensagem: String((e as Error)?.message ?? e).slice(0, 500),
            esperarSeg: 0,
          };
    const esgotou = item.tentativas >= 8;
    const volta = (err.tipo === "limite" || err.tipo === "temporario") && !esgotou;
    await db
      .from("meta_criativo_item")
      .update({
        // O passo de vídeo em processamento é preservado: volta para conferir, sem reenviar o arquivo.
        status: volta ? (item.meta_video_id ? "processando_video" : "na_fila") : "erro",
        proximo_em: volta ? new Date(Date.now() + err.esperarSeg * 1000).toISOString() : null,
        ultimo_erro: err.mensagem,
        reservado_em: null,
      })
      .eq("id", item.id);
    await audit(item.lote_id, item.id, volta ? "adiado" : "erro", {
      tipo: err.tipo,
      mensagem: err.mensagem,
    });
    if (volta) resumo.adiados++;
    else resumo.erros++;
    if (err.tipo === "limite") pausaGeral = Math.max(pausaGeral, err.esperarSeg);
    if (err.tipo === "token") throw new Error(`token sem acesso: ${err.mensagem}`);
  }

  try {
    while (Date.now() - inicio < ORCAMENTO_MS && pausaGeral === 0) {
      const { data, error } = await db.rpc("meta_criativo_reservar", { p_limite: 5 });
      if (error) throw error;
      const itens = (data ?? []) as Item[];
      if (!itens.length) break;
      // Um item por vez por conta: a API de criativos tem limite de uso por conta.
      for (const item of itens) {
        resumo.processados++;
        if (pausaGeral > 0 || Date.now() - inicio > ORCAMENTO_MS) {
          await db
            .from("meta_criativo_item")
            .update({
              status: item.meta_video_id ? "processando_video" : "na_fila",
              reservado_em: null,
              proximo_em: new Date(Date.now() + Math.max(pausaGeral, 30) * 1000).toISOString(),
              tentativas: Math.max(0, item.tentativas - 1),
            })
            .eq("id", item.id);
          continue;
        }
        try {
          await processa(item);
        } catch (e) {
          await falha(item, e);
        }
      }
    }
  } catch (e) {
    await db
      .from("meta_criativo_auditoria")
      .insert({
        acao: "executor_parado",
        ator: "executor",
        detalhe: { motivo: String((e as Error)?.message ?? e).slice(0, 500) },
      });
    await db.rpc("meta_criativo_fechar_lotes");
    return Response.json(
      { ok: false, motivo: String((e as Error)?.message ?? e), ...resumo },
      { status: 500 },
    );
  }
  await db.rpc("meta_criativo_fechar_lotes");
  return Response.json({ ok: true, pausaSeg: pausaGeral, ...resumo });
});
