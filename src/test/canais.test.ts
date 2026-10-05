import { describe, expect, it } from "vitest";
import { anomaliaDoDia, serieDiaria } from "@/lib/ritmo";
import { etapaDaCampanha } from "@/lib/melidsp";
import { ehNosso, periodoAnterior } from "@/lib/devolucoes";
import {
  tiktokFixture,
  meliFixture,
  afiliadosFixture,
  midiaSkuFixture,
  devolucoesFixture,
} from "./canais-fixture";

describe("ritmo e anomalia", () => {
  it("compara o último dia com a mediana dos 14 anteriores", () => {
    const s = serieDiaria(
      Array.from({ length: 10 }, (_, i) => ({
        data: `2026-09-${String(i + 1).padStart(2, "0")}`,
        g: i === 9 ? 300 : 100,
        r: i === 9 ? 150 : 400,
      })),
      "g",
      "r",
    );
    const a = anomaliaDoDia(s)!;
    expect(a.gastoBase).toBe(100);
    expect(a.sinais).toEqual(["gasto alto", "ROAS caiu"]);
    expect(anomaliaDoDia(s.slice(0, 4))).toBeNull(); // pouca base
  });
});

describe("TikTok Ads", () => {
  const d = tiktokFixture();
  it("resumo, anomalia e tipos", () => {
    expect(d.resumo.invest).toBe(15500);
    expect(d.resumo.receita).toBe(54800);
    expect(d.resumo.pedidos).toBe(420);
    expect(d.resumo.anomalia?.sinais).toEqual(["gasto alto", "ROAS caiu"]);
    expect(d.resumo.porTipo[0]!.tipo).toBe("GMV Max");
  });
  it("campanhas: GMV Max com investimento líquido e ROAS 7d × 7d antes", () => {
    const c1 = d.campanhas[0]!;
    expect(c1.id).toBe("c1");
    expect(c1.investLiquido).toBe(11400);
    expect(c1.roas7).toBeCloseTo(2.5);
    expect(c1.roasAnt7).toBeCloseTo(4);
    expect(d.campanhas).toHaveLength(2);
  });
  it("produtos com cobertura de estoque e vídeos classificados", () => {
    expect(d.produtos[0]).toMatchObject({ sku: "CREA300", coberturaDias: 4 });
    const l = Object.fromEntries(d.criativos.itens.map((i) => [i.item, i.leitura]));
    expect(l).toEqual({
      v_ugc_01: "escalar",
      v_talk_02: "cortar",
      v_demo_03: "manter",
      v_new_04: "observar",
    });
    expect(d.alertas.map((a) => a.tag)).toEqual([
      "TikTok Ads",
      "TikTok Ads",
      "TikTok criativos",
      "TikTok estoque",
      "TikTok criativos",
    ]);
  });
});

describe("Meli DSP", () => {
  const d = meliFixture();
  it("etapa pelo nome da campanha", () => {
    expect(etapaDaCampanha("DCA_RETARGETING")).toBe("conversao");
    expect(etapaDaCampanha("IN_MARKETING WHEY")).toBe("consideracao");
    expect(etapaDaCampanha("VIDEO_INSTITU")).toBe("reconhecimento");
    expect(etapaDaCampanha("Teste 01")).toBe("outros");
  });
  it("mix × 70/22/8, funil, vídeo e alertas", () => {
    const conv = d.mix.find((m) => m.etapa === "conversao")!;
    expect(conv.investimento).toBe(15000);
    expect(conv.desvioPp).toBeCloseTo((15000 / 28500) * 100 - 70);
    expect(d.resumo.funil[1]!.passagemPct).toBeCloseTo(1);
    expect(d.resumo.anomalia?.sinais).toEqual(["gasto parou"]);
    const v = d.criativos.find((c) => c.id === "k1")!;
    expect(v.completoPct).toBeCloseTo(15);
    expect(d.criativos.find((c) => c.id === "k2")!.video).toBe(false);
    expect(d.alertas.map((a) => a.tag)).toEqual(["Meli DSP", "Meli DSP mix", "Meli DSP"]);
  });
});

