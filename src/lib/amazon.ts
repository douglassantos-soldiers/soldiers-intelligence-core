// Amazon: leitura do que JÁ é coletado no Supabase (vendas/tráfego por ASIN, Buy Box, cadastro,
// estoque FBA, reposição, Ads search terms, Brand Analytics, recompra).
// Plano Mestre caps. 9, 10, 13, 17; benchmarks/amazon/ANALISE.md §4 (itens 1–5 e 7).
//
// Regras:
// - Venda de Ads (sales_14d) é ATRIBUÍDA pela Amazon; nunca somar com a venda realizada (cap. 13.2).
// - Ainda não há tarifas reais nem repasse (Finances API não conectada): nada aqui é margem.
// - Escala de % não é assumida: colunas que vêm em fração (0–1) são convertidas para 0–100.

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const txt = (v: unknown) => String(v ?? "").trim();
const norm = (v: unknown) => txt(v).toLowerCase().replace(/\s+/g, " ");
const div = (a: number, b: number) => (b ? a / b : null);

/** Fator para levar uma coluna de % para 0–100: se nenhum valor passa de 1, a coluna está em fração. */
export function escalaPct(valores: unknown[]): 1 | 100 {
  const nums = valores.map(Number).filter((x) => Number.isFinite(x) && x !== 0);
  return nums.length && nums.every((x) => Math.abs(x) <= 1) ? 100 : 1;
}

const mediana = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor((s.length - 1) / 2)]!;
};

// ---------------------------------------------------------------------------------------------
// Resumo da conta (Sales & Traffic) + Ads

/**
 * @param trafego  fact_amazon_venda_trafego_dia (nível conta, por dia)
 * @param ads      fact_amazon_ads_campanha_dia (SP/SB/SD, por campanha e dia)
 */
export function resumoAmazon(trafego: Row[], ads: Row[], de: string, ate: string) {
  const t = trafego.filter((r) => dia(r["data"]) >= de && dia(r["data"]) <= ate);
  const a = ads.filter((r) => dia(r["data"]) >= de && dia(r["data"]) <= ate);
  const fBB = escalaPct(t.map((r) => r["buybox_pct"]));
  const vendas = t.reduce((s, r) => s + n(r["vendas"]), 0);
  const unidades = t.reduce((s, r) => s + n(r["unidades"]), 0);
  const sessoes = t.reduce((s, r) => s + n(r["sessoes"]), 0);
  const devolvidas = t.reduce((s, r) => s + n(r["unidades_devolvidas"]), 0);
  const bbPeso = t.reduce((s, r) => s + n(r["buybox_pct"]) * fBB * n(r["sessoes"]), 0);
  const custoAds = a.reduce((s, r) => s + n(r["cost"]), 0);
  const vendasAds = a.reduce((s, r) => s + n(r["sales_14d"]), 0);

  const porTipo = new Map<
    string,
    { tipo: string; custo: number; vendasAtribuidas: number; cliques: number }
  >();
  for (const r of a) {
    const tipo = txt(r["ad_type"]) || "—";
    const cur = porTipo.get(tipo) ?? { tipo, custo: 0, vendasAtribuidas: 0, cliques: 0 };
    cur.custo += n(r["cost"]);
    cur.vendasAtribuidas += n(r["sales_14d"]);
    cur.cliques += n(r["clicks"]);
    porTipo.set(tipo, cur);
  }

  return {
    vendas,
    unidades,
    sessoes,
    conversaoPct: div(unidades * 100, sessoes),
    buyboxPct: sessoes ? bbPeso / sessoes : null,
    devolucaoPct: div(devolvidas * 100, unidades),
    diasEmConsolidacao: t.filter((r) => r["em_consolidacao"] === true).length,
    ads: {
      custo: custoAds,
      vendasAtribuidas: vendasAds,
      acosPct: div(custoAds * 100, vendasAds),
      tacosPct: div(custoAds * 100, vendas),
      porTipo: [...porTipo.values()]
        .map((p) => ({ ...p, acosPct: div(p.custo * 100, p.vendasAtribuidas) }))
        .sort((x, y) => y.custo - x.custo),
    },
  };
}

// ---------------------------------------------------------------------------------------------
// ASIN 360°

export type Asin360 = {
  asin: string;
  titulo: string;
  vendas: number;
  unidades: number;
  sessoes: number;
  conversaoPct: number | null;
  buyboxPct: number | null;
  ganhaBuyBox: boolean | null;
  meuPreco: number | null;
  menorConcorrente: number | null;
  fbaDisponivel: number | null;
  coberturaDias: number | null;
  health: number | null;
  problemas: string[];
};

