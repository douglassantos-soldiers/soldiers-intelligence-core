// DNA do conteúdo (Plano Mestre caps. 7.5, 8.11 e 8.12): gancho, ângulo, formato, produto, CTA, creator e público
// de cada peça, o que cada valor entrega e os padrões vencedores por produto (insumo de brief).
// Fontes que JÁ existem: título e texto do anúncio do Meta (vw_meta_anuncio_dia_completo, via placar da Central
// de criativos) e título dos vídeos de creators no TikTok (fact_tiktok_video_dia.titulo).
// Etiqueta manual (conteudo_etiqueta, migração 20261005160000) sempre vence a regra automática.
// A regra lê só palavras do texto [INFERÊNCIA]: não vê a imagem nem o áudio. Por isso a tela mostra a cobertura.
import { produtoDoTexto, type CriativoPlacar } from "@/lib/criativos360";

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const txt = (v: unknown) => String(v ?? "").trim();
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const div = (a: number, b: number) => (b ? a / b : null);
const pct = (a: number, b: number) => (b ? (a / b) * 100 : null);
const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

export const NAO_IDENTIFICADO = "(não identificado)";
export type Dimensao = "gancho" | "angulo" | "formato" | "produto" | "cta" | "publico";
export const DIMENSOES: { id: Dimensao; nome: string }[] = [
  { id: "gancho", nome: "Gancho" },
  { id: "angulo", nome: "Ângulo" },
  { id: "formato", nome: "Formato" },
  { id: "produto", nome: "Produto" },
  { id: "cta", nome: "CTA" },
  { id: "publico", nome: "Público" },
];
/** Dimensões do roteiro, lidas do texto. Produto vem do catálogo/nome; público só por etiqueta manual. */
export const DIM_TEXTO = ["gancho", "angulo", "formato", "cta"] as const;
type DimTexto = (typeof DIM_TEXTO)[number];