describe("Afiliados / Creator 360", () => {
  const d = afiliadosFixture();
  it("canais com comissão efetiva e margem com × sem afiliado", () => {
    const ml = d.canais.find((c) => c.canal === "Mercado Livre")!;
    expect(ml.comissaoEfetivaPct).toBeCloseTo(12);
    expect(ml.pctGmv).toBeCloseTo(15);
    expect(d.canais.find((c) => c.canal === "Shopee")!.margemComPct).toBe(12);
  });
  it("creators de todas as fontes, com qualidade pelo cupom e estado", () => {
    expect(d.creators.map((c) => c.nome)).toEqual([
      "Atleta Alfa",
      "Dicas de Suplemento",
      "Blog Treino",
      "Coach Beta",
      "Fit Gama",
    ]);
    const alfa = d.creators[0]!;
    expect(alfa).toMatchObject({
      gmv: 20000,
      custo: 4000,
      roi: 5,
      estado: "ativo",
      handle: "@atleta.alfa",
    });
    expect(alfa.pctNovos).toBeCloseTo(70);
    expect(d.creators.find((c) => c.nome === "Coach Beta")!.estado).toBe("esfriando");
    expect(d.creators.find((c) => c.nome === "Fit Gama")!.pagoSemVenda).toBe(true);
    expect(d.creators.find((c) => c.fonte === "UpPromote")).toMatchObject({
      custo: 500,
      pctNovos: 75,
      estado: "ativo",
    });
    expect(d.creators.some((c) => c.nome === "Fora do período")).toBe(false);
    expect(Object.keys(alfa)).not.toContain("cidade");
  });
  it("concentração, produtos e alertas", () => {
    expect(d.concentracao).toMatchObject({ comVenda: 4, fazem80: 2 });
    expect(d.concentracao.top3Pct).toBeCloseTo((40000 / 43000) * 100);
    expect(d.produtos[0]).toMatchObject({
      canal: "TikTok Shop",
      sku: "CREA300",
      pctViaAfiliado: 75,
    });
    expect(d.alertas.map((a) => a.tag)).toEqual([
      "Influenciadores",
      "Afiliados Shopee",
      "Afiliados",
      "Reativar creator",
    ]);
  });
});

describe("Mídia por produto", () => {
  const d = midiaSkuFixture();
  it("contribuição estimada com custo na data e taxa do canal", () => {
    const crea = d.skus.find((s) => s.sku === "CREA300")!;
    expect(crea.taxas).toBeCloseTo(2850);
    expect(crea.contribuicao).toBeCloseTo(4850);
    expect(crea.sinais).toEqual(["estoque curto com mídia"]);
    expect(d.skus.find((s) => s.sku === "WHEY900")!.sinais).toEqual(["mídia com prejuízo"]);
    expect(d.skus.find((s) => s.sku === "GLUT300")!.sinais).toEqual(["espaço para mídia"]);
    expect(d.skus.find((s) => s.sku === "NOVO1")).toMatchObject({
      semCusto: true,
      contribuicao: null,
    });
    expect(d.skus[0]!.sku).toBe("CREA300");
  });
  it("ritmo por canal e alertas", () => {
    expect(d.ritmo[0]).toMatchObject({ canal: "Meta Ads", gasto: 46500 });
    expect(d.ritmo[0]!.anomalia?.sinais).toEqual(["gasto alto", "ROAS caiu"]);
    expect(d.ritmo[1]!.anomalia?.sinais).toEqual(["ROAS caiu"]);
    expect(d.alertas.map((a) => a.tag)).toEqual([
      "Mídia × estoque",
      "Mídia × margem",
      "Ritmo Meta Ads",
      "Ritmo Google Ads",
      "Mídia × margem",
    ]);
  });
});

describe("Devoluções e ranking", () => {
  const d = devolucoesFixture();
  it("período anterior de mesmo tamanho", () => {
    expect(periodoAnterior("2026-09-01", "2026-09-30")).toEqual({
      de: "2026-08-02",
      ate: "2026-08-31",
    });
  });
  it("cancelamento e devolução contra o período anterior", () => {
    const site = d.canais.find((c) => c.canal === "Site")!;
    expect(site.devolucaoPct).toBeCloseTo(2.5);
    expect(site.deltaDevolucaoPp).toBeCloseTo(2.5 - 30 / 36);
    const ml = d.canais.find((c) => c.canal === "Mercado Livre")!;
    expect(ml.cancelPct).toBeCloseTo(6);
    expect(ml.deltaCancelPp).toBeCloseTo(4);
    expect(ml.valorPerdido).toBe(9000);
    const tt = d.canais.find((c) => c.canal === "TikTok Shop")!;
    expect(tt).toMatchObject({ baseDevolucao: "pedidos", valorPerdido: 2700 });
    expect(tt.devolucaoPct).toBeCloseTo(4);
    expect(d.canais.find((c) => c.canal === "Amazon")!.deltaDevolucaoPp).toBeNull();
    expect(d.motivos[0]).toMatchObject({ motivo: "Produto danificado", devolucoes: 2, valor: 220 });
  });
  it("ranking do ML acha a Soldiers e gera alertas", () => {
    expect(ehNosso({ nome: "SOLDIERS NUTRITION" })).toBe(true);
    expect(d.ranking.map((r) => r.categoria)).toEqual(["Whey", "Creatina"]);
    const cre = d.ranking.find((r) => r.categoria === "Creatina")!;
    expect(cre.nossa?.posicao).toBe(3);
    expect(cre.acima?.nome).toBe("Marca Dois");
    expect(cre.distanciaLiderPp).toBe(4);
    expect(d.alertas.map((a) => `${a.tipo}:${a.tag}`)).toEqual([
      "problema:Devolução Site",
      "problema:Cancelamento Mercado Livre",
      "oportunidade:Ranking ML",
      "problema:Ranking ML",
    ]);
  });
});
