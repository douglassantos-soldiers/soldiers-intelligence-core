// Dados de exemplo (fictícios) do painel de Ads de marketplace: campanhas, itens e dias inventados.
import {
  linhasMlProductAds,
  linhasMlDisplay,
  linhasMlBrand,
  linhasAmazon,
  itensAmazon,
  linhasShopee,
  linhasMeta,
  itensMeta,
  linhasGoogle,
  itensGoogle,
  linhasMidiaGeral,
} from "@/lib/painel-ads";

const DIAS = Array.from({ length: 14 }, (_, i) =>
  new Date(Date.parse("2026-09-17T00:00:00Z") + i * 86400000).toISOString().slice(0, 10),
);
// Variação determinística por dia (sem Math.random, para o teste ser estável).
const onda = (i: number, fase = 0) => 1 + 0.25 * Math.sin((i + fase) / 2);

const CAMPANHAS_ML = [
  {
    id: 1,
    nome: "1 - CREATINA",
    status: "active",
    itens: [
      ["MLB1", "Creatina 300g", true, true, "fulfillment"],
      ["MLB2", "Creatina 1kg", true, false, "fulfillment"],
    ],
  },
  {
    id: 2,
    nome: "2 - WHEY",
    status: "active",
    itens: [["MLB3", "Whey 900g", false, true, "cross_docking"]],
  },
  {
    id: 3,
    nome: "3 - PRÉ-TREINO",
    status: "active",
    itens: [["MLB4", "Pré-treino 300g", true, false, "fulfillment"]],
  },
  {
    id: 4,
    nome: "KITS",
    status: "paused",
    itens: [["MLB5", "Kit Creatina + Whey", false, false, "cross_docking"]],
  },
] as const;

const itensMl = CAMPANHAS_ML.flatMap((c, ci) =>
  c.itens.flatMap(([id, titulo, bb, cat, log], ii) =>
    DIAS.map((d, i) => {
      const k = c.status === "paused" ? 0 : ((3 - ci) * 120 * onda(i, ci + ii)) / (ii + 1);
      return {
        date: d,
        campaign_id: c.id,
        campaign_name: c.nome,
        item_id: id,
        title: titulo,
        status: "active",
        cost: k,
        clicks: Math.round(k / 2),
        prints: Math.round(k * 140),
        units_quantity: Math.round(k / 9),
        organic_units_quantity: Math.round(k / 11),
        direct_amount: k * 8.5,
        indirect_amount: k * 1.6,
        impression_share: 0.42 - ci * 0.05,
        top_impression_share: 0.18,
        lost_impression_share_by_budget: ci === 0 ? 0.25 : 0.05,
        lost_impression_share_by_ad_rank: 0.3,
        acos_benchmark: 0.12,
        buy_box_winner: bb,
        catalog_listing: cat,
        logistic_type: log,
      };
    }),
  ),
);

export const mlPainelFixture = [
  ...linhasMlProductAds(
    itensMl,
    CAMPANHAS_ML.map((c) => ({ campaign_id: c.id, name: c.nome, status: c.status })),
  ),
  ...linhasMlDisplay(
    DIAS.map((d, i) => ({
      data: d,
      campaign_id: "D1",
      campaign_name: "Display Creatina",
      status: "active",
      investimento: 90 * onda(i),
      receita: 410 * onda(i, 1),
      unidades: 4,
      impressoes: 52000,
      cliques: 160,
    })),
  ),
  ...linhasMlBrand(DIAS.map((d, i) => ({ data: d, invest_brand: 60 * onda(i, 2) }))),
];

