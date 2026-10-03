// Economia do TikTok Shop a partir de tabelas que já existem no Supabase
// (tiktok_pedido, tiktok_pedido_item, fact_tiktok_financeiro, fact_tiktok_devolucao, dim_tiktok_produto).
// Plano Mestre cap. 14 (Profit) e benchmarks/tiktok-shop/ANALISE.md §3.3, §6 e §7:
// - o extrato (statement) sai dias depois da venda: "estimado" até liquidar, "liquidado" depois;
// - desconto pago pelo TikTok (platform_discount) não reduz a receita da Soldiers;
// - os sinais (+/−) das colunas do extrato não são assumidos: custos são lidos em valor absoluto e a
//   contribuição liquidada parte do repasse (settlement), que já é líquido.

import { custoHistorico, custoNaData } from "@/lib/aggregate";

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const abs = (v: unknown) => Math.abs(n(v));
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const cancelado = (status: unknown) => /cancel/i.test(String(status ?? ""));

export const CUSTOS_EXTRATO = [
  ["comissao_plataforma", "Comissão TikTok"],
  ["comissao_afiliado", "Comissão de afiliado"],
  ["comissao_afiliado_ads", "Comissão de afiliado (anúncios)"],
  ["comissao_parceiro", "Comissão de parceiro"],
  ["taxa_referral", "Taxa de indicação"],
  ["taxa_transacao", "Taxa de transação"],
  ["frete_custo", "Frete pago pela Soldiers"],
  ["imposto", "Imposto"],
  ["reembolso", "Reembolsos"],
] as const;

export type EconomiaTikTok = ReturnType<typeof economiaTikTok>;

/**
 * @param pedidos  tiktok_pedido (só colunas sem dados pessoais)
 * @param itens    tiktok_pedido_item (cada linha = 1 unidade, como a API do TikTok entrega)
 * @param fin      fact_tiktok_financeiro (linhas de extrato por pedido)
 * @param custos   dim_custo_sku (todas as vigências)
 */
