// Painel de Ads de marketplace (Mercado Livre, Amazon, Shopee): o mesmo formato para todos os canais.
// Cada canal vira linhas por campanha × dia (e, quando existe, por item/ASIN × dia para abrir a campanha).
// A tela filtra e soma no navegador, então trocar status, busca e métricas é instantâneo.
// Só leitura. Receita aqui é a venda ATRIBUÍDA pela plataforma (não somar com a venda realizada do canal).

import { etapaDaCampanha } from "@/lib/melidsp";
import { escalaPct } from "@/lib/amazon";

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const nn = (v: unknown) =>
  v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
const txt = (v: unknown) => String(v ?? "").trim();
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const div = (a: number, b: number) => (b ? a / b : null);

export type StatusCampanha = "ativo" | "pausado" | "outro";
export function statusCampanha(v: unknown): StatusCampanha {
  const s = txt(v).toLowerCase();
  if (/^(active|enabled|ativ|ongoing|running|deliver|delivering|em andamento|on)/.test(s))
    return "ativo";
  if (/(paus|paused|disabled|inativ|ended|archiv|finaliz|closed|off|stop)/.test(s))
    return "pausado";
  return "outro";
}

/** Uma linha = campanha (ou item da campanha) num dia. */
export type LinhaAds = {
  data: string;
  tipo: string; // aba: "product", "brand", "display", "SP", "SB", "SD", tipo da Shopee…
  campanhaId: string;
  campanha: string;
  status: StatusCampanha;
  itemId?: string;
  item?: string;
  investimento: number;
  receita: number;
  receitaDireta: number | null;
  receitaIndireta: number | null;
  unidades: number;
  unidadesOrganicas: number | null;
  impressoes: number;
  cliques: number;
  // Competitividade (0–100), quando o canal informa. Ponderada pelo investimento na soma.
  impressionShare: number | null;
  topImpressionShare: number | null;
  perdidoOrcamento: number | null;
  perdidoRank: number | null;
  acosBenchmark: number | null;
  // Atributos do item para filtros (ML: Buy Box, catálogo, logística).
  buyBox?: boolean | null;
  catalogo?: boolean | null;
  logistica?: string;
  statusItem?: string;
};

const vazio = (): Omit<LinhaAds, "data" | "tipo" | "campanhaId" | "campanha" | "status"> => ({
  investimento: 0,
  receita: 0,
  receitaDireta: null,
  receitaIndireta: null,
  unidades: 0,
  unidadesOrganicas: null,
  impressoes: 0,
  cliques: 0,
  impressionShare: null,
  topImpressionShare: null,
  perdidoOrcamento: null,
  perdidoRank: null,
  acosBenchmark: null,
});

// ---------------------------------------------------------------------------------------------
// Adaptadores por canal

/**
 * Mercado Livre Product Ads por item (vw_ml_pads_item_dia): a campanha vem da própria linha; o status da
 * campanha, da lista de campanhas. Receita = direta + indireta; orgânico = vendas orgânicas dos anunciados.
 */
export function linhasMlProductAds(itens: Row[], campanhas: Row[]): LinhaAds[] {
  const st = new Map(campanhas.map((c) => [txt(c["campaign_id"]), c]));
  const pct = (k: string) => escalaPct(itens.map((r) => r[k]));
  const f = {
    is: pct("impression_share"),
    tis: pct("top_impression_share"),
    lb: pct("lost_impression_share_by_budget"),
    lr: pct("lost_impression_share_by_ad_rank"),
    ab: pct("acos_benchmark"),
  };
  const p = (r: Row, k: string, fator: number) => (nn(r[k]) == null ? null : n(r[k]) * fator);
  return itens.map((r) => {
    const cid = txt(r["campaign_id"]);
    const c = st.get(cid);
    const dir = n(r["direct_amount"]);
    const ind = n(r["indirect_amount"]);
    return {
      ...vazio(),
      data: dia(r["date"]),
      tipo: "product",
      campanhaId: cid || "—",
      campanha: txt(r["campaign_name"]) || txt(c?.["name"]) || "Sem campanha",
      status: statusCampanha(c?.["status"]),
      itemId: txt(r["item_id"]),
      item: txt(r["title"]) || txt(r["item_id"]),
      investimento: n(r["cost"]),
      receita: dir + ind,
      receitaDireta: dir,
      receitaIndireta: ind,
      unidades:
        r["units_quantity"] != null
          ? n(r["units_quantity"])
          : n(r["direct_units_quantity"]) + n(r["indirect_units_quantity"]),
      unidadesOrganicas: nn(r["organic_units_quantity"]),
      impressoes: n(r["prints"]),
      cliques: n(r["clicks"]),
      impressionShare: p(r, "impression_share", f.is),
      topImpressionShare: p(r, "top_impression_share", f.tis),
      perdidoOrcamento: p(r, "lost_impression_share_by_budget", f.lb),
      perdidoRank: p(r, "lost_impression_share_by_ad_rank", f.lr),
      acosBenchmark: p(r, "acos_benchmark", f.ab),
      buyBox: r["buy_box_winner"] == null ? null : r["buy_box_winner"] === true,
      catalogo: r["catalog_listing"] == null ? null : r["catalog_listing"] === true,
      logistica: txt(r["logistic_type"]),
      statusItem: txt(r["status"]),
    };
  });
}

