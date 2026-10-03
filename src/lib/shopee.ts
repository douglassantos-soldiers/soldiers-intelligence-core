// Shopee: economia real (escrow), Ads (direta × ampla e por hora), produtos, lives e cancelamentos,
// com tabelas que JÁ existem no Supabase. benchmarks/shopee/ANALISE.md §4 (itens 1–10).
//
// Regras:
// - Receita realizada = itens do pedido. Repasse = escrow_amount (já líquido de comissão, taxas e frete).
//   Contribuição liquidada = repasse − CMV na data (princípio 14). Os custos do escrow são lidos em valor
//   absoluto e servem para explicar o repasse, não para descontar de novo.
// - Desconto/cupom pago pela Shopee não reduz a receita da Soldiers; o pago pela loja reduz.
// - Venda de Ads direta e ampla é atribuída pela Shopee: nunca somar entre si nem com a receita.
// - HIPÓTESES a validar (benchmarks/shopee §5): escrow_amount preenchido = pedido liquidado;
//   frete pago pela loja ≈ frete real − subsídio Shopee − frete pago pelo comprador; hora no fuso de Brasília.

import { custoHistorico, custoNaData } from "@/lib/aggregate";
import { DIAS_SEMANA } from "@/lib/amazon";

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const abs = (v: unknown) => Math.abs(n(v));
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const txt = (v: unknown) => String(v ?? "").trim();
const div = (a: number, b: number) => (b ? a / b : null);
const cancelado = (s: unknown) => /cancel|unpaid|invalid/i.test(String(s ?? ""));

export const CUSTOS_ESCROW = [
  ["commission_fee", "Comissão Shopee"],
  ["service_fee", "Taxa de serviço"],
  ["seller_transaction_fee", "Taxa de transação"],
  ["campaign_fee", "Taxa de campanha"],
  ["comissao_afiliado", "Comissão de afiliado"],
  ["fbs_fee", "Fulfillment Shopee"],
  ["seller_return_refund", "Reembolsos"],
  ["reverse_shipping_fee", "Frete de devolução"],
  ["escrow_tax", "Imposto retido no repasse"],
  ["withholding_tax", "Retenção de imposto"],
] as const;

// ---------------------------------------------------------------------------------------------
// Economia

