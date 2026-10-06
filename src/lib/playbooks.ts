// Playbooks do Affiliate OS (onda 2 do benchmark Cruva, benchmarks/cruva/ANALISE.md §10): a Cruva automatiza
// mensagens por gatilho; aqui o gatilho vira "ação sugerida do dia" com mensagem pronta para copiar. Nada é enviado:
// mandar mensagem, pausar envio ou mudar faixa continua com uma pessoa até a Fase 3 (login + aprovação + auditoria).
// Também gera o brief por produto a partir dos padrões vencedores do DNA do conteúdo (template, sem LLM).

import {
  categoria,
  creatorsTikTok,
  PRAZOS_AMOSTRA,
  type Amostra,
  type CreatorOS,
} from "@/lib/affiliateos";
import {
  faixasPorContribuicao,
  regraVigente,
  direitosDeUso,
  type FaixaCreator,
  type DireitoUso,
} from "@/lib/programa";
import { NAO_IDENTIFICADO, type DNA, type Padrao } from "@/lib/dna";

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const txt = (v: unknown) => String(v ?? "").trim();
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const handle = (v: unknown) => txt(v).replace(/^@/, "").toLowerCase();
const diasEntre = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const brl = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");

// ---------------------------------------------------------------------------------------------
// Ações sugeridas do dia

export const PLAYBOOKS = [
  {
    id: "lembrar_post",
    titulo: "Lembrar de postar",
    gatilho: `Amostra recebida há ${PRAZOS_AMOSTRA.publicar} a 20 dias e sem post.`,
    acao: "Mandar lembrete com o brief do produto.",
  },
  {
    id: "pausar_envios",
    titulo: "Revisar e pausar envios",
    gatilho: "Amostra recebida há 21 dias ou mais e sem post.",
    acao: "Conversar com o creator e segurar novas amostras até postar. Não é lista negra automática.",
  },
  {
    id: "primeira_venda",
    titulo: "Parabenizar a primeira venda",
    gatilho: "Primeira venda nos últimos 14 dias (dentro dos 90 dias lidos).",
    acao: "Parabenizar e pedir o código Spark / direito de uso do vídeo que vendeu.",
  },
  {
    id: "outro_produto",
    titulo: "Convidar para outro produto",
    gatilho: "Vendeu R$ 500 ou mais numa categoria e nada numa categoria forte da loja.",
    acao: "Oferecer amostra do outro produto.",
  },
  {
    id: "subir_vip",
    titulo: "Subir para VIP",
    gatilho: "5 ou mais vídeos com venda e ainda não é embaixador no cadastro.",
    acao: "Avaliar entrada no grupo VIP (embaixador).",
  },
  {
    id: "oferecer_faixa",
    titulo: "Oferecer faixa de comissão",
    gatilho: "Passou de faixa de contribuição nesta janela e a faixa cabe na margem.",
    acao: "Oferecer a nova faixa de comissão.",
  },
] as const;
export type PlaybookId = (typeof PLAYBOOKS)[number]["id"];
export const PLAYBOOK_TITULO = Object.fromEntries(PLAYBOOKS.map((p) => [p.id, p.titulo])) as Record<
  PlaybookId,
  string
>;

export type Recomendacao = {
  playbook: PlaybookId;
  creator: string;
  handle: string;
  motivo: string;
  acao: string;
  mensagem: string;
  prioridade: 1 | 2 | 3;
  tom: "danger" | "warn" | "success" | "primary";
  valor: number;
};

export const LIMIARES_PLAYBOOK = {
  primeiraVendaDias: 14,
  categoriaMin: 500,
  videosComVendaVip: 5,
  pausarDias: 21,
} as const;

const VIP = new Set(["embaixador"]);

/**
 * Regras explicáveis por creator. Contas de loja ficam fora (não são creators). Uma ação por playbook e creator.
 * `foco` é o produto da tela: no "outro produto", é a categoria sugerida primeiro quando o creator ainda não vende.
 */
