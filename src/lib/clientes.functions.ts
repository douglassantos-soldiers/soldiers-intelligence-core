// Leituras de Estado da base, Consentimento, Cliente único, próxima ação por cliente e Attribution Engine v1.
// Só leitura. LGPD: nenhuma coluna de nome, e-mail, telefone, documento ou endereço é selecionada aqui.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, check, fetchAll, Periodo, type Db } from "@/lib/db-helpers";
import {
  REGRA_ESTADO,
  distribuicaoEstados,
  afinidadeCliente,
  proximaAcao,
  consentimentoDe,
  consentimentoRegistrado,
  linhaDoTempo,
  transicoes,
  type Estado,
} from "@/lib/clientes360";
import {
  atribuicaoPorCanal,
  siteUtm,
  plataformasVsUtm,
  modelosRegistrados,
  resumoAtribuicao,
  alertasAtribuicao,
} from "@/lib/atribuicao";

type Rows = Record<string, unknown>[];
const R = REGRA_ESTADO;
const SEM_RISCO = `razao_ritmo.is.null,razao_ritmo.lte.${R.riscoRazao}`;

async function conta(q: Db, ctx: string): Promise<number> {
  const r = await q;
  if (r.error) throw new Error(`${ctx}: ${r.error.message}`);
  return r.count ?? 0;
}

