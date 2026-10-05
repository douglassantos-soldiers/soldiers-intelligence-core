// Leituras da Soldiers Platform. Somente leitura de objetos JÁ EXISTENTES no Supabase.
// Todas as leituras do app passam por aqui (ponto único para adicionar proteção depois).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { skusEmAlta } from "@/lib/aggregate";
import {
  videosParaEscalar,
  creatorsEmAlta,
  creatorsParaReativar,
  influenciadoresSemVenda,
} from "@/lib/affiliate";
import { economiaTikTok, devolucoesPorMotivo, saudeListings, validadeToken } from "@/lib/tiktok";
import { reconciliacaoMeta, criativosMeta, segmentosMeta, funilMeta, ritmoMeta, metasDoMes, alertasMeta } from "@/lib/metaads";
import { campanhasGoogle, ritmoIntraday, produtosGoogle, assetsPmax, paginasSite, alertasGoogle } from "@/lib/google";
import { economiaShopee, cancelamentosShopee, adsShopee, adsPorHora, produtosShopee, livesShopee, alertasShopee } from "@/lib/shopee";
import { economiaML, anuncios360, diagnosticoAds, alertasML } from "@/lib/mercadolivre";
import { filaDeAcao, calibracao, reguaReposicao, emailRD, automacoesRD, utmEmail, funilLeads, acoesGrowth, saudeKlaviyo, alertasCRM } from "@/lib/crm";
import { resumoAmazon, asin360, termosAds, shareDeBusca, reposicaoFba, recompraAsin, organicoVsAds, vendasPorHora, novosParaMarca, alvosKeywords, alvosSd, classificaLances, alertasAmazon, amazonDoSku } from "@/lib/amazon";

import { db, check, fetchAll, fetchIn, type Db } from "@/lib/db-helpers";
import { dadosTikTokAds, dadosMeliDsp, dadosAfiliados, dadosMidiaSku, dadosDevolucoes } from "@/lib/canais.functions";
import { dadosAtribuicao } from "@/lib/clientes.functions";

const menosDiasIso = (iso: string, d: number) =>
  new Date(Date.parse(iso + "T00:00:00Z") - d * 86400000).toISOString().slice(0, 10);

const Periodo = z.object({ de: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), ate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

function maskName(nome?: string | null, sobrenome?: string | null) {
  const n = (nome ?? "").trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const s = (sobrenome ?? "").trim();
  return [n, s ? s[0].toUpperCase() + "." : ""].filter(Boolean).join(" ") || "—";
}

/* ---------------- Command Center / canais ---------------- */
export const getOverview = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => {
    const c = await db();
    const [rc, pl, nr] = await Promise.all([
      fetchAll(() => c.from("vw_receita_consolidada").select("data,canal,faturamento,pedidos,invest_ads,receita_ads,invest_afiliados,invest_aquisicao").gte("data", data.de).lte("data", data.ate).order("data"), "receita"),
      fetchAll(() => c.from("mv_pl_canal_dia").select("data,canal,receita_bruta,custo_canal,det_taxa,det_frete,det_afiliado,ads,imposto,cmv,margem_contribuicao,cmv_cobertura_pct").gte("data", data.de).lte("data", data.ate).order("data"), "p&l"),
      c.rpc("growth_novos_recorrentes", { p_de: data.de, p_ate: data.ate }),
    ]);
    return { receita: rc, pl, novosRecorrentes: (nr.error ? [] : nr.data) as Record<string, number>[] };
  });

/* ---------------- Customer 360 ---------------- */
const ClientesIn = z.object({
  busca: z.string().max(200).optional(),
  acao: z.string().max(40).optional(),
  ordem: z.enum(["potencial", "chance"]).default("potencial"),
  page: z.number().int().min(0).max(200).default(0),
});

export const getClientes = createServerFn({ method: "GET" })
  .inputValidator((d) => ClientesIn.parse(d))
  .handler(async ({ data }) => {
    const c = await db();
    const cols = "cliente_chave,pedidos,primeira_compra,ultima_compra,valor_total,ticket_medio,canais,canal_entrada,canal_ultimo,produto_principal,ritmo_dias,dias_ultima_compra,dias_atraso,chance_30,chance_90,valor_esperado_90,ltv_esperado,acao,gerado_em";
    let q = c.from("mv_growth_cliente_perfil").select(cols);
    const busca = data.busca?.trim();
    if (busca) {
      const [eh, ch] = await Promise.all([c.rpc("email_hash", { p: busca }), c.rpc("cpf_hash", { p: busca })]);
      const ors = [eh.data && `email_hash.eq.${eh.data}`, ch.data && `doc_hash.eq.${ch.data}`, /^[0-9a-f]{64}$/.test(busca) && `cliente_chave.eq.${busca}`].filter(Boolean);
      if (!ors.length) return { rows: [] };
      const found = check(await c.from("fact_pedido_cliente").select("cliente_chave").or(ors.join(",")).limit(50), "busca") as { cliente_chave: string }[];
      const keys = [...new Set(found.map((f) => f.cliente_chave).filter(Boolean))];
      if (!keys.length) return { rows: [] };
      q = q.in("cliente_chave", keys);
    }
    if (data.acao) q = q.eq("acao", data.acao);
    q = data.ordem === "chance" ? q.order("chance_30", { ascending: false }) : q.order("valor_esperado_90", { ascending: false });
    const rows = check(await q.range(data.page * 50, data.page * 50 + 49), "clientes") as Record<string, unknown>[];
    const keys = rows.map((r) => r.cliente_chave as string);
    const nomes: Record<string, { nome: string; uf: string | null; cidade: string | null }> = {};
    if (keys.length) {
      const ped = check(await c.from("fact_pedido_cliente").select("cliente_chave,nome,sobrenome,uf,cidade,data").in("cliente_chave", keys).order("data", { ascending: false }).limit(1000), "nomes") as Record<string, string>[];
      for (const p of ped) if (!nomes[p.cliente_chave]) nomes[p.cliente_chave] = { nome: maskName(p.nome, p.sobrenome), uf: p.uf, cidade: p.cidade };
    }
    return { rows: rows.map((r) => ({ ...r, ...(nomes[r.cliente_chave as string] ?? { nome: "—", uf: null, cidade: null }) })) };
  });

export const getClienteResumo = createServerFn({ method: "GET" }).handler(async () => {
  const c = await db();
  const [kpis, acoes] = await Promise.all([
    c.from("vw_cliente_kpis").select("*").limit(1),
    c.from("mv_growth_acao_resumo").select("acao,canal,clientes,valor_esperado,chance_media,ticket_medio,gerado_em"),
  ]);
  return { kpis: kpis.error ? null : kpis.data?.[0] ?? null, acoes: (acoes.data ?? []) as Record<string, unknown>[] };
});

export const getCliente = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ chave: z.string().regex(/^[0-9a-zA-Z_-]{8,128}$/) }).parse(d))
  .handler(async ({ data }) => {
    const c = await db();
    const [perfil, origem, pedidos] = await Promise.all([
      c.from("mv_growth_cliente_perfil").select("*").eq("cliente_chave", data.chave).maybeSingle(),
      c.from("mv_growth_origem_cliente").select("*").eq("cliente_chave", data.chave).maybeSingle(),
      // LGPD (Plano Mestre cap. 32): nunca selecionar e-mail, CPF, telefone ou endereço.
      // O app só precisa do nome (exibido mascarado) e de UF/cidade.
      c.from("fact_pedido_cliente").select("canal,pedido_id,data,valor,desconto,frete,status,itens,nome,sobrenome,uf,cidade").eq("cliente_chave", data.chave).order("data", { ascending: false }).limit(200),
    ]);
    const peds = check(pedidos, "pedidos") as Record<string, string>[];
    const ultimo = peds[0];
    const contato = ultimo ? { nome: maskName(ultimo.nome, ultimo.sobrenome), uf: ultimo.uf, cidade: ultimo.cidade } : null;
    let itens: Record<string, unknown>[] = [];
    if (peds.length) {
      const ids = [...new Set(peds.map((p) => p.pedido_id))].slice(0, 200);
      itens = check(await c.from("fact_pedido_item_cliente").select("canal,pedido_id,sku,produto,quantidade,valor_total,data").in("pedido_id", ids).limit(1000), "itens");
      const validos = new Set(peds.map((p) => `${p.canal}|${p.pedido_id}`));
      itens = itens.filter((i) => validos.has(`${i.canal}|${i.pedido_id}`));
    }
    const skus = [...new Set(itens.map((i) => i.sku as string).filter(Boolean))];
    const custos = skus.length ? (check(await c.from("dim_custo_sku").select("sku,custo_unitario,vigencia_inicio").in("sku", skus), "custo") as Record<string, string>[]) : [];
    return {
      perfil: perfil.data ?? null,
      origem: origem.data ?? null,
      contato,
      pedidos: peds.map(({ nome: _n, sobrenome: _s, ...p }) => p),
      itens,
      custos,
    };
  });