export function economiaTikTok(
  pedidos: Row[],
  itens: Row[],
  fin: Row[],
  custos: Row[],
  de: string,
  ate: string,
) {
  const hist = custoHistorico(custos);
  const noPeriodo = (d: string) => d >= de && d <= ate;

  const pedidoInfo = new Map<string, { dia: string; amostra: boolean; cancelado: boolean }>();
  for (const p of pedidos) {
    const id = String(p["order_id"] ?? "");
    if (id)
      pedidoInfo.set(id, {
        dia: dia(p["create_dia"]),
        amostra: p["is_sample_order"] === true,
        cancelado: cancelado(p["status"]),
      });
  }

  // Itens do período (pedidos válidos), com CMV pelo custo vigente na data do pedido.
  type Item = {
    order: string;
    sku: string;
    produto: string;
    preco: number;
    cmv: number;
    temCusto: boolean;
    dPlat: number;
    dVend: number;
  };
  const itensPorPedido = new Map<string, Item[]>();
  let semCusto = 0;
  for (const i of itens) {
    const order = String(i["order_id"] ?? "");
    const p = pedidoInfo.get(order);
    const d = p?.dia || dia(i["create_dia"]);
    if (!noPeriodo(d) || p?.cancelado || cancelado(i["status"])) continue;
    const sku = String(i["seller_sku"] ?? "");
    const c = sku ? custoNaData(hist, sku, d) : undefined;
    if (!c) semCusto++;
    const it: Item = {
      order,
      sku,
      produto: String(i["product_name"] ?? sku),
      preco: n(i["sale_price"]),
      cmv: c?.custo ?? 0,
      temCusto: !!c,
      dPlat: n(i["platform_discount"]),
      dVend: n(i["seller_discount"]),
    };
    const list = itensPorPedido.get(order) ?? [];
    list.push(it);
    itensPorPedido.set(order, list);
  }

  // Extrato por pedido (um pedido pode ter várias linhas, inclusive estornos em extratos posteriores).
  const extrato = new Map<
    string,
    { settlement: number; primeiroExtrato: string; custos: Record<string, number> }
  >();
  for (const f of fin) {
    const order = String(f["order_id"] ?? "");
    if (!order) continue;
    const cur = extrato.get(order) ?? { settlement: 0, primeiroExtrato: "", custos: {} };
    cur.settlement += n(f["settlement"]);
    const sd = dia(f["statement_dia"]);
    if (sd && (!cur.primeiroExtrato || sd < cur.primeiroExtrato)) cur.primeiroExtrato = sd;
    for (const [k] of CUSTOS_EXTRATO) cur.custos[k] = (cur.custos[k] ?? 0) + abs(f[k]);
    extrato.set(order, cur);
  }

  let pedidosValidos = 0;
  let receitaItens = 0;
  let descontoPlataforma = 0;
  let descontoVendedor = 0;
  let amostrasPedidos = 0;
  let amostrasCusto = 0;
  let liquidados = 0;
  let emAbertoValor = 0;
  let repasse = 0;
  let cmvLiquidado = 0;
  const custosLiquidados: Record<string, number> = {};
  const prazos: number[] = [];
  const porSku = new Map<
    string,
    {
      sku: string;
      produto: string;
      unidades: number;
      receita: number;
      repasse: number;
      cmv: number;
    }
  >();

  for (const [order, list] of itensPorPedido) {
    const p = pedidoInfo.get(order);
    const receita = list.reduce((s, i) => s + i.preco, 0);
    const cmv = list.reduce((s, i) => s + i.cmv, 0);
    if (p?.amostra) {
      // Amostra: custo do produto enviado (o frete aparece no extrato quando houver).
      amostrasPedidos++;
      amostrasCusto += cmv;
      continue;
    }
    pedidosValidos++;
    receitaItens += receita;
    descontoPlataforma += list.reduce((s, i) => s + i.dPlat, 0);
    descontoVendedor += list.reduce((s, i) => s + i.dVend, 0);
    const e = extrato.get(order);
    if (!e) {
      emAbertoValor += receita;
      continue;
    }
    liquidados++;
    repasse += e.settlement;
    cmvLiquidado += cmv;
    for (const [k, v] of Object.entries(e.custos))
      custosLiquidados[k] = (custosLiquidados[k] ?? 0) + v;
    if (p?.dia && e.primeiroExtrato) {
      prazos.push(Math.round((Date.parse(e.primeiroExtrato) - Date.parse(p.dia)) / 86400000));
    }
    // Repasse rateado entre os itens pelo preço (estimativa: o extrato é por pedido).
    for (const i of list) {
      const key = i.sku || i.produto;
      const s = porSku.get(key) ?? {
        sku: i.sku,
        produto: i.produto,
        unidades: 0,
        receita: 0,
        repasse: 0,
        cmv: 0,
      };
      s.unidades += 1;
      s.receita += i.preco;
      s.repasse += receita > 0 ? (e.settlement * i.preco) / receita : e.settlement / list.length;
      s.cmv += i.cmv;
      porSku.set(key, s);
    }
  }

  prazos.sort((a, b) => a - b);
  const contribuicaoLiquidada = repasse - cmvLiquidado;
  return {
    pedidos: pedidosValidos,
    receitaItens,
    descontoPlataforma,
    descontoVendedor,
    amostras: { pedidos: amostrasPedidos, custoProduto: amostrasCusto },
    liquidacao: {
      liquidados,
      pctLiquidado: pedidosValidos ? (liquidados / pedidosValidos) * 100 : null,
      emAbertoValor,
      prazoMedianoDias: prazos.length ? prazos[Math.floor((prazos.length - 1) / 2)]! : null,
    },
    liquidado: {
      repasse,
      cmv: cmvLiquidado,
      contribuicao: contribuicaoLiquidada,
      margemPct: repasse ? (contribuicaoLiquidada / repasse) * 100 : null,
      custos: CUSTOS_EXTRATO.map(([k, label]) => ({
        chave: k,
        label,
        valor: custosLiquidados[k] ?? 0,
      })),
    },
    itensSemCusto: semCusto,
    skus: [...porSku.values()]
      .map((s) => ({ ...s, contribuicao: s.repasse - s.cmv }))
      .sort((a, b) => b.contribuicao - a.contribuicao),
  };
}