/* ---------------- Estado da base, consentimento e cliente único ---------------- */
export async function dadosCrmBase() {
  const c = await db();
  const erros: Record<string, string> = {};
  const safe = async <T>(nome: string, p: Promise<T>, vazio: T) => {
    try {
      return await p;
    } catch (e) {
      erros[nome] = e instanceof Error ? e.message : String(e);
      return vazio;
    }
  };
  const perfil = () =>
    c.from("mv_growth_cliente_perfil").select("cliente_chave", { count: "exact", head: true });
  const filtros: Record<Estado, () => Db> = {
    perdido: () => perfil().gt("dias_ultima_compra", R.perdidoDias),
    adormecido: () =>
      perfil().gt("dias_ultima_compra", R.adormecidoDias).lte("dias_ultima_compra", R.perdidoDias),
    em_risco: () =>
      perfil()
        .lte("dias_ultima_compra", R.adormecidoDias)
        .gte("pedidos", 2)
        .gt("razao_ritmo", R.riscoRazao),
    novo: () => perfil().lte("dias_ultima_compra", R.adormecidoDias).lte("pedidos", 1),
    fiel: () =>
      perfil()
        .lte("dias_ultima_compra", R.adormecidoDias)
        .gte("pedidos", R.fielPedidos)
        .or(SEM_RISCO),
    recorrente: () =>
      perfil()
        .lte("dias_ultima_compra", R.adormecidoDias)
        .gte("pedidos", 2)
        .lt("pedidos", R.fielPedidos)
        .or(SEM_RISCO),
    sem_dado: () => perfil().is("dias_ultima_compra", null),
  };
  const estados = Object.keys(filtros) as Estado[];
  const contagens = await Promise.all(
    estados.map((e) => safe(`estado_${e}`, conta(filtros[e](), e), 0)),
  );
  const contagem = Object.fromEntries(estados.map((e, i) => [e, contagens[i]])) as Record<
    Estado,
    number
  >;

  const canais = () =>
    c.from("tab_cliente_canais").select("cliente_chave", { count: "exact", head: true });
  const desde = new Date(Date.now() - 364 * 86400000).toISOString().slice(0, 10);
  const itens = () =>
    c
      .from("stg_shopify_orders_item")
      .select("order_id", { count: "exact", head: true })
      .gte("order_created_at", desde);
  const de90 = new Date(Date.now() - 89 * 86400000).toISOString().slice(0, 10);
  const [um, dois, tresMais, idsInternos, aceita, recusa, semInfo, leadDia] = await Promise.all([
    safe("canais1", conta(canais().eq("canais", 1), "canais 1"), 0),
    safe("canais2", conta(canais().eq("canais", 2), "canais 2"), 0),
    safe("canais3", conta(canais().gte("canais", 3), "canais 3+"), 0),
    safe(
      "dimCliente",
      conta(
        c.from("dim_cliente").select("cliente_chave", { count: "exact", head: true }),
        "dim_cliente",
      ),
      0,
    ),
    safe(
      "consentSim",
      conta(itens().eq("order_customer_accepts_marketing", true), "consent sim"),
      0,
    ),
    safe(
      "consentNao",
      conta(itens().eq("order_customer_accepts_marketing", false), "consent não"),
      0,
    ),
    safe(
      "consentNulo",
      conta(itens().is("order_customer_accepts_marketing", null), "consent nulo"),
      0,
    ),
    safe(
      "leads",
      fetchAll(
        () => c.from("vw_rd_lead_dia").select("data,leads,leads_compraram").gte("data", de90),
        "leads",
      ) as Promise<Rows>,
      [] as Rows,
    ),
  ]);
  // Tabelas da migração 20261005120000 (linha do tempo e consentimento). Se ainda não foi aplicada,
  // a tela mostra o aviso em vez de erro.
  const migracao = { pendente: false };
  const opcional = async <T>(p: Promise<T>, vazio: T, nome: string) => {
    try {
      return await p;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/does not exist|não existe|schema cache|Could not find/i.test(msg))
        migracao.pendente = true;
      else erros[nome] = msg;
      return vazio;
    }
  };
  const de180 = new Date(Date.now() - 179 * 86400000).toISOString().slice(0, 10);
  const de30 = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  const vw = () =>
    c
      .from("vw_cliente_consentimento_atual")
      .select("cliente_chave", { count: "exact", head: true });
  const [diaRows, histRows, emailSim, emailNao, whatsSim] = await Promise.all([
    opcional(
      fetchAll(
        () => c.from("crm_estado_dia").select("data,estado,clientes").gte("data", de180),
        "crm_estado_dia",
      ) as Promise<Rows>,
      [] as Rows,
      "linhaDoTempo",
    ),
    opcional(
      fetchAll(
        () =>
          c
            .from("crm_estado_historico")
            .select("estado,estado_anterior")
            .gte("desde", de30)
            .not("estado_anterior", "is", null),
        "crm_estado_historico",
        100000,
      ) as Promise<Rows>,
      [] as Rows,
      "transicoes",
    ),
    opcional(
      conta(vw().eq("canal", "email").eq("status", "concedido"), "consent email sim"),
      0,
      "consentEmail",
    ),
    opcional(
      conta(vw().eq("canal", "email").eq("status", "revogado"), "consent email não"),
      0,
      "consentEmailNao",
    ),
    opcional(
      conta(vw().eq("canal", "whatsapp").eq("status", "concedido"), "consent whatsapp"),
      0,
      "consentWhatsapp",
    ),
  ]);
  const leads = leadDia.reduce((s, r) => s + (Number(r["leads"]) || 0), 0);
  const compraram = leadDia.reduce((s, r) => s + (Number(r["leads_compraram"]) || 0), 0);
  const totConsent = aceita + recusa + semInfo;
  const totCanais = um + dois + tresMais;
  return {
    estados: distribuicaoEstados(contagem),
    semDado: contagem.sem_dado,
    leads90: { leads, compraram, semCompra: Math.max(0, leads - compraram) },
    consentimento: {
      aceitaPct: totConsent ? (aceita / totConsent) * 100 : null,
      recusaPct: totConsent ? (recusa / totConsent) * 100 : null,
      semInfoPct: totConsent ? (semInfo / totConsent) * 100 : null,
      base: totConsent,
      // Registro por cliente (cliente_consentimento): quando existe, é a fonte que vale.
      registro: {
        emailConcedido: emailSim,
        emailRevogado: emailNao,
        whatsappConcedido: whatsSim,
        total: emailSim + emailNao,
      },
    },
    linhaDoTempo: linhaDoTempo(diaRows),
    transicoes30d: transicoes(histRows),
    migracaoPendente: migracao.pendente,
    clienteUnico: {
      clientes: totCanais,
      umCanal: um,
      doisCanais: dois,
      tresMais,
      multiPct: totCanais ? ((dois + tresMais) / totCanais) * 100 : null,
      idsInternos,
    },
    erros,
  };
}
export const getCrmBase = createServerFn({ method: "GET" }).handler(async () => dadosCrmBase());

