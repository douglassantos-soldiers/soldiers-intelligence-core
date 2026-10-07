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
// Ads: Sponsored Products + Brands + Display numa base só

export type TipoAds = "SP" | "SB" | "SD";
/** Normaliza o ad_type do banco ("SP", "sponsoredBrands", "SPONSORED_DISPLAY"…). */
export function tipoAds(v: unknown): TipoAds | "" {
  const s = txt(v)
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  if (s === "sb" || s.includes("brand")) return "SB";
  if (s === "sd" || s.includes("display")) return "SD";
  if (s === "sp" || s.includes("product")) return "SP";
  return "";
}
/**
 * Janela de atribuição que o Console da Amazon mostra para vendedor (seller): Sponsored Products 7 dias;
 * Sponsored Brands e Sponsored Display 14 dias (por clique). [FATO, fonte secundária: Openbridge, "Understanding
 * Amazon Advertising attribution metrics"; confirmar no Console]. Vendor usaria 14 dias também em SP.
 */
export const JANELA_ADS: Record<TipoAds, "7d" | "14d"> = { SP: "7d", SB: "14d", SD: "14d" };

/**
 * Junta as três fontes num formato só: fact_amazon_ads_campanha_dia (SP; às vezes outros tipos),
 * fact_amazon_ads_sb_campanha_dia e fact_amazon_ads_sd_campanha_dia. Para não contar duas vezes, quando a tabela
 * própria de SB (ou SD) tem linhas no período, as linhas desse tipo em campanha_dia são ignoradas.
 * `sales_padrao` = venda atribuída na janela do Console (SP 7d se houver, senão 14d; SB e SD 14d).
 */
export function adsUnificados(sp: Row[], sb: Row[], sd: Row[]): Row[] {
  const temSB = sb.length > 0;
  const temSD = sd.length > 0;
  const out: Row[] = [];
  for (const r of sp) {
    const tipo = tipoAds(r["ad_type"]) || "SP";
    if ((tipo === "SB" && temSB) || (tipo === "SD" && temSD)) continue;
    const s7 = r["sales_7d"];
    out.push({
      ...r,
      ad_type: tipo,
      sales_padrao: tipo === "SP" && s7 != null ? n(s7) : n(r["sales_14d"]),
      janela: tipo === "SP" && s7 != null ? "7d" : "14d",
      fonte_tabela: "fact_amazon_ads_campanha_dia",
    });
  }
  const dedicada = (rows: Row[], tipo: TipoAds, tabela: string) => {
    for (const r of rows)
      out.push({
        data: r["data"],
        ad_type: tipo,
        campaign_id: r["campaign_id"],
        campaign_name: r["campaign_name"],
        cost: r["cost"],
        clicks: r["clicks"],
        impressions: r["impressions"],
        sales_14d: r["sales"],
        sales_7d: null,
        units_sold: r["units_sold"],
        campaign_status: r["campaign_status"],
        sales_padrao: n(r["sales"]),
        janela: "14d",
        fonte_tabela: tabela,
      });
  };
  dedicada(sb, "SB", "fact_amazon_ads_sb_campanha_dia");
  dedicada(sd, "SD", "fact_amazon_ads_sd_campanha_dia");
  return out;
}

/** Investimento e venda atribuída por semana (segunda-feira), para a tendência com os três tipos. */
export function adsPorSemana(ads: Row[]) {
  const m = new Map<string, { custo: number; vendas: number }>();
  for (const r of ads) {
    const d = dia(r["data"]);
    if (!d) continue;
    const t = new Date(d + "T00:00:00Z");
    const seg = new Date(t.getTime() - ((t.getUTCDay() + 6) % 7) * 86400000)
      .toISOString()
      .slice(0, 10);
    const cur = m.get(seg) ?? { custo: 0, vendas: 0 };
    cur.custo += n(r["cost"]);
    cur.vendas += r["sales_padrao"] != null ? n(r["sales_padrao"]) : n(r["sales_14d"]);
    m.set(seg, cur);
  }
  return m;
}

// ---------------------------------------------------------------------------------------------
// Resumo da conta (Sales & Traffic) + Ads

