// Leituras das telas de TikTok Ads, Meli DSP, Afiliados (Creator 360), Mídia × estoque × margem
// e Devoluções/ranking. Só leitura de objetos que JÁ existem; cálculos nos módulos de src/lib.
// Cada leitura passa por safe(): uma view com erro só esvazia o bloco dela e aparece em `erros`.
import { createServerFn } from "@tanstack/react-start";
import { db, fetchAll, Periodo } from "@/lib/db-helpers";
import {
  resumoTikTokAds,
  campanhasTikTok,
  produtosTikTokAds,
  criativosTikTok,
  alertasTikTokAds,
} from "@/lib/tiktokads";
import { resumoMeliDsp, campanhasMeliDsp, criativosMeliDsp, alertasMeliDsp } from "@/lib/melidsp";
import {
  afiliadosPorCanal,
  creators360,
  concentracao,
  produtosAfiliado,
  alertasAfiliados,
  tagsDinamicas,
  contagemTags,
} from "@/lib/afiliados";
import { midiaPorSku, ritmoCanais, alertasMidiaSku } from "@/lib/midiasku";
import {
  devolucoesPorCanal,
  motivosDevolucao,
  rankingML,
  alertasDevolucoes,
  periodoAnterior,
} from "@/lib/devolucoes";

type Rows = Record<string, unknown>[];
type P = { de: string; ate: string };

function coletor() {
  const erros: Record<string, string> = {};
  const safe = async (nome: string, p: Promise<Rows>) => {
    try {
      return await p;
    } catch (e) {
      erros[nome] = e instanceof Error ? e.message : String(e);
      return [] as Rows;
    }
  };
  return { erros, safe };
}
const menos = (iso: string, d: number) =>
  new Date(Date.parse(iso + "T00:00:00Z") - d * 86400000).toISOString().slice(0, 10);

/* ---------------- TikTok Ads ---------------- */
export async function dadosTikTokAds(p: P) {
  const c = await db();
  const { erros, safe } = coletor();
  // Busca 14 dias antes do início para a comparação de 7 dias e a base da anomalia.
  const de = menos(p.de, 14);
  const [tipo, camp, gmv, prod, cri, est] = await Promise.all([
    safe(
      "tipos",
      fetchAll(
        () =>
          c
            .from("vw_tiktok_ads_por_tipo_dia")
            .select("data,tipo,invest,receita,pedidos")
            .gte("data", de)
            .lte("data", p.ate),
        "tiktok ads tipo",
      ),
    ),
    safe(
      "campanhas",
      fetchAll(
        () =>
          c
            .from("vw_tiktok_ads_campanha_dia")
            .select("data,campaign_id,campanha,tipo,invest,receita,pedidos,sugestao")
            .gte("data", de)
            .lte("data", p.ate),
        "tiktok ads campanhas",
        60000,
      ),
    ),
    safe(
      "gmvMax",
      fetchAll(
        () =>
          c
            .from("vw_tiktok_ads_gmv_campanha_dia")
            .select("data,campaign_id,campanha,tipo,invest,invest_liquido,receita,pedidos,sugestao")
            .gte("data", de)
            .lte("data", p.ate),
        "tiktok ads gmv max",
        60000,
      ),
    ),
    safe(
      "produtos",
      fetchAll(
        () =>
          c
            .from("vw_tiktok_ads_produto_dia")
            .select("data,product_id,seller_sku,produto,invest,receita,pedidos")
            .gte("data", p.de)
            .lte("data", p.ate),
        "tiktok ads produtos",
        60000,
      ),
    ),
    safe(
      "criativos",
      fetchAll(
        () =>
          c
            .from("vw_tiktok_ads_criativo_dia")
            .select("data,item_id,produto,campanha,agregado,invest,receita,pedidos")
            .gte("data", p.de)
            .lte("data", p.ate),
        "tiktok ads criativos",
        90000,
      ),
    ),
    safe(
      "estoque",
      fetchAll(
        () => c.from("dim_tiktok_estoque").select("seller_sku,quantidade"),
        "tiktok estoque",
      ),
    ),
  ]);
  const resumo = resumoTikTokAds(tipo, p.de, p.ate);
  // A anomalia usa a série completa (com os 14 dias de base); o resto usa só o período.
  const comBase = resumoTikTokAds(tipo, de, p.ate);
  resumo.anomalia = comBase.anomalia;
  const criativos = criativosTikTok(cri, p.de, p.ate);
  const produtos = produtosTikTokAds(prod, est, p.de, p.ate);
  return {
    resumo,
    campanhas: campanhasTikTok(camp, gmv, p.de, p.ate),
    produtos,
    criativos,
    alertas: alertasTikTokAds({ resumo, criativos, produtos }),
    erros,
  };
}
export const getTikTokAds = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => dadosTikTokAds(data));