export function recomendacoesDoDia(i: {
  amostras: Amostra[];
  videos: Row[];
  cadastro: Row[];
  creators: CreatorOS[];
  faixas: FaixaCreator[];
  direitos: DireitoUso[];
  foco: string;
  ref: string;
  hoje: string;
}): Recomendacao[] {
  const L = LIMIARES_PLAYBOOK;
  const out: Recomendacao[] = [];
  const loja = new Set(
    i.creators.filter((c) => c.tipoConta !== "creator").map((c) => handle(c.handle)),
  );
  const cad = new Map(i.cadastro.map((c) => [handle(c["tiktok_username"]), c]));
  const nome = (h: string) => txt(cad.get(h)?.["nome"]) || `@${h}`;

  // 1 e 2) Amostra recebida sem post
  for (const a of i.amostras) {
    if (a.encerrada || !a.recebidoEm || a.publicadoEm) continue;
    if (a.status !== "recebido" && a.status !== "conteudo_pendente") continue;
    const d = diasEntre(a.recebidoEm, i.hoje);
    if (d >= L.pausarDias)
      out.push({
        playbook: "pausar_envios",
        creator: a.creator,
        handle: a.handle,
        motivo: `Recebeu ${a.produto} há ${d} dias e não postou.`,
        acao: "Revisar com o creator e segurar novas amostras até postar.",
        mensagem: `Oi, ${a.creator}! Faz ${d} dias que o ${a.produto} chegou e ainda não vimos o vídeo. Aconteceu alguma coisa? Se precisar de ajuda com o roteiro, mandamos o brief de novo.`,
        prioridade: 1,
        tom: "danger",
        valor: a.investimento,
      });
    else if (d >= PRAZOS_AMOSTRA.publicar)
      out.push({
        playbook: "lembrar_post",
        creator: a.creator,
        handle: a.handle,
        motivo: `Recebeu ${a.produto} há ${d} dias e ainda não postou.`,
        acao: "Mandar lembrete com o brief do produto.",
        mensagem: `Oi, ${a.creator}! Tudo certo com o ${a.produto}? Quando o vídeo sair, avisa a gente. Segue o brief com o que mais tem funcionado para esse produto.`,
        prioridade: 2,
        tom: "warn",
        valor: a.investimento,
      });
  }

  // Dados do TikTok por creator (90 dias)
  const tt = creatorsTikTok(i.videos, i.ref);
  const videosComVenda = new Map<string, Set<string>>();
  for (const v of i.videos) {
    const h = handle(v["criador"]);
    if (!h || n(v["gmv"]) <= 0 || dia(v["data"]) > i.ref || !txt(v["video_id"])) continue;
    videosComVenda.set(h, (videosComVenda.get(h) ?? new Set()).add(txt(v["video_id"])));
  }
  const comDireito = new Set(
    i.direitos
      .filter(
        (d) =>
          d.status === "ativo" || d.status === "solicitado" || d.status === "pagamento_pendente",
      )
      .map((d) => handle(d.handle)),
  );
  // Categorias fortes da loja: as 4 de maior GMV entre os creators.
  const gmvCat = new Map<string, number>();
  for (const c of tt.values())
    if (!loja.has(c.handle))
      for (const [cat, g] of c.produtos) gmvCat.set(cat, (gmvCat.get(cat) ?? 0) + g);
  const fortes = [...gmvCat.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([c]) => c);
  const catFoco = categoria(i.foco);
  const rotuloCat = (c: string) => c.charAt(0).toUpperCase() + c.slice(1);

  for (const c of tt.values()) {
    const h = c.handle;
    if (loja.has(h)) continue;
    // 3) Primeira venda recente
    if (
      c.primeiraVenda &&
      diasEntre(c.primeiraVenda, i.ref) < L.primeiraVendaDias &&
      txt(cad.get(h)?.["estagio"]) !== "embaixador"
    )
      out.push({
        playbook: "primeira_venda",
        creator: nome(h),
        handle: `@${h}`,
        motivo: `Primeira venda em ${c.primeiraVenda.split("-").reverse().join("/")}; ${brl(c.gmv)} desde então.`,
        acao: comDireito.has(h)
          ? "Parabenizar (já há direito de uso em andamento)."
          : "Parabenizar e pedir o código Spark / direito de uso do vídeo que vendeu.",
        mensagem: comDireito.has(h)
          ? `Parabéns pela primeira venda, ${nome(h)}! Bora pra próxima.`
          : `Parabéns pela primeira venda, ${nome(h)}! Esse vídeo está convertendo bem: topa liberar o código de anúncio (Spark) para a gente impulsionar? Combinamos prazo e valor antes.`,
        prioridade: 1,
        tom: "success",
        valor: c.gmv,
      });
    // 4) Vende bem uma categoria e nada em outra forte
    const [melhorCat, melhorGmv] = [...c.produtos.entries()].sort((a, b) => b[1] - a[1])[0] ?? [
      "",
      0,
    ];
    if (melhorGmv >= L.categoriaMin) {
      const faltando = [catFoco, ...fortes].find((cat) => cat && !(c.produtos.get(cat) ?? 0));
      if (faltando && faltando !== melhorCat)
        out.push({
          playbook: "outro_produto",
          creator: nome(h),
          handle: `@${h}`,
          motivo: `Vendeu ${brl(melhorGmv)} em ${rotuloCat(melhorCat)} e nada em ${rotuloCat(faltando)}.`,
          acao: `Oferecer amostra de ${rotuloCat(faltando)}.`,
          mensagem: `Oi, ${nome(h)}! Seu conteúdo de ${rotuloCat(melhorCat)} está indo muito bem. Quer testar ${rotuloCat(faltando)}? Mandamos uma amostra e o brief.`,
          prioridade: 3,
          tom: "primary",
          valor: melhorGmv,
        });
    }
    // 5) VIP
    const nv = videosComVenda.get(h)?.size ?? 0;
    if (nv >= L.videosComVendaVip && !VIP.has(txt(cad.get(h)?.["estagio"])))
      out.push({
        playbook: "subir_vip",
        creator: nome(h),
        handle: `@${h}`,
        motivo: `${nv} vídeos com venda em 90 dias (${brl(c.gmv)}).`,
        acao: "Avaliar entrada no grupo VIP (embaixador).",
        mensagem: `Oi, ${nome(h)}! Você já tem ${nv} vídeos vendendo com a gente. Queremos te chamar para o grupo VIP: condições e lançamentos antes de todo mundo.`,
        prioridade: 2,
        tom: "primary",
        valor: c.gmv,
      });
  }

  // 6) Faixa de comissão
  for (const f of i.faixas)
    if (f.cruzou && f.deltaPp > 0 && f.contribuicaoDepois > 0 && !loja.has(handle(f.handle)))
      out.push({
        playbook: "oferecer_faixa",
        creator: f.nome,
        handle: f.handle,
        motivo: `Contribuição de ${brl(f.contribuicao)} na janela (antes ${brl(f.contribuicaoAnterior)}).`,
        acao: `Oferecer ${f.faixaSugerida.comissaoPct}% (+${f.deltaPp} p.p., custo extra de ${brl(f.custoExtra)}).`,
        mensagem: `Oi, ${f.nome}! Suas vendas subiram de nível e sua comissão também: a partir de agora, ${f.faixaSugerida.comissaoPct}%. Obrigado pela parceria!`,
        prioridade: 2,
        tom: "primary",
        valor: f.contribuicao,
      });

  return out.sort((a, b) => a.prioridade - b.prioridade || b.valor - a.valor);
}