// Ordem importa: a primeira regra que bate decide. Texto já sem acento e em minúsculas.
const REGRAS_DNA: Record<DimTexto, [RegExp, string][]> = {
  gancho: [
    [/\bpov\b|\bstorytime\b|\bminha (historia|rotina)\b|\bquando eu\b/, "História / POV"],
    [
      /\bpare de\b|\bnao (faca|tome|compre)\b|\berro(s)?\b|\berrad[oa]\b|\bninguem (fala|te conta)\b|\bmito\b/,
      "Erro / mito",
    ],
    [/\bantes e depois\b|\bresultado(s)?\b|\b\d+ ?(dias|semanas|kg)\b/, "Resultado"],
    [/^\s*\d+ |\btop ?\d+\b|\b\d+ (motivos|dicas|coisas|erros)\b/, "Lista / número"],
    [/\bnovo\b|\bnova\b|\blancamento\b|\bchegou\b|\bacabou de chegar\b/, "Novidade"],
    [
      /\d+ ?% ?off\b|\bdesconto\b|\bpromo|\bblack\b|\bfrete gratis\b|\bleve \d|\bcompre \d/,
      "Oferta",
    ],
    [/^[^.!\n]{0,120}\?/, "Pergunta"],
  ],
  angulo: [
    [
      /\bcreapure\b|\blaudo\b|\bpureza\b|\bpur[ao]\b|\bestud|\bciencia\b|\b\d+ ?(g|mg) (por|de)\b|\bdose\b|\bformula\b|\bingrediente/,
      "Ciência / pureza",
    ],
    [
      /\bmais vendid|\bavaliac|\bestrelas\b|\bclientes\b|\bmil pessoas\b|\btodo mundo\b|\bfavorit/,
      "Prova social",
    ],
    [
      /\batleta\b|\bnutricionista\b|\bnutri\b|\bcampe[aã]|\bpersonal\b|\btreinador\b|\bmedico\b/,
      "Autoridade",
    ],
    [
      /\bdesconto\b|\bpreco\b|\bbarat|\bpromo|\boff\b|\bcupom\b|\beconomi|\bcusto[- ]beneficio\b|\bblack\b/,
      "Preço / oferta",
    ],
    [
      /\bganh(ar|o|ei) (massa|peso)\b|\bhipertrofia\b|\bdefini|\bshape\b|\bforca\b|\bperformance\b|\bresultado|\bevolu/,
      "Resultado / shape",
    ],
    [
      /\bsabor\b|\bgostos|\bdelicios|\bdissolve\b|\bnao empelota\b|\btextura\b/,
      "Sabor / experiência",
    ],
    [/\bpratic|\brotina\b|\bdia a dia\b|\bfacil\b|\brapid|\bcorreria\b/, "Rotina / praticidade"],
    [
      /\bcansac|\bsem energia\b|\bnao (ganha|cresce|evolui)\b|\bfadiga\b|\bdor\b|\bplato\b/,
      "Dor / problema",
    ],
  ],
  // Formato do conteúdo (roteiro), não o tipo de mídia (vídeo/imagem/carrossel, que está em "O que funciona").
  formato: [
    [/\bunbox|\brecebidinho|\babrindo\b|\bchegou (o|a) meu|\bchegou (o|a) minha/, "Unboxing"],
    [/\bantes e depois\b|\btransforma(cao|cou)\b/, "Antes e depois"],
    [/\bvs\b|\bversus\b|\bcompara|\bqual (e|o) melhor\b|\bdiferenca entre\b/, "Comparação"],
    [
      /\breceita\b|\bshake\b|\bsmoothie\b|\bpanqueca\b|\bbolo\b|\bvitamina de\b/,
      "Receita / preparo",
    ],
    [
      /\bcomo (usar|tomar|fazer|preparar)\b|\bpasso a passo\b|\btutorial\b|\bdica(s)?\b|\baprenda\b/,
      "Tutorial / dica",
    ],
    [
      /\breview\b|\bresenha\b|\bvale a pena\b|\btestei\b|\bminha opiniao\b|\bsincer[oa]\b|\bavaliando\b/,
      "Review",
    ],
    [/\bdepoimento\b|\bminha experiencia\b|\bmeu relato\b|\bstorytime\b/, "Depoimento"],
    [/\brotina\b|\bvlog\b|\bum dia\b|\btreino de hoje\b|\bmeu dia\b|\bpov\b/, "Rotina / vlog"],
  ],
  cta: [
    [/\bcupom\b|\bcodigo\b|\buse o\b/, "Cupom"],
    [
      /\bcarrinho (amarelo|laranja)\b|\blink na bio\b|\bclica no link\b|\bvitrine\b/,
      "Link / carrinho",
    ],
    [
      /\bultimas unidades\b|\bso hoje\b|\bacaba\b|\bcorre\b|\bestoque limitado\b|\bgaranta\b|\bate (hoje|amanha|meia-noite)\b/,
      "Urgência",
    ],
    [/\bcompre\b|\bcompra(r)? agora\b|\bpeca (ja|o seu)\b|\bgaranta\b/, "Compre agora"],
    [/\bsaiba mais\b|\bconheca\b|\bdescubra\b|\bveja\b/, "Saiba mais"],
  ],
};

export type DNA = Record<Dimensao, string> & { fonte: "manual" | "regra" | "misto" | "nenhuma" };

/**
 * Lê o DNA do texto. Gancho olha só o começo (primeira frase); ângulo, formato e CTA, o texto todo.
 * Produto: o informado (catálogo/nome da peça) ou o citado no texto. Público: sempre etiqueta manual.
 */
export function dnaDoTexto(texto: unknown, produto?: unknown): Record<Dimensao, string> {
  const t = semAcento(txt(texto).toLowerCase());
  const inicio = t.split(/(?<=[.!?])\s|\n/)[0] ?? t;
  const acha = (d: DimTexto, s: string) =>
    REGRAS_DNA[d].find(([re]) => re.test(s))?.[1] ?? NAO_IDENTIFICADO;
  return {
    gancho: acha("gancho", inicio),
    angulo: acha("angulo", t),
    formato: acha("formato", t),
    produto: produtoDoTexto(produto) || produtoDoTexto(texto) || NAO_IDENTIFICADO,
    cta: acha("cta", t),
    publico: NAO_IDENTIFICADO,
  };
}

/** Etiquetas manuais atuais por canal + id da peça (vw_conteudo_etiqueta_atual). */
export function mapaManual(rows: Row[]): Map<string, Partial<Record<Dimensao, string>>> {
  const m = new Map<string, Partial<Record<Dimensao, string>>>();
  for (const r of rows) {
    const d = txt(r["dimensao"]) as Dimensao;
    if (!DIMENSOES.some((x) => x.id === d) || !txt(r["valor"])) continue;
    const k = `${txt(r["canal"])}:${txt(r["conteudo_id"])}`;
    m.set(k, { ...(m.get(k) ?? {}), [d]: txt(r["valor"]) });
  }
  return m;
}

