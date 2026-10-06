// Onda 1 do benchmark Cruva: estados de amostra, conta de loja, funil semanal, coortes, vida útil e tags.
import { describe, expect, it } from "vitest";
import {
  amostrasOS,
  tipoDeConta,
  funilAmostrasSemanal,
  retencaoCoortes,
  STATUS_AMOSTRA_LABEL,
} from "@/lib/affiliateos";
import { vidaUtil, vidaUtilResumo, dnaTikTok, resumoTikTok, mapaManual } from "@/lib/dna";
import { tagsDinamicas, contagemTags, type Creator } from "@/lib/afiliados";

const HOJE = "2026-10-06";
const cad = [{ id: "c1", nome: "Creator Um", tiktok_username: "um" }];
const am = (o: Record<string, unknown>) => ({
  id: String(o["id"]),
  creator_id: "c1",
  sku: "S",
  custo_produto: 10,
  frete: 0,
  desconto: 0,
  outros_custos: 0,
  ...o,
});

describe("amostras: estados da Cruva e atraso", () => {
  const lista = amostrasOS(
    [
      am({ id: "rev", status: "solicitou", solicitado_em: "2026-10-01" }),
      am({ id: "env", status: "aprovado", solicitado_em: "2026-09-25", aprovado_em: "2026-09-30" }),
      am({ id: "ok", status: "aprovado", solicitado_em: "2026-10-05", aprovado_em: "2026-10-05" }),
      am({
        id: "exp",
        status: "expirado",
        solicitado_em: "2026-09-01",
        encerrado_em: "2026-09-10",
      }),
      am({ id: "rej", status: "rejeitado", solicitado_em: "2026-09-01" }),
    ],
    cad,
    [],
    20,
    HOJE,
  );
  const por = (id: string) => lista.find((a) => a.id === id)!;
  it("rótulos no padrão do TikTok Shop", () => {
    expect(STATUS_AMOSTRA_LABEL["solicitou"]).toBe("Para revisar");
    expect(STATUS_AMOSTRA_LABEL["aguardando_envio"]).toBe("Pronto para enviar");
    expect(STATUS_AMOSTRA_LABEL["enviado"]).toBe("Em transporte");
    expect(STATUS_AMOSTRA_LABEL["ignorado"]).toBe("Ignorado");
  });
  it("prazos de revisão e envio marcam atraso; encerradas não", () => {
    expect(por("rev")).toMatchObject({ atrasada: true, alertas: ["3+ dias para revisar"] });
    expect(por("env")).toMatchObject({ atrasada: true, alertas: ["5+ dias sem envio"] });
    expect(por("ok")).toMatchObject({ atrasada: false, alertas: [] });
    expect(por("exp")).toMatchObject({ encerrada: true, atrasada: false, diasNaEtapa: 26 });
    expect(
      lista
        .slice(-2)
        .map((a) => a.id)
        .sort(),
    ).toEqual(["exp", "rej"]);
  });
});

describe("conta de loja × creator", () => {
  it("regra automática e cadastro", () => {
    expect(tipoDeConta({ gmv: 3000, views: 100 }).tipoConta).toBe("loja");
    expect(tipoDeConta({ gmv: 3000, views: 50000 }).tipoConta).toBe("creator");
    expect(tipoDeConta({ gmv: 500, views: 10 }).tipoConta).toBe("creator");
    // com seguidores no cadastro, vale o número de seguidores (não as views)
    const loja = tipoDeConta({ gmv: 5000, views: 90000 }, { seguidores: 42 });
    expect(loja).toMatchObject({ tipoConta: "loja", tipoFonte: "regra" });
    expect(loja.tipoMotivo).toContain("42 seguidores");
    expect(tipoDeConta({ gmv: 5000, views: 10 }, { seguidores: 50000 }).tipoConta).toBe("creator");
    // o cadastro vence
    expect(tipoDeConta({ gmv: 5000, views: 10 }, { tipo_conta: "creator" })).toMatchObject({
      tipoConta: "creator",
      tipoFonte: "cadastro",
    });
    expect(tipoDeConta({ gmv: 0, views: 0 }, { tipo_conta: "agencia" }).tipoConta).toBe("agencia");
  });
});

describe("funil semanal de amostras e coortes", () => {
  it("entregues × publicadas por semana de entrega", () => {
    const lista = amostrasOS(
      [
        am({ id: "a", status: "publicado", recebido_em: "2026-09-15", publicado_em: "2026-09-19" }),
        am({ id: "b", status: "conteudo_pendente", recebido_em: "2026-09-16" }),
        am({ id: "c", status: "publicado", recebido_em: "2026-09-22", publicado_em: "2026-09-24" }),
        am({
          id: "velha",
          status: "publicado",
          recebido_em: "2026-05-01",
          publicado_em: "2026-05-02",
        }),
      ],
      cad,
      [],
      20,
      HOJE,
    );
    const f = funilAmostrasSemanal(lista, HOJE);
    expect(
      f.map((w) => [w.semana, w.entregues, w.publicadas, w.cumprimentoPct, w.diasAtePostar]),
    ).toEqual([
      ["2026-09-14", 2, 1, 50, 4],
      ["2026-09-21", 1, 1, 100, 2],
    ]);
    // semana entregue há 15 dias já passou do prazo de 7 dias para postar (+7 de folga)
    expect(f[1]!.emAberto).toBe(false);
  });
  it("coorte pelo mês do 1º vídeo; ativo = vídeo novo no mês", () => {
    const v = (id: string, criador: string, publicado_em: string) => ({
      video_id: id,
      criador,
      publicado_em,
      data: publicado_em,
    });
    const c = retencaoCoortes(
      [
        v("1", "a", "2026-08-03"),
        v("1", "a", "2026-08-03"), // mesmo vídeo em outro dia não conta duas vezes
        v("2", "a", "2026-09-10"),
        v("3", "b", "2026-08-20"),
        v("4", "c", "2026-09-01"),
        v("5", "c", "2026-10-02"),
        v("6", "velho", "2025-01-01"),
      ],
      HOJE,
      3,
    );
    expect(c).toEqual([
      { coorte: "2026-08", creators: 2, meses: [100, 50, 0] },
      { coorte: "2026-09", creators: 1, meses: [100, 100, null] },
    ]);
  });
});

