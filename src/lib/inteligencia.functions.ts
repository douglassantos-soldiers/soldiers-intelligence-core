// Leituras da tela Intelligence: Channel Intelligence, Matriz Produto × Canal, previsão de demanda e estoque
// por local e experimentos. Só leitura. Cálculos em src/lib/inteligencia.ts.
import { hojeSP, diasAtrasSP } from "@/lib/datas";
import { createServerFn } from "@tanstack/react-start";
import { db, fetchAll, Periodo } from "@/lib/db-helpers";
import {
  channelIntelligence,
  matrizProdutoCanal,
  previsaoEstoque,
  resultadosExperimentos,
  alertasInteligencia,
  PREVISAO,
} from "@/lib/inteligencia";

type Rows = Record<string, unknown>[];
const menos = (iso: string, d: number) =>
  new Date(Date.parse(iso + "T00:00:00Z") - d * 86400000).toISOString().slice(0, 10);

export async function dadosInteligencia(p: { de: string; ate: string }) {
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
      else erros[nome] = msg;
      return [] as Rows;
    }
  };
  const hoje = hojeSP();
  const dias = Math.round((Date.parse(p.ate) - Date.parse(p.de)) / 86400000) + 1;
  const deAnt = menos(p.de, dias);
  const deProd = [p.de, menos(hoje, 2 * PREVISAO.janelaLonga)].sort()[0]!;
  const [
    pl,
    receita,
    cac,
    origem,
    produtos,
    custos,
    site,
    fba,
    mlFull,
    shopee,
    tiktok,
    exps,
    grupos,
  ] = await Promise.all([
    safe(
      "pl",
      fetchAll(
        () =>
          c
            .from("mv_pl_canal_dia")
            .select("data,canal,receita_bruta,margem_contribuicao,ads,custo_canal,imposto")
            .gte("data", deAnt)
            .lte("data", p.ate),
        "pl canal",
        60000,
      ),
    ),
    safe(
      "pedidos",
      fetchAll(
        () =>
          c
            .from("fact_receita_diaria")
            .select("data,canal_venda,pedidos")
            .gte("data", p.de)
            .lte("data", p.ate),
        "receita diaria",
        60000,
      ),
    ),
    safe(
      "cac",
      fetchAll(
        () => c.from("mv_growth_cac_cohort").select("canal,mes,novos,invest_aquisicao"),
        "cac",
      ),
    ),
    safe(
      "origem",
      fetchAll(
        () =>
          c.from("mv_growth_origem_canal").select("canal_entrada,clientes,ltv_medio,pct_recompra"),
        "origem canal",
      ),
    ),
    safe(
      "produtos",
      fetchAll(
        () =>
          c
            .from("mv_produto_dia")
            .select("data,canal,sku,produto,unidades,receita,invest_ads")
            .gte("data", deProd)
            .lte("data", p.ate > hoje ? hoje : p.ate),
        "produtos",
        150000,
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
      "estoqueSite",
      fetchAll(() => c.from("dim_shopify_produto").select("sku,estoque"), "estoque site"),
    ),
    safe(
      "estoqueFba",
      fetchAll(
        () => c.from("dim_amazon_estoque_sp").select("seller_sku,fulfillable"),
        "estoque fba",
      ),
    ),
    safe(
      "estoqueMlFull",
      fetchAll(
        () => c.from("dim_ml_estoque_full").select("seller_sku,disponivel"),
        "estoque ml full",
      ),
    ),
    safe(
      "estoqueShopee",
      fetchAll(
        () => c.from("dim_shopee_estoque").select("model_sku,item_sku,estoque_normal"),
        "estoque shopee",
      ),
    ),
    safe(
      "estoqueTikTok",
      fetchAll(
        () => c.from("dim_tiktok_estoque").select("seller_sku,quantidade"),
        "estoque tiktok",
      ),
    ),
    safe(
      "experimentos",
      fetchAll(
        () =>
          c
            .from("experimento")
            .select(
              "id,titulo,hipotese,area,metrica_principal,inicio,fim,status,decisao,aprendizado",
            ),
        "experimentos",
      ),
      true,
    ),
    safe(
      "grupos",
      fetchAll(
        () =>
          c
            .from("experimento_grupo")
            .select("experimento_id,grupo,descricao,participantes,convertidos,receita"),
        "grupos",
      ),
      true,
    ),
  ]);
  const canais = channelIntelligence({ pl, receita, cac, origem }, p.de, p.ate);
  const estoque = previsaoEstoque({ produtos, site, fba, mlFull, shopee, tiktok }, hoje);
  const experimentos = resultadosExperimentos(exps, grupos);
  return {
    canais,
    matriz: matrizProdutoCanal({ produtos, custos, pl }, p.de, p.ate),
    estoque: {
      linhas: estoque.linhas.slice(0, 300),
      total: estoque.linhas.length,
      backtest: estoque.backtest,
    },
    experimentos,
    migracaoPendente,
    alertas: alertasInteligencia({ canais, estoque: estoque.linhas, experimentos }),
    erros,
  };
}

export const getInteligencia = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => dadosInteligencia(data));
