// Leituras da Soldiers Platform — Marketplaces: saúde, TikTok Shop, Amazon, Mercado Livre e Shopee.
// Somente leitura de objetos JÁ EXISTENTES no Supabase. data.functions.ts reexporta as server functions.
import { hojeSP, somaDias } from "@/lib/datas";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { economiaTikTok, devolucoesPorMotivo, saudeListings } from "@/lib/tiktok";
import {
  economiaShopee,
  cancelamentosShopee,
  adsShopee,
  adsPorHora,
  produtosShopee,
  livesShopee,
  alertasShopee,
} from "@/lib/shopee";
import { economiaML, anuncios360, diagnosticoAds, alertasML } from "@/lib/mercadolivre";
import {
  tendenciaSemanal,
  hojeAteAgora,
  buyBoxCompleto,
  qualidadeAnuncio,
  estoqueFba,
  sbParaTermos,
  sdPorProduto,
  campanhasNoLimite,
  pedidosAmazon,
} from "@/lib/amazon-operacao";
import { adsUnificados, adsPorSemana } from "@/lib/amazon";
import {
  linhasMlProductAds,
  linhasMlDisplay,
  linhasMlBrand,
  linhasAmazon,
  itensAmazon,
  linhasShopee,
  linhasAmazonDsp,
  itensAmazonDsp,
} from "@/lib/painel-ads";
import {
  resumoAmazon,
  asin360,
  termosAds,
  shareDeBusca,
  reposicaoFba,
  recompraAsin,
  organicoVsAds,
  vendasPorHora,
  alvosKeywords,
  alvosSd,
  classificaLances,
} from "@/lib/amazon";
import { db, fetchAll, fetchIn } from "@/lib/db-helpers";

