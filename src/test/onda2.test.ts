import { describe, expect, it } from "vitest";
import {
  REGRA_PADRAO,
  regraVigente,
  faixasValidas,
  faixasPorContribuicao,
  direitosDeUso,
  SPARK_MIN_VIEWS,
} from "@/lib/programa";
import { recomendacoesDoDia, briefDoProduto, CUIDADOS_REGULATORIOS } from "@/lib/playbooks";
import { amostrasOS, listaCreatorsOS } from "@/lib/affiliateos";
import type { Padrao, DNA } from "@/lib/dna";

const REF = "2026-09-30";
const HOJE = "2026-10-01";
const v = (data: string, criador: string, gmv: number, extra: Record<string, unknown> = {}) => ({
  data,
  criador,
  gmv,
  views: 1000,
  produto_nome: "Creatina 300g",
  video_id: `${criador}-${data}`,
  ...extra,
});

describe("regra de comissão", () => {
  it("valida faixas e escolhe a vigente", () => {
    expect(faixasValidas('[{"de":1000,"comissao_pct":7},{"de":0,"comissao_pct":5}]')).toEqual([
      { de: 0, comissaoPct: 5 },
      { de: 1000, comissaoPct: 7 },
    ]);
    expect(faixasValidas([{ de: 500, comissao_pct: 7 }])).toEqual([]); // sem faixa base
    expect(faixasValidas([{ de: 0, comissao_pct: 80 }])).toEqual([]); // comissão absurda
    expect(faixasValidas("x")).toEqual([]);
    const rows = [
      {
        nome: "A",
        versao: 1,
        vigente_desde: "2026-09-01",
        base: "gmv",
        janela_dias: 30,
        faixas: [{ de: 0, comissao_pct: 6 }],
      },
      {
        nome: "A",
        versao: 2,
        vigente_desde: "2026-09-15",
        base: "contribuicao",
        janela_dias: 14,
        faixas: [{ de: 0, comissao_pct: 8 }],
      },
      {
        nome: "A",
        versao: 3,
        vigente_desde: "2026-11-01",
        base: "gmv",
        janela_dias: 30,
        faixas: [{ de: 0, comissao_pct: 9 }],
      },
    ];
    const r = regraVigente(rows, HOJE);
    expect([r.versao, r.janelaDias, r.faixas[0]!.comissaoPct, r.fonte]).toEqual([
      2,
      14,
      8,
      "cadastro",
    ]);
    expect(regraVigente([], HOJE)).toBe(REGRA_PADRAO);
  });

  it("faixa por contribuição, passou de faixa e limite de margem", () => {
    const videos = [
      // alfa: 0 na janela anterior, 20 mil na atual → contribuição 4 mil (20%) → 9%
      ...Array.from({ length: 20 }, (_, i) =>
        v(`2026-09-${String(i + 10).padStart(2, "0")}`, "alfa", 1000),
      ),
      // beta: 6 mil nas duas janelas → contribuição 1,2 mil → 7%, sem "passou"
      v("2026-08-15", "beta", 6000),
      v("2026-09-15", "beta", 6000),
      v("2026-09-15", "loja.x", 50000),
    ];
    const f = faixasPorContribuicao(videos, [], REGRA_PADRAO, 20, REF, new Set(["loja.x"]));
    const alfa = f.creators.find((c) => c.handle === "@alfa")!;
    expect([alfa.faixaSugerida.comissaoPct, alfa.deltaPp, alfa.custoExtra, alfa.cruzou]).toEqual([
      9,
      4,
      800,
      true,
    ]);
    expect(alfa.contribuicaoDepois).toBe(3200);
    const beta = f.creators.find((c) => c.handle === "@beta")!;
    expect([beta.faixaSugerida.comissaoPct, beta.cruzou]).toEqual([7, false]);
    expect(f.creators.some((c) => c.handle === "@loja.x")).toBe(false);
    expect(f.custoExtraTotal).toBe(800 + 120);
    // margem de 2%: a faixa de 9% (4 p.p.) deixaria a contribuição negativa → desce até a que cabe
    const regraGmv = { ...REGRA_PADRAO, base: "gmv" as const };
    const apertada = faixasPorContribuicao(videos, [], regraGmv, 2, REF);
    const a2 = apertada.creators.find((c) => c.handle === "@alfa")!;
    expect(a2.faixaPelaMedida.comissaoPct).toBe(9);
    expect(a2.faixaSugerida.comissaoPct).toBe(5);
    expect(a2.limitadaPelaMargem).toBe(true);
    expect(a2.contribuicaoDepois).toBeGreaterThanOrEqual(0);
  });
});

