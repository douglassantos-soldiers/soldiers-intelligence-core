// Leituras da Soldiers Platform — Command Center: problemas e oportunidades (cap. 28), juntando os alertas de cada módulo.
// Somente leitura de objetos JÁ EXISTENTES no Supabase. data.functions.ts reexporta as server functions.
import { diasAtrasSP, hojeSP, somaDias } from "@/lib/datas";
import { createServerFn } from "@tanstack/react-start";
import { skusEmAlta } from "@/lib/aggregate";
import { alertasMeta } from "@/lib/metaads";
import { alertasGoogle } from "@/lib/google";
import { alertasShopee } from "@/lib/shopee";
import { alertasML } from "@/lib/mercadolivre";
import { alertasCRM } from "@/lib/crm";
import { estoqueFba } from "@/lib/amazon-operacao";
import { asin360, termosAds, shareDeBusca, organicoVsAds, alertasAmazon } from "@/lib/amazon";
import { db, fetchAll } from "@/lib/db-helpers";
import {
  dadosTikTokAds,
  dadosMeliDsp,
  dadosAfiliados,
  dadosMidiaSku,
  dadosDevolucoes,
} from "@/lib/canais.functions";
import { dadosAtribuicao } from "@/lib/clientes.functions";
import { dadosInteligencia } from "@/lib/inteligencia.functions";
import { dadosAffiliateOS } from "@/lib/affiliateos.functions";
import { dadosCriativos } from "@/lib/criativos360.functions";
import { dadosFechamento, mesAnterior } from "@/lib/fechamento.functions";
import { dadosGoogle, dadosMeta } from "@/lib/media.functions";
import { dadosCrm } from "@/lib/crm.functions";
import { dadosMercadoLivre, dadosShopee } from "@/lib/marketplace.functions";

const menosDiasIso = (iso: string, d: number) => somaDias(iso, -d);