/**
 * @param trafego  fact_amazon_venda_trafego_dia (nível conta, por dia)
 * @param ads      saída de `adsUnificados` (SP + SB + SD, por campanha e dia). Linhas sem `sales_padrao`
 *                 (formato antigo) usam sales_14d.
 */
export function resumoAmazon(
  trafego: Row[],
  ads: Row[],
  de: string,
  ate: string,
  hoje: string = ate,
) {
  const t = trafego.filter((r) => dia(r["data"]) >= de && dia(r["data"]) <= ate);
  const a = ads.filter((r) => dia(r["data"]) >= de && dia(r["data"]) <= ate);
  const fBB = escalaPct(t.map((r) => r["buybox_pct"]));
  const vendas = t.reduce((s, r) => s + n(r["vendas"]), 0);
  const unidades = t.reduce((s, r) => s + n(r["unidades"]), 0);
  const sessoes = t.reduce((s, r) => s + n(r["sessoes"]), 0);
  const devolvidas = t.reduce((s, r) => s + n(r["unidades_devolvidas"]), 0);
  const bbPeso = t.reduce((s, r) => s + n(r["buybox_pct"]) * fBB * n(r["sessoes"]), 0);
  const custoAds = a.reduce((s, r) => s + n(r["cost"]), 0);
  const padrao = (r: Row) => (r["sales_padrao"] != null ? n(r["sales_padrao"]) : n(r["sales_14d"]));
  const vendasAds = a.reduce((s, r) => s + padrao(r), 0);
  const vendasAds14d = a.reduce((s, r) => s + n(r["sales_14d"]), 0);
  const janelas = [
    ...new Set(a.map((r) => `${txt(r["ad_type"]) || "—"} ${txt(r["janela"]) || "14d"}`)),
  ].sort();
  // Venda atribuída de anúncio ainda chega por até 14 dias depois do clique: dias recentes estão "maturando".
  const corte = new Date(Date.parse(hoje + "T00:00:00Z") - 13 * 86400000)
    .toISOString()
    .slice(0, 10);
  const diasAds = new Set(a.map((r) => dia(r["data"])));
  const diasMaturando = [...diasAds].filter((d) => d >= corte).length;

  const porTipo = new Map<
    string,
    { tipo: string; janela: string; custo: number; vendasAtribuidas: number; cliques: number }
  >();
  for (const r of a) {
    const tipo = txt(r["ad_type"]) || "—";
    const cur = porTipo.get(tipo) ?? {
      tipo,
      janela: txt(r["janela"]) || "14d",
      custo: 0,
      vendasAtribuidas: 0,
      cliques: 0,
    };
    cur.custo += n(r["cost"]);
    cur.vendasAtribuidas += padrao(r);
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
      janelas,
      vendasAtribuidas14d: vendasAds14d,
      acos14dPct: div(custoAds * 100, vendasAds14d),
      diasMaturando,
      diasComAds: diasAds.size,
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

// ---------------------------------------------------------------------------------------------
// Busca orgânica × Ads (Brand Analytics cruzado com os search terms de Ads)

export type OrganicoAds = {
  termo: string;
  rank: number | null;
  clickShare: number;
  variacaoPp: number | null;
  custoAds: number;
  vendasAtribuidas: number;
  acosPct: number | null;
};

/**
 * - anunciar: termos em que a Soldiers perdeu espaço orgânico (perdeu/saiu) e não investe em Ads;
 * - reduzirLance: termos em que a Soldiers já tem click share alto (≥ dominanteMin %) e ainda
 *   paga ≥ custoMin em Ads. HIPÓTESE a testar (reduzir aos poucos e medir): parte desse tráfego
 *   viria pela busca orgânica.
 */
export function organicoVsAds(
  brand: Row[],
  termosRows: Row[],
  de: string,
  ate: string,
  { dominanteMin = 30, custoMin = 50, top = 10 } = {},
) {
  const share = shareDeBusca(brand, { top: Infinity }).lista;
  const ads = new Map<string, { custo: number; vendas: number }>();
  for (const r of termosRows) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    const t = norm(r["search_term"]);
    if (!t) continue;
    const cur = ads.get(t) ?? { custo: 0, vendas: 0 };
    cur.custo += n(r["cost"]);
    cur.vendas += n(r["sales_14d"]);
    ads.set(t, cur);
  }
  const lista: OrganicoAds[] = share.map((s) => {
    const a = ads.get(s.termo);
    return {
      termo: s.termo,
      rank: s.rank,
      clickShare: s.clickShare,
      variacaoPp: s.variacaoPp,
      custoAds: a?.custo ?? 0,
      vendasAtribuidas: a?.vendas ?? 0,
      acosPct: a ? div(a.custo * 100, a.vendas) : null,
    };
  });
  const status = new Map(share.map((s) => [s.termo, s.status]));
  return {
    anunciar: lista
      .filter(
        (t) =>
          (status.get(t.termo) === "perdeu" || status.get(t.termo) === "saiu") && t.custoAds === 0,
      )
      .slice(0, top),
    reduzirLance: lista
      .filter((t) => t.clickShare >= dominanteMin && t.custoAds >= custoMin)
      .sort((a, b) => b.custoAds - a.custoAds)
      .slice(0, top),
  };
}

// ---------------------------------------------------------------------------------------------
// Vendas por dia da semana × hora

export const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

/**
 * Venda média por dia da semana e hora (fact_amazon_venda_hora). A média divide pelo número de
 * dias daquele dia da semana no período, para não favorecer quem aparece mais vezes.
 * HIPÓTESE: a coluna `hora` está no fuso de Brasília (validar com o time de dados).
 */
export function vendasPorHora(rows: Row[], de: string, ate: string, { top = 5 } = {}) {
  const diasNoPeriodo = Array(7).fill(0) as number[];
  for (let t = Date.parse(de + "T00:00:00Z"); t <= Date.parse(ate + "T00:00:00Z"); t += 86400000)
    diasNoPeriodo[new Date(t).getUTCDay()]! += 1;
  const venda = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
  const pedidos = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
  let total = 0;
  for (const r of rows) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    const h = Math.trunc(n(r["hora"]));
    if (h < 0 || h > 23) continue;
    const dow = new Date(d + "T00:00:00Z").getUTCDay();
    venda[dow]![h]! += n(r["venda"]);
    pedidos[dow]![h]! += n(r["pedidos"]);
    total += n(r["venda"]);
  }
  const celulas = [];
  for (let dow = 0; dow < 7; dow++)
    for (let h = 0; h < 24; h++) {
      const dias = diasNoPeriodo[dow] || 1;
      celulas.push({
        dow,
        hora: h,
        vendaMedia: venda[dow]![h]! / dias,
        pedidosMedia: pedidos[dow]![h]! / dias,
      });
    }
  const max = Math.max(0, ...celulas.map((c) => c.vendaMedia));
  const porHora = Array.from({ length: 24 }, (_, h) => ({
    hora: h,
    pct: total ? (venda.reduce((s, linha) => s + linha[h]!, 0) / total) * 100 : 0,
  }));
  return {
    total,
    max,
    celulas,
    porHora,
    melhores: [...celulas]
      .filter((c) => c.vendaMedia > 0)
      .sort((a, b) => b.vendaMedia - a.vendaMedia)
      .slice(0, top),
  };
}

