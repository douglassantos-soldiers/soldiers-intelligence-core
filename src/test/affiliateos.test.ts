import { describe, expect, it } from "vitest";
import { categoria, creatorsTikTok, creatorScore, productFit, inclinacao } from "@/lib/affiliateos";
import { ao, REF, affiliateOSFixture } from "./affiliateos-fixture";

const d = affiliateOSFixture();
const por = (h: string) => d.creators.find((c) => c.handle === h)!;

describe("três notas", () => {
  it("categoria pela primeira palavra", () => {
    expect(categoria("Pré-Treino Insano")).toBe("pre");
    expect(categoria("Creatina 300g")).toBe("creatina");
  });
  it("Creator Score, Product Fit e Opportunity", () => {
    const tt = creatorsTikTok(ao.videos, REF);
    const alfa = tt.get("atleta.alfa")!;
    expect(alfa).toMatchObject({
      gmv: 30500,
      gmv28: 14000,
      gmvAnt28: 14000,
      videos: 6,
      diasComVenda: 61,
    });
    expect(creatorScore(alfa, [...tt.values()], REF)).toBe(87);
    expect(productFit(alfa, "Creatina")).toBe(100);
    expect(productFit(tt.get("coach.beta")!, "Creatina")).toBe(0);
    expect(por("@atleta.alfa").creatorScore).toBe(87);
    // @fit.gama vende R$ 3 mil com 100 views: provável conta de loja, fora do ranking (onda 1 Cruva)
    expect(por("@fit.gama")).toMatchObject({
      tipoConta: "loja",
      tipoFonte: "regra",
      opportunity: 0,
    });
    expect(new Set(d.creators.slice(0, 2).map((c) => c.handle))).toEqual(
      new Set(["@atleta.alfa", "@coach.beta"]),
    );
    expect(d.creators[0]!.opportunity).toBe(100);
    expect(por("@novato").creatorScore).toBe(0);
  });
  it("estágio do cadastro vale; sem cadastro vem das vendas", () => {
    expect(por("@atleta.alfa")).toMatchObject({
      estagio: "escala",
      estagioFonte: "cadastro",
      nome: "Atleta Alfa",
    });
    expect(por("@fit.gama")).toMatchObject({
      estagio: "primeira_venda",
      estagioFonte: "dados",
      cadastrado: false,
    });
    expect(por("@novato").estagio).toBe("conteudo");
    expect(por("@rival.fit")).toMatchObject({ estagio: "convidado", gmv: 0 });
  });
});

describe("funil, amostras e outreach", () => {
  it("funil cumulativo", () => {
    const f = Object.fromEntries(d.funil.map((x) => [x.estagio, x.chegaram]));
    expect(f).toMatchObject({
      encontrado: 5,
      convidado: 5,
      aceitou: 4,
      conteudo: 3,
      primeira_venda: 2,
      vendas_recorrentes: 1,
      escala: 1,
      embaixador: 0,
    });
  });
  it("amostras com alertas e ROI", () => {
    // encerradas (cancelada) ficam no fim, sem alerta
    expect(d.amostras.map((a) => a.id)).toEqual(["a3", "a1", "a2", "a4"]);
    expect(d.amostras.find((a) => a.id === "a4")).toMatchObject({ encerrada: true, alertas: [] });
    const a1 = d.amostras.find((a) => a.id === "a1")!;
    expect(a1).toMatchObject({
      investimento: 63,
      gmvDepois: 10500,
      contribuicao: 2100,
      alertas: ["14 dias sem confirmar recebimento"],
    });
    expect(a1.roi).toBeCloseTo(2100 / 63);
    expect(d.amostras.find((a) => a.id === "a2")!.alertas).toEqual(["7 dias sem publicar"]);
    expect(d.amostras.find((a) => a.id === "a3")!.alertas).toEqual([
      "publicou sem venda",
      "ROI baixo",
    ]);
  });
  it("outreach sugere quem atende aos critérios e ainda não foi convidado", () => {
    const c = d.outreach[0]!;
    expect(c.convites).toEqual({ convidado: 1 });
    expect(c.produto).toBe("Creatina 300g");
    expect(c.sugeridos.map((s) => s.handle)).toEqual(["@fit.gama"]);
  });
});

describe("comissão, risco e qualidade", () => {
  it("regressão e leitura da elasticidade", () => {
    expect(inclinacao([1, 2, 3, 4, 5].map((x) => ({ x, y: 2 * x + 1 })))).toBeCloseTo(2);
    const [ml, tt] = d.elasticidade;
    expect(ml!.faixas.map((f) => f.faixa)).toEqual(["10–15%", "15–20%", "20–25%"]);
    expect(ml!.inclinacao).toBeCloseTo(50);
    expect(ml!.compensa).toBe(true);
    expect(tt!.inclinacao!).toBeLessThan(0);
    expect(tt!.compensa).toBe(false);
  });
  it("sinais de risco e concorrentes", () => {
    expect(d.sinais.map((s) => `${s.quem}:${s.sinal}`)).toEqual([
      "BETA:devolução alta",
      "VAZOU:desconto alto",
      "@fit.gama:conversão fora do padrão",
      "@fit.gama:venda concentrada em 1 dia",
    ]);
    expect(por("@rival.fit").concorrencia).toBe("migrável");
    expect(por("@coach.beta").concorrencia).toBe("híbrido");
    expect(por("@atleta.alfa").concorrencia).toBe("Soldiers");
  });
  it("qualidade do cliente por cupom e alertas", () => {
    expect(d.qualidade[0]).toMatchObject({
      cupom: "ALFA10",
      creator: "Atleta Alfa",
      novosPct: 75,
      recompraPct: 30,
    });
    expect(d.alertas.map((a) => a.tag)).toEqual([
      "Amostras",
      "Risco afiliado",
      "Direito de uso",
      "Ações do dia",
    ]);
  });
});
