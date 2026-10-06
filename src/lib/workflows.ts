// Workflows do Affiliate OS (onda 3 do benchmark Cruva, benchmarks/cruva/ANALISE.md §10.2): os 6 modelos da Cruva
// adaptados à Soldiers (R$, contribuição no lugar de GMV, revisão humana no lugar de blacklist) e os 7 eventos de
// resposta. Aqui o workflow é só definição + simulação de "quem dispararia hoje". Nada executa: o motor que espera,
// envia e muda estado entra na Fase 3, com Policy + Approval + Audit, e toda ação já nasce marcada como "com aprovação".

import type { Amostra, CreatorOS } from "@/lib/affiliateos";
import type { FaixaCreator } from "@/lib/programa";
import type { Recomendacao } from "@/lib/playbooks";

type Row = Record<string, unknown>;
const txt = (v: unknown) => String(v ?? "").trim();
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const diasEntre = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

export const GATILHOS = {
  lista_outreach: "Creator entra na lista de outreach",
  amostra_enviada: "Amostra enviada",
  amostra_publicada: "Creator postou o vídeo da amostra",
  contribuicao_diaria: "Checagem diária da contribuição",
  venda_categoria: "Venda numa categoria",
  primeira_venda: "Primeira venda",
} as const;
export type Gatilho = keyof typeof GATILHOS;

export type Passo = {
  tipo: "gatilho" | "condicao" | "espera" | "acao";
  texto: string;
  /** Ação que, quando houver motor, exige aprovação humana antes de executar. */
  aprovacao?: boolean;
};
export type Workflow = {
  chave: string;
  nome: string;
  versao: number;
  gatilho: Gatilho;
  passos: Passo[];
  ativo: boolean;
  fonte: "modelo" | "cadastro";
  origem: string;
};

const g = (texto: string): Passo => ({ tipo: "gatilho", texto });
const c = (texto: string): Passo => ({ tipo: "condicao", texto });
const e = (texto: string): Passo => ({ tipo: "espera", texto });
const a = (texto: string): Passo => ({ tipo: "acao", texto, aprovacao: true });

/** Modelos pré-carregados. [FATO] fluxo da Cruva; [ADAPTAR] valores e regras para a Soldiers. */
export const MODELOS_WORKFLOW: Workflow[] = [
  {
    chave: "outreach_lista",
    nome: "Outreach da lista",
    versao: 0,
    gatilho: "lista_outreach",
    passos: [
      g("Creator com Opportunity ≥ 70 entra na lista"),
      a("Convite + mensagem de apresentação"),
      e("3 dias"),
      c("Pediu amostra?"),
      a("Sim: mandar o brief do produto · Não: um follow-up"),
    ],
    ativo: true,
    fonte: "modelo",
    origem: "Creator List Outreach",
  },
  {
    chave: "amostra_ate_post",
    nome: "Da amostra ao post",
    versao: 0,
    gatilho: "amostra_enviada",
    passos: [
      g("Amostra enviada"),
      a("Mensagem de entrega com o brief"),
      e("7 dias depois de receber"),
      c("Postou?"),
      a("Sim: pedir código Spark · Não: lembrete"),
      e("21 dias depois de receber"),
      a("Ainda sem post: revisão humana e pausa de novos envios (sem blacklist automática)"),
    ],
    ativo: true,
    fonte: "modelo",
    origem: "Sample Follow-Through",
  },
  {
    chave: "amostra_ate_venda",
    nome: "Da amostra à primeira venda",
    versao: 0,
    gatilho: "amostra_publicada",
    passos: [
      g("Creator postou o vídeo da amostra"),
      e("14 dias"),
      c("Vendeu?"),
      a("Sim: convite para a campanha do produto · Não: pedir novo vídeo (até 3 tentativas)"),
    ],
    ativo: true,
    fonte: "modelo",
    origem: "Sample to First Sale",
  },
  {
    chave: "oferta_por_contribuicao",
    nome: "Oferta por contribuição",
    versao: 0,
    gatilho: "contribuicao_diaria",
    passos: [
      g("Todo dia"),
      c("Passou de faixa de contribuição e a faixa cabe na margem?"),
      a("Oferecer a nova faixa de comissão"),
    ],
    ativo: true,
    fonte: "modelo",
    origem: "Send Different Offers by GMV (aqui por contribuição, não GMV)",
  },
  {
    chave: "outro_produto",
    nome: "Outro produto",
    versao: 0,
    gatilho: "venda_categoria",
    passos: [
      g("Vendeu R$ 500+ numa categoria"),
      c("Nada vendido numa categoria forte da loja?"),
      a("Convite e amostra do outro produto"),
    ],
    ativo: true,
    fonte: "modelo",
    origem: "Recommend Another Product",
  },
  {
    chave: "primeira_venda_vip",
    nome: "Primeira venda até VIP",
    versao: 0,
    gatilho: "primeira_venda",
    passos: [
      g("Primeira venda"),
      a("Parabéns + pedido de código Spark"),
      c("5 vídeos com venda?"),
      a("Convite para o grupo VIP (embaixador)"),
    ],
    ativo: true,
    fonte: "modelo",
    origem: "First Sale Momentum",
  },
];