export function contagemPlaybooks(r: Recomendacao[]) {
  return PLAYBOOKS.map((p) => ({
    id: p.id,
    titulo: p.titulo,
    total: r.filter((x) => x.playbook === p.id).length,
  }));
}

// ---------------------------------------------------------------------------------------------
// Brief por produto (template a partir do DNA)

export type Brief = {
  produto: string;
  confianca: Padrao["confianca"];
  videos: number;
  objetivo: string;
  usar: { dimensao: string; valor: string; detalhe: string }[];
  evitar: { dimensao: string; valor: string; detalhe: string }[];
  prazos: string[];
  regulatorio: string[];
  texto: string;
};

const DIM_NOME: Record<string, string> = {
  gancho: "Gancho",
  angulo: "Ângulo",
  formato: "Formato",
  cta: "CTA",
};

/**
 * [HIPÓTESE] Cuidados de comunicação de suplemento alimentar no Brasil (RDC 243/2018 e IN 28/2018 da Anvisa, guia
 * de publicidade por influenciadores do CONAR). Lista para validar com o jurídico/regulatório antes de usar.
 */
export const CUIDADOS_REGULATORIOS = [
  "Usar só alegações da lista oficial da Anvisa para o ingrediente; nada de prometer cura, tratamento ou prevenção de doença.",
  'Não prometer resultado garantido ("ganha X kg", "seca em X dias") nem usar antes/depois como promessa.',
  "Não dizer que substitui alimentação ou orientação de nutricionista/médico.",
  "Sinalizar que é publicidade (#publi ou equivalente), como pede o guia do CONAR para influenciadores.",
] as const;

type PecaBrief = { dna: DNA; views: number; gmv: number; vidaUtilDias: number | null };

const mediana = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

/**
 * Brief do produto: o que usar vem do padrão vencedor (maior GMV por mil views por dimensão); o que evitar é o valor
 * de menor resultado com pelo menos 2 vídeos e abaixo de 70% da média do produto.
 */
