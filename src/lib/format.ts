const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const brl2 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
const num = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

export const fmtBRL = (v: unknown) => (v == null || isNaN(Number(v)) ? "—" : brl.format(Number(v)));
export const fmtBRL2 = (v: unknown) => (v == null || isNaN(Number(v)) ? "—" : brl2.format(Number(v)));
export const fmtNum = (v: unknown) => (v == null || isNaN(Number(v)) ? "—" : num.format(Number(v)));
export const fmtCompact = (v: unknown) => (v == null || isNaN(Number(v)) ? "—" : compact.format(Number(v)));
export const fmtPct = (v: unknown, d = 1) =>
  v == null || isNaN(Number(v)) ? "—" : `${Number(v).toFixed(d).replace(".", ",")}%`;
export const fmtX = (v: unknown) => (v == null || !isFinite(Number(v)) ? "—" : `${Number(v).toFixed(2).replace(".", ",")}x`);
export const fmtDate = (v: unknown) => {
  if (!v) return "—";
  const s = String(v).slice(0, 10);
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};

/** Data local (fuso do navegador) em AAAA-MM-DD. Evita virar o dia às 21h no Brasil, como faria o UTC. */
export function dataLocal(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export const PERIODOS = [
  { id: "7", label: "7 dias" },
  { id: "30", label: "30 dias" },
  { id: "90", label: "90 dias" },
  { id: "180", label: "180 dias" },
] as const;

export function periodo(dias: string) {
  return { de: isoDaysAgo(Number(dias) - 1), ate: isoDaysAgo(0) };
}
