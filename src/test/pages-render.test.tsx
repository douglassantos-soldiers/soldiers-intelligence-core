import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { reconciliacaoMeta, criativosMeta, segmentosMeta, funilMeta, ritmoMeta, metasDoMes } from "@/lib/metaads";
import {
  campanhasGoogle,
  ritmoIntraday,
  produtosGoogle,
  assetsPmax,
  paginasSite,
} from "@/lib/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  resumoAmazon,
  asin360,
  termosAds,
  shareDeBusca,
  reposicaoFba,
  recompraAsin,
  organicoVsAds,
  vendasPorHora,
  novosParaMarca,
  alvosKeywords,
  alvosSd,
  classificaLances,
} from "@/lib/amazon";
import {
  economiaShopee,
  cancelamentosShopee,
  adsShopee,
  adsPorHora,
  produtosShopee,
  livesShopee,
} from "@/lib/shopee";
import { economiaML, anuncios360, diagnosticoAds, alertasML } from "@/lib/mercadolivre";

const AMZ_DE = "2026-09-01";
const AMZ_ATE = "2026-09-30";
const amazonFixture = {
  resumo: resumoAmazon(
    [
      {
        data: "2026-09-02",
        vendas: 20000,
        unidades: 200,
        sessoes: 4000,
        buybox_pct: 0.86,
        unidades_devolvidas: 4,
      },
    ],
    [{ data: "2026-09-02", ad_type: "SP", cost: 1500, sales_14d: 7500, clicks: 900 }],
    AMZ_DE,
    AMZ_ATE,
  ),
  asins: asin360(
    [
      {
        data: "2026-09-02",
        child_asin: "B0CREA",
        vendas: 12000,
        unidades: 120,
        sessoes: 1500,
        buybox_pct: 1,
      },
      {
        data: "2026-09-02",
        child_asin: "B0WHEY",
        vendas: 8000,
        unidades: 80,
        sessoes: 2500,
        buybox_pct: 0.7,
      },
    ],
    [
      {
        asin: "B0WHEY",
        ganho_buybox: false,
        concorrente_no_bb: true,
        meu_preco: 199.9,
        menor_preco_concorrente: 189.9,
      },
    ],
    [{ asin: "B0CREA", seller_sku: "CREA300", fulfillable: 90 }],
    [
      {
        asin: "B0CREA",
        sku: "CREA300",
        em_fba: true,
        cobertura_dias: 8,
        titulo: "Creatina Amazon 300g",
        fba_disponivel: 90,
      },
    ],
    [{ asin: "B0WHEY", titulo: "Whey Amazon 900g", tem_aplus: true }],
    AMZ_DE,
    AMZ_ATE,
  ),
  termos: termosAds(
    [
      {
        data: "2026-09-02",
        campaign_name: "C",
        search_term: "pre treino barato",
        keyword_text: "pre treino",
        match_type: "BROAD",
        cost: 80,
        clicks: 40,
        purchases_14d: 0,
        sales_14d: 0,
      },
      {
        data: "2026-09-02",
        campaign_name: "C",
        search_term: "creatina monohidratada",
        keyword_text: "creatina",
        match_type: "BROAD",
        cost: 50,
        clicks: 30,
        purchases_14d: 6,
        sales_14d: 900,
      },
      {
        data: "2026-09-02",
        campaign_name: "C",
        search_term: "whey",
        keyword_text: "whey",
        match_type: "BROAD",
        cost: 300,
        clicks: 100,
        purchases_14d: 3,
        sales_14d: 400,
      },
    ],
    AMZ_DE,
    AMZ_ATE,
  ),
  share: shareDeBusca([
    {
      semana_fim: "2026-09-20",
      termo: "creatina",
      nosso: true,
      click_share: 0.2,
      conversion_share: 0.25,
      rank_busca: 4,
    },
    {
      semana_fim: "2026-09-27",
      termo: "creatina",
      nosso: true,
      click_share: 0.12,
      conversion_share: 0.15,
      rank_busca: 4,
    },
  ]),
  reposicao: reposicaoFba(
    [
      {
        sku: "CREA300",
        asin: "B0CREA",
        titulo: "Creatina Amazon 300g",
        em_fba: true,
        fba_disponivel: 90,
        cobertura_dias: 8,
        enviar_30d: 300,
        alerta: "repor",
      },
    ],
    [{ seller_sku: "CREA300", imprestavel_total: 3 }],
  ),
  recompra: recompraAsin([
    {
      asin: "B0CREA",
      mes_fim: "2026-09-30",
      clientes_unicos: 300,
      pct_clientes_repetem: 0.18,
      receita_recompra: 4000,
    },
  ]),
  organico: organicoVsAds(
    [
      { semana_fim: "2026-09-20", termo: "whey", nosso: true, click_share: 0.2, rank_busca: 1 },
      { semana_fim: "2026-09-27", termo: "whey", nosso: true, click_share: 0.05, rank_busca: 1 },
      {
        semana_fim: "2026-09-27",
        termo: "creatina pura",
        nosso: true,
        click_share: 0.5,
        rank_busca: 3,
      },
    ],
    [{ data: "2026-09-02", search_term: "creatina pura", cost: 400, sales_14d: 2000 }],
    AMZ_DE,
    AMZ_ATE,
  ),
  horas: vendasPorHora(
    [
      { data: "2026-09-06", hora: 21, venda: 900, pedidos: 9 },
      { data: "2026-09-07", hora: 9, venda: 100, pedidos: 1 },
    ],
    AMZ_DE,
    AMZ_ATE,
  ),
  lances: {
    keywords: classificaLances(
      alvosKeywords(
        [
          {
            data: "2026-09-02",
            campaign_name: "SP Creatina",
            keyword: "creatina 1kg",
            match_type: "EXACT",
            cost: 100,
            clicks: 100,
            purchases_14d: 10,
            sales_14d: 1000,
          },
          {
            data: "2026-09-02",
            campaign_name: "SP Whey",
            keyword: "whey protein",
            match_type: "BROAD",
            cost: 300,
            clicks: 150,
            purchases_14d: 2,
            sales_14d: 600,
          },
        ],
        AMZ_DE,
        AMZ_ATE,
      ),
    ),
    sd: classificaLances(alvosSd([], AMZ_DE, AMZ_ATE)),
  },
  erros: { brand: "timeout" },
};

