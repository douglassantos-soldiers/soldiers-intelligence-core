// Creators parecidos com os melhores da Soldiers (onda 3 do benchmark Cruva; roadmap v2 "lookalike sobre os creators
// da Soldiers"). Sem base de terceiros: compara só creators que já postaram vídeo de produto Soldiers no TikTok.
// Perfil do creator = como ele faz conteúdo (DNA: produto, gancho, ângulo, formato e CTA dos vídeos dos últimos 90 dias).
// Similaridade de cosseno entre perfis. É sugestão para olhar primeiro, não previsão de venda.

import type { CreatorOS } from "@/lib/affiliateos";
import { NAO_IDENTIFICADO, type DNA } from "@/lib/dna";

type Peca = { creator: string; dna: DNA; views: number; gmv: number };
type Perfil = Map<string, number>;

const DIMS = ["produto", "gancho", "angulo", "formato", "cta"] as const;
const NOME_DIM: Record<string, string> = {
  produto: "",
  gancho: "gancho ",
  angulo: "ângulo ",
  formato: "formato ",
  cta: "CTA ",
};
export const LOOKALIKE = {
  minVideos: 2,
  /** Referência = os creators de maior GMV: 10% dos que vendem (pelo menos 1, no máximo 10 e nunca mais da metade). */
  refPct: 0.1,
  refMax: 10,
  similaridadeMin: 50,
} as const;

/** Perfil: em cada dimensão, a fatia de vídeos de cada valor (soma 1 por dimensão). */
export function perfis(pecas: Peca[]) {
  const por = new Map<string, Peca[]>();
  for (const p of pecas) {
    const h = p.creator.replace(/^@/, "").toLowerCase();
    if (h) por.set(h, [...(por.get(h) ?? []), p]);
  }
  const out = new Map<string, { perfil: Perfil; videos: number; views: number; gmv: number }>();
  for (const [h, ps] of por) {
    const perfil: Perfil = new Map();
    for (const d of DIMS) {
      const vals = ps.map((p) => p.dna[d]).filter((v) => v && v !== NAO_IDENTIFICADO);
      for (const v of vals)
        perfil.set(`${d}:${v}`, (perfil.get(`${d}:${v}`) ?? 0) + 1 / vals.length);
    }
    out.set(h, {
      perfil,
      videos: ps.length,
      views: ps.reduce((s, p) => s + p.views, 0),
      gmv: ps.reduce((s, p) => s + p.gmv, 0),
    });
  }
  return out;
}

export function cosseno(a: Perfil, b: Perfil) {
  let dot = 0;
  for (const [k, v] of a) dot += v * (b.get(k) ?? 0);
  const na = Math.sqrt([...a.values()].reduce((s, v) => s + v * v, 0));
  const nb = Math.sqrt([...b.values()].reduce((s, v) => s + v * v, 0));
  return na && nb ? dot / (na * nb) : 0;
}

export type Parecido = {
  handle: string;
  nome: string;
  cadastrado: boolean;
  parecidoCom: string;
  similaridade: number;
  emComum: string[];
  videos: number;
  views: number;
  gmv: number;
  gmvMilViews: number | null;
  leitura: string;
};

export function creatorsParecidos(pecas: Peca[], creators: CreatorOS[]) {
  const L = LOOKALIKE;
  const pf = perfis(pecas);
  const info = new Map(creators.map((c) => [c.handle.replace(/^@/, ""), c]));
  const elegiveis = [...pf.entries()].filter(
    ([h, p]) => p.videos >= L.minVideos && (info.get(h)?.tipoConta ?? "creator") === "creator",
  );
  const gmvDe = (h: string, p: { gmv: number }) => info.get(h)?.gmv ?? p.gmv;
  const comVenda = elegiveis.filter(([h, p]) => gmvDe(h, p) > 0);
  const nRef = Math.min(
    L.refMax,
    Math.max(1, Math.ceil(comVenda.length * L.refPct)),
    Math.floor(elegiveis.length / 2),
  );
  const refs = [...comVenda].sort((a, b) => gmvDe(b[0], b[1]) - gmvDe(a[0], a[1])).slice(0, nRef);
  const refSet = new Set(refs.map(([h]) => h));
  const brl = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
  const lista: Parecido[] = [];
  for (const [h, p] of elegiveis) {
    if (refSet.has(h)) continue;
    let melhor: { h: string; s: number; perfil: Perfil; gmv: number } | null = null;
    for (const [rh, rp] of refs) {
      const s = cosseno(p.perfil, rp.perfil);
      if (!melhor || s > melhor.s) melhor = { h: rh, s, perfil: rp.perfil, gmv: gmvDe(rh, rp) };
    }
    if (!melhor) continue;
    const sim = Math.round(melhor.s * 100);
    if (sim < L.similaridadeMin) continue;
    const emComum = [...p.perfil.entries()]
      .filter(([k, v]) => v >= 0.3 && (melhor!.perfil.get(k) ?? 0) >= 0.3)
      .sort(
        (a, b) =>
          DIMS.indexOf(a[0].split(":")[0] as never) - DIMS.indexOf(b[0].split(":")[0] as never) ||
          b[1] - a[1],
      )
      .map(([k]) => {
        const [d, ...v] = k.split(":");
        return `${NOME_DIM[d!] ?? ""}${v.join(":")}`;
      });
    const c = info.get(h);
    const gmv = gmvDe(h, p);
    lista.push({
      handle: `@${h}`,
      nome: c?.nome || `@${h}`,
      cadastrado: c?.cadastrado ?? false,
      parecidoCom: `@${melhor.h}`,
      similaridade: sim,
      emComum,
      videos: p.videos,
      views: p.views,
      gmv,
      gmvMilViews: p.views ? (p.gmv / p.views) * 1000 : null,
      leitura: `Faz conteúdo parecido com @${melhor.h} (${brl(melhor.gmv)} em 90 dias); hoje vende ${brl(gmv)}.`,
    });
  }
  lista.sort((a, b) => b.similaridade - a.similaridade || a.gmv - b.gmv);
  return {
    referencias: refs.map(([h, p]) => ({ handle: `@${h}`, gmv: gmvDe(h, p), videos: p.videos })),
    parecidos: lista.slice(0, 40),
    avaliados: elegiveis.length,
  };
}
