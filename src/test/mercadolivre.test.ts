import { describe, expect, it } from "vitest";
import { economiaML, anuncios360, diagnosticoAds, alertasML } from "@/lib/mercadolivre";

const DE = "2026-09-01";
const ATE = "2026-09-30";
const custos = [
  { sku: "CREA300", custo_unitario: 30, vigencia_inicio: "2026-01-01" },
  { sku: "WHEY900", custo_unitario: 70, vigencia_inicio: "2026-01-01" },
];
const pedidos = [
  { pedido_id: 1, data_venda: "2026-09-05", status: "paid", total_sale_fee: 30, total_amount: 200 },
  {
    pedido_id: 2,
    data_venda: "2026-09-06",
    status: "paid",
    total_sale_fee: -12,
    total_amount: 100,
  },
  { pedido_id: 3, data_venda: "2026-09-07", status: "cancelled", total_sale_fee: 10 },
  { pedido_id: 4, data_venda: "2026-08-07", status: "paid", total_sale_fee: 10 },
];
const itens = [
  {
    pedido_id: 1,
    item_id: "MLB1",
    seller_sku: "CREA300",
    title: "Creatina",
    quantity: 1,
    unit_price: 100,
  },
  {
    pedido_id: 1,
    item_id: "MLB2",
    seller_sku: "WHEY900",
    title: "Whey",
    quantity: 1,
    unit_price: 100,
  },
  {
    pedido_id: 2,
    item_id: "MLB1",
    seller_sku: "CREA300",
    title: "Creatina",
    quantity: 1,
    unit_price: 100,
  },
  { pedido_id: 3, item_id: "MLB1", seller_sku: "CREA300", quantity: 1, unit_price: 100 },
  { pedido_id: 4, item_id: "MLB1", seller_sku: "CREA300", quantity: 1, unit_price: 100 },
];
const fretes = [
  { pedido_id: 1, frete_rateado: 20 },
  { pedido_id: 2, frete_rateado: -10 },
];
const cupons = [{ pedido_id: 1, cupom_vendedor: 10, cupom_meli: 15 }];
const afiliados = [
  { pedido_id: 2, item_id: "x", item_id_ml: "MLB1", comissao_pedido: 8, casou_pedido: true },
  { pedido_id: 2, item_id: "x", item_id_ml: "MLB1", comissao_pedido: 8, casou_pedido: true }, // duplicada
];
const adsItem = [
  { date: "2026-09-05", item_id: "MLB1", cost: 6 },
  { date: "2026-09-05", item_id: "MLB9", cost: 4 },
];
const adsConta = [{ data: "2026-09-05", invest_pads: 10, invest_brand: 5, invest_display: 0 }];

describe("economiaML", () => {
  const e = economiaML(
    pedidos,
    itens,
    fretes,
    cupons,
    afiliados,
    custos,
    adsItem,
    adsConta,
    DE,
    ATE,
  );

  it("conta só pedidos válidos do período", () => {
    expect(e.pedidos).toBe(2);
    expect(e.cancelados).toBe(1);
    expect(e.receita).toBe(300);
  });

  it("cupom do ML não reduz a receita; o da Soldiers reduz", () => {
    expect(e.cupomMeli).toBe(15);
    expect(e.cupomVendedor).toBe(10);
    expect(e.receitaLiquida).toBe(290);
  });

  it("custos em valor absoluto e afiliado sem duplicar", () => {
    expect(e.tarifa).toBe(42);
    expect(e.frete).toBe(30);
    expect(e.afiliado).toBe(8);
    expect(e.cmv).toBe(130); // 30 + 70 + 30
    expect(e.contribuicaoAntesAds).toBe(290 - 42 - 30 - 8 - 130);
  });

  it("Ads da conta inteira (Product + Brand + Display) sai da contribuição final", () => {
    expect(e.ads).toBe(15);
    expect(e.contribuicao).toBe(80 - 15);
  });

  it("rateia tarifa, frete e cupom do pedido entre os SKUs pela receita", () => {
    const crea = e.skus.find((s) => s.sku === "CREA300")!;
    expect(crea.unidades).toBe(2);
    expect(crea.tarifa).toBe(15 + 12);
    expect(crea.frete).toBe(10 + 10);
    expect(crea.cupomVendedor).toBe(5);
    expect(crea.afiliado).toBe(8);
    expect(crea.ads).toBe(6); // Product Ads do anúncio MLB1
    expect(crea.contribuicao).toBe(200 - 5 - 27 - 20 - 8 - 60 - 6);
  });
});

