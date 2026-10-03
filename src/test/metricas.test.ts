import { describe, expect, it } from "vitest";
import { METRICAS } from "@/domain/metricas";

describe("catálogo de métricas", () => {
  it("cada métrica tem id único", () => {
    const ids = METRICAS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("receita atribuída ou reportada nunca é marcada como somável (cap. 13.2)", () => {
    const erradas = METRICAS.filter(
      (m) => (m.tipoReceita === "atribuida" || m.tipoReceita === "reportada") && m.somavel,
    );
    expect(erradas.map((m) => m.id)).toEqual([]);
  });

  it("razões (ROAS, MER, TACoS, CTR) não são somáveis", () => {
    for (const id of ["roas_midia", "retorno_aquisicao", "tacos", "ctr", "acos", "poas"]) {
      expect(METRICAS.find((m) => m.id === id)?.somavel).toBe(false);
    }
  });
});
