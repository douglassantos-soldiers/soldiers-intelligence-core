// Mercado Livre: economia real e diagnóstico por anúncio com tabelas que JÁ existem no Supabase.
// Plano Mestre caps. 9, 10, 13, 14, 17; benchmarks/mercado-livre/ANALISE.md §4 (itens 1–4, 7 e 10).
//
// Regras:
// - Receita realizada vem dos itens do pedido. Venda de Ads e de afiliado é atribuída: não se soma.
// - Cupom pago pelo Mercado Livre não reduz a receita da Soldiers; cupom do vendedor reduz.
// - CMV pelo custo vigente na data da venda (princípio 14).
// - HIPÓTESES a validar com pedidos reais (benchmarks/mercado-livre §5):
//   total_sale_fee = tarifa total do pedido; frete_rateado = frete pago pelo vendedor no pedido;
//   unit_price não desconta o cupom do vendedor; comissao_pedido = comissão do afiliado naquela linha.
//   Por isso os custos são lidos em valor absoluto e a origem de cada número fica na tela.

import { custoHistorico, custoNaData } from "@/lib/aggregate";
import { escalaPct } from "@/lib/amazon";

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const abs = (v: unknown) => Math.abs(n(v));
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const txt = (v: unknown) => String(v ?? "").trim();
const div = (a: number, b: number) => (b ? a / b : null);
const cancelado = (s: unknown) => /cancel/i.test(String(s ?? ""));
const mediana = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor((s.length - 1) / 2)]!;
};

// ---------------------------------------------------------------------------------------------
// Economia por pedido e por SKU

export type SkuML = {
  sku: string;
  titulo: string;
  unidades: number;
  receita: number;
  tarifa: number;
  frete: number;
  cupomVendedor: number;
  afiliado: number;
  cmv: number;
  ads: number;
  contribuicao: number;
  margemPct: number | null;
  temCusto: boolean;
};

/**
 * @param pedidos   ml_pedido (sem buyer_id)
 * @param itens     ml_pedido_item
 * @param fretes    vw_ml_frete_pedido
 * @param cupons    ml_pedido_cupom
 * @param afiliados ml_afiliado_venda (só linhas com casou_pedido)
 * @param custos    dim_custo_sku (todas as vigências)
 * @param adsItem   vw_ml_pads_item_dia (custo de Product Ads por anúncio e dia)
 * @param adsConta  tab_ml_kpi_dia (investimento total: Product, Brand e Display Ads)
 */