/* ---------------- Meli DSP ---------------- */
export async function dadosMeliDsp(p: P) {
  const c = await db();
  const { erros, safe } = coletor();
  const de = menos(p.de, 14);
  const cols =
    "investimento,impressoes,alcance,cliques,ppv,add_to_cart,checkout,unidades,receita,receita_tp,views_ativas,views_completas";
  const [kpi, camp, cri] = await Promise.all([
    safe(
      "kpi",
      fetchAll(
        () =>
          c.from("vw_ml_display_kpi_dia").select(`data,${cols}`).gte("data", de).lte("data", p.ate),
        "meli dsp kpi",
      ),
    ),
    safe(
      "campanhas",
      fetchAll(
        () =>
          c
            .from("vw_ml_display_campanha_dia")
            .select(`data,campaign_id,campaign_name,tipo,goal,status,${cols}`)
            .gte("data", p.de)
            .lte("data", p.ate),
        "meli dsp campanhas",
        60000,
      ),
    ),
    safe(
      "criativos",
      fetchAll(
        () =>
          c
            .from("vw_ml_display_criativo_dia")
            .select(
              `data,creative_id,creative_name,campaign_name,line_item_name,q25,q50,q75,q100,${cols}`,
            )
            .gte("data", p.de)
            .lte("data", p.ate),
        "meli dsp criativos",
        90000,
      ),
    ),
  ]);
  const resumo = resumoMeliDsp(kpi, p.de, p.ate);
  resumo.anomalia = resumoMeliDsp(kpi, de, p.ate).anomalia;
  const cp = campanhasMeliDsp(camp, p.de, p.ate);
  return {
    resumo,
    campanhas: cp.campanhas,
    mix: cp.mix,
    criativos: criativosMeliDsp(cri, p.de, p.ate),
    alertas: alertasMeliDsp({ resumo, mix: cp.mix }),
    erros,
  };
}
export const getMeliDsp = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => dadosMeliDsp(data));

