// Amazon, segunda leva (benchmarks/amazon/REVISAO_IMPLEMENTACAO.md §3): o que já estava no banco e nenhuma tela lia.
// Tendência semanal e "hoje até agora", Buy Box completo, nota de qualidade do anúncio, estoque FBA detalhado
// (vencido, recebimento, reservado), termos de Sponsored Brands, Sponsored Display por produto, campanhas no limite
// do orçamento e pedidos (cancelamento, FBA × envio próprio). Só leitura e recomendação.
//
// LGPD: dos pedidos, só id, data, status, canal de envio, SKU/ASIN, quantidade e valor. Cidade, UF e CEP não são lidos.

import { escalaPct } from "@/lib/amazon";

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const nn = (v: unknown) =>
  v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
const txt = (v: unknown) => String(v ?? "").trim();
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const div = (a: number, b: number) => (b ? a / b : null);
const somaDias = (iso: string, d: number) =>
  new Date(Date.parse(iso + "T00:00:00Z") + d * 86400000).toISOString().slice(0, 10);

// ---------------------------------------------------------------------------------------------
// Tendência semanal (vw_amazon_tendencia_semana)

export type SemanaAmazon = {
  semana: string;
  rotulo: string;
  faturamento: number;
  pedidos: number;
  unidades: number;
  investAds: number;
  tacosPct: number | null;
  roasAds: number | null;
  roasTotal: number | null;
  conversaoPct: number | null;
  devolucaoPct: number | null;
  parcial: boolean;
  adsMaturando: boolean;
};

/**
 * @param adsSemana  investimento e venda atribuída por semana com SP + SB + SD (`adsPorSemana`). Quando vem,
 *                   substitui invest_ads/TACoS/ROAS de Ads da view, que pode trazer só Sponsored Products.
 */
