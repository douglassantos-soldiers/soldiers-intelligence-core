// Mídia × estoque × margem por SKU e ritmo/anomalia de todos os canais (Plano Mestre caps. 7.6 e 14).
// Objetos que JÁ existem: mv_produto_dia (venda e Ads por SKU e canal), dim_custo_sku (custo com vigência),
// mv_pl_canal_dia (taxas do canal), dim_shopify_produto (estoque do site), dim_amazon_reposicao (FBA)
// e vw_ads_funil_canal_dia (gasto e receita de Ads por canal).
//
// A contribuição por SKU é ESTIMADA: receita − CMV na data − taxa média do canal no período − Ads.
// Frete e imposto do canal entram pela taxa média (custo_canal ÷ receita_bruta do mv_pl_canal_dia).

import { custoHistorico, custoNaData } from "@/lib/aggregate";
import { anomaliaDoDia, serieDiaria, variacao, type Anomalia } from "@/lib/ritmo";

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const nn = (v: unknown) =>
  v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
const txt = (v: unknown) => String(v ?? "").trim();
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const div = (a: number, b: number) => (b ? a / b : null);
const pct = (a: number, b: number) => (b ? (a / b) * 100 : null);

export const LIMITES_SKU = {
  coberturaCurta: 14,
  coberturaFolgada: 45,
  margemBoaPct: 25,
  tacosBaixoPct: 5,
} as const;

/** Taxa média do canal no período (custo do canal ÷ receita bruta), em fração. */
export function taxaPorCanal(pl: Row[], de: string, ate: string) {
  const m = new Map<string, { rec: number; custo: number; imposto: number }>();
  for (const r of pl) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    const k = txt(r["canal"]);
    const cur = m.get(k) ?? { rec: 0, custo: 0, imposto: 0 };
    cur.rec += n(r["receita_bruta"]);
    cur.custo += n(r["custo_canal"]);
    cur.imposto += n(r["imposto"]);
    m.set(k, cur);
  }
  return new Map([...m.entries()].map(([k, x]) => [k, x.rec ? (x.custo + x.imposto) / x.rec : 0]));
}

export type SkuMidia = {
  sku: string;
  produto: string;
  receita: number;
  unidades: number;
  ads: number;
  receitaAds: number;
  tacosPct: number | null;
  cmv: number | null;
  taxas: number;
  contribuicao: number | null;
  margemPct: number | null;
  semCusto: boolean;
  adsPorCanal: { canal: string; ads: number }[];
  coberturaSite: number | null;
  coberturaFba: number | null;
  sinais: ("estoque curto com mídia" | "mídia com prejuízo" | "espaço para mídia")[];
};

const ehSite = (c: string) => /site|shopify/i.test(c);
const ehAmazon = (c: string) => /amazon/i.test(c);

export function midiaPorSku(
  i: { produtos: Row[]; custos: Row[]; pl: Row[]; estoqueSite: Row[]; fba: Row[] },
  de: string,
  ate: string,
): SkuMidia[] {
  const hist = custoHistorico(i.custos);
  const taxa = taxaPorCanal(i.pl, de, ate);
  const site = new Map(i.estoqueSite.map((e) => [txt(e["sku"]), nn(e["cobertura_dias"])]));
  const fba = new Map<string, number | null>();
  for (const e of i.fba) {
    const k = txt(e["sku"]);
    if (k && e["em_fba"] !== false) fba.set(k, nn(e["cobertura_dias"]));
  }
  const m = new Map<
    string,
    {
      produto: string;
      receita: number;
      unidades: number;
      ads: number;
      recAds: number;
      cmv: number;
      semCusto: boolean;
      taxas: number;
      porCanal: Map<string, number>;
    }
  >();
  for (const r of i.produtos) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    const sku = txt(r["sku"]);
    if (!sku) continue;
    const canal = txt(r["canal"]);
    const cur = m.get(sku) ?? {
      produto: txt(r["produto"]),
      receita: 0,
      unidades: 0,
      ads: 0,
      recAds: 0,
      cmv: 0,
      semCusto: false,
      taxas: 0,
      porCanal: new Map(),
    };
    const rec = n(r["receita"]);
    const un = n(r["unidades"]);
    cur.receita += rec;
    cur.unidades += un;
    cur.ads += n(r["invest_ads"]);
    cur.recAds += n(r["receita_ads"]);
    cur.taxas += rec * (taxa.get(canal) ?? 0);
    const c = custoNaData(hist, sku, d);
    if (c) cur.cmv += c.custo * un;
    else if (un > 0) cur.semCusto = true;
    if (n(r["invest_ads"]))
      cur.porCanal.set(canal, (cur.porCanal.get(canal) ?? 0) + n(r["invest_ads"]));
    if (!cur.produto) cur.produto = txt(r["produto"]);
    m.set(sku, cur);
  }
  return [...m.entries()]
    .map(([sku, x]) => {
      const cmv = x.semCusto ? null : x.cmv;
      const contribuicao = cmv == null ? null : x.receita - cmv - x.taxas - x.ads;
      const margemPct = contribuicao == null ? null : pct(contribuicao, x.receita);
      const tacosPct = pct(x.ads, x.receita);
      const adsPorCanal = [...x.porCanal.entries()]
        .map(([canal, ads]) => ({ canal, ads }))
        .sort((a, b) => b.ads - a.ads);
      const coberturaSite = site.get(sku) ?? null;
      const coberturaFba = fba.get(sku) ?? null;
      const sinais: SkuMidia["sinais"] = [];
      const adsSite = adsPorCanal.filter((a) => ehSite(a.canal)).reduce((s, a) => s + a.ads, 0);
      const adsAmz = adsPorCanal.filter((a) => ehAmazon(a.canal)).reduce((s, a) => s + a.ads, 0);
      if (
        (adsSite > 0 && coberturaSite != null && coberturaSite < LIMITES_SKU.coberturaCurta) ||
        (adsAmz > 0 && coberturaFba != null && coberturaFba < LIMITES_SKU.coberturaCurta)
      )
        sinais.push("estoque curto com mídia");
      if (x.ads > 0 && contribuicao != null && contribuicao < 0) sinais.push("mídia com prejuízo");
      const folgado =
        (coberturaSite ?? 0) >= LIMITES_SKU.coberturaFolgada ||
        (coberturaFba ?? 0) >= LIMITES_SKU.coberturaFolgada;
      if (
        margemPct != null &&
        margemPct >= LIMITES_SKU.margemBoaPct &&
        (tacosPct ?? 0) < LIMITES_SKU.tacosBaixoPct &&
        folgado
      )
        sinais.push("espaço para mídia");
      return {
        sku,
        produto: x.produto || sku,
        receita: x.receita,
        unidades: x.unidades,
        ads: x.ads,
        receitaAds: x.recAds,
        tacosPct,
        cmv,
        taxas: x.taxas,
        contribuicao,
        margemPct,
        semCusto: x.semCusto,
        adsPorCanal,
        coberturaSite,
        coberturaFba,
        sinais,
      };
    })
    .filter((s) => s.receita > 0 || s.ads > 0)
    .sort((a, b) => b.ads - a.ads || b.receita - a.receita);
}

