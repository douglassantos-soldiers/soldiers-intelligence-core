import { describe, expect, it } from "vitest";
import {
  campanhasGoogle,
  ritmoIntraday,
  skuDoItemGoogle,
  produtosGoogle,
  assetsPmax,
  paginasSite,
  alertasGoogle,
} from "@/lib/google";

const DE = "2026-09-01";
const ATE = "2026-09-30";

describe("campanhasGoogle", () => {
  const dia = (
    id: string,
    gasto: number,
    receita: number,
    is: number,
    po: number,
    pr: number,
    data = "2026-09-05",
  ) => ({
    data,
    campaign_id: id,
    campaign_name: id,
    gasto,
    receita,
    receita_shopify: receita * 0.8,
    impressoes: 1000,
    fatia_impressao: is,
    fatia_perdida_orcamento: po,
    fatia_perdida_rank: pr,
  });
  const c = campanhasGoogle(
    [
      dia("A", 100, 800, 0.5, 0.4, 0.1),
      dia("A", 100, 800, 0.5, 0.4, 0.1, "2026-09-06"),
      dia("B", 300, 600, 0.6, 0.05, 0.35),
      dia("C", 50, 300, 0.3, 0.1, 0.6),
      dia("A", 999, 0, 0, 0, 0, "2026-08-01"),
    ],
    [
      {
        campaign_id: "A",
        campaign_name: "PMax Creatina",
        target_roas: 5,
        orcamento_diario: 100,
        optimization_score: 0.82,
      },
      { campaign_id: "B", campaign_name: "Search Whey", target_roas: 4 },
      { campaign_id: "C", campaign_name: "Search Marca" },
    ],
    DE,
    ATE,
  );
  it("soma o período, pondera fatias e separa receita Google × Shopify", () => {
    const a = c.campanhas.find((x) => x.id === "A")!;
    expect(a.gasto).toBe(200);
    expect(a.roas).toBe(8);
    expect(a.roasShopify).toBeCloseTo(6.4, 6);
    expect(a.perdaOrcamentoPct).toBeCloseTo(40, 6);
    expect(a.optimizationScore).toBeCloseTo(82, 6);
    expect(a.gastoMedioDia).toBe(100);
  });
  it("diagnostica orçamento, meta e rank", () => {
    expect(c.campanhas.map((x) => [x.nome, x.diagnostico])).toEqual([
      ["Search Whey", "abaixo_meta"],
      ["PMax Creatina", "orcamento"],
      ["Search Marca", "rank"],
    ]);
  });
});

describe("ritmoIntraday", () => {
  it("compara % do orçamento gasto com % do dia passado (Brasília)", () => {
    // 15:00 UTC = 12:00 em Brasília → 50% do dia
    const r = ritmoIntraday(
      [
        { data: "2026-10-03", campaign_id: "A", gasto: 40, captured_at: "2026-10-03T14:00:00Z" },
        { data: "2026-10-03", campaign_id: "A", gasto: 90, captured_at: "2026-10-03T15:00:00Z" },
        { data: "2026-10-03", campaign_id: "B", gasto: 10, captured_at: "2026-10-03T15:00:00Z" },
        { data: "2026-10-02", campaign_id: "A", gasto: 500, captured_at: "2026-10-02T23:00:00Z" },
      ],
      [
        { campaign_id: "A", campaign_name: "PMax", orcamento_diario: 100 },
        { campaign_id: "B", campaign_name: "Search", orcamento_diario: 100 },
      ],
    );
    expect(r.data).toBe("2026-10-03");
    expect(r.campanhas.map((x) => [x.nome, x.ritmo])).toEqual([
      ["PMax", "acima"],
      ["Search", "abaixo"],
    ]);
    expect(r.campanhas[0]!.pctDia).toBe(50);
  });
});