/** Mercado Livre Display por campanha (vw_ml_display_campanha_dia). Receita = receita atribuída do relatório. */
export function linhasMlDisplay(rows: Row[]): LinhaAds[] {
  return rows.map((r) => ({
    ...vazio(),
    data: dia(r["data"]),
    tipo: "display",
    campanhaId: txt(r["campaign_id"]) || "—",
    campanha: txt(r["campaign_name"]) || txt(r["campaign_id"]),
    status: statusCampanha(r["status"]),
    investimento: n(r["investimento"]),
    receita: n(r["receita"]),
    unidades: n(r["unidades"]),
    impressoes: n(r["impressoes"]),
    cliques: n(r["cliques"]),
  }));
}

/** Mercado Livre Brand Ads: o banco só tem o investimento diário da conta (tab_ml_kpi_dia.invest_brand). */
export function linhasMlBrand(kpi: Row[]): LinhaAds[] {
  return kpi
    .filter((r) => n(r["invest_brand"]) > 0)
    .map((r) => ({
      ...vazio(),
      data: dia(r["data"]),
      tipo: "brand",
      campanhaId: "conta",
      campanha: "Brand Ads (total da conta)",
      status: "outro" as StatusCampanha,
      investimento: n(r["invest_brand"]),
    }));
}

/**
 * Amazon: saída de `adsUnificados` (SP + SB + SD por campanha e dia) e, para abrir a campanha, os produtos
 * anunciados (fact_amazon_ads_produto_dia, SP). Receita = venda na janela do Console (SP 7d, SB/SD 14d).
 */
export function linhasAmazon(ads: Row[], campanhas: Row[]): LinhaAds[] {
  const st = new Map(campanhas.map((c) => [txt(c["campaign_id"]), c]));
  const fIs = escalaPct(ads.map((r) => r["top_search_is"]));
  return ads.map((r) => {
    const cid = txt(r["campaign_id"]);
    const c = st.get(cid);
    const tipo = txt(r["ad_type"]) || "SP";
    const unid =
      tipo === "SP"
        ? r["janela"] === "7d" && r["units_7d"] != null
          ? n(r["units_7d"])
          : n(r["units_14d"])
        : n(r["units_sold"]);
    return {
      ...vazio(),
      data: dia(r["data"]),
      tipo,
      campanhaId: cid || "—",
      campanha: txt(r["campaign_name"]) || txt(c?.["campaign_name"]) || cid || "—",
      status: statusCampanha(c?.["status"] ?? r["campaign_status"]),
      investimento: n(r["cost"]),
      receita: r["sales_padrao"] != null ? n(r["sales_padrao"]) : n(r["sales_14d"]),
      unidades: unid,
      impressoes: n(r["impressions"]),
      cliques: n(r["clicks"]),
      topImpressionShare: nn(r["top_search_is"]) == null ? null : n(r["top_search_is"]) * fIs,
    };
  });
}