// As telas chamam server functions via useServerFn. Aqui elas devolvem dados fixos,
// para testar a renderização sem banco.
const mlEcon = economiaML(
  [
    { pedido_id: 1, data_venda: "2026-09-05", status: "paid", total_sale_fee: 30 },
    { pedido_id: 2, data_venda: "2026-09-06", status: "paid", total_sale_fee: 15 },
  ],
  [
    {
      pedido_id: 1,
      item_id: "MLB1",
      seller_sku: "CREA300",
      title: "Creatina ML 300g",
      quantity: 2,
      unit_price: 100,
    },
    {
      pedido_id: 2,
      item_id: "MLB2",
      seller_sku: "WHEY900",
      title: "Whey ML 900g",
      quantity: 1,
      unit_price: 100,
    },
  ],
  [
    { pedido_id: 1, frete_rateado: 20 },
    { pedido_id: 2, frete_rateado: 22 },
  ],
  [{ pedido_id: 1, cupom_vendedor: 10, cupom_meli: 25 }],
  [],
  [
    { sku: "CREA300", custo_unitario: 30, vigencia_inicio: "2026-01-01" },
    { sku: "WHEY900", custo_unitario: 70, vigencia_inicio: "2026-01-01" },
  ],
  [{ date: "2026-09-05", item_id: "MLB1", cost: 12 }],
  [{ data: "2026-09-05", invest_pads: 12, invest_brand: 3, invest_display: 0 }],
  "2026-09-01",
  "2026-09-30",
);
const mlAnuncios = anuncios360(
  [
    {
      data: "2026-09-05",
      item_id: "MLB1",
      visitas: 800,
      pedidos: 40,
      unidades: 40,
      faturamento: 4000,
    },
    {
      data: "2026-09-05",
      item_id: "MLB2",
      visitas: 900,
      pedidos: 3,
      unidades: 3,
      faturamento: 300,
    },
  ],
  [
    {
      item_id: "MLB1",
      sku: "CREA300",
      nome: "Creatina ML 300g",
      preco_venda: 100,
      price_to_win: 92,
      buybox_status: "competing",
      health: 0.9,
    },
    {
      item_id: "MLB2",
      sku: "WHEY900",
      nome: "Whey ML 900g",
      preco_venda: 100,
      price_to_win: 70,
      buybox_status: "competing",
      health: 0.6,
    },
  ],
  [{ seller_sku: "CREA300", em_full: true, full_disponivel: 30, cobertura_dias: 5 }],
  mlEcon.skus,
  "2026-09-01",
  "2026-09-30",
);
const mlAds = diagnosticoAds(
  [
    {
      date: "2026-09-05",
      item_id: "MLB1",
      title: "Creatina ML 300g",
      cost: 100,
      direct_amount: 1000,
      indirect_amount: 0,
      organic_units_amount: 500,
      lost_impression_share_by_budget: 0.35,
      lost_impression_share_by_ad_rank: 0.1,
      acos_benchmark: 0.2,
    },
  ],
  "2026-09-01",
  "2026-09-30",
);
const mercadoLivreFixture = {
  economia: mlEcon,
  anuncios: mlAnuncios,
  ads: mlAds,
  alertas: alertasML({ anuncios: mlAnuncios, ads: mlAds }),
  erros: {} as Record<string, string>,
};

