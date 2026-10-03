type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;

export function sumBy(rows: Row[], key: string, fields: string[]) {
  const map = new Map<string, Row>();
  for (const r of rows) {
    const k = String(r[key] ?? "—");
    const o = map.get(k) ?? { [key]: k };
    for (const f of fields) o[f] = n(o[f]) + n(r[f]);
    map.set(k, o);
  }
  return [...map.values()];
}

export function total(rows: Row[], fields: string[]) {
  const o: Record<string, number> = {};
  for (const f of fields) o[f] = rows.reduce((s, r) => s + n(r[f]), 0);
  return o;
}

export const RECEITA_FIELDS = ["faturamento", "pedidos", "invest_ads", "receita_ads", "invest_afiliados", "invest_aquisicao"];
export const PL_FIELDS = ["receita_bruta", "custo_canal", "ads", "imposto", "cmv", "margem_contribuicao"];

export function channelSummary(receita: Row[], pl: Row[]) {
  const r = sumBy(receita, "canal", RECEITA_FIELDS);
  const p = new Map(sumBy(pl, "canal", PL_FIELDS).map((x) => [x.canal as string, x]));
  return r
    .map((x) => ({ ...x, ...(p.get(x.canal as string) ?? {}) }) as Record<string, number | string>)
    .sort((a, b) => n(b.faturamento) - n(a.faturamento));
}

export const ratio = (a: unknown, b: unknown) => (n(b) ? n(a) / n(b) : null);
export const pct = (a: unknown, b: unknown) => (n(b) ? (n(a) / n(b)) * 100 : null);

// Custo vigente por SKU (última vigência)
export function custoMap(custos: Row[]) {
  const m = new Map<string, { custo: number; vig: string }>();
  for (const c of custos) {
    const sku = String(c.sku);
    const vig = String(c.vigencia_inicio ?? "");
    const cur = m.get(sku);
    if (!cur || vig > cur.vig) m.set(sku, { custo: n(c.custo_unitario), vig });
  }
  return m;
}