export function combina(
  auto: Record<Dimensao, string>,
  manual?: Partial<Record<Dimensao, string>>,
): DNA {
  const out = { ...auto, ...(manual ?? {}) };
  const temManual = !!manual && Object.keys(manual).length > 0;
  const temRegra = DIMENSOES.map((x) => x.id).some(
    (d) => !manual?.[d] && auto[d] !== NAO_IDENTIFICADO,
  );
  return {
    ...out,
    fonte: temManual ? (temRegra ? "misto" : "manual") : temRegra ? "regra" : "nenhuma",
  };
}

// ---------------------------------------------------------------------------------------------
// Peças com DNA

export type PecaMeta = {
  id: string;
  nome: string;
  dna: DNA;
  gasto: number;
  impressoes: number;
  cliques: number;
  receitaMeta: number;
  clientesNovos: number | null;
  ltvNovos: number | null;
  contribuicaoLtv: number | null;
};

export function dnaMeta(
  placar: CriativoPlacar[],
  manual: Map<string, Partial<Record<Dimensao, string>>>,
): PecaMeta[] {
  return placar.map((c) => ({
    id: c.creativeId,
    nome: c.nome,
    dna: combina(
      dnaDoTexto(`${c.titulo}. ${c.texto}`, c.etiquetas.produto || c.nome),
      manual.get(`meta:${c.creativeId}`),
    ),
    gasto: c.gasto,
    impressoes: c.impressoes,
    cliques: c.cliques,
    receitaMeta: c.receitaMeta,
    clientesNovos: c.clientesNovos,
    ltvNovos: c.ltvNovos,
    contribuicaoLtv: c.contribuicaoLtv,
  }));
}

export type PecaTikTok = {
  id: string;
  titulo: string;
  produtoNome: string;
  creator: string;
  dna: DNA;
  views: number;
  gmv: number;
  unidades: number;
  gmvMilViews: number | null;
};

/** Um vídeo por linha no período (soma os dias). Creator só pelo @ público. */
export function dnaTikTok(
  videos: Row[],
  manual: Map<string, Partial<Record<Dimensao, string>>>,
  de: string,
  ate: string,
): PecaTikTok[] {
  const m = new Map<
    string,
    { titulo: string; produto: string; creator: string; views: number; gmv: number; un: number }
  >();
  for (const v of videos) {
    const d = dia(v["data"]);
    if (d < de || d > ate) continue;
    const id = txt(v["video_id"]);
    if (!id) continue;
    const cur = m.get(id) ?? {
      titulo: txt(v["titulo"]),
      produto: txt(v["produto_nome"]),
      creator: txt(v["criador"]).replace(/^@/, "").toLowerCase(),
      views: 0,
      gmv: 0,
      un: 0,
    };
    if (!cur.titulo && txt(v["titulo"])) cur.titulo = txt(v["titulo"]);
    if (!cur.produto && txt(v["produto_nome"])) cur.produto = txt(v["produto_nome"]);
    // views do fact são do dia [INFERÊNCIA pelo nome da tabela *_dia]
    cur.views += n(v["views"]);
    cur.gmv += n(v["gmv"]);
    cur.un += n(v["unidades"]);
    m.set(id, cur);
  }
  return [...m.entries()]
    .map(([id, x]) => ({
      id,
      titulo: x.titulo,
      produtoNome: x.produto,
      creator: x.creator,
      dna: combina(dnaDoTexto(x.titulo, x.produto), manual.get(`tiktok_creator:${id}`)),
      views: x.views,
      gmv: x.gmv,
      unidades: x.un,
      gmvMilViews: x.views ? (x.gmv / x.views) * 1000 : null,
    }))
    .sort((a, b) => b.gmv - a.gmv);
}

// ---------------------------------------------------------------------------------------------
// Resumo por dimensão

export type GrupoMeta = {
  dimensao: Dimensao;
  valor: string;
  pecas: number;
  gasto: number;
  fatiaGastoPct: number | null;
  ctrPct: number | null;
  roasMeta: number | null;
  clientesNovos: number;
  cac: number | null;
  ltvCac: number | null;
  contribuicaoLtv: number | null;
};