/* ---------------- Product 360 ---------------- */
export const getProdutos = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.extend({ canal: z.string().max(40).optional() }).parse(d))
  .handler(async ({ data }) => {
    const c = await db();
    const [rows, custos, ciclos, estoque] = await Promise.all([
      fetchAll(() => {
        let q = c.from("mv_produto_dia").select("data,canal,sku,produto,unidades,pedidos,receita,invest_ads,receita_ads").gte("data", data.de).lte("data", data.ate);
        if (data.canal) q = q.eq("canal", data.canal);
        return q.order("data");
      }, "produtos", 60000),
      c.from("dim_custo_sku").select("sku,custo_unitario,vigencia_inicio"),
      c.from("mv_growth_produto_ciclo").select("sku,clientes,recompras,ciclo_mediano,pct_retorno_90"),
      c.from("dim_shopify_produto").select("sku,estoque,cobertura_dias,alerta"),
    ]);
    return { rows, custos: custos.data ?? [], ciclos: ciclos.data ?? [], estoque: estoque.data ?? [] };
  });

export const getProduto = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.extend({ sku: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const c = await db();
    const [serie, custo, ciclo, proximo, estoque] = await Promise.all([
      fetchAll(() => c.from("mv_produto_dia").select("data,canal,produto,unidades,pedidos,receita,invest_ads,receita_ads").eq("sku", data.sku).gte("data", data.de).lte("data", data.ate).order("data"), "serie"),
      // Todas as vigências: o CMV de cada dia usa o custo vigente naquela data.
      c.from("dim_custo_sku").select("*").eq("sku", data.sku).order("vigencia_inicio", { ascending: false }),
      c.from("mv_growth_produto_ciclo").select("*").eq("sku", data.sku).limit(5),
      c.from("mv_growth_produto_proximo").select("sku_seguinte,produto_seguinte,ocorrencias,forca_pct,pos").eq("sku_origem", data.sku).order("ocorrencias", { ascending: false }).limit(8),
      c.from("dim_shopify_produto").select("*").eq("sku", data.sku).limit(1),
    ]);
    // Estoque por canal, sem somar entre canais (Plano Mestre cap. 6.4). O vínculo é pelo
    // SKU do vendedor em cada marketplace; se o SKU for diferente no canal, não aparece.
    const [amz, ml, shp, tt] = await Promise.all([
      c.from("dim_amazon_estoque").select("sku,asin,disponivel,reservado,total,atualizado_em").eq("sku", data.sku),
      c.from("dim_ml_estoque_full").select("seller_sku,item_id,disponivel,em_transferencia,total,vendas_7d,atualizado_em").eq("seller_sku", data.sku),
      // Shopee: o SKU pode estar na variação (model_sku) ou no item (item_sku). Duas consultas
      // com .eq, sem interpolar o SKU num filtro .or.
      Promise.all([
        c.from("dim_shopee_estoque").select("model_id,model_sku,item_sku,estoque_normal,estoque_reservado,estoque_total,atualizado_em").eq("model_sku", data.sku),
        c.from("dim_shopee_estoque").select("model_id,model_sku,item_sku,estoque_normal,estoque_reservado,estoque_total,atualizado_em").eq("item_sku", data.sku),
      ]).then(([a, b]) => {
        const seen = new Set<string>();
        const rows = [...(a.data ?? []), ...(b.data ?? [])].filter((r: Record<string, unknown>) => {
          const k = `${r["model_id"]}|${r["item_sku"]}|${r["model_sku"]}`;
          return seen.has(k) ? false : (seen.add(k), true);
        });
        return { data: rows as Record<string, unknown>[], error: a.error ?? b.error };
      }),
      c.from("dim_tiktok_estoque").select("seller_sku,warehouse_id,quantidade,atualizado_em").eq("seller_sku", data.sku),
    ]);
    const sum = (rows: Record<string, unknown>[] | null, k: string) => (rows ?? []).reduce((t, r) => t + (Number(r[k]) || 0), 0);
    const ult = (rows: Record<string, unknown>[] | null) => (rows ?? []).map((r) => String(r["atualizado_em"] ?? "")).sort().at(-1) ?? null;
    const estoqueCanais = [
      { canal: "Amazon (FBA)", disponivel: sum(amz.data, "disponivel"), total: sum(amz.data, "total"), registros: amz.data?.length ?? 0, atualizado: ult(amz.data), erro: amz.error?.message ?? null },
      { canal: "Mercado Livre (Full)", disponivel: sum(ml.data, "disponivel"), total: sum(ml.data, "total"), registros: ml.data?.length ?? 0, atualizado: ult(ml.data), erro: ml.error?.message ?? null },
      { canal: "Shopee", disponivel: sum(shp.data, "estoque_normal"), total: sum(shp.data, "estoque_total"), registros: shp.data?.length ?? 0, atualizado: ult(shp.data), erro: shp.error?.message ?? null },
      { canal: "TikTok Shop", disponivel: sum(tt.data, "quantidade"), total: sum(tt.data, "quantidade"), registros: tt.data?.length ?? 0, atualizado: ult(tt.data), erro: tt.error?.message ?? null },
    ];
    // Amazon do SKU (ASIN 360° + Ads por produto). O vínculo SKU → ASIN vem da reposição, do estoque FBA
    // e dos anúncios por produto. Se falhar, a página continua sem o bloco.
    let amazon: ReturnType<typeof amazonDoSku> = null;
    let amazonErro: string | null = null;
    try {
      const [rep, est, adsP] = await Promise.all([
        fetchAll(() => c.from("dim_amazon_reposicao").select("sku,asin,titulo,em_fba,fba_disponivel,cobertura_dias").eq("sku", data.sku), "amazon reposicao"),
        fetchAll(() => c.from("dim_amazon_estoque_sp").select("asin,seller_sku,fulfillable").eq("seller_sku", data.sku), "amazon estoque"),
        fetchAll(() => c.from("fact_amazon_ads_produto_dia").select("data,asin,sku,cost,sales_14d").eq("sku", data.sku).gte("data", data.de).lte("data", data.ate), "amazon ads produto"),
      ]);
      const asins = [...new Set([...rep, ...est, ...adsP].map((r) => String(r["asin"] ?? "")).filter(Boolean))];
      if (asins.length) {
        const [vendasA, bb, cad] = await Promise.all([
          fetchAll(() => c.from("fact_amazon_venda_asin_dia").select("data,child_asin,vendas,unidades,sessoes,buybox_pct").in("child_asin", asins).gte("data", data.de).lte("data", data.ate), "amazon asin"),
          fetchAll(() => c.from("dim_amazon_buybox").select("asin,ganho_buybox,concorrente_no_bb,meu_preco,menor_preco_concorrente").in("asin", asins), "amazon buybox"),
          fetchAll(() => c.from("dim_amazon_cadastro").select("asin,titulo,faltas,tem_aplus,health").in("asin", asins), "amazon cadastro"),
        ]);
        amazon = amazonDoSku(data.sku, [...rep, ...est], vendasA, bb, est, rep, cad, adsP, data.de, data.ate);
      }
    } catch (e) {
      amazonErro = e instanceof Error ? e.message : String(e);
    }
    return { serie, custo: custo.data?.[0] ?? null, custos: (custo.data ?? []) as Record<string, unknown>[], ciclo: ciclo.data?.[0] ?? null, proximo: proximo.data ?? [], estoque: estoque.data?.[0] ?? null, estoqueCanais, amazon, amazonErro };
  });

/* ---------------- Orders ---------------- */
export const getPedidos = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.extend({ canal: z.string().max(40), busca: z.string().max(80).optional(), page: z.number().int().min(0).max(500).default(0) }).parse(d))
  .handler(async ({ data }) => {
    const c = await db();
    let q = c.from("fact_pedido_cliente").select("canal,pedido_id,data,data_hora,nome,sobrenome,cliente_chave,uf,valor,valor_bruto,desconto,frete,status,itens,pagamento_metodo").eq("canal", data.canal);
    if (data.busca?.trim()) q = q.eq("pedido_id", data.busca.trim());
    else q = q.gte("data", data.de).lte("data", data.ate);
    const rows = check(await q.order("data", { ascending: false }).order("data_hora", { ascending: false, nullsFirst: false }).range(data.page * 50, data.page * 50 + 49), "pedidos") as Record<string, string>[];
    return rows.map(({ nome, sobrenome, ...r }) => ({ ...r, cliente: maskName(nome, sobrenome) }));
  });

