import { describe, expect, it } from "vitest";
import {
  MODELOS_WORKFLOW,
  workflowsVigentes,
  passosValidos,
  simularWorkflows,
} from "@/lib/workflows";
import { creatorsParecidos, cosseno } from "@/lib/lookalike";
import { placares } from "@/lib/placar";
import { REGRA_PADRAO } from "@/lib/programa";
import { exportPagamento, PAGAMENTO_MINIMO, type LinhaFechamento } from "@/lib/fechamento";
import type { CreatorOS, Amostra } from "@/lib/affiliateos";
import type { DNA } from "@/lib/dna";

const HOJE = "2026-10-01";

describe("workflows", () => {
  it("passos: tipos válidos e toda ação com aprovação", () => {
    expect(
      passosValidos(
        '[{"tipo":"acao","texto":"enviar","aprovacao":false},{"tipo":"loop","texto":"x"}]',
      ),
    ).toEqual([{ tipo: "acao", texto: "enviar", aprovacao: true }]);
    expect(passosValidos("x")).toEqual([]);
  });
  it("cadastro substitui o modelo pela chave e acrescenta os próprios", () => {
    const P = [{ tipo: "gatilho", texto: "a" }];
    const w = workflowsVigentes(
      [
        {
          chave: "outro_produto",
          nome: "Outro v1",
          versao: 1,
          vigente_desde: "2026-09-01",
          gatilho: "venda_categoria",
          passos: P,
          ativo: true,
        },
        {
          chave: "outro_produto",
          nome: "Outro v2",
          versao: 2,
          vigente_desde: "2026-09-20",
          gatilho: "venda_categoria",
          passos: P,
          ativo: false,
        },
        {
          chave: "outro_produto",
          nome: "Futuro",
          versao: 3,
          vigente_desde: "2026-12-01",
          gatilho: "venda_categoria",
          passos: P,
        },
        {
          chave: "meu_fluxo",
          nome: "Meu",
          versao: 1,
          vigente_desde: "2026-09-01",
          gatilho: "primeira_venda",
          passos: P,
        },
        {
          chave: "ruim",
          nome: "Ruim",
          versao: 1,
          vigente_desde: "2026-09-01",
          gatilho: "dm",
          passos: P,
        },
      ],
      HOJE,
    );
    expect(w).toHaveLength(MODELOS_WORKFLOW.length + 1);
    const o = w.find((x) => x.chave === "outro_produto")!;
    expect([o.nome, o.ativo, o.fonte, o.origem]).toEqual([
      "Outro v2",
      false,
      "cadastro",
      "Recommend Another Product",
    ]);
    expect(w.at(-1)!.chave).toBe("meu_fluxo");
    expect(workflowsVigentes([], HOJE)).toEqual(MODELOS_WORKFLOW);
  });
  it("simula por gatilho e workflow inativo não dispara", () => {
    const am = (o: Partial<Amostra>): Amostra => ({
      id: "x",
      creator: "C",
      handle: "@c",
      sku: "S",
      produto: "Whey",
      status: "enviado",
      diasNaEtapa: 1,
      investimento: 0,
      gmvDepois: 0,
      contribuicao: 0,
      roi: null,
      alertas: [],
      atrasada: false,
      encerrada: false,
      recebidoEm: "",
      publicadoEm: "",
      ...o,
    });
    const amostras = [
      am({}),
      am({ status: "recebido", recebidoEm: "2026-09-01" }),
      am({ status: "publicado", publicadoEm: "2026-09-01", gmvDepois: 300 }),
      am({ status: "cancelado", encerrada: true }),
    ];
    const ws = workflowsVigentes([], HOJE).map((w) =>
      w.chave === "outro_produto" ? { ...w, ativo: false } : w,
    );
    const s = simularWorkflows(ws, {
      recomendacoes: [
        {
          playbook: "outro_produto",
          creator: "B",
          handle: "@b",
          motivo: "m",
          acao: "",
          mensagem: "",
          prioridade: 3,
          tom: "primary",
          valor: 1,
        },
      ],
      amostras,
      creators: [],
      faixas: [],
      hoje: HOJE,
    });
    const por = (k: string) => s.find((w) => w.chave === k)!.disparos.map((d) => d.etapa);
    expect(por("amostra_ate_post")).toEqual([
      "Mensagem de entrega",
      "Revisão humana e pausa",
      "Pedir código Spark",
    ]);
    expect(por("amostra_ate_venda")).toEqual(["Convite para a campanha"]);
    expect(por("outro_produto")).toEqual([]);
  });
});

