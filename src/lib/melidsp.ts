// Mercado Ads / Meli DSP (display e vídeo do Mercado Livre). Views que JÁ existem:
// vw_ml_display_kpi_dia, vw_ml_display_campanha_dia e vw_ml_display_criativo_dia.
// Receita é a atribuída pelo Mercado Livre: não somar com a venda realizada do ML (cap. 13.2).
// [HIPÓTESE] As colunas *_tp são uma segunda janela de atribuição da fonte (provavelmente incluindo
// pós-visualização). A tela mostra as duas separadas e calcula o ROAS só com a coluna sem sufixo.

import { anomaliaDoDia, serieDiaria } from "@/lib/ritmo";

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const txt = (v: unknown) => String(v ?? "").trim();
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const div = (a: number, b: number) => (b ? a / b : null);
const pct = (a: number, b: number) => (b ? (a / b) * 100 : null);
const noPeriodo = (rows: Row[], de: string, ate: string) =>
  rows.filter((r) => dia(r["data"]) >= de && dia(r["data"]) <= ate);

// Divisão de verba por etapa do funil que a equipe usa (conversão / consideração / reconhecimento).
export const MIX_ALVO = { conversao: 70, consideracao: 22, reconhecimento: 8 } as const;
export type Etapa = keyof typeof MIX_ALVO | "outros";
export const ETAPA_LABEL: Record<Etapa, string> = {
  conversao: "Conversão",
  consideracao: "Consideração",
  reconhecimento: "Reconhecimento",
  outros: "Sem etapa",
};

/** Etapa do funil pelo nome, tipo ou objetivo da campanha (CONVERSAO, DCA_RETARGETING, IN_MARKETING, VIDEO_INSTITU…). */
export function etapaDaCampanha(...campos: unknown[]): Etapa {
  const s = campos.map(txt).join(" ").toUpperCase();
  if (/CONVERS|RETARGET|DCA|VENDA|SALES/.test(s)) return "conversao";
  if (/CONSIDER|INTERA|IN_?MARKET|TRAFEGO|TRÁFEGO|TRAFFIC/.test(s)) return "consideracao";
  if (/AWARE|RECONHEC|ALCANCE|REACH|VIDEO|VÍDEO|INSTITU|BRAND/.test(s)) return "reconhecimento";
  return "outros";
}

const CAMPOS = [
  "investimento",
  "impressoes",
  "alcance",
  "cliques",
  "ppv",
  "add_to_cart",
  "checkout",
  "unidades",
  "receita",
  "receita_tp",
  "views_ativas",
  "views_completas",
] as const;
type Campo = (typeof CAMPOS)[number];
type Soma = Record<Campo, number>;
const soma = (): Soma => Object.fromEntries(CAMPOS.map((c) => [c, 0])) as Soma;
const acum = (s: Soma, r: Row) => {
  for (const c of CAMPOS) s[c] += n(r[c]);
};
const kpis = (s: Soma) => ({
  ...s,
  roas: div(s.receita, s.investimento),
  roasTp: div(s.receita_tp, s.investimento),
  ctrPct: pct(s.cliques, s.impressoes),
  cpm: s.impressoes ? (s.investimento / s.impressoes) * 1000 : null,
  cpc: div(s.investimento, s.cliques),
});

export function resumoMeliDsp(kpiDia: Row[], de: string, ate: string) {
  const r0 = noPeriodo(kpiDia, de, ate);
  const t = soma();
  for (const r of r0) acum(t, r);
  const serie = serieDiaria(r0, "investimento", "receita");
  // Funil: impressões → cliques → visitas ao produto (ppv) → carrinho → checkout → unidades.
  const etapas = [
    { etapa: "Impressões", valor: t.impressoes },
    { etapa: "Cliques", valor: t.cliques },
    { etapa: "Visitas ao produto", valor: t.ppv },
    { etapa: "Carrinho", valor: t.add_to_cart },
    { etapa: "Checkout", valor: t.checkout },
    { etapa: "Unidades vendidas", valor: t.unidades },
  ].map((e, i, arr) => ({ ...e, passagemPct: i ? pct(e.valor, arr[i - 1]!.valor) : null }));
  return {
    ...kpis(t),
    frequencia: div(t.impressoes, t.alcance),
    funil: etapas,
    dias: serie.map((d) => ({ ...d, roas: div(d.receita, d.gasto) })),
    anomalia: anomaliaDoDia(serie),
  };
}

export type CampanhaDsp = ReturnType<typeof kpis> & {
  id: string;
  campanha: string;
  etapa: Etapa;
  tipo: string;
  goal: string;
  status: string;
  frequencia: number | null;
};

