// DNA do conteúdo (Plano Mestre caps. 7.5 e 8): gancho, ângulo e CTA de cada peça, e o que cada combinação entrega.
// Fontes que JÁ existem: título e texto do anúncio do Meta (vw_meta_anuncio_dia_completo, via placar da Central
// de criativos) e título dos vídeos de creators no TikTok (fact_tiktok_video_dia.titulo).
// Etiqueta manual (conteudo_etiqueta, migração 20261005160000) sempre vence a regra automática.
// A regra lê só palavras do texto [INFERÊNCIA]: não vê a imagem nem o áudio. Por isso a tela mostra a cobertura.
import type { CriativoPlacar } from "@/lib/criativos360";

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const txt = (v: unknown) => String(v ?? "").trim();
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const div = (a: number, b: number) => (b ? a / b : null);
const pct = (a: number, b: number) => (b ? (a / b) * 100 : null);
const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

export const NAO_IDENTIFICADO = "(não identificado)";
export type Dimensao = "gancho" | "angulo" | "cta";
export const DIMENSOES: { id: Dimensao; nome: string }[] = [
  { id: "gancho", nome: "Gancho" },
  { id: "angulo", nome: "Ângulo" },
  { id: "cta", nome: "CTA" },
];

// Ordem importa: a primeira regra que bate decide. Texto já sem acento e em minúsculas.
const REGRAS_DNA: Record<Dimensao, [RegExp, string][]> = {
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

/** Lê gancho, ângulo e CTA do texto. Gancho olha só o começo (primeira frase); ângulo e CTA, o texto todo. */
export function dnaDoTexto(texto: unknown): Record<Dimensao, string> {
  const t = semAcento(txt(texto).toLowerCase());
  const inicio = t.split(/(?<=[.!?])\s|\n/)[0] ?? t;
  const acha = (d: Dimensao, s: string) =>
    REGRAS_DNA[d].find(([re]) => re.test(s))?.[1] ?? NAO_IDENTIFICADO;
  return { gancho: acha("gancho", inicio), angulo: acha("angulo", t), cta: acha("cta", t) };
}

/** Etiquetas manuais atuais por canal + id da peça (vw_conteudo_etiqueta_atual). */
export function mapaManual(rows: Row[]): Map<string, Partial<Record<Dimensao, string>>> {
  const m = new Map<string, Partial<Record<Dimensao, string>>>();
  for (const r of rows) {
    const d = txt(r["dimensao"]) as Dimensao;
    if (!["gancho", "angulo", "cta"].includes(d) || !txt(r["valor"])) continue;
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
  const temRegra = (["gancho", "angulo", "cta"] as Dimensao[]).some(
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
    dna: combina(dnaDoTexto(`${c.titulo}. ${c.texto}`), manual.get(`meta:${c.creativeId}`)),
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
    { titulo: string; creator: string; views: number; gmv: number; un: number }
  >();
  for (const v of videos) {
    const d = dia(v["data"]);
    if (d < de || d > ate) continue;
    const id = txt(v["video_id"]);
    if (!id) continue;
    const cur = m.get(id) ?? {
      titulo: txt(v["titulo"]),
      creator: txt(v["criador"]).replace(/^@/, "").toLowerCase(),
      views: 0,
      gmv: 0,
      un: 0,
    };
    if (!cur.titulo && txt(v["titulo"])) cur.titulo = txt(v["titulo"]);
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
      creator: x.creator,
      dna: combina(dnaDoTexto(x.titulo), manual.get(`tiktok_creator:${id}`)),
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
        ctaQueVende: melhor(ps, "cta"),
      };
    })
    .sort((a, b) => b.gmv - a.gmv);
}

/** Quanto do gasto (Meta) e do GMV (TikTok) tem pelo menos uma dimensão identificada. */
export function cobertura(meta: PecaMeta[], tiktok: PecaTikTok[]) {
  const ok = (d: DNA) => d.fonte !== "nenhuma";
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
      texto: `Só ${Math.round(cob.metaPct)}% do gasto do Meta tem gancho, ângulo ou CTA identificado. Etiquetar os maiores criativos melhora a leitura.`,
    });
  return out;
}