/** Amazon: produtos anunciados por campanha (SP), para a linha que abre. Venda em 14 dias (é o que a tabela tem). */
export function itensAmazon(
  produtos: Row[],
  campanhas: Row[],
  titulos: Map<string, string>,
): LinhaAds[] {
  const st = new Map(campanhas.map((c) => [txt(c["campaign_id"]), c]));
  return produtos.map((r) => {
    const cid = txt(r["campaign_id"]);
    const asin = txt(r["asin"]);
    return {
      ...vazio(),
      data: dia(r["data"]),
      tipo: txt(r["ad_type"]).toUpperCase().startsWith("SD") ? "SD" : "SP",
      campanhaId: cid || "—",
      campanha: txt(r["campaign_name"]) || cid,
      status: statusCampanha(st.get(cid)?.["status"]),
      itemId: asin,
      item: titulos.get(asin) || txt(r["sku"]) || asin,
      investimento: n(r["cost"]),
      receita: n(r["sales_14d"]),
      unidades: n(r["units_14d"]),
      impressoes: n(r["impressions"]),
      cliques: n(r["clicks"]),
    };
  });
}

/**
 * Shopee Ads por campanha (fact_shopee_ads_campanha_dia). Receita = GMV amplo (broad); direta = GMV direto;
 * indireta = amplo − direto. "Unidades" = pedidos amplos (a Shopee reporta pedidos, não unidades).
 */
export function linhasShopee(dias: Row[], campanhas: Row[]): LinhaAds[] {
  const dim = new Map(campanhas.map((c) => [txt(c["campaign_id"]), c]));
  return dias.map((r) => {
    const cid = txt(r["campaign_id"]);
    const c = dim.get(cid);
    const ampla = n(r["broad_gmv"]);
    const direta = n(r["direct_gmv"]);
    return {
      ...vazio(),
      data: dia(r["data"]),
      tipo: txt(r["ad_type"]) || txt(c?.["ad_type"]) || "outros",
      campanhaId: cid || "—",
      campanha: txt(c?.["ad_name"]) || cid,
      status: statusCampanha(c?.["campaign_status"]),
      investimento: n(r["expense"]),
      receita: ampla,
      receitaDireta: direta,
      receitaIndireta: Math.max(0, ampla - direta),
      unidades: r["broad_order"] != null ? n(r["broad_order"]) : n(r["direct_order"]),
      impressoes: n(r["impression"]),
      cliques: n(r["clicks"]),
    };
  });
}

// ---------------------------------------------------------------------------------------------
// Agregação (roda no navegador)

export type Metricas = {
  investimento: number;
  receita: number;
  receitaDireta: number | null;
  receitaIndireta: number | null;
  unidades: number;
  unidadesOrganicas: number | null;
  impressoes: number;
  cliques: number;
  roas: number | null;
  acos: number | null;
  cvr: number | null;
  ctr: number | null;
  cpc: number | null;
};

type Acum = {
  investimento: number;
  receita: number;
  receitaDireta: number | null;
  receitaIndireta: number | null;
  unidades: number;
  unidadesOrganicas: number | null;
  impressoes: number;
  cliques: number;
};
const novoAcum = (): Acum => ({
  investimento: 0,
  receita: 0,
  receitaDireta: null,
  receitaIndireta: null,
  unidades: 0,
  unidadesOrganicas: null,
  impressoes: 0,
  cliques: 0,
});
const soma = (a: Acum, l: LinhaAds) => {
  a.investimento += l.investimento;
  a.receita += l.receita;
  if (l.receitaDireta != null) a.receitaDireta = (a.receitaDireta ?? 0) + l.receitaDireta;
  if (l.receitaIndireta != null) a.receitaIndireta = (a.receitaIndireta ?? 0) + l.receitaIndireta;
  a.unidades += l.unidades;
  if (l.unidadesOrganicas != null)
    a.unidadesOrganicas = (a.unidadesOrganicas ?? 0) + l.unidadesOrganicas;
  a.impressoes += l.impressoes;
  a.cliques += l.cliques;
};
export const metricas = (a: Acum): Metricas => ({
  ...a,
  roas: div(a.receita, a.investimento),
  acos: div(a.investimento * 100, a.receita),
  cvr: div(a.unidades * 100, a.cliques),
  ctr: div(a.cliques * 100, a.impressoes),
  cpc: div(a.investimento, a.cliques),
});

export type FiltrosAds = {
  tipo?: string;
  status?: "todos" | "ativo" | "pausado";
  busca?: string;
  buyBox?: "todos" | "ganhando" | "perdendo";
  catalogo?: "todos" | "catalogo" | "nao";
  logistica?: string; // "" = todas
};