/** Devoluções agrupadas por motivo, com valor reembolsado. */
export function devolucoesPorMotivo(devs: Row[], de: string, ate: string) {
  const m = new Map<string, { motivo: string; devolucoes: number; valor: number }>();
  for (const d of devs) {
    const dd = dia(d["dia"]);
    if (dd < de || dd > ate) continue;
    const motivo = String(d["motivo"] ?? "").trim() || "Sem motivo informado";
    const cur = m.get(motivo) ?? { motivo, devolucoes: 0, valor: 0 };
    cur.devolucoes += 1;
    cur.valor += abs(d["valor_reembolso"]);
    m.set(motivo, cur);
  }
  return [...m.values()].sort((a, b) => b.valor - a.valor);
}

export type ProblemaListing = {
  product_id: string;
  titulo: string;
  problemas: string[];
  health: number | null;
};

/** Anúncios do TikTok Shop com problema: fora de venda, SKU sem estoque, campos faltando, sem peso/dimensões. */
export function saudeListings(produtos: Row[]) {
  const ativos = produtos.filter((p) => !/delet|desativ|inactive/i.test(String(p["status"] ?? "")));
  const lista: ProblemaListing[] = [];
  for (const p of ativos) {
    const problemas: string[] = [];
    if (p["nao_a_venda"] === true) problemas.push("fora de venda");
    if (n(p["skus_sem_estoque"]) > 0) problemas.push(`${n(p["skus_sem_estoque"])} SKU sem estoque`);
    const faltas = String(p["faltas"] ?? "").trim();
    if (faltas) problemas.push(`faltando: ${faltas}`);
    if (p["tem_peso"] === false || p["tem_dimensoes"] === false)
      problemas.push("sem peso/dimensões");
    if (problemas.length)
      lista.push({
        product_id: String(p["product_id"] ?? ""),
        titulo: String(p["titulo"] ?? p["product_id"] ?? ""),
        problemas,
        health: p["health"] == null ? null : n(p["health"]),
      });
  }
  lista.sort(
    (a, b) => b.problemas.length - a.problemas.length || (a.health ?? 999) - (b.health ?? 999),
  );
  return {
    anuncios: ativos.length,
    comProblema: lista.length,
    semEstoque: ativos.filter((p) => n(p["skus_sem_estoque"]) > 0).length,
    foraDeVenda: ativos.filter((p) => p["nao_a_venda"] === true).length,
    lista,
  };
}

/**
 * Situação de um token de acesso. O access token do TikTok é curto e renovado automaticamente;
 * por isso o alerta não é "vence em X dias", e sim "já venceu" (a renovação parou) ou "não é
 * renovado há mais de 7 dias". A autorização anual da loja (webhook 7, D-30) não fica nesta tabela.
 */
export function validadeToken(expiraEm: unknown, atualizadoEm: unknown, hoje: Date = new Date()) {
  const exp = expiraEm ? Date.parse(String(expiraEm)) : NaN;
  const upd = atualizadoEm ? Date.parse(String(atualizadoEm)) : NaN;
  const dias = Number.isNaN(exp) ? null : Math.floor((exp - hoje.getTime()) / 86400000);
  const semRenovar = Number.isNaN(upd) ? null : Math.floor((hoje.getTime() - upd) / 86400000);
  let nivel: "ok" | "atencao" | "expirado" | "sem_dado" = "ok";
  if (dias == null && semRenovar == null) nivel = "sem_dado";
  else if (dias != null && dias < 0) nivel = "expirado";
  else if (semRenovar != null && semRenovar > 7) nivel = "atencao";
  return { dias, semRenovar, nivel };
}