export function economiaShopee(
  pedidos: Row[],
  itens: Row[],
  fin: Row[],
  custos: Row[],
  ads: Row[],
  de: string,
  ate: string,
) {
  const hist = custoHistorico(custos);
  const noPeriodo = (d: string) => d >= de && d <= ate;
  const info = new Map<string, { dia: string; cancelado: boolean }>();
  for (const p of pedidos) {
    const id = txt(p["order_sn"]);
    if (id) info.set(id, { dia: dia(p["create_dia"]), cancelado: cancelado(p["order_status"]) });
  }
  const finDe = new Map(fin.map((f) => [txt(f["order_sn"]), f]));

  type Linha = {
    sku: string;
    nome: string;
    qtd: number;
    receita: number;
    cmv: number;
    temCusto: boolean;
  };
  const linhasDe = new Map<string, Linha[]>();
  let semCusto = 0;
  for (const i of itens) {
    const id = txt(i["order_sn"]);
    const p = info.get(id);
    const d = p?.dia || dia(i["create_dia"]);
    if (!noPeriodo(d) || p?.cancelado || cancelado(i["order_status"])) continue;
    const qtd = Math.max(0, n(i["model_quantity_purchased"]) - n(i["cancelled_qty"]));
    if (!qtd) continue;
    const sku = txt(i["model_sku"]) || txt(i["item_sku"]);
    const c = sku ? custoNaData(hist, sku, d) : undefined;
    if (!c) semCusto++;
    const list = linhasDe.get(id) ?? [];
    list.push({
      sku,
      nome: txt(i["item_name"]) || sku,
      qtd,
      receita: n(i["model_discounted_price"]) * qtd,
      cmv: (c?.custo ?? 0) * qtd,
      temCusto: !!c,
    });
    linhasDe.set(id, list);
  }

  const t = {
    pedidos: 0,
    unidades: 0,
    receita: 0,
    liquidados: 0,
    emAbertoValor: 0,
    repasse: 0,
    cmvLiquidado: 0,
    descontoShopee: 0,
    descontoLoja: 0,
    moedas: 0,
    freteReal: 0,
    freteComprador: 0,
    freteSubsidio: 0,
  };
  const custosEscrow: Record<string, number> = {};
  const porSku = new Map<
    string,
    {
      sku: string;
      nome: string;
      unidades: number;
      receita: number;
      repasse: number;
      cmv: number;
      temCusto: boolean;
    }
  >();
  for (const [id, linhas] of linhasDe) {
    const receita = linhas.reduce((s, l) => s + l.receita, 0);
    t.pedidos++;
    t.unidades += linhas.reduce((s, l) => s + l.qtd, 0);
    t.receita += receita;
    const f = finDe.get(id);
    if (!f || f["escrow_amount"] == null) {
      t.emAbertoValor += receita;
      continue;
    }
    const repasse = n(f["escrow_amount"]);
    const cmv = linhas.reduce((s, l) => s + l.cmv, 0);
    t.liquidados++;
    t.repasse += repasse;
    t.cmvLiquidado += cmv;
    t.descontoShopee += abs(f["shopee_discount"]) + abs(f["voucher_from_shopee"]);
    t.descontoLoja += abs(f["seller_discount"]) + abs(f["voucher_from_seller"]);
    t.moedas += abs(f["coins"]);
    t.freteReal += abs(f["actual_shipping_fee"]);
    t.freteComprador += abs(f["buyer_paid_shipping_fee"]);
    t.freteSubsidio += abs(f["shopee_shipping_rebate"]);
    for (const [k] of CUSTOS_ESCROW) custosEscrow[k] = (custosEscrow[k] ?? 0) + abs(f[k]);
    for (const l of linhas) {
      const key = l.sku || l.nome;
      const s = porSku.get(key) ?? {
        sku: l.sku,
        nome: l.nome,
        unidades: 0,
        receita: 0,
        repasse: 0,
        cmv: 0,
        temCusto: true,
      };
      s.unidades += l.qtd;
      s.receita += l.receita;
      s.repasse += receita > 0 ? (repasse * l.receita) / receita : repasse / linhas.length;
      s.cmv += l.cmv;
      s.temCusto = s.temCusto && l.temCusto;
      porSku.set(key, s);
    }
  }
  const adsGasto = ads
    .filter((r) => noPeriodo(dia(r["data"])))
    .reduce((s, r) => s + n(r["expense"]), 0);
  const contribuicao = t.repasse - t.cmvLiquidado;
  const freteLoja = Math.max(0, t.freteReal - t.freteSubsidio - t.freteComprador);
  return {
    ...t,
    pctLiquidado: div(t.liquidados * 100, t.pedidos),
    contribuicaoLiquidada: contribuicao,
    margemPct: div(contribuicao * 100, t.repasse),
    adsGasto,
    freteLoja,
    custos: CUSTOS_ESCROW.map(([k, label]) => ({ chave: k, label, valor: custosEscrow[k] ?? 0 })),
    itensSemCusto: semCusto,
    skus: [...porSku.values()]
      .map((s) => ({
        ...s,
        contribuicao: s.repasse - s.cmv,
        margemPct: div((s.repasse - s.cmv) * 100, s.repasse),
      }))
      .sort((a, b) => b.receita - a.receita),
  };
}