export function economiaML(
  pedidos: Row[],
  itens: Row[],
  fretes: Row[],
  cupons: Row[],
  afiliados: Row[],
  custos: Row[],
  adsItem: Row[],
  adsConta: Row[],
  de: string,
  ate: string,
) {
  const hist = custoHistorico(custos);
  const noPeriodo = (d: string) => d >= de && d <= ate;

  const ped = new Map<string, { dia: string; tarifa: number; total: number }>();
  let cancelados = 0;
  for (const p of pedidos) {
    const id = txt(p["pedido_id"]);
    const d = dia(p["data_venda"] ?? p["date_created"]);
    if (!id || !noPeriodo(d)) continue;
    if (cancelado(p["status"])) {
      cancelados++;
      continue;
    }
    ped.set(id, { dia: d, tarifa: abs(p["total_sale_fee"]), total: n(p["total_amount"]) });
  }

  const freteDe = new Map<string, number>();
  for (const f of fretes) {
    const id = txt(f["pedido_id"]);
    if (id) freteDe.set(id, (freteDe.get(id) ?? 0) + abs(f["frete_rateado"]));
  }
  const cupomDe = new Map<string, { vend: number; meli: number }>();
  for (const c of cupons) {
    const id = txt(c["pedido_id"]);
    if (!id) continue;
    const cur = cupomDe.get(id) ?? { vend: 0, meli: 0 };
    cur.vend += abs(c["cupom_vendedor"]);
    cur.meli += abs(c["cupom_meli"]);
    cupomDe.set(id, cur);
  }
  // Comissão de afiliado por pedido e anúncio (linhas repetidas da mesma venda contam uma vez).
  const afilDe = new Map<string, number>();
  const vistos = new Set<string>();
  for (const a of afiliados) {
    if (a["casou_pedido"] === false) continue;
    const k = `${txt(a["pedido_id"])}|${txt(a["item_id_ml"] ?? a["item_id"])}`;
    if (vistos.has(k)) continue;
    vistos.add(k);
    afilDe.set(k, (afilDe.get(k) ?? 0) + abs(a["comissao_pedido"]));
  }

  type Linha = {
    item: string;
    sku: string;
    titulo: string;
    qtd: number;
    receita: number;
    cmv: number;
    temCusto: boolean;
  };
  const linhasDe = new Map<string, Linha[]>();
  const skuDoItem = new Map<string, string>();
  let semCusto = 0;
  for (const i of itens) {
    const id = txt(i["pedido_id"]);
    const p = ped.get(id);
    if (!p) continue;
    const sku = txt(i["seller_sku"]);
    const item = txt(i["item_id"]);
    const qtd = n(i["quantity"]) || 1;
    const c = sku ? custoNaData(hist, sku, p.dia) : undefined;
    if (!c) semCusto++;
    if (item && sku) skuDoItem.set(item, sku);
    const l: Linha = {
      item,
      sku,
      titulo: txt(i["title"]) || sku || item,
      qtd,
      receita: n(i["unit_price"]) * qtd,
      cmv: (c?.custo ?? 0) * qtd,
      temCusto: !!c,
    };
    const list = linhasDe.get(id) ?? [];
    list.push(l);
    linhasDe.set(id, list);
  }

  const porSku = new Map<string, SkuML>();
  const tot = {
    pedidos: 0,
    unidades: 0,
    receita: 0,
    tarifa: 0,
    frete: 0,
    cupomVendedor: 0,
    cupomMeli: 0,
    afiliado: 0,
    cmv: 0,
  };
  for (const [id, linhas] of linhasDe) {
    const p = ped.get(id)!;
    const receita = linhas.reduce((s, l) => s + l.receita, 0);
    const frete = freteDe.get(id) ?? 0;
    const cupom = cupomDe.get(id) ?? { vend: 0, meli: 0 };
    tot.pedidos++;
    tot.receita += receita;
    tot.tarifa += p.tarifa;
    tot.frete += frete;
    tot.cupomVendedor += cupom.vend;
    tot.cupomMeli += cupom.meli;
    for (const l of linhas) {
      const peso = receita > 0 ? l.receita / receita : 1 / linhas.length;
      const afil = afilDe.get(`${id}|${l.item}`) ?? 0;
      tot.unidades += l.qtd;
      tot.afiliado += afil;
      tot.cmv += l.cmv;
      const key = l.sku || l.item;
      const s = porSku.get(key) ?? {
        sku: l.sku,
        titulo: l.titulo,
        unidades: 0,
        receita: 0,
        tarifa: 0,
        frete: 0,
        cupomVendedor: 0,
        afiliado: 0,
        cmv: 0,
        ads: 0,
        contribuicao: 0,
        margemPct: null,
        temCusto: true,
      };
      s.unidades += l.qtd;
      s.receita += l.receita;
      s.tarifa += p.tarifa * peso;
      s.frete += frete * peso;
      s.cupomVendedor += cupom.vend * peso;
      s.afiliado += afil;
      s.cmv += l.cmv;
      s.temCusto = s.temCusto && l.temCusto;
      porSku.set(key, s);
    }
  }

  // Product Ads por anúncio → SKU. O que não casa com SKU fica só no total.
  let adsItemTotal = 0;
  for (const r of adsItem) {
    if (!noPeriodo(dia(r["date"]))) continue;
    const custo = n(r["cost"]);
    adsItemTotal += custo;
    const sku = skuDoItem.get(txt(r["item_id"]));
    const s = sku ? porSku.get(sku) : undefined;
    if (s) s.ads += custo;
  }
  const adsTotal = adsConta
    .filter((r) => noPeriodo(dia(r["data"])))
    .reduce((s, r) => s + n(r["invest_pads"]) + n(r["invest_brand"]) + n(r["invest_display"]), 0);

  const receitaLiquida = tot.receita - tot.cupomVendedor;
  const contribuicao = receitaLiquida - tot.tarifa - tot.frete - tot.afiliado - tot.cmv;
  const ads = Math.max(adsTotal, adsItemTotal);
  const skus = [...porSku.values()]
    .map((s) => {
      const c = s.receita - s.cupomVendedor - s.tarifa - s.frete - s.afiliado - s.cmv - s.ads;
      return { ...s, contribuicao: c, margemPct: div(c * 100, s.receita - s.cupomVendedor) };
    })
    .sort((a, b) => b.receita - a.receita);

  return {
    ...tot,
    cancelados,
    receitaLiquida,
    contribuicaoAntesAds: contribuicao,
    ads,
    contribuicao: contribuicao - ads,
    margemPct: div((contribuicao - ads) * 100, receitaLiquida),
    tarifaPct: div(tot.tarifa * 100, receitaLiquida),
    fretePorPedido: div(tot.frete, tot.pedidos),
    itensSemCusto: semCusto,
    skus,
  };
}