export function tendenciaSemanal(
  rows: Row[],
  semanas = 12,
  adsSemana?: Map<string, { custo: number; vendas: number }>,
) {
  const fC = escalaPct(rows.map((r) => r["conversao_pct"]));
  const fD = escalaPct(rows.map((r) => r["devolucao_pct"]));
  const fT = escalaPct(rows.map((r) => r["tacos_pct"]));
  const lista: SemanaAmazon[] = rows
    .map((r) => {
      const ini = dia(r["semana_ini"]);
      return {
        semana: ini,
        rotulo: ini ? ini.slice(8, 10) + "/" + ini.slice(5, 7) : txt(r["semana"]),
        faturamento: n(r["faturamento"]),
        pedidos: n(r["pedidos"]),
        unidades: n(r["unidades"]),
        investAds: adsSemana ? (adsSemana.get(ini)?.custo ?? 0) : n(r["invest_ads"]),
        tacosPct: adsSemana
          ? div((adsSemana.get(ini)?.custo ?? 0) * 100, n(r["faturamento"]))
          : nn(r["tacos_pct"]) == null
            ? null
            : n(r["tacos_pct"]) * fT,
        roasAds: adsSemana
          ? div(adsSemana.get(ini)?.vendas ?? 0, adsSemana.get(ini)?.custo ?? 0)
          : nn(r["roas_ads"]),
        roasTotal: nn(r["roas_total"]),
        conversaoPct: nn(r["conversao_pct"]) == null ? null : n(r["conversao_pct"]) * fC,
        devolucaoPct: nn(r["devolucao_pct"]) == null ? null : n(r["devolucao_pct"]) * fD,
        parcial: r["parcial"] === true,
        adsMaturando: r["ads_maturando"] === true,
      };
    })
    .filter((s) => s.semana)
    .sort((a, b) => a.semana.localeCompare(b.semana))
    .slice(-semanas);
  // Comparação só entre semanas fechadas (a parcial ainda está acontecendo).
  const fechadas = lista.filter((s) => !s.parcial);
  const ultima = fechadas.at(-1) ?? null;
  const anterior = fechadas.at(-2) ?? null;
  const varPct = (k: "faturamento" | "pedidos" | "investAds") =>
    ultima && anterior && anterior[k] ? ((ultima[k] - anterior[k]) / anterior[k]) * 100 : null;
  return {
    semanas: lista,
    ultima,
    anterior,
    variacao: {
      faturamentoPct: varPct("faturamento"),
      pedidosPct: varPct("pedidos"),
      investAdsPct: varPct("investAds"),
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Hoje até agora (vw_amazon_venda_intraday)

/**
 * Venda de hoje por faixa de horário × as mesmas faixas 7 dias antes. [HIPÓTESE] cada linha é uma faixa sem
 * sobreposição (somar dá o total); a comparação usa só as faixas que já aparecem hoje, para ser "até agora".
 */
export function hojeAteAgora(rows: Row[], hoje: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(hoje))
    return {
      data: null,
      semanaPassada: "",
      linhas: [] as { faixa: string; hoje: number; semanaPassada: number; pedidosHoje: number }[],
      venda: 0,
      pedidos: 0,
      vendaSemanaPassada: 0,
      variacaoPct: null as number | null,
    };
  const semanaPassada = somaDias(hoje, -7);
  const agrega = (d: string) => {
    const m = new Map<string, { venda: number; pedidos: number; unidades: number }>();
    for (const r of rows) {
      if (dia(r["data"]) !== d) continue;
      const f = txt(r["faixa"]) || "—";
      const cur = m.get(f) ?? { venda: 0, pedidos: 0, unidades: 0 };
      cur.venda += n(r["venda_total"]);
      cur.pedidos += n(r["pedidos"]);
      cur.unidades += n(r["unidades"]);
      m.set(f, cur);
    }
    return m;
  };
  const h = agrega(hoje);
  const p = agrega(semanaPassada);
  const faixas = [...h.keys()].sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
  const linhas = faixas.map((f) => ({
    faixa: f,
    hoje: h.get(f)!.venda,
    semanaPassada: p.get(f)?.venda ?? 0,
    pedidosHoje: h.get(f)!.pedidos,
  }));
  const tot = (k: "hoje" | "semanaPassada") => linhas.reduce((s, l) => s + l[k], 0);
  const hojeV = tot("hoje");
  const passadaV = tot("semanaPassada");
  return {
    data: faixas.length ? hoje : null,
    semanaPassada,
    linhas,
    venda: hojeV,
    pedidos: linhas.reduce((s, l) => s + l.pedidosHoje, 0),
    vendaSemanaPassada: passadaV,
    variacaoPct: passadaV ? ((hojeV - passadaV) / passadaV) * 100 : null,
  };
}

// ---------------------------------------------------------------------------------------------
// Buy Box completo (dim_amazon_buybox)

export type BuyBoxAsin = {
  asin: string;
  titulo: string;
  vendas: number;
  ganha: boolean | null;
  meuPreco: number | null;
  precoBuyBox: number | null;
  difBuyBoxPct: number | null;
  menorConcorrente: number | null;
  ofertas: number | null;
  concorrentes: number | null;
  buyboxFba: boolean | null;
  leitura: string;
};

/** Uma linha por ASIN da dim (estado atual), com a venda do período para ordenar. */
export function buyBoxCompleto(
  buybox: Row[],
  vendasPorAsin: Map<string, number>,
  titulos: Map<string, string>,
) {
  const brl = (v: number) => "R$ " + v.toFixed(2).replace(".", ",");
  const lista: BuyBoxAsin[] = buybox
    .map((r) => {
      const asin = txt(r["asin"]);
      const ganha = r["ganho_buybox"] == null ? null : r["ganho_buybox"] === true;
      const meu = nn(r["meu_preco"]);
      const bb = nn(r["buybox_preco"]);
      const dif = meu != null && bb != null && bb > 0 ? ((meu - bb) / bb) * 100 : null;
      const fba = r["buybox_fba"] == null ? null : r["buybox_fba"] === true;
      let leitura = "";
      if (ganha === false && dif != null && dif > 0.5)
        leitura = `Nosso preço está ${dif.toFixed(1).replace(".", ",")}% acima da Buy Box (${brl(bb!)}).`;
      else if (ganha === false && dif != null)
        leitura =
          "Preço igual ou abaixo da Buy Box e mesmo assim sem ela: olhar FBA, prazo e métricas da conta.";
      else if (ganha === false) leitura = "Sem a Buy Box.";
      else if (ganha && n(r["n_ofertas"]) >= 5)
        leitura = "Com a Buy Box, mas disputada por 5+ ofertas.";
      return {
        asin,
        titulo: titulos.get(asin) || asin,
        vendas: vendasPorAsin.get(asin) ?? 0,
        ganha,
        meuPreco: meu,
        precoBuyBox: bb,
        difBuyBoxPct: dif,
        menorConcorrente: nn(r["menor_preco_concorrente"]),
        ofertas: nn(r["n_ofertas"]),
        concorrentes: nn(r["n_concorrentes"]),
        buyboxFba: fba,
        leitura,
      };
    })
    .filter((x) => x.asin)
    .sort((a, b) => Number(a.ganha !== false) - Number(b.ganha !== false) || b.vendas - a.vendas);
  return {
    lista: lista.slice(0, 80),
    semBuyBox: lista.filter((x) => x.ganha === false).length,
    vendaSemBuyBox: lista.filter((x) => x.ganha === false).reduce((s, x) => s + x.vendas, 0),
    acimaDaBuyBox: lista.filter((x) => x.ganha === false && (x.difBuyBoxPct ?? 0) > 0.5).length,
  };
}

// ---------------------------------------------------------------------------------------------
// Nota de qualidade do anúncio (dim_amazon_cadastro)

/**
 * [HIPÓTESE] Pesos e mínimos de boas práticas para suplemento, a calibrar com a Malu: fotos ≥ 7 (20), bullets ≥ 5
 * (20), A+ (15), ingredientes (15, obrigatório na prática para suplemento), descrição (10), título entre 80 e 200
 * caracteres (10) e cadastro sem campos faltando (10). Fotos e bullets parciais contam proporcionalmente.
 */
export const CRITERIOS_ANUNCIO = {
  fotosMin: 7,
  bulletsMin: 5,
  tituloMin: 80,
  tituloMax: 200,
  pesos: {
    fotos: 20,
    bullets: 20,
    aplus: 15,
    ingredientes: 15,
    descricao: 10,
    titulo: 10,
    cadastro: 10,
  },
} as const;

export type QualidadeAnuncio = {
  asin: string;
  titulo: string;
  nota: number;
  vendas: number;
  fotos: number | null;
  bullets: number | null;
  temAplus: boolean | null;
  temDescricao: boolean | null;
  temIngredientes: boolean | null;
  tituloChars: number | null;
  bsr: number | null;
  bsrCategoria: string;
  melhorias: string[];
};

export function qualidadeAnuncio(cadastro: Row[], vendasPorAsin: Map<string, number>) {
  const C = CRITERIOS_ANUNCIO;
  const P = C.pesos;
  const lista: QualidadeAnuncio[] = cadastro
    .map((r) => {
      const asin = txt(r["asin"]);
      const fotos = nn(r["n_fotos"]);
      const bullets = nn(r["n_bullets"]);
      const aplus = r["tem_aplus"] == null ? null : r["tem_aplus"] === true;
      const desc = r["tem_descricao"] == null ? null : r["tem_descricao"] === true;
      const ingr = r["tem_ingredientes"] == null ? null : r["tem_ingredientes"] === true;
      const chars = nn(r["comprimento_titulo"]) ?? (txt(r["titulo"]).length || null);
      const faltas = Array.isArray(r["faltas"])
        ? (r["faltas"] as unknown[]).map(txt).filter(Boolean)
        : [];
      const m: string[] = [];
      let nota = 0;
      nota += P.fotos * Math.min(1, (fotos ?? 0) / C.fotosMin);
      if ((fotos ?? 0) < C.fotosMin) m.push(`fotos: ${fotos ?? 0} de ${C.fotosMin}`);
      nota += P.bullets * Math.min(1, (bullets ?? 0) / C.bulletsMin);
      if ((bullets ?? 0) < C.bulletsMin) m.push(`bullets: ${bullets ?? 0} de ${C.bulletsMin}`);
      if (aplus) nota += P.aplus;
      else m.push("sem A+");
      if (ingr) nota += P.ingredientes;
      else m.push("sem ingredientes");
      if (desc) nota += P.descricao;
      else m.push("sem descrição");
      if (chars != null && chars >= C.tituloMin && chars <= C.tituloMax) nota += P.titulo;
      else if (chars != null)
        m.push(chars < C.tituloMin ? `título curto (${chars})` : `título longo (${chars})`);
      if (!faltas.length) nota += P.cadastro;
      else m.push(`cadastro: falta ${faltas.join(", ")}`);
      return {
        asin,
        titulo: txt(r["titulo"]) || asin,
        nota: Math.round(nota),
        vendas: vendasPorAsin.get(asin) ?? 0,
        fotos,
        bullets,
        temAplus: aplus,
        temDescricao: desc,
        temIngredientes: ingr,
        tituloChars: chars,
        bsr: nn(r["bsr"]),
        bsrCategoria: txt(r["bsr_categoria"]) || txt(r["categoria"]),
        melhorias: m,
      };
    })
    .filter((x) => x.asin);
  // Primeiro o que mais vende com nota baixa: é onde melhorar o anúncio rende mais.
  lista.sort((a, b) => a.nota - b.nota || b.vendas - a.vendas);
  const media = lista.length ? lista.reduce((s, x) => s + x.nota, 0) / lista.length : null;
  return {
    lista: lista.slice(0, 80),
    notaMedia: media,
    abaixoDe70: lista.filter((x) => x.nota < 70).length,
    semIngredientes: lista.filter((x) => x.temIngredientes === false).length,
  };
}

// ---------------------------------------------------------------------------------------------
// Estoque FBA detalhado (dim_amazon_estoque_sp)

export type EstoqueFba = {
  sku: string;
  asin: string;
  titulo: string;
  disponivel: number;
  reservado: number;
  reservadoPedido: number;
  reservadoTransferencia: number;
  reservadoProcessamento: number;
  aCaminho: number;
  emRecebimento: number;
  vencido: number;
  danificado: number;
  imprestavel: number;
  coberturaDias: number | null;
  sinais: string[];
};

/**
 * Por SKU: disponível, reservado (pedido, transferência entre CDs, processamento), envio a caminho, em
 * recebimento e imprestável (com a parte vencida). [FATO] o banco guarda só a foto atual: sem histórico não dá
 * para saber há quantos dias um envio está em recebimento; o sinal é "em recebimento com cobertura curta".
 */
export function estoqueFba(estoque: Row[], reposicao: Row[], { coberturaMin = 14 } = {}) {
  const rep = new Map(reposicao.map((r) => [txt(r["sku"]), r]));
  const m = new Map<string, EstoqueFba>();
  for (const r of estoque) {
    const sku = txt(r["seller_sku"]);
    if (!sku) continue;
    const rp = rep.get(sku);
    const cur =
      m.get(sku) ??
      ({
        sku,
        asin: txt(r["asin"]),
        titulo: txt(r["product_name"]) || txt(rp?.["titulo"]) || sku,
        disponivel: 0,
        reservado: 0,
        reservadoPedido: 0,
        reservadoTransferencia: 0,
        reservadoProcessamento: 0,
        aCaminho: 0,
        emRecebimento: 0,
        vencido: 0,
        danificado: 0,
        imprestavel: 0,
        coberturaDias: rp?.["cobertura_dias"] == null ? null : n(rp["cobertura_dias"]),
        sinais: [],
      } as EstoqueFba);
    cur.disponivel += n(r["fulfillable"]);
    cur.reservado += n(r["reservado_total"]);
    cur.reservadoPedido += n(r["reservado_pedido"]);
    cur.reservadoTransferencia += n(r["reservado_transito"]);
    cur.reservadoProcessamento += n(r["reservado_fc"]);
    cur.aCaminho += n(r["inbound_working"]) + n(r["inbound_shipped"]);
    cur.emRecebimento += n(r["inbound_receiving"]);
    cur.vencido += n(r["imprestavel_vencido"]);
    cur.danificado +=
      n(r["imprestavel_danificado_armazem"]) +
      n(r["imprestavel_danificado_cliente"]) +
      n(r["imprestavel_defeito"]);
    cur.imprestavel += n(r["imprestavel_total"]);
    m.set(sku, cur);
  }
  const lista = [...m.values()].map((x) => {
    const s: string[] = [];
    if (x.vencido > 0) s.push(`${x.vencido} vencida(s)`);
    if (x.emRecebimento > 0 && x.coberturaDias != null && x.coberturaDias < coberturaMin)
      s.push("recebendo, cobertura curta");
    if (x.disponivel === 0 && x.reservado > 0) s.push("tudo reservado");
    if (x.danificado > 0) s.push(`${x.danificado} danificada(s)`);
    return { ...x, sinais: s };
  });
  lista.sort(
    (a, b) =>
      b.vencido - a.vencido ||
      b.sinais.length - a.sinais.length ||
      (a.coberturaDias ?? Infinity) - (b.coberturaDias ?? Infinity),
  );
  const soma = (k: keyof EstoqueFba) => lista.reduce((s, x) => s + (x[k] as number), 0);
  return {
    lista: lista.slice(0, 120),
    totais: {
      disponivel: soma("disponivel"),
      reservado: soma("reservado"),
      aCaminho: soma("aCaminho"),
      emRecebimento: soma("emRecebimento"),
      vencido: soma("vencido"),
      danificado: soma("danificado"),
      imprestavel: soma("imprestavel"),
    },
    skusComVencido: lista.filter((x) => x.vencido > 0).length,
  };
}

// ---------------------------------------------------------------------------------------------
// Ads: Sponsored Brands (termos), Sponsored Display (produto) e orçamento

/** Linhas de SB search term no formato que `termosAds` lê (SB reporta compras e venda sem sufixo de janela). */
export const sbParaTermos = (rows: Row[]) =>
  rows.map((r) => ({
    data: r["data"],
    campaign_name: r["campaign_name"],
    search_term: r["search_term"],
    keyword_text: r["keyword"],
    match_type: r["match_type"],
    cost: r["cost"],
    clicks: r["clicks"],
    purchases_14d: r["purchases"],
    sales_14d: r["sales"],
  }));

/** Sponsored Display por produto anunciado (não há relatório de termo de busca em SD). */
export function sdPorProduto(rows: Row[], de: string, ate: string, titulos: Map<string, string>) {
  const m = new Map<
    string,
    { asin: string; sku: string; custo: number; cliques: number; compras: number; vendas: number }
  >();
  for (const r of rows) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    const asin = txt(r["asin"]);
    if (!asin) continue;
    const cur = m.get(asin) ?? {
      asin,
      sku: txt(r["sku"]),
      custo: 0,
      cliques: 0,
      compras: 0,
      vendas: 0,
    };
    cur.custo += n(r["cost"]);
    cur.cliques += n(r["clicks"]);
    cur.compras += n(r["purchases"]);
    cur.vendas += n(r["sales"]);
    m.set(asin, cur);
  }
  return [...m.values()]
    .map((x) => ({
      ...x,
      titulo: titulos.get(x.asin) || x.sku || x.asin,
      acosPct: div(x.custo * 100, x.vendas),
    }))
    .sort((a, b) => b.custo - a.custo)
    .slice(0, 40);
}

export type CampanhaOrcamento = {
  campanha: string;
  tipo: string;
  orcamento: number;
  diasComGasto: number;
  diasNoLimite: number;
  custo: number;
  vendas: number;
  acosPct: number | null;
  leitura: string;
};

/**
 * Campanha "batendo no orçamento": dias em que o gasto chegou a ≥ 95% do orçamento diário. [INFERÊNCIA]
 * `dim_amazon_ads_campanha.budget` é o orçamento diário ATUAL (a dim não guarda histórico): mudança recente de
 * orçamento distorce a contagem. Só campanhas ativas.
 */
export function campanhasNoLimite(
  dias: Row[],
  campanhas: Row[],
  de: string,
  ate: string,
  { limitePct = 95, minDiasPct = 30, top = 20 } = {},
) {
  const dim = new Map(campanhas.map((c) => [txt(c["campaign_id"]), c]));
  const m = new Map<string, { custo: number; vendas: number; dias: Map<string, number> }>();
  for (const r of dias) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    const id = txt(r["campaign_id"]);
    if (!id) continue;
    const cur = m.get(id) ?? { custo: 0, vendas: 0, dias: new Map() };
    cur.custo += n(r["cost"]);
    cur.vendas += r["sales_padrao"] != null ? n(r["sales_padrao"]) : n(r["sales_14d"]);
    cur.dias.set(d, (cur.dias.get(d) ?? 0) + n(r["cost"]));
    m.set(id, cur);
  }
  const custoT = [...m.values()].reduce((s, x) => s + x.custo, 0);
  const vendasT = [...m.values()].reduce((s, x) => s + x.vendas, 0);
  const acosRef = div(custoT * 100, vendasT);
  const lista: CampanhaOrcamento[] = [];
  for (const [id, x] of m) {
    const c = dim.get(id);
    const orc = n(c?.["budget"]);
    const status = txt(c?.["status"]).toLowerCase();
    if (!c || orc <= 0 || (status && !/enabled|ativ|deliver|running/.test(status))) continue;
    const comGasto = [...x.dias.values()].filter((v) => v > 0).length;
    const noLimite = [...x.dias.values()].filter((v) => v >= (orc * limitePct) / 100).length;
    if (!comGasto || (noLimite / comGasto) * 100 < minDiasPct) continue;
    const acos = div(x.custo * 100, x.vendas);
    lista.push({
      campanha: txt(c["campaign_name"]) || id,
      tipo: txt(c["ad_type"]),
      orcamento: orc,
      diasComGasto: comGasto,
      diasNoLimite: noLimite,
      custo: x.custo,
      vendas: x.vendas,
      acosPct: acos,
      leitura:
        acos != null && acosRef != null && acos <= acosRef
          ? "No limite com ACoS abaixo da média: avaliar mais orçamento."
          : acos == null
            ? "No limite e sem venda atribuída: revisar antes de dar mais orçamento."
            : "No limite com ACoS acima da média: ajustar lances antes do orçamento.",
    });
  }
  lista.sort(
    (a, b) => b.diasNoLimite - a.diasNoLimite || (a.acosPct ?? Infinity) - (b.acosPct ?? Infinity),
  );
  return { acosReferenciaPct: acosRef, lista: lista.slice(0, top) };
}