export const getPedido = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ canal: z.string().max(40), id: z.string().max(80) }).parse(d))
  .handler(async ({ data }) => {
    const c = await db();
    const [p, itens] = await Promise.all([
      c.from("fact_pedido_cliente").select("canal,pedido_id,data,data_hora,nome,sobrenome,cliente_chave,uf,cidade,valor,valor_bruto,desconto,frete,status,status_detalhe,pagamento_metodo,parcelas").eq("canal", data.canal).eq("pedido_id", data.id).maybeSingle(),
      c.from("fact_pedido_item_cliente").select("linha,sku,produto,variacao,quantidade,preco_unitario,desconto,valor_total,sale_fee").eq("canal", data.canal).eq("pedido_id", data.id).order("linha"),
    ]);
    const its = (itens.data ?? []) as Record<string, string>[];
    const skus = [...new Set(its.map((i) => i.sku).filter(Boolean))];
    const custos = skus.length ? ((await c.from("dim_custo_sku").select("sku,custo_unitario,vigencia_inicio").in("sku", skus)).data ?? []) : [];
    const ped = p.data as Record<string, string> | null;
    return {
      pedido: ped ? { ...ped, nome: undefined, sobrenome: undefined, cliente: maskName(ped.nome, ped.sobrenome) } : null,
      itens: its,
      custos,
    };
  });

/* ---------------- Media / Affiliate / CRM ---------------- */
export const getMedia = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => {
    const c = await db();
    const [tipos, funil, sbNtb, sdNtb] = await Promise.all([
      fetchAll(() => c.from("vw_ads_por_tipo_dia").select("data,tipo,investimento,receita,impressoes,cliques,unidades").gte("data", data.de).lte("data", data.ate).order("data"), "ads tipo"),
      // Funil por canal de venda (impressão → clique → conversão), previsto no plano revisado da Fase 1.
      fetchAll(() => c.from("vw_ads_funil_canal_dia").select("data,canal,invest,receita_ads,impressoes,cliques,conversoes,base_conversao").gte("data", data.de).lte("data", data.ate).order("data"), "ads funil"),
      // Amazon: clientes novos para a marca (Sponsored Brands e Display). Falha aqui não derruba a tela.
      fetchAll(() => c.from("fact_amazon_ads_sb_campanha_dia").select("data,campaign_id,campaign_name,cost,sales,ntb_sales,ntb_purchases").gte("data", data.de).lte("data", data.ate), "amazon sb").catch(() => null),
      fetchAll(() => c.from("fact_amazon_ads_sd_campanha_dia").select("data,campaign_id,campaign_name,cost,sales,ntb_sales_clicks,ntb_purchases_clicks").gte("data", data.de).lte("data", data.ate), "amazon sd").catch(() => null),
    ]);
    const amazonNtb = sbNtb || sdNtb ? novosParaMarca(sbNtb ?? [], sdNtb ?? [], data.de, data.ate) : null;
    return { tipos, funil, amazonNtb };
  });

export const getAffiliate = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => {
    const c = await db();
    const [dia, pub, canal] = await Promise.all([
      fetchAll(() => c.from("vw_awin_dia").select("data,pedidos,pedidos_recusados,venda,venda_aprovada,venda_pendente,venda_recusada,comissao,taxa_awin").gte("data", data.de).lte("data", data.ate).order("data"), "awin dia"),
      fetchAll(() => c.from("vw_awin_publisher_dia").select("publisher_id,publisher,pedidos,venda,comissao,taxa_awin").gte("data", data.de).lte("data", data.ate), "awin pub"),
      fetchAll(() => c.from("mv_afiliado_canal_dia").select("data,canal,rec,inv").gte("data", data.de).lte("data", data.ate).order("data"), "afiliado canal"),
    ]);
    return { dia, pub, canal };
  });

export const getCrm = createServerFn({ method: "GET" }).handler(async () => {
  const c = await db();
  const [meses, rfm, acoes, ltv, origem, cohort] = await Promise.all([
    c.from("mv_growth_mes").select("*").order("mes"),
    c.from("mv_growth_rfm_segmento").select("*"),
    c.from("mv_growth_acao_resumo").select("*"),
    c.from("mv_growth_ltv_canal").select("*"),
    c.from("mv_growth_origem_canal").select("*"),
    c.from("mv_growth_cohort_mes").select("safra,mes_offset,clientes_safra,clientes,receita").order("safra"),
  ]);
  return {
    meses: meses.data ?? [],
    rfm: rfm.data ?? [],
    acoes: acoes.data ?? [],
    ltv: ltv.data ?? [],
    origem: origem.data ?? [],
    cohort: cohort.data ?? [],
  } as Record<string, Record<string, unknown>[]>;
});

/* ---------------- CRM 2.0 ----------------
 * benchmarks/rd-station-klaviyo/ANALISE.md §6. Só leitura. LGPD: nenhuma coluna de e-mail, nome ou telefone
 * é selecionada aqui (rd_lead.email_hash e rd_automacao_dia.email ficam de fora). */
const COLS_FILA =
  "cliente_chave,acao,acionavel,chance_30,chance_90,valor_esperado_90,dias_ultima_compra,dias_atraso,ritmo_dias,produto_provavel,sku_provavel,produto_principal,sku_principal,pedidos,ticket_medio,canal_ultimo";

async function dadosCrm(data: { de: string; ate: string }) {
  const c = await db();
  const erros: Record<string, string> = {};
  const safe = async (nome: string, p: Promise<Record<string, unknown>[]>) => {
    try {
      return await p;
    } catch (e) {
      erros[nome] = e instanceof Error ? e.message : String(e);
      return [] as Record<string, unknown>[];
    }
  };
  const agora = new Date().toISOString();
  const hoje = agora.slice(0, 10);
  const [perfis, acuracia, ciclos, proximos, campanhas, vendasCamp, automacoes, utm, leadDia, leads, acoes, resultados, klaviyo] = await Promise.all([
    // Os 1.000 clientes acionáveis de maior valor esperado (a fila é para agir, não para listar a base toda).
    safe("fila", fetchAll(() => c.from("mv_growth_cliente_perfil").select(COLS_FILA).eq("acionavel", true).order("valor_esperado_90", { ascending: false }), "crm fila", 1000)),
    safe("acuracia", fetchAll(() => c.from("mv_growth_recompra_acuracia").select("horizonte_dias,faixa,clientes,previsto_pct,realizado_pct,gerado_em"), "crm acuracia")),
    safe("ciclos", fetchAll(() => c.from("mv_growth_produto_ciclo").select("sku,produto,clientes,compras,recompras,ciclo_mediano,pct_retorno_30,pct_retorno_60,pct_retorno_90"), "crm ciclos")),
    safe("proximos", fetchAll(() => c.from("mv_growth_produto_proximo").select("sku_origem,sku_seguinte,produto_seguinte,ocorrencias,forca_pct,pos"), "crm proximos")),
    safe("campanhas", fetchAll(() => c.from("rd_email_campanha").select("campaign_id,nome,data,enviado_em,contatos,entregues,aberturas,cliques,bounces,spam,descadastros,descartados").gte("data", data.de).lte("data", data.ate), "rd campanhas")),
    safe("vendasCampanha", fetchAll(() => c.from("vw_rd_campanha_venda").select("campaign_id,data,pedidos,receita").gte("data", data.de).lte("data", data.ate), "rd campanha venda")),
    safe("automacoes", fetchAll(() => c.from("rd_automacao_dia").select("data,fluxo,acao_id,contatos,entregues,aberturas,cliques,bounces,descadastros").gte("data", data.de).lte("data", data.ate), "rd automacoes", 60000)),
    safe("utm", fetchAll(() => c.from("vw_rd_utm_venda_dia").select("data,utm_campaign,ligada_campanha,pedidos,receita").gte("data", data.de).lte("data", data.ate), "rd utm")),
    safe("leadDia", fetchAll(() => c.from("vw_rd_lead_dia").select("data,origem,leads,leads_compraram,receita_leads").gte("data", data.de).lte("data", data.ate), "rd lead dia")),
    safe("leads", fetchAll(() => c.from("rd_lead").select("criado_em,estagio,conversao,utm_source,utm_medium,utm_campaign").gte("criado_em", data.de).lte("criado_em", data.ate + "T23:59:59"), "rd leads", 60000)),
    safe("acoes", fetchAll(() => c.from("growth_acoes").select("id,titulo,canal,status,responsavel,prazo,prioridade,impacto_estimado,esforco,criada_em"), "growth acoes")),
    safe("resultados", fetchAll(() => c.from("growth_resultados").select("acao_id,resultado,metrica_antes,metrica_depois,observacao,registrado_em"), "growth resultados")),
    safe("klaviyo", fetchAll(() => c.from("klaviyo_resgate_log").select("executado_em,modo,ok,http_status,perfis_no_segmento,erro").order("executado_em", { ascending: false }), "klaviyo log", 200)),
  ]);
  const cal = calibracao(acuracia);
  const regua = reguaReposicao(ciclos, proximos);
  const email = emailRD(campanhas, vendasCamp, data.de, data.ate);
  const ac = acoesGrowth(acoes, resultados, hoje);
  const kl = saudeKlaviyo(klaviyo, agora);
  return {
    fila: filaDeAcao(perfis),
    calibracao: cal,
    geradoEm: String(acuracia[0]?.["gerado_em"] ?? ""),
    regua,
    email,
    automacoes: automacoesRD(automacoes, data.de, data.ate),
    utm: utmEmail(utm, data.de, data.ate),
    leads: funilLeads(leadDia, leads, data.de, data.ate),
    acoes: ac,
    klaviyo: kl,
    alertas: alertasCRM({
      klaviyo: kl,
      email: campanhas.length ? email.total : null,
      calibracao: acuracia.length ? cal : null,
      acoes: acoes.length ? ac : null,
      regua,
    }),
    erros,
  };
}

