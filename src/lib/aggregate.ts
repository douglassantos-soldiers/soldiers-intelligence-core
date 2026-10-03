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
// det_taxa + det_frete + det_afiliado detalham custo_canal (vw/mv_pl_canal_dia).
export const PL_FIELDS = ["receita_bruta", "custo_canal", "det_taxa", "det_frete", "det_afiliado", "ads", "imposto", "cmv", "margem_contribuicao"];

export function channelSummary(receita: Row[], pl: Row[]) {
  const r = sumBy(receita, "canal", RECEITA_FIELDS);
  const p = new Map(sumBy(pl, "canal", PL_FIELDS).map((x) => [x.canal as string, x]));
  return r
    .map((x) => ({ ...x, ...(p.get(x.canal as string) ?? {}) }) as Record<string, number | string>)
    .sort((a, b) => n(b.faturamento) - n(a.faturamento));
}

export const ratio = (a: unknown, b: unknown) => (n(b) ? n(a) / n(b) : null);
export const pct = (a: unknown, b: unknown) => (n(b) ? (n(a) / n(b)) * 100 : null);

/* ---------------- Custo por vigência (Plano Mestre, princípio 14) ----------------
 * dim_custo_sku guarda o custo com `vigencia_inicio`. A margem de um pedido deve usar
 * o custo vigente NA DATA DO PEDIDO, não o último cadastrado. Senão, a margem histórica
 * muda toda vez que o custo é atualizado. */
export type CustoVigencia = { vig: string; custo: number };
export type CustoHistorico = Map<string, CustoVigencia[]>;

/** Agrupa as vigências por SKU, em ordem crescente de data. */
export function custoHistorico(custos: Row[]): CustoHistorico {
  const h: CustoHistorico = new Map();
  for (const c of custos) {
    const sku = String(c["sku"] ?? "");
    if (!sku) continue;
    const list = h.get(sku) ?? [];
    list.push({ vig: String(c["vigencia_inicio"] ?? "").slice(0, 10), custo: n(c["custo_unitario"]) });
    h.set(sku, list);
  }
  for (const list of h.values()) list.sort((a, b) => (a.vig < b.vig ? -1 : a.vig > b.vig ? 1 : 0));
  return h;
}

/**
 * Custo do SKU vigente em `data` (YYYY-MM-DD…): a maior vigência com início <= data.
 * Sem data, devolve a vigência mais recente. Se o pedido é anterior à primeira vigência,
 * usa a primeira e marca `estimado = true` (não há custo cadastrado para aquela época).
 */
export function custoNaData(h: CustoHistorico, sku: string, data?: unknown): (CustoVigencia & { estimado: boolean }) | undefined {
  const list = h.get(sku);
  if (!list?.length) return undefined;
  const d = data ? String(data).slice(0, 10) : "";
  if (!d) return { ...list[list.length - 1]!, estimado: false };
  let found: CustoVigencia | undefined;
  for (const v of list) {
    if (v.vig <= d) found = v;
    else break;
  }
  return found ? { ...found, estimado: false } : { ...list[0]!, estimado: true };
}

// Custo vigente por SKU (última vigência). Use só para exibir o "custo atual";
// para margem de pedido/período use custoHistorico + custoNaData.
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

/** Monta a matriz de cohort (últimas 12 safras, até M12) a partir de mv_growth_cohort_mes. */
export function buildCohort(rows: Row[]) {
  const offsets = Array.from({ length: 13 }, (_, i) => i);
  const bySafra = new Map<
    string,
    { safra: string; tamanho: number; pct: Record<number, number> }
  >();
  for (const r of rows) {
    const safra = String(r["safra"]).slice(0, 7);
    const off = Number(r["mes_offset"]);
    if (!Number.isFinite(off) || off > 12) continue;
    const cur = bySafra.get(safra) ?? { safra, tamanho: Number(r["clientes_safra"]) || 0, pct: {} };
    const p = pct(r["clientes"], cur.tamanho);
    if (p != null) cur.pct[off] = p;
    bySafra.set(safra, cur);
  }
  const safras = [...bySafra.values()].sort((a, b) => b.safra.localeCompare(a.safra)).slice(0, 12);
  return { safras, offsets };
}