export function resumoMeta(pecas: PecaMeta[]): GrupoMeta[] {
  const total = pecas.reduce((s, p) => s + p.gasto, 0);
  const out: GrupoMeta[] = [];
  for (const { id: dim } of DIMENSOES) {
    const g = new Map<string, PecaMeta[]>();
    for (const p of pecas) g.set(p.dna[dim], [...(g.get(p.dna[dim]) ?? []), p]);
    for (const [valor, ps] of g) {
      const gasto = ps.reduce((s, p) => s + p.gasto, 0);
      const comCli = ps.filter((p) => p.clientesNovos != null);
      const novos = comCli.reduce((s, p) => s + (p.clientesNovos ?? 0), 0);
      const gastoCli = comCli.reduce((s, p) => s + p.gasto, 0);
      const ltv = novos
        ? comCli.reduce((s, p) => s + (p.ltvNovos ?? 0) * (p.clientesNovos ?? 0), 0) / novos
        : null;
      const cac = novos ? gastoCli / novos : null;
      out.push({
        dimensao: dim,
        valor,
        pecas: ps.length,
        gasto,
        fatiaGastoPct: pct(gasto, total),
        ctrPct: pct(
          ps.reduce((s, p) => s + p.cliques, 0),
          ps.reduce((s, p) => s + p.impressoes, 0),
        ),
        roasMeta: div(
          ps.reduce((s, p) => s + p.receitaMeta, 0),
          gasto,
        ),
        clientesNovos: novos,
        cac,
        ltvCac: ltv != null && cac ? ltv / cac : null,
        contribuicaoLtv: comCli.length
          ? comCli.reduce((s, p) => s + (p.contribuicaoLtv ?? 0), 0)
          : null,
      });
    }
  }
  return out.sort((a, b) => a.dimensao.localeCompare(b.dimensao) || b.gasto - a.gasto);
}

export type GrupoTikTok = {
  dimensao: Dimensao;
  valor: string;
  videos: number;
  creators: number;
  views: number;
  gmv: number;
  fatiaGmvPct: number | null;
  gmvMilViews: number | null;
  indice: number | null; // GMV por mil views ÷ média geral
};

export function resumoTikTok(pecas: PecaTikTok[]): GrupoTikTok[] {
  const gmvT = pecas.reduce((s, p) => s + p.gmv, 0);
  const viewsT = pecas.reduce((s, p) => s + p.views, 0);
  const media = viewsT ? (gmvT / viewsT) * 1000 : null;
  const out: GrupoTikTok[] = [];
  for (const { id: dim } of DIMENSOES) {
    const g = new Map<string, PecaTikTok[]>();
    for (const p of pecas) g.set(p.dna[dim], [...(g.get(p.dna[dim]) ?? []), p]);
    for (const [valor, ps] of g) {
      const views = ps.reduce((s, p) => s + p.views, 0);
      const gmv = ps.reduce((s, p) => s + p.gmv, 0);
      const gmvMil = views ? (gmv / views) * 1000 : null;
      out.push({
        dimensao: dim,
        valor,
        videos: ps.length,
        creators: new Set(ps.map((p) => p.creator).filter(Boolean)).size,
        views,
        gmv,
        fatiaGmvPct: pct(gmv, gmvT),
        gmvMilViews: gmvMil,
        indice: gmvMil != null && media ? gmvMil / media : null,
      });
    }
  }
  return out.sort((a, b) => a.dimensao.localeCompare(b.dimensao) || b.gmv - a.gmv);
}

/** Combinações gancho + ângulo no TikTok com amostra mínima, ordenadas por GMV por mil views. */
export function combinacoesTikTok(pecas: PecaTikTok[], minVideos = 3) {
  const g = new Map<string, PecaTikTok[]>();
  for (const p of pecas) {
    if (p.dna.gancho === NAO_IDENTIFICADO && p.dna.angulo === NAO_IDENTIFICADO) continue;
    const k = `${p.dna.gancho} + ${p.dna.angulo}`;
    g.set(k, [...(g.get(k) ?? []), p]);
  }
  return [...g.entries()]
    .filter(([, ps]) => ps.length >= minVideos)
    .map(([combinacao, ps]) => {
      const views = ps.reduce((s, p) => s + p.views, 0);
      const gmv = ps.reduce((s, p) => s + p.gmv, 0);
      return {
        combinacao,
        videos: ps.length,
        views,
        gmv,
        gmvMilViews: views ? (gmv / views) * 1000 : null,
      };
    })
    .sort((a, b) => (b.gmvMilViews ?? -1) - (a.gmvMilViews ?? -1));
}