export function briefDoProduto(p: Padrao, pecas: PecaBrief[]): Brief {
  const ps = pecas.filter((x) => x.dna.produto === p.produto);
  const taxa = (xs: PecaBrief[]) => {
    const v = xs.reduce((s, x) => s + x.views, 0);
    return v ? (xs.reduce((s, x) => s + x.gmv, 0) / v) * 1000 : null;
  };
  const media = taxa(ps) ?? p.media;
  const evitar: Brief["evitar"] = [];
  for (const dim of ["gancho", "angulo", "formato", "cta"] as const) {
    const g = new Map<string, PecaBrief[]>();
    for (const x of ps)
      if (x.dna[dim] !== NAO_IDENTIFICADO) g.set(x.dna[dim], [...(g.get(x.dna[dim]) ?? []), x]);
    const pior = [...g.entries()]
      .filter(([, xs]) => xs.length >= 2)
      .map(([valor, xs]) => ({ valor, n: xs.length, r: taxa(xs) }))
      .filter((x) => x.r != null && media && x.r < media * 0.7)
      .sort((a, b) => (a.r ?? 0) - (b.r ?? 0))[0];
    if (pior && !p.escolhas.some((e) => e.dimensao === dim && e.valor === pior.valor))
      evitar.push({
        dimensao: DIM_NOME[dim]!,
        valor: pior.valor,
        detalhe: `${pior.n} vídeos, ${media ? Math.round(((pior.r ?? 0) / media) * 100) : 0}% da média`,
      });
  }
  const usar = p.escolhas.map((e) => ({
    dimensao: DIM_NOME[e.dimensao] ?? e.dimensao,
    valor: e.valor,
    detalhe: `${e.pecas} vídeos, ${e.indice != null ? e.indice.toFixed(1).replace(".", ",") + "× a média" : "acima da média"}`,
  }));
  const vida = mediana(ps.map((x) => x.vidaUtilDias).filter((x): x is number => x != null));
  const prazos = [
    `Postar em até ${PRAZOS_AMOSTRA.publicar} dias depois de receber a amostra.`,
    vida != null
      ? `Os vídeos de ${p.produto} perdem força em ~${Math.round(vida)} dias (mediana): planejar um novo vídeo a cada ${Math.max(7, Math.round(vida))} dias.`
      : `Planejar um novo vídeo a cada 2 a 3 semanas.`,
  ];
  const objetivo = `Vender ${p.produto} pelo TikTok Shop com o formato que mais converte hoje (média de ${media != null ? brl(media) : "—"} de GMV por mil views em ${ps.length || p.pecas} vídeos).`;
  const linhas = [
    `BRIEF — ${p.produto}`,
    `Objetivo: ${objetivo}`,
    "",
    "Use:",
    ...usar.map((u) => `- ${u.dimensao}: ${u.valor} (${u.detalhe})`),
    ...(evitar.length
      ? ["", "Evite:", ...evitar.map((e) => `- ${e.dimensao}: ${e.valor} (${e.detalhe})`)]
      : []),
    "",
    "Prazos:",
    ...prazos.map((x) => `- ${x}`),
    "",
    "Cuidados (validar com o regulatório):",
    ...CUIDADOS_REGULATORIOS.map((x) => `- ${x}`),
    "",
    `Confiança do padrão: ${p.confianca}. Base: vídeos de creators no TikTok, últimos 90 dias.`,
  ];
  return {
    produto: p.produto,
    confianca: p.confianca,
    videos: ps.length || p.pecas,
    objetivo,
    usar,
    evitar,
    prazos,
    regulatorio: [...CUIDADOS_REGULATORIOS],
    texto: linhas.join("\n"),
  };
}

// ---------------------------------------------------------------------------------------------
// Junta tudo (servidor e dados de exemplo usam a mesma função)

type PecaPrograma = PecaBrief & {
  id: string;
  titulo: string;
  creator: string;
  produtoNome: string;
  gmvMilViews: number | null;
};

export function programaAffiliate(i: {
  videos: Row[];
  cadastro: Row[];
  amostras: Amostra[];
  creators: CreatorOS[];
  regras: Row[];
  direitos: Row[];
  pecas: PecaPrograma[];
  padroes: Padrao[];
  margemPct: number;
  foco: string;
  ref: string;
  hoje: string;
}) {
  const loja = new Set(
    i.creators.filter((c) => c.tipoConta !== "creator").map((c) => handle(c.handle)),
  );
  const faixas = faixasPorContribuicao(
    i.videos,
    i.cadastro,
    regraVigente(i.regras, i.hoje),
    i.margemPct,
    i.ref,
    loja,
  );
  const direitos = direitosDeUso(i.direitos, i.cadastro, i.pecas, i.hoje);
  const recomendacoes = recomendacoesDoDia({
    amostras: i.amostras,
    videos: i.videos,
    cadastro: i.cadastro,
    creators: i.creators,
    faixas: faixas.creators,
    direitos: direitos.lista,
    foco: i.foco,
    ref: i.ref,
    hoje: i.hoje,
  });
  return {
    recomendacoes: recomendacoes.slice(0, 200),
    playbooks: contagemPlaybooks(recomendacoes),
    faixas: { ...faixas, creators: faixas.creators.slice(0, 200) },
    direitos: { ...direitos, lista: direitos.lista.slice(0, 300) },
    briefs: i.padroes.slice(0, 8).map((p) => briefDoProduto(p, i.pecas)),
  };
}
