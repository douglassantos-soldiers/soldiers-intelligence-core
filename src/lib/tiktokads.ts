// TikTok Ads (Plano Mestre cap. 7 e cap. 10: TikTok Ads não é TikTok Shop). Views que JÁ existem:
// vw_tiktok_ads_por_tipo_dia, vw_tiktok_ads_campanha_dia, vw_tiktok_ads_gmv_campanha_dia,
// vw_tiktok_ads_produto_dia, vw_tiktok_ads_criativo_dia e dim_tiktok_estoque.
// Receita aqui é a informada pelo TikTok (atribuída). Nunca somar com a receita realizada (cap. 13.2).

import { anomaliaDoDia, serieDiaria } from "@/lib/ritmo";

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const nn = (v: unknown) =>
  v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
const txt = (v: unknown) => String(v ?? "").trim();
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const div = (a: number, b: number) => (b ? a / b : null);
const noPeriodo = (rows: Row[], de: string, ate: string) =>
  rows.filter((r) => dia(r["data"]) >= de && dia(r["data"]) <= ate);

type Soma = { invest: number; receita: number; pedidos: number };
const soma = (): Soma => ({ invest: 0, receita: 0, pedidos: 0 });
const acum = (s: Soma, r: Row) => {
  s.invest += n(r["invest"]);
  s.receita += n(r["receita"]);
  s.pedidos += n(r["pedidos"]);
};
const kpis = (s: Soma) => ({ ...s, roas: div(s.receita, s.invest), cpa: div(s.invest, s.pedidos) });

export function resumoTikTokAds(porTipo: Row[], de: string, ate: string) {
  const r0 = noPeriodo(porTipo, de, ate);
  const tot = soma();
  const tipos = new Map<string, Soma>();
  for (const r of r0) {
    acum(tot, r);
    const k = txt(r["tipo"]) || "(sem tipo)";
    const cur = tipos.get(k) ?? soma();
    acum(cur, r);
    tipos.set(k, cur);
  }
  const serie = serieDiaria(r0, "invest", "receita");
  return {
    ...kpis(tot),
    porTipo: [...tipos.entries()]
      .map(([tipo, s]) => ({
        tipo,
        ...kpis(s),
        sharePct: tot.invest ? (s.invest / tot.invest) * 100 : null,
      }))
      .sort((a, b) => b.invest - a.invest),
    dias: serie.map((d) => ({ ...d, roas: div(d.receita, d.gasto) })),
    anomalia: anomaliaDoDia(serie),
  };
}

export type CampanhaTT = ReturnType<typeof kpis> & {
  id: string;
  campanha: string;
  tipo: string;
  investLiquido: number | null;
  roi: number | null;
  roas7: number | null;
  roasAnt7: number | null;
  sugestao: string;
};