describe("anuncios360", () => {
  const econ = economiaML(
    pedidos,
    itens,
    fretes,
    cupons,
    afiliados,
    custos,
    adsItem,
    adsConta,
    DE,
    ATE,
  );
  const r = anuncios360(
    [
      {
        data: "2026-09-05",
        item_id: "MLB1",
        visitas: 1000,
        pedidos: 50,
        unidades: 50,
        faturamento: 5000,
      },
      {
        data: "2026-09-05",
        item_id: "MLB2",
        visitas: 1000,
        pedidos: 5,
        unidades: 5,
        faturamento: 500,
      },
      {
        data: "2026-09-05",
        item_id: "MLB3",
        visitas: 400,
        pedidos: 20,
        unidades: 20,
        faturamento: 900,
      },
    ],
    [
      {
        item_id: "MLB1",
        sku: "CREA300",
        nome: "Creatina 300g",
        preco_venda: 100,
        price_to_win: 95,
        buybox_status: "competing",
        health: 0.9,
      },
      {
        item_id: "MLB2",
        sku: "WHEY900",
        nome: "Whey 900g",
        preco_venda: 100,
        price_to_win: 60,
        buybox_status: "competing",
        health: 0.5,
      },
      { item_id: "MLB3", sku: "OUTRO", nome: "BCAA", buybox_status: "winning", health: 0.95 },
      { item_id: "MLB4", sku: "X", nome: "Velho", anuncio_status: "closed" },
    ],
    [{ seller_sku: "CREA300", em_full: true, full_disponivel: 40, cobertura_dias: 6 }],
    econ.skus,
    DE,
    ATE,
  );

  it("ordena por faturamento e ignora anúncio encerrado sem venda", () => {
    expect(r.map((a) => a.item)).toEqual(["MLB1", "MLB3", "MLB2"]);
  });

  it("catálogo: diz se ganhar no price_to_win ainda dá lucro", () => {
    // Creatina: tarifa 27/200 = 13,5%; frete 10/un; CMV 30/un → 95 − 12,825 − 10 − 30 = 42,175
    expect(r[0]!.contribuicaoNoPtw).toBeCloseTo(42.175, 6);
    expect(r[0]!.problemas).toContain("catálogo: ganhar dá lucro");
    expect(r[0]!.problemas).toContain("Full cobre 6 dias");
    // Whey a 60: tarifa 15% → 60 − 9 − 10 − 70 < 0
    expect(r[2]!.problemas[0]).toBe("catálogo: ganhar dá prejuízo");
    expect(r[2]!.problemas).toContain("qualidade 50%");
    expect(r[2]!.problemas).toContain("conversão abaixo da metade da mediana");
  });

  it("vira alertas de catálogo e Full", () => {
    const a = alertasML({ anuncios: r, ads: diagnosticoAds([], DE, ATE) });
    expect(a.map((x) => [x.tipo, x.tag])).toEqual([
      ["problema", "ML Full"],
      ["oportunidade", "ML catálogo"],
      ["problema", "ML catálogo"],
    ]);
  });
});

describe("diagnosticoAds", () => {
  const row = (
    item: string,
    cost: number,
    direct: number,
    budget: number,
    rank: number,
    bench = 0.2,
  ) => ({
    date: "2026-09-05",
    item_id: item,
    title: item,
    cost,
    direct_amount: direct,
    indirect_amount: 0,
    organic_units_amount: 100,
    lost_impression_share_by_budget: budget,
    lost_impression_share_by_ad_rank: rank,
    acos_benchmark: bench,
  });
  const d = diagnosticoAds(
    [
      row("A", 100, 1000, 0.4, 0.1),
      row("B", 200, 500, 0.1, 0.1),
      row("C", 50, 400, 0.05, 0.5),
      row("D", 10, 200, 0, 0),
    ],
    DE,
    ATE,
  );
  it("separa orçamento, ACoS alto e rank", () => {
    expect(d.lista.map((i) => [i.item, i.diagnostico])).toEqual([
      ["B", "acos_alto"],
      ["A", "orcamento"],
      ["C", "rank"],
    ]);
    expect(d.lista[1]!.perdaOrcamentoPct).toBeCloseTo(40, 6);
    expect(d.acosPct).toBeCloseTo((360 / 2100) * 100, 6);
    expect(d.vendasOrganicas).toBe(400);
  });

  it("vira alertas para o Command Center", () => {
    const a = alertasML({ anuncios: [], ads: d });
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ tipo: "oportunidade", tag: "ML Ads" });
  });
});