// ---------------------------------------------------------------------------------------------
// New-to-brand (Sponsored Brands e Sponsored Display)

/**
 * Quanto da venda atribuída veio de cliente que não comprava a marca havia 12 meses (definição da
 * Amazon) e quanto custou cada cliente novo. SD só reporta new-to-brand por clique.
 */
export function novosParaMarca(sb: Row[], sd: Row[], de: string, ate: string, { top = 10 } = {}) {
  const noPeriodo = (r: Row) => dia(r["data"]) >= de && dia(r["data"]) <= ate;
  const camp = new Map<
    string,
    {
      campanha: string;
      tipo: "SB" | "SD";
      custo: number;
      vendas: number;
      ntbVendas: number;
      ntbCompras: number;
    }
  >();
  const add = (r: Row, tipo: "SB" | "SD", ntbV: string, ntbC: string) => {
    const k = `${tipo}|${txt(r["campaign_id"])}`;
    const cur = camp.get(k) ?? {
      campanha: txt(r["campaign_name"]) || txt(r["campaign_id"]),
      tipo,
      custo: 0,
      vendas: 0,
      ntbVendas: 0,
      ntbCompras: 0,
    };
    cur.custo += n(r["cost"]);
    cur.vendas += n(r["sales"]);
    cur.ntbVendas += n(r[ntbV]);
    cur.ntbCompras += n(r[ntbC]);
    camp.set(k, cur);
  };
  for (const r of sb) if (noPeriodo(r)) add(r, "SB", "ntb_sales", "ntb_purchases");
  for (const r of sd) if (noPeriodo(r)) add(r, "SD", "ntb_sales_clicks", "ntb_purchases_clicks");

  const lista = [...camp.values()].map((c) => ({
    ...c,
    pctNtb: div(c.ntbVendas * 100, c.vendas),
    custoPorNovo: div(c.custo, c.ntbCompras),
  }));
  const tot = (tipo: "SB" | "SD") => {
    const l = lista.filter((c) => c.tipo === tipo);
    const custo = l.reduce((s, c) => s + c.custo, 0);
    const vendas = l.reduce((s, c) => s + c.vendas, 0);
    const ntbVendas = l.reduce((s, c) => s + c.ntbVendas, 0);
    const ntbCompras = l.reduce((s, c) => s + c.ntbCompras, 0);
    return {
      custo,
      vendas,
      ntbVendas,
      ntbCompras,
      pctNtb: div(ntbVendas * 100, vendas),
      custoPorNovo: div(custo, ntbCompras),
    };
  };
  return {
    sb: tot("SB"),
    sd: tot("SD"),
    campanhas: lista
      .filter((c) => c.custo > 0)
      .sort((a, b) => b.ntbVendas - a.ntbVendas)
      .slice(0, top),
  };
}