export function filtraLinhas(linhas: LinhaAds[], f: FiltrosAds, de: string, ate: string) {
  const busca = (f.busca ?? "").trim().toLowerCase();
  return linhas.filter(
    (l) =>
      l.data >= de &&
      l.data <= ate &&
      (!f.tipo || f.tipo === "*" || l.tipo === f.tipo) &&
      (!f.status || f.status === "todos" || l.status === f.status) &&
      (!busca ||
        l.campanha.toLowerCase().includes(busca) ||
        (l.item ?? "").toLowerCase().includes(busca) ||
        (l.itemId ?? "").toLowerCase().includes(busca)) &&
      (!f.buyBox || f.buyBox === "todos" || l.buyBox === (f.buyBox === "ganhando")) &&
      (!f.catalogo || f.catalogo === "todos" || l.catalogo === (f.catalogo === "catalogo")) &&
      (!f.logistica || l.logistica === f.logistica),
  );
}

export type CampanhaPainel = Metricas & {
  id: string;
  nome: string;
  status: StatusCampanha;
  itens: (Metricas & { id: string; nome: string })[];
};

/**
 * Totais, série diária, campanhas (com itens) e competitividade das linhas já filtradas.
 * `itens` (opcional) são linhas por item de outras tabelas (Amazon): só abrem a campanha, não entram nos totais.
 * Quando as próprias linhas têm item (ML), a campanha soma os itens e abre neles.
 */
export function painelAds(linhas: LinhaAds[], itens: LinhaAds[] = []) {
  const tot = novoAcum();
  const porDia = new Map<string, Acum>();
  const porCamp = new Map<
    string,
    {
      acum: Acum;
      nome: string;
      status: StatusCampanha;
      itens: Map<string, { acum: Acum; nome: string }>;
    }
  >();
  const comp = { is: 0, tis: 0, lb: 0, lr: 0, ab: 0, wIs: 0, wTis: 0, wLb: 0, wLr: 0, wAb: 0 };
  const pesa = (v: number | null, w: number, k: "is" | "tis" | "lb" | "lr" | "ab") => {
    if (v == null) return;
    const kw = ("w" + k.charAt(0).toUpperCase() + k.slice(1)) as
      "wIs" | "wTis" | "wLb" | "wLr" | "wAb";
    comp[k] += v * w;
    comp[kw] += w;
  };
  const addItem = (l: LinhaAds) => {
    if (!l.itemId) return;
    const c = porCamp.get(l.campanhaId) ?? {
      acum: novoAcum(),
      nome: l.campanha,
      status: l.status,
      itens: new Map(),
    };
    const it = c.itens.get(l.itemId) ?? { acum: novoAcum(), nome: l.item || l.itemId };
    soma(it.acum, l);
    c.itens.set(l.itemId, it);
    porCamp.set(l.campanhaId, c);
  };
  for (const l of linhas) {
    soma(tot, l);
    const d = porDia.get(l.data) ?? novoAcum();
    soma(d, l);
    porDia.set(l.data, d);
    const c = porCamp.get(l.campanhaId) ?? {
      acum: novoAcum(),
      nome: l.campanha,
      status: l.status,
      itens: new Map(),
    };
    soma(c.acum, l);
    porCamp.set(l.campanhaId, c);
    if (l.itemId) addItem(l);
    const w = l.investimento || 0.0001;
    pesa(l.impressionShare, w, "is");
    pesa(l.topImpressionShare, w, "tis");
    pesa(l.perdidoOrcamento, w, "lb");
    pesa(l.perdidoRank, w, "lr");
    pesa(l.acosBenchmark, w, "ab");
  }
  const comCampanha = new Set(porCamp.keys());
  for (const it of itens) if (comCampanha.has(it.campanhaId)) addItem(it);
  const campanhas: CampanhaPainel[] = [...porCamp.entries()]
    .map(([id, c]) => ({
      id,
      nome: c.nome,
      status: c.status,
      ...metricas(c.acum),
      itens: [...c.itens.entries()]
        .map(([iid, x]) => ({ id: iid, nome: x.nome, ...metricas(x.acum) }))
        .sort((a, b) => b.investimento - a.investimento),
    }))
    .sort((a, b) => b.investimento - a.investimento || a.nome.localeCompare(b.nome));
  const m = metricas(tot);
  const media = (k: "is" | "tis" | "lb" | "lr" | "ab") => {
    const kw = ("w" + k.charAt(0).toUpperCase() + k.slice(1)) as
      "wIs" | "wTis" | "wLb" | "wLr" | "wAb";
    return comp[kw] ? comp[k] / comp[kw] : null;
  };
  const competitividade = {
    impressionShare: media("is"),
    topImpressionShare: media("tis"),
    perdidoOrcamento: media("lb"),
    perdidoRank: media("lr"),
    acosBenchmark: media("ab"),
  };
  return {
    totais: m,
    serie: [...porDia.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([data, a]) => ({ data, ...metricas(a) })),
    campanhas,
    competitividade: Object.values(competitividade).some((v) => v != null) ? competitividade : null,
    composicao:
      m.receitaDireta != null || m.unidadesOrganicas != null
        ? {
            direta: m.receitaDireta,
            indireta: m.receitaIndireta,
            unidadesAds: m.unidades,
            unidadesOrganicas: m.unidadesOrganicas,
          }
        : null,
  };
}

