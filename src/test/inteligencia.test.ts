import { describe, expect, it } from "vitest";
import { chaveCanal, previsaoDiaria, duasProporcoes, normalCdf } from "@/lib/inteligencia";
import { inteligenciaFixture } from "./inteligencia-fixture";

const d = inteligenciaFixture();

describe("Channel Intelligence", () => {
  it("normaliza nomes de canal entre views", () => {
    expect(chaveCanal("Shopify")).toBe("site");
    expect(chaveCanal("Site")).toBe("site");
    expect(chaveCanal("ML")).toBe("mercado_livre");
    expect(chaveCanal("TikTok Shop")).toBe("tiktok_shop");
  });
  it("receita, margem, CAC, LTV e unit economics por canal", () => {
    const site = d.canais[0]!;
    expect(site).toMatchObject({
      canal: "Site",
      receita: 100000,
      pedidos: 500,
      novos: 200,
      cac: 40,
      ltv: 300,
      recompraPct: 35,
    });
    expect(site.crescimentoPct).toBeCloseTo(25);
    expect(site.margemPct).toBeCloseTo(30);
    expect(site.contribuicaoPorPedido).toBeCloseTo(60);
    expect(site.ltvCac).toBeCloseTo(7.5);
    const ml = d.canais[1]!;
    expect(ml.crescimentoPct).toBeCloseTo(-16.67, 1);
    expect(ml.ltvCac).toBeCloseTo(0.8);
  });
});

describe("Matriz produto × canal", () => {
  it("nota por contribuição estimada e papel do produto", () => {
    expect(d.matriz.canais.map((c) => c.chave)).toEqual(["site", "mercado_livre"]);
    const [crea, whey, novo] = d.matriz.linhas;
    expect(crea!.celulas["site"]).toMatchObject({ nota: "A", contribuicao: 4500 });
    expect(crea!.celulas["mercado_livre"]!.nota).toBe("C");
    expect(crea!.papel).toBe("lucro concentrado em Site");
    expect(whey!.celulas["site"]!.nota).toBe("D");
    expect(whey!.papel).toBe("dá prejuízo em Site; lucro vem de Mercado Livre");
    expect(novo!.celulas["site"]).toMatchObject({ nota: null, contribuicao: null });
  });
});

describe("Previsão de demanda e estoque", () => {
  it("mistura 7 e 28 dias", () => {
    const p = previsaoDiaria([...Array(21).fill(10), ...Array(7).fill(20)]);
    expect(p.m28).toBeCloseTo(12.5);
    expect(p.previsao).toBeCloseTo(16.25);
    expect(p.tendenciaPct).toBeCloseTo(60);
  });
  it("por local, sem somar estoques, ordenado por risco", () => {
    const l = d.estoque.linhas.map((x) => [x.sku, x.local, x.situacao]);
    expect(l).toEqual([
      ["GLUT300", "Estoque do site (Shopify)", "ruptura"],
      ["CREA300", "Estoque do site (Shopify)", "crítico"],
      ["WHEY900", "Mercado Livre Full", "parado"],
      ["CREA300", "Amazon FBA", "ok"],
    ]);
    const crea = d.estoque.linhas[1]!;
    expect(crea.ruptura).toBe("2026-10-07");
    expect(crea.repor).toBe(632);
    expect(d.estoque.linhas[3]!.repor).toBe(0);
  });
  it("backtest: previsto × vendido por canal", () => {
    const site = d.estoque.backtest.find((b) => b.canal === "Site")!;
    expect(site.previsto).toBeCloseTo(308);
    expect(site.vendido).toBe(378);
    expect(site.erroPct).toBeCloseTo((70 / 378) * 100);
    expect(d.estoque.backtest.find((b) => b.canal === "Amazon")!.erroPct).toBeCloseTo(0);
  });
});

describe("Experimentos", () => {
  it("teste de duas proporções", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
    const r = duasProporcoes({ n: 1000, x: 80 }, { n: 1000, x: 110 });
    expect(r.pValor!).toBeGreaterThan(0.015);
    expect(r.pValor!).toBeLessThan(0.03);
  });
  it("leitura de cada experimento e alertas", () => {
    const [e1, e2, e3] = d.experimentos;
    expect(e1!.leitura).toBe("vencedor");
    expect(e1!.tratamentos[0]!.liftPct).toBeCloseTo(37.5);
    expect(e2!.leitura).toBe("sem grupo de controle");
    expect(e3!.leitura).toBe("sem dados");
    expect(d.alertas.map((a) => a.tag)).toEqual([
      "Estoque previsto",
      "Unit economics",
      "Experimento",
    ]);
  });
});