const shpEcon = economiaShopee(
  [{ order_sn: "A", create_dia: "2026-09-05", order_status: "COMPLETED" }],
  [
    {
      order_sn: "A",
      create_dia: "2026-09-05",
      model_sku: "CREA300",
      item_name: "Creatina Shopee 300g",
      model_quantity_purchased: 2,
      model_discounted_price: 80,
    },
  ],
  [
    {
      order_sn: "A",
      escrow_amount: 130,
      commission_fee: -16,
      service_fee: -8,
      shopee_discount: 6,
      voucher_from_seller: 4,
    },
  ],
  [{ sku: "CREA300", custo_unitario: 30, vigencia_inicio: "2026-01-01" }],
  [{ data: "2026-09-05", expense: 20 }],
  "2026-09-01",
  "2026-09-30",
);
const shopeeFixture = {
  economia: shpEcon,
  ads: adsShopee(
    [
      {
        data: "2026-09-05",
        campaign_id: 1,
        ad_type: "auto",
        expense: 100,
        direct_gmv: 200,
        broad_gmv: 300,
        clicks: 40,
      },
    ],
    [{ campaign_id: 1, ad_name: "GMV Max Whey", roas_target: 5 }],
    "2026-09-01",
    "2026-09-30",
  ),
  horas: adsPorHora(
    [
      { data: "2026-09-06", hora: 3, expense: 50, direct_gmv: 20 },
      { data: "2026-09-06", hora: 21, expense: 50, direct_gmv: 600 },
      { data: "2026-09-07", hora: 12, expense: 100, direct_gmv: 300 },
    ],
    "2026-09-01",
    "2026-09-30",
  ),
  produtos: produtosShopee(
    [
      {
        data: "2026-09-05",
        item_id: "1",
        title: "Creatina Shopee 300g",
        seller_sku: "CREA300",
        visitas: 500,
        pedidos: 20,
        unidades_vendidas: 25,
        receita: 2000,
      },
    ],
    [{ item_id: "1", estoque_total: 30, dias_de_cobertura: 6, media_diaria: 5 }],
    [{ item_id: "1", nome: "Creatina Shopee 300g", fotos: 7, tem_dimensoes: true }],
    [],
    "2026-09-01",
    "2026-09-30",
  ),
  lives: livesShopee(
    [
      {
        sessao_id: 7,
        titulo: "Live de setembro",
        inicio: "2026-09-10T20:00:00Z",
        duracao_seg: 3600,
        espectadores: 800,
        pedidos_confirmados: 16,
        vendas_confirmadas: 1600,
      },
    ],
    [
      {
        sessao_id: 7,
        item_id: 1,
        cliques: 200,
        atc: 50,
        pedidos_confirmados: 12,
        vendas_confirmadas: 1200,
      },
    ],
    [{ item_id: "1", nome: "Creatina Shopee 300g" }],
    "2026-09-01",
    "2026-09-30",
  ),
  cancelamentos: cancelamentosShopee(
    [
      {
        order_sn: "C",
        create_dia: "2026-09-07",
        order_status: "CANCELLED",
        cancel_reason: "Fora de estoque",
        cancel_by: "seller",
        total_amount: 90,
      },
    ],
    [],
    "2026-09-01",
    "2026-09-30",
  ),
  alertas: [],
  erros: {} as Record<string, string>,
};