/**
 * Uma linha por ASIN filho: tráfego → conversão → Buy Box → estoque → cadastro, com a lista de
 * problemas que explicam venda perdida. Ordenado por venda no período.
 */
export function asin360(
  vendas: Row[],
  buybox: Row[],
  estoque: Row[],
  reposicao: Row[],
  cadastro: Row[],
  de: string,
  ate: string,
  { coberturaMin = 14 } = {},
): Asin360[] {
  const v = vendas.filter((r) => dia(r["data"]) >= de && dia(r["data"]) <= ate);
  const fBB = escalaPct(v.map((r) => r["buybox_pct"]));

  const agg = new Map<
    string,
    { vendas: number; unidades: number; sessoes: number; bbPeso: number }
  >();
  for (const r of v) {
    const asin = txt(r["child_asin"]);
    if (!asin) continue;
    const cur = agg.get(asin) ?? { vendas: 0, unidades: 0, sessoes: 0, bbPeso: 0 };
    cur.vendas += n(r["vendas"]);
    cur.unidades += n(r["unidades"]);
    cur.sessoes += n(r["sessoes"]);
    cur.bbPeso += n(r["buybox_pct"]) * fBB * n(r["sessoes"]);
    agg.set(asin, cur);
  }

  const bb = new Map(buybox.map((r) => [txt(r["asin"]), r]));
  const cad = new Map(cadastro.map((r) => [txt(r["asin"]), r]));
  const fba = new Map<string, number>();
  for (const r of estoque) {
    const asin = txt(r["asin"]);
    if (asin) fba.set(asin, (fba.get(asin) ?? 0) + n(r["fulfillable"]));
  }
  const rep = new Map<string, Row>();
  for (const r of reposicao) {
    const asin = txt(r["asin"]);
    if (asin && r["em_fba"] !== false) rep.set(asin, r);
  }

  const convs = [...agg.values()]
    .filter((x) => x.sessoes >= 100)
    .map((x) => (x.unidades / x.sessoes) * 100);
  const convMediana = mediana(convs);

  const out: Asin360[] = [];
  for (const [asin, x] of agg) {
    const b = bb.get(asin);
    const c = cad.get(asin);
    const rp = rep.get(asin);
    const conversaoPct = div(x.unidades * 100, x.sessoes);
    const buyboxPct = x.sessoes ? x.bbPeso / x.sessoes : null;
    const ganha = b ? (b["ganho_buybox"] == null ? null : b["ganho_buybox"] === true) : null;
    const meuPreco = b?.["meu_preco"] == null ? null : n(b["meu_preco"]);
    const menor = b?.["menor_preco_concorrente"] == null ? null : n(b["menor_preco_concorrente"]);
    const disp = fba.has(asin) ? fba.get(asin)! : null;
    const cob = rp?.["cobertura_dias"] == null ? null : n(rp["cobertura_dias"]);

    const problemas: string[] = [];
    if (ganha === false)
      problemas.push(
        b?.["concorrente_no_bb"] === true ? "concorrente com a Buy Box" : "sem Buy Box",
      );
    else if (buyboxPct != null && buyboxPct < 90)
      problemas.push(`Buy Box em ${Math.round(buyboxPct)}% das sessões`);
    if (meuPreco != null && menor != null && menor > 0 && meuPreco > menor)
      problemas.push("preço acima do menor concorrente");
    if (disp === 0) problemas.push("sem estoque FBA");
    else if (cob != null && cob < coberturaMin)
      problemas.push(`cobertura de ${Math.round(cob)} dias`);
    if (
      conversaoPct != null &&
      convMediana != null &&
      x.sessoes >= 100 &&
      conversaoPct < convMediana / 2
    )
      problemas.push("conversão abaixo da metade da mediana");
    const faltas = Array.isArray(c?.["faltas"])
      ? (c!["faltas"] as unknown[]).map(txt).filter(Boolean)
      : [];
    if (faltas.length) problemas.push(`cadastro: falta ${faltas.join(", ")}`);
    if (c && c["tem_aplus"] === false) problemas.push("sem A+");

    out.push({
      asin,
      titulo: txt(c?.["titulo"]) || txt(rp?.["titulo"]) || asin,
      vendas: x.vendas,
      unidades: x.unidades,
      sessoes: x.sessoes,
      conversaoPct,
      buyboxPct,
      ganhaBuyBox: ganha,
      meuPreco,
      menorConcorrente: menor,
      fbaDisponivel: disp,
      coberturaDias: cob,
      health: c?.["health"] == null ? null : n(c["health"]),
      problemas,
    });
  }
  return out.sort((a, b) => b.vendas - a.vendas);
}

