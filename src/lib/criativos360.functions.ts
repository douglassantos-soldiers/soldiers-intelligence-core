// Leituras da Central de criativos. Só leitura. mv_criativo_cliente vem da migração 20261005150000;
// sem ela, o placar mostra desempenho e contribuição pela receita do Meta, sem cliente nem LTV.
import { createServerFn } from "@tanstack/react-start";
import { db, fetchAll, Periodo } from "@/lib/db-helpers";
import {
  placarMeta,
  oQueFunciona,
  multicanal,
  biblioteca,
  alertasCriativos,
} from "@/lib/criativos360";

type Rows = Record<string, unknown>[];

export async function dadosCriativos(p: { de: string; ate: string }) {
  const c = await db();
  const erros: Record<string, string> = {};
  let migracaoPendente = false;
  const safe = async (nome: string, pr: Promise<Rows>, opcional = false) => {
    try {
      return await pr;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (opcional && /does not exist|não existe|schema cache|Could not find/i.test(msg))
        migracaoPendente = true;
      else if (!opcional) erros[nome] = msg;
      return [] as Rows;
    }
  };
  const de14 = new Date(Date.parse(p.ate + "T00:00:00Z") - 13 * 86400000)
    .toISOString()
    .slice(0, 10);
  const deFetch = [p.de, de14].sort()[0]!;
  const cols =
    "data,ad_id,ad_name,ad_title,ad_body,creative_id,object_type,effective_status,thumbnail_url,instagram_permalink_url,facebook_permalink_url,gasto,impressoes,alcance,cliques,frequencia,video_25,video_100,compras,receita";
  const [anuncios, cliente, pl, cria, criaAsset, lote, tiktok, pmax, dsp] = await Promise.all([
    safe(
      "anuncios",
      fetchAll(
        () =>
          c
            .from("vw_meta_anuncio_dia_completo")
            .select(cols)
            .gte("data", deFetch)
            .lte("data", p.ate),
        "meta anuncios",
        150000,
      ),
    ),
    safe(
      "clientePorAnuncio",
      fetchAll(
        () =>
          c
            .from("mv_criativo_cliente")
            .select(
              "ad_id,pedidos,receita,clientes,clientes_novos,novos_que_recompraram,ltv_medio_novos",
            ),
        "criativo cliente",
      ),
      true,
    ),
    safe(
      "margem",
      fetchAll(
        () =>
          c
            .from("mv_pl_canal_dia")
            .select("data,canal,receita_bruta,margem_contribuicao,ads")
            .gte("data", p.de)
            .lte("data", p.ate),
        "pl canal",
      ),
    ),
    safe(
      "biblioteca",
      fetchAll(
        () =>
          c
            .from("cria_criativo")
            .select("id,nome,tipo,largura,altura,duracao_seg,origem,criado_em")
            .order("criado_em", { ascending: false }),
        "cria_criativo",
        2000,
      ),
    ),
    safe(
      "bibliotecaEnvios",
      fetchAll(
        () => c.from("cria_asset").select("criativo_id,plataforma,estado,erro_msg"),
        "cria_asset",
        10000,
      ),
    ),
    safe(
      "loteMeta",
      fetchAll(
        () =>
          c
            .from("meta_criativo_item")
            .select("nome_criativo,meta_creative_id")
            .not("meta_creative_id", "is", null),
        "meta_criativo_item",
      ),
      true,
    ),
    safe(
      "tiktok",
      fetchAll(
        () =>
          c
            .from("vw_tiktok_ads_criativo_dia")
            .select("data,item_id,produto,agregado,invest,receita")
            .gte("data", p.de)
            .lte("data", p.ate),
        "tiktok criativos",
        90000,
      ),
    ),
    safe(
      "pmax",
      fetchAll(
        () =>
          c
            .from("vw_google_pmax_asset")
            .select("asset_id,asset_type,field_type,texto,youtube_video_id,performance_label"),
        "pmax assets",
      ),
    ),
    safe(
      "dsp",
      fetchAll(
        () =>
          c
            .from("vw_ml_display_criativo_dia")
            .select("data,creative_id,creative_name,investimento,receita")
            .gte("data", p.de)
            .lte("data", p.ate),
        "meli dsp criativos",
        60000,
      ),
    ),
  ]);
  // Margem de contribuição do site antes de Ads (a mídia do criativo é descontada no placar).
  const site = pl.filter((r) => /site|shopify/i.test(String(r["canal"] ?? "")));
  const rec = site.reduce((s, r) => s + (Number(r["receita_bruta"]) || 0), 0);
  const margemAntesAds = rec
    ? (site.reduce(
        (s, r) => s + (Number(r["margem_contribuicao"]) || 0) + (Number(r["ads"]) || 0),
        0,
      ) /
        rec) *
      100
    : 30;
  const placar = placarMeta(anuncios, cliente, margemAntesAds, p.de, p.ate);
  const biblio = biblioteca(cria, criaAsset, lote, placar);
  return {
    margemSitePct: margemAntesAds,
    temCliente: cliente.length > 0,
    placar: placar.slice(0, 400),
    totalCriativos: placar.length,
    oQueFunciona: oQueFunciona(placar),
    multicanal: multicanal({ tiktok, pmax, dsp }, p.de, p.ate).slice(0, 300),
    biblioteca: biblio.slice(0, 300),
    totalBiblioteca: biblio.length,
    migracaoPendente,
    alertas: alertasCriativos(placar, biblio),
    erros,
  };
}

export const getCriativos = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => dadosCriativos(data));