export const getCrmAcao = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => dadosCrm(data));

/* ---------------- Marketplace health ---------------- */
// Resumo de Buy Box da Amazon (Plano Mestre cap. 9.5). Linha única com a contagem de ASINs.
export const getMarketplaceSaude = createServerFn({ method: "GET" }).handler(async () => {
  const c = await db();
  const abb = await c.from("vw_abb_resumo").select("asins,ganha_bb,perdendo_concorrente,com_concorrente,em_risco,suprimida,atualizado").limit(1);
  return { buybox: (abb.error ? null : abb.data?.[0] ?? null) as Record<string, unknown> | null };
});

/* ---------------- Data Health (Plano Mestre cap. 31) ----------------
 * Só leitura de objetos que já existem: frescor dos dados por fonte, filas de
 * sincronização, logs com erro e problemas abertos (vw_saude_*). Cada leitura é
 * independente: se uma fonte falhar, as outras continuam aparecendo. */
type Fonte = { fonte: string; ultimoDado: string | null; carregadoEm: string | null; erro: string | null };
type Fila = { fila: string; linhas: number; porStatus: Record<string, number>; maxTentativas: number; ultimoErro: string | null; atualizado: string | null; erro: string | null };

const FILAS: { tabela: string; dataCol: string; atualizadoCol: string; erroCol?: string; nome: string }[] = [
  { tabela: "amazon_ads_report_fila", dataCol: "dia", atualizadoCol: "atualizado_em", erroCol: "erro", nome: "Amazon Ads: relatórios" },
  { tabela: "amazon_sp_asin_fila", dataCol: "dia", atualizadoCol: "atualizado", erroCol: "erro", nome: "Amazon SP: ASINs" },
  { tabela: "amazon_st_fila", dataCol: "data", atualizadoCol: "atualizado_em", nome: "Amazon: search terms" },
  { tabela: "ml_historico_fila", dataCol: "dia", atualizadoCol: "atualizado", nome: "Mercado Livre: pedidos" },
  { tabela: "ml_afiliado_fila", dataCol: "data", atualizadoCol: "atualizado_em", erroCol: "erro", nome: "Mercado Livre: afiliados" },
  { tabela: "shopee_backfill_fila", dataCol: "dia", atualizadoCol: "atualizado", nome: "Shopee: pedidos" },
  { tabela: "shopee_escrow_fila", dataCol: "dia", atualizadoCol: "atualizado", nome: "Shopee: financeiro (escrow)" },
  { tabela: "tiktok_backfill_fila", dataCol: "dia", atualizadoCol: "atualizado", nome: "TikTok Shop: pedidos" },
  { tabela: "tiktok_analytics_fila", dataCol: "dia", atualizadoCol: "atualizado", nome: "TikTok Shop: analytics" },
];

export const getDataHealth = createServerFn({ method: "GET" }).handler(async () => {
  const c = await db();
  const desde = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  // 1) Frescor: último dia com dado e última carga, por fonte.
  const ultimo = async (fonte: string, tabela: string, dataCol: string, cargaCol: string | null, filtro?: [string, string]): Promise<Fonte> => {
    let q = c.from(tabela).select(cargaCol ? `${dataCol},${cargaCol}` : dataCol);
    if (filtro) q = q.eq(filtro[0], filtro[1]);
    const r = await q.order(dataCol, { ascending: false }).limit(1);
    const row = (r.data?.[0] ?? null) as Record<string, unknown> | null;
    return { fonte, ultimoDado: row ? String(row[dataCol] ?? "") || null : null, carregadoEm: row && cargaCol ? String(row[cargaCol] ?? "") || null : null, erro: r.error?.message ?? null };
  };
  const fontes = await Promise.all([
    ultimo("Pedidos: Shopify", "fact_pedido_cliente", "data", "atualizado_em", ["canal", "Shopify"]),
    ultimo("Pedidos: Mercado Livre", "fact_pedido_cliente", "data", "atualizado_em", ["canal", "Mercado Livre"]),
    ultimo("Pedidos: Amazon", "fact_pedido_cliente", "data", "atualizado_em", ["canal", "Amazon"]),
    ultimo("Pedidos: TikTok Shop", "fact_pedido_cliente", "data", "atualizado_em", ["canal", "TikTok"]),
    ultimo("Receita diária consolidada", "fact_receita_diaria", "data", "carregado_em"),
    ultimo("Meta Ads", "meta_ads_metricas", "data", "carregado_em"),
    ultimo("Google Ads", "google_campanha_metricas", "data", "carregado_em"),
    ultimo("Awin", "awin_transacao", "transaction_date", "atualizado_em"),
    ultimo("TikTok Shop: vídeos de creators", "fact_tiktok_video_dia", "data", "atualizado_em"),
    ultimo("Custos (dim_custo_sku)", "dim_custo_sku", "atualizado_em", null),
  ]);

  // 2) Filas: distribuição de status nos últimos 30 dias (status mostrados como vêm do banco).
  const filas: Fila[] = await Promise.all(
    FILAS.map(async (f) => {
      const cols = ["status", "tentativas", f.atualizadoCol, ...(f.erroCol ? [f.erroCol] : [])].join(",");
      const r = await c.from(f.tabela).select(cols).gte(f.dataCol, desde).order(f.atualizadoCol, { ascending: false }).limit(1000);
      const rows = (r.data ?? []) as Record<string, unknown>[];
      const porStatus: Record<string, number> = {};
      for (const x of rows) porStatus[String(x["status"] ?? "—")] = (porStatus[String(x["status"] ?? "—")] ?? 0) + 1;
      const comErro = f.erroCol ? rows.find((x) => x[f.erroCol!]) : undefined;
      return {
        fila: f.nome,
        linhas: rows.length,
        porStatus,
        maxTentativas: rows.reduce((m, x) => Math.max(m, Number(x["tentativas"]) || 0), 0),
        ultimoErro: comErro ? String(comErro[f.erroCol!]).slice(0, 200) : null,
        atualizado: rows[0] ? String(rows[0][f.atualizadoCol] ?? "") || null : null,
        erro: r.error?.message ?? null,
      };
    }),
  );

  // 3) Logs de sincronização com erro (últimas execuções).
  const [shp, tt, ml] = await Promise.all([
    c.from("shopee_sync_log").select("executado_em,erro,pedidos,itens").order("executado_em", { ascending: false }).limit(50),
    c.from("tiktok_sync_log").select("executado_em,erro,pedidos,itens").order("executado_em", { ascending: false }).limit(50),
    c.from("ml_sync_log").select("started_at,finished_at,status,job_type,error_message").order("started_at", { ascending: false }).limit(50),
  ]);
  const resumoLog = (nome: string, rows: Record<string, unknown>[] | null, dataCol: string, erroCol: string, err: { message: string } | null) => {
    const list = rows ?? [];
    const erros = list.filter((x) => x[erroCol]);
    return { log: nome, execucoes: list.length, comErro: erros.length, ultimaExecucao: list[0] ? String(list[0][dataCol] ?? "") : null, ultimoErro: erros[0] ? String(erros[0][erroCol]).slice(0, 200) : null, erro: err?.message ?? null };
  };
  const logs = [
    resumoLog("Shopee", shp.data as Record<string, unknown>[] | null, "executado_em", "erro", shp.error),
    resumoLog("TikTok Shop", tt.data as Record<string, unknown>[] | null, "executado_em", "erro", tt.error),
    resumoLog("Mercado Ads", ml.data as Record<string, unknown>[] | null, "started_at", "error_message", ml.error),
  ];

  // 4) Problemas abertos já detectados pelo banco (pedido = ID do pedido; sem dado pessoal).
  const saude = await Promise.all(
    ["vw_saude_shopify", "vw_saude_ml", "vw_saude_amazon"].map((v) =>
      c.from(v).select("canal,data,pedido,problema,severidade,dias_aberto,valor").order("dias_aberto", { ascending: false }).limit(200),
    ),
  );
  const problemas = saude.flatMap((r) => (r.data ?? []) as Record<string, unknown>[]);
  const afiliadoMl = await c.from("vw_ml_afiliado_saude").select("canal,situacao,ultimo_dia_ok,dias_atraso,dias_erro,dias_pendentes,pct_casou_ml_pedido").limit(5);

  // 5) Validade dos tokens das integrações: só colunas de data, nunca o token.
  const [ttAuth, metaCred] = await Promise.all([
    c.from("tiktok_auth").select("shop_id,expires_at,updated_at"),
    c.from("meta_credentials").select("ad_account_id,token_expira_em,atualizado_em"),
  ]);
  const tokens = [
    ...((ttAuth.data ?? []) as Record<string, unknown>[]).map((r) => ({ integracao: "TikTok Shop", conta: String(r["shop_id"] ?? "—"), expiraEm: (r["expires_at"] as string) ?? null, atualizadoEm: (r["updated_at"] as string) ?? null, ...validadeToken(r["expires_at"], r["updated_at"]) })),
    ...((metaCred.data ?? []) as Record<string, unknown>[]).map((r) => ({ integracao: "Meta Ads", conta: String(r["ad_account_id"] ?? "—"), expiraEm: (r["token_expira_em"] as string) ?? null, atualizadoEm: (r["atualizado_em"] as string) ?? null, // Token de system user da Meta pode não expirar: aqui só vale a data de validade.
      ...validadeToken(r["token_expira_em"], null) })),
  ];
  const tokensErro = ttAuth.error?.message ?? metaCred.error?.message ?? null;

  return { fontes, filas, logs, problemas, afiliadoMl: (afiliadoMl.data ?? []) as Record<string, unknown>[], tokens, tokensErro };
});