// ---------------------------------------------------------------------------------------------
// Pedidos (fact_amazon_pedido): cancelamento e FBA × envio próprio

const CANCELADO = /cancel/i;
/** [FATO, SP-API] fulfillment_channel AFN = Amazon (FBA); MFN = o vendedor envia. */
const canalEnvio = (v: unknown) => {
  const s = txt(v).toUpperCase();
  return s === "AFN" ? "FBA" : s === "MFN" ? "Envio próprio" : s || "—";
};

/**
 * Uma linha da tabela é um item de pedido. Pedido cancelado = todos os itens com status de cancelamento.
 * [INFERÊNCIA] item_price é o valor da linha (preço × quantidade), como no relatório de pedidos da SP-API.
 */
export function pedidosAmazon(rows: Row[], de: string, ate: string, titulos: Map<string, string>) {
  const ped = new Map<
    string,
    { status: Set<string>; canal: string; valor: number; unidades: number }
  >();
  const porSku = new Map<string, { pedidos: Set<string>; cancelados: Set<string> }>();
  const statusCont = new Map<string, Set<string>>();
  for (const r of rows) {
    const d = dia(r["purchase_dia"]) || dia(r["purchase_date"]);
    if (d < de || d > ate) continue;
    const id = txt(r["amazon_order_id"]);
    if (!id) continue;
    const st = txt(r["order_status"]) || "—";
    const cur = ped.get(id) ?? {
      status: new Set(),
      canal: canalEnvio(r["fulfillment_channel"]),
      valor: 0,
      unidades: 0,
    };
    cur.status.add(st);
    cur.valor += n(r["item_price"]);
    cur.unidades += n(r["quantity"]);
    ped.set(id, cur);
    statusCont.set(st, (statusCont.get(st) ?? new Set()).add(id));
    const k = txt(r["sku"]) || txt(r["asin"]);
    if (k) {
      const s = porSku.get(k) ?? { pedidos: new Set(), cancelados: new Set() };
      s.pedidos.add(id);
      if (CANCELADO.test(st)) s.cancelados.add(id);
      porSku.set(k, s);
    }
  }
  const cancelado = (p: { status: Set<string> }) => [...p.status].every((s) => CANCELADO.test(s));
  const todos = [...ped.values()];
  const validos = todos.filter((p) => !cancelado(p));
  const porCanal = new Map<
    string,
    { pedidos: number; valor: number; unidades: number; cancelados: number }
  >();
  for (const p of todos) {
    const c = porCanal.get(p.canal) ?? { pedidos: 0, valor: 0, unidades: 0, cancelados: 0 };
    c.pedidos++;
    if (cancelado(p)) c.cancelados++;
    else {
      c.valor += p.valor;
      c.unidades += p.unidades;
    }
    porCanal.set(p.canal, c);
  }
  const valorValido = validos.reduce((s, p) => s + p.valor, 0);
  return {
    pedidos: todos.length,
    cancelados: todos.length - validos.length,
    cancelamentoPct: div((todos.length - validos.length) * 100, todos.length),
    valor: valorValido,
    porCanal: [...porCanal.entries()]
      .map(([canal, c]) => ({
        canal,
        ...c,
        fatiaValorPct: div(c.valor * 100, valorValido),
        cancelamentoPct: div(c.cancelados * 100, c.pedidos),
      }))
      .sort((a, b) => b.valor - a.valor),
    porStatus: [...statusCont.entries()]
      .map(([status, ids]) => ({ status, pedidos: ids.size }))
      .sort((a, b) => b.pedidos - a.pedidos),
    skusComCancelamento: [...porSku.entries()]
      .map(([sku, s]) => ({
        sku,
        titulo: titulos.get(sku) || sku,
        pedidos: s.pedidos.size,
        cancelados: s.cancelados.size,
        cancelamentoPct: div(s.cancelados.size * 100, s.pedidos.size),
      }))
      .filter((x) => x.cancelados > 0)
      .sort((a, b) => b.cancelados - a.cancelados)
      .slice(0, 15),
  };
}
