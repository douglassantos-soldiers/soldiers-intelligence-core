// Leituras da Soldiers Platform — Media: visão geral, Google Ads e Meta Ads.
// Somente leitura de objetos JÁ EXISTENTES no Supabase. data.functions.ts reexporta as server functions.
import { diasAtrasSP, hojeSP } from "@/lib/datas";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  reconciliacaoMeta,
  criativosMeta,
  segmentosMeta,
  funilMeta,
  ritmoMeta,
  alertasMeta,
} from "@/lib/metaads";
import {
  campanhasGoogle,
  ritmoIntraday,
  produtosGoogle,
  assetsPmax,
  paginasSite,
  alertasGoogle,
} from "@/lib/google";
import {
  linhasMeta,
  itensMeta,
  linhasGoogle,
  itensGoogle,
  linhasMidiaGeral,
  dspPorDia,
} from "@/lib/painel-ads";
import { novosParaMarca } from "@/lib/amazon";
import { db, fetchAll } from "@/lib/db-helpers";

const Periodo = z.object({
  de: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/* ---------------- Media / Affiliate / CRM ---------------- */
export const getMedia = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => {
    const c = await db();
    const [tipos, funil, sbNtb, sdNtb, dsp] = await Promise.all([
      fetchAll(
        () =>
          c
            .from("vw_ads_por_tipo_dia")
            .select("data,tipo,investimento,receita,impressoes,cliques,unidades")
            .gte("data", data.de)
            .lte("data", data.ate)
            .order("data"),
        "ads tipo",
      ),
      // Funil por canal de venda (impressão → clique → conversão), previsto no plano revisado da Fase 1.
      fetchAll(
        () =>
          c
            .from("vw_ads_funil_canal_dia")
            .select("data,canal,invest,receita_ads,impressoes,cliques,conversoes,base_conversao")
            .gte("data", data.de)
            .lte("data", data.ate)
            .order("data"),
        "ads funil",
      ),
      // Amazon: clientes novos para a marca (Sponsored Brands e Display). Falha aqui não derruba a tela.
      fetchAll(
        () =>
          c
            .from("fact_amazon_ads_sb_campanha_dia")
            .select("data,campaign_id,campaign_name,cost,sales,ntb_sales,ntb_purchases")
            .gte("data", data.de)
            .lte("data", data.ate),
        "amazon sb",
      ).catch(() => null),
      fetchAll(
        () =>
          c
            .from("fact_amazon_ads_sd_campanha_dia")
            .select(
              "data,campaign_id,campaign_name,cost,sales,ntb_sales_clicks,ntb_purchases_clicks",
            )
            .gte("data", data.de)
            .lte("data", data.ate),
        "amazon sd",
      ).catch(() => null),
      // Amazon DSP: fora de vw_ads_por_tipo_dia (só tem Sponsored); entra como canal próprio. Sem a tabela, fica de fora.
      fetchAll(
        () =>
          c
            .from("vw_amazon_dsp_dia")
            .select(
              "data,order_id,order_name,line_item_id,line_item_name,status,investimento,impressoes,cliques,compras,unidades,receita,fonte",
            )
            .gte("data", data.de)
            .lte("data", data.ate),
        "amazon dsp",
      ).catch(() => null),
    ]);
    const amazonNtb =
      sbNtb || sdNtb ? novosParaMarca(sbNtb ?? [], sdNtb ?? [], data.de, data.ate) : null;
    return {
      tipos,
      funil,
      amazonNtb,
      painel: linhasMidiaGeral([...tipos, ...dspPorDia(dsp ?? [])]),
    };
  });

export async function dadosGoogle(data: { de: string; ate: string }) {
  const c = await db();
  const erros: Record<string, string> = {};
  const safe = async (nome: string, p: Promise<Record<string, unknown>[]>) => {
    try {
      return await p;
    } catch (e) {
      erros[nome] = e instanceof Error ? e.message : String(e);
      return [] as Record<string, unknown>[];
    }
  };
  const hoje = hojeSP();
  const ontem = diasAtrasSP(1);
  const [
    dias,
    lista,
    intraday,
    produtos,
    variantes,
    custosR,
    negativar,
    graduar,
    keywords,
    assets,
    sessoes,
    pedidosPag,
    paginas,
    grupos,
  ] = await Promise.all([
    safe(
      "campanhas",
      fetchAll(
        () =>
          c
            .from("vw_google_campanha_dia")
            .select(
              "data,campaign_id,campaign_name,tipo,gasto,receita,receita_shopify,impressoes,cliques,conversoes,fatia_impressao,fatia_topo,fatia_perdida_orcamento,fatia_perdida_rank",
            )
            .gte("data", data.de)
            .lte("data", data.ate),
        "google campanhas",
        60000,
      ),
    ),
    safe(
      "lista",
      fetchAll(
        () =>
          c
            .from("vw_google_campanha_lista")
            .select(
              "campaign_id,campaign_name,tipo,status,target_roas,target_cpa,optimization_score,orcamento_diario",
            ),
        "google lista",
      ),
    ),
    safe(
      "intraday",
      fetchAll(
        () =>
          c
            .from("vw_google_intraday_campanha")
            .select("data,campaign_id,campaign_name,gasto,captured_at")
            .gte("data", ontem)
            .lte("data", hoje),
        "google intraday",
        30000,
      ),
    ),
    safe(
      "produtos",
      fetchAll(
        () =>
          c
            .from("vw_google_produto_dia")
            .select("data,product_item_id,product_title,gasto,receita,conversoes,cliques")
            .gte("data", data.de)
            .lte("data", data.ate),
        "google produtos",
        120000,
      ),
    ),
    safe(
      "variantes",
      fetchAll(
        () =>
          c
            .from("stg_shopify_products_variant")
            .select(
              "product_variant_id,product_variant_sku,product_variant_inventory_item_sku,product_variant_price,date",
            )
            .order("date", { ascending: false }),
        "shopify variantes",
        30000,
      ),
    ),
    safe(
      "custos",
      fetchAll(
        () => c.from("dim_custo_sku").select("sku,custo_unitario,vigencia_inicio"),
        "custos",
      ),
    ),
    safe(
      "negativar",
      fetchAll(
        () =>
          c
            .from("vw_gads_termos_negativar")
            .select("campanha,termo,cliques,invest_desperdicado,sugestao")
            .order("invest_desperdicado", { ascending: false }),
        "google negativar",
        1000,
      ),
    ),
    safe(
      "graduar",
      fetchAll(
        () =>
          c
            .from("vw_gads_termos_graduar")
            .select("campanha,termo,cliques,conversoes,invest,receita,roas,sugestao")
            .order("receita", { ascending: false }),
        "google graduar",
        1000,
      ),
    ),
    safe(
      "keywords",
      fetchAll(
        () =>
          c
            .from("vw_gads_keywords_top")
            .select("campanha,keyword,match_type,quality_score,invest,receita,roas,sugestao")
            .order("invest", { ascending: false }),
        "google keywords",
        1000,
      ),
    ),
    safe(
      "assets",
      fetchAll(
        () =>
          c
            .from("vw_google_pmax_asset")
            .select(
              "campaign_id,campaign_name,asset_group_id,asset_group_name,asset_type,field_type,performance_label,status,texto,youtube_video_id",
            ),
        "google assets",
      ),
    ),
    safe(
      "sessoes",
      fetchAll(
        () =>
          c
            .from("fact_site_pagina_dia")
            .select("data,pagina_path,sessoes,sessoes_checkout")
            .gte("data", data.de)
            .lte("data", data.ate),
        "site sessoes",
        120000,
      ),
    ),
    safe(
      "pedidosPag",
      fetchAll(
        () =>
          c
            .from("mv_site_pedido_pagina_dia")
            .select("data,pagina_path,pedidos,receita")
            .gte("data", data.de)
            .lte("data", data.ate),
        "site pedidos por pagina",
        120000,
      ),
    ),
    safe(
      "paginas",
      fetchAll(
        () => c.from("vw_site_pagina").select("pagina_path,tipo,rotulo,produto"),
        "site paginas",
      ),
    ),
    safe(
      "grupos",
      fetchAll(
        () =>
          c
            .from("vw_google_grupo_dia")
            .select(
              "data,campaign_id,campaign_name,tipo,ad_group_id,ad_group_name,gasto,receita,conversoes,impressoes,cliques",
            )
            .gte("data", data.de)
            .lte("data", data.ate),
        "google grupos",
        90000,
      ),
    ),
  ]);
  // Variantes: o mais recente de cada ID (a tabela pode ter fotos por data).
  const vistas = new Set<string>();
  const variantesUnicas = variantes.filter((v) => {
    const id = String(v["product_variant_id"] ?? "");
    if (!id || vistas.has(id)) return false;
    vistas.add(id);
    return true;
  });
  const campanhas = campanhasGoogle(dias, lista, data.de, data.ate);
  const prods = produtosGoogle(produtos, variantesUnicas, custosR, data.de, data.ate);
  const pags = paginasSite(sessoes, pedidosPag, paginas, data.de, data.ate);
  return {
    campanhas,
    ritmo: ritmoIntraday(intraday, lista),
    produtos: prods,
    termos: {
      negativar: negativar.slice(0, 30).map((x) => ({
        termo: String(x["termo"] ?? ""),
        campanha: String(x["campanha"] ?? ""),
        cliques: Number(x["cliques"]) || 0,
        semRetorno: Number(x["invest_desperdicado"]) || 0,
        sugestao: String(x["sugestao"] ?? ""),
      })),
      graduar: graduar.slice(0, 30).map((x) => ({
        termo: String(x["termo"] ?? ""),
        campanha: String(x["campanha"] ?? ""),
        conversoes: Number(x["conversoes"]) || 0,
        receita: Number(x["receita"]) || 0,
        roas: x["roas"] == null ? null : Number(x["roas"]),
        sugestao: String(x["sugestao"] ?? ""),
      })),
      keywords: keywords.slice(0, 30).map((x) => ({
        keyword: String(x["keyword"] ?? ""),
        correspondencia: String(x["match_type"] ?? "").toLowerCase(),
        qualidade: x["quality_score"] == null ? null : Number(x["quality_score"]),
        invest: Number(x["invest"]) || 0,
        roas: x["roas"] == null ? null : Number(x["roas"]),
        sugestao: String(x["sugestao"] ?? ""),
      })),
    },
    assets: assetsPmax(assets),
    painel: { linhas: linhasGoogle(dias, lista), itens: itensGoogle(grupos) },
    paginas: pags,
    alertas: alertasGoogle({
      campanhas,
      produtos: prods,
      termosNegativar: negativar,
      paginas: pags,
    }),
    erros,
  };
}

export const getGoogle = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => dadosGoogle(data));