// ---------------------------------------------------------------------------------------------
// Lances: keywords (SP/SB) e alvos (SD)

export type AlvoLance = {
  alvo: string;
  tipoMatch: string;
  campanha: string;
  custo: number;
  cliques: number;
  compras: number;
  vendasAtribuidas: number;
  acosPct: number | null;
  cpc: number | null;
  topoBuscaPct: number | null;
  lanceSugerido: number | null;
};

type CamposAlvo = { alvo: string; match?: string; compras: string; vendas: string };

function agregaAlvos(rows: Row[], de: string, ate: string, f: CamposAlvo) {
  const m = new Map<string, AlvoLance & { _is: number; _isN: number }>();
  for (const r of rows) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    const alvo = txt(r[f.alvo]);
    if (!alvo) continue;
    const match = f.match ? txt(r[f.match]) : "";
    const campanha = txt(r["campaign_name"]) || txt(r["campaign_id"]);
    const k = `${campanha}|${alvo.toLowerCase()}|${match}`;
    const cur = m.get(k) ?? {
      alvo,
      tipoMatch: match,
      campanha,
      custo: 0,
      cliques: 0,
      compras: 0,
      vendasAtribuidas: 0,
      acosPct: null,
      cpc: null,
      topoBuscaPct: null,
      lanceSugerido: null,
      _is: 0,
      _isN: 0,
    };
    cur.custo += n(r["cost"]);
    cur.cliques += n(r["clicks"]);
    cur.compras += n(r[f.compras]);
    cur.vendasAtribuidas += n(r[f.vendas]);
    if (r["top_search_is"] != null) {
      cur._is += n(r["top_search_is"]);
      cur._isN += 1;
    }
    m.set(k, cur);
  }
  const all = [...m.values()];
  const fIS = escalaPct(all.filter((a) => a._isN).map((a) => a._is / a._isN));
  return all.map(({ _is, _isN, ...a }) => ({
    ...a,
    acosPct: div(a.custo * 100, a.vendasAtribuidas),
    cpc: div(a.custo, a.cliques),
    topoBuscaPct: _isN ? (_is / _isN) * fIS : null,
  }));
}

/**
 * Classifica alvos pelo ACoS contra a referência do conjunto (custo ÷ venda atribuída dos alvos com venda):
 * - subir: ACoS ≤ 70% da referência, ≥ comprasMin compras (e, se houver, pouca presença no topo da busca);
 * - baixar: ACoS ≥ 150% da referência, com gasto ≥ custoMin;
 * - pausar: gasto ≥ 2 × custoMin, ≥ 15 cliques e nenhuma compra.
 * Lance sugerido = CPC atual × (ACoS ref ÷ ACoS do alvo), limitado a ±30%. Só recomendação.
 */
