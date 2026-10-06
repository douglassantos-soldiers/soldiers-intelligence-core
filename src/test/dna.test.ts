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
  padroesVencedores,
  MEDIDA_TIKTOK,
  MEDIDA_META,
  NAO_IDENTIFICADO,
} from "@/lib/dna";
import { placarMeta } from "@/lib/criativos360";
import { cr, videos, etiquetasManuais, DE, ATE } from "./criativos360-fixture";

const NI = NAO_IDENTIFICADO;

describe("DNA do conteúdo (cap. 8.11)", () => {
  it("lê gancho pela primeira frase e ângulo, formato, produto e CTA pelo texto todo", () => {
    expect(dnaDoTexto("Pare de tomar creatina assim! Creapure com laudo, link na bio")).toEqual({
      gancho: "Erro / mito",
      angulo: "Ciência / pureza",
      formato: NI,
      produto: "Creatina",
      cta: "Link / carrinho",
      publico: NI,
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
    expect(dnaDoTexto("Treino de hoje. Bora?").gancho).toBe(NI);
    // formato do roteiro
    expect(dnaDoTexto("unboxing").formato).toBe("Unboxing");
    expect(dnaDoTexto("Review sincero, vale a pena?").formato).toBe("Review");
    expect(dnaDoTexto("Whey vs creatina: qual é melhor").formato).toBe("Comparação");
    expect(dnaDoTexto("Receita de shake proteico").formato).toBe("Receita / preparo");
    expect(dnaDoTexto("Como tomar creatina do jeito certo").formato).toBe("Tutorial / dica");
    expect(dnaDoTexto("Treino de hoje com pré-treino").formato).toBe("Rotina / vlog");
    // produto: o informado vence o citado no texto
    expect(dnaDoTexto("creatina", "Whey 900g").produto).toBe("Whey");
    expect(dnaDoTexto("Pré-treino novo").produto).toBe("Pré-treino");
    expect(dnaDoTexto("bom dia").produto).toBe(NI);
  });

  it("etiqueta manual vence a regra (inclusive formato, produto e público)", () => {
    const m = mapaManual([
      ...etiquetasManuais,
      { canal: "meta", conteudo_id: "c4", dimensao: "publico", valor: "Iniciante" },
      { canal: "meta", conteudo_id: "c4", dimensao: "cor", valor: "azul" },
    ]);
    expect(m.get("tiktok_creator:t7")).toEqual({ gancho: "Novidade" });
    expect(m.get("meta:c4")).toEqual({ angulo: "Autoridade", publico: "Iniciante" });
    const unbox = combina(dnaDoTexto("unboxing"), m.get("tiktok_creator:t7"));
    expect(unbox).toMatchObject({ gancho: "Novidade", formato: "Unboxing", fonte: "misto" });
    expect(combina(dnaDoTexto("bom dia"), { gancho: "Oferta" }).fonte).toBe("manual");
    expect(combina(dnaDoTexto("bom dia")).fonte).toBe("nenhuma");
  });

  it("TikTok: soma os dias por vídeo e compara GMV por mil views com a média", () => {
    const pt = dnaTikTok(videos, mapaManual([]), DE, ATE);
    expect(pt).toHaveLength(9);
    const t1 = pt.find((p) => p.id === "t1")!;
    expect(t1).toMatchObject({ views: 20000, gmv: 3000, gmvMilViews: 150 });
    expect(t1.dna.produto).toBe("Creatina");
    const r = resumoTikTok(pt);
    const ciencia = r.find((g) => g.dimensao === "angulo" && g.valor === "Ciência / pureza")!;
    expect(ciencia).toMatchObject({ videos: 4, creators: 2, views: 54000, gmv: 7800 });
    // média geral: 11600 / 134000 × 1000; ciência: 7800 / 54000 × 1000
    expect(ciencia.indice!).toBeCloseTo(144.444 / 86.567, 2);
    expect(r.some((g) => g.dimensao === "formato" && g.valor === "Review")).toBe(true);
    expect(dnaTikTok(videos, mapaManual([]), "2026-10-01", "2026-10-31")).toHaveLength(0);
  });

  it("DNA por creator, combinações e cobertura", () => {
    const pt = dnaTikTok(videos, mapaManual(etiquetasManuais), DE, ATE);
    const cs = dnaPorCreator(pt);
    expect(cs[0]).toMatchObject({ creator: "atleta.alfa", anguloQueVende: "Ciência / pureza" });
    expect(cs.find((c) => c.creator === "fit.beta")!.formatoQueVende).toBe("Review");
    expect(combinacoesTikTok(pt).map((c) => c.combinacao)).toEqual([
      "Erro / mito + Ciência / pureza",
    ]);
    const placar = placarMeta(cr.anuncios, cr.cliente, 40, DE, ATE);
    const pm = dnaMeta(placar, mapaManual(etiquetasManuais));
    expect(pm.find((p) => p.id === "c4")!.dna).toMatchObject({
      angulo: "Autoridade",
      fonte: "manual",
    });
    expect(pm.find((p) => p.id === "c1")!.dna.produto).toBe("Creatina");
    const cob = cobertura(pm, pt);
    expect(cob.tiktokPct).toBe(100);
    expect(cob.manuais).toBe(2);
  });

  it("padrões vencedores por produto (cap. 8.12) viram brief", () => {
    const pt = dnaTikTok(videos, mapaManual([]), DE, ATE);
    const ps = padroesVencedores(pt, MEDIDA_TIKTOK);
    expect(ps).toHaveLength(1); // Whey tem só 3 vídeos (mínimo 4)
    const c = ps[0]!;
    expect(c).toMatchObject({ produto: "Creatina", pecas: 5, confianca: "baixa" });
    expect(c.media!).toBeCloseTo((8000 / 59000) * 1000, 3);
    expect(c.escolhas.map((e) => [e.dimensao, e.valor])).toEqual([
      ["gancho", "Erro / mito"],
      ["angulo", "Ciência / pureza"],
      ["cta", "Link / carrinho"],
    ]);
    // Review (t8 + t9) vende abaixo da média da creatina e fica de fora
    expect(c.escolhas.some((e) => e.valor === "Review")).toBe(false);
    expect(c.brief).toBe(
      "Creatina: abrir com Erro / mito, ângulo Ciência / pureza, fechar com Link / carrinho.",
    );
    expect(padroesVencedores(pt, MEDIDA_TIKTOK, 20)).toHaveLength(0);
    const pm = dnaMeta(placarMeta(cr.anuncios, cr.cliente, 40, DE, ATE), mapaManual([]));
    expect(padroesVencedores(pm, MEDIDA_META, 3)).toEqual([]); // poucos anúncios por produto
  });

  it("alertas: ângulo subaproveitado no TikTok e cobertura baixa no Meta", () => {
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
