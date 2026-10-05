import { describe, expect, it } from "vitest";
import {
  dnaDoTexto,
  combina,
  mapaManual,
  dnaTikTok,
  resumoTikTok,
  dnaPorCreator,
  combinacoesTikTok,
  cobertura,
  alertasDNA,
  resumoMeta,
  dnaMeta,
  NAO_IDENTIFICADO,
} from "@/lib/dna";
import { placarMeta } from "@/lib/criativos360";
import { cr, videos, etiquetasManuais, DE, ATE } from "./criativos360-fixture";

describe("DNA do conteúdo", () => {
  it("lê gancho pela primeira frase e ângulo/CTA pelo texto todo", () => {
    expect(dnaDoTexto("Pare de tomar creatina assim! Creapure com laudo, link na bio")).toEqual({
      gancho: "Erro / mito",
      angulo: "Ciência / pureza",
      cta: "Link / carrinho",
    });
    expect(dnaDoTexto("Você toma creatina do jeito errado? Use o cupom X").gancho).toBe(
      "Erro / mito",
    );
    expect(dnaDoTexto("Quanto custa? Whey em promoção").gancho).toBe("Pergunta");
    expect(dnaDoTexto("Antes e depois de 60 dias").gancho).toBe("Resultado");
    expect(dnaDoTexto("3 erros com whey").gancho).toBe("Erro / mito");
    expect(dnaDoTexto("5 dicas de treino").gancho).toBe("Lista / número");
    expect(dnaDoTexto("Leve 2 com 20% OFF. Compre agora.")).toMatchObject({
      gancho: "Oferta",
      angulo: "Preço / oferta",
      cta: "Compre agora",
    });
    expect(dnaDoTexto("unboxing")).toEqual({
      gancho: NAO_IDENTIFICADO,
      angulo: NAO_IDENTIFICADO,
      cta: NAO_IDENTIFICADO,
    });
    // pergunta depois da primeira frase não é gancho
    expect(dnaDoTexto("Treino de hoje. Bora?").gancho).toBe(NAO_IDENTIFICADO);
  });

  it("etiqueta manual vence a regra e a fonte é informada", () => {
    const m = mapaManual(etiquetasManuais);
    expect(m.get("tiktok_creator:t7")).toEqual({ gancho: "Novidade" });
    const auto = dnaDoTexto("unboxing");
    expect(combina(auto, m.get("tiktok_creator:t7"))).toMatchObject({
      gancho: "Novidade",
      fonte: "manual",
    });
    expect(combina(dnaDoTexto("cupom X"), { gancho: "Oferta" }).fonte).toBe("misto");
    expect(combina(auto).fonte).toBe("nenhuma");
  });

  it("TikTok: soma os dias por vídeo e compara GMV por mil views com a média", () => {
    const pt = dnaTikTok(videos, mapaManual([]), DE, ATE);
    expect(pt).toHaveLength(7);
    const t1 = pt.find((p) => p.id === "t1")!;
    expect(t1.views).toBe(20000);
    expect(t1.gmv).toBe(3000);
    expect(t1.gmvMilViews).toBe(150);
    const r = resumoTikTok(pt);
    const ciencia = r.find((g) => g.dimensao === "angulo" && g.valor === "Ciência / pureza")!;
    expect(ciencia.videos).toBe(3);
    expect(ciencia.creators).toBe(2);
    // média geral: 9300 / 117000 × 1000 = 79,49; ciência: 6500 / 45000 × 1000 = 144,4
    expect(ciencia.indice!).toBeCloseTo(144.444 / 79.487, 2);
    const fora = dnaTikTok(videos, mapaManual([]), "2026-10-01", "2026-10-31");
    expect(fora).toHaveLength(0);
  });

  it("DNA por creator, combinações e cobertura", () => {
    const pt = dnaTikTok(videos, mapaManual(etiquetasManuais), DE, ATE);
    const cs = dnaPorCreator(pt);
    expect(cs[0]).toMatchObject({ creator: "atleta.alfa", anguloQueVende: "Ciência / pureza" });
    expect(combinacoesTikTok(pt)).toHaveLength(0); // nenhuma com 3 vídeos
    expect(
      combinacoesTikTok(pt, 1)
        .slice(0, 2)
        .map((c) => c.combinacao),
    ).toContain("Erro / mito + Ciência / pureza");
    const placar = placarMeta(cr.anuncios, cr.cliente, 40, DE, ATE);
    const pm = dnaMeta(placar, mapaManual(etiquetasManuais));
    expect(pm.find((p) => p.id === "c4")!.dna).toMatchObject({
      angulo: "Autoridade",
      fonte: "manual",
    });
    const cob = cobertura(pm, pt);
    expect(cob.tiktokPct).toBe(100); // t7 tem etiqueta manual
    expect(cob.manuais).toBe(2);
  });

  it("alertas: ângulo subaproveitado no TikTok e ângulo caro no Meta", () => {
    const pt = dnaTikTok(videos, mapaManual([]), DE, ATE);
    const rt = resumoTikTok(pt);
    const rm = resumoMeta(
      dnaMeta(placarMeta(cr.anuncios, cr.cliente, 40, DE, ATE), mapaManual([])),
    );
    const semFatia = rt.map((g) =>
      g.valor === "Ciência / pureza" ? { ...g, fatiaGmvPct: 20 } : g,
    );
    const al = alertasDNA(rm, semFatia, { metaPct: 80, tiktokPct: 90, manuais: 0 });
    expect(al.some((a) => a.tipo === "oportunidade" && a.texto.includes("Ciência / pureza"))).toBe(
      true,
    );
    const baixa = alertasDNA([], [], { metaPct: 30, tiktokPct: null, manuais: 0 });
    expect(baixa[0]!.texto).toContain("Só 30%");
  });
});