/** DNA de cada creator: gancho e ângulo que mais vendem para ele (para briefing do Affiliate OS). */
export function dnaPorCreator(pecas: PecaTikTok[]) {
  const g = new Map<string, PecaTikTok[]>();
  for (const p of pecas) if (p.creator) g.set(p.creator, [...(g.get(p.creator) ?? []), p]);
  const melhor = (ps: PecaTikTok[], d: Dimensao) => {
    const m = new Map<string, number>();
    for (const p of ps)
      if (p.dna[d] !== NAO_IDENTIFICADO) m.set(p.dna[d], (m.get(p.dna[d]) ?? 0) + p.gmv);
    const top = [...m.entries()].sort((a, b) => b[1] - a[1])[0];
    return top && top[1] > 0 ? top[0] : "";
  };
  return [...g.entries()]
    .map(([creator, ps]) => {
      const views = ps.reduce((s, p) => s + p.views, 0);
      const gmv = ps.reduce((s, p) => s + p.gmv, 0);
      return {
        creator,
        videos: ps.length,
        gmv,
        gmvMilViews: views ? (gmv / views) * 1000 : null,
        ganchoQueVende: melhor(ps, "gancho"),
        anguloQueVende: melhor(ps, "angulo"),
        formatoQueVende: melhor(ps, "formato"),
        ctaQueVende: melhor(ps, "cta"),
      };
    })
    .sort((a, b) => b.gmv - a.gmv);
}

/** Quanto do gasto (Meta) e do GMV (TikTok) tem pelo menos uma dimensão do roteiro identificada. */
export function cobertura(meta: PecaMeta[], tiktok: PecaTikTok[]) {
  const ok = (d: DNA) => DIM_TEXTO.some((k) => d[k] !== NAO_IDENTIFICADO);
  const gM = meta.reduce((s, p) => s + p.gasto, 0);
  const gT = tiktok.reduce((s, p) => s + p.gmv, 0);
  return {
    metaPct: pct(
      meta.filter((p) => ok(p.dna)).reduce((s, p) => s + p.gasto, 0),
      gM,
    ),
    tiktokPct: pct(
      tiktok.filter((p) => ok(p.dna)).reduce((s, p) => s + p.gmv, 0),
      gT,
    ),
    manuais: [...meta, ...tiktok].filter((p) => p.dna.fonte === "manual" || p.dna.fonte === "misto")
      .length,
  };
}

// ---------------------------------------------------------------------------------------------
// Padrões vencedores por produto (cap. 8.12): o melhor valor de cada dimensão do roteiro,
// comparado com a média do próprio produto. Vira brief para creators e para a próxima leva de anúncios.

export type Padrao = {
  produto: string;
  pecas: number;
  base: number; // views (TikTok) ou gasto (Meta) do produto
  media: number | null; // GMV por mil views ou ROAS do produto
  escolhas: {
    dimensao: DimTexto;
    valor: string;
    pecas: number;
    resultado: number | null;
    indice: number | null;
  }[];
  brief: string;
  confianca: "alta" | "média" | "baixa";
};

type Medida<T> = { resultado: (x: T) => number; base: (x: T) => number; escala: number };