/* ---------------- Command Center: problemas e oportunidades (cap. 28) ---------------- */
export const getAlertas = createServerFn({ method: "GET" }).handler(async () => {
  const c = await db();
  const hoje = hojeSP();
  const desde = diasAtrasSP(27);
  const [estoque, saude, abb, acoes, prod] = await Promise.all([
    // Estoque do site com menor cobertura (só SKUs com venda: media_diaria > 0).
    c
      .from("dim_shopify_produto")
      .select("sku,title,estoque,cobertura_dias,alerta,media_diaria")
      .gt("media_diaria", 0)
      .order("cobertura_dias", { ascending: true })
      .limit(5),
    Promise.all(
      ["vw_saude_shopify", "vw_saude_ml", "vw_saude_amazon"].map((v) =>
        c.from(v).select("canal,severidade"),
      ),
    ),
    c.from("vw_abb_resumo").select("perdendo_concorrente,suprimida,em_risco").limit(1),
    c.from("mv_growth_acao_resumo").select("acao,clientes,valor_esperado"),
    fetchAll(
      () =>
        c
          .from("mv_produto_dia")
          .select("data,sku,produto,receita")
          .gte("data", desde)
          .lte("data", hoje),
      "produtos 28d",
      60000,
    ),
  ]);
  const problemasDados = saude.flatMap((r) => (r.data ?? []) as Record<string, unknown>[]);
  // Amazon, últimos 14 dias. Um erro aqui só esconde os alertas da Amazon.
  let amazon: ReturnType<typeof alertasAmazon> = [];
  try {
    const de14 = diasAtrasSP(13);
    const [vendasA, bb, est, rep, cad, termosR, brand] = await Promise.all([
      fetchAll(
        () =>
          c
            .from("fact_amazon_venda_asin_dia")
            .select("data,child_asin,vendas,unidades,sessoes,buybox_pct")
            .gte("data", de14)
            .lte("data", hoje),
        "amazon asin",
        60000,
      ),
      fetchAll(
        () =>
          c
            .from("dim_amazon_buybox")
            .select("asin,ganho_buybox,concorrente_no_bb,meu_preco,menor_preco_concorrente"),
        "amazon buybox",
      ),
      fetchAll(
        () =>
          c.from("dim_amazon_estoque_sp").select("asin,seller_sku,fulfillable,imprestavel_vencido"),
        "amazon estoque",
      ),
      fetchAll(
        () => c.from("dim_amazon_reposicao").select("sku,asin,titulo,em_fba,cobertura_dias"),
        "amazon reposicao",
      ),
      fetchAll(() => c.from("dim_amazon_cadastro").select("asin,titulo"), "amazon cadastro"),
      fetchAll(
        () =>
          c
            .from("fact_amazon_ads_search_term_dia")
            .select(
              "data,campaign_name,search_term,keyword_text,match_type,cost,clicks,purchases_14d,sales_14d",
            )
            .gte("data", de14)
            .lte("data", hoje),
        "amazon search terms",
        90000,
      ),
      fetchAll(
        () =>
          c
            .from("fact_amazon_brand_search_term")
            .select("semana_fim,termo,nosso,click_share,conversion_share,rank_busca")
            .gte("semana_fim", menosDiasIso(hoje, 35)),
        "amazon brand",
        60000,
      ),
    ]);
    amazon = alertasAmazon({
      asins: asin360(vendasA, bb, est, rep, cad, de14, hoje),
      termos: termosAds(termosR, de14, hoje),
      share: shareDeBusca(brand, { top: Infinity }),
      organico: organicoVsAds(brand, termosR, de14, hoje),
      vencidoFba: estoqueFba(est, rep).totais.vencido,
    });
  } catch {
    amazon = [];
  }
  // Mercado Livre, últimos 14 dias (mesma regra da tela). Um erro aqui só esconde os alertas do ML.
  let mercadoLivre: ReturnType<typeof alertasML> = [];
  try {
    mercadoLivre = (await dadosMercadoLivre({ de: diasAtrasSP(13), ate: hoje })).alertas;
  } catch {
    mercadoLivre = [];
  }
  let shopee: ReturnType<typeof alertasShopee> = [];
  try {
    shopee = (await dadosShopee({ de: diasAtrasSP(13), ate: hoje })).alertas;
  } catch {
    shopee = [];
  }
  let google: ReturnType<typeof alertasGoogle> = [];
  try {
    google = (await dadosGoogle({ de: diasAtrasSP(13), ate: hoje })).alertas;
  } catch {
    google = [];
  }
  // Telas novas (TikTok Ads, Meli DSP, afiliados, mídia × estoque, devoluções): em paralelo; erro só esconde o bloco.
  type Alerta = {
    tipo: "problema" | "oportunidade";
    tag: string;
    tom: "danger" | "warn" | "success" | "primary";
    texto: string;
  };
  const p14 = { de: diasAtrasSP(13), ate: hoje };
  const p30 = { de: diasAtrasSP(29), ate: hoje };
  const so = (pr: Promise<{ alertas: Alerta[] }>) =>
    pr.then((x) => x.alertas).catch(() => [] as Alerta[]);
  const [
    tiktokAds,
    meliDsp,
    afiliados,
    midiaSku,
    devolucoes,
    atribuicao,
    inteligencia,
    affiliateOS,
    criativos,
    fechamento,
  ] = await Promise.all([
    so(dadosTikTokAds(p14)),
    so(dadosMeliDsp(p14)),
    so(dadosAfiliados(p30)),
    so(dadosMidiaSku(p14)),
    so(dadosDevolucoes(p30)),
    so(dadosAtribuicao(p30)),
    so(dadosInteligencia(p30)),
    so(dadosAffiliateOS({ foco: "Creatina" }, { coortes: false })),
    so(dadosCriativos(p14)),
    so(dadosFechamento({ mes: mesAnterior(), base: "faturamento_liquido" })),
  ]);
  let crm: ReturnType<typeof alertasCRM> = [];
  try {
    crm = (await dadosCrm({ de: diasAtrasSP(29), ate: hoje })).alertas;
  } catch {
    crm = [];
  }
  let meta: ReturnType<typeof alertasMeta> = [];
  try {
    meta = (await dadosMeta({ de: diasAtrasSP(13), ate: hoje })).alertas;
  } catch {
    meta = [];
  }
  return {
    amazon,
    mercadoLivre,
    shopee,
    google,
    meta,
    crm,
    tiktokAds,
    meliDsp,
    afiliados,
    midiaSku,
    devolucoes,
    atribuicao,
    inteligencia,
    affiliateOS,
    criativos,
    fechamento,
    estoque: (estoque.data ?? []) as Record<string, unknown>[],
    problemasDados: problemasDados.length,
    buybox: (abb.data?.[0] ?? null) as Record<string, unknown> | null,
    acoes: (acoes.data ?? []) as Record<string, unknown>[],
    // Calculado no servidor para não mandar 28 dias de linhas por SKU ao navegador.
    skusEmAlta: skusEmAlta(prod, hoje),
  };
});
