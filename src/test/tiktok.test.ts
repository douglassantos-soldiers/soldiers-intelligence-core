import { describe, expect, it } from "vitest";
import { economiaTikTok, devolucoesPorMotivo, saudeListings, validadeToken } from "@/lib/tiktok";

const DE = "2026-09-01";
const ATE = "2026-09-30";
const custos = [
  { sku: "CREA300", custo_unitario: 38, vigencia_inicio: "2026-01-01" },
  { sku: "WHEY900", custo_unitario: 72, vigencia_inicio: "2026-01-01" },
];
const pedidos = [
  { order_id: "P1", create_dia: "2026-09-05", status: "COMPLETED", is_sample_order: false },
  { order_id: "P2", create_dia: "2026-09-20", status: "AWAITING_SHIPMENT", is_sample_order: false },
  { order_id: "P3", create_dia: "2026-09-10", status: "CANCELLED", is_sample_order: false },
  { order_id: "A1", create_dia: "2026-09-12", status: "COMPLETED", is_sample_order: true },
  { order_id: "OLD", create_dia: "2026-08-01", status: "COMPLETED", is_sample_order: false },
];
const item = (
  order_id: string,
  seller_sku: string,
  sale_price: number,
  extra: Record<string, unknown> = {},
) => ({
  order_id,
  seller_sku,
  sale_price,
  product_name: seller_sku,
  platform_discount: 0,
  seller_discount: 0,
  status: "",
  ...extra,
});
const itens = [
  item("P1", "CREA300", 90, { platform_discount: 10 }),
  item("P1", "WHEY900", 140, { seller_discount: 5 }),
  item("P2", "CREA300", 90),
  item("P3", "CREA300", 90),
  item("A1", "WHEY900", 0),
  item("OLD", "CREA300", 90),
];
// Extrato com custos negativos e um estorno posterior: os sinais não podem quebrar a conta.
const fin = [
  {
    order_id: "P1",
    statement_dia: "2026-09-25",
    settlement: 200,
    comissao_plataforma: -14,
    comissao_afiliado: -20,
    taxa_transacao: -3,
  },
  { order_id: "P1", statement_dia: "2026-10-02", settlement: -10, reembolso: -10 },
];

describe("economiaTikTok", () => {
  const e = economiaTikTok(pedidos, itens, fin, custos, DE, ATE);

  it("conta só pedidos válidos do período e separa amostras", () => {
    expect(e.pedidos).toBe(2); // P1 e P2 (P3 cancelado, OLD fora, A1 amostra)
    expect(e.receitaItens).toBe(320);
    expect(e.amostras).toEqual({ pedidos: 1, custoProduto: 72 });
  });

  it("separa desconto do TikTok e da Soldiers", () => {
    expect(e.descontoPlataforma).toBe(10);
    expect(e.descontoVendedor).toBe(5);
  });

  it("estimado × liquidado: P2 está em aberto, P1 liquidado em 20 dias", () => {
    expect(e.liquidacao.liquidados).toBe(1);
    expect(e.liquidacao.pctLiquidado).toBe(50);
    expect(e.liquidacao.emAbertoValor).toBe(90);
    expect(e.liquidacao.prazoMedianoDias).toBe(20);
  });

  it("contribuição liquidada = repasse (com estorno) − CMV, custos em valor absoluto", () => {
    expect(e.liquidado.repasse).toBe(190);
    expect(e.liquidado.cmv).toBe(110); // 38 + 72
    expect(e.liquidado.contribuicao).toBe(80);
    expect(e.liquidado.custos.find((c) => c.chave === "comissao_afiliado")!.valor).toBe(20);
    expect(e.liquidado.custos.find((c) => c.chave === "reembolso")!.valor).toBe(10);
  });

  it("rateia o repasse entre os SKUs pelo preço", () => {
    const whey = e.skus.find((s) => s.sku === "WHEY900")!;
    expect(whey.repasse).toBeCloseTo((190 * 140) / 230, 6);
  });
});

describe("devolucoesPorMotivo", () => {
  it("agrupa por motivo no período", () => {
    const r = devolucoesPorMotivo(
      [
        { dia: "2026-09-02", motivo: "Produto danificado", valor_reembolso: -90 },
        { dia: "2026-09-03", motivo: "Produto danificado", valor_reembolso: 90 },
        { dia: "2026-09-04", motivo: "", valor_reembolso: 50 },
        { dia: "2026-07-04", motivo: "Fora", valor_reembolso: 500 },
      ],
      DE,
      ATE,
    );
    expect(r).toEqual([
      { motivo: "Produto danificado", devolucoes: 2, valor: 180 },
      { motivo: "Sem motivo informado", devolucoes: 1, valor: 50 },
    ]);
  });
});

describe("saudeListings", () => {
  it("lista anúncios ativos com problema", () => {
    const r = saudeListings([
      {
        product_id: "1",
        titulo: "Creatina",
        nao_a_venda: false,
        skus_sem_estoque: 1,
        faltas: "",
        tem_peso: true,
        tem_dimensoes: true,
        health: 80,
      },
      {
        product_id: "2",
        titulo: "Whey",
        nao_a_venda: true,
        skus_sem_estoque: 0,
        faltas: "certificado",
        tem_peso: false,
        health: 40,
      },
      {
        product_id: "3",
        titulo: "Ok",
        nao_a_venda: false,
        skus_sem_estoque: 0,
        faltas: null,
        tem_peso: true,
        tem_dimensoes: true,
      },
      { product_id: "4", titulo: "Apagado", status: "DELETED", nao_a_venda: true },
    ]);
    expect(r.anuncios).toBe(3);
    expect(r.comProblema).toBe(2);
    expect(r.lista[0]!.titulo).toBe("Whey");
    expect(r.lista[0]!.problemas).toEqual([
      "fora de venda",
      "faltando: certificado",
      "sem peso/dimensões",
    ]);
  });
});

describe("validadeToken", () => {
  const hoje = new Date("2026-10-03T12:00:00Z");
  it("expirado quando a validade já passou", () => {
    expect(validadeToken("2026-10-01T00:00:00Z", "2026-09-30", hoje).nivel).toBe("expirado");
  });
  it("atenção quando não é renovado há mais de 7 dias", () => {
    expect(validadeToken("2026-10-10T00:00:00Z", "2026-09-20", hoje).nivel).toBe("atencao");
  });
  it("ok com renovação recente", () => {
    expect(validadeToken("2026-10-05T00:00:00Z", "2026-10-03T06:00:00Z", hoje)).toEqual({
      dias: 1,
      semRenovar: 0,
      nivel: "ok",
    });
  });
});
