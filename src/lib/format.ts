const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const brl2 = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});
const num = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

export const fmtBRL = (v: unknown) => (v == null || isNaN(Number(v)) ? "—" : brl.format(Number(v)));
export const fmtBRL2 = (v: unknown) =>
  v == null || isNaN(Number(v)) ? "—" : brl2.format(Number(v));
export const fmtNum = (v: unknown) => (v == null || isNaN(Number(v)) ? "—" : num.format(Number(v)));
export const fmtCompact = (v: unknown) =>
  v == null || isNaN(Number(v)) ? "—" : compact.format(Number(v));
export const fmtPct = (v: unknown, d = 1) =>
  v == null || isNaN(Number(v)) ? "—" : `${Number(v).toFixed(d).replace(".", ",")}%`;
export const fmtX = (v: unknown) =>
  v == null || !isFinite(Number(v)) ? "—" : `${Number(v).toFixed(2).replace(".", ",")}x`;
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

export function isoDaysAgo(days: number, hoje = new Date()) {
  const d = new Date(hoje);
  d.setDate(d.getDate() - days);
  return dataLocal(d);
}

/** Filtro de período. "Personalizado" vira "c:AAAA-MM-DD:AAAA-MM-DD" no valor. */
export const PERIODOS = [
  { id: "hoje", label: "Hoje" },
  { id: "ontem", label: "Ontem" },
  { id: "7", label: "7 dias" },
  { id: "14", label: "14 dias" },
  { id: "21", label: "21 dias" },
  { id: "28", label: "28 dias" },
  { id: "60", label: "60 dias" },
  { id: "90", label: "90 dias" },
] as const;
export const PERIODO_PADRAO = "28";
export const PERIODO_MAX_DIAS = 366;

const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;
export const ehPersonalizado = (v: string) => v.startsWith("c:");
export const personalizado = (de: string, ate: string) => `c:${de}:${ate}`;

/**
 * Período do filtro → { de, ate } (datas inclusivas).
 * - "hoje" / "ontem": um dia só; "N": os últimos N dias contando hoje; "c:de:ate": intervalo escolhido.
 * Valor inválido cai no padrão (28 dias).
 */
export function periodo(valor: string, hoje = new Date()): { de: string; ate: string } {
  if (valor === "hoje") {
    const d = isoDaysAgo(0, hoje);
    return { de: d, ate: d };
  }
  if (valor === "ontem") {
    const d = isoDaysAgo(1, hoje);
    return { de: d, ate: d };
  }
  if (ehPersonalizado(valor)) {
    const [, de = "", ate = ""] = valor.split(":");
    if (RE_DATA.test(de) && RE_DATA.test(ate))
      return de <= ate ? { de, ate } : { de: ate, ate: de };
  }
  const n = Number(valor);
  const dias =
    Number.isFinite(n) && n >= 1
      ? Math.min(Math.floor(n), PERIODO_MAX_DIAS)
      : Number(PERIODO_PADRAO);
  return { de: isoDaysAgo(dias - 1, hoje), ate: isoDaysAgo(0, hoje) };
}

/** Rótulo curto do período escolhido (para o botão "Personalizado"). */
export function rotuloPeriodo(valor: string) {
  if (!ehPersonalizado(valor)) return PERIODOS.find((p) => p.id === valor)?.label ?? "";
  const { de, ate } = periodo(valor);
  const c = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
  return de === ate ? c(de) : `${c(de)} – ${c(ate)}`;
}