// ---------------------------------------------------------------------------------------------
// Anúncio 360° + catálogo com margem

export type AnuncioML = {
  item: string;
  sku: string;
  titulo: string;
  preco: number | null;
  visitas: number;
  pedidos: number;
  unidades: number;
  faturamento: number;
  conversaoPct: number | null;
  health: number | null;
  catalogo: string;
  priceToWin: number | null;
  /** Contribuição estimada por unidade se o preço for para o price_to_win (null = sem dado). */
  contribuicaoNoPtw: number | null;
  fullDisponivel: number | null;
  coberturaDias: number | null;
  problemas: string[];
};

/**
 * @param anuncioDia  vw_ml_anuncio_dia (visitas, pedidos e faturamento por anúncio e dia)
 * @param competicao  vw_ml_competicao (preço, health, catálogo, price_to_win)
 * @param full        dim_ml_produto (Full por seller_sku)
 * @param skus        economiaML(...).skus (tarifa, frete e CMV médios por unidade)
 */
export function anuncios360(
  anuncioDia: Row[],
  competicao: Row[],
  full: Row[],
  skus: SkuML[],
  de: string,
  ate: string,
  { coberturaMin = 14, top = 80 } = {},
): AnuncioML[] {
  const agg = new Map<
    string,
    { visitas: number; pedidos: number; unidades: number; fat: number }
  >();
  for (const r of anuncioDia) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    const item = txt(r["item_id"]);
    if (!item) continue;
    const cur = agg.get(item) ?? { visitas: 0, pedidos: 0, unidades: 0, fat: 0 };
    cur.visitas += n(r["visitas"]);
    cur.pedidos += n(r["pedidos"]);
    cur.unidades += n(r["unidades"]);
    cur.fat += n(r["faturamento"]);
    agg.set(item, cur);
  }
  const comp = new Map(competicao.map((r) => [txt(r["item_id"]), r]));
  const fullDe = new Map(full.map((r) => [txt(r["seller_sku"]), r]));
  const econ = new Map(skus.map((s) => [s.sku, s]));
  const fH = escalaPct(competicao.map((r) => r["health"]));

  const convs = [...agg.values()]
    .filter((x) => x.visitas >= 200)
    .map((x) => (x.pedidos / x.visitas) * 100);
  const convMed = mediana(convs);

  const ids = new Set([...agg.keys(), ...comp.keys()].filter(Boolean));
  const out: AnuncioML[] = [];
  for (const item of ids) {
    const a = agg.get(item) ?? { visitas: 0, pedidos: 0, unidades: 0, fat: 0 };
    const c = comp.get(item);
    const status = txt(c?.["anuncio_status"]);
    if (!a.fat && !a.visitas && /closed|inactive|paused/i.test(status)) continue;
    const sku = txt(c?.["sku"]);
    const f = sku ? fullDe.get(sku) : undefined;
    const e = sku ? econ.get(sku) : undefined;
    const preco = c?.["preco_venda"] == null ? null : n(c["preco_venda"]);
    const ptw = c?.["price_to_win"] == null ? null : n(c["price_to_win"]);
    const health = c?.["health"] == null ? null : n(c["health"]) * fH;
    const catalogo = txt(c?.["buybox_status"]) || txt(c?.["situacao"]);
    const conversaoPct = div(a.pedidos * 100, a.visitas);

    // Margem no price_to_win: tarifa % e frete médio do SKU no período, CMV médio por unidade.
    let contribuicaoNoPtw: number | null = null;
    if (ptw && e && e.unidades > 0 && e.receita > 0 && e.temCusto) {
      const tarifaPct = e.tarifa / e.receita;
      contribuicaoNoPtw = ptw - ptw * tarifaPct - e.frete / e.unidades - e.cmv / e.unidades;
    }

    const problemas: string[] = [];
    const perdendo = /compet|losing|perd/i.test(catalogo) && !/winning|ganh/i.test(catalogo);
    if (perdendo) {
      if (contribuicaoNoPtw == null) problemas.push("perdendo o catálogo");
      else if (contribuicaoNoPtw >= 0) problemas.push("catálogo: ganhar dá lucro");
      else problemas.push("catálogo: ganhar dá prejuízo");
    }
    if (/paused|inactive/i.test(status) && n(c?.["estoque_disponivel"]) > 0)
      problemas.push("pausado com estoque");
    const disp = f ? n(f["full_disponivel"]) : null;
    const cob = f?.["cobertura_dias"] == null ? null : n(f["cobertura_dias"]);
    if (f && f["em_full"] !== false) {
      if (disp === 0 && a.unidades > 0) problemas.push("sem estoque no Full");
      else if (cob != null && cob < coberturaMin)
        problemas.push(`Full cobre ${Math.round(cob)} dias`);
    }
    if (health != null && health < 70) problemas.push(`qualidade ${Math.round(health)}%`);
    if (conversaoPct != null && convMed != null && a.visitas >= 200 && conversaoPct < convMed / 2)
      problemas.push("conversão abaixo da metade da mediana");
    if (e && e.receita > 0 && e.contribuicao < 0)
      problemas.push("contribuição negativa no período");

    out.push({
      item,
      sku,
      titulo: txt(c?.["nome"]) || e?.titulo || item,
      preco,
      visitas: a.visitas,
      pedidos: a.pedidos,
      unidades: a.unidades,
      faturamento: a.fat,
      conversaoPct,
      health,
      catalogo,
      priceToWin: ptw,
      contribuicaoNoPtw,
      fullDisponivel: disp,
      coberturaDias: cob,
      problemas,
    });
  }
  return out.sort((x, y) => y.faturamento - x.faturamento).slice(0, top);
}

