// Ritmo e anomalia diária, iguais para todos os canais de mídia (Plano Mestre cap. 7.6).
// Compara o último dia com dado à mediana dos 14 dias anteriores. Só leitura; não mexe em verba.

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const dia = (v: unknown) => String(v ?? "").slice(0, 10);

export const LIMITES_RITMO = {
  gastoAlto: 1.5,
  gastoBaixo: 0.5,
  roasBaixo: 0.6,
  diasBase: 14,
  minDiasBase: 5,
} as const;

const mediana = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

export type SerieDia = { data: string; gasto: number; receita: number };

/** Agrega linhas diárias (qualquer view com data + gasto + receita) numa série por dia. */
export function serieDiaria(rows: Row[], gasto: string, receita: string): SerieDia[] {
  const m = new Map<string, SerieDia>();
  for (const r of rows) {
    const d = dia(r["data"]);
    if (!d) continue;
    const cur = m.get(d) ?? { data: d, gasto: 0, receita: 0 };
    cur.gasto += n(r[gasto]);
    cur.receita += n(r[receita]);
    m.set(d, cur);
  }
  return [...m.values()].sort((a, b) => a.data.localeCompare(b.data));
}

export type Anomalia = {
  data: string;
  gasto: number;
  gastoBase: number | null;
  roas: number | null;
  roasBase: number | null;
  sinais: ("gasto alto" | "gasto parou" | "ROAS caiu")[];
};

/** Último dia com gasto comparado à mediana dos 14 dias anteriores. null quando falta base. */
export function anomaliaDoDia(serie: SerieDia[]): Anomalia | null {
  const s = serie.filter((x) => x.gasto > 0 || x.receita > 0);
  if (s.length < LIMITES_RITMO.minDiasBase + 1) return null;
  const ult = s.at(-1)!;
  const base = s.slice(-1 - LIMITES_RITMO.diasBase, -1);
  const gastoBase = mediana(base.map((x) => x.gasto));
  const roasBase = mediana(base.filter((x) => x.gasto > 0).map((x) => x.receita / x.gasto));
  const roas = ult.gasto > 0 ? ult.receita / ult.gasto : null;
  const sinais: Anomalia["sinais"] = [];
  if (gastoBase && ult.gasto > gastoBase * LIMITES_RITMO.gastoAlto) sinais.push("gasto alto");
  if (gastoBase && ult.gasto < gastoBase * LIMITES_RITMO.gastoBaixo) sinais.push("gasto parou");
  if (roas != null && roasBase && roas < roasBase * LIMITES_RITMO.roasBaixo)
    sinais.push("ROAS caiu");
  return { data: ult.data, gasto: ult.gasto, gastoBase, roas, roasBase, sinais };
}

/** Compara a soma de um período com o período anterior de mesmo tamanho (variação em %). */
export function variacao(atual: number, anterior: number) {
  return anterior ? ((atual - anterior) / Math.abs(anterior)) * 100 : null;
}

// Tom de etiqueta para o sinal "escalar / cortar / observar / manter".
export const TOM_LEITURA: Record<string, "success" | "danger" | "muted" | "primary"> = {
  escalar: "success",
  cortar: "danger",
  observar: "muted",
  manter: "primary",
};