describe("vida útil do vídeo e impacto do gancho", () => {
  const serie = (vals: number[], inicio = "2026-09-01") =>
    new Map(
      vals.map((x, k) => [
        new Date(Date.parse(inicio + "T00:00:00Z") + k * 86400000).toISOString().slice(0, 10),
        x,
      ]),
    );
  it("dias até cair abaixo de 10% do pico", () => {
    // pico no dia 2 (1000), cai para 90 no dia 6 → vida útil 6
    expect(
      vidaUtil(serie([100, 500, 1000, 600, 300, 150, 90, 50]), "", "2026-09-01", "2026-09-30"),
    ).toBe(6);
    // dia sem linha conta como zero
    expect(vidaUtil(serie([1000, 800]), "", "2026-09-01", "2026-09-30")).toBe(2);
    // vídeo com menos de 21 dias no período fica de fora
    expect(vidaUtil(serie([1000, 50]), "", "2026-09-01", "2026-09-15")).toBeNull();
    // publicado antes do período: série incompleta
    expect(vidaUtil(serie([1000, 50]), "2026-08-20", "2026-09-01", "2026-09-30")).toBeNull();
    // ainda acima do limite no fim do período
    expect(vidaUtil(serie(Array(30).fill(1000)), "", "2026-09-01", "2026-09-30")).toBeNull();
  });
  it("resumo e colunas no DNA", () => {
    const r = vidaUtilResumo([
      { vidaUtilDias: 2 },
      { vidaUtilDias: 6 },
      { vidaUtilDias: 40 },
      { vidaUtilDias: null },
    ]);
    expect(r).toMatchObject({ mediana: 6, videosMaduros: 3 });
    expect(r.faixas.map((f) => f.videos)).toEqual([1, 1, 0, 0, 1]);
    const pt = dnaTikTok(
      [
        {
          data: "2026-09-01",
          video_id: "v1",
          titulo: "Pare de errar na creatina",
          criador: "a",
          views: 1000,
          gmv: 300,
        },
        {
          data: "2026-09-02",
          video_id: "v1",
          titulo: "Pare de errar na creatina",
          criador: "a",
          views: 50,
          gmv: 0,
        },
        {
          data: "2026-09-01",
          video_id: "v2",
          titulo: "unboxing",
          criador: "b",
          views: 1000,
          gmv: 50,
        },
      ],
      mapaManual([]),
      "2026-09-01",
      "2026-09-30",
    );
    expect(pt.find((p) => p.id === "v1")!.vidaUtilDias).toBe(1);
    const g = resumoTikTok(pt).find((x) => x.dimensao === "gancho" && x.valor === "Erro / mito")!;
    // média: 350 / 2050 × 1000 = 170,7; grupo: 300 / 1050 × 1000 = 285,7 → impacto = (285,7 − 170,7) × 1,05
    expect(g.impacto!).toBeCloseTo((300 / 1050 - 350 / 2050) * 1050, 1);
    expect(g.vidaUtilMediana).toBe(1);
  });
});

describe("tags dinâmicas", () => {
  const base: Creator = {
    chave: "",
    fonte: "Influenciador",
    nome: "",
    handle: "",
    tier: "",
    cupom: "",
    gmv: 0,
    gmvSite: 0,
    gmvTikTok: 0,
    custo: 0,
    roi: null,
    pedidos: 0,
    ticket: null,
    pctNovos: null,
    devolucaoPct: null,
    descontoPct: null,
    ultimaVenda: "",
    diasSemVenda: null,
    estado: "sem venda",
    pagoSemVenda: false,
  };
  it("aplica as regras e conta por tag", () => {
    const cs = tagsDinamicas([
      { ...base, chave: "a", gmv: 10000, gmvTikTok: 8000, roi: 6, pctNovos: 70, estado: "ativo" },
      { ...base, chave: "b", gmv: 1500, devolucaoPct: 12, estado: "esfriando" },
      { ...base, chave: "c", gmv: 0, custo: 500, pagoSemVenda: true },
      ...Array.from({ length: 8 }, (_, k) => ({
        ...base,
        chave: `x${k}`,
        gmv: 100 + k,
        estado: "ativo" as const,
      })),
    ]);
    const tags = (k: string) => cs.find((c) => c.chave === k)!.tags;
    expect(tags("a")).toEqual(["top10", "vendeu1k", "traz_novos", "roi_alto", "tiktok_forte"]);
    expect(tags("b")).toEqual(["vendeu1k", "em_risco", "devolucao_alta"]);
    expect(tags("c")).toEqual(["pago_sem_venda"]);
    const cont = Object.fromEntries(contagemTags(cs).map((t) => [t.id, t.creators]));
    expect(cont).toMatchObject({ top10: 1, vendeu1k: 2, pago_sem_venda: 1 });
  });
});
