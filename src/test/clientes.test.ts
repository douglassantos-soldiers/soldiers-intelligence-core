import { describe, expect, it } from "vitest";
import {
  estadoDoCliente,
  distribuicaoEstados,
  proximaAcao,
  consentimentoDe,
} from "@/lib/clientes360";
import { cli, clienteAcaoFixture, atribuicaoFixture } from "./clientes-fixture";

describe("estado e saúde do cliente", () => {
  it("regras na ordem: perdido, adormecido, em risco, novo, fiel, recorrente", () => {
    expect(estadoDoCliente({ dias_ultima_compra: 200, pedidos: 9 })).toBe("perdido");
    expect(estadoDoCliente({ dias_ultima_compra: 120, pedidos: 9 })).toBe("adormecido");
    expect(estadoDoCliente({ dias_ultima_compra: 50, pedidos: 3, razao_ritmo: 1.8 })).toBe(
      "em_risco",
    );
    expect(estadoDoCliente({ dias_ultima_compra: 50, pedidos: 1, razao_ritmo: 3 })).toBe("novo");
    expect(estadoDoCliente({ dias_ultima_compra: 20, pedidos: 5, razao_ritmo: 0.7 })).toBe("fiel");
    expect(estadoDoCliente({ dias_ultima_compra: 20, pedidos: 2 })).toBe("recorrente");
    expect(estadoDoCliente({ pedidos: 2 })).toBe("sem_dado");
  });
  it("distribuição e saúde da base", () => {
    const d = distribuicaoEstados({
      novo: 100,
      recorrente: 200,
      fiel: 50,
      em_risco: 80,
      adormecido: 120,
      perdido: 450,
    });
    expect(d.total).toBe(1000);
    expect(d.saude[0]).toMatchObject({ saude: "saudável", clientes: 350, pct: 35 });
    expect(d.saude.find((s) => s.saude === "atenção")!.clientes).toBe(80);
  });
});

describe("afinidade e próxima ação", () => {
  const d = clienteAcaoFixture();
  it("nota 0–100 com recência e sugestão por quem compra o mesmo", () => {
    expect(d.afinidade.map((a) => [a.sku, a.nota, a.origem])).toEqual([
      ["CREA300", 100, "comprou"],
      ["GLUT300", 30, "sugerido"],
      ["WHEY900", 28, "comprou"],
    ]);
  });
  it("canal pelo consentimento e pelo canal do cliente; sempre aguardando aprovação", () => {
    expect(d.consentimento).toEqual({ aceita: true, desde: "2026-09-20" });
    expect(d.acao).toMatchObject({
      estado: "em_risco",
      acao: "Recompra urgente",
      quando: "agora",
      canal: "E-mail (RD / Klaviyo)",
      aprovacao: "aguardando aprovação (Fase 3)",
    });
    const ml = proximaAcao({ ...cli.perfil, canal_ultimo: "Mercado Livre" }, d.afinidade, {
      aceita: null,
      desde: "",
    });
    expect(ml.canal).toBe("Remarketing no Mercado Livre");
    expect(proximaAcao(cli.perfil, d.afinidade, { aceita: false, desde: "" }).canal).toBe(
      "Remarketing em mídia paga",
    );
    expect(
      proximaAcao(
        { ...cli.perfil, dias_atraso: -6, razao_ritmo: 0.8 },
        d.afinidade,
        consentimentoDe([]),
      ).quando,
    ).toBe("em 6 dias");
  });
});

describe("Attribution Engine v1", () => {
  const d = atribuicaoFixture();
  it("por canal, sem somar fontes, com sobreposição", () => {
    const site = d.canais.find((c) => c.canal === "Site")!;
    expect(site).toMatchObject({
      realizada: 100000,
      reportadaAds: 40000,
      afiliados: 10000,
      semAtribuicao: 50000,
      sobreposicao: false,
    });
    const ml = d.canais.find((c) => c.canal === "Mercado Livre")!;
    expect(ml.sobreposicao).toBe(true);
    expect(ml.reportadaPct).toBeCloseTo(110);
    expect(ml.semAtribuicao).toBeNull();
  });
  it("resumo com MER, site por origem, plataforma × UTM e modelo vigente", () => {
    expect(d.resumo.realizada).toBe(150000);
    expect(d.resumo.mer).toBeCloseTo(150000 / 17500);
    expect(d.site.total).toBe(95000);
    expect(d.plataformas[0]!.razao).toBeCloseTo(3);
    expect(d.modelos.map((m) => [m.chave, m.inicio, m.vigente])).toEqual([
      ["data_driven", "2027-01-01", false],
      ["ultimo_clique", "2026-09-15", true],
      ["ultimo_clique", "2026-01-01", false],
    ]);
    expect(d.modelos[0]!.futuro).toBe(true);
    expect(d.alertas).toHaveLength(3);
  });
});