/* ---------------- Próxima ação de um cliente (Customer 360) ---------------- */
export const getClienteAcao = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ chave: z.string().regex(/^[0-9a-zA-Z_-]{8,128}$/) }).parse(d))
  .handler(async ({ data }) => {
    const c = await db();
    const hoje = new Date().toISOString().slice(0, 10);
    const [perfilR, pedidosR, idR] = await Promise.all([
      c
        .from("mv_growth_cliente_perfil")
        .select(
          "pedidos,dias_ultima_compra,dias_atraso,razao_ritmo,ritmo_dias,canal_ultimo,produto_provavel",
        )
        .eq("cliente_chave", data.chave)
        .maybeSingle(),
      c
        .from("fact_pedido_cliente")
        .select("canal,pedido_id")
        .eq("cliente_chave", data.chave)
        .limit(200),
      c.from("dim_cliente").select("cliente_id").eq("cliente_chave", data.chave).maybeSingle(),
    ]);
    const perfil = (check(perfilR, "perfil") ?? {}) as Record<string, unknown>;
    const peds = (check(pedidosR, "pedidos") ?? []) as Rows;
    const ids = [...new Set(peds.map((p) => String(p["pedido_id"])))];
    const itens = ids.length
      ? ((check(
          await c
            .from("fact_pedido_item_cliente")
            .select("canal,pedido_id,sku,produto,quantidade,data")
            .in("pedido_id", ids)
            .limit(1000),
          "itens",
        ) ?? []) as Rows)
      : [];
    // Mesmo pedido_id pode existir em outro canal: só vale o par canal + pedido do cliente.
    const validos = new Set(peds.map((p) => `${p["canal"]}|${p["pedido_id"]}`));
    const itensCliente = itens.filter((i) => validos.has(`${i["canal"]}|${i["pedido_id"]}`));
    const skus = [...new Set(itensCliente.map((i) => String(i["sku"] ?? "")).filter(Boolean))];
    const proximos = skus.length
      ? ((check(
          await c
            .from("mv_growth_produto_proximo")
            .select("sku_origem,sku_seguinte,produto_seguinte,forca_pct")
            .in("sku_origem", skus),
          "proximos",
        ) ?? []) as Rows)
      : [];
    // [HIPÓTESE] dim_cliente.cliente_id é o id do cliente no Shopify.
    const cid = (idR.data as { cliente_id?: number } | null)?.cliente_id;
    let consentLinhas: Rows = [];
    if (cid != null) {
      const r = await c
        .from("stg_shopify_orders_item")
        .select("order_created_at,order_customer_accepts_marketing")
        .in("order_customer_id", [String(cid), `gid://shopify/Customer/${cid}`])
        .order("order_created_at", { ascending: false })
        .limit(1);
      consentLinhas = (r.data ?? []) as Rows;
    }
    const afinidade = afinidadeCliente(itensCliente, proximos, hoje);
    let registrado: ReturnType<typeof consentimentoRegistrado> = null;
    try {
      const r = await c
        .from("vw_cliente_consentimento_atual")
        .select("canal,status,ocorrido_em")
        .eq("cliente_chave", data.chave);
      if (!r.error) registrado = consentimentoRegistrado((r.data ?? []) as Rows);
    } catch {
      registrado = null; // migração ainda não aplicada
    }
    const consent = registrado ?? consentimentoDe(consentLinhas);
    return { afinidade, consentimento: consent, acao: proximaAcao(perfil, afinidade, consent) };
  });

/* ---------------- Attribution Engine v1 ---------------- */
export async function dadosAtribuicao(p: { de: string; ate: string }) {
  const c = await db();
  const erros: Record<string, string> = {};
  const safe = async (nome: string, pr: Promise<Rows>) => {
    try {
      return await pr;
    } catch (e) {
      erros[nome] = e instanceof Error ? e.message : String(e);
      return [] as Rows;
    }
  };
  const hoje = new Date().toISOString().slice(0, 10);
  const [consol, origem, recon, config] = await Promise.all([
    safe(
      "consolidada",
      fetchAll(
        () =>
          c
            .from("vw_receita_consolidada")
            .select("data,canal,faturamento,receita_ads,afiliado_pct,invest_ads,invest_afiliados")
            .gte("data", p.de)
            .lte("data", p.ate),
        "receita consolidada",
        60000,
      ),
    ),
    safe(
      "siteOrigem",
      fetchAll(
        () =>
          c
            .from("vw_site_origem_dia")
            .select("data,origem,faturamento_liquido,pedidos")
            .gte("data", p.de)
            .lte("data", p.ate),
        "site origem",
        60000,
      ),
    ),
    safe(
      "meta",
      fetchAll(
        () =>
          c
            .from("vw_reconciliacao_shopify_meta_dia")
            .select(
              "data,gasto_meta,receita_informada_meta,receita_meta_utm,compras_informadas_meta,pedidos_meta_utm,enviados_meta,pedidos_totais",
            )
            .gte("data", p.de)
            .lte("data", p.ate),
        "meta reconciliacao",
      ),
    ),
    safe(
      "modelos",
      fetchAll(
        () => c.from("config_atribuicao_site").select("chave,inicio,obs"),
        "config atribuicao",
      ),
    ),
  ]);
  const canais = atribuicaoPorCanal(consol, p.de, p.ate);
  const site = siteUtm(origem, p.de, p.ate);
  const plataformas = plataformasVsUtm(recon, p.de, p.ate);
  const realizadaSite = canais.find((x) => /site|shopify/i.test(x.canal))?.realizada ?? null;
  return {
    resumo: resumoAtribuicao(canais),
    canais,
    site,
    realizadaSite,
    plataformas,
    modelos: modelosRegistrados(config, hoje),
    alertas: alertasAtribuicao({ canais, plataformas, site, realizadaSite }),
    erros,
  };
}
export const getAtribuicao = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => dadosAtribuicao(data));