// ---------------------------------------------------------------------------------------------
// Ads: search terms

export type TermoAds = {
  termo: string;
  campanhas: number;
  custo: number;
  cliques: number;
  compras: number;
  vendasAtribuidas: number;
  acosPct: number | null;
  temExata: boolean;
};

/**
 * Termos de busca dos Sponsored Products agregados no período.
 * - negativar: gastou ≥ custoMin com ≥ cliquesMin cliques e nenhuma compra;
 * - promover: ≥ comprasMin compras, ACoS abaixo do ACoS dos termos com venda e ainda sem keyword exata.
 */
export function termosAds(
  rows: Row[],
  de: string,
  ate: string,
  { custoMin = 30, cliquesMin = 10, comprasMin = 2, top = 15 } = {},
) {
  const m = new Map<string, TermoAds & { _camp: Set<string> }>();
  const exatas = new Set<string>();
  for (const r of rows) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    if (/exact/i.test(txt(r["match_type"]))) exatas.add(norm(r["keyword_text"]));
    const termo = norm(r["search_term"]);
    if (!termo) continue;
    const cur = m.get(termo) ?? {
      termo,
      campanhas: 0,
      custo: 0,
      cliques: 0,
      compras: 0,
      vendasAtribuidas: 0,
      acosPct: null,
      temExata: false,
      _camp: new Set<string>(),
    };
    cur.custo += n(r["cost"]);
    cur.cliques += n(r["clicks"]);
    cur.compras += n(r["purchases_14d"]);
    cur.vendasAtribuidas += n(r["sales_14d"]);
    cur._camp.add(txt(r["campaign_name"]));
    m.set(termo, cur);
  }
  const todos: TermoAds[] = [...m.values()].map(({ _camp, ...t }) => ({
    ...t,
    campanhas: _camp.size,
    acosPct: div(t.custo * 100, t.vendasAtribuidas),
    temExata: exatas.has(t.termo),
  }));
  const comVenda = todos.filter((t) => t.vendasAtribuidas > 0);
  const acosRef = div(
    comVenda.reduce((s, t) => s + t.custo, 0) * 100,
    comVenda.reduce((s, t) => s + t.vendasAtribuidas, 0),
  );
  return {
    acosReferenciaPct: acosRef,
    custoTotal: todos.reduce((s, t) => s + t.custo, 0),
    negativar: todos
      .filter((t) => t.compras === 0 && t.custo >= custoMin && t.cliques >= cliquesMin)
      .sort((a, b) => b.custo - a.custo)
      .slice(0, top),
    promover: todos
      .filter(
        (t) =>
          !t.temExata &&
          t.compras >= comprasMin &&
          t.acosPct != null &&
          acosRef != null &&
          t.acosPct < acosRef,
      )
      .sort((a, b) => b.vendasAtribuidas - a.vendasAtribuidas)
      .slice(0, top),
  };
}

// ---------------------------------------------------------------------------------------------
// Brand Analytics: share de busca

export type ShareTermo = {
  termo: string;
  rank: number | null;
  clickShare: number;
  conversionShare: number;
  clickShareAnterior: number | null;
  variacaoPp: number | null;
  status: "ganhou" | "perdeu" | "estavel" | "novo" | "saiu";
};

/**
 * Participação da Soldiers (linhas com nosso = true) nos 3 ASINs mais clicados de cada termo,
 * na semana mais recente × semana anterior. Ordenado pelo rank de busca (mais buscado primeiro).
 */