const googleFixture = {
  campanhas: campanhasGoogle(
    [
      {
        data: "2026-09-05",
        campaign_id: "A",
        campaign_name: "PMax Creatina",
        gasto: 200,
        receita: 1600,
        receita_shopify: 1300,
        impressoes: 1000,
        fatia_impressao: 0.5,
        fatia_perdida_orcamento: 0.4,
        fatia_perdida_rank: 0.1,
      },
      {
        data: "2026-09-05",
        campaign_id: "B",
        campaign_name: "Search Whey",
        gasto: 300,
        receita: 600,
        receita_shopify: 500,
        impressoes: 1000,
        fatia_impressao: 0.6,
        fatia_perdida_orcamento: 0.05,
        fatia_perdida_rank: 0.35,
      },
    ],
    [
      { campaign_id: "A", campaign_name: "PMax Creatina", target_roas: 5, orcamento_diario: 100 },
      { campaign_id: "B", campaign_name: "Search Whey", target_roas: 4 },
    ],
    "2026-09-01",
    "2026-09-30",
  ),
  ritmo: ritmoIntraday(
    [{ data: "2026-10-03", campaign_id: "A", gasto: 90, captured_at: "2026-10-03T15:00:00Z" }],
    [{ campaign_id: "A", campaign_name: "PMax Creatina", orcamento_diario: 100 }],
  ),
  produtos: produtosGoogle(
    [
      {
        data: "2026-09-05",
        product_item_id: "CREA300",
        product_title: "Creatina Google 300g",
        gasto: 100,
        receita: 500,
      },
      {
        data: "2026-09-05",
        product_item_id: "WHEY900",
        product_title: "Whey Google 900g",
        gasto: 100,
        receita: 300,
      },
    ],
    [
      { product_variant_id: "1", product_variant_sku: "CREA300", product_variant_price: 100 },
      { product_variant_id: "2", product_variant_sku: "WHEY900", product_variant_price: 200 },
    ],
    [
      { sku: "CREA300", custo_unitario: 40, vigencia_inicio: "2026-01-01" },
      { sku: "WHEY900", custo_unitario: 150, vigencia_inicio: "2026-01-01" },
    ],
    "2026-09-01",
    "2026-09-30",
  ),
  termos: {
    negativar: [
      {
        termo: "creatina gratis",
        campanha: "Search",
        cliques: 40,
        invest_desperdicado: 80,
        sugestao: "Negativar como frase",
      },
    ],
    graduar: [
      {
        termo: "creatina monohidratada 1kg",
        campanha: "PMax",
        conversoes: 8,
        receita: 900,
        roas: 9,
        sugestao: "Criar keyword exata",
      },
    ],
    keywords: [],
  },
  assets: assetsPmax([
    {
      campaign_id: "1",
      campaign_name: "PMax Creatina",
      asset_group_id: "g",
      asset_group_name: "Creatina",
      performance_label: "LOW",
      field_type: "HEADLINE",
      texto: "Compre já",
    },
  ]),
  paginas: paginasSite(
    [
      {
        data: "2026-09-05",
        pagina_path: "/products/creatina",
        sessoes: 1000,
        sessoes_checkout: 100,
      },
      { data: "2026-09-05", pagina_path: "/pages/lp-whey", sessoes: 2000, sessoes_checkout: 200 },
      { data: "2026-09-05", pagina_path: "/products/bcaa", sessoes: 500, sessoes_checkout: 50 },
    ],
    [
      { data: "2026-09-05", pagina_path: "/products/creatina", pedidos: 40, receita: 4000 },
      { data: "2026-09-05", pagina_path: "/pages/lp-whey", pedidos: 10, receita: 1500 },
      { data: "2026-09-05", pagina_path: "/products/bcaa", pedidos: 20, receita: 1000 },
    ],
    [{ pagina_path: "/pages/lp-whey", tipo: "LP", rotulo: "LP Whey" }],
    "2026-09-01",
    "2026-09-30",
  ),
  alertas: [],
  erros: {} as Record<string, string>,
};

const metaFixture = {
  reconciliacao: reconciliacaoMeta(
    [
      {
        data: "2026-09-01",
        gasto_meta: 1000,
        receita_informada_meta: 6000,
        receita_meta_utm: 3000,
        compras_informadas_meta: 40,
        pedidos_meta_utm: 20,
        enviados_meta: 70,
        pedidos_totais: 100,
      },
      {
        data: "2026-09-02",
        gasto_meta: 1000,
        receita_informada_meta: 5000,
        receita_meta_utm: 3500,
        compras_informadas_meta: 35,
        pedidos_meta_utm: 22,
        enviados_meta: 75,
        pedidos_totais: 100,
      },
    ],
    "2026-09-01",
    "2026-09-30",
  ),
  criativos: criativosMeta(
    [
      {
        criativo: "UGC Creatina 15s",
        campanha: "TOPO | VENDA",
        publico: "Aberto",
        invest: 1200,
        receita: 7200,
        roas: 6,
        hook_pct: 38,
        ctr_pct: 1.8,
        frequencia: 1.6,
        sugestao: "Escalar",
      },
      {
        criativo: "Estático Whey",
        campanha: "MEIO-FUNDO",
        publico: "Remarketing",
        invest: 800,
        receita: 800,
        roas: 1,
        ctr_pct: 0.6,
        frequencia: 4.1,
        sugestao: "Pausar",
      },
    ],
    [
      {
        criativo: "Estático Whey",
        publico: "Remarketing",
        diagnostico: "Fadiga: frequência alta e ROAS caindo",
        freq_7d: 4.1,
        freq_ant: 2.3,
        roas_7d: 1,
        roas_ant: 2.8,
        invest_7d: 300,
      },
    ],
    [{ formato: "vídeo", criativos: 5, invest: 1500, receita: 7600, roas: 5.1, ctr_pct: 1.5 }],
  ),
  segmentos: segmentosMeta(
    [
      { publico: "Lookalike compradores", invest: 1000, receita: 6000 },
      { publico: "Interesses fitness", invest: 1000, receita: 2000 },
    ],
    [{ plataforma: "instagram", posicionamento: "reels", invest: 1200, receita: 6000 }],
    [{ faixa_idade: "25-34", genero: "male", invest: 900, receita: 4500 }],
    [{ hora: 21, invest: 300, receita: 1800 }],
  ),
  funil: funilMeta([
    { ord: 1, etapa: "Impressões", valor: 500000 },
    { ord: 2, etapa: "Cliques", valor: 8000, taxa_passagem: "1,6%" },
    { ord: 3, etapa: "Compras", valor: 120, taxa_passagem: "1,5%", cpa: 16.7 },
  ]),
  ritmo: ritmoMeta(
    [{ data: "2026-10-03", gasto: 700, receita: 2400, captured_at: "2026-10-03T15:00:00Z" }],
    [
      { data: "2026-10-02", gasto: 1000, receita: 4000 },
      { data: "2026-10-01", gasto: 1000, receita: 4000 },
    ],
  ),
  alertas: [],
  erros: {} as Record<string, string>,
};
const metasFixture = {
  mes: "2026-10",
  canais: metasDoMes(
    [
      {
        data: "2026-10-01",
        mes: "2026-10",
        canal: "Site",
        receita_meta: 10000,
        receita_real: 9000,
      },
      {
        data: "2026-10-02",
        mes: "2026-10",
        canal: "Site",
        receita_meta: 10000,
        receita_real: 7000,
        dado_provisorio: true,
      },
      { data: "2026-10-03", mes: "2026-10", canal: "Site", receita_meta: 280000, dia_futuro: true },
    ],
    "2026-10-03",
  ),
  eventos: [{ data: "2026-10-02", tipo: "promoção", titulo: "Semana da Creatina", obs: "" }],
};