/** Cancelamentos por motivo e quem cancelou; devoluções por SKU. */
export function cancelamentosShopee(
  pedidos: Row[],
  itens: Row[],
  de: string,
  ate: string,
  { top = 10 } = {},
) {
  const motivos = new Map<
    string,
    { motivo: string; quem: string; pedidos: number; valor: number }
  >();
  let cancelados = 0;
  let total = 0;
  for (const p of pedidos) {
    const d = dia(p["create_dia"]);
    if (d < de || d > ate) continue;
    total++;
    if (!cancelado(p["order_status"])) continue;
    cancelados++;
    const motivo = txt(p["cancel_reason"]) || "Sem motivo informado";
    const quem = txt(p["cancel_by"]) || "—";
    const k = `${motivo}|${quem}`;
    const cur = motivos.get(k) ?? { motivo, quem, pedidos: 0, valor: 0 };
    cur.pedidos++;
    cur.valor += n(p["total_amount"]);
    motivos.set(k, cur);
  }
  const dev = new Map<
    string,
    { sku: string; nome: string; devolvidas: number; vendidas: number }
  >();
  for (const i of itens) {
    const d = dia(i["create_dia"]);
    if (d < de || d > ate) continue;
    const sku = txt(i["model_sku"]) || txt(i["item_sku"]);
    const key = sku || txt(i["item_name"]);
    const cur = dev.get(key) ?? {
      sku,
      nome: txt(i["item_name"]) || sku,
      devolvidas: 0,
      vendidas: 0,
    };
    cur.devolvidas += n(i["returned_qty"]);
    cur.vendidas += n(i["model_quantity_purchased"]);
    dev.set(key, cur);
  }
  return {
    cancelados,
    pctCancelados: div(cancelados * 100, total),
    motivos: [...motivos.values()].sort((a, b) => b.pedidos - a.pedidos).slice(0, top),
    devolucoes: [...dev.values()]
      .filter((x) => x.devolvidas > 0)
      .map((x) => ({ ...x, pct: div(x.devolvidas * 100, x.vendidas) }))
      .sort((a, b) => b.devolvidas - a.devolvidas)
      .slice(0, top),
  };
}

// ---------------------------------------------------------------------------------------------
// Ads

/**
 * Campanhas no período com ROAS direto e amplo. abaixoDaMeta compara o ROAS amplo com o roas_target da
 * campanha (HIPÓTESE: a meta da Shopee é sobre a atribuição ampla).
 */
export function adsShopee(dias: Row[], camps: Row[], de: string, ate: string) {
  const dim = new Map(camps.map((c) => [txt(c["campaign_id"]), c]));
  const m = new Map<
    string,
    {
      id: string;
      nome: string;
      tipo: string;
      gasto: number;
      diretaGmv: number;
      amplaGmv: number;
      diretaPedidos: number;
      cliques: number;
    }
  >();
  for (const r of dias) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    const id = txt(r["campaign_id"]);
    const c = dim.get(id);
    const cur = m.get(id) ?? {
      id,
      nome: txt(c?.["ad_name"]) || id,
      tipo: txt(r["ad_type"]) || txt(c?.["ad_type"]) || "—",
      gasto: 0,
      diretaGmv: 0,
      amplaGmv: 0,
      diretaPedidos: 0,
      cliques: 0,
    };
    cur.gasto += n(r["expense"]);
    cur.diretaGmv += n(r["direct_gmv"]);
    cur.amplaGmv += n(r["broad_gmv"]);
    cur.diretaPedidos += n(r["direct_order"]);
    cur.cliques += n(r["clicks"]);
    m.set(id, cur);
  }
  const campanhas = [...m.values()]
    .filter((c) => c.gasto > 0)
    .map((c) => {
      const meta = dim.get(c.id)?.["roas_target"];
      const roasAmplo = div(c.amplaGmv, c.gasto);
      return {
        ...c,
        roasDireto: div(c.diretaGmv, c.gasto),
        roasAmplo,
        meta: meta == null || n(meta) === 0 ? null : n(meta),
        abaixoDaMeta: meta != null && n(meta) > 0 && roasAmplo != null && roasAmplo < n(meta),
      };
    })
    .sort((a, b) => b.gasto - a.gasto);
  const gasto = campanhas.reduce((s, c) => s + c.gasto, 0);
  const direta = campanhas.reduce((s, c) => s + c.diretaGmv, 0);
  const ampla = campanhas.reduce((s, c) => s + c.amplaGmv, 0);
  return {
    gasto,
    direta,
    ampla,
    roasDireto: div(direta, gasto),
    roasAmplo: div(ampla, gasto),
    campanhas,
  };
}

/**
 * Gasto e venda direta por dia da semana × hora (fact_shopee_ads_hora, nível conta), e as horas em que o
 * ROAS direto fica abaixo da metade da média (reduzir verba) ou acima de 1,5× (concentrar verba).
 */
