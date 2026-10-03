// Leituras da Soldiers Platform. Somente leitura de objetos JÁ EXISTENTES no Supabase.
// Todas as leituras do app passam por aqui (ponto único para adicionar proteção depois).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;
async function db(): Promise<Db> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as Db;
}

function check<T>(r: { data: T; error: { message: string } | null }, ctx: string): T {
  if (r.error) throw new Error(`${ctx}: ${r.error.message}`);
  return r.data;
}

// Busca paginada para contornar o limite de 1000 linhas por consulta.
async function fetchAll<T = Record<string, unknown>>(make: () => Db, ctx: string, max = 30000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < max; from += 1000) {
    const rows = check(await make().range(from, from + 999), ctx) as T[];
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}

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
    return { serie, custo: custo.data?.[0] ?? null, custos: (custo.data ?? []) as Record<string, unknown>[], ciclo: ciclo.data?.[0] ?? null, proximo: proximo.data ?? [], estoque: estoque.data?.[0] ?? null, estoqueCanais };
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
    const [tipos, funil] = await Promise.all([
      fetchAll(() => c.from("vw_ads_por_tipo_dia").select("data,tipo,investimento,receita,impressoes,cliques,unidades").gte("data", data.de).lte("data", data.ate).order("data"), "ads tipo"),
      // Funil por canal de venda (impressão → clique → conversão), previsto no plano revisado da Fase 1.
      fetchAll(() => c.from("vw_ads_funil_canal_dia").select("data,canal,invest,receita_ads,impressoes,cliques,conversoes,base_conversao").gte("data", data.de).lte("data", data.ate).order("data"), "ads funil"),
    ]);
    return { tipos, funil };
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

  return { fontes, filas, logs, problemas, afiliadoMl: (afiliadoMl.data ?? []) as Record<string, unknown>[] };
});