const campanhasAmz = [
  { campaign_id: "sp1", campaign_name: "SP Creatina - Exata", ad_type: "SP", status: "ENABLED" },
  { campaign_id: "sp2", campaign_name: "SP Whey - Auto", ad_type: "SP", status: "ENABLED" },
  { campaign_id: "sp3", campaign_name: "SP Glutamina", ad_type: "SP", status: "PAUSED" },
  { campaign_id: "sb1", campaign_name: "SB Marca Soldiers", ad_type: "SB", status: "ENABLED" },
  { campaign_id: "sd1", campaign_name: "SD Remarketing", ad_type: "SD", status: "ENABLED" },
];
const adsAmz = DIAS.flatMap((d, i) => [
  {
    data: d,
    ad_type: "SP",
    campaign_id: "sp1",
    campaign_name: "SP Creatina - Exata",
    cost: 180 * onda(i),
    sales_padrao: 1100 * onda(i, 1),
    janela: "7d",
    units_7d: 12,
    clicks: 95,
    impressions: 21000,
    top_search_is: 0.31,
  },
  {
    data: d,
    ad_type: "SP",
    campaign_id: "sp2",
    campaign_name: "SP Whey - Auto",
    cost: 120 * onda(i, 2),
    sales_padrao: 430 * onda(i, 3),
    janela: "7d",
    units_7d: 3,
    clicks: 80,
    impressions: 30000,
    top_search_is: 0.12,
  },
  {
    data: d,
    ad_type: "SB",
    campaign_id: "sb1",
    campaign_name: "SB Marca Soldiers",
    cost: 70 * onda(i, 1),
    sales_padrao: 380 * onda(i),
    janela: "14d",
    units_sold: 4,
    clicks: 40,
    impressions: 15000,
  },
  {
    data: d,
    ad_type: "SD",
    campaign_id: "sd1",
    campaign_name: "SD Remarketing",
    cost: 40 * onda(i, 3),
    sales_padrao: 150 * onda(i, 2),
    janela: "14d",
    units_sold: 2,
    clicks: 35,
    impressions: 40000,
  },
]);
export const amazonPainelFixture = {
  linhas: linhasAmazon(adsAmz, campanhasAmz),
  itens: itensAmazon(
    DIAS.flatMap((d, i) => [
      {
        data: d,
        campaign_id: "sp1",
        campaign_name: "SP Creatina - Exata",
        ad_type: "SP",
        asin: "B0CREA",
        cost: 130 * onda(i),
        clicks: 70,
        impressions: 15000,
        sales_14d: 900,
        units_14d: 10,
      },
      {
        data: d,
        campaign_id: "sp1",
        campaign_name: "SP Creatina - Exata",
        ad_type: "SP",
        asin: "B0CREA1K",
        cost: 50 * onda(i),
        clicks: 25,
        impressions: 6000,
        sales_14d: 260,
        units_14d: 2,
      },
    ]),
    campanhasAmz,
    new Map([
      ["B0CREA", "Creatina Amazon 300g"],
      ["B0CREA1K", "Creatina Amazon 1kg"],
    ]),
  ),
};

export const shopeePainelFixture = linhasShopee(
  DIAS.flatMap((d, i) => [
    {
      data: d,
      campaign_id: 11,
      ad_type: "product",
      expense: 85 * onda(i),
      broad_gmv: 900 * onda(i, 1),
      direct_gmv: 640 * onda(i, 1),
      broad_order: 9,
      clicks: 210,
      impression: 26000,
    },
    {
      data: d,
      campaign_id: 12,
      ad_type: "product",
      expense: 40 * onda(i, 2),
      broad_gmv: 220 * onda(i, 2),
      direct_gmv: 150,
      broad_order: 3,
      clicks: 90,
      impression: 14000,
    },
    {
      data: d,
      campaign_id: 21,
      ad_type: "shop",
      expense: 30 * onda(i, 1),
      broad_gmv: 260 * onda(i),
      direct_gmv: 120,
      broad_order: 3,
      clicks: 60,
      impression: 18000,
    },
  ]),
  [
    {
      campaign_id: 11,
      ad_name: "Creatina - GMV Max",
      ad_type: "product",
      campaign_status: "ongoing",
    },
    { campaign_id: 12, ad_name: "Whey - manual", ad_type: "product", campaign_status: "paused" },
    { campaign_id: 21, ad_name: "Loja Soldiers", ad_type: "shop", campaign_status: "ongoing" },
  ],
);