export function adsPorHora(rows: Row[], de: string, ate: string, { gastoMinPct = 2 } = {}) {
  const g = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
  const v = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
  for (const r of rows) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    const h = Math.trunc(n(r["hora"]));
    if (h < 0 || h > 23) continue;
    const dow = new Date(d + "T00:00:00Z").getUTCDay();
    g[dow]![h]! += n(r["expense"]);
    v[dow]![h]! += n(r["direct_gmv"]);
  }
  const gasto = g.flat().reduce((s, x) => s + x, 0);
  const venda = v.flat().reduce((s, x) => s + x, 0);
  const media = div(venda, gasto);
  const celulas = [];
  for (let dow = 0; dow < 7; dow++)
    for (let h = 0; h < 24; h++)
      celulas.push({
        dow,
        hora: h,
        gasto: g[dow]![h]!,
        venda: v[dow]![h]!,
        roas: div(v[dow]![h]!, g[dow]![h]!),
      });
  const porHora = Array.from({ length: 24 }, (_, h) => {
    const gh = g.reduce((s, l) => s + l[h]!, 0);
    const vh = v.reduce((s, l) => s + l[h]!, 0);
    return {
      hora: h,
      gasto: gh,
      venda: vh,
      roas: div(vh, gh),
      pctGasto: div(gh * 100, gasto) ?? 0,
    };
  });
  const relevantes = porHora.filter(
    (x) => x.pctGasto >= gastoMinPct && x.roas != null && media != null,
  );
  return {
    gasto,
    venda,
    roasMedio: media,
    celulas,
    porHora,
    reduzir: relevantes.filter((x) => x.roas! < media! * 0.5).sort((a, b) => b.gasto - a.gasto),
    concentrar: relevantes.filter((x) => x.roas! > media! * 1.5).sort((a, b) => b.roas! - a.roas!),
  };
}

// ---------------------------------------------------------------------------------------------
// Produtos

export type ProdutoShopee = {
  item: string;
  nome: string;
  sku: string;
  visitas: number;
  pedidos: number;
  unidades: number;
  receita: number;
  conversaoPct: number | null;
  nota: number | null;
  variacaoNota: number | null;
  comentarios: number | null;
  estoque: number | null;
  coberturaDias: number | null;
  problemas: string[];
};