/* ---------------- Command Center: problemas e oportunidades (cap. 28) ---------------- */
export const getAlertas = createServerFn({ method: "GET" }).handler(async () => {
  const c = await db();
  const hoje = new Date().toISOString().slice(0, 10);
  const desde = new Date(Date.now() - 27 * 86400000).toISOString().slice(0, 10);
  const [estoque, saude, abb, acoes, prod] = await Promise.all([
    // Estoque do site com menor cobertura (só SKUs com venda: media_diaria > 0).
    c.from("dim_shopify_produto").select("sku,title,estoque,cobertura_dias,alerta,media_diaria").gt("media_diaria", 0).order("cobertura_dias", { ascending: true }).limit(5),
    Promise.all(["vw_saude_shopify", "vw_saude_ml", "vw_saude_amazon"].map((v) => c.from(v).select("canal,severidade"))),
    c.from("vw_abb_resumo").select("perdendo_concorrente,suprimida,em_risco").limit(1),
    c.from("mv_growth_acao_resumo").select("acao,clientes,valor_esperado"),
    fetchAll(() => c.from("mv_produto_dia").select("data,sku,produto,receita").gte("data", desde).lte("data", hoje), "produtos 28d", 60000),
  ]);
  const problemasDados = saude.flatMap((r) => (r.data ?? []) as Record<string, unknown>[]);
  // Amazon, últimos 14 dias. Um erro aqui só esconde os alertas da Amazon.
  let amazon: ReturnType<typeof alertasAmazon> = [];
  try {
    const de14 = new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10);
    const [vendasA, bb, est, rep, cad, termosR, brand] = await Promise.all([
      fetchAll(() => c.from("fact_amazon_venda_asin_dia").select("data,child_asin,vendas,unidades,sessoes,buybox_pct").gte("data", de14).lte("data", hoje), "amazon asin", 60000),
      fetchAll(() => c.from("dim_amazon_buybox").select("asin,ganho_buybox,concorrente_no_bb,meu_preco,menor_preco_concorrente"), "amazon buybox"),
      fetchAll(() => c.from("dim_amazon_estoque_sp").select("asin,seller_sku,fulfillable"), "amazon estoque"),
      fetchAll(() => c.from("dim_amazon_reposicao").select("sku,asin,titulo,em_fba,cobertura_dias"), "amazon reposicao"),
      fetchAll(() => c.from("dim_amazon_cadastro").select("asin,titulo"), "amazon cadastro"),
      fetchAll(() => c.from("fact_amazon_ads_search_term_dia").select("data,campaign_name,search_term,keyword_text,match_type,cost,clicks,purchases_14d,sales_14d").gte("data", de14).lte("data", hoje), "amazon search terms", 90000),
      fetchAll(() => c.from("fact_amazon_brand_search_term").select("semana_fim,termo,nosso,click_share,conversion_share,rank_busca").gte("semana_fim", menosDiasIso(hoje, 35)), "amazon brand", 60000),
    ]);
    amazon = alertasAmazon({
      asins: asin360(vendasA, bb, est, rep, cad, de14, hoje),
      termos: termosAds(termosR, de14, hoje),
      share: shareDeBusca(brand, { top: Infinity }),
      organico: organicoVsAds(brand, termosR, de14, hoje),
    });
  } catch {
    amazon = [];
  }
  // Mercado Livre, últimos 14 dias (mesma regra da tela). Um erro aqui só esconde os alertas do ML.
  let mercadoLivre: ReturnType<typeof alertasML> = [];
  try {
    mercadoLivre = (await dadosMercadoLivre({ de: new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10), ate: hoje })).alertas;
  } catch {
    mercadoLivre = [];
  }
  let shopee: ReturnType<typeof alertasShopee> = [];
  try {
    shopee = (await dadosShopee({ de: new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10), ate: hoje })).alertas;
  } catch {
    shopee = [];
  }
  let google: ReturnType<typeof alertasGoogle> = [];
  try {
    google = (await dadosGoogle({ de: new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10), ate: hoje })).alertas;
  } catch {
    google = [];
  }
  // Telas novas (TikTok Ads, Meli DSP, afiliados, mídia × estoque, devoluções): em paralelo; erro só esconde o bloco.
  type Alerta = { tipo: "problema" | "oportunidade"; tag: string; tom: "danger" | "warn" | "success" | "primary"; texto: string };
  const p14 = { de: new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10), ate: hoje };
  const p30 = { de: new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10), ate: hoje };
  const so = (pr: Promise<{ alertas: Alerta[] }>) => pr.then((x) => x.alertas).catch(() => [] as Alerta[]);
  const [tiktokAds, meliDsp, afiliados, midiaSku, devolucoes, atribuicao] = await Promise.all([
    so(dadosTikTokAds(p14)),
    so(dadosMeliDsp(p14)),
    so(dadosAfiliados(p30)),
    so(dadosMidiaSku(p14)),
    so(dadosDevolucoes(p30)),
    so(dadosAtribuicao(p30)),
  ]);
  let crm: ReturnType<typeof alertasCRM> = [];
  try {
    crm = (await dadosCrm({ de: new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10), ate: hoje })).alertas;
  } catch {
    crm = [];
  }
  let meta: ReturnType<typeof alertasMeta> = [];
  try {
    meta = (await dadosMeta({ de: new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10), ate: hoje })).alertas;
  } catch {
    meta = [];
  }
  return {
    amazon,
    mercadoLivre,
    shopee,
    google,
    meta,
    crm,
    tiktokAds,
    meliDsp,
    afiliados,
    midiaSku,
    devolucoes,
    atribuicao,
    estoque: (estoque.data ?? []) as Record<string, unknown>[],
    problemasDados: problemasDados.length,
    buybox: (abb.data?.[0] ?? null) as Record<string, unknown> | null,
    acoes: (acoes.data ?? []) as Record<string, unknown>[],
    // Calculado no servidor para não mandar 28 dias de linhas por SKU ao navegador.
    skusEmAlta: skusEmAlta(prod, hoje),
  };
});

/* ---------------- Affiliate Copilot: "O que devo fazer hoje?" ----------------
 * Plano AffiliateOS BR §17 e Plano Mestre caps. 8 e 28. Só leitura; tudo é recomendação.
 * Os cálculos ficam no servidor (lib/affiliate.ts) para não mandar 90 dias de vídeos ao navegador. */
export const getAffiliateHoje = createServerFn({ method: "GET" }).handler(async () => {
  const c = await db();
  const hoje = new Date().toISOString().slice(0, 10);
  const de90 = new Date(Date.now() - 89 * 86400000).toISOString().slice(0, 10);
  const de30 = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  const [videos, infl, conteudo] = await Promise.all([
    fetchAll(
      () => c.from("fact_tiktok_video_dia").select("data,video_id,criador,titulo,produto_nome,views,gmv,sku_orders").gte("data", de90).lte("data", hoje).order("data"),
      "tiktok videos",
      90000,
    ),
    // Só colunas de contrato e @ público; sem cidade/estado.
    c.from("dim_influenciador").select("nome,tiktok_username,tier,status,data_inicio,data_fim,cache_fixo,custo_total"),
    fetchAll(
      () => c.from("fact_tiktok_conteudo_dia").select("data,gmv,gmv_video,gmv_live,gmv_card,pedidos").gte("data", de30).lte("data", hoje).order("data"),
      "tiktok conteudo",
    ),
  ]);
  const v = videos as Record<string, unknown>[];
  const sum = (k: string) => (conteudo as Record<string, unknown>[]).reduce((s, r) => s + (Number(r[k]) || 0), 0);
  const ultimoDia = v.reduce((m, r) => (String(r["data"]) > m ? String(r["data"]) : m), "");
  // Referência = último dia com dado, para o "hoje" não ficar vazio quando a carga é D-1.
  const ref = ultimoDia || hoje;
  return {
    referencia: ref,
    videosEscalar: videosParaEscalar(v, ref),
    emAlta: creatorsEmAlta(v, ref),
    reativar: creatorsParaReativar(v, ref),
    semVenda: influenciadoresSemVenda((infl.data ?? []) as Record<string, unknown>[], v, ref),
    influenciadoresErro: infl.error?.message ?? null,
    mix30d: { gmv: sum("gmv"), video: sum("gmv_video"), live: sum("gmv_live"), card: sum("gmv_card"), pedidos: sum("pedidos") },
  };
});