// ---------------- Mídia: Meta, Google e visão geral ----------------
const CAMPANHAS_META = [
  {
    campaign_id: "m1",
    campaign_name: "VENDAS | CREATINA | ASC",
    objetivo: "OUTCOME_SALES",
    st: "ACTIVE",
    k: 1,
  },
  {
    campaign_id: "m2",
    campaign_name: "VENDAS | WHEY | REMARKETING",
    objetivo: "OUTCOME_SALES",
    st: "ACTIVE",
    k: 0.5,
  },
  {
    campaign_id: "m3",
    campaign_name: "TRÁFEGO | BLOG",
    objetivo: "OUTCOME_TRAFFIC",
    st: "PAUSED",
    k: 0.2,
  },
];
export const metaPainelFixture = {
  linhas: linhasMeta(
    CAMPANHAS_META.flatMap((c, ci) =>
      DIAS.map((d, i) => ({
        data: d,
        campaign_id: c.campaign_id,
        campaign_name: c.campaign_name,
        objetivo: c.objetivo,
        gasto: 600 * c.k * onda(i, ci),
        receita: c.objetivo === "OUTCOME_SALES" ? 2400 * c.k * onda(i, ci + 1) : 0,
        compras: c.objetivo === "OUTCOME_SALES" ? Math.round(18 * c.k) : 0,
        impressoes: Math.round(90000 * c.k),
        cliques: Math.round(1300 * c.k),
      })),
    ),
    CAMPANHAS_META.map((c) => ({ ...c, effective_status: c.st })),
  ),
  itens: itensMeta(
    DIAS.flatMap((d, i) => [
      {
        data: d,
        campaign_id: "m1",
        campaign_name: "VENDAS | CREATINA | ASC",
        objetivo: "OUTCOME_SALES",
        ad_id: "a1",
        ad_name: "UGC Creatina 15s",
        adset_name: "ASC aberto",
        gasto: 380 * onda(i),
        receita: 1700 * onda(i, 1),
        compras: 12,
        impressoes: 55000,
        cliques: 820,
      },
      {
        data: d,
        campaign_id: "m1",
        campaign_name: "VENDAS | CREATINA | ASC",
        objetivo: "OUTCOME_SALES",
        ad_id: "a2",
        ad_name: "Carrossel Creatina",
        adset_name: "ASC aberto",
        gasto: 220 * onda(i, 2),
        receita: 700 * onda(i, 3),
        compras: 6,
        impressoes: 35000,
        cliques: 480,
      },
    ]),
  ),
};

const CAMPANHAS_GOOGLE = [
  {
    campaign_id: "g1",
    campaign_name: "PMax | Creatina",
    tipo: "PERFORMANCE_MAX",
    status: "ENABLED",
    k: 1,
  },
  { campaign_id: "g2", campaign_name: "Search | Marca", tipo: "SEARCH", status: "ENABLED", k: 0.4 },
  {
    campaign_id: "g3",
    campaign_name: "Search | Genérico Whey",
    tipo: "SEARCH",
    status: "PAUSED",
    k: 0.3,
  },
];
export const googlePainelFixture = {
  linhas: linhasGoogle(
    CAMPANHAS_GOOGLE.flatMap((c, ci) =>
      DIAS.map((d, i) => ({
        data: d,
        campaign_id: c.campaign_id,
        campaign_name: c.campaign_name,
        tipo: c.tipo,
        gasto: 500 * c.k * onda(i, ci),
        receita: 2100 * c.k * onda(i, ci + 2),
        conversoes: 15 * c.k,
        impressoes: Math.round(40000 * c.k),
        cliques: Math.round(1100 * c.k),
        fatia_impressao: 0.55 - ci * 0.1,
        fatia_topo: 0.3,
        fatia_perdida_orcamento: ci === 0 ? 0.2 : 0.05,
        fatia_perdida_rank: 0.25,
      })),
    ),
    CAMPANHAS_GOOGLE,
  ),
  itens: itensGoogle(
    DIAS.flatMap((d, i) => [
      {
        data: d,
        campaign_id: "g2",
        campaign_name: "Search | Marca",
        tipo: "SEARCH",
        ad_group_id: "ag1",
        ad_group_name: "Soldiers exata",
        gasto: 140 * onda(i),
        receita: 700,
        conversoes: 5,
        impressoes: 10000,
        cliques: 320,
      },
      {
        data: d,
        campaign_id: "g2",
        campaign_name: "Search | Marca",
        tipo: "SEARCH",
        ad_group_id: "ag2",
        ad_group_name: "Soldiers creatina",
        gasto: 60 * onda(i, 1),
        receita: 140,
        conversoes: 1,
        impressoes: 6000,
        cliques: 120,
      },
    ]),
  ),
};

export const midiaPainelFixture = linhasMidiaGeral(
  DIAS.flatMap((d, i) =>
    (
      [
        ["Meta", 900, 3300],
        ["Google", 700, 2900],
        ["Amazon Ads", 400, 2000],
        ["Mercado Ads", 300, 2600],
        ["TikTok Ads", 250, 900],
      ] as const
    ).map(([tipo, inv, rec], ti) => ({
      data: d,
      tipo,
      investimento: inv * onda(i, ti),
      receita: rec * onda(i, ti + 1),
      impressoes: inv * 120,
      cliques: inv * 2,
      unidades: Math.round(rec / 120),
    })),
  ),
);