export function produtosShopee(
  itemDia: Row[],
  estoque: Row[],
  produtos: Row[],
  metricas: Row[],
  de: string,
  ate: string,
  { coberturaMin = 14, top = 80 } = {},
): ProdutoShopee[] {
  const agg = new Map<
    string,
    {
      visitas: number;
      pedidos: number;
      unidades: number;
      receita: number;
      nome: string;
      sku: string;
    }
  >();
  for (const r of itemDia) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    const id = txt(r["item_id"]);
    if (!id) continue;
    const cur = agg.get(id) ?? {
      visitas: 0,
      pedidos: 0,
      unidades: 0,
      receita: 0,
      nome: txt(r["title"]),
      sku: txt(r["seller_sku"]),
    };
    cur.visitas += n(r["visitas"]);
    cur.pedidos += n(r["pedidos"]);
    cur.unidades += n(r["unidades_vendidas"]);
    cur.receita += n(r["receita"]);
    agg.set(id, cur);
  }
  const prod = new Map(produtos.map((p) => [txt(p["item_id"]), p]));
  const est = new Map<string, { total: number; cobertura: number | null }>();
  for (const e of estoque) {
    const id = txt(e["item_id"]);
    if (!id) continue;
    const cur = est.get(id) ?? { total: 0, cobertura: null };
    cur.total += n(e["estoque_total"]);
    // Cobertura do item = a da variação que acaba primeiro (só variações com venda).
    if (e["dias_de_cobertura"] != null && n(e["media_diaria"]) > 0)
      cur.cobertura =
        cur.cobertura == null
          ? n(e["dias_de_cobertura"])
          : Math.min(cur.cobertura, n(e["dias_de_cobertura"]));
    est.set(id, cur);
  }
  // Nota no início e no fim do período (métricas diárias).
  const notas = new Map<
    string,
    { ini: number | null; fim: number | null; dIni: string; dFim: string; coment: number | null }
  >();
  for (const r of metricas) {
    const d = dia(r["data"]);
    if (d < de || d > ate || r["rating"] == null) continue;
    const id = txt(r["item_id"]);
    const cur = notas.get(id) ?? { ini: null, fim: null, dIni: "9999", dFim: "", coment: null };
    if (d < cur.dIni) {
      cur.dIni = d;
      cur.ini = n(r["rating"]);
    }
    if (d > cur.dFim) {
      cur.dFim = d;
      cur.fim = n(r["rating"]);
      cur.coment = r["comentarios"] == null ? null : n(r["comentarios"]);
    }
    notas.set(id, cur);
  }
  const convs = [...agg.values()]
    .filter((x) => x.visitas >= 200)
    .map((x) => (x.pedidos / x.visitas) * 100)
    .sort((a, b) => a - b);
  const convMed = convs.length ? convs[Math.floor((convs.length - 1) / 2)]! : null;

  const out: ProdutoShopee[] = [];
  for (const [item, a] of agg) {
    const p = prod.get(item);
    const e = est.get(item);
    const nt = notas.get(item);
    const nota = nt?.fim ?? (p?.["rating"] == null ? null : n(p["rating"]));
    const variacaoNota =
      nt && nt.ini != null && nt.fim != null && nt.dIni !== nt.dFim ? nt.fim - nt.ini : null;
    const conversaoPct = div(a.pedidos * 100, a.visitas);
    const problemas: string[] = [];
    if (e && e.total === 0 && a.unidades > 0) problemas.push("sem estoque");
    else if (e?.cobertura != null && e.cobertura < coberturaMin)
      problemas.push(`estoque cobre ${Math.round(e.cobertura)} dias`);
    if (variacaoNota != null && variacaoNota <= -0.1)
      problemas.push(`nota caiu ${Math.abs(variacaoNota).toFixed(1).replace(".", ",")}`);
    else if (nota != null && nota > 0 && nota < 4.5)
      problemas.push(`nota ${nota.toFixed(1).replace(".", ",")}`);
    if (conversaoPct != null && convMed != null && a.visitas >= 200 && conversaoPct < convMed / 2)
      problemas.push("conversão abaixo da metade da mediana");
    if (p) {
      if (p["fotos"] != null && n(p["fotos"]) < 5) problemas.push(`${n(p["fotos"])} fotos`);
      if (p["tem_dimensoes"] === false) problemas.push("sem dimensões");
    }
    out.push({
      item,
      nome: txt(p?.["nome"]) || a.nome || item,
      sku: a.sku || txt(p?.["item_sku"]),
      visitas: a.visitas,
      pedidos: a.pedidos,
      unidades: a.unidades,
      receita: a.receita,
      conversaoPct,
      nota,
      variacaoNota,
      comentarios: nt?.coment ?? null,
      estoque: e ? e.total : null,
      coberturaDias: e?.cobertura ?? null,
      problemas,
    });
  }
  return out.sort((x, y) => y.receita - x.receita).slice(0, top);
}

// ---------------------------------------------------------------------------------------------
// Lives

