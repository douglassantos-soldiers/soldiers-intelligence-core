// Leituras da Soldiers Platform — Command Center (visão geral e metas), Customer 360, Product 360 e Pedidos.
// Somente leitura de objetos JÁ EXISTENTES no Supabase. data.functions.ts reexporta as server functions.
import { hojeSP } from "@/lib/datas";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { metasDoMes } from "@/lib/metaads";
import { amazonDoSku } from "@/lib/amazon";
import { db, check, fetchAll } from "@/lib/db-helpers";

function maskName(nome?: string | null, sobrenome?: string | null) {
  const n = (nome ?? "")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const s = (sobrenome ?? "").trim();
  return [n, s ? s[0].toUpperCase() + "." : ""].filter(Boolean).join(" ") || "—";
}
const Periodo = z.object({
  de: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/* ---------------- Command Center / canais ---------------- */
export const getOverview = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => {
    const c = await db();
    const [rc, pl, nr] = await Promise.all([
      fetchAll(
        () =>
          c
            .from("vw_receita_consolidada")
            .select(
              "data,canal,faturamento,pedidos,invest_ads,receita_ads,invest_afiliados,invest_aquisicao",
            )
            .gte("data", data.de)
            .lte("data", data.ate)
            .order("data"),
        "receita",
      ),
      fetchAll(
        () =>
          c
            .from("mv_pl_canal_dia")
            .select(
              "data,canal,receita_bruta,custo_canal,det_taxa,det_frete,det_afiliado,ads,imposto,cmv,margem_contribuicao,cmv_cobertura_pct",
            )
            .gte("data", data.de)
            .lte("data", data.ate)
            .order("data"),
        "p&l",
      ),
      c.rpc("growth_novos_recorrentes", { p_de: data.de, p_ate: data.ate }),
    ]);
    return {
      receita: rc,
      pl,
      novosRecorrentes: (nr.error ? [] : nr.data) as Record<string, number>[],
    };
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
    const cols =
      "cliente_chave,pedidos,primeira_compra,ultima_compra,valor_total,ticket_medio,canais,canal_entrada,canal_ultimo,produto_principal,ritmo_dias,dias_ultima_compra,dias_atraso,chance_30,chance_90,valor_esperado_90,ltv_esperado,acao,gerado_em";
    let q = c.from("mv_growth_cliente_perfil").select(cols);
    const busca = data.busca?.trim();
    if (busca) {
      const [eh, ch] = await Promise.all([
        c.rpc("email_hash", { p: busca }),
        c.rpc("cpf_hash", { p: busca }),
      ]);
      const ors = [
        eh.data && `email_hash.eq.${eh.data}`,
        ch.data && `doc_hash.eq.${ch.data}`,
        /^[0-9a-f]{64}$/.test(busca) && `cliente_chave.eq.${busca}`,
      ].filter(Boolean);
      if (!ors.length) return { rows: [] };
      const found = check(
        await c.from("fact_pedido_cliente").select("cliente_chave").or(ors.join(",")).limit(50),
        "busca",
      ) as { cliente_chave: string }[];
      const keys = [...new Set(found.map((f) => f.cliente_chave).filter(Boolean))];
      if (!keys.length) return { rows: [] };
      q = q.in("cliente_chave", keys);
    }
    if (data.acao) q = q.eq("acao", data.acao);
    q =
      data.ordem === "chance"
        ? q.order("chance_30", { ascending: false })
        : q.order("valor_esperado_90", { ascending: false });
    const rows = check(await q.range(data.page * 50, data.page * 50 + 49), "clientes") as Record<
      string,
      unknown
    >[];
    const keys = rows.map((r) => r.cliente_chave as string);
    const nomes: Record<string, { nome: string; uf: string | null; cidade: string | null }> = {};
    if (keys.length) {
      const ped = check(
        await c
          .from("fact_pedido_cliente")
          .select("cliente_chave,nome,sobrenome,uf,cidade,data")
          .in("cliente_chave", keys)
          .order("data", { ascending: false })
          .limit(1000),
        "nomes",
      ) as Record<string, string>[];
      for (const p of ped)
        if (!nomes[p.cliente_chave])
          nomes[p.cliente_chave] = {
            nome: maskName(p.nome, p.sobrenome),
            uf: p.uf,
            cidade: p.cidade,
          };
    }
    return {
      rows: rows.map((r) => ({
        ...r,
        ...(nomes[r.cliente_chave as string] ?? { nome: "—", uf: null, cidade: null }),
      })),
    };
  });

export const getClienteResumo = createServerFn({ method: "GET" }).handler(async () => {
  const c = await db();
  const [kpis, acoes] = await Promise.all([
    c.from("vw_cliente_kpis").select("*").limit(1),
    c
      .from("mv_growth_acao_resumo")
      .select("acao,canal,clientes,valor_esperado,chance_media,ticket_medio,gerado_em"),
  ]);
  return {
    kpis: kpis.error ? null : (kpis.data?.[0] ?? null),
    acoes: (acoes.data ?? []) as Record<string, unknown>[],
  };
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
      c
        .from("fact_pedido_cliente")
        .select("canal,pedido_id,data,valor,desconto,frete,status,itens,nome,sobrenome,uf,cidade")
        .eq("cliente_chave", data.chave)
        .order("data", { ascending: false })
        .limit(200),
    ]);
    const peds = check(pedidos, "pedidos") as Record<string, string>[];
    const ultimo = peds[0];
    const contato = ultimo
      ? { nome: maskName(ultimo.nome, ultimo.sobrenome), uf: ultimo.uf, cidade: ultimo.cidade }
      : null;
    let itens: Record<string, unknown>[] = [];
    if (peds.length) {
      const ids = [...new Set(peds.map((p) => p.pedido_id))].slice(0, 200);
      itens = check(
        await c
          .from("fact_pedido_item_cliente")
          .select("canal,pedido_id,sku,produto,quantidade,valor_total,data")
          .in("pedido_id", ids)
          .limit(1000),
        "itens",
      );
      const validos = new Set(peds.map((p) => `${p.canal}|${p.pedido_id}`));
      itens = itens.filter((i) => validos.has(`${i.canal}|${i.pedido_id}`));
    }
    const skus = [...new Set(itens.map((i) => i.sku as string).filter(Boolean))];
    const custos = skus.length
      ? (check(
          await c
            .from("dim_custo_sku")
            .select("sku,custo_unitario,vigencia_inicio")
            .in("sku", skus),
          "custo",
        ) as Record<string, string>[])
      : [];
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
      fetchAll(
        () => {
          let q = c
            .from("mv_produto_dia")
            .select("data,canal,sku,produto,unidades,pedidos,receita,invest_ads,receita_ads")
            .gte("data", data.de)
            .lte("data", data.ate);
          if (data.canal) q = q.eq("canal", data.canal);
          return q.order("data");
        },
        "produtos",
        60000,
      ),
      fetchAll(
        () => c.from("dim_custo_sku").select("sku,custo_unitario,vigencia_inicio"),
        "custos",
      ),
      fetchAll(
        () =>
          c
            .from("mv_growth_produto_ciclo")
            .select("sku,clientes,recompras,ciclo_mediano,pct_retorno_90"),
        "ciclos",
      ),
      fetchAll(
        () => c.from("dim_shopify_produto").select("sku,estoque,cobertura_dias,alerta"),
        "estoque site",
      ),
    ]);
    return { rows, custos, ciclos, estoque };
  });