export function classificaLances(
  alvos: AlvoLance[],
  { custoMin = 30, comprasMin = 3, top = 12 } = {},
) {
  const comVenda = alvos.filter((a) => a.vendasAtribuidas > 0);
  const ref = div(
    comVenda.reduce((s, a) => s + a.custo, 0) * 100,
    comVenda.reduce((s, a) => s + a.vendasAtribuidas, 0),
  );
  const sugere = (a: AlvoLance) =>
    a.cpc != null && a.acosPct && ref != null
      ? a.cpc * Math.min(1.3, Math.max(0.7, ref / a.acosPct))
      : null;
  const com = (a: AlvoLance) => ({ ...a, lanceSugerido: sugere(a) });
  return {
    acosReferenciaPct: ref,
    subir:
      ref == null
        ? []
        : alvos
            .filter(
              (a) =>
                a.compras >= comprasMin &&
                a.acosPct != null &&
                a.acosPct <= ref * 0.7 &&
                (a.topoBuscaPct == null || a.topoBuscaPct < 50),
            )
            .sort((a, b) => b.vendasAtribuidas - a.vendasAtribuidas)
            .slice(0, top)
            .map(com),
    baixar:
      ref == null
        ? []
        : alvos
            .filter(
              (a) =>
                a.compras > 0 && a.custo >= custoMin && a.acosPct != null && a.acosPct >= ref * 1.5,
            )
            .sort((a, b) => b.custo - a.custo)
            .slice(0, top)
            .map(com),
    pausar: alvos
      .filter((a) => a.compras === 0 && a.custo >= custoMin * 2 && a.cliques >= 15)
      .sort((a, b) => b.custo - a.custo)
      .slice(0, top),
  };
}

export const alvosKeywords = (rows: Row[], de: string, ate: string) =>
  agregaAlvos(rows, de, ate, {
    alvo: "keyword",
    match: "match_type",
    compras: "purchases_14d",
    vendas: "sales_14d",
  });
export const alvosSd = (rows: Row[], de: string, ate: string) =>
  agregaAlvos(
    rows.map((r) => ({ ...r, _alvo: txt(r["targeting_text"]) || txt(r["targeting"]) })),
    de,
    ate,
    { alvo: "_alvo", compras: "purchases", vendas: "sales" },
  );

// ---------------------------------------------------------------------------------------------
// Command Center: problemas e oportunidades da Amazon

export type AlertaAmazon = {
  tipo: "problema" | "oportunidade";
  tag: string;
  tom: "danger" | "warn" | "success" | "primary";
  texto: string;
};