const fixtures: Record<string, unknown> = {
  meta: metaFixture,
  metas: metasFixture,
  google: googleFixture,
  shopee: shopeeFixture,
  ml: mercadoLivreFixture,
  amazon: amazonFixture,
  media: {
    amazonNtb: novosParaMarca(
      [
        {
          data: "2026-09-02",
          campaign_id: "1",
          campaign_name: "SB Marca Soldiers",
          cost: 200,
          sales: 1000,
          ntb_sales: 600,
          ntb_purchases: 8,
        },
      ],
      [],
      "2026-09-01",
      "2026-09-30",
    ),
    tipos: [
      {
        data: "2026-09-01",
        tipo: "Meta",
        investimento: 100,
        receita: 400,
        impressoes: 10000,
        cliques: 200,
        unidades: 10,
      },
      {
        data: "2026-09-02",
        tipo: "Google",
        investimento: 50,
        receita: 150,
        impressoes: 5000,
        cliques: 100,
        unidades: 4,
      },
    ],
    funil: [
      {
        data: "2026-09-01",
        canal: "Site",
        invest: 150,
        receita_ads: 550,
        impressoes: 15000,
        cliques: 300,
        conversoes: 12,
        base_conversao: "pedidos",
      },
    ],
  },
  affiliate: {
    dia: [
      {
        data: "2026-09-01",
        pedidos: 5,
        pedidos_recusados: 1,
        venda: 1000,
        venda_aprovada: 800,
        venda_pendente: 150,
        venda_recusada: 50,
        comissao: 80,
        taxa_awin: 20,
      },
    ],
    pub: [
      {
        publisher_id: 1,
        publisher: "Blog Fitness",
        pedidos: 5,
        venda: 1000,
        comissao: 80,
        taxa_awin: 20,
      },
    ],
    canal: [{ data: "2026-09-01", canal: "Site", rec: 1000, inv: 100 }],
  },
  crm: {
    meses: [
      {
        mes: "2026-09-01",
        clientes: 100,
        novos: 60,
        recorrentes: 40,
        receita: 20000,
        pedidos: 120,
        gerado_em: "2026-10-01",
      },
    ],
    rfm: [
      {
        segmento: "Campeões",
        clientes: 10,
        receita: 5000,
        ticket_medio: 250,
        recencia_media: 12,
        frequencia_media: 4.2,
      },
    ],
    acoes: [
      {
        acao: "recompra",
        canal: "Site",
        clientes: 30,
        valor_esperado: 3000,
        valor_historico: 9000,
      },
    ],
    ltv: [],
    origem: [
      {
        canal_entrada: "Site",
        clientes: 80,
        ltv_medio: 400,
        pct_recompra: 35,
        pedidos: 160,
        receita: 32000,
      },
    ],
    cohort: [
      { safra: "2026-08-01", mes_offset: 1, clientes_safra: 50, clientes: 10, receita: 2000 },
    ],
  },
  health: {
    fontes: [
      { fonte: "Meta Ads", ultimoDado: "2026-01-01", carregadoEm: "2026-01-02", erro: null },
      {
        fonte: "Pedidos: Shopify",
        ultimoDado: new Date().toISOString().slice(0, 10),
        carregadoEm: null,
        erro: null,
      },
    ],
    filas: [
      {
        fila: "Shopee: pedidos",
        linhas: 3,
        porStatus: { ok: 2, erro: 1 },
        maxTentativas: 4,
        ultimoErro: "timeout",
        atualizado: "2026-10-02",
        erro: null,
      },
    ],
    logs: [
      {
        log: "Shopee",
        execucoes: 50,
        comErro: 2,
        ultimaExecucao: "2026-10-02",
        ultimoErro: "429",
        erro: null,
      },
    ],
    problemas: [
      {
        canal: "Shopify",
        problema: "pedido sem custo",
        severidade: "alta",
        dias_aberto: 5,
        pedido: "1001",
        valor: 199,
        data: "2026-09-28",
      },
    ],
    afiliadoMl: [],
    tokens: [
      {
        integracao: "TikTok Shop",
        conta: "shop1",
        expiraEm: "2026-09-01",
        atualizadoEm: "2026-08-25",
        dias: -30,
        semRenovar: 38,
        nivel: "expirado",
      },
    ],
    tokensErro: null,
  },
  alertas: {
    estoque: [
      {
        sku: "CREA300",
        title: "Creatina 300g",
        estoque: 120,
        cobertura_dias: 5,
        alerta: "ruptura",
        media_diaria: 24,
      },
    ],
    problemasDados: 3,
    mercadoLivre: [
      {
        tipo: "problema",
        tag: "ML margem",
        tom: "danger",
        texto: "1 anúncio(s) com contribuição negativa no período.",
      },
    ],
    amazon: [
      {
        tipo: "problema",
        tag: "Amazon FBA",
        tom: "warn",
        texto: "2 ASIN(s) com venda e menos de 14 dias de estoque no FBA.",
      },
      {
        tipo: "oportunidade",
        tag: "Amazon busca",
        tom: "primary",
        texto: "1 termo(s) perderam espaço orgânico e não têm anúncio.",
      },
    ],
    buybox: { perdendo_concorrente: 2, suprimida: 1, em_risco: 4 },
    acoes: [
      { acao: "recompra", clientes: 30, valor_esperado: 3000 },
      { acao: "aguardar", clientes: 500, valor_esperado: 0 },
    ],
    skusEmAlta: [
      { sku: "WHEY900", produto: "Whey 900g", atual: 9000, anterior: 6000, variacao: 50 },
    ],
  },
  hoje: {
    referencia: "2026-10-02",
    videosEscalar: [
      {
        video_id: "v1",
        criador: "joao.fit",
        titulo: "Creatina do jeito certo",
        produto: "Creatina 300g",
        views: 80000,
        gmv: 9200,
        pedidos: 102,
        gpm: 115,
        vsMediana: 3.2,
      },
    ],
    emAlta: [{ criador: "ana.treina", atual: 6400, anterior: 2100, variacao: 204.8, videos: 5 }],
    reativar: [{ criador: "caio.run", atual: 0, anterior: 18000, variacao: -100, videos: 12 }],
    semVenda: [
      { nome: "Lia Souza", tiktok: "lia.souza", tier: "micro", custo: 1500, desde: "2026-08-01" },
    ],
    influenciadoresErro: null,
    mix30d: { gmv: 100000, video: 62000, live: 30000, card: 8000, pedidos: 900 },
  },
  tiktok: {
    economia: {
      pedidos: 120,
      receitaItens: 18000,
      descontoPlataforma: 900,
      descontoVendedor: 400,
      amostras: { pedidos: 6, custoProduto: 310 },
      liquidacao: { liquidados: 90, pctLiquidado: 75, emAbertoValor: 4500, prazoMedianoDias: 18 },
      liquidado: {
        repasse: 11000,
        cmv: 5200,
        contribuicao: 5800,
        margemPct: 52.7,
        custos: [
          { chave: "comissao_plataforma", label: "Comissão TikTok", valor: 1300 },
          { chave: "comissao_afiliado_ads", label: "Comissão de afiliado (anúncios)", valor: 240 },
        ],
      },
      itensSemCusto: 3,
      skus: [
        {
          sku: "CREA300",
          produto: "Creatina 300g",
          unidades: 80,
          receita: 7200,
          repasse: 5900,
          cmv: 3040,
          contribuicao: 2860,
        },
      ],
    },
    devolucoes: [{ motivo: "Produto danificado", devolucoes: 4, valor: 360 }],
    listings: {
      anuncios: 12,
      comProblema: 1,
      semEstoque: 1,
      foraDeVenda: 0,
      lista: [
        { product_id: "1", titulo: "Whey 900g", problemas: ["1 SKU sem estoque"], health: 70 },
      ],
    },
  },
};
let current = "media";

