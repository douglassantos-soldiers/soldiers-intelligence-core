import { describe, expect, it } from "vitest";
import {
  economiaShopee,
  cancelamentosShopee,
  adsShopee,
  adsPorHora,
  produtosShopee,
  livesShopee,
  alertasShopee,
} from "@/lib/shopee";

const DE = "2026-09-01";
const ATE = "2026-09-30";
const custos = [
  { sku: "CREA300", custo_unitario: 30, vigencia_inicio: "2026-01-01" },
  { sku: "WHEY900", custo_unitario: 70, vigencia_inicio: "2026-01-01" },
];
const pedidos = [
  { order_sn: "A", create_dia: "2026-09-05", order_status: "COMPLETED", total_amount: 200 },
  { order_sn: "B", create_dia: "2026-09-06", order_status: "SHIPPED", total_amount: 100 },
  {
    order_sn: "C",
    create_dia: "2026-09-07",
    order_status: "CANCELLED",
    cancel_reason: "Fora de estoque",
    cancel_by: "seller",
    total_amount: 90,
  },
  { order_sn: "D", create_dia: "2026-08-07", order_status: "COMPLETED" },
];
const itens = [
  {
    order_sn: "A",
    create_dia: "2026-09-05",
    model_sku: "CREA300",
    item_name: "Creatina",
    model_quantity_purchased: 2,
    model_discounted_price: 50,
    returned_qty: 1,
  },
  {
    order_sn: "A",
    create_dia: "2026-09-05",
    model_sku: "WHEY900",
    item_name: "Whey",
    model_quantity_purchased: 1,
    model_discounted_price: 100,
  },
  {
    order_sn: "B",
    create_dia: "2026-09-06",
    item_sku: "CREA300",
    item_name: "Creatina",
    model_quantity_purchased: 2,
    cancelled_qty: 0,
    model_discounted_price: 50,
  },
  {
    order_sn: "C",
    create_dia: "2026-09-07",
    model_sku: "CREA300",
    model_quantity_purchased: 1,
    model_discounted_price: 90,
  },
];
const fin = [
  {
    order_sn: "A",
    escrow_amount: 150,
    commission_fee: -20,
    service_fee: -10,
    seller_transaction_fee: -4,
    shopee_discount: 5,
    voucher_from_shopee: 10,
    seller_discount: 3,
    voucher_from_seller: 0,
    coins: 2,
    actual_shipping_fee: 25,
    shopee_shipping_rebate: 10,
    buyer_paid_shipping_fee: 5,
  },
  { order_sn: "B", escrow_amount: null },
];

describe("economiaShopee", () => {
  const e = economiaShopee(
    pedidos,
    itens,
    fin,
    custos,
    [{ data: "2026-09-05", expense: 40 }],
    DE,
    ATE,
  );
  it("conta pedidos válidos e separa liquidado de em aberto", () => {
    expect(e.pedidos).toBe(2);
    expect(e.receita).toBe(300);
    expect(e.liquidados).toBe(1);
    expect(e.pctLiquidado).toBe(50);
    expect(e.emAbertoValor).toBe(100);
  });
  it("contribuição liquidada = repasse − CMV; custos do escrow em valor absoluto", () => {
    expect(e.repasse).toBe(150);
    expect(e.cmvLiquidado).toBe(130);
    expect(e.contribuicaoLiquidada).toBe(20);
    expect(e.custos.find((c) => c.chave === "commission_fee")!.valor).toBe(20);
    expect(e.adsGasto).toBe(40);
  });
  it("separa desconto da Shopee e da loja, e calcula o frete pago pela loja", () => {
    expect(e.descontoShopee).toBe(15);
    expect(e.descontoLoja).toBe(3);
    expect(e.moedas).toBe(2);
    expect(e.freteLoja).toBe(10); // 25 − 10 − 5
  });
  it("rateia o repasse entre SKUs pela receita", () => {
    const crea = e.skus.find((s) => s.sku === "CREA300")!;
    expect(crea.repasse).toBe(75);
    expect(crea.contribuicao).toBe(15);
  });
});

describe("cancelamentosShopee", () => {
  it("agrupa cancelamentos por motivo e devoluções por SKU", () => {
    const c = cancelamentosShopee(pedidos, itens, DE, ATE);
    expect(c.cancelados).toBe(1);
    expect(c.pctCancelados).toBeCloseTo(100 / 3, 6);
    expect(c.motivos[0]).toMatchObject({ motivo: "Fora de estoque", quem: "seller", pedidos: 1 });
    expect(c.devolucoes[0]).toMatchObject({ sku: "CREA300", devolvidas: 1, vendidas: 5 });
  });
});

describe("adsShopee e adsPorHora", () => {
  const a = adsShopee(
    [
      {
        data: "2026-09-05",
        campaign_id: 1,
        ad_type: "auto",
        expense: 100,
        direct_gmv: 400,
        broad_gmv: 700,
        clicks: 50,
      },
      {
        data: "2026-09-05",
        campaign_id: 2,
        ad_type: "manual",
        expense: 50,
        direct_gmv: 50,
        broad_gmv: 100,
        clicks: 20,
      },
    ],
    [
      { campaign_id: 1, ad_name: "GMV Max Creatina", roas_target: 5 },
      { campaign_id: 2, ad_name: "Whey manual", roas_target: 4 },
    ],
    DE,
    ATE,
  );
  it("ROAS direto e amplo separados; meta comparada com o amplo", () => {
    expect(a.roasDireto).toBeCloseTo(450 / 150, 6);
    expect(a.roasAmplo).toBeCloseTo(800 / 150, 6);
    expect(a.campanhas.map((c) => [c.nome, c.abaixoDaMeta])).toEqual([
      ["GMV Max Creatina", false],
      ["Whey manual", true],
    ]);
  });
  it("horas para reduzir e concentrar verba", () => {
    const h = adsPorHora(
      [
        { data: "2026-09-06", hora: 3, expense: 50, direct_gmv: 50 },
        { data: "2026-09-06", hora: 20, expense: 50, direct_gmv: 500 },
        { data: "2026-09-07", hora: 12, expense: 100, direct_gmv: 350 },
      ],
      DE,
      ATE,
    );
    expect(h.roasMedio).toBe(900 / 200);
    expect(h.reduzir.map((x) => x.hora)).toEqual([3]);
    expect(h.concentrar.map((x) => x.hora)).toEqual([20]);
    expect(h.celulas.find((c) => c.dow === 0 && c.hora === 20)!.roas).toBe(10);
  });
});