// ---------------------------------------------------------------------------------------------
// Product Ads: onde está o gargalo

export type ItemAdsML = {
  item: string;
  titulo: string;
  custo: number;
  vendasAtribuidas: number;
  vendasOrganicas: number;
  acosPct: number | null;
  acosBenchmarkPct: number | null;
  perdaOrcamentoPct: number | null;
  perdaRankPct: number | null;
  diagnostico: "orcamento" | "rank" | "acos_alto" | "ok";
};

/**
 * Por anúncio (vw_ml_pads_item_dia), com médias ponderadas pelo custo:
 * - orcamento: perde ≥ perdaMin % de impressões por orçamento e ACoS ≤ benchmark → aumentar verba;
 * - rank: perde ≥ perdaMin % por rank → melhorar anúncio, preço ou lance;
 * - acos_alto: ACoS ≥ 1,2 × benchmark com gasto ≥ custoMin → revisar.
 */
export function diagnosticoAds(
  rows: Row[],
  de: string,
  ate: string,
  { perdaMin = 20, custoMin = 50, top = 15 } = {},
) {
  const r0 = rows.filter((r) => dia(r["date"]) >= de && dia(r["date"]) <= ate);
  const fLost = escalaPct(
    r0.flatMap((r) => [
      r["lost_impression_share_by_budget"],
      r["lost_impression_share_by_ad_rank"],
    ]),
  );
  const fAcos = escalaPct(r0.map((r) => r["acos_benchmark"]));
  const m = new Map<
    string,
    {
      titulo: string;
      custo: number;
      atrib: number;
      org: number;
      pb: number;
      pr: number;
      bm: number;
      w: number;
      wb: number;
    }
  >();
  let direta = 0;
  let indireta = 0;
  let organica = 0;
  for (const r of r0) {
    const item = txt(r["item_id"]);
    if (!item) continue;
    const custo = n(r["cost"]);
    const atrib = n(r["direct_amount"]) + n(r["indirect_amount"]);
    direta += n(r["direct_amount"]);
    indireta += n(r["indirect_amount"]);
    organica += n(r["organic_units_amount"]);
    const cur = m.get(item) ?? {
      titulo: txt(r["title"]) || item,
      custo: 0,
      atrib: 0,
      org: 0,
      pb: 0,
      pr: 0,
      bm: 0,
      w: 0,
      wb: 0,
    };
    const w = custo || 0.0001;
    cur.custo += custo;
    cur.atrib += atrib;
    cur.org += n(r["organic_units_amount"]);
    cur.pb += n(r["lost_impression_share_by_budget"]) * fLost * w;
    cur.pr += n(r["lost_impression_share_by_ad_rank"]) * fLost * w;
    cur.w += w;
    if (r["acos_benchmark"] != null) {
      cur.bm += n(r["acos_benchmark"]) * fAcos * w;
      cur.wb += w;
    }
    m.set(item, cur);
  }
  const itens: ItemAdsML[] = [...m.entries()].map(([item, x]) => {
    const acosPct = div(x.custo * 100, x.atrib);
    const bench = x.wb ? x.bm / x.wb : null;
    const pb = x.w ? x.pb / x.w : null;
    const pr = x.w ? x.pr / x.w : null;
    let diagnostico: ItemAdsML["diagnostico"] = "ok";
    if (pb != null && pb >= perdaMin && (bench == null || (acosPct != null && acosPct <= bench)))
      diagnostico = "orcamento";
    else if (acosPct != null && bench != null && acosPct >= bench * 1.2 && x.custo >= custoMin)
      diagnostico = "acos_alto";
    else if (pr != null && pr >= perdaMin) diagnostico = "rank";
    return {
      item,
      titulo: x.titulo,
      custo: x.custo,
      vendasAtribuidas: x.atrib,
      vendasOrganicas: x.org,
      acosPct,
      acosBenchmarkPct: bench,
      perdaOrcamentoPct: pb,
      perdaRankPct: pr,
      diagnostico,
    };
  });
  const custo = itens.reduce((s, i) => s + i.custo, 0);
  const atrib = direta + indireta;
  return {
    custo,
    vendasDiretas: direta,
    vendasIndiretas: indireta,
    vendasOrganicas: organica,
    acosPct: div(custo * 100, atrib),
    lista: itens
      .filter((i) => i.diagnostico !== "ok")
      .sort((a, b) => b.custo - a.custo)
      .slice(0, top),
    contagem: {
      orcamento: itens.filter((i) => i.diagnostico === "orcamento").length,
      rank: itens.filter((i) => i.diagnostico === "rank").length,
      acos_alto: itens.filter((i) => i.diagnostico === "acos_alto").length,
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Command Center

export type AlertaML = {
  tipo: "problema" | "oportunidade";
  tag: string;
  tom: "danger" | "warn" | "success" | "primary";
  texto: string;
};

export function alertasML(i: {
  anuncios: AnuncioML[];
  ads: ReturnType<typeof diagnosticoAds>;
}): AlertaML[] {
  const out: AlertaML[] = [];
  const brl = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
  const com = (re: RegExp) => i.anuncios.filter((a) => a.problemas.some((p) => re.test(p)));

  const semFull = com(/sem estoque no Full|Full cobre/);
  if (semFull.length)
    out.push({
      tipo: "problema",
      tag: "ML Full",
      tom: "warn",
      texto: `${semFull.length} anúncio(s) com venda e Full acabando ou zerado. Maior: ${semFull[0]!.titulo}.`,
    });
  const negativo = com(/contribuição negativa/);
  if (negativo.length)
    out.push({
      tipo: "problema",
      tag: "ML margem",
      tom: "danger",
      texto: `${negativo.length} anúncio(s) com contribuição negativa no período (após tarifa, frete, afiliado, Ads e custo), como ${negativo[0]!.titulo}.`,
    });
  const catLucro = com(/ganhar dá lucro/);
  if (catLucro.length)
    out.push({
      tipo: "oportunidade",
      tag: "ML catálogo",
      tom: "success",
      texto: `${catLucro.length} anúncio(s) perdendo o catálogo em que baixar para o preço vencedor ainda dá lucro, como ${catLucro[0]!.titulo}.`,
    });
  const catPrej = com(/ganhar dá prejuízo/);
  if (catPrej.length)
    out.push({
      tipo: "problema",
      tag: "ML catálogo",
      tom: "warn",
      texto: `${catPrej.length} anúncio(s) perdendo o catálogo em que o preço vencedor daria prejuízo. Não baixar preço; rever custo ou frete.`,
    });
  const orc = i.ads.lista.filter((a) => a.diagnostico === "orcamento");
  if (orc.length)
    out.push({
      tipo: "oportunidade",
      tag: "ML Ads",
      tom: "primary",
      texto: `${orc.length} anúncio(s) com ACoS dentro da referência do ML perdendo impressões por falta de orçamento (${brl(orc.reduce((s, a) => s + a.custo, 0))} investidos).`,
    });
  return out;
}