describe("direitos de uso", () => {
  const cad = [{ id: "c1", nome: "Alfa", tiktok_username: "alfa" }];
  const pecas = [
    {
      id: "v1",
      titulo: "a",
      creator: "alfa",
      produtoNome: "Creatina",
      views: 10000,
      gmv: 3000,
      gmvMilViews: 300,
      vidaUtilDias: null,
    },
    {
      id: "v2",
      titulo: "b",
      creator: "alfa",
      produtoNome: "Creatina",
      views: 10000,
      gmv: 2900,
      gmvMilViews: 290,
      vidaUtilDias: 12,
    },
    {
      id: "v3",
      titulo: "c",
      creator: "alfa",
      produtoNome: "Creatina",
      views: 10000,
      gmv: 100,
      gmvMilViews: 10,
      vidaUtilDias: null,
    },
    {
      id: "v4",
      titulo: "d",
      creator: "alfa",
      produtoNome: "Creatina",
      views: SPARK_MIN_VIEWS - 1,
      gmv: 4000,
      gmvMilViews: 900,
      vidaUtilDias: null,
    },
    {
      id: "v5",
      titulo: "e",
      creator: "",
      produtoNome: "Creatina",
      views: 10000,
      gmv: 9000,
      gmvMilViews: 900,
      vidaUtilDias: null,
    },
  ];
  it("status, vencimento e candidatos", () => {
    const rows = [
      {
        id: "d1",
        creator_id: "c1",
        video_id: "v1",
        plataforma: "tiktok_spark",
        status: "ativo",
        valor: 100,
        fim: "2026-10-08",
        tem_codigo: true,
      },
      {
        id: "d2",
        creator_id: "c1",
        video_id: "v9",
        plataforma: "tiktok_spark",
        status: "ativo",
        valor: 50,
        fim: "2026-09-20",
      },
      {
        id: "d3",
        creator_id: "c1",
        video_id: "v2",
        plataforma: "meta_partnership",
        status: "expirado",
        valor: 80,
        fim: "2026-08-01",
      },
    ];
    const d = direitosDeUso(rows, cad, pecas, HOJE);
    expect(d.contagem.ativo).toBe(2);
    expect(d.vencendo.map((x) => x.id)).toEqual(["d1"]);
    expect(d.vencidos).toBe(1);
    expect(d.lista[0]!.id).toBe("d2"); // vencido primeiro
    expect(d.valorAtivo).toBe(150);
    // v1 tem direito ativo; v2 só tem expirado (volta a ser candidato); v3 abaixo da média; v4 poucas views; v5 sem creator
    expect(d.candidatos.map((c) => c.videoId)).toEqual(["v2"]);
    expect(d.candidatos[0]!.motivo).toMatch(/perdeu força em 12 dias/);
  });
});