export function shareDeBusca(rows: Row[], { top = 20, limiarPp = 2 } = {}) {
  const semanas = [...new Set(rows.map((r) => dia(r["semana_fim"])).filter(Boolean))].sort();
  const atual = semanas.at(-1) ?? null;
  const anterior = semanas.length > 1 ? semanas.at(-2)! : null;
  const fC = escalaPct(rows.map((r) => r["click_share"]));
  const fV = escalaPct(rows.map((r) => r["conversion_share"]));

  const porSemana = (s: string | null) => {
    const m = new Map<string, { rank: number | null; click: number; conv: number }>();
    if (!s) return m;
    for (const r of rows) {
      if (dia(r["semana_fim"]) !== s) continue;
      const termo = norm(r["termo"]);
      if (!termo) continue;
      const cur = m.get(termo) ?? { rank: null, click: 0, conv: 0 };
      if (r["rank_busca"] != null) cur.rank = n(r["rank_busca"]);
      if (r["nosso"] === true) {
        cur.click += n(r["click_share"]) * fC;
        cur.conv += n(r["conversion_share"]) * fV;
      }
      m.set(termo, cur);
    }
    return m;
  };
  const A = porSemana(atual);
  const P = porSemana(anterior);

  const lista: ShareTermo[] = [];
  for (const [termo, a] of A) {
    const p = P.get(termo);
    const antes = p ? p.click : null;
    if (a.click === 0 && !(antes && antes > 0)) continue; // termo em que nunca aparecemos
    let status: ShareTermo["status"] = "estavel";
    if (antes == null || (antes === 0 && a.click > 0)) status = "novo";
    else if (a.click === 0) status = "saiu";
    else if (a.click - antes >= limiarPp) status = "ganhou";
    else if (antes - a.click >= limiarPp) status = "perdeu";
    lista.push({
      termo,
      rank: a.rank,
      clickShare: a.click,
      conversionShare: a.conv,
      clickShareAnterior: antes,
      variacaoPp: antes == null ? null : a.click - antes,
      status,
    });
  }
  lista.sort((x, y) => (x.rank ?? Infinity) - (y.rank ?? Infinity));
  return {
    semana: atual,
    semanaAnterior: anterior,
    termos: lista.length,
    perderam: lista.filter((t) => t.status === "perdeu" || t.status === "saiu").length,
    lista: lista.slice(0, top),
  };
}

// ---------------------------------------------------------------------------------------------
// Reposição FBA e recompra

/** SKUs em FBA com alerta de reposição ou cobertura abaixo de `coberturaMin` dias. */
export function reposicaoFba(reposicao: Row[], estoque: Row[], { coberturaMin = 21 } = {}) {
  const imprestavel = new Map<string, number>();
  for (const r of estoque) {
    const sku = txt(r["seller_sku"]);
    if (sku) imprestavel.set(sku, (imprestavel.get(sku) ?? 0) + n(r["imprestavel_total"]));
  }
  const lista = reposicao
    .filter((r) => r["em_fba"] !== false)
    .filter(
      (r) =>
        txt(r["alerta"]) || (r["cobertura_dias"] != null && n(r["cobertura_dias"]) < coberturaMin),
    )
    .map((r) => ({
      sku: txt(r["sku"]),
      asin: txt(r["asin"]),
      titulo: txt(r["titulo"]) || txt(r["sku"]),
      disponivel: n(r["fba_disponivel"]),
      aCaminho: n(r["fba_a_caminho"]),
      mediaDiaria: r["media_diaria"] == null ? null : n(r["media_diaria"]),
      coberturaDias: r["cobertura_dias"] == null ? null : n(r["cobertura_dias"]),
      enviar30d: n(r["enviar_30d"]),
      alerta: txt(r["alerta"]),
      imprestavel: imprestavel.get(txt(r["sku"])) ?? 0,
    }))
    .sort((a, b) => (a.coberturaDias ?? Infinity) - (b.coberturaDias ?? Infinity));
  return {
    lista,
    imprestavelTotal: [...imprestavel.values()].reduce((s, x) => s + x, 0),
  };
}

/** Recompra por ASIN no mês mais recente disponível (Brand Analytics: Repeat Purchase). */
export function recompraAsin(rows: Row[], { top = 10 } = {}) {
  const meses = [...new Set(rows.map((r) => dia(r["mes_fim"])).filter(Boolean))].sort();
  const mes = meses.at(-1) ?? null;
  const f = escalaPct(rows.map((r) => r["pct_clientes_repetem"]));
  const lista = rows
    .filter((r) => mes && dia(r["mes_fim"]) === mes)
    .map((r) => ({
      asin: txt(r["asin"]),
      clientes: n(r["clientes_unicos"]),
      pctRepetem: r["pct_clientes_repetem"] == null ? null : n(r["pct_clientes_repetem"]) * f,
      receitaRecompra: n(r["receita_recompra"]),
    }))
    .filter((r) => r.clientes > 0)
    .sort((a, b) => (b.pctRepetem ?? -1) - (a.pctRepetem ?? -1))
    .slice(0, top);
  return { mes, lista };
}