export function livesShopee(
  sessoes: Row[],
  produtosLive: Row[],
  produtos: Row[],
  de: string,
  ate: string,
  { top = 10 } = {},
) {
  const lista = sessoes
    .filter((s) => dia(s["inicio"]) >= de && dia(s["inicio"]) <= ate)
    .map((s) => {
      const horas = n(s["duracao_seg"]) / 3600;
      const vendas = n(s["vendas_confirmadas"]);
      return {
        sessao: txt(s["sessao_id"]),
        titulo: txt(s["titulo"]) || `Live ${txt(s["sessao_id"])}`,
        inicio: txt(s["inicio"]),
        duracaoMin: Math.round(n(s["duracao_seg"]) / 60),
        espectadores: n(s["espectadores"]),
        pedidos: n(s["pedidos_confirmados"]),
        vendas,
        conversaoPct: div(n(s["pedidos_confirmados"]) * 100, n(s["espectadores"])),
        vendasPorHora: horas > 0 ? vendas / horas : null,
      };
    })
    .sort((a, b) => b.inicio.localeCompare(a.inicio));
  const ids = new Set(lista.map((s) => s.sessao));
  const nomes = new Map(produtos.map((p) => [txt(p["item_id"]), txt(p["nome"])]));
  const porItem = new Map<
    string,
    {
      item: string;
      nome: string;
      cliques: number;
      carrinho: number;
      pedidos: number;
      vendas: number;
    }
  >();
  for (const r of produtosLive) {
    if (!ids.has(txt(r["sessao_id"]))) continue;
    const item = txt(r["item_id"]);
    const cur = porItem.get(item) ?? {
      item,
      nome: nomes.get(item) || item,
      cliques: 0,
      carrinho: 0,
      pedidos: 0,
      vendas: 0,
    };
    cur.cliques += n(r["cliques"]);
    cur.carrinho += n(r["atc"]);
    cur.pedidos += n(r["pedidos_confirmados"]);
    cur.vendas += n(r["vendas_confirmadas"]);
    porItem.set(item, cur);
  }
  const vendas = lista.reduce((s, x) => s + x.vendas, 0);
  const minutos = lista.reduce((s, x) => s + x.duracaoMin, 0);
  return {
    sessoes: lista.length,
    vendas,
    pedidos: lista.reduce((s, x) => s + x.pedidos, 0),
    vendasPorHora: minutos ? vendas / (minutos / 60) : null,
    lista: lista.slice(0, top * 2),
    produtos: [...porItem.values()].sort((a, b) => b.vendas - a.vendas).slice(0, top),
  };
}

// ---------------------------------------------------------------------------------------------
// Command Center

export type AlertaShopee = {
  tipo: "problema" | "oportunidade";
  tag: string;
  tom: "danger" | "warn" | "success" | "primary";
  texto: string;
};

export function alertasShopee(i: {
  produtos: ProdutoShopee[];
  skus: ReturnType<typeof economiaShopee>["skus"];
  ads: ReturnType<typeof adsShopee>;
  horas: ReturnType<typeof adsPorHora>;
}): AlertaShopee[] {
  const out: AlertaShopee[] = [];
  const brl = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
  const est = i.produtos.filter((p) =>
    p.problemas.some((x) => /sem estoque|estoque cobre/.test(x)),
  );
  if (est.length)
    out.push({
      tipo: "problema",
      tag: "Shopee estoque",
      tom: "warn",
      texto: `${est.length} produto(s) com venda e estoque acabando ou zerado. Maior: ${est[0]!.nome}.`,
    });
  const nota = i.produtos.filter((p) => p.problemas.some((x) => /^nota caiu/.test(x)));
  if (nota.length)
    out.push({
      tipo: "problema",
      tag: "Shopee nota",
      tom: "warn",
      texto: `${nota.length} produto(s) com nota caindo no período, como ${nota[0]!.nome}.`,
    });
  const neg = i.skus.filter((s) => s.repasse > 0 && s.contribuicao < 0 && s.temCusto);
  if (neg.length)
    out.push({
      tipo: "problema",
      tag: "Shopee margem",
      tom: "danger",
      texto: `${neg.length} produto(s) com repasse menor que o custo do produto, como ${neg[0]!.nome}.`,
    });
  const meta = i.ads.campanhas.filter((c) => c.abaixoDaMeta);
  if (meta.length)
    out.push({
      tipo: "problema",
      tag: "Shopee Ads",
      tom: "warn",
      texto: `${meta.length} campanha(s) abaixo da meta de ROAS (${brl(meta.reduce((s, c) => s + c.gasto, 0))} investidos).`,
    });
  if (i.horas.reduzir.length)
    out.push({
      tipo: "oportunidade",
      tag: "Shopee Ads",
      tom: "primary",
      texto: `${i.horas.reduzir.length} faixa(s) de horário com ROAS direto abaixo da metade da média (${brl(i.horas.reduzir.reduce((s, h) => s + h.gasto, 0))} investidos). Avaliar reduzir a verba nesses horários.`,
    });
  return out;
}

export { DIAS_SEMANA };
