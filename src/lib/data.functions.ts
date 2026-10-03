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
      fetchAll(() => c.from("mv_pl_canal_dia").select("data,canal,receita_bruta,custo_canal,ads,imposto,cmv,margem_contribuicao,cmv_cobertura_pct").gte("data", data.de).lte("data", data.ate).order("data"), "p&l"),
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
      c.from("fact_pedido_cliente").select("canal,pedido_id,data,valor,desconto,frete,status,itens,nome,sobrenome,email,cpf,telefone,uf,cidade").eq("cliente_chave", data.chave).order("data", { ascending: false }).limit(200),
    ]);
    const peds = check(pedidos, "pedidos") as Record<string, string>[];
    const ultimo = peds[0];
    const digits = (s?: string) => (s ?? "").replace(/\D/g, "");
    const contato = ultimo
      ? {
          nome: maskName(ultimo.nome, ultimo.sobrenome),
          email: ultimo.email?.includes("@") ? `${ultimo.email.slice(0, 2)}***@${ultimo.email.split("@")[1]}` : null,
          documento: digits(ultimo.cpf).length >= 11 ? `***.${digits(ultimo.cpf).slice(3, 6)}.***-**` : null,
          telefone: digits(ultimo.telefone).length >= 4 ? `(**) *****-${digits(ultimo.telefone).slice(-4)}` : null,
          uf: ultimo.uf,
          cidade: ultimo.cidade,
        }
      : null;
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
      pedidos: peds.map(({ nome: _n, sobrenome: _s, email: _e, cpf: _c, telefone: _t, ...p }) => p),
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
        let q = c.from("mv_produto_dia").select("canal,sku,produto,unidades,pedidos,receita,invest_ads,receita_ads").gte("data", data.de).lte("data", data.ate);
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
      c.from("dim_custo_sku").select("*").eq("sku", data.sku).order("vigencia_inicio", { ascending: false }).limit(1),
      c.from("mv_growth_produto_ciclo").select("*").eq("sku", data.sku).limit(5),
      c.from("mv_growth_produto_proximo").select("sku_seguinte,produto_seguinte,ocorrencias,forca_pct,pos").eq("sku_origem", data.sku).order("ocorrencias", { ascending: false }).limit(8),
      c.from("dim_shopify_produto").select("*").eq("sku", data.sku).limit(1),
    ]);
    return { serie, custo: custo.data?.[0] ?? null, ciclo: ciclo.data?.[0] ?? null, proximo: proximo.data ?? [], estoque: estoque.data?.[0] ?? null };
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
    const tipos = await fetchAll(() => c.from("vw_ads_por_tipo_dia").select("data,tipo,investimento,receita,impressoes,cliques,unidades").gte("data", data.de).lte("data", data.ate).order("data"), "ads tipo");
    return { tipos };
  });

export const getAffiliate = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => {
    const c = await db();
    const [dia, pub, canal] = await Promise.all([
      fetchAll(() => c.from("vw_awin_dia").select("*").gte("data", data.de).lte("data", data.ate).order("data"), "awin dia"),
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