export const getProduto = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.extend({ sku: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const c = await db();
    const [serie, custo, ciclo, proximo, estoque] = await Promise.all([
      fetchAll(
        () =>
          c
            .from("mv_produto_dia")
            .select("data,canal,produto,unidades,pedidos,receita,invest_ads,receita_ads")
            .eq("sku", data.sku)
            .gte("data", data.de)
            .lte("data", data.ate)
            .order("data"),
        "serie",
      ),
      // Todas as vigências: o CMV de cada dia usa o custo vigente naquela data.
      c
        .from("dim_custo_sku")
        .select("*")
        .eq("sku", data.sku)
        .order("vigencia_inicio", { ascending: false }),
      c.from("mv_growth_produto_ciclo").select("*").eq("sku", data.sku).limit(5),
      c
        .from("mv_growth_produto_proximo")
        .select("sku_seguinte,produto_seguinte,ocorrencias,forca_pct,pos")
        .eq("sku_origem", data.sku)
        .order("ocorrencias", { ascending: false })
        .limit(8),
      c.from("dim_shopify_produto").select("*").eq("sku", data.sku).limit(1),
    ]);
    // Estoque por canal, sem somar entre canais (Plano Mestre cap. 6.4). O vínculo é pelo
    // SKU do vendedor em cada marketplace; se o SKU for diferente no canal, não aparece.
    const [amz, ml, shp, tt] = await Promise.all([
      c
        .from("dim_amazon_estoque")
        .select("sku,asin,disponivel,reservado,total,atualizado_em")
        .eq("sku", data.sku),
      c
        .from("dim_ml_estoque_full")
        .select("seller_sku,item_id,disponivel,em_transferencia,total,vendas_7d,atualizado_em")
        .eq("seller_sku", data.sku),
      // Shopee: o SKU pode estar na variação (model_sku) ou no item (item_sku). Duas consultas
      // com .eq, sem interpolar o SKU num filtro .or.
      Promise.all([
        c
          .from("dim_shopee_estoque")
          .select(
            "model_id,model_sku,item_sku,estoque_normal,estoque_reservado,estoque_total,atualizado_em",
          )
          .eq("model_sku", data.sku),
        c
          .from("dim_shopee_estoque")
          .select(
            "model_id,model_sku,item_sku,estoque_normal,estoque_reservado,estoque_total,atualizado_em",
          )
          .eq("item_sku", data.sku),
      ]).then(([a, b]) => {
        const seen = new Set<string>();
        const rows = [...(a.data ?? []), ...(b.data ?? [])].filter((r: Record<string, unknown>) => {
          const k = `${r["model_id"]}|${r["item_sku"]}|${r["model_sku"]}`;
          return seen.has(k) ? false : (seen.add(k), true);
        });
        return { data: rows as Record<string, unknown>[], error: a.error ?? b.error };
      }),
      c
        .from("dim_tiktok_estoque")
        .select("seller_sku,warehouse_id,quantidade,atualizado_em")
        .eq("seller_sku", data.sku),
    ]);
    const sum = (rows: Record<string, unknown>[] | null, k: string) =>
      (rows ?? []).reduce((t, r) => t + (Number(r[k]) || 0), 0);
    const ult = (rows: Record<string, unknown>[] | null) =>
      (rows ?? [])
        .map((r) => String(r["atualizado_em"] ?? ""))
        .sort()
        .at(-1) ?? null;
    const estoqueCanais = [
      {
        canal: "Amazon (FBA)",
        disponivel: sum(amz.data, "disponivel"),
        total: sum(amz.data, "total"),
        registros: amz.data?.length ?? 0,
        atualizado: ult(amz.data),
        erro: amz.error?.message ?? null,
      },
      {
        canal: "Mercado Livre (Full)",
        disponivel: sum(ml.data, "disponivel"),
        total: sum(ml.data, "total"),
        registros: ml.data?.length ?? 0,
        atualizado: ult(ml.data),
        erro: ml.error?.message ?? null,
      },
      {
        canal: "Shopee",
        disponivel: sum(shp.data, "estoque_normal"),
        total: sum(shp.data, "estoque_total"),
        registros: shp.data?.length ?? 0,
        atualizado: ult(shp.data),
        erro: shp.error?.message ?? null,
      },
      {
        canal: "TikTok Shop",
        disponivel: sum(tt.data, "quantidade"),
        total: sum(tt.data, "quantidade"),
        registros: tt.data?.length ?? 0,
        atualizado: ult(tt.data),
        erro: tt.error?.message ?? null,
      },
    ];
    // Amazon do SKU (ASIN 360° + Ads por produto). O vínculo SKU → ASIN vem da reposição, do estoque FBA
    // e dos anúncios por produto. Se falhar, a página continua sem o bloco.
    let amazon: ReturnType<typeof amazonDoSku> = null;
    let amazonErro: string | null = null;
    try {
      const [rep, est, adsP] = await Promise.all([
        fetchAll(
          () =>
            c
              .from("dim_amazon_reposicao")
              .select("sku,asin,titulo,em_fba,fba_disponivel,cobertura_dias")
              .eq("sku", data.sku),
          "amazon reposicao",
        ),
        fetchAll(
          () =>
            c
              .from("dim_amazon_estoque_sp")
              .select("asin,seller_sku,fulfillable")
              .eq("seller_sku", data.sku),
          "amazon estoque",
        ),
        fetchAll(
          () =>
            c
              .from("fact_amazon_ads_produto_dia")
              .select("data,asin,sku,cost,sales_14d")
              .eq("sku", data.sku)
              .gte("data", data.de)
              .lte("data", data.ate),
          "amazon ads produto",
        ),
      ]);
      const asins = [
        ...new Set([...rep, ...est, ...adsP].map((r) => String(r["asin"] ?? "")).filter(Boolean)),
      ];
      if (asins.length) {
        const [vendasA, bb, cad] = await Promise.all([
          fetchAll(
            () =>
              c
                .from("fact_amazon_venda_asin_dia")
                .select("data,child_asin,vendas,unidades,sessoes,buybox_pct")
                .in("child_asin", asins)
                .gte("data", data.de)
                .lte("data", data.ate),
            "amazon asin",
          ),
          fetchAll(
            () =>
              c
                .from("dim_amazon_buybox")
                .select("asin,ganho_buybox,concorrente_no_bb,meu_preco,menor_preco_concorrente")
                .in("asin", asins),
            "amazon buybox",
          ),
          fetchAll(
            () =>
              c
                .from("dim_amazon_cadastro")
                .select("asin,titulo,faltas,tem_aplus,health")
                .in("asin", asins),
            "amazon cadastro",
          ),
        ]);
        amazon = amazonDoSku(
          data.sku,
          [...rep, ...est],
          vendasA,
          bb,
          est,
          rep,
          cad,
          adsP,
          data.de,
          data.ate,
        );
      }
    } catch (e) {
      amazonErro = e instanceof Error ? e.message : String(e);
    }
    return {
      serie,
      custo: custo.data?.[0] ?? null,
      custos: (custo.data ?? []) as Record<string, unknown>[],
      ciclo: ciclo.data?.[0] ?? null,
      proximo: proximo.data ?? [],
      estoque: estoque.data?.[0] ?? null,
      estoqueCanais,
      amazon,
      amazonErro,
    };
  });