describe("produtosGoogle", () => {
  const variantes = [
    {
      product_variant_id: "gid://shopify/ProductVariant/44556677889",
      product_variant_sku: "CREA300",
      product_variant_price: 100,
    },
    {
      product_variant_id: "11112222333",
      product_variant_sku: "WHEY900",
      product_variant_price: 200,
    },
  ];
  const custos = [
    { sku: "CREA300", custo_unitario: 40, vigencia_inicio: "2026-01-01" },
    { sku: "WHEY900", custo_unitario: 150, vigencia_inicio: "2026-01-01" },
  ];
  it("acha o SKU pelo ID da variante ou pelo próprio SKU", () => {
    expect(
      skuDoItemGoogle("shopify_BR_123456789_44556677889", variantes)?.["product_variant_sku"],
    ).toBe("CREA300");
    expect(skuDoItemGoogle("whey900", variantes)?.["product_variant_sku"]).toBe("WHEY900");
    expect(skuDoItemGoogle("xyz", variantes)).toBeUndefined();
  });
  it("calcula POAS sobre a margem bruta da receita atribuída", () => {
    const p = produtosGoogle(
      [
        {
          data: "2026-09-05",
          product_item_id: "shopify_BR_1_44556677889",
          product_title: "Creatina",
          gasto: 100,
          receita: 500,
          conversoes: 5,
        },
        {
          data: "2026-09-05",
          product_item_id: "WHEY900",
          product_title: "Whey",
          gasto: 100,
          receita: 300,
          conversoes: 2,
        },
        {
          data: "2026-09-05",
          product_item_id: "desconhecido",
          product_title: "BCAA",
          gasto: 10,
          receita: 50,
        },
      ],
      variantes,
      custos,
      DE,
      ATE,
    );
    const crea = p.lista.find((x) => x.titulo === "Creatina")!;
    expect(crea.margemPct).toBe(60);
    expect(crea.poas).toBe(3); // 500 × 60% ÷ 100
    expect(crea.sinal).toBe("escalar");
    const whey = p.lista.find((x) => x.titulo === "Whey")!;
    expect(whey.poas).toBeCloseTo(0.75, 6); // 300 × 25% ÷ 100
    expect(whey.contribuicao).toBeCloseTo(-25, 6);
    expect(p.prejuizo.map((x) => x.titulo)).toEqual(["Whey"]);
    expect(p.semVinculo).toBe(1);
  });
});

describe("assetsPmax", () => {
  it("conta assets com desempenho baixo por grupo", () => {
    const a = assetsPmax([
      {
        campaign_id: "1",
        campaign_name: "PMax",
        asset_group_id: "g1",
        asset_group_name: "Creatina",
        performance_label: "LOW",
        field_type: "HEADLINE",
        texto: "Compre já",
      },
      {
        campaign_id: "1",
        campaign_name: "PMax",
        asset_group_id: "g1",
        asset_group_name: "Creatina",
        performance_label: "BEST",
        field_type: "HEADLINE",
        texto: "Creatina pura",
      },
      {
        campaign_id: "1",
        campaign_name: "PMax",
        asset_group_id: "g1",
        asset_group_name: "Creatina",
        performance_label: "LOW",
        status: "REMOVED",
      },
    ]);
    expect(a.totalBaixos).toBe(1);
    expect(a.grupos[0]).toMatchObject({ grupo: "Creatina", total: 2, baixo: 1, melhor: 1 });
    expect(a.baixos[0]).toMatchObject({ tipo: "HEADLINE", texto: "Compre já" });
  });
});

describe("paginasSite e alertas", () => {
  const sess = (path: string, sessoes: number, checkout: number) => ({
    data: "2026-09-05",
    pagina_path: path,
    sessoes,
    sessoes_checkout: checkout,
  });
  const ped = (path: string, pedidos: number, receita: number) => ({
    data: "2026-09-05",
    pagina_path: path,
    pedidos,
    receita,
  });
  const p = paginasSite(
    [
      sess("/products/creatina", 1000, 100),
      sess("/pages/lp-whey", 2000, 200),
      sess("/products/bcaa", 500, 50),
      sess("/x", 10, 0),
    ],
    [
      ped("/products/creatina", 40, 4000),
      ped("/pages/lp-whey", 10, 1500),
      ped("/products/bcaa", 20, 1000),
    ],
    [
      { pagina_path: "/products/creatina", tipo: "PDP", rotulo: "Creatina" },
      { pagina_path: "/pages/lp-whey", tipo: "LP", rotulo: "LP Whey" },
      { pagina_path: "/products/bcaa", tipo: "PDP", rotulo: "BCAA" },
    ],
    DE,
    ATE,
  );
  it("cruza sessões (GA4) com pedidos (Shopify) e acha página que não converte", () => {
    // conversões: creatina 4%, lp 0,5%, bcaa 4% → mediana 4%; fechamento: 40%, 5%, 40%
    const lp = p.lista.find((x) => x.path === "/pages/lp-whey")!;
    expect(lp.conversaoPct).toBe(0.5);
    expect(lp.problemas).toEqual([
      "conversão abaixo da metade da mediana",
      "chega ao checkout e não fecha",
    ]);
    expect(p.lista.find((x) => x.path === "/x")).toBeUndefined();
    expect(p.porTipo.find((t) => t.tipo === "PDP")).toMatchObject({ sessoes: 1500, pedidos: 60 });
  });
  it("gera alertas", () => {
    const a = alertasGoogle({
      campanhas: {
        gasto: 0,
        receitaGoogle: 0,
        receitaShopify: 0,
        roas: null,
        roasShopify: null,
        campanhas: [],
      },
      produtos: { semVinculo: 0, prejuizo: [], lista: [] },
      termosNegativar: [{ termo: "x", invest_desperdicado: 80 }],
      paginas: p,
    });
    expect(a.map((x) => x.tag)).toEqual(["Google termos", "Site"]);
  });
});