/** Resume os sinais da Amazon em frases curtas para o Command Center. Nada é executado. */
export function alertasAmazon(i: {
  asins: Asin360[];
  termos: ReturnType<typeof termosAds>;
  share: ReturnType<typeof shareDeBusca>;
  organico: ReturnType<typeof organicoVsAds>;
  coberturaCritica?: number;
  /** Unidades vencidas paradas no FBA (dim_amazon_estoque_sp.imprestavel_vencido). */
  vencidoFba?: number;
}): AlertaAmazon[] {
  const out: AlertaAmazon[] = [];
  const brl = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
  const crit = i.coberturaCritica ?? 14;

  const semBB = i.asins.filter((a) => a.ganhaBuyBox === false && a.vendas > 0);
  if (semBB.length)
    out.push({
      tipo: "problema",
      tag: "Amazon Buy Box",
      tom: "danger",
      texto: `${semBB.length} ASIN(s) que venderam ${brl(semBB.reduce((s, a) => s + a.vendas, 0))} em 14 dias estão sem a Buy Box. Maior: ${semBB[0]!.titulo}.`,
    });
  if (i.vencidoFba)
    out.push({
      tipo: "problema",
      tag: "Amazon FBA",
      tom: "danger",
      texto: `${i.vencidoFba.toLocaleString("pt-BR")} unidade(s) vencida(s) no FBA. Pedir remoção ou descarte.`,
    });
  const ruptura = i.asins.filter(
    (a) =>
      a.vendas > 0 &&
      (a.fbaDisponivel === 0 || (a.coberturaDias != null && a.coberturaDias < crit)),
  );
  if (ruptura.length)
    out.push({
      tipo: "problema",
      tag: "Amazon FBA",
      tom: "warn",
      texto: `${ruptura.length} ASIN(s) com venda e menos de ${crit} dias de estoque no FBA. Maior: ${ruptura[0]!.titulo}.`,
    });
  if (i.termos.negativar.length)
    out.push({
      tipo: "problema",
      tag: "Amazon Ads",
      tom: "warn",
      texto: `${i.termos.negativar.length} termo(s) de busca gastaram ${brl(i.termos.negativar.reduce((s, t) => s + t.custo, 0))} sem nenhuma venda. Avaliar negativar.`,
    });
  const perdeu = i.share.lista.filter((t) => t.status === "perdeu" || t.status === "saiu");
  if (perdeu.length)
    out.push({
      tipo: "problema",
      tag: "Amazon busca",
      tom: "warn",
      texto: `Perdemos espaço na busca em ${perdeu.length} termo(s) na última semana, como "${perdeu[0]!.termo}".`,
    });
  if (i.termos.promover.length)
    out.push({
      tipo: "oportunidade",
      tag: "Amazon Ads",
      tom: "success",
      texto: `${i.termos.promover.length} termo(s) convertem barato e ainda não têm palavra-chave exata, como "${i.termos.promover[0]!.termo}".`,
    });
  if (i.organico.anunciar.length)
    out.push({
      tipo: "oportunidade",
      tag: "Amazon busca",
      tom: "primary",
      texto: `${i.organico.anunciar.length} termo(s) perderam espaço orgânico e não têm anúncio, como "${i.organico.anunciar[0]!.termo}".`,
    });
  if (i.organico.reduzirLance.length)
    out.push({
      tipo: "oportunidade",
      tag: "Amazon Ads",
      tom: "primary",
      texto: `${i.organico.reduzirLance.length} termo(s) em que já dominamos a busca e ainda pagamos ${brl(i.organico.reduzirLance.reduce((s, t) => s + t.custoAds, 0))} em Ads. Testar lance menor.`,
    });
  return out;
}

// ---------------------------------------------------------------------------------------------
// Product 360: bloco Amazon de um SKU

/** Resumo Amazon de um SKU: ASINs vinculados (reposição/estoque FBA) e Ads por produto. */
export function amazonDoSku(
  sku: string,
  vinculos: Row[],
  vendas: Row[],
  buybox: Row[],
  estoque: Row[],
  reposicao: Row[],
  cadastro: Row[],
  adsProduto: Row[],
  de: string,
  ate: string,
) {
  const asins = new Set(
    vinculos
      .filter((r) => txt(r["sku"] ?? r["seller_sku"]) === sku)
      .map((r) => txt(r["asin"]))
      .filter(Boolean),
  );
  for (const r of adsProduto)
    if (txt(r["sku"]) === sku && txt(r["asin"])) asins.add(txt(r["asin"]));
  if (!asins.size) return null;
  const so = (rows: Row[], k = "asin") => rows.filter((r) => asins.has(txt(r[k])));
  const linhas = asin360(
    so(vendas, "child_asin"),
    so(buybox),
    so(estoque),
    so(reposicao),
    so(cadastro),
    de,
    ate,
  );
  const ads = adsProduto.filter(
    (r) =>
      (asins.has(txt(r["asin"])) || txt(r["sku"]) === sku) &&
      dia(r["data"]) >= de &&
      dia(r["data"]) <= ate,
  );
  const custo = ads.reduce((s, r) => s + n(r["cost"]), 0);
  const vendasAds = ads.reduce((s, r) => s + n(r["sales_14d"]), 0);
  const vendasTot = linhas.reduce((s, a) => s + a.vendas, 0);
  return {
    asins: [...asins],
    linhas,
    vendas: vendasTot,
    ads: {
      custo,
      vendasAtribuidas: vendasAds,
      acosPct: div(custo * 100, vendasAds),
      tacosPct: div(custo * 100, vendasTot),
    },
  };
}