export function padroesVencedores<T extends { dna: DNA }>(
  pecas: T[],
  m: Medida<T>,
  minPecasProduto = 4,
  minPecasValor = 2,
): Padrao[] {
  const nome: Record<string, string> = {
    gancho: "abrir com",
    angulo: "ângulo",
    formato: "formato",
    cta: "fechar com",
  };
  const porProduto = new Map<string, T[]>();
  for (const p of pecas) {
    const k = p.dna.produto;
    porProduto.set(k, [...(porProduto.get(k) ?? []), p]);
  }
  const taxa = (ps: T[]) => {
    const b = ps.reduce((s, p) => s + m.base(p), 0);
    return b ? (ps.reduce((s, p) => s + m.resultado(p), 0) / b) * m.escala : null;
  };
  const out: Padrao[] = [];
  for (const [produto, ps] of porProduto) {
    if (produto === NAO_IDENTIFICADO || ps.length < minPecasProduto) continue;
    const media = taxa(ps);
    const escolhas: Padrao["escolhas"] = [];
    for (const dim of DIM_TEXTO) {
      const g = new Map<string, T[]>();
      for (const p of ps)
        if (p.dna[dim] !== NAO_IDENTIFICADO) g.set(p.dna[dim], [...(g.get(p.dna[dim]) ?? []), p]);
      const melhor = [...g.entries()]
        .filter(([, xs]) => xs.length >= minPecasValor)
        .map(([valor, xs]) => ({ valor, pecas: xs.length, resultado: taxa(xs) }))
        .sort((a, b) => (b.resultado ?? -1) - (a.resultado ?? -1))[0];
      if (melhor && melhor.resultado != null && media != null && melhor.resultado > media)
        escolhas.push({
          dimensao: dim,
          ...melhor,
          indice: media ? melhor.resultado / media : null,
        });
    }
    if (!escolhas.length) continue;
    const menor = Math.min(...escolhas.map((e) => e.pecas));
    out.push({
      produto,
      pecas: ps.length,
      base: ps.reduce((s, p) => s + m.base(p), 0),
      media,
      escolhas,
      brief: `${produto}: ${escolhas.map((e) => `${nome[e.dimensao]} ${e.valor}`).join(", ")}.`,
      confianca: menor >= 10 ? "alta" : menor >= 5 ? "média" : "baixa",
    });
  }
  return out.sort((a, b) => b.base - a.base);
}

export const MEDIDA_TIKTOK: Medida<PecaTikTok> = {
  resultado: (p) => p.gmv,
  base: (p) => p.views,
  escala: 1000,
};
export const MEDIDA_META: Medida<PecaMeta> = {
  resultado: (p) => p.receitaMeta,
  base: (p) => p.gasto,
  escala: 1,
};

// ---------------------------------------------------------------------------------------------
// Alertas

export type AlertaDNA = {
  tipo: "problema" | "oportunidade";
  tag: string;
  tom: "danger" | "warn" | "success" | "primary";
  texto: string;
};

export function alertasDNA(
  meta: GrupoMeta[],
  tiktok: GrupoTikTok[],
  cob: ReturnType<typeof cobertura>,
): AlertaDNA[] {
  const out: AlertaDNA[] = [];
  const f1 = (v: number) => v.toFixed(1).replace(".", ",");
  // Ângulo que vende muito acima da média no TikTok mas aparece em poucos vídeos
  const sub = tiktok
    .filter(
      (g) =>
        g.dimensao === "angulo" &&
        g.valor !== NAO_IDENTIFICADO &&
        g.videos >= 3 &&
        (g.indice ?? 0) >= 1.5 &&
        (g.fatiaGmvPct ?? 0) < 25,
    )
    .sort((a, b) => (b.indice ?? 0) - (a.indice ?? 0))[0];
  if (sub)
    out.push({
      tipo: "oportunidade",
      tag: "DNA do conteúdo",
      tom: "success",
      texto: `Ângulo "${sub.valor}" vende ${f1(sub.indice ?? 0)}× a média por mil views no TikTok e é só ${Math.round(sub.fatiaGmvPct ?? 0)}% do GMV. Pedir mais vídeos assim aos creators.`,
    });
  // Ângulo que leva verba no Meta e perde dinheiro no LTV
  const ruim = meta
    .filter(
      (g) =>
        g.dimensao === "angulo" &&
        g.valor !== NAO_IDENTIFICADO &&
        (g.fatiaGastoPct ?? 0) >= 20 &&
        (g.contribuicaoLtv ?? 0) < 0,
    )
    .sort((a, b) => b.gasto - a.gasto)[0];
  if (ruim)
    out.push({
      tipo: "problema",
      tag: "DNA do conteúdo",
      tom: "warn",
      texto: `Ângulo "${ruim.valor}" leva ${Math.round(ruim.fatiaGastoPct ?? 0)}% do gasto do Meta com contribuição LTV negativa.`,
    });
  if (cob.metaPct != null && cob.metaPct < 50)
    out.push({
      tipo: "problema",
      tag: "DNA do conteúdo",
      tom: "primary",
      texto: `Só ${Math.round(cob.metaPct)}% do gasto do Meta tem gancho, ângulo, formato ou CTA identificado. Etiquetar os maiores criativos melhora a leitura.`,
    });
  return out;
}