/** Os 7 gatilhos de resposta automática da Cruva. Nenhum tem fonte de evento hoje: dependem de API oficial. */
export const EVENTOS_RESPOSTA = [
  { evento: "Creator pediu amostra", fonte: "TikTok Shop Affiliate API (sample applications)" },
  { evento: "Amostra aprovada", fonte: "TikTok Shop Affiliate API ou affiliate_amostra" },
  { evento: "Creator pediu colaboração", fonte: "TikTok Shop Affiliate API" },
  { evento: "Amostra recusada", fonte: "TikTok Shop Affiliate API ou affiliate_amostra" },
  { evento: "Creator recusou a colaboração", fonte: "TikTok Shop Affiliate API" },
  { evento: "Creator enviou código Spark", fonte: "Mensagens (TikTok/WhatsApp)" },
  { evento: "Qualquer outra mensagem", fonte: "Mensagens (TikTok/WhatsApp)" },
] as const;

const TIPOS = new Set(["gatilho", "condicao", "espera", "acao"]);

/** Lê os passos do jsonb. Toda ação fica com aprovação, mesmo que o cadastro diga o contrário. */
export function passosValidos(v: unknown): Passo[] {
  let arr: unknown = v;
  if (typeof v === "string")
    try {
      arr = JSON.parse(v);
    } catch {
      return [];
    }
  if (!Array.isArray(arr)) return [];
  return arr
    .map((p) => ({
      tipo: txt((p as Row)?.["tipo"]),
      texto: txt((p as Row)?.["texto"]).slice(0, 200),
    }))
    .filter((p) => TIPOS.has(p.tipo) && p.texto)
    .map((p) => ({
      tipo: p.tipo as Passo["tipo"],
      texto: p.texto,
      ...(p.tipo === "acao" ? { aprovacao: true } : {}),
    }));
}

/**
 * Workflows vigentes: a versão cadastrada mais recente (vigente até hoje) de cada chave substitui o modelo de mesma
 * chave; chaves novas entram como workflows próprios. Sem cadastro, valem os 6 modelos.
 */
export function workflowsVigentes(rows: Row[], hoje: string): Workflow[] {
  const porChave = new Map<string, Workflow & { _desde: string }>();
  for (const r of rows) {
    const chave = txt(r["chave"]);
    const gatilho = txt(r["gatilho"]) as Gatilho;
    const desde = dia(r["vigente_desde"]);
    const passos = passosValidos(r["passos"]);
    if (!chave || !(gatilho in GATILHOS) || !desde || desde > hoje || !passos.length) continue;
    const w = {
      chave,
      nome: txt(r["nome"]) || chave,
      versao: Number(r["versao"]) || 1,
      gatilho,
      passos,
      ativo: r["ativo"] !== false && r["ativo"] !== "false",
      fonte: "cadastro" as const,
      origem: MODELOS_WORKFLOW.find((m) => m.chave === chave)?.origem ?? "próprio",
      _desde: desde,
    };
    const cur = porChave.get(chave);
    if (!cur || desde > cur._desde || (desde === cur._desde && w.versao > cur.versao))
      porChave.set(chave, w);
  }
  const strip = ({ _desde, ...w }: Workflow & { _desde: string }): Workflow => (void _desde, w);
  const out = MODELOS_WORKFLOW.map((m) =>
    porChave.has(m.chave) ? strip(porChave.get(m.chave)!) : m,
  );
  for (const [k, w] of porChave)
    if (!MODELOS_WORKFLOW.some((m) => m.chave === k)) out.push(strip(w));
  return out;
}