export function campanhasMeliDsp(campDia: Row[], de: string, ate: string) {
  const m = new Map<
    string,
    { s: Soma; nome: string; tipo: string; goal: string; status: string }
  >();
  for (const r of noPeriodo(campDia, de, ate)) {
    const k = txt(r["campaign_id"]);
    if (!k) continue;
    const cur = m.get(k) ?? {
      s: soma(),
      nome: txt(r["campaign_name"]),
      tipo: txt(r["tipo"]),
      goal: txt(r["goal"]),
      status: txt(r["status"]),
    };
    acum(cur.s, r);
    m.set(k, cur);
  }
  const campanhas: CampanhaDsp[] = [...m.entries()]
    .map(([id, x]) => ({
      id,
      campanha: x.nome || id,
      tipo: x.tipo,
      goal: x.goal,
      status: x.status,
      etapa: etapaDaCampanha(x.nome, x.tipo, x.goal),
      ...kpis(x.s),
      frequencia: div(x.s.impressoes, x.s.alcance),
    }))
    .sort((a, b) => b.investimento - a.investimento);
  const tot = campanhas.reduce((s, c) => s + c.investimento, 0);
  const mix = (["conversao", "consideracao", "reconhecimento", "outros"] as Etapa[]).map((e) => {
    const cs = campanhas.filter((c) => c.etapa === e);
    const inv = cs.reduce((s, c) => s + c.investimento, 0);
    const rec = cs.reduce((s, c) => s + c.receita, 0);
    const real = tot ? (inv / tot) * 100 : null;
    const alvo = e === "outros" ? null : MIX_ALVO[e];
    return {
      etapa: e,
      campanhas: cs.length,
      investimento: inv,
      receita: rec,
      roas: div(rec, inv),
      realPct: real,
      alvoPct: alvo,
      desvioPp: real != null && alvo != null ? real - alvo : null,
    };
  });
  return { campanhas, mix };
}

export type CriativoDsp = ReturnType<typeof kpis> & {
  id: string;
  criativo: string;
  campanha: string;
  lineItem: string;
  q25Pct: number | null;
  q50Pct: number | null;
  q75Pct: number | null;
  completoPct: number | null;
  video: boolean;
};

export function criativosMeliDsp(criDia: Row[], de: string, ate: string): CriativoDsp[] {
  const m = new Map<
    string,
    { s: Soma; q: [number, number, number, number]; nome: string; camp: string; li: string }
  >();
  for (const r of noPeriodo(criDia, de, ate)) {
    const k = txt(r["creative_id"]);
    if (!k) continue;
    const cur = m.get(k) ?? {
      s: soma(),
      q: [0, 0, 0, 0],
      nome: txt(r["creative_name"]),
      camp: txt(r["campaign_name"]),
      li: txt(r["line_item_name"]),
    };
    acum(cur.s, r);
    cur.q[0] += n(r["q25"]);
    cur.q[1] += n(r["q50"]);
    cur.q[2] += n(r["q75"]);
    cur.q[3] += n(r["q100"]);
    m.set(k, cur);
  }
  return [...m.entries()]
    .map(([id, x]) => {
      // Retenção do vídeo sobre quem chegou a 25%: mostra onde o vídeo perde gente.
      const base = x.q[0];
      return {
        id,
        criativo: x.nome || id,
        campanha: x.camp,
        lineItem: x.li,
        ...kpis(x.s),
        video: base > 0,
        q25Pct: pct(x.q[0], x.s.impressoes),
        q50Pct: pct(x.q[1], base),
        q75Pct: pct(x.q[2], base),
        completoPct: pct(x.q[3], base),
      };
    })
    .sort((a, b) => b.investimento - a.investimento);
}

export type AlertaCanal = {
  tipo: "problema" | "oportunidade";
  tag: string;
  tom: "danger" | "warn" | "success" | "primary";
  texto: string;
};

export function alertasMeliDsp(i: {
  resumo: ReturnType<typeof resumoMeliDsp>;
  mix: ReturnType<typeof campanhasMeliDsp>["mix"];
}): AlertaCanal[] {
  const out: AlertaCanal[] = [];
  const x1 = (v: number) => v.toFixed(1).replace(".", ",");
  const a = i.resumo.anomalia;
  if (a?.sinais.includes("ROAS caiu"))
    out.push({
      tipo: "problema",
      tag: "Meli DSP",
      tom: "warn",
      texto: `ROAS do último dia em ${x1(a.roas ?? 0)}×, abaixo do normal de ${x1(a.roasBase ?? 0)}×.`,
    });
  if (a?.sinais.includes("gasto parou"))
    out.push({
      tipo: "problema",
      tag: "Meli DSP",
      tom: "warn",
      texto:
        "Gasto do último dia caiu para menos da metade do normal. Conferir saldo e status das campanhas.",
    });
  const fora = i.mix.filter((m) => m.desvioPp != null && Math.abs(m.desvioPp) > 10);
  if (fora.length)
    out.push({
      tipo: "problema",
      tag: "Meli DSP mix",
      tom: "warn",
      texto: `Verba fora da divisão 70/22/8: ${fora.map((f) => `${ETAPA_LABEL[f.etapa]} em ${Math.round(f.realPct ?? 0)}%`).join(", ")}.`,
    });
  if (i.resumo.frequencia != null && i.resumo.frequencia > 8)
    out.push({
      tipo: "problema",
      tag: "Meli DSP",
      tom: "warn",
      texto: `Frequência média de ${x1(i.resumo.frequencia)} impressões por pessoa. Ampliar público ou renovar criativos.`,
    });
  return out;
}