/* ---------------- TikTok Shop: economia (Plano Mestre cap. 14; benchmarks/tiktok-shop) ----------------
 * Lucro real por pedido a partir do extrato, estimado × liquidado, descontos do TikTok × Soldiers,
 * amostras, devoluções e saúde dos anúncios. LGPD: de tiktok_pedido só saem colunas sem dado pessoal
 * (nada de e-mail, telefone, CPF ou endereço). Tokens nunca são lidos. */
export const getTikTokEconomia = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => {
    const c = await db();
    const [pedidos, itens, fin, custos, devs, produtos] = await Promise.all([
      fetchAll(() => c.from("tiktok_pedido").select("order_id,create_dia,status,is_sample_order").gte("create_dia", data.de).lte("create_dia", data.ate), "tiktok pedidos", 60000),
      fetchAll(() => c.from("tiktok_pedido_item").select("order_id,create_dia,status,seller_sku,product_name,sale_price,platform_discount,seller_discount").gte("create_dia", data.de).lte("create_dia", data.ate), "tiktok itens", 90000),
      // Todas as linhas de extrato dos pedidos do período, inclusive estornos em extratos posteriores.
      fetchAll(() => c.from("fact_tiktok_financeiro").select("order_id,order_dia,statement_dia,settlement,comissao_plataforma,comissao_afiliado,comissao_afiliado_ads,comissao_parceiro,taxa_referral,taxa_transacao,frete_custo,imposto,reembolso").gte("order_dia", data.de).lte("order_dia", data.ate), "tiktok extrato", 90000),
      c.from("dim_custo_sku").select("sku,custo_unitario,vigencia_inicio"),
      fetchAll(() => c.from("fact_tiktok_devolucao").select("dia,motivo,valor_reembolso,status").gte("dia", data.de).lte("dia", data.ate), "tiktok devolucoes"),
      c.from("dim_tiktok_produto").select("product_id,titulo,status,nao_a_venda,skus_sem_estoque,faltas,tem_peso,tem_dimensoes,health,estoque_total"),
    ]);
    return {
      economia: economiaTikTok(pedidos, itens, fin, (custos.data ?? []) as Record<string, unknown>[], data.de, data.ate),
      devolucoes: devolucoesPorMotivo(devs, data.de, data.ate),
      listings: saudeListings((produtos.data ?? []) as Record<string, unknown>[]),
    };
  });

// Amazon (Plano Mestre caps. 9, 10, 13, 17; benchmarks/amazon/ANALISE.md §4): só dados já coletados.
// Cada bloco lê sua tabela de forma independente: se uma fila parou, o resto da tela continua.

export const getAmazon = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => {
    const c = await db();
    const erros: Record<string, string> = {};
    const safe = async (nome: string, p: Promise<Record<string, unknown>[]>) => {
      try {
        return await p;
      } catch (e) {
        erros[nome] = e instanceof Error ? e.message : String(e);
        return [] as Record<string, unknown>[];
      }
    };

    const [trafego, ads, vendas, buybox, estoque, reposicao, cadastro, termos, brand, recompra, horas, keywords, sdAlvos] = await Promise.all([
      safe("trafego", fetchAll(() => c.from("fact_amazon_venda_trafego_dia").select("data,vendas,unidades,sessoes,buybox_pct,unidades_devolvidas,em_consolidacao").gte("data", data.de).lte("data", data.ate), "amazon trafego")),
      safe("ads", fetchAll(() => c.from("fact_amazon_ads_campanha_dia").select("data,ad_type,cost,sales_14d,clicks").gte("data", data.de).lte("data", data.ate), "amazon ads", 90000)),
      safe("vendas", fetchAll(() => c.from("fact_amazon_venda_asin_dia").select("data,child_asin,vendas,unidades,sessoes,buybox_pct").gte("data", data.de).lte("data", data.ate), "amazon asin", 90000)),
      safe("buybox", fetchAll(() => c.from("dim_amazon_buybox").select("asin,ganho_buybox,concorrente_no_bb,meu_preco,menor_preco_concorrente"), "amazon buybox")),
      safe("estoque", fetchAll(() => c.from("dim_amazon_estoque_sp").select("asin,seller_sku,fulfillable,imprestavel_total"), "amazon estoque")),
      safe("reposicao", fetchAll(() => c.from("dim_amazon_reposicao").select("sku,asin,titulo,em_fba,fba_disponivel,fba_a_caminho,media_diaria,cobertura_dias,enviar_30d,alerta"), "amazon reposicao")),
      safe("cadastro", fetchAll(() => c.from("dim_amazon_cadastro").select("asin,titulo,faltas,tem_aplus,health"), "amazon cadastro")),
      safe("termos", fetchAll(() => c.from("fact_amazon_ads_search_term_dia").select("data,campaign_name,search_term,keyword_text,match_type,cost,clicks,purchases_14d,sales_14d").gte("data", data.de).lte("data", data.ate), "amazon search terms", 120000)),
      safe("brand", fetchAll(() => c.from("fact_amazon_brand_search_term").select("semana_fim,termo,nosso,click_share,conversion_share,rank_busca").gte("semana_fim", menosDiasIso(data.ate, 35)), "amazon brand analytics", 60000)),
      safe("recompra", fetchAll(() => c.from("fact_amazon_recompra_asin").select("asin,mes_fim,clientes_unicos,pct_clientes_repetem,receita_recompra").gte("mes_fim", menosDiasIso(data.ate, 100)), "amazon recompra")),
      safe("horas", fetchAll(() => c.from("fact_amazon_venda_hora").select("data,hora,venda,pedidos").gte("data", data.de).lte("data", data.ate), "amazon venda hora", 60000)),
      safe("keywords", fetchAll(() => c.from("fact_amazon_ads_keyword_dia").select("data,campaign_name,keyword,match_type,cost,clicks,purchases_14d,sales_14d,top_search_is").gte("data", data.de).lte("data", data.ate), "amazon keywords", 120000)),
      safe("sd", fetchAll(() => c.from("fact_amazon_ads_sd_target_dia").select("data,campaign_id,campaign_name,targeting,targeting_text,cost,clicks,purchases,sales").gte("data", data.de).lte("data", data.ate), "amazon sd alvos", 60000)),
    ]);
    return {
      resumo: resumoAmazon(trafego, ads, data.de, data.ate),
      asins: asin360(vendas, buybox, estoque, reposicao, cadastro, data.de, data.ate).slice(0, 60),
      termos: termosAds(termos, data.de, data.ate),
      share: shareDeBusca(brand),
      reposicao: reposicaoFba(reposicao, estoque),
      recompra: recompraAsin(recompra),
      organico: organicoVsAds(brand, termos, data.de, data.ate),
      horas: vendasPorHora(horas, data.de, data.ate),
      lances: {
        keywords: classificaLances(alvosKeywords(keywords, data.de, data.ate)),
        sd: classificaLances(alvosSd(sdAlvos, data.de, data.ate)),
      },
      erros,
    };
  });