/* ---------------- Afiliados: canais, Creator 360 e produtos ---------------- */
export async function dadosAfiliados(p: P) {
  const c = await db();
  const { erros, safe } = coletor();
  const r = (nome: string, tabela: string, cols: string, max = 30000) =>
    safe(
      nome,
      fetchAll(() => c.from(tabela).select(cols).gte("data", p.de).lte("data", p.ate), tabela, max),
    );
  const [ml, shopee, tiktok, inf, cupons, mlCre, mlProd, shProd, ttProd, up, upMes] =
    await Promise.all([
      r(
        "ml",
        "vw_ml_afiliado_dia",
        "data,gmv_afiliado,gmv_total,custo_afiliado,pedidos_afiliado,pedidos_total",
      ),
      r(
        "shopee",
        "vw_shopee_afiliado_dia",
        "data,gmv_afiliado,gmv_total,custo_afiliado,pedidos_afiliado,pedidos_total,margem_afiliado_pct,margem_sem_afiliado_pct",
      ),
      r(
        "tiktok",
        "vw_tiktok_afiliado_dia",
        "data,gmv_afiliado,gmv_total,custo_total,pedidos_afiliado,pedidos_total,margem_afiliado_pct,margem_sem_afiliado_pct",
      ),
      // Só nome público, @, tier e cupom; sem cidade/estado.
      r(
        "influenciadores",
        "vw_influenciador_360",
        "data,creator_id,nome,tiktok_username,tier,cupom,receita_site,receita_tiktok,pedidos_total,custo_dia,comissao_dia",
        90000,
      ),
      r(
        "cupons",
        "vw_site_cupom_dia",
        "data,cupom,pedidos,pedidos_cliente_novo,unidades,unidades_devolvidas,desconto,faturamento_bruto,faturamento_liquido",
        90000,
      ),
      r(
        "mlCreators",
        "vw_ml_afiliado_creator_dia",
        "data,afiliado_username,afiliado_nome,gmv,custo,pedidos",
        90000,
      ),
      r(
        "mlProdutos",
        "vw_ml_afiliado_produto_dia",
        "data,item_id,seller_sku,produto,gmv_afiliado,gmv_total,custo_afiliado",
        90000,
      ),
      r(
        "shopeeProdutos",
        "vw_shopee_afiliado_produto_dia",
        "data,item_id,item_sku,produto,gmv_afiliado,gmv_total,custo_afiliado",
        90000,
      ),
      r(
        "tiktokProdutos",
        "vw_tiktok_afiliado_produto_dia",
        "data,seller_sku,produto,gmv_afiliado,gmv_total,custo_afiliado",
        90000,
      ),
      safe(
        "upAfiliados",
        fetchAll(
          () =>
            c.from("vw_up_afiliado").select("uppromote_id,nome,cupom,comissao_pct,programa,status"),
          "uppromote",
        ),
      ),
      safe(
        "upMes",
        fetchAll(
          () =>
            c
              .from("vw_up_afiliado_mes")
              .select("uppromote_id,mes,receita,pedidos,pedidos_cliente_novo")
              .gte("mes", p.de.slice(0, 7) + "-01")
              .lte("mes", p.ate),
          "uppromote mes",
        ),
      ),
    ]);
  const canais = afiliadosPorCanal({ ml, shopee, tiktok }, p.de, p.ate);
  const creators = creators360(
    { influenciadores: inf, cuponsSite: cupons, mlCreators: mlCre, upAfiliados: up, upMes },
    p.de,
    p.ate,
    p.ate,
  );
  const conc = concentracao(creators);
  const comTags = tagsDinamicas(creators);
  return {
    canais,
    creators: comTags.slice(0, 500),
    tags: contagemTags(comTags),
    totalCreators: creators.length,
    concentracao: conc,
    produtos: produtosAfiliado({ ml: mlProd, shopee: shProd, tiktok: ttProd }, p.de, p.ate).slice(
      0,
      200,
    ),
    alertas: alertasAfiliados({ canais, creators, concentracao: conc }),
    erros,
  };
}
export const getAfiliadosCreators = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => dadosAfiliados(data));

/* ---------------- Mídia × estoque × margem ---------------- */
export async function dadosMidiaSku(p: P) {
  const c = await db();
  const { erros, safe } = coletor();
  const [produtos, custos, pl, site, fba, funil] = await Promise.all([
    safe(
      "produtos",
      fetchAll(
        () =>
          c
            .from("mv_produto_dia")
            .select("data,canal,sku,produto,unidades,receita,invest_ads,receita_ads")
            .gte("data", p.de)
            .lte("data", p.ate),
        "produtos",
        90000,
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
      "pl",
      fetchAll(
        () =>
          c
            .from("mv_pl_canal_dia")
            .select("data,canal,receita_bruta,custo_canal,imposto")
            .gte("data", p.de)
            .lte("data", p.ate),
        "pl canal",
      ),
    ),
    safe(
      "estoqueSite",
      fetchAll(() => c.from("dim_shopify_produto").select("sku,cobertura_dias"), "estoque site"),
    ),
    safe(
      "fba",
      fetchAll(() => c.from("dim_amazon_reposicao").select("sku,em_fba,cobertura_dias"), "fba"),
    ),
    safe(
      "funil",
      fetchAll(
        () =>
          c
            .from("vw_ads_funil_canal_dia")
            .select("data,canal,invest,receita_ads")
            .gte("data", menos(p.de, 14))
            .lte("data", p.ate),
        "ads funil",
      ),
    ),
  ]);
  const skus = midiaPorSku({ produtos, custos, pl, estoqueSite: site, fba }, p.de, p.ate);
  const ritmo = ritmoCanais(funil, p.de, p.ate);
  return {
    skus: skus.slice(0, 300),
    totalSkus: skus.length,
    ritmo,
    alertas: alertasMidiaSku({ skus, ritmo }),
    erros,
  };
}
export const getMidiaSku = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => dadosMidiaSku(data));