// Recharts usa ResizeObserver, que o jsdom não tem.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

vi.mock("@tanstack/react-start", async (orig) => ({
  ...(await orig<typeof import("@tanstack/react-start")>()),
  useServerFn: () => async () => fixtures[current],
}));

// Link precisa de um router montado; para o teste basta um <a>.
vi.mock("@tanstack/react-router", async (orig) => ({
  ...(await orig<typeof import("@tanstack/react-router")>()),
  Link: ({ children, className }: { children: ReactNode; className?: string }) => (
    <a className={className}>{children}</a>
  ),
}));

function wrap(node: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{node}</QueryClientProvider>);
}

describe("telas novas renderizam com dados", () => {
  it("Media", async () => {
    current = "media";
    const { Route } = await import("@/routes/media");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("Por tipo de campanha", {}, { timeout: 10000 })).toBeTruthy();
    expect(screen.getByText("Funil por canal de venda")).toBeTruthy();
    expect(screen.getAllByText("3,67x").length).toBeGreaterThan(0); // ROAS mídia = 550 / 150
    expect(screen.getByText("Amazon Ads: clientes novos para a marca")).toBeTruthy();
    expect(screen.getAllByText("60%").length).toBeGreaterThan(0); // 600 de 1000 de clientes novos
  }, 15000);

  it("Affiliate", async () => {
    current = "affiliate";
    const { Route } = await import("@/routes/affiliate");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("Publishers Awin")).toBeTruthy();
    expect(screen.getByText("Blog Fitness")).toBeTruthy();
  });

  it("CRM / Growth", async () => {
    current = "crm";
    const { Route } = await import("@/routes/crm");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("Segmentos RFM")).toBeTruthy();
    expect(screen.getByText("Campeões")).toBeTruthy();
    expect(screen.getByText("20%")).toBeTruthy(); // cohort: 10 de 50 voltaram em M1
  });

  it("Data Health", async () => {
    current = "health";
    const { Route } = await import("@/routes/data-health");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("Frescor por fonte")).toBeTruthy();
    expect(screen.getByText("Atrasado")).toBeTruthy(); // Meta Ads parado desde janeiro
    expect(screen.getByText("Em dia")).toBeTruthy();
    expect(screen.getByText("pedido sem custo")).toBeTruthy();
  });

  it("Command Center: problemas e oportunidades", async () => {
    current = "alertas";
    const { Alertas } = await import("@/components/alertas");
    wrap(<Alertas />);
    expect(await screen.findByText("Creatina 300g")).toBeTruthy();
    expect(screen.getByText("Whey 900g")).toBeTruthy();
    expect(screen.getByText("Recompra")).toBeTruthy();
    expect(screen.queryByText("Aguardar")).toBeNull(); // "aguardar" não é oportunidade
    expect(screen.getByText("Amazon FBA")).toBeTruthy();
    expect(screen.getByText("Amazon busca")).toBeTruthy();
    expect(screen.getByText("ML margem")).toBeTruthy();
    expect(screen.getByText("Ver Mercado Livre")).toBeTruthy();
  });

  it("Affiliate Copilot: o que fazer hoje", async () => {
    current = "hoje";
    const { Route } = await import("@/routes/afiliados.hoje");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("Hoje existem 4 ações sugeridas")).toBeTruthy();
    expect(screen.getByText("@joao.fit")).toBeTruthy();
    expect(screen.getByText("+205%")).toBeTruthy();
    expect(screen.getByText("Lia Souza")).toBeTruthy();
    expect(screen.getByText("62%")).toBeTruthy(); // vídeo = 62% das vendas atribuídas
  });

  it("TikTok Shop: economia", async () => {
    current = "tiktok";
    const { Route } = await import("@/routes/marketplace_.tiktok");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("Para onde vai o dinheiro (pedidos liquidados)")).toBeTruthy();
    expect(screen.getByText("75%")).toBeTruthy();
    expect(screen.getByText("Creatina 300g")).toBeTruthy();
    expect(screen.getByText("Produto danificado")).toBeTruthy();
    expect(screen.getByText("Media × Affiliate")).toBeTruthy();
  });

  it("Amazon: ASIN 360°, termos e reposição", async () => {
    current = "amazon";
    const { Route } = await import("@/routes/marketplace_.amazon");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("ASIN 360°")).toBeTruthy();
    expect(screen.getByText("concorrente com a Buy Box")).toBeTruthy();
    expect(screen.getByText("Reposição FBA")).toBeTruthy();
    expect(screen.getByText(/Não foi possível ler: Brand Analytics/)).toBeTruthy();
    expect(screen.getByText("TACoS")).toBeTruthy();

    fireEvent.click(screen.getByText("Ads"));
    expect(screen.getByText("pre treino barato")).toBeTruthy();
    expect(screen.getByText("creatina monohidratada")).toBeTruthy();
    expect(screen.getByText("creatina 1kg")).toBeTruthy(); // subir lance
    expect(screen.getByText("whey protein")).toBeTruthy(); // baixar lance

    fireEvent.click(screen.getByText("Busca"));
    expect(screen.getByText("perdeu")).toBeTruthy();
    expect(screen.getByText("Busca orgânica × Ads")).toBeTruthy();
    expect(screen.getAllByText("creatina pura").length).toBeGreaterThan(0); // domina e paga

    fireEvent.click(screen.getByText("Horários"));
    expect(screen.getByText("Melhores horários")).toBeTruthy();
    expect(screen.getByText("Dom 21h–22h")).toBeTruthy();
  });

  it("Mercado Livre: economia, anúncios e Product Ads", async () => {
    current = "ml";
    const { Route } = await import("@/routes/marketplace_.mercado-livre");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("Para onde vai o dinheiro")).toBeTruthy();
    expect(screen.getByText("Cupom pago pelo ML")).toBeTruthy();
    expect(screen.getAllByText("Creatina ML 300g").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText("Anúncios"));
    expect(screen.getByText("catálogo: ganhar dá lucro")).toBeTruthy();
    expect(screen.getByText("catálogo: ganhar dá prejuízo")).toBeTruthy();
    expect(screen.getByText("Full cobre 5 dias")).toBeTruthy();

    fireEvent.click(screen.getByText("Product Ads"));
    expect(screen.getByText("Onde está o gargalo")).toBeTruthy();
    expect(screen.getByText("orçamento")).toBeTruthy();
  });

  it("Shopee: economia, Ads, produtos, lives e cancelamentos", async () => {
    current = "shopee";
    const { Route } = await import("@/routes/marketplace_.shopee");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("Para onde vai o dinheiro (pedidos liquidados)")).toBeTruthy();
    expect(screen.getByText("Comissão Shopee")).toBeTruthy();
    expect(screen.getByText("Quem pagou os descontos")).toBeTruthy();

    fireEvent.click(screen.getByText("Ads"));
    expect(screen.getByText("GMV Max Whey")).toBeTruthy();
    expect(screen.getByText("Horários para reduzir verba")).toBeTruthy();
    expect(screen.getByText("3h–4h")).toBeTruthy();

    fireEvent.click(screen.getByText("Produtos"));
    expect(screen.getByText("estoque cobre 6 dias")).toBeTruthy();

    fireEvent.click(screen.getByText("Lives"));
    expect(screen.getByText("Live de setembro")).toBeTruthy();

    fireEvent.click(screen.getByText("Cancelamentos"));
    expect(screen.getByText("Fora de estoque")).toBeTruthy();
  });

  it("Google Ads: campanhas, termos, POAS, assets e páginas", async () => {
    current = "google";
    const { Route } = await import("@/routes/media_.google");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("Ritmo do orçamento hoje")).toBeTruthy();
    expect(screen.getByText("abaixo da meta")).toBeTruthy();

    fireEvent.click(screen.getByText("Termos"));
    expect(screen.getByText("creatina gratis")).toBeTruthy();

    fireEvent.click(screen.getByText("Produtos (POAS)"));
    expect(screen.getByText("POAS < 1")).toBeTruthy();
    expect(screen.getByText("Whey Google 900g")).toBeTruthy();

    fireEvent.click(screen.getByText("PMax assets"));
    expect(screen.getByText("Compre já")).toBeTruthy();

    fireEvent.click(screen.getByText("Páginas do site"));
    expect(screen.getByText("chega ao checkout e não fecha")).toBeTruthy();
  });

  it("Meta Ads: atribuição, criativos, segmentos, funil e ritmo", async () => {
    current = "meta";
    const { Route } = await import("@/routes/media_.meta");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("Por dia")).toBeTruthy();
    expect(screen.getAllByText("Pedidos enviados ao Meta").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText("Criativos"));
    expect(screen.getByText("Fadiga: frequência alta e ROAS caindo")).toBeTruthy();
    expect(screen.getByText("UGC Creatina 15s")).toBeTruthy();

    fireEvent.click(screen.getByText("Públicos e posicionamento"));
    expect(screen.getByText("Lookalike compradores")).toBeTruthy();

    fireEvent.click(screen.getByText("Funil e ritmo"));
    expect(screen.getByText("Ritmo de hoje")).toBeTruthy();
    expect(screen.getByText("acima")).toBeTruthy();
  });

  it("Command Center: meta do mês × realizado", async () => {
    current = "metas";
    const { MetasMes } = await import("@/components/metas");
    wrap(<MetasMes />);
    expect(await screen.findByText("Semana da Creatina")).toBeTruthy();
    expect(screen.getByText("80% da meta")).toBeTruthy();
  });

  it("Data Health mostra token com renovação parada", async () => {
    current = "health";
    const { Route } = await import("@/routes/data-health");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("Expirado: renovação parou")).toBeTruthy();
  });
});