describe("ações do dia", () => {
  it("dispara cada playbook e ignora conta de loja", () => {
    const cadastro = [
      { id: "c1", nome: "Alfa", tiktok_username: "alfa", estagio: "escala", seguidores: 50000 },
      { id: "c2", nome: "Beta", tiktok_username: "beta", estagio: "amostra", seguidores: 5000 },
      { id: "c3", nome: "Vip", tiktok_username: "vip", estagio: "embaixador", seguidores: 90000 },
      { id: "c4", nome: "Loja", tiktok_username: "loja", seguidores: 10 },
    ];
    const videos = [
      ...Array.from({ length: 6 }, (_, i) =>
        v(`2026-08-0${i + 1}`, "alfa", 200, { video_id: `a${i}` }),
      ),
      ...Array.from({ length: 6 }, (_, i) =>
        v(`2026-08-0${i + 1}`, "vip", 200, { video_id: `p${i}` }),
      ),
      v("2026-09-25", "beta", 300, { produto_nome: "Whey 900g" }),
      v("2026-09-25", "loja", 5000),
    ];
    const amostras = amostrasOS(
      [
        {
          id: "x1",
          creator_id: "c2",
          sku: "W",
          produto: "Whey",
          status: "recebido",
          recebido_em: "2026-09-22",
        },
        {
          id: "x2",
          creator_id: "c1",
          sku: "C",
          produto: "Creatina",
          status: "conteudo_pendente",
          recebido_em: "2026-09-01",
        },
        {
          id: "x3",
          creator_id: "c1",
          sku: "C",
          produto: "Creatina",
          status: "cancelado",
          recebido_em: "2026-08-01",
        },
      ],
      cadastro,
      videos,
      20,
      HOJE,
    );
    const creators = listaCreatorsOS(videos, cadastro, REF, "Creatina", new Set());
    expect(creators.find((c) => c.handle === "@loja")?.tipoConta).toBe("loja");
    const r = recomendacoesDoDia({
      amostras,
      videos,
      cadastro,
      creators,
      faixas: [
        {
          handle: "@beta",
          nome: "Beta",
          gmvJanela: 300,
          contribuicao: 1500,
          contribuicaoAnterior: 0,
          medida: 1500,
          medidaAnterior: 0,
          faixaPelaMedida: { de: 1000, comissaoPct: 7 },
          faixaSugerida: { de: 1000, comissaoPct: 7 },
          deltaPp: 2,
          custoExtra: 6,
          contribuicaoDepois: 1494,
          cruzou: true,
          limitadaPelaMargem: false,
          leitura: "",
        },
      ],
      direitos: [],
      foco: "Creatina",
      ref: REF,
      hoje: HOJE,
    });
    const por = (pb: string) => r.filter((x) => x.playbook === pb).map((x) => x.creator);
    expect(por("pausar_envios")).toEqual(["Alfa"]); // 30 dias sem post
    expect(por("lembrar_post")).toEqual(["Beta"]); // 9 dias
    expect(por("primeira_venda")).toEqual(["Beta"]);
    expect(por("subir_vip")).toEqual(["Alfa"]); // Vip já é embaixador
    expect(por("outro_produto")).toEqual(expect.arrayContaining(["Alfa", "Vip"]));
    expect(por("oferecer_faixa")).toEqual(["Beta"]);
    expect(r.some((x) => x.creator === "Loja" || x.handle === "@loja")).toBe(false);
    expect(r[0]!.prioridade).toBe(1);
    expect(r.find((x) => x.playbook === "primeira_venda")!.mensagem).toMatch(/Spark/);
  });
});

describe("brief do produto", () => {
  const dna = (o: Partial<DNA>): DNA => ({
    gancho: "Pergunta",
    angulo: "Prova social",
    formato: "Review",
    produto: "Creatina",
    cta: "Cupom",
    publico: "(não identificado)",
    fonte: "regra",
    ...o,
  });
  it("usa o padrão, aponta o que evitar e traz os cuidados", () => {
    const pecas = [
      { dna: dna({ gancho: "Erro / mito" }), views: 1000, gmv: 300, vidaUtilDias: 10 },
      { dna: dna({ gancho: "Erro / mito" }), views: 1000, gmv: 300, vidaUtilDias: 14 },
      { dna: dna({}), views: 1000, gmv: 20, vidaUtilDias: null },
      { dna: dna({}), views: 1000, gmv: 20, vidaUtilDias: 30 },
      { dna: dna({ produto: "Whey" }), views: 1000, gmv: 999, vidaUtilDias: 1 },
    ];
    const padrao: Padrao = {
      produto: "Creatina",
      pecas: 4,
      base: 4000,
      media: 160,
      escolhas: [
        { dimensao: "gancho", valor: "Erro / mito", pecas: 2, resultado: 300, indice: 1.9 },
      ],
      brief: "",
      confianca: "baixa",
    };
    const b = briefDoProduto(padrao, pecas);
    expect(b.usar[0]).toMatchObject({ dimensao: "Gancho", valor: "Erro / mito" });
    expect(b.evitar).toEqual([
      { dimensao: "Gancho", valor: "Pergunta", detalhe: "2 vídeos, 13% da média" },
    ]);
    expect(b.prazos[1]).toMatch(/~14 dias/);
    expect(b.regulatorio).toHaveLength(CUIDADOS_REGULATORIOS.length);
    expect(b.texto).toMatch(/^BRIEF — Creatina/);
    expect(b.texto).toMatch(/Evite:\n- Gancho: Pergunta/);
    expect(b.videos).toBe(4);
  });
});