const menorData = (a: string, b: string) => (a < b ? a : b);
const menosDiasIso = (iso: string, d: number) => somaDias(iso, -d);
const Periodo = z.object({
  de: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/* ---------------- Marketplace health ---------------- */
// Resumo de Buy Box da Amazon (Plano Mestre cap. 9.5). Linha única com a contagem de ASINs.
export const getMarketplaceSaude = createServerFn({ method: "GET" }).handler(async () => {
  const c = await db();
  const abb = await c
    .from("vw_abb_resumo")
    .select("asins,ganha_bb,perdendo_concorrente,com_concorrente,em_risco,suprimida,atualizado")
    .limit(1);
  return { buybox: (abb.error ? null : (abb.data?.[0] ?? null)) as Record<string, unknown> | null };
});

/* ---------------- TikTok Shop: economia (Plano Mestre cap. 14; benchmarks/tiktok-shop) ----------------
 * Lucro real por pedido a partir do extrato, estimado × liquidado, descontos do TikTok × Soldiers,
 * amostras, devoluções e saúde dos anúncios. LGPD: de tiktok_pedido só saem colunas sem dado pessoal
 * (nada de e-mail, telefone, CPF ou endereço). Tokens nunca são lidos. */
export const getTikTokEconomia = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => {
    const c = await db();
    const [pedidos, itens, fin, custos, devs, produtos] = await Promise.all([
      fetchAll(
        () =>
          c
            .from("tiktok_pedido")
            .select("order_id,create_dia,status,is_sample_order")
            .gte("create_dia", data.de)
            .lte("create_dia", data.ate),
        "tiktok pedidos",
        60000,
      ),
      fetchAll(
        () =>
          c
            .from("tiktok_pedido_item")
            .select(
              "order_id,create_dia,status,seller_sku,product_name,sale_price,platform_discount,seller_discount",
            )
            .gte("create_dia", data.de)
            .lte("create_dia", data.ate),
        "tiktok itens",
        90000,
      ),
      // Todas as linhas de extrato dos pedidos do período, inclusive estornos em extratos posteriores.
      fetchAll(
        () =>
          c
            .from("fact_tiktok_financeiro")
            .select(
              "order_id,order_dia,statement_dia,settlement,comissao_plataforma,comissao_afiliado,comissao_afiliado_ads,comissao_parceiro,taxa_referral,taxa_transacao,frete_custo,imposto,reembolso",
            )
            .gte("order_dia", data.de)
            .lte("order_dia", data.ate),
        "tiktok extrato",
        90000,
      ),
      fetchAll(
        () => c.from("dim_custo_sku").select("sku,custo_unitario,vigencia_inicio"),
        "custos",
      ).then((data) => ({ data })),
      fetchAll(
        () =>
          c
            .from("fact_tiktok_devolucao")
            .select("dia,motivo,valor_reembolso,status")
            .gte("dia", data.de)
            .lte("dia", data.ate),
        "tiktok devolucoes",
      ),
      fetchAll(
        () =>
          c
            .from("dim_tiktok_produto")
            .select(
              "product_id,titulo,status,nao_a_venda,skus_sem_estoque,faltas,tem_peso,tem_dimensoes,health,estoque_total",
            ),
        "tiktok produtos",
      ).then((data) => ({ data })),
    ]);
    return {
      economia: economiaTikTok(
        pedidos,
        itens,
        fin,
        (custos.data ?? []) as Record<string, unknown>[],
        data.de,
        data.ate,
      ),
      devolucoes: devolucoesPorMotivo(devs, data.de, data.ate),
      listings: saudeListings((produtos.data ?? []) as Record<string, unknown>[]),
    };
  });

// Amazon (Plano Mestre caps. 9, 10, 13, 17; benchmarks/amazon/ANALISE.md §4): só dados já coletados.
// Cada bloco lê sua tabela de forma independente: se uma fila parou, o resto da tela continua.

export const getAmazon = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => {
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

    const [
      trafego,
      adsSp,
      adsSb,
      adsSd,
      vendas,
      buybox,
      estoque,
      reposicao,
      cadastro,
      termos,
      brand,
      recompra,
      horas,
      keywords,
      sdAlvos,
      semanas,
      intraday,
      sbTermos,
      sdProduto,
      campanhas,
      adsProduto,
      pedidos,
    ] = await Promise.all([
      safe(
        "trafego",
        fetchAll(
          () =>
            c
              .from("fact_amazon_venda_trafego_dia")
              .select("data,vendas,unidades,sessoes,buybox_pct,unidades_devolvidas,em_consolidacao")
              .gte("data", data.de)
              .lte("data", data.ate),
          "amazon trafego",
        ),
      ),
      // Ads: SP (campanha_dia) + SB + SD, 84 dias antes do fim para a tendência semanal; o resumo filtra o período.
      safe(
        "ads",
        fetchAll(
          () =>
            c
              .from("fact_amazon_ads_campanha_dia")
              .select(
                "data,ad_type,campaign_id,campaign_name,cost,sales_14d,sales_7d,units_14d,units_7d,clicks,impressions,top_search_is",
              )
              .gte("data", menorData(data.de, menosDiasIso(data.ate, 90)))
              .lte("data", data.ate),
          "amazon ads",
          120000,
        ),
      ),
      safe(
        "adsSb",
        fetchAll(
          () =>
            c
              .from("fact_amazon_ads_sb_campanha_dia")
              .select(
                "data,campaign_id,campaign_name,campaign_status,cost,sales,units_sold,clicks,impressions",
              )
              .gte("data", menorData(data.de, menosDiasIso(data.ate, 90)))
              .lte("data", data.ate),
          "amazon sb campanhas",
          60000,
        ),
      ),
      safe(
        "adsSd",
        fetchAll(
          () =>
            c
              .from("fact_amazon_ads_sd_campanha_dia")
              .select("data,campaign_id,campaign_name,cost,sales,units_sold,clicks,impressions")
              .gte("data", menorData(data.de, menosDiasIso(data.ate, 90)))
              .lte("data", data.ate),
          "amazon sd campanhas",
          60000,
        ),
      ),
      safe(
        "vendas",
        fetchAll(
          () =>
            c
              .from("fact_amazon_venda_asin_dia")
              .select("data,child_asin,vendas,unidades,sessoes,buybox_pct")
              .gte("data", data.de)
              .lte("data", data.ate),
          "amazon asin",
          90000,
        ),
      ),
      safe(
        "buybox",
        fetchAll(
          () =>
            c
              .from("dim_amazon_buybox")
              .select(
                "asin,ganho_buybox,concorrente_no_bb,meu_preco,menor_preco_concorrente,buybox_preco,buybox_fba,n_ofertas,n_concorrentes",
              ),
          "amazon buybox",
        ),
      ),
      safe(
        "estoque",
        fetchAll(
          () =>
            c
              .from("dim_amazon_estoque_sp")
              .select(
                "asin,seller_sku,product_name,fulfillable,imprestavel_total,imprestavel_vencido,imprestavel_danificado_armazem,imprestavel_danificado_cliente,imprestavel_defeito,reservado_total,reservado_pedido,reservado_transito,reservado_fc,inbound_working,inbound_shipped,inbound_receiving",
              ),
          "amazon estoque",
        ),
      ),
      safe(
        "reposicao",
        fetchAll(
          () =>
            c
              .from("dim_amazon_reposicao")
              .select(
                "sku,asin,titulo,em_fba,fba_disponivel,fba_a_caminho,media_diaria,cobertura_dias,enviar_30d,alerta",
              ),
          "amazon reposicao",
        ),
      ),
      safe(
        "cadastro",
        fetchAll(
          () =>
            c
              .from("dim_amazon_cadastro")
              .select(
                "asin,titulo,faltas,tem_aplus,health,n_fotos,n_bullets,tem_descricao,tem_ingredientes,comprimento_titulo,bsr,bsr_categoria,categoria",
              ),
          "amazon cadastro",
        ),
      ),
      safe(
        "termos",
        fetchAll(
          () =>
            c
              .from("fact_amazon_ads_search_term_dia")
              .select(
                "data,campaign_name,search_term,keyword_text,match_type,cost,clicks,purchases_14d,sales_14d",
              )
              .gte("data", data.de)
              .lte("data", data.ate),
          "amazon search terms",
          120000,
        ),
      ),
      safe(
        "brand",
        fetchAll(
          () =>
            c
              .from("fact_amazon_brand_search_term")
              .select("semana_fim,termo,nosso,click_share,conversion_share,rank_busca")
              .gte("semana_fim", menosDiasIso(data.ate, 35)),
          "amazon brand analytics",
          60000,
        ),
      ),
      safe(
        "recompra",
        fetchAll(
          () =>
            c
              .from("fact_amazon_recompra_asin")
              .select("asin,mes_fim,clientes_unicos,pct_clientes_repetem,receita_recompra")
              .gte("mes_fim", menosDiasIso(data.ate, 100)),
          "amazon recompra",
        ),
      ),
      safe(
        "horas",
        fetchAll(
          () =>
            c
              .from("fact_amazon_venda_hora")
              .select("data,hora,venda,pedidos")
              .gte("data", data.de)
              .lte("data", data.ate),
          "amazon venda hora",
          60000,
        ),
      ),
      safe(
        "keywords",
        fetchAll(
          () =>
            c
              .from("fact_amazon_ads_keyword_dia")
              .select(
                "data,campaign_name,keyword,match_type,cost,clicks,purchases_14d,sales_14d,top_search_is",
              )
              .gte("data", data.de)
              .lte("data", data.ate),
          "amazon keywords",
          120000,
        ),
      ),
      safe(
        "sd",
        fetchAll(
          () =>
            c
              .from("fact_amazon_ads_sd_target_dia")
              .select(
                "data,campaign_id,campaign_name,targeting,targeting_text,cost,clicks,purchases,sales",
              )
              .gte("data", data.de)
              .lte("data", data.ate),
          "amazon sd alvos",
          60000,
        ),
      ),
      // Segunda leva (benchmarks/amazon/REVISAO_IMPLEMENTACAO.md §3): objetos que já existiam e nenhuma tela lia.
      // Tendência: sempre as últimas 12 semanas, independentemente do período escolhido.
      safe(
        "semanas",
        fetchAll(
          () =>
            c
              .from("vw_amazon_tendencia_semana")
              .select(
                "semana,semana_ini,faturamento,pedidos,unidades,invest_ads,tacos_pct,roas_ads,roas_total,conversao_pct,devolucao_pct,parcial,ads_maturando",
              )
              .gte("semana_ini", menosDiasIso(data.ate, 90)),
          "amazon tendencia",
        ),
      ),
      safe(
        "intraday",
        fetchAll(
          () =>
            c
              .from("vw_amazon_venda_intraday")
              .select("data,faixa,venda_total,pedidos,unidades")
              .gte("data", menosDiasIso(data.ate, 8)),
          "amazon intraday",
        ),
      ),
      safe(
        "sbTermos",
        fetchAll(
          () =>
            c
              .from("fact_amazon_ads_sb_search_term_dia")
              .select(
                "data,campaign_name,search_term,keyword,match_type,cost,clicks,purchases,sales",
              )
              .gte("data", data.de)
              .lte("data", data.ate),
          "amazon sb termos",
          60000,
        ),
      ),
      safe(
        "sdProduto",
        fetchAll(
          () =>
            c
              .from("fact_amazon_ads_sd_produto_dia")
              .select("data,asin,sku,cost,clicks,purchases,sales")
              .gte("data", data.de)
              .lte("data", data.ate),
          "amazon sd produto",
          60000,
        ),
      ),
      safe(
        "campanhas",
        fetchAll(
          () =>
            c
              .from("dim_amazon_ads_campanha")
              .select("campaign_id,campaign_name,ad_type,budget,status"),
          "amazon campanhas",
        ),
      ),
      // LGPD: sem ship_city, ship_state e ship_postal_code.
      safe(
        "adsProduto",
        fetchAll(
          () =>
            c
              .from("fact_amazon_ads_produto_dia")
              .select(
                "data,campaign_id,campaign_name,ad_type,asin,sku,cost,clicks,impressions,sales_14d,units_14d",
              )
              .gte("data", data.de)
              .lte("data", data.ate),
          "amazon ads produto",
          90000,
        ),
      ),
      safe(
        "pedidos",
        fetchAll(
          () =>
            c
              .from("fact_amazon_pedido")
              .select(
                "amazon_order_id,purchase_dia,order_status,fulfillment_channel,sku,asin,quantity,item_price",
              )
              .gte("purchase_dia", data.de)
              .lte("purchase_dia", data.ate),
          "amazon pedidos",
          120000,
        ),
      ),
    ]);
    // Amazon DSP (migration 20261007130000_amazon_dsp.sql). null = tabela ainda não existe no banco; [] = sem carga.
    const dsp = await fetchAll(
      () =>
        c
          .from("vw_amazon_dsp_dia")
          .select(
            "data,order_id,order_name,line_item_id,line_item_name,status,investimento,impressoes,cliques,compras,unidades,receita,fonte",
          )
          .gte("data", data.de)
          .lte("data", data.ate),
      "amazon dsp",
      60000,
    ).catch(() => null);
    const ads = adsUnificados(adsSp, adsSb, adsSd);
    const vendasPorAsin = new Map<string, number>();
    for (const r of vendas) {
      const a = String(r["child_asin"] ?? "");
      if (a) vendasPorAsin.set(a, (vendasPorAsin.get(a) ?? 0) + (Number(r["vendas"]) || 0));
    }
    const titulos = new Map<string, string>();
    for (const r of [...reposicao, ...cadastro]) {
      const t = String(r["titulo"] ?? "");
      if (!t) continue;
      if (r["asin"]) titulos.set(String(r["asin"]), t);
      if (r["sku"]) titulos.set(String(r["sku"]), t);
    }
    const hojeIntraday = intraday.reduce(
      (m, r) => (String(r["data"] ?? "") > m ? String(r["data"]).slice(0, 10) : m),
      "",
    );
    return {
      resumo: resumoAmazon(trafego, ads, data.de, data.ate, hojeSP()),
      painel: {
        linhas: [
          ...linhasAmazon(
            ads.filter((r) => String(r["data"] ?? "").slice(0, 10) >= data.de),
            campanhas,
          ),
          ...linhasAmazonDsp(dsp ?? []),
        ],
        itens: [...itensAmazon(adsProduto, campanhas, titulos), ...itensAmazonDsp(dsp ?? [])],
        dsp: {
          tabela: dsp != null,
          linhas: dsp?.length ?? 0,
          fontes: [...new Set((dsp ?? []).map((r) => String(r["fonte"] ?? "")).filter(Boolean))],
        },
      },
      asins: asin360(vendas, buybox, estoque, reposicao, cadastro, data.de, data.ate).slice(0, 60),
      termos: termosAds(termos, data.de, data.ate),
      termosSb: termosAds(sbParaTermos(sbTermos), data.de, data.ate),
      sdProduto: sdPorProduto(sdProduto, data.de, data.ate, titulos),
      orcamento: campanhasNoLimite(ads, campanhas, data.de, data.ate),
      share: shareDeBusca(brand),
      reposicao: reposicaoFba(reposicao, estoque),
      estoqueFba: estoqueFba(estoque, reposicao),
      buybox: buyBoxCompleto(buybox, vendasPorAsin, titulos),
      qualidade: qualidadeAnuncio(cadastro, vendasPorAsin),
      tendencia: tendenciaSemanal(
        semanas,
        12,
        adsSb.length || adsSd.length ? adsPorSemana(ads) : undefined,
      ),
      hoje: hojeAteAgora(intraday, hojeIntraday),
      pedidos: pedidosAmazon(pedidos, data.de, data.ate, titulos),
      recompra: recompraAsin(recompra),
      organico: organicoVsAds(brand, termos, data.de, data.ate),
      horas: vendasPorHora(horas, data.de, data.ate),
      lances: {
        keywords: classificaLances(alvosKeywords(keywords, data.de, data.ate)),
        sd: classificaLances(alvosSd(sdAlvos, data.de, data.ate)),
      },
      erros,
    };
  });