// Meta Ads (benchmarks/meta-ads/ANALISE.md §4). As views vw_meta_criativos, _fadiga, _publicos, _posicionamento,
// _demografia, _horario e _funil têm janela própria (sem coluna de data); a reconciliação e o intraday usam o período.
export async function dadosMeta(data: { de: string; ate: string }) {
  const c = await db();
  const erros: Record<string, string> = {};
  const safe = async (nome: string, p: Promise<Record<string, unknown>[]>) => {
    try {
      return await p;
    } catch (e) {
      erros[nome] = e instanceof Error ? e.message : String(e);
      return [] as Record<string, unknown>[];
    }
  };
  const hoje = hojeSP();
  const de8 = diasAtrasSP(8);
  const [
    recon,
    criativos,
    fadiga,
    formatos,
    publicos,
    posic,
    demog,
    horario,
    funil,
    intraday,
    kpi,
    campDia,
    campConfig,
    adsDia,
  ] = await Promise.all([
    safe(
      "reconciliacao",
      fetchAll(
        () =>
          c
            .from("vw_reconciliacao_shopify_meta_dia")
            .select(
              "data,gasto_meta,receita_informada_meta,receita_meta_utm,compras_informadas_meta,pedidos_meta_utm,enviados_meta,pedidos_totais",
            )
            .gte("data", data.de)
            .lte("data", data.ate),
        "meta reconciliacao",
      ),
    ),
    safe(
      "criativos",
      fetchAll(
        () =>
          c
            .from("vw_meta_criativos")
            .select(
              "criativo,titulo,campanha,grupo,publico,invest,receita,roas,ctr_pct,hook_pct,frequencia,compras,sugestao",
            ),
        "meta criativos",
      ),
    ),
    safe(
      "fadiga",
      fetchAll(
        () =>
          c
            .from("vw_meta_fadiga")
            .select("criativo,publico,diagnostico,freq_7d,freq_ant,roas_7d,roas_ant,invest_7d"),
        "meta fadiga",
      ),
    ),
    safe(
      "formatos",
      fetchAll(
        () =>
          c
            .from("vw_meta_criativo_formato")
            .select("formato,criativos,invest,receita,roas,ctr_pct"),
        "meta formatos",
      ),
    ),
    safe(
      "publicos",
      fetchAll(
        () => c.from("vw_meta_publicos").select("publico,grupo,invest,receita,roas,ctr_pct"),
        "meta publicos",
      ),
    ),
    safe(
      "posicionamento",
      fetchAll(
        () =>
          c
            .from("vw_meta_posicionamento")
            .select("plataforma,posicionamento,dispositivo,invest,receita,roas,ctr_pct"),
        "meta posicionamento",
      ),
    ),
    safe(
      "demografia",
      fetchAll(
        () => c.from("vw_meta_demografia").select("faixa_idade,genero,invest,receita,roas,ctr_pct"),
        "meta demografia",
      ),
    ),
    safe(
      "horario",
      fetchAll(
        () => c.from("vw_meta_horario").select("hora,invest,receita,roas,ctr_pct"),
        "meta horario",
      ),
    ),
    safe(
      "funil",
      fetchAll(
        () => c.from("vw_meta_funil").select("ord,etapa,valor,taxa_passagem,cpa"),
        "meta funil",
      ),
    ),
    safe(
      "intraday",
      fetchAll(
        () => c.from("vw_meta_intraday").select("data,gasto,receita,captured_at").gte("data", hoje),
        "meta intraday",
      ),
    ),
    safe(
      "kpi",
      fetchAll(
        () =>
          c.from("vw_meta_kpi_dia").select("data,gasto,receita").gte("data", de8).lte("data", hoje),
        "meta kpi dia",
      ),
    ),
    // Painel por campanha (abre por anúncio).
    safe(
      "campanhas",
      fetchAll(
        () =>
          c
            .from("vw_meta_campanha_diario")
            .select(
              "data,campaign_id,campaign_name,objetivo,gasto,receita,compras,impressoes,cliques",
            )
            .gte("data", data.de)
            .lte("data", data.ate),
        "meta campanhas dia",
        60000,
      ),
    ),
    safe(
      "campanhasConfig",
      fetchAll(
        () =>
          c
            .from("vw_meta_campanha_config")
            .select("campaign_id,campaign_name,objetivo,effective_status,configured_status"),
        "meta campanhas config",
      ),
    ),
    safe(
      "anuncios",
      fetchAll(
        () =>
          c
            .from("vw_meta_ad_diario")
            .select(
              "data,campaign_id,campaign_name,objetivo,ad_id,ad_name,adset_name,gasto,receita,compras,impressoes,cliques",
            )
            .gte("data", data.de)
            .lte("data", data.ate),
        "meta anuncios dia",
        90000,
      ),
    ),
  ]);
  const reconciliacao = reconciliacaoMeta(recon, data.de, data.ate);
  const cr = criativosMeta(criativos, fadiga, formatos);
  const ritmo = ritmoMeta(intraday, kpi);
  return {
    reconciliacao,
    criativos: cr,
    segmentos: segmentosMeta(publicos, posic, demog, horario),
    painel: { linhas: linhasMeta(campDia, campConfig), itens: itensMeta(adsDia) },
    funil: funilMeta(funil),
    ritmo,
    alertas: alertasMeta({ recon: reconciliacao, criativos: cr, ritmo }),
    erros,
  };
}

export const getMeta = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => dadosMeta(data));
