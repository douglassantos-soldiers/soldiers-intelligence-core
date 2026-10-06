import { describe, expect, it } from "vitest";
import {
  fechamentoMes,
  resumoFechamento,
  porCreator,
  percentual,
  limitesDoMes,
  linhasPlanilha,
} from "@/lib/fechamento";
import { creators360 } from "@/lib/afiliados";
import { fx, MES, fechamentoFixture } from "./fechamento-fixture";

describe("Fechamento de comissões: a regra da planilha", () => {
  const ls = fechamentoMes(fx, MES);
  const por = (c: string) => ls.find((l) => l.cupom === c)!;

  it("venda considerada = maior entre cupom e UpPromote; comissão só sobre ela", () => {
    // cupom 1000 (dois dias, minúscula junta) × UP 900 → vale o cupom; agosto fora
    expect(por("ALFA")).toMatchObject({
      vendaCupom: 1000,
      vendaUp: 900,
      vendaConsiderada: 1000,
      fonteConsiderada: "cupom",
      comissao: 50,
      total: 1000,
    });
    // UP 1500 × cupom 1200 → vale o UP; TikTok do @ entra no total e fica fora da comissão
    expect(por("BETAUP")).toMatchObject({
      vendaConsiderada: 1500,
      fonteConsiderada: "uppromote",
      vendaTikTok: 120.4,
      total: 1620.4,
      comissao: 105,
    });
    // 2,5% (a planilha mostra 3%, mas paga 2,5%)
    expect(por("GAMA").comissao).toBe(5702.34);
    // % como fração (0,07) vira 7; @ com arroba é limpo; TikTok repete no 2º cupom do mesmo @
    expect(por("BETA")).toMatchObject({
      comissaoPct: 7,
      tiktok: "beta.treino",
      vendaTikTok: 120.4,
    });
    // 0% vende sem comissão; @ "0" não é @
    expect(por("DELTA")).toMatchObject({ vendaConsiderada: 5499.77, comissao: 0, tiktok: "" });
    // afiliado só no UpPromote entra com o % de lá
    expect(por("SOUP")).toMatchObject({ vendaUp: 300, comissao: 30, origem: ["uppromote"] });
    // só TikTok (outubro fora)
    expect(por("OMEGA")).toMatchObject({ vendaConsiderada: 0, vendaTikTok: 2230.05, comissao: 0 });
  });

  it("resumo e visão por creator", () => {
    const r = resumoFechamento(ls);
    expect(r.vendaConsiderada).toBe(1000 + 1500 + 228093.53 + 5499.77 + 300);
    expect(r.comissao).toBe(50 + 105 + 5702.34 + 30);
    expect(r.tiktokRepetido).toBe(120.4);
    expect(r.vendaSemComissao).toBe(5499.77);
    expect(r.pelaFonte).toEqual({ cupom: 2, uppromote: 3, iguais: 0 });
    const beta = porCreator(ls).find((c) => c.creator === "@beta.treino")!;
    expect(beta).toMatchObject({ considerada: 1500, tiktok: 120.4, total: 1620.4, comissao: 105 });
    expect(beta.cupons.sort()).toEqual(["BETA", "BETAUP"]);
  });

  it("utilitários", () => {
    expect(percentual(0.05)).toBe(5);
    expect(percentual("7")).toBe(7);
    expect(percentual(null)).toBeNull();
    expect(limitesDoMes("2026-02")).toEqual({ de: "2026-02-01", ate: "2026-02-28" });
    const pl = linhasPlanilha(fx.planilha, MES);
    expect(pl.some((r) => r["venda_considerada"] === 1)).toBe(false); // carga antiga fora
    expect(pl.some((r) => r["cupom"] === "0")).toBe(false);
  });
});

describe("Conferência com a planilha", () => {
  const d = fechamentoFixture();
  const c = d.conferencia!;
  const linha = (k: string) => c.linhas.find((l) => l.cupom === k)!;

  it("aponta só o que difere", () => {
    expect(linha("ALFA").situacao).toBe("bate");
    expect(linha("GAMA").situacao).toBe("bate");
    expect(linha("BETAUP").situacao).toBe("bate");
    // TikTok da plataforma (2230,05) ≠ planilha (2000)
    expect(linha("OMEGA")).toMatchObject({
      situacao: "diferente",
      diferencas: ["vendaTikTok", "total"],
    });
    expect(linha("ANTIGO").situacao).toBe("só na planilha");
    expect(linha("SOUP").situacao).toBe("só na plataforma");
    // cupom repetido na planilha compara pela primeira linha
    expect(c.linhas.filter((l) => l.cupom === "DUPLICADO")).toHaveLength(1);
    expect(c.diferentes).toBe(1);
  });

  it("totais por coluna e a melhor base de venda do cupom", () => {
    const cons = c.porCampo.find((x) => x.campo === "vendaConsiderada")!;
    expect(cons.planilha).toBeCloseTo(1000 + 1500 + 228093.53 + 5499.77 + 80, 2);
    expect(cons.plataforma).toBeCloseTo(1000 + 1500 + 228093.53 + 5499.77 + 300, 2);
    expect(d.basesCupom[0]).toMatchObject({ base: "faturamento_liquido", batem: 4, comparados: 5 });
    expect(d.alertas.map((a) => a.tom)).toEqual(["primary", "warn"]);
  });
});

describe("Creators 360 sem contar a mesma venda duas vezes", () => {
  it("UpPromote do mesmo cupom entra no influenciador pela venda considerada", () => {
    const out = creators360(
      {
        influenciadores: [
          {
            data: "2026-09-10",
            creator_id: "c1",
            nome: "Alfa",
            cupom: "ALFA",
            receita_site: 1000,
            receita_tiktok: 0,
          },
        ],
        cuponsSite: [],
        mlCreators: [],
        upAfiliados: [
          { uppromote_id: 1, nome: "Alfa", cupom: "ALFA", comissao_pct: 5 },
          { uppromote_id: 2, nome: "Outro", cupom: "OUTRO", comissao_pct: 5 },
        ],
        upMes: [
          { uppromote_id: 1, mes: "2026-09-01", receita: 1300 },
          { uppromote_id: 2, mes: "2026-09-01", receita: 200 },
        ],
      },
      "2026-09-01",
      "2026-09-30",
      "2026-09-30",
    );
    expect(out.map((c) => [c.fonte, c.cupom, c.gmv])).toEqual([
      ["Influenciador", "ALFA", 1300],
      ["UpPromote", "OUTRO", 200],
    ]);
  });
});