// Mercado Livre (benchmarks/mercado-livre/ANALISE.md §4): economia real, anúncio 360° e Product Ads.
// Só colunas sem dado do comprador (sem buyer_id). Cada bloco é independente.
export async function dadosMercadoLivre(data: { de: string; ate: string }) {
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
  const [
    pedidos,
    itens,
    cupons,
    afiliados,
    custosR,
    adsItem,
    padsCampanhas,
    display,
    adsConta,
    anuncioDia,
    competicao,
    full,
  ] = await Promise.all([
    safe(
      "pedidos",
      fetchAll(
        () =>
          c
            .from("ml_pedido")
            .select("pedido_id,data_venda,status,total_amount,total_sale_fee")
            .gte("data_venda", data.de)
            .lte("data_venda", data.ate + "T23:59:59"),
        "ml pedidos",
        120000,
      ),
    ),
    safe(
      "itens",
      fetchAll(
        () =>
          c
            .from("ml_pedido_item")
            .select("pedido_id,item_id,seller_sku,title,quantity,unit_price")
            .gte("data_venda", data.de)
            .lte("data_venda", data.ate + "T23:59:59"),
        "ml itens",
        150000,
      ),
    ),
    safe(
      "cupons",
      fetchAll(
        () =>
          c
            .from("ml_pedido_cupom")
            .select("pedido_id,cupom_vendedor,cupom_meli")
            .gte("data_venda", data.de)
            .lte("data_venda", data.ate + "T23:59:59"),
        "ml cupons",
        120000,
      ),
    ),
    safe(
      "afiliados",
      fetchAll(
        () =>
          c
            .from("ml_afiliado_venda")
            .select("pedido_id,item_id,item_id_ml,comissao_pedido,casou_pedido")
            .gte("data_venda", data.de)
            .lte("data_venda", data.ate + "T23:59:59"),
        "ml afiliados",
        60000,
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
      "ads",
      fetchAll(
        () =>
          c
            .from("vw_ml_pads_item_dia")
            .select(
              "date,item_id,title,campaign_id,campaign_name,status,cost,clicks,prints,units_quantity,direct_units_quantity,indirect_units_quantity,organic_units_quantity,direct_amount,indirect_amount,organic_units_amount,impression_share,top_impression_share,lost_impression_share_by_budget,lost_impression_share_by_ad_rank,acos_benchmark,buy_box_winner,catalog_listing,logistic_type",
            )
            .gte("date", data.de)
            .lte("date", data.ate),
        "ml product ads",
        120000,
      ),
    ),
    safe(
      "padsCampanhas",
      fetchAll(
        () => c.from("vw_ml_pads_campanha_lista").select("campaign_id,name,status"),
        "ml campanhas product ads",
      ),
    ),
    safe(
      "display",
      fetchAll(
        () =>
          c
            .from("vw_ml_display_campanha_dia")
            .select(
              "data,campaign_id,campaign_name,status,investimento,receita,unidades,impressoes,cliques",
            )
            .gte("data", data.de)
            .lte("data", data.ate),
        "ml display",
        60000,
      ),
    ),
    safe(
      "adsConta",
      fetchAll(
        () =>
          c
            .from("tab_ml_kpi_dia")
            .select("data,invest_pads,invest_brand,invest_display")
            .gte("data", data.de)
            .lte("data", data.ate),
        "ml kpi dia",
      ),
    ),
    safe(
      "anuncioDia",
      fetchAll(
        () =>
          c
            .from("vw_ml_anuncio_dia")
            .select("data,item_id,visitas,pedidos,unidades,faturamento")
            .gte("data", data.de)
            .lte("data", data.ate),
        "ml anuncio dia",
        120000,
      ),
    ),
    safe(
      "competicao",
      fetchAll(
        () =>
          c
            .from("vw_ml_competicao")
            .select(
              "item_id,sku,nome,anuncio_status,preco_venda,price_to_win,buybox_status,situacao,health,estoque_disponivel",
            ),
        "ml competicao",
      ),
    ),
    safe(
      "full",
      fetchAll(
        () => c.from("dim_ml_produto").select("seller_sku,em_full,full_disponivel,cobertura_dias"),
        "ml full",
      ),
    ),
  ]);
  const ids = [...new Set(pedidos.map((p) => p["pedido_id"] as number).filter((x) => x != null))];
  const fretes = await safe(
    "fretes",
    fetchIn(c, "vw_ml_frete_pedido", "pedido_id,frete_rateado", "pedido_id", ids, "ml frete"),
  );
  const economia = economiaML(
    pedidos,
    itens,
    fretes,
    cupons,
    afiliados,
    custosR,
    adsItem,
    adsConta,
    data.de,
    data.ate,
  );
  const ads = diagnosticoAds(adsItem, data.de, data.ate);
  const anuncios = anuncios360(anuncioDia, competicao, full, economia.skus, data.de, data.ate);
  // Painel visual de Mercado Ads (Product Ads por item, Display por campanha, Brand só o total diário da conta).
  const painel = [
    ...linhasMlProductAds(adsItem, padsCampanhas),
    ...linhasMlDisplay(display),
    ...linhasMlBrand(adsConta),
  ];
  return {
    economia: { ...economia, skus: economia.skus.slice(0, 80) },
    anuncios,
    ads,
    painel,
    alertas: alertasML({ anuncios, ads }),
    erros,
  };
}

export const getMercadoLivre = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => dadosMercadoLivre(data));