// Mercado Livre (benchmarks/mercado-livre/ANALISE.md §4): economia real, anúncio 360° e Product Ads.
// Só colunas sem dado do comprador (sem buyer_id). Cada bloco é independente.
async function dadosMercadoLivre(data: { de: string; ate: string }) {
    const c = await db();
    const erros: Record<string, string> = {};
    const safe = async (nome: string, p: Promise<Record<string, unknown>[]>) => {
      try {
        return await p;
      } catch (e) {
        erros[nome] = e instanceof Error ? e.message : String(e);
        return [] as Record<string, unknown>[];
      }
    };
    const [pedidos, itens, cupons, afiliados, custosR, adsItem, adsConta, anuncioDia, competicao, full] = await Promise.all([
      safe("pedidos", fetchAll(() => c.from("ml_pedido").select("pedido_id,data_venda,status,total_amount,total_sale_fee").gte("data_venda", data.de).lte("data_venda", data.ate + "T23:59:59"), "ml pedidos", 120000)),
      safe("itens", fetchAll(() => c.from("ml_pedido_item").select("pedido_id,item_id,seller_sku,title,quantity,unit_price").gte("data_venda", data.de).lte("data_venda", data.ate + "T23:59:59"), "ml itens", 150000)),
      safe("cupons", fetchAll(() => c.from("ml_pedido_cupom").select("pedido_id,cupom_vendedor,cupom_meli").gte("data_venda", data.de).lte("data_venda", data.ate + "T23:59:59"), "ml cupons", 120000)),
      safe("afiliados", fetchAll(() => c.from("ml_afiliado_venda").select("pedido_id,item_id,item_id_ml,comissao_pedido,casou_pedido").gte("data_venda", data.de).lte("data_venda", data.ate + "T23:59:59"), "ml afiliados", 60000)),
      safe("custos", fetchAll(() => c.from("dim_custo_sku").select("sku,custo_unitario,vigencia_inicio"), "custos")),
      safe("ads", fetchAll(() => c.from("vw_ml_pads_item_dia").select("date,item_id,title,cost,direct_amount,indirect_amount,organic_units_amount,lost_impression_share_by_budget,lost_impression_share_by_ad_rank,acos_benchmark").gte("date", data.de).lte("date", data.ate), "ml product ads", 120000)),
      safe("adsConta", fetchAll(() => c.from("tab_ml_kpi_dia").select("data,invest_pads,invest_brand,invest_display").gte("data", data.de).lte("data", data.ate), "ml kpi dia")),
      safe("anuncioDia", fetchAll(() => c.from("vw_ml_anuncio_dia").select("data,item_id,visitas,pedidos,unidades,faturamento").gte("data", data.de).lte("data", data.ate), "ml anuncio dia", 120000)),
      safe("competicao", fetchAll(() => c.from("vw_ml_competicao").select("item_id,sku,nome,anuncio_status,preco_venda,price_to_win,buybox_status,situacao,health,estoque_disponivel"), "ml competicao")),
      safe("full", fetchAll(() => c.from("dim_ml_produto").select("seller_sku,em_full,full_disponivel,cobertura_dias"), "ml full")),
    ]);
    const ids = [...new Set(pedidos.map((p) => p["pedido_id"] as number).filter((x) => x != null))];
    const fretes = await safe("fretes", fetchIn(c, "vw_ml_frete_pedido", "pedido_id,frete_rateado", "pedido_id", ids, "ml frete"));
    const economia = economiaML(pedidos, itens, fretes, cupons, afiliados, custosR, adsItem, adsConta, data.de, data.ate);
    const ads = diagnosticoAds(adsItem, data.de, data.ate);
    const anuncios = anuncios360(anuncioDia, competicao, full, economia.skus, data.de, data.ate);
    return { economia: { ...economia, skus: economia.skus.slice(0, 80) }, anuncios, ads, alertas: alertasML({ anuncios, ads }), erros };
}

export const getMercadoLivre = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => dadosMercadoLivre(data));


// Shopee (benchmarks/shopee/ANALISE.md §4): economia pelo escrow, Ads, produtos, lives e cancelamentos.
// Sem buyer_user_id, buyer_username nem invoice_access_key (LGPD). Cada bloco é independente.
async function dadosShopee(data: { de: string; ate: string }) {
  const c = await db();
  const erros: Record<string, string> = {};
  const safe = async (nome: string, p: Promise<Record<string, unknown>[]>) => {
    try {
      return await p;
    } catch (e) {
      erros[nome] = e instanceof Error ? e.message : String(e);
      return [] as Record<string, unknown>[];
    }
  };
  const [pedidos, itens, fin, custosR, adsDia, adsCamp, adsHora, itemDia, estoque, produtos, metricas, sessoes] = await Promise.all([
    safe("pedidos", fetchAll(() => c.from("shopee_pedido").select("order_sn,create_dia,order_status,cancel_reason,cancel_by,total_amount").gte("create_dia", data.de).lte("create_dia", data.ate), "shopee pedidos", 120000)),
    safe("itens", fetchAll(() => c.from("shopee_pedido_item").select("order_sn,create_dia,order_status,item_id,item_name,item_sku,model_sku,model_quantity_purchased,cancelled_qty,returned_qty,model_discounted_price").gte("create_dia", data.de).lte("create_dia", data.ate), "shopee itens", 150000)),
    safe("financeiro", fetchAll(() => c.from("fact_shopee_financeiro").select("order_sn,escrow_amount,commission_fee,service_fee,seller_transaction_fee,campaign_fee,comissao_afiliado,fbs_fee,seller_return_refund,reverse_shipping_fee,escrow_tax,withholding_tax,shopee_discount,voucher_from_shopee,seller_discount,voucher_from_seller,coins,actual_shipping_fee,shopee_shipping_rebate,buyer_paid_shipping_fee").gte("create_dia", data.de).lte("create_dia", data.ate), "shopee escrow", 120000)),
    safe("custos", fetchAll(() => c.from("dim_custo_sku").select("sku,custo_unitario,vigencia_inicio"), "custos")),
    safe("adsDia", fetchAll(() => c.from("fact_shopee_ads_campanha_dia").select("data,campaign_id,ad_type,expense,direct_gmv,broad_gmv,direct_order,clicks").gte("data", data.de).lte("data", data.ate), "shopee ads", 60000)),
    safe("adsCamp", fetchAll(() => c.from("dim_shopee_ads_campanha").select("campaign_id,ad_name,ad_type,roas_target,campaign_status"), "shopee campanhas")),
    safe("adsHora", fetchAll(() => c.from("fact_shopee_ads_hora").select("data,hora,expense,direct_gmv").gte("data", data.de).lte("data", data.ate), "shopee ads hora", 60000)),
    safe("itemDia", fetchAll(() => c.from("vw_shopee_item_dia").select("data,item_id,title,seller_sku,visitas,pedidos,unidades_vendidas,receita").gte("data", data.de).lte("data", data.ate), "shopee item dia", 120000)),
    safe("estoque", fetchAll(() => c.from("vw_shopee_estoque").select("item_id,estoque_total,dias_de_cobertura,media_diaria"), "shopee estoque")),
    safe("produtos", fetchAll(() => c.from("dim_shopee_produto").select("item_id,item_sku,nome,fotos,tem_dimensoes,rating"), "shopee produtos")),
    safe("metricas", fetchAll(() => c.from("shopee_item_metricas_dia").select("data,item_id,rating,comentarios").gte("data", data.de).lte("data", data.ate), "shopee metricas", 60000)),
    safe("lives", fetchAll(() => c.from("live_shopee_sessao").select("sessao_id,titulo,inicio,duracao_seg,espectadores,pedidos_confirmados,vendas_confirmadas").gte("inicio", data.de).lte("inicio", data.ate + "T23:59:59"), "shopee lives")),
  ]);
  const sessaoIds = sessoes.map((s) => s["sessao_id"] as number).filter((x) => x != null);
  const produtosLive = await safe("produtosLive", fetchIn(c, "live_shopee_produto", "sessao_id,item_id,cliques,atc,pedidos_confirmados,vendas_confirmadas", "sessao_id", sessaoIds, "shopee live produtos"));
  const economia = economiaShopee(pedidos, itens, fin, custosR, adsDia, data.de, data.ate);
  const ads = adsShopee(adsDia, adsCamp, data.de, data.ate);
  const horas = adsPorHora(adsHora, data.de, data.ate);
  const prods = produtosShopee(itemDia, estoque, produtos, metricas, data.de, data.ate);
  return {
    economia: { ...economia, skus: economia.skus.slice(0, 80) },
    ads,
    horas,
    produtos: prods,
    lives: livesShopee(sessoes, produtosLive, produtos, data.de, data.ate),
    cancelamentos: cancelamentosShopee(pedidos, itens, data.de, data.ate),
    alertas: alertasShopee({ produtos: prods, skus: economia.skus, ads, horas }),
    erros,
  };
}

export const getShopee = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => dadosShopee(data));