export function campanhasTikTok(
  campDia: Row[],
  gmvDia: Row[],
  de: string,
  ate: string,
): CampanhaTT[] {
  const fim = Date.parse(ate + "T00:00:00Z");
  const d7 = new Date(fim - 6 * 86400000).toISOString().slice(0, 10);
  const d14 = new Date(fim - 13 * 86400000).toISOString().slice(0, 10);
  const m = new Map<
    string,
    {
      s: Soma;
      s7: Soma;
      a7: Soma;
      campanha: string;
      tipo: string;
      sug: { d: string; t: string };
      liq: number;
      temLiq: boolean;
    }
  >();
  const linha = (r: Row, gmv: boolean) => {
    const id = txt(r["campaign_id"]);
    if (!id) return;
    const d = dia(r["data"]);
    const cur = m.get(id) ?? {
      s: soma(),
      s7: soma(),
      a7: soma(),
      campanha: txt(r["campanha"]),
      tipo: txt(r["tipo"]),
      sug: { d: "", t: "" },
      liq: 0,
      temLiq: false,
    };
    if (d >= de && d <= ate) {
      acum(cur.s, r);
      if (gmv && nn(r["invest_liquido"]) != null) {
        cur.liq += n(r["invest_liquido"]);
        cur.temLiq = true;
      }
      if (txt(r["sugestao"]) && d >= cur.sug.d) cur.sug = { d, t: txt(r["sugestao"]) };
    }
    if (d >= d7 && d <= ate) acum(cur.s7, r);
    else if (d >= d14 && d < d7) acum(cur.a7, r);
    if (!cur.campanha) cur.campanha = txt(r["campanha"]);
    if (!cur.tipo) cur.tipo = txt(r["tipo"]);
    m.set(id, cur);
  };
  // Campanhas GMV Max vêm na view própria; as demais na view geral. Um id só entra uma vez.
  const idsGmv = new Set(gmvDia.map((r) => txt(r["campaign_id"])));
  for (const r of gmvDia) linha(r, true);
  for (const r of campDia) if (!idsGmv.has(txt(r["campaign_id"]))) linha(r, false);
  return [...m.entries()]
    .map(([id, x]) => ({
      id,
      campanha: x.campanha || id,
      tipo: x.tipo || (idsGmv.has(id) ? "GMV Max" : ""),
      ...kpis(x.s),
      investLiquido: x.temLiq ? x.liq : null,
      roi: x.temLiq && x.liq ? x.s.receita / x.liq : null,
      roas7: div(x.s7.receita, x.s7.invest),
      roasAnt7: div(x.a7.receita, x.a7.invest),
      sugestao: x.sug.t,
    }))
    .filter((c) => c.invest > 0 || c.receita > 0)
    .sort((a, b) => b.invest - a.invest);
}

export type ProdutoTT = ReturnType<typeof kpis> & {
  sku: string;
  produto: string;
  shareInvestPct: number | null;
  estoque: number | null;
  coberturaDias: number | null;
};

export function produtosTikTokAds(
  prodDia: Row[],
  estoque: Row[],
  de: string,
  ate: string,
): ProdutoTT[] {
  const r0 = noPeriodo(prodDia, de, ate);
  const dias = Math.max(1, Math.round((Date.parse(ate) - Date.parse(de)) / 86400000) + 1);
  const est = new Map<string, number>();
  for (const e of estoque) {
    const k = txt(e["seller_sku"]);
    if (k) est.set(k, (est.get(k) ?? 0) + n(e["quantidade"]));
  }
  const m = new Map<string, { s: Soma; produto: string }>();
  for (const r of r0) {
    const k = txt(r["seller_sku"]) || txt(r["product_id"]);
    if (!k) continue;
    const cur = m.get(k) ?? { s: soma(), produto: txt(r["produto"]) };
    acum(cur.s, r);
    m.set(k, cur);
  }
  const totInv = [...m.values()].reduce((s, x) => s + x.s.invest, 0);
  return [...m.entries()]
    .map(([sku, x]) => {
      const q = est.has(sku) ? est.get(sku)! : null;
      // Cobertura aproximada: estoque TikTok ÷ pedidos/dia vindos de Ads no período (limite inferior da venda).
      const porDia = x.s.pedidos / dias;
      return {
        sku,
        produto: x.produto || sku,
        ...kpis(x.s),
        shareInvestPct: totInv ? (x.s.invest / totInv) * 100 : null,
        estoque: q,
        coberturaDias: q != null && porDia > 0 ? q / porDia : null,
      };
    })
    .sort((a, b) => b.invest - a.invest);
}

export type CriativoTT = ReturnType<typeof kpis> & {
  item: string;
  produto: string;
  campanha: string;
  leitura: "escalar" | "cortar" | "observar" | "manter";
};