/* ---------------- Devoluções, cancelamentos e ranking ---------------- */
export async function dadosDevolucoes(p: P) {
  const c = await db();
  const { erros, safe } = coletor();
  const de = periodoAnterior(p.de, p.ate).de;
  const r = (nome: string, tabela: string, cols: string, col = "data") =>
    safe(
      nome,
      fetchAll(() => c.from(tabela).select(cols).gte(col, de).lte(col, p.ate), tabela, 60000),
    );
  const [site, amazon, ml, shopee, tiktok, ttDev, ttDevFato, ttCanc, ranking] = await Promise.all([
    r("site", "vw_site_geral_dia", "data,pedidos,unidades,unidades_devolvidas"),
    r("amazon", "vw_amazon_geral_dia", "data,pedidos,unidades,unidades_devolvidas"),
    r("ml", "vw_ml_frete_dia", "data,pedidos,pedidos_cancelados,faturamento_cancelado"),
    r(
      "shopee",
      "fact_shopee_venda_dia",
      "data,pedidos,pedidos_cancelados,faturamento_cancelado,frete_reverso",
    ),
    r("tiktok", "vw_tiktok_geral_dia", "data,pedidos,pedidos_cancelados"),
    r("tiktokDevolucoes", "vw_tiktok_devolucao_dia", "data,pedidos,devolucoes,valor_reembolso"),
    // Sem order_id: só motivo, dia e valor.
    safe(
      "motivos",
      fetchAll(
        () =>
          c
            .from("fact_tiktok_devolucao")
            .select("dia,motivo,valor_reembolso")
            .gte("dia", p.de)
            .lte("dia", p.ate),
        "tiktok devolucoes",
        60000,
      ),
    ),
    safe(
      "cancelamentosTikTok",
      fetchAll(
        () =>
          c.from("vw_ttk_cancelamentos").select("motivo,iniciador,pedidos,share_pct,valor_perdido"),
        "tiktok cancelamentos",
      ),
    ),
    safe(
      "ranking",
      fetchAll(
        () =>
          c
            .from("vw_ml_ranking_atual")
            .select(
              "categoria,mes,nome,alias,tipo,posicao,posicao_consolidada,share_pct,crescimento,receita_periodo,receita_acum,unidades_periodo,unidades_acum",
            ),
        "ml ranking",
      ),
    ),
  ]);
  const canais = devolucoesPorCanal(
    { site, amazon, ml, shopee, tiktok, tiktokDev: ttDev },
    p.de,
    p.ate,
  );
  const rk = rankingML(ranking);
  return {
    canais,
    motivos: motivosDevolucao(ttDevFato, p.de, p.ate),
    cancelamentosTikTok: ttCanc.map((x) => ({
      motivo: String(x["motivo"] ?? ""),
      iniciador: String(x["iniciador"] ?? ""),
      pedidos: Number(x["pedidos"]) || 0,
      sharePct: Number(x["share_pct"]) || 0,
      valorPerdido: Number(x["valor_perdido"]) || 0,
    })),
    ranking: rk,
    alertas: alertasDevolucoes({ canais, ranking: rk }),
    erros,
  };
}
export const getDevolucoes = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => dadosDevolucoes(data));