/** Opções de logística presentes (para o filtro). */
export const logisticas = (linhas: LinhaAds[]) =>
  [...new Set(linhas.map((l) => l.logistica).filter((x): x is string => !!x))].sort();

// ---------------------------------------------------------------------------------------------
// Abas do painel

export type AbaAds = { id: string; label: string; aviso?: string };

/** Abas a partir dos tipos presentes nas linhas, na ordem preferida; tipos sem nome conhecido entram no fim. */
export function abasDe(
  linhas: LinhaAds[],
  conhecidas: AbaAds[],
  sempre: string[] = [],
  rotulo?: (tipo: string) => string,
  todas?: string,
): AbaAds[] {
  const tipos = new Set(linhas.map((l) => l.tipo));
  const out = conhecidas.filter((a) => tipos.has(a.id) || sempre.includes(a.id));
  for (const t of tipos)
    if (!out.some((a) => a.id === t)) out.push({ id: t, label: rotulo ? rotulo(t) : t });
  return todas && tipos.size > 1 ? [{ id: "*", label: todas }, ...out] : out;
}

// ---------------------------------------------------------------------------------------------
// Mídia: Meta, Google, TikTok Ads, Meli DSP e visão geral por canal

/** Aba que mostra todos os tipos. */
export const TODOS_TIPOS = "*";

const OBJETIVO_META: Record<string, string> = {
  OUTCOME_SALES: "Vendas",
  OUTCOME_TRAFFIC: "Tráfego",
  OUTCOME_ENGAGEMENT: "Engajamento",
  OUTCOME_AWARENESS: "Reconhecimento",
  OUTCOME_LEADS: "Leads",
  OUTCOME_APP_PROMOTION: "App",
  CONVERSIONS: "Conversões",
  LINK_CLICKS: "Tráfego",
};
export const rotuloObjetivoMeta = (v: string) => OBJETIVO_META[v] ?? (v || "Sem objetivo");

/**
 * Meta por campanha (vw_meta_campanha_diario). Receita = valor de compra informado pelo pixel/API (atribuído pela
 * Meta, não a venda do site). "Unidades" = compras. Tipo = objetivo da campanha. Status pela config da campanha.
 */
export function linhasMeta(dias: Row[], config: Row[]): LinhaAds[] {
  const st = new Map(config.map((c) => [txt(c["campaign_id"]), c]));
  return dias.map((r) => {
    const cid = txt(r["campaign_id"]);
    const c = st.get(cid);
    return {
      ...vazio(),
      data: dia(r["data"]),
      tipo: txt(r["objetivo"]) || txt(c?.["objetivo"]) || "—",
      campanhaId: cid || "—",
      campanha: txt(r["campaign_name"]) || txt(c?.["campaign_name"]) || cid,
      status: statusCampanha(c?.["effective_status"] ?? c?.["configured_status"]),
      investimento: n(r["gasto"]),
      receita: n(r["receita"]),
      unidades: n(r["compras"]),
      impressoes: n(r["impressoes"]),
      cliques: n(r["cliques"]),
    };
  });
}