export function criativosTikTok(criDia: Row[], de: string, ate: string) {
  const r0 = noPeriodo(criDia, de, ate).filter((r) => r["agregado"] !== true && txt(r["item_id"]));
  const m = new Map<string, { s: Soma; produto: string; campanha: string }>();
  for (const r of r0) {
    const k = txt(r["item_id"]);
    const cur = m.get(k) ?? { s: soma(), produto: txt(r["produto"]), campanha: txt(r["campanha"]) };
    acum(cur.s, r);
    m.set(k, cur);
  }
  const tot = soma();
  for (const x of m.values()) {
    tot.invest += x.s.invest;
    tot.receita += x.s.receita;
    tot.pedidos += x.s.pedidos;
  }
  const roasMedio = div(tot.receita, tot.invest);
  const cpaMedio = div(tot.invest, tot.pedidos);
  const itens: CriativoTT[] = [...m.entries()].map(([item, x]) => {
    const k = kpis(x.s);
    let leitura: CriativoTT["leitura"] = "manter";
    if (cpaMedio && x.s.pedidos === 0 && x.s.invest >= 2 * cpaMedio) leitura = "cortar";
    else if (roasMedio && k.roas != null && k.roas >= 1.3 * roasMedio && x.s.pedidos >= 3)
      leitura = "escalar";
    else if (cpaMedio && x.s.invest < cpaMedio) leitura = "observar";
    return { item, produto: x.produto, campanha: x.campanha, ...k, leitura };
  });
  itens.sort((a, b) => b.invest - a.invest);
  return {
    itens,
    roasMedio,
    cpaMedio,
    escalar: itens.filter((i) => i.leitura === "escalar"),
    cortar: itens.filter((i) => i.leitura === "cortar"),
  };
}

export type AlertaCanal = {
  tipo: "problema" | "oportunidade";
  tag: string;
  tom: "danger" | "warn" | "success" | "primary";
  texto: string;
};
const brl = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
const x1 = (v: number) => v.toFixed(1).replace(".", ",");

export function alertasTikTokAds(i: {
  resumo: ReturnType<typeof resumoTikTokAds>;
  criativos: ReturnType<typeof criativosTikTok>;
  produtos: ProdutoTT[];
}): AlertaCanal[] {
  const out: AlertaCanal[] = [];
  const a = i.resumo.anomalia;
  if (a?.sinais.includes("ROAS caiu"))
    out.push({
      tipo: "problema",
      tag: "TikTok Ads",
      tom: "warn",
      texto: `ROAS de ${a.data.slice(8, 10)}/${a.data.slice(5, 7)} em ${x1(a.roas ?? 0)}×, abaixo do normal de ${x1(a.roasBase ?? 0)}×.`,
    });
  if (a?.sinais.includes("gasto alto"))
    out.push({
      tipo: "problema",
      tag: "TikTok Ads",
      tom: "warn",
      texto: `Gasto de ${brl(a.gasto)} no último dia, acima do normal de ${brl(a.gastoBase ?? 0)}.`,
    });
  if (i.criativos.cortar.length)
    out.push({
      tipo: "problema",
      tag: "TikTok criativos",
      tom: "warn",
      texto: `${i.criativos.cortar.length} vídeo(s) gastaram ${brl(i.criativos.cortar.reduce((s, c) => s + c.invest, 0))} sem nenhum pedido.`,
    });
  const semEstoque = i.produtos.filter(
    (p) => p.coberturaDias != null && p.coberturaDias < 7 && p.invest > 0,
  );
  if (semEstoque.length)
    out.push({
      tipo: "problema",
      tag: "TikTok estoque",
      tom: "danger",
      texto: `${semEstoque[0]!.produto}: anúncio ativo com estoque para menos de 7 dias no TikTok.`,
    });
  if (i.criativos.escalar.length)
    out.push({
      tipo: "oportunidade",
      tag: "TikTok criativos",
      tom: "success",
      texto: `${i.criativos.escalar.length} vídeo(s) com ROAS 30% acima da média, como o de ${i.criativos.escalar[0]!.produto || i.criativos.escalar[0]!.item}.`,
    });
  return out;
}
