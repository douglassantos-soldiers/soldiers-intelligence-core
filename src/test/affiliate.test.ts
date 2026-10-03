import { describe, expect, it } from "vitest";
import {
  normalizaHandle,
  videosParaEscalar,
  creatorsEmAlta,
  creatorsParaReativar,
  influenciadoresSemVenda,
  contratoAtivo,
} from "@/lib/affiliate";

const FIM = "2026-10-03";
const v = (data: string, video_id: string, criador: string, views: number, gmv: number) => ({
  data,
  video_id,
  criador,
  views,
  gmv,
  sku_orders: Math.round(gmv / 100),
  titulo: `vídeo ${video_id}`,
  produto_nome: "Creatina 300g",
});

describe("normalizaHandle", () => {
  it("remove @, espaços e maiúsculas", () => {
    expect(normalizaHandle(" @Joao.Fit ")).toBe("joao.fit");
    expect(normalizaHandle(null)).toBe("");
  });
});

describe("videosParaEscalar", () => {
  const rows = [
    v("2026-10-01", "A", "@ana", 20000, 6000), // GPM 300
    v("2026-10-01", "B", "@bia", 20000, 1000), // GPM 50
    v("2026-10-01", "C", "@caio", 20000, 1200), // GPM 60
    v("2026-10-01", "D", "@duda", 2000, 3000), // poucas views: fora
    v("2026-09-01", "E", "@edu", 50000, 20000), // fora da janela
  ];
  it("pega vídeos com GPM bem acima da mediana, views e GMV mínimos", () => {
    const r = videosParaEscalar(rows, FIM);
    expect(r.map((x) => x.video_id)).toEqual(["A"]);
    expect(r[0]!.gpm).toBe(300);
    expect(r[0]!.vsMediana).toBe(5); // mediana = 60
  });
});

describe("creatorsEmAlta", () => {
  it("compara 7 dias com os 7 anteriores e aceita creator novo", () => {
    const rows = [
      v("2026-09-24", "1", "@ana", 1000, 1000),
      v("2026-10-02", "2", "@ana", 1000, 3000), // +200%
      v("2026-09-24", "3", "@bia", 1000, 2000),
      v("2026-10-02", "4", "@bia", 1000, 2200), // +10%: fora
      v("2026-10-02", "5", "@nova", 1000, 1500), // novo
    ];
    const r = creatorsEmAlta(rows, FIM);
    expect(r.map((x) => x.criador)).toEqual(["ana", "nova"]);
    expect(r[0]!.variacao).toBe(200);
    expect(r[1]!.variacao).toBeNull();
  });
});

describe("creatorsParaReativar", () => {
  it("vendeu entre 31 e 90 dias atrás e nada nos últimos 30", () => {
    const rows = [
      v("2026-08-01", "1", "@parou", 1000, 5000),
      v("2026-08-01", "2", "@ativo", 1000, 5000),
      v("2026-09-30", "3", "@ativo", 1000, 100),
    ];
    expect(creatorsParaReativar(rows, FIM).map((x) => x.criador)).toEqual(["parou"]);
  });
});

describe("influenciadoresSemVenda", () => {
  it("lista contratos ativos com @ do TikTok sem venda em 30 dias, por custo", () => {
    const infl = [
      { nome: "Ana", tiktok_username: "@Ana", status: "ativo", cache_fixo: 2000 },
      { nome: "Caio", tiktok_username: "caio", status: "ativo", cache_fixo: 3000 },
      { nome: "Lia", tiktok_username: "lia", status: "encerrado", cache_fixo: 9000 },
      { nome: "Rui", tiktok_username: "rui", data_fim: "2026-01-01", cache_fixo: 9000 },
      { nome: "Sem TikTok", tiktok_username: null, status: "ativo", cache_fixo: 9000 },
    ];
    const videos = [v("2026-10-01", "1", "@ana", 1000, 500)];
    const r = influenciadoresSemVenda(infl, videos, FIM);
    expect(r.map((x) => x.nome)).toEqual(["Caio"]);
  });
  it("contrato com fim no passado não é ativo", () => {
    expect(contratoAtivo({ data_fim: "2026-09-30" }, FIM)).toBe(false);
    expect(contratoAtivo({ data_fim: "2026-12-31", status: "ativo" }, FIM)).toBe(true);
  });
});
