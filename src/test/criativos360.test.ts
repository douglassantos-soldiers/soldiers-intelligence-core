import { describe, expect, it } from "vitest";
import { etiquetas } from "@/lib/criativos360";
import { criativosFixture } from "./criativos360-fixture";

const d = criativosFixture();
const c = (id: string) => d.placar.find((x) => x.creativeId === id)!;

describe("Central de criativos", () => {
  it("etiquetas pelo nome, texto e tipo", () => {
    expect(etiquetas("BF_VID_9x16_001 creatina @atleta.alfa", "", "VIDEO")).toEqual({
      formato: "Vídeo",
      proporcao: "9x16",
      produto: "Creatina",
      ugc: true,
      creator: "atleta.alfa",
    });
    expect(etiquetas("BF_IMG_4x5_002", "Whey 900g", "PHOTO")).toMatchObject({
      formato: "Imagem",
      produto: "Whey",
      ugc: false,
    });
    expect(etiquetas("Carrossel kit", "", "SHARE").formato).toBe("Carrossel");
  });
  it("criativo → cliente → LTV → contribuição", () => {
    expect(d.placar.map((x) => x.creativeId)).toEqual(["c1", "c3", "c2", "c5", "c4"]);
    const c1 = c("c1");
    expect(c1).toMatchObject({
      gasto: 3000,
      receitaMeta: 13500,
      receitaShopify: 9000,
      clientesNovos: 20,
      cac: 150,
      ltvNovos: 500,
      contribuicao: 600,
      contribuicaoLtv: 1000,
      leitura: "escalar",
    });
    expect(c1.ltvCac).toBeCloseTo(10 / 3);
    expect(c1.recompraPct).toBe(40);
    expect(c1.hookPct).toBeCloseTo(30);
    expect(c1.retencaoPct).toBeCloseTo(20);
  });
  it("leituras: renovar, cortar e observar", () => {
    expect(c("c2").leitura).toBe("renovar");
    expect(c("c2").motivo).toContain("CTR caiu 50%");
    expect(c("c3")).toMatchObject({
      leitura: "cortar",
      motivo: "gastou sem nenhuma compra",
      contribuicao: null,
    });
    const c5 = c("c5");
    expect(c5).toMatchObject({
      anuncios: 2,
      clientesNovos: 3,
      ltvNovos: 200,
      cac: 200,
      leitura: "cortar",
    });
    expect(c5.contribuicaoLtv).toBeCloseTo(-360);
    expect(c("c4").leitura).toBe("observar");
  });
  it("o que funciona por etiqueta", () => {
    const video = d.oQueFunciona.find((g) => g.dimensao === "Formato" && g.valor === "Vídeo")!;
    expect(video.ltvCac).toBeCloseTo(10 / 3);
    expect(
      d.oQueFunciona.find((g) => g.dimensao === "Tipo" && g.valor === "UGC / creator")!.criativos,
    ).toBe(1);
  });
  it("multicanal, biblioteca e alertas", () => {
    const l = Object.fromEntries(d.multicanal.map((m) => [m.id, m.leitura]));
    expect(l).toEqual({ v1: "escalar", v2: "cortar", v3: "observar", k1: "manter", g1: "BEST" });
    const f = Object.fromEntries(d.biblioteca.map((b) => [b.id, [b.emUso, b.gasto]]));
    expect(f).toEqual({ f1: [1, 3000], f2: [1, 1500], f3: [0, 0] });
    expect(d.alertas.map((a) => `${a.tipo}:${a.tag}`)).toEqual([
      "problema:Criativos",
      "problema:Criativos",
      "problema:Biblioteca",
      "oportunidade:Criativos",
    ]);
  });
});