// Google Ads e site (benchmarks/google/ANALISE.md §4): views vw_google_* / vw_gads_* e páginas do site.
async function dadosGoogle(data: { de: string; ate: string }) {
  const c = await db();
  const erros: Record<string, string> = {};
  const safe = async (nome: string, p: Promise<Record<string, unknown>[]>) => {
    try {
      return await p;
    } catch (e) {
      erros[nome] = e instanceof Error ? e.message : String(e);
      return [] as Record<string, unknown>[];
    }
  };
  const hoje = new Date().toISOString().slice(0, 10);
  const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const [dias, lista, intraday, produtos, variantes, custosR, negativar, graduar, keywords, assets, sessoes, pedidosPag, paginas] = await Promise.all([
    safe("campanhas", fetchAll(() => c.from("vw_google_campanha_dia").select("data,campaign_id,campaign_name,tipo,gasto,receita,receita_shopify,impressoes,fatia_impressao,fatia_perdida_orcamento,fatia_perdida_rank").gte("data", data.de).lte("data", data.ate), "google campanhas", 60000)),
    safe("lista", fetchAll(() => c.from("vw_google_campanha_lista").select("campaign_id,campaign_name,tipo,status,target_roas,target_cpa,optimization_score,orcamento_diario"), "google lista")),
    safe("intraday", fetchAll(() => c.from("vw_google_intraday_campanha").select("data,campaign_id,campaign_name,gasto,captured_at").gte("data", ontem).lte("data", hoje), "google intraday", 30000)),
    safe("produtos", fetchAll(() => c.from("vw_google_produto_dia").select("data,product_item_id,product_title,gasto,receita,conversoes,cliques").gte("data", data.de).lte("data", data.ate), "google produtos", 120000)),
    safe("variantes", fetchAll(() => c.from("stg_shopify_products_variant").select("product_variant_id,product_variant_sku,product_variant_inventory_item_sku,product_variant_price,date").order("date", { ascending: false }), "shopify variantes", 30000)),
    safe("custos", fetchAll(() => c.from("dim_custo_sku").select("sku,custo_unitario,vigencia_inicio"), "custos")),
    safe("negativar", fetchAll(() => c.from("vw_gads_termos_negativar").select("campanha,termo,cliques,invest_desperdicado,sugestao").order("invest_desperdicado", { ascending: false }), "google negativar", 1000)),
    safe("graduar", fetchAll(() => c.from("vw_gads_termos_graduar").select("campanha,termo,cliques,conversoes,invest,receita,roas,sugestao").order("receita", { ascending: false }), "google graduar", 1000)),
    safe("keywords", fetchAll(() => c.from("vw_gads_keywords_top").select("campanha,keyword,match_type,quality_score,invest,receita,roas,sugestao").order("invest", { ascending: false }), "google keywords", 1000)),
    safe("assets", fetchAll(() => c.from("vw_google_pmax_asset").select("campaign_id,campaign_name,asset_group_id,asset_group_name,asset_type,field_type,performance_label,status,texto,youtube_video_id"), "google assets")),
    safe("sessoes", fetchAll(() => c.from("fact_site_pagina_dia").select("data,pagina_path,sessoes,sessoes_checkout").gte("data", data.de).lte("data", data.ate), "site sessoes", 120000)),
    safe("pedidosPag", fetchAll(() => c.from("mv_site_pedido_pagina_dia").select("data,pagina_path,pedidos,receita").gte("data", data.de).lte("data", data.ate), "site pedidos por pagina", 120000)),
    safe("paginas", fetchAll(() => c.from("vw_site_pagina").select("pagina_path,tipo,rotulo,produto"), "site paginas")),
  ]);
  // Variantes: o mais recente de cada ID (a tabela pode ter fotos por data).
  const vistas = new Set<string>();
  const variantesUnicas = variantes.filter((v) => {
    const id = String(v["product_variant_id"] ?? "");
    if (!id || vistas.has(id)) return false;
    vistas.add(id);
    return true;
  });
  const campanhas = campanhasGoogle(dias, lista, data.de, data.ate);
  const prods = produtosGoogle(produtos, variantesUnicas, custosR, data.de, data.ate);
  const pags = paginasSite(sessoes, pedidosPag, paginas, data.de, data.ate);
  return {
    campanhas,
    ritmo: ritmoIntraday(intraday, lista),
    produtos: prods,
    termos: {
      negativar: negativar.slice(0, 30).map((x) => ({ termo: String(x["termo"] ?? ""), campanha: String(x["campanha"] ?? ""), cliques: Number(x["cliques"]) || 0, semRetorno: Number(x["invest_desperdicado"]) || 0, sugestao: String(x["sugestao"] ?? "") })),
      graduar: graduar.slice(0, 30).map((x) => ({ termo: String(x["termo"] ?? ""), campanha: String(x["campanha"] ?? ""), conversoes: Number(x["conversoes"]) || 0, receita: Number(x["receita"]) || 0, roas: x["roas"] == null ? null : Number(x["roas"]), sugestao: String(x["sugestao"] ?? "") })),
      keywords: keywords.slice(0, 30).map((x) => ({ keyword: String(x["keyword"] ?? ""), correspondencia: String(x["match_type"] ?? "").toLowerCase(), qualidade: x["quality_score"] == null ? null : Number(x["quality_score"]), invest: Number(x["invest"]) || 0, roas: x["roas"] == null ? null : Number(x["roas"]), sugestao: String(x["sugestao"] ?? "") })),
    },
    assets: assetsPmax(assets),
    paginas: pags,
    alertas: alertasGoogle({ campanhas, produtos: prods, termosNegativar: negativar, paginas: pags }),
    erros,
  };
}

export const getGoogle = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => dadosGoogle(data));


// Meta Ads (benchmarks/meta-ads/ANALISE.md §4). As views vw_meta_criativos, _fadiga, _publicos, _posicionamento,
// _demografia, _horario e _funil têm janela própria (sem coluna de data); a reconciliação e o intraday usam o período.
async function dadosMeta(data: { de: string; ate: string }) {
  const c = await db();
  const erros: Record<string, string> = {};
  const safe = async (nome: string, p: Promise<Record<string, unknown>[]>) => {
    try {
      return await p;
    } catch (e) {
      erros[nome] = e instanceof Error ? e.message : String(e);
      return [] as Record<string, unknown>[];
    }
  };
  const hoje = new Date().toISOString().slice(0, 10);
  const de8 = new Date(Date.now() - 8 * 86400000).toISOString().slice(0, 10);
  const [recon, criativos, fadiga, formatos, publicos, posic, demog, horario, funil, intraday, kpi] = await Promise.all([
    safe("reconciliacao", fetchAll(() => c.from("vw_reconciliacao_shopify_meta_dia").select("data,gasto_meta,receita_informada_meta,receita_meta_utm,compras_informadas_meta,pedidos_meta_utm,enviados_meta,pedidos_totais").gte("data", data.de).lte("data", data.ate), "meta reconciliacao")),
    safe("criativos", fetchAll(() => c.from("vw_meta_criativos").select("criativo,titulo,campanha,grupo,publico,invest,receita,roas,ctr_pct,hook_pct,frequencia,compras,sugestao"), "meta criativos")),
    safe("fadiga", fetchAll(() => c.from("vw_meta_fadiga").select("criativo,publico,diagnostico,freq_7d,freq_ant,roas_7d,roas_ant,invest_7d"), "meta fadiga")),
    safe("formatos", fetchAll(() => c.from("vw_meta_criativo_formato").select("formato,criativos,invest,receita,roas,ctr_pct"), "meta formatos")),
    safe("publicos", fetchAll(() => c.from("vw_meta_publicos").select("publico,grupo,invest,receita,roas,ctr_pct"), "meta publicos")),
    safe("posicionamento", fetchAll(() => c.from("vw_meta_posicionamento").select("plataforma,posicionamento,dispositivo,invest,receita,roas,ctr_pct"), "meta posicionamento")),
    safe("demografia", fetchAll(() => c.from("vw_meta_demografia").select("faixa_idade,genero,invest,receita,roas,ctr_pct"), "meta demografia")),
    safe("horario", fetchAll(() => c.from("vw_meta_horario").select("hora,invest,receita,roas,ctr_pct"), "meta horario")),
    safe("funil", fetchAll(() => c.from("vw_meta_funil").select("ord,etapa,valor,taxa_passagem,cpa"), "meta funil")),
    safe("intraday", fetchAll(() => c.from("vw_meta_intraday").select("data,gasto,receita,captured_at").gte("data", hoje), "meta intraday")),
    safe("kpi", fetchAll(() => c.from("vw_meta_kpi_dia").select("data,gasto,receita").gte("data", de8).lte("data", hoje), "meta kpi dia")),
  ]);
  const reconciliacao = reconciliacaoMeta(recon, data.de, data.ate);
  const cr = criativosMeta(criativos, fadiga, formatos);
  const ritmo = ritmoMeta(intraday, kpi);
  return {
    reconciliacao,
    criativos: cr,
    segmentos: segmentosMeta(publicos, posic, demog, horario),
    funil: funilMeta(funil),
    ritmo,
    alertas: alertasMeta({ recon: reconciliacao, criativos: cr, ritmo }),
    erros,
  };
}

export const getMeta = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => dadosMeta(data));

// Metas do mês (meta = objetivo) × realizado por canal, com as anotações do mês (meta_evento).
export const getMetasMes = createServerFn({ method: "GET" }).handler(async () => {
  const c = await db();
  const hoje = new Date().toISOString().slice(0, 10);
  const mes = hoje.slice(0, 7);
  const ini = `${mes}-01`;
  const [rows, eventos] = await Promise.all([
    fetchAll(() => c.from("vw_meta_vs_real_dia").select("data,mes,canal,receita_meta,receita_real,ads_meta,ads_real,dia_futuro,dado_provisorio").gte("data", ini), "metas do mes").catch(() => [] as Record<string, unknown>[]),
    c.from("meta_evento").select("data,tipo,titulo,obs").gte("data", ini).order("data"),
  ]);
  return {
    mes,
    canais: metasDoMes(rows, hoje),
    eventos: ((eventos.data ?? []) as Record<string, unknown>[]).map((e) => ({ data: String(e["data"] ?? ""), tipo: String(e["tipo"] ?? ""), titulo: String(e["titulo"] ?? ""), obs: String(e["obs"] ?? "") })),
  };
});