describe("produtosShopee", () => {
  const p = produtosShopee(
    [
      {
        data: "2026-09-05",
        item_id: "1",
        title: "Creatina",
        seller_sku: "CREA300",
        visitas: 1000,
        pedidos: 50,
        unidades_vendidas: 60,
        receita: 3000,
      },
      {
        data: "2026-09-05",
        item_id: "2",
        title: "Whey",
        seller_sku: "WHEY900",
        visitas: 1000,
        pedidos: 5,
        unidades_vendidas: 5,
        receita: 500,
      },
      {
        data: "2026-09-05",
        item_id: "3",
        title: "BCAA",
        visitas: 300,
        pedidos: 30,
        unidades_vendidas: 30,
        receita: 900,
      },
    ],
    [
      { item_id: "1", estoque_total: 50, dias_de_cobertura: 8, media_diaria: 6 },
      { item_id: "1", estoque_total: 10, dias_de_cobertura: 30, media_diaria: 0.3 },
      { item_id: "2", estoque_total: 0, dias_de_cobertura: 0, media_diaria: 0.2 },
    ],
    [
      { item_id: "1", nome: "Creatina 300g", fotos: 8, tem_dimensoes: true, rating: 4.9 },
      { item_id: "2", nome: "Whey 900g", fotos: 3, tem_dimensoes: false, rating: 4.2 },
    ],
    [
      { item_id: "1", data: "2026-09-01", rating: 4.9 },
      { item_id: "1", data: "2026-09-30", rating: 4.7, comentarios: 120 },
    ],
    DE,
    ATE,
  );
  it("lista problemas por produto", () => {
    expect(p.map((x) => x.item)).toEqual(["1", "3", "2"]);
    expect(p[0]!.problemas).toEqual(["estoque cobre 8 dias", "nota caiu 0,2"]);
    expect(p[0]!.estoque).toBe(60);
    expect(p[2]!.problemas).toEqual([
      "sem estoque",
      "nota 4,2",
      "conversão abaixo da metade da mediana",
      "3 fotos",
      "sem dimensões",
    ]);
  });
});

describe("livesShopee e alertas", () => {
  const l = livesShopee(
    [
      {
        sessao_id: 10,
        titulo: "Live creatina",
        inicio: "2026-09-10T20:00:00Z",
        duracao_seg: 3600,
        espectadores: 1000,
        pedidos_confirmados: 20,
        vendas_confirmadas: 2000,
      },
      {
        sessao_id: 11,
        titulo: "Antiga",
        inicio: "2026-08-10T20:00:00Z",
        duracao_seg: 3600,
        vendas_confirmadas: 999,
      },
    ],
    [
      {
        sessao_id: 10,
        item_id: 1,
        cliques: 300,
        atc: 80,
        pedidos_confirmados: 15,
        vendas_confirmadas: 1500,
      },
      { sessao_id: 11, item_id: 2, vendas_confirmadas: 999 },
    ],
    [{ item_id: "1", nome: "Creatina 300g" }],
    DE,
    ATE,
  );
  it("resume sessões do período e produtos vendidos na live", () => {
    expect(l.sessoes).toBe(1);
    expect(l.vendasPorHora).toBe(2000);
    expect(l.lista[0]!.conversaoPct).toBe(2);
    expect(l.produtos).toEqual([
      { item: "1", nome: "Creatina 300g", cliques: 300, carrinho: 80, pedidos: 15, vendas: 1500 },
    ]);
  });
  it("gera alertas de estoque, margem, meta e horário", () => {
    const a = alertasShopee({
      produtos: [
        {
          item: "1",
          nome: "Creatina",
          sku: "",
          visitas: 0,
          pedidos: 0,
          unidades: 1,
          receita: 1,
          conversaoPct: null,
          nota: null,
          variacaoNota: null,
          comentarios: null,
          estoque: 0,
          coberturaDias: null,
          problemas: ["sem estoque"],
        },
      ],
      skus: [
        {
          sku: "W",
          nome: "Whey",
          unidades: 1,
          receita: 100,
          repasse: 60,
          cmv: 70,
          temCusto: true,
          contribuicao: -10,
          margemPct: null,
        },
      ],
      ads: { gasto: 0, direta: 0, ampla: 0, roasDireto: null, roasAmplo: null, campanhas: [] },
      horas: {
        gasto: 0,
        venda: 0,
        roasMedio: null,
        celulas: [],
        porHora: [],
        reduzir: [{ hora: 3, gasto: 50, venda: 10, roas: 0.2, pctGasto: 10 }],
        concentrar: [],
      },
    });
    expect(a.map((x) => x.tag)).toEqual(["Shopee estoque", "Shopee margem", "Shopee Ads"]);
  });
});
