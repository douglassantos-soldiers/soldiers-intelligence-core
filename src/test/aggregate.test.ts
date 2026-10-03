import { describe, expect, it } from "vitest";

import { custoHistorico, custoNaData, channelSummary, ratio } from "@/lib/aggregate";
import { canalPedido, canalVenda } from "@/domain/sources";

const custos = [
  { sku: "CREA300", custo_unitario: 40, vigencia_inicio: "2026-01-01" },
  { sku: "CREA300", custo_unitario: 55, vigencia_inicio: "2026-07-15T00:00:00" },
  { sku: "CREA300", custo_unitario: 48, vigencia_inicio: "2026-04-01" },
  { sku: "WHEY900", custo_unitario: 90, vigencia_inicio: "2026-03-01" },
];

describe("custoNaData (custo vigente na data do pedido)", () => {
  const h = custoHistorico(custos);

  it("usa a vigência que começou antes ou no dia do pedido", () => {
    expect(custoNaData(h, "CREA300", "2026-02-10")?.custo).toBe(40);
    expect(custoNaData(h, "CREA300", "2026-04-01")?.custo).toBe(48);
    expect(custoNaData(h, "CREA300", "2026-07-14")?.custo).toBe(48);
    expect(custoNaData(h, "CREA300", "2026-07-15 10:30:00")?.custo).toBe(55);
  });

  it("não deixa a margem histórica mudar quando o custo é atualizado", () => {
    // Pedido de março continua com o custo de março, mesmo existindo custo mais novo.
    expect(custoNaData(h, "CREA300", "2026-03-20")?.custo).toBe(40);
  });

  it("marca como estimado um pedido anterior à primeira vigência", () => {
    const c = custoNaData(h, "WHEY900", "2026-01-05");
    expect(c?.custo).toBe(90);
    expect(c?.estimado).toBe(true);
  });

  it("sem data devolve o custo atual; SKU sem custo devolve undefined", () => {
    expect(custoNaData(h, "CREA300")?.custo).toBe(55);
    expect(custoNaData(h, "NAOEXISTE", "2026-05-01")).toBeUndefined();
  });
});

describe("channelSummary (mídia e afiliado separados)", () => {
  const receita = [
    {
      canal: "Site",
      faturamento: 1000,
      pedidos: 10,
      invest_ads: 100,
      receita_ads: 400,
      invest_afiliados: 50,
      invest_aquisicao: 150,
    },
    {
      canal: "Site",
      faturamento: 500,
      pedidos: 5,
      invest_ads: 50,
      receita_ads: 200,
      invest_afiliados: 0,
      invest_aquisicao: 50,
    },
  ];
  const pl = [
    {
      canal: "Site",
      receita_bruta: 1500,
      custo_canal: 120,
      det_taxa: 60,
      det_frete: 40,
      det_afiliado: 20,
      ads: 150,
      imposto: 90,
      cmv: 600,
      margem_contribuicao: 540,
    },
  ];
  const [site] = channelSummary(receita, pl);

  it("ROAS mídia usa só ads; retorno de aquisição usa ads + afiliados", () => {
    expect(ratio(site!["receita_ads"], site!["invest_ads"])).toBe(4);
    expect(ratio(site!["faturamento"], site!["invest_aquisicao"])).toBe(7.5);
  });

  it("soma o detalhe do custo do canal", () => {
    expect(site!["det_taxa"]).toBe(60);
    expect(
      Number(site!["det_taxa"]) + Number(site!["det_frete"]) + Number(site!["det_afiliado"]),
    ).toBe(site!["custo_canal"]);
  });
});

describe("de-para de canal", () => {
  it("Shopify (pedido) ↔ Site (views consolidadas)", () => {
    expect(canalVenda("Shopify")).toBe("Site");
    expect(canalPedido("Site")).toBe("Shopify");
    expect(canalVenda("Mercado Livre")).toBe("Mercado Livre");
  });
});