export type Disparo = { creator: string; handle: string; etapa: string; motivo: string };
export type Simulacao = Workflow & { disparos: Disparo[] };

/**
 * Quem dispararia cada workflow hoje, com os dados que já existem. Workflow inativo não dispara.
 * A simulação vai pelo gatilho; passos cadastrados à mão só mudam o texto, não a regra simulada.
 */
export function simularWorkflows(
  wfs: Workflow[],
  i: {
    recomendacoes: Recomendacao[];
    amostras: Amostra[];
    creators: CreatorOS[];
    faixas: FaixaCreator[];
    hoje: string;
  },
  limite = 50,
): Simulacao[] {
  const rec = (pb: Recomendacao["playbook"], etapa: string): Disparo[] =>
    i.recomendacoes
      .filter((r) => r.playbook === pb)
      .map((r) => ({ creator: r.creator, handle: r.handle, etapa, motivo: r.motivo }));
  const porGatilho: Record<Gatilho, () => Disparo[]> = {
    lista_outreach: () =>
      i.creators
        .filter((c) => !c.cadastrado && c.tipoConta === "creator" && c.opportunity >= 70)
        .map((c) => ({
          creator: c.nome,
          handle: c.handle,
          etapa: "Convite + mensagem",
          motivo: `Opportunity ${c.opportunity}, ainda fora do cadastro.`,
        })),
    amostra_enviada: () =>
      i.amostras
        .filter((x) => !x.encerrada)
        .flatMap((x): Disparo[] => {
          const base = { creator: x.creator, handle: x.handle };
          if (x.status === "enviado")
            return [
              { ...base, etapa: "Mensagem de entrega", motivo: `${x.produto} em transporte.` },
            ];
          if ((x.status === "recebido" || x.status === "conteudo_pendente") && x.recebidoEm) {
            const d = diasEntre(x.recebidoEm, i.hoje);
            if (d >= 21)
              return [{ ...base, etapa: "Revisão humana e pausa", motivo: `${d} dias sem post.` }];
            if (d >= 7) return [{ ...base, etapa: "Lembrete", motivo: `${d} dias sem post.` }];
          }
          if (x.status === "publicado")
            return [{ ...base, etapa: "Pedir código Spark", motivo: `Postou ${x.produto}.` }];
          return [];
        }),
    amostra_publicada: () =>
      i.amostras
        .filter((x) => !x.encerrada && x.publicadoEm && diasEntre(x.publicadoEm, i.hoje) >= 14)
        .map((x) => ({
          creator: x.creator,
          handle: x.handle,
          etapa: x.gmvDepois > 0 ? "Convite para a campanha" : "Pedir novo vídeo",
          motivo:
            x.gmvDepois > 0
              ? `Vendeu R$ ${Math.round(x.gmvDepois).toLocaleString("pt-BR")} depois da amostra.`
              : `Postou ${x.produto} há ${diasEntre(x.publicadoEm, i.hoje)} dias sem venda.`,
        })),
    contribuicao_diaria: () =>
      i.faixas
        .filter((f) => f.cruzou && f.deltaPp > 0 && f.contribuicaoDepois > 0)
        .map((f) => ({
          creator: f.nome,
          handle: f.handle,
          etapa: `Oferecer ${f.faixaSugerida.comissaoPct}%`,
          motivo: f.leitura,
        })),
    venda_categoria: () => rec("outro_produto", "Convite para outro produto"),
    primeira_venda: () => [
      ...rec("primeira_venda", "Parabéns + pedido de Spark"),
      ...rec("subir_vip", "Convite VIP"),
    ],
  };
  return wfs.map((w) => ({
    ...w,
    disparos: w.ativo ? porGatilho[w.gatilho]().slice(0, limite) : [],
  }));
}