/* ---------------- Orders ---------------- */
export const getPedidos = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    Periodo.extend({
      canal: z.string().max(40),
      busca: z.string().max(80).optional(),
      page: z.number().int().min(0).max(500).default(0),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const c = await db();
    let q = c
      .from("fact_pedido_cliente")
      .select(
        "canal,pedido_id,data,data_hora,nome,sobrenome,cliente_chave,uf,valor,valor_bruto,desconto,frete,status,itens,pagamento_metodo",
      )
      .eq("canal", data.canal);
    if (data.busca?.trim()) q = q.eq("pedido_id", data.busca.trim());
    else q = q.gte("data", data.de).lte("data", data.ate);
    const rows = check(
      await q
        .order("data", { ascending: false })
        .order("data_hora", { ascending: false, nullsFirst: false })
        .range(data.page * 50, data.page * 50 + 49),
      "pedidos",
    ) as Record<string, string>[];
    return rows.map(({ nome, sobrenome, ...r }) => ({ ...r, cliente: maskName(nome, sobrenome) }));
  });

export const getPedido = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ canal: z.string().max(40), id: z.string().max(80) }).parse(d))
  .handler(async ({ data }) => {
    const c = await db();
    const [p, itens] = await Promise.all([
      c
        .from("fact_pedido_cliente")
        .select(
          "canal,pedido_id,data,data_hora,nome,sobrenome,cliente_chave,uf,cidade,valor,valor_bruto,desconto,frete,status,status_detalhe,pagamento_metodo,parcelas",
        )
        .eq("canal", data.canal)
        .eq("pedido_id", data.id)
        .maybeSingle(),
      c
        .from("fact_pedido_item_cliente")
        .select(
          "linha,sku,produto,variacao,quantidade,preco_unitario,desconto,valor_total,sale_fee",
        )
        .eq("canal", data.canal)
        .eq("pedido_id", data.id)
        .order("linha"),
    ]);
    const its = (itens.data ?? []) as Record<string, string>[];
    const skus = [...new Set(its.map((i) => i.sku).filter(Boolean))];
    const custos = skus.length
      ? ((
          await c.from("dim_custo_sku").select("sku,custo_unitario,vigencia_inicio").in("sku", skus)
        ).data ?? [])
      : [];
    const ped = p.data as Record<string, string> | null;
    return {
      pedido: ped
        ? {
            ...ped,
            nome: undefined,
            sobrenome: undefined,
            cliente: maskName(ped.nome, ped.sobrenome),
          }
        : null,
      itens: its,
      custos,
    };
  });

// Metas do mês (meta = objetivo) × realizado por canal, com as anotações do mês (meta_evento).
export const getMetasMes = createServerFn({ method: "GET" }).handler(async () => {
  const c = await db();
  const hoje = hojeSP();
  const mes = hoje.slice(0, 7);
  const ini = `${mes}-01`;
  const [rows, eventos] = await Promise.all([
    fetchAll(
      () =>
        c
          .from("vw_meta_vs_real_dia")
          .select(
            "data,mes,canal,receita_meta,receita_real,ads_meta,ads_real,dia_futuro,dado_provisorio",
          )
          .gte("data", ini),
      "metas do mes",
    ).catch(() => [] as Record<string, unknown>[]),
    c.from("meta_evento").select("data,tipo,titulo,obs").gte("data", ini).order("data"),
  ]);
  return {
    mes,
    canais: metasDoMes(rows, hoje),
    eventos: ((eventos.data ?? []) as Record<string, unknown>[]).map((e) => ({
      data: String(e["data"] ?? ""),
      tipo: String(e["tipo"] ?? ""),
      titulo: String(e["titulo"] ?? ""),
      obs: String(e["obs"] ?? ""),
    })),
  };
});