/** Meta por anúncio (vw_meta_ad_diario), para abrir a campanha. */
export function itensMeta(ads: Row[]): LinhaAds[] {
  return ads.map((r) => ({
    ...vazio(),
    data: dia(r["data"]),
    tipo: txt(r["objetivo"]) || "—",
    campanhaId: txt(r["campaign_id"]) || "—",
    campanha: txt(r["campaign_name"]),
    status: "outro" as StatusCampanha,
    itemId: txt(r["ad_id"]),
    item: [txt(r["ad_name"]), txt(r["adset_name"])].filter(Boolean).join(" · ") || txt(r["ad_id"]),
    investimento: n(r["gasto"]),
    receita: n(r["receita"]),
    unidades: n(r["compras"]),
    impressoes: n(r["impressoes"]),
    cliques: n(r["cliques"]),
  }));
}

const TIPO_GOOGLE: Record<string, string> = {
  SEARCH: "Pesquisa",
  PERFORMANCE_MAX: "Performance Max",
  SHOPPING: "Shopping",
  DISPLAY: "Display",
  VIDEO: "YouTube",
  DEMAND_GEN: "Demand Gen",
  DISCOVERY: "Demand Gen",
};
export const rotuloTipoGoogle = (v: string) => TIPO_GOOGLE[v.toUpperCase()] ?? (v || "Outros");

/**
 * Google Ads por campanha (vw_google_campanha_dia). Receita = valor de conversão do Google (atribuído pela
 * plataforma); "Unidades" = conversões. Competitividade = parcela de impressões, topo e perdas.
 */
export function linhasGoogle(dias: Row[], lista: Row[]): LinhaAds[] {
  const st = new Map(lista.map((c) => [txt(c["campaign_id"]), c]));
  const f = (k: string) => escalaPct(dias.map((r) => r[k]));
  const fIs = f("fatia_impressao");
  const fTop = f("fatia_topo");
  const fLb = f("fatia_perdida_orcamento");
  const fLr = f("fatia_perdida_rank");
  const p = (r: Row, k: string, fator: number) => (nn(r[k]) == null ? null : n(r[k]) * fator);
  return dias.map((r) => {
    const cid = txt(r["campaign_id"]);
    const c = st.get(cid);
    return {
      ...vazio(),
      data: dia(r["data"]),
      tipo: (txt(r["tipo"]) || txt(c?.["tipo"]) || "outros").toUpperCase(),
      campanhaId: cid || "—",
      campanha: txt(r["campaign_name"]) || txt(c?.["campaign_name"]) || cid,
      status: statusCampanha(c?.["status"]),
      investimento: n(r["gasto"]),
      receita: n(r["receita"]),
      unidades: n(r["conversoes"]),
      impressoes: n(r["impressoes"]),
      cliques: n(r["cliques"]),
      impressionShare: p(r, "fatia_impressao", fIs),
      topImpressionShare: p(r, "fatia_topo", fTop),
      perdidoOrcamento: p(r, "fatia_perdida_orcamento", fLb),
      perdidoRank: p(r, "fatia_perdida_rank", fLr),
    };
  });
}

/** Google por grupo de anúncios (vw_google_grupo_dia), para abrir a campanha. */
export function itensGoogle(grupos: Row[]): LinhaAds[] {
  return grupos.map((r) => ({
    ...vazio(),
    data: dia(r["data"]),
    tipo: (txt(r["tipo"]) || "outros").toUpperCase(),
    campanhaId: txt(r["campaign_id"]) || "—",
    campanha: txt(r["campaign_name"]),
    status: "outro" as StatusCampanha,
    itemId: txt(r["ad_group_id"]),
    item: txt(r["ad_group_name"]) || txt(r["ad_group_id"]),
    investimento: n(r["gasto"]),
    receita: n(r["receita"]),
    unidades: n(r["conversoes"]),
    impressoes: n(r["impressoes"]),
    cliques: n(r["cliques"]),
  }));
}

/**
 * TikTok Ads por campanha: GMV Max (vw_tiktok_ads_gmv_campanha_dia) e as demais (vw_tiktok_ads_campanha_dia); um
 * id só entra uma vez (mesma regra de campanhasTikTok). "Unidades" = pedidos. O banco não traz impressões nem
 * cliques por campanha.
 */