// Shopee (benchmarks/shopee/ANALISE.md §4): economia pelo escrow, Ads, produtos, lives e cancelamentos.
// Sem buyer_user_id, buyer_username nem invoice_access_key (LGPD). Cada bloco é independente.
export async function dadosShopee(data: { de: string; ate: string }) {
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
  const [
    pedidos,
    itens,
    fin,
    custosR,
    adsDia,
    adsCamp,
    adsHora,
    itemDia,
    estoque,
    produtos,
    metricas,
    sessoes,
  ] = await Promise.all([
    safe(
      "pedidos",
      fetchAll(
        () =>
          c
            .from("shopee_pedido")
            .select("order_sn,create_dia,order_status,cancel_reason,cancel_by,total_amount")
            .gte("create_dia", data.de)
            .lte("create_dia", data.ate),
        "shopee pedidos",
        120000,
      ),
    ),
    safe(
      "itens",
      fetchAll(
        () =>
          c
            .from("shopee_pedido_item")
            .select(
              "order_sn,create_dia,order_status,item_id,item_name,item_sku,model_sku,model_quantity_purchased,cancelled_qty,returned_qty,model_discounted_price",
            )
            .gte("create_dia", data.de)
            .lte("create_dia", data.ate),
        "shopee itens",
        150000,
      ),
    ),
    safe(
      "financeiro",
      fetchAll(
        () =>
          c
            .from("fact_shopee_financeiro")
            .select(
              "order_sn,escrow_amount,commission_fee,service_fee,seller_transaction_fee,campaign_fee,comissao_afiliado,fbs_fee,seller_return_refund,reverse_shipping_fee,escrow_tax,withholding_tax,shopee_discount,voucher_from_shopee,seller_discount,voucher_from_seller,coins,actual_shipping_fee,shopee_shipping_rebate,buyer_paid_shipping_fee",
            )
            .gte("create_dia", data.de)
            .lte("create_dia", data.ate),
        "shopee escrow",
        120000,
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
      "adsDia",
      fetchAll(
        () =>
          c
            .from("fact_shopee_ads_campanha_dia")
            .select(
              "data,campaign_id,ad_type,expense,direct_gmv,broad_gmv,direct_order,broad_order,clicks,impression",
            )
            .gte("data", data.de)
            .lte("data", data.ate),
        "shopee ads",
        60000,
      ),
    ),
    safe(
      "adsCamp",
      fetchAll(
        () =>
          c
            .from("dim_shopee_ads_campanha")
            .select("campaign_id,ad_name,ad_type,roas_target,campaign_status"),
        "shopee campanhas",
      ),
    ),
    safe(
      "adsHora",
      fetchAll(
        () =>
          c
            .from("fact_shopee_ads_hora")
            .select("data,hora,expense,direct_gmv")
            .gte("data", data.de)
            .lte("data", data.ate),
        "shopee ads hora",
        60000,
      ),
    ),
    safe(
      "itemDia",
      fetchAll(
        () =>
          c
            .from("vw_shopee_item_dia")
            .select("data,item_id,title,seller_sku,visitas,pedidos,unidades_vendidas,receita")
            .gte("data", data.de)
            .lte("data", data.ate),
        "shopee item dia",
        120000,
      ),
    ),
    safe(
      "estoque",
      fetchAll(
        () =>
          c
            .from("vw_shopee_estoque")
            .select("item_id,estoque_total,dias_de_cobertura,media_diaria"),
        "shopee estoque",
      ),
    ),
    safe(
      "produtos",
      fetchAll(
        () =>
          c.from("dim_shopee_produto").select("item_id,item_sku,nome,fotos,tem_dimensoes,rating"),
        "shopee produtos",
      ),
    ),
    safe(
      "metricas",
      fetchAll(
        () =>
          c
            .from("shopee_item_metricas_dia")
            .select("data,item_id,rating,comentarios")
            .gte("data", data.de)
            .lte("data", data.ate),
        "shopee metricas",
        60000,
      ),
    ),
    safe(
      "lives",
      fetchAll(
        () =>
          c
            .from("live_shopee_sessao")
            .select(
              "sessao_id,titulo,inicio,duracao_seg,espectadores,pedidos_confirmados,vendas_confirmadas",
            )
            .gte("inicio", data.de)
            .lte("inicio", data.ate + "T23:59:59"),
        "shopee lives",
      ),
    ),
  ]);
  const sessaoIds = sessoes.map((s) => s["sessao_id"] as number).filter((x) => x != null);
  const produtosLive = await safe(
    "produtosLive",
    fetchIn(
      c,
      "live_shopee_produto",
      "sessao_id,item_id,cliques,atc,pedidos_confirmados,vendas_confirmadas",
      "sessao_id",
      sessaoIds,
      "shopee live produtos",
    ),
  );
  const economia = economiaShopee(pedidos, itens, fin, custosR, adsDia, data.de, data.ate);
  const ads = adsShopee(adsDia, adsCamp, data.de, data.ate);
  const horas = adsPorHora(adsHora, data.de, data.ate);
  const prods = produtosShopee(itemDia, estoque, produtos, metricas, data.de, data.ate);
  return {
    economia: { ...economia, skus: economia.skus.slice(0, 80) },
    ads,
    painel: linhasShopee(adsDia, adsCamp),
    horas,
    produtos: prods,
    lives: livesShopee(sessoes, produtosLive, produtos, data.de, data.ate),
    cancelamentos: cancelamentosShopee(pedidos, itens, data.de, data.ate),
    alertas: alertasShopee({ produtos: prods, skus: economia.skus, ads, horas }),
    erros,
  };
}

export const getShopee = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => dadosShopee(data));

// Google Ads e site (benchmarks/google/ANALISE.md §4): views vw_google_* / vw_gads_* e páginas do site.