export type RitmoCanal = {
  canal: string;
  gasto: number;
  receita: number;
  roas: number | null;
  sharePct: number | null;
  gasto7: number;
  variacao7Pct: number | null;
  anomalia: Anomalia | null;
};

/** Ritmo por canal: gasto do período, últimos 7 dias × 7 anteriores e anomalia do último dia. */
export function ritmoCanais(funil: Row[], de: string, ate: string): RitmoCanal[] {
  const fim = Date.parse(ate + "T00:00:00Z");
  const d7 = new Date(fim - 6 * 86400000).toISOString().slice(0, 10);
  const d14 = new Date(fim - 13 * 86400000).toISOString().slice(0, 10);
  const por = new Map<string, Row[]>();
  for (const r of funil) {
    const k = txt(r["canal"]) || "(sem canal)";
    por.set(k, [...(por.get(k) ?? []), r]);
  }
  const lista = [...por.entries()].map(([canal, rows]) => {
    const serie = serieDiaria(rows, "invest", "receita_ads");
    const per = serie.filter((s) => s.data >= de && s.data <= ate);
    const gasto = per.reduce((s, x) => s + x.gasto, 0);
    const receita = per.reduce((s, x) => s + x.receita, 0);
    const g7 = serie.filter((s) => s.data >= d7 && s.data <= ate).reduce((s, x) => s + x.gasto, 0);
    const a7 = serie.filter((s) => s.data >= d14 && s.data < d7).reduce((s, x) => s + x.gasto, 0);
    return {
      canal,
      gasto,
      receita,
      roas: div(receita, gasto),
      sharePct: null as number | null,
      gasto7: g7,
      variacao7Pct: variacao(g7, a7),
      anomalia: anomaliaDoDia(serie.filter((s) => s.data <= ate)),
    };
  });
  const tot = lista.reduce((s, c) => s + c.gasto, 0);
  return lista
    .map((c) => ({ ...c, sharePct: pct(c.gasto, tot) }))
    .filter((c) => c.gasto > 0)
    .sort((a, b) => b.gasto - a.gasto);
}

export type AlertaCanal = {
  tipo: "problema" | "oportunidade";
  tag: string;
  tom: "danger" | "warn" | "success" | "primary";
  texto: string;
};

export function alertasMidiaSku(i: { skus: SkuMidia[]; ritmo: RitmoCanal[] }): AlertaCanal[] {
  const out: AlertaCanal[] = [];
  const brl = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
  const curto = i.skus.filter((s) => s.sinais.includes("estoque curto com mídia"));
  if (curto.length)
    out.push({
      tipo: "problema",
      tag: "Mídia × estoque",
      tom: "danger",
      texto: `${curto.length} SKU(s) com mídia ativa e estoque para menos de ${LIMITES_SKU.coberturaCurta} dias, como ${curto[0]!.produto} (${brl(curto[0]!.ads)} em Ads).`,
    });
  const prej = i.skus.filter((s) => s.sinais.includes("mídia com prejuízo"));
  if (prej.length)
    out.push({
      tipo: "problema",
      tag: "Mídia × margem",
      tom: "warn",
      texto: `${prej.length} SKU(s) com contribuição negativa depois da mídia, somando ${brl(prej.reduce((s, x) => s + x.ads, 0))} em Ads.`,
    });
  for (const c of i.ritmo) {
    const a = c.anomalia;
    if (!a?.sinais.length) continue;
    out.push({
      tipo: "problema",
      tag: `Ritmo ${c.canal}`,
      tom: "warn",
      texto: `${c.canal}: ${a.sinais.join(" e ")} no último dia com dado (${a.data.slice(8, 10)}/${a.data.slice(5, 7)}).`,
    });
  }
  const espaco = i.skus
    .filter((s) => s.sinais.includes("espaço para mídia"))
    .sort((a, b) => b.receita - a.receita);
  if (espaco.length)
    out.push({
      tipo: "oportunidade",
      tag: "Mídia × margem",
      tom: "success",
      texto: `${espaco[0]!.produto} tem margem de ${Math.round(espaco[0]!.margemPct ?? 0)}%, estoque folgado e quase nada de mídia. Candidato a mais verba.`,
    });
  return out;
}