export function linhasTikTokAds(campDia: Row[], gmvDia: Row[]): LinhaAds[] {
  const idsGmv = new Set(gmvDia.map((r) => txt(r["campaign_id"])));
  const linha = (r: Row, gmv: boolean): LinhaAds => ({
    ...vazio(),
    data: dia(r["data"]),
    tipo: txt(r["tipo"]) || (gmv ? "GMV Max" : "Outros"),
    campanhaId: txt(r["campaign_id"]) || "—",
    campanha: txt(r["campanha"]) || txt(r["campaign_id"]),
    status: "outro",
    investimento: n(r["invest"]),
    receita: n(r["receita"]),
    unidades: n(r["pedidos"]),
  });
  return [
    ...gmvDia.map((r) => linha(r, true)),
    ...campDia.filter((r) => !idsGmv.has(txt(r["campaign_id"]))).map((r) => linha(r, false)),
  ];
}

/** TikTok: criativos/produtos por campanha (vw_tiktok_ads_criativo_dia), para abrir a campanha. */
export function itensTikTokAds(criativos: Row[], linhas: LinhaAds[]): LinhaAds[] {
  const tipo = new Map(linhas.map((l) => [l.campanhaId, l.tipo]));
  return criativos
    .filter((r) => txt(r["campaign_id"]))
    .map((r) => {
      const cid = txt(r["campaign_id"]);
      const id = txt(r["item_id"]) || txt(r["product_id"]);
      return {
        ...vazio(),
        data: dia(r["data"]),
        tipo: tipo.get(cid) ?? "Outros",
        campanhaId: cid,
        campanha: txt(r["campanha"]),
        status: "outro" as StatusCampanha,
        itemId: id || txt(r["produto"]),
        item: [txt(r["produto"]), r["agregado"] === true ? "(agregado)" : txt(r["item_id"])]
          .filter(Boolean)
          .join(" · "),
        investimento: n(r["invest"]),
        receita: n(r["receita"]),
        unidades: n(r["pedidos"]),
      };
    });
}

/**
 * Meli DSP (Display do Mercado Livre) por campanha. A aba é a etapa do funil (conversão / consideração /
 * reconhecimento), a mesma regra da divisão 70/22/8 da tela (etapaDaCampanha).
 */
export function linhasMeliDsp(rows: Row[]): LinhaAds[] {
  return linhasMlDisplay(rows).map((l, i) => {
    const r = rows[i] ?? {};
    return { ...l, tipo: etapaDaCampanha(r["campaign_name"], r["tipo"], r["goal"]) };
  });
}

/** Meli DSP por line item, para abrir a campanha (a etapa vem da campanha). */
export function itensMeliDsp(rows: Row[], linhas: LinhaAds[] = []): LinhaAds[] {
  const etapa = new Map(linhas.map((l) => [l.campanhaId, l.tipo]));
  return rows.map((r) => ({
    ...vazio(),
    data: dia(r["data"]),
    tipo:
      etapa.get(txt(r["campaign_id"])) ?? etapaDaCampanha(r["campaign_name"], r["tipo"], r["goal"]),
    campanhaId: txt(r["campaign_id"]) || "—",
    campanha: txt(r["campaign_name"]),
    status: statusCampanha(r["status"]),
    itemId: txt(r["line_item_id"]),
    item: txt(r["line_item_name"]) || txt(r["line_item_id"]),
    investimento: n(r["investimento"]),
    receita: n(r["receita"]),
    unidades: n(r["unidades"]),
    impressoes: n(r["impressoes"]),
    cliques: n(r["cliques"]),
  }));
}

/** Visão geral de mídia (vw_ads_por_tipo_dia): cada canal/tipo vira uma "campanha" da tabela. */
export function linhasMidiaGeral(rows: Row[]): LinhaAds[] {
  return rows.map((r) => {
    const t = txt(r["tipo"]) || "—";
    return {
      ...vazio(),
      data: dia(r["data"]),
      tipo: "canal",
      campanhaId: t,
      campanha: t,
      status: "outro" as StatusCampanha,
      investimento: n(r["investimento"]),
      receita: n(r["receita"]),
      unidades: n(r["unidades"]),
      impressoes: n(r["impressoes"]),
      cliques: n(r["cliques"]),
    };
  });
}