describe("creators parecidos", () => {
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
  const p = (creator: string, o: Partial<DNA>, gmv = 0) => ({
    creator,
    dna: dna(o),
    views: 1000,
    gmv,
  });
  it("cosseno", () => {
    expect(cosseno(new Map([["a", 1]]), new Map([["a", 2]]))).toBeCloseTo(1);
    expect(cosseno(new Map([["a", 1]]), new Map([["b", 1]]))).toBe(0);
    expect(cosseno(new Map(), new Map([["b", 1]]))).toBe(0);
  });
  it("compara com os de maior GMV e ignora loja e quem tem 1 vídeo", () => {
    const pecas = [
      p("top", {}, 5000),
      p("top", {}, 5000),
      p("igual", {}, 10),
      p("igual", {}),
      p("diferente", {
        produto: "Whey",
        gancho: "Erro / mito",
        angulo: "Ciência / pureza",
        formato: "Tutorial",
        cta: "Link / carrinho",
      }),
      p("diferente", {
        produto: "Whey",
        gancho: "Erro / mito",
        angulo: "Ciência / pureza",
        formato: "Tutorial",
        cta: "Link / carrinho",
      }),
      p("loja", {}, 1),
      p("loja", {}),
      p("solo", {}),
    ];
    const creators = [
      { handle: "@loja", tipoConta: "loja", gmv: 9000, nome: "Loja", cadastrado: false },
      { handle: "@igual", tipoConta: "creator", gmv: 10, nome: "Igual", cadastrado: true },
    ] as CreatorOS[];
    const r = creatorsParecidos(pecas, creators);
    expect(r.referencias.map((x) => x.handle)).toEqual(["@top"]);
    expect(r.avaliados).toBe(3);
    expect(r.parecidos.map((x) => [x.handle, x.similaridade, x.cadastrado])).toEqual([
      ["@igual", 100, true],
    ]);
    expect(r.parecidos[0]!.emComum[0]).toBe("Creatina");
  });
});

describe("placar do creator", () => {
  it("ranking, faixa e quanto falta em vendas", () => {
    const c = (handle: string, gmv: number, tipoConta = "creator") =>
      ({
        handle,
        nome: handle,
        gmv,
        gmv28: gmv,
        videos: 1,
        ultimaVenda: "",
        categoriaPrincipal: "creatina",
        tipoConta,
      }) as unknown as CreatorOS;
    const r = placares({
      creators: [c("@a", 100), c("@b", 900), c("@loja", 9999, "loja"), c("@z", 0)],
      faixas: [{ handle: "@b", medida: 500, faixaSugerida: { de: 0, comissaoPct: 5 } } as never],
      regra: REGRA_PADRAO,
      margemPct: 20,
      amostras: [],
      direitos: [],
      briefs: [{ produto: "Creatina" }],
    });
    expect(r.map((x) => [x.handle, x.posicao, x.de])).toEqual([
      ["@b", 1, 2],
      ["@a", 2, 2],
    ]);
    // faltam R$ 500 de contribuição para R$ 1 mil = R$ 2.500 em vendas com margem de 20%
    expect(r[0]!.proximaFaixa).toEqual({ comissaoPct: 7, faltaVendas: 2500 });
    expect(r[0]!.briefProduto).toBe("Creatina");
  });
});

describe("exportação para pagamento", () => {
  const l = (o: Partial<LinhaFechamento>): LinhaFechamento => ({
    cupom: "X",
    nome: "",
    tiktok: "",
    comissaoPct: 5,
    vendaCupom: 0,
    vendaUp: 0,
    vendaConsiderada: 0,
    fonteConsiderada: "cupom",
    vendaTikTok: 0,
    total: 0,
    comissao: 0,
    origem: ["influenciador"],
    ...o,
  });
  it("agrupa pelo @, separa conferir e abaixo do mínimo e não tem dado bancário", () => {
    const p = exportPagamento(
      [
        l({ cupom: "A1", nome: "Ana", tiktok: "ana", vendaConsiderada: 1000, comissao: 50 }),
        l({ cupom: "A2", nome: "Ana", tiktok: "ana", vendaConsiderada: 200, comissao: 10.004 }),
        l({ cupom: "B", nome: "Bia", vendaConsiderada: 100, comissao: PAGAMENTO_MINIMO - 1 }),
        l({ cupom: "C", nome: "Caio", vendaConsiderada: 900, comissao: 45 }),
        l({ cupom: "Z", nome: "Zero" }),
      ],
      "2026-09",
      {
        linhas: [
          { cupom: "c", situacao: "diferente" },
          { cupom: "A1", situacao: "bate" },
        ],
      },
    );
    expect(p.linhas.map((x) => [x.creator, x.cupons, x.comissao, x.situacao])).toEqual([
      ["Ana", "A1, A2", 60, "pronto"],
      ["Caio", "C", 45, "conferir"],
      ["Bia", "B", 9, "abaixo do mínimo"],
    ]);
    expect([p.valorPronto, p.valorConferir, p.valorAbaixo, p.total]).toEqual([60, 45, 9, 114]);
    expect(Object.keys(p.linhas[0]!).some((k) => /pix|cpf|cnpj|conta|banco/i.test(k))).toBe(false);
  });
});
