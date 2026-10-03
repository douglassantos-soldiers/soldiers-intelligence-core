import { describe, expect, it } from "vitest";
import {
  reconciliacaoMeta,
  criativosMeta,
  segmentosMeta,
  funilMeta,
  ritmoMeta,
  metasDoMes,
  alertasMeta,
} from "@/lib/metaads";

const DE = "2026-09-01";
const ATE = "2026-09-30";

describe("reconciliacaoMeta", () => {
  const r = reconciliacaoMeta(
    [
      {
        data: "2026-09-02",
        gasto_meta: 100,
        receita_informada_meta: 600,
        receita_meta_utm: 300,
        compras_informadas_meta: 6,
        pedidos_meta_utm: 3,
        enviados_meta: 70,
        pedidos_totais: 100,
      },
      {
        data: "2026-09-01",
        gasto_meta: 100,
        receita_informada_meta: 400,
        receita_meta_utm: 300,
        compras_informadas_meta: 4,
        pedidos_meta_utm: 3,
        enviados_meta: 80,
        pedidos_totais: 100,
      },
      { data: "2026-08-01", gasto_meta: 999 },
    ],
    DE,
    ATE,
  );
  it("ROAS informado × ROAS por UTM, inflação e cobertura de envio", () => {
    expect(r.roasInformado).toBe(5);
    expect(r.roasUtm).toBe(3);
    expect(r.inflacao).toBeCloseTo(1000 / 600, 6);
    expect(r.coberturaEnvioPct).toBe(75);
    expect(r.dias.map((d) => d.data)).toEqual(["2026-09-01", "2026-09-02"]);
  });
});

describe("criativosMeta", () => {
  const c = criativosMeta(
    [
      { criativo: "Video A", invest: 500, receita: 3000, roas: 6, hook_pct: 35 },
      { criativo: "Video B", invest: 400, receita: 400, roas: 1 },
      { criativo: "Estatico C", invest: 100, receita: 400, roas: 4 },
      { criativo: "Pausado", invest: 0, receita: 0 },
    ],
    [
      {
        criativo: "Video B",
        diagnostico: "Fadiga: frequência subindo",
        invest_7d: 200,
        freq_7d: 4.2,
        freq_ant: 2.1,
      },
      { criativo: "Video A", diagnostico: "OK", invest_7d: 300 },
    ],
    [{ formato: "video", criativos: 2, invest: 900, receita: 3400, roas: 3.8 }],
  );
  it("separa melhores e piores contra o ROAS médio", () => {
    expect(c.roasMedio).toBe(3.8);
    expect(c.melhores.map((x) => x.criativo)).toEqual(["Video A", "Estatico C", "Video B"]);
    expect(c.piores.map((x) => x.criativo)).toEqual(["Video B"]);
    expect(c.lista).toHaveLength(3);
  });
  it("lista só criativos com diagnóstico de fadiga", () => {
    expect(c.fadiga.map((f) => f.criativo)).toEqual(["Video B"]);
  });
});

describe("segmentosMeta e funil", () => {
  it("marca segmentos fortes e fracos contra a média", () => {
    const s = segmentosMeta(
      [
        { publico: "Lookalike compradores", invest: 500, receita: 3000 },
        { publico: "Interesses fitness", invest: 500, receita: 1000 },
      ],
      [],
      [],
      [
        { hora: 21, invest: 100, receita: 500 },
        { hora: 9, invest: 100, receita: 100 },
      ],
    );
    expect(s.publicos.map((x) => [x.rotulo, x.sinal])).toEqual([
      ["Lookalike compradores", "forte"],
      ["Interesses fitness", "fraco"],
    ]);
    expect(s.horario.map((x) => x.rotulo)).toEqual(["9h", "21h"]);
  });
  it("ordena o funil", () => {
    expect(
      funilMeta([
        { ord: 2, etapa: "Clique", valor: 100 },
        { ord: 1, etapa: "Impressão", valor: 10000 },
      ]).map((f) => f.etapa),
    ).toEqual(["Impressão", "Clique"]);
  });
});

describe("ritmoMeta", () => {
  it("projeta o gasto do dia e compara com a média de 7 dias fechados", () => {
    const r = ritmoMeta(
      [
        { data: "2026-10-03", gasto: 300, receita: 900, captured_at: "2026-10-03T15:00:00Z" },
        { data: "2026-10-03", gasto: 100, captured_at: "2026-10-03T11:00:00Z" },
      ],
      [
        { data: "2026-10-02", gasto: 400, receita: 1600 },
        { data: "2026-10-01", gasto: 400, receita: 1600 },
        { data: "2026-10-03", gasto: 300 },
      ],
    )!;
    expect(r.pctDia).toBe(50); // 12h em Brasília
    expect(r.projecao).toBe(600);
    expect(r.mediaDia).toBe(400);
    expect(r.ritmo).toBe("acima");
    expect(r.mediaRoas).toBe(4);
  });
});

describe("metasDoMes e alertas", () => {
  it("atingimento até hoje e projeção do mês por canal", () => {
    const m = metasDoMes(
      [
        {
          data: "2026-10-01",
          mes: "2026-10",
          canal: "Site",
          receita_meta: 1000,
          receita_real: 900,
          dia_fechado: true,
        },
        {
          data: "2026-10-02",
          mes: "2026-10",
          canal: "Site",
          receita_meta: 1000,
          receita_real: 700,
          dia_em_curso: true,
          dado_provisorio: true,
        },
        { data: "2026-10-03", mes: "2026-10", canal: "Site", receita_meta: 2000, dia_futuro: true },
        { data: "2026-09-30", mes: "2026-09", canal: "Site", receita_meta: 999, receita_real: 999 },
      ],
      "2026-10-03",
    );
    expect(m).toEqual([
      expect.objectContaining({
        canal: "Site",
        metaMes: 4000,
        metaAteHoje: 2000,
        realAteHoje: 1600,
        atingimentoPct: 80,
        projecao: 3200,
        projecaoPct: 80,
        provisorio: true,
      }),
    ]);
  });
  it("gera alertas de fadiga, envio de eventos, atribuição e ritmo", () => {
    const a = alertasMeta({
      recon: reconciliacaoMeta(
        [
          {
            data: "2026-09-02",
            gasto_meta: 100,
            receita_informada_meta: 800,
            receita_meta_utm: 400,
            enviados_meta: 50,
            pedidos_totais: 100,
          },
        ],
        DE,
        ATE,
      ),
      criativos: criativosMeta([], [{ criativo: "X", diagnostico: "fadiga", invest_7d: 50 }], []),
      ritmo: null,
    });
    expect(a.map((x) => x.tag)).toEqual(["Meta criativos", "Meta eventos", "Meta atribuição"]);
  });
});
