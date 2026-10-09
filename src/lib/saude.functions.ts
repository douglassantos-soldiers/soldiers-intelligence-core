// Leituras da Soldiers Platform — Data Health (Plano Mestre cap. 31): frescor, filas, logs, tokens e leituras cortadas.
// Somente leitura de objetos JÁ EXISTENTES no Supabase. data.functions.ts reexporta as server functions.
import { diasAtrasSP } from "@/lib/datas";
import { createServerFn } from "@tanstack/react-start";
import { validadeToken } from "@/lib/tiktok";
import { db, ultimosTruncamentos } from "@/lib/db-helpers";

/* ---------------- Data Health (Plano Mestre cap. 31) ----------------
 * Só leitura de objetos que já existem: frescor dos dados por fonte, filas de
 * sincronização, logs com erro e problemas abertos (vw_saude_*). Cada leitura é
 * independente: se uma fonte falhar, as outras continuam aparecendo. */
type Fonte = {
  fonte: string;
  ultimoDado: string | null;
  carregadoEm: string | null;
  erro: string | null;
};
type Fila = {
  fila: string;
  linhas: number;
  porStatus: Record<string, number>;
  maxTentativas: number;
  ultimoErro: string | null;
  atualizado: string | null;
  erro: string | null;
};

const FILAS: {
  tabela: string;
  dataCol: string;
  atualizadoCol: string;
  erroCol?: string;
  nome: string;
}[] = [
  {
    tabela: "amazon_ads_report_fila",
    dataCol: "dia",
    atualizadoCol: "atualizado_em",
    erroCol: "erro",
    nome: "Amazon Ads: relatórios",
  },
  {
    tabela: "amazon_sp_asin_fila",
    dataCol: "dia",
    atualizadoCol: "atualizado",
    erroCol: "erro",
    nome: "Amazon SP: ASINs",
  },
  {
    tabela: "amazon_st_fila",
    dataCol: "data",
    atualizadoCol: "atualizado_em",
    nome: "Amazon: search terms",
  },
  {
    tabela: "ml_historico_fila",
    dataCol: "dia",
    atualizadoCol: "atualizado",
    nome: "Mercado Livre: pedidos",
  },
  {
    tabela: "ml_afiliado_fila",
    dataCol: "data",
    atualizadoCol: "atualizado_em",
    erroCol: "erro",
    nome: "Mercado Livre: afiliados",
  },
  {
    tabela: "shopee_backfill_fila",
    dataCol: "dia",
    atualizadoCol: "atualizado",
    nome: "Shopee: pedidos",
  },
  {
    tabela: "shopee_escrow_fila",
    dataCol: "dia",
    atualizadoCol: "atualizado",
    nome: "Shopee: financeiro (escrow)",
  },
  {
    tabela: "tiktok_backfill_fila",
    dataCol: "dia",
    atualizadoCol: "atualizado",
    nome: "TikTok Shop: pedidos",
  },
  {
    tabela: "tiktok_analytics_fila",
    dataCol: "dia",
    atualizadoCol: "atualizado",
    nome: "TikTok Shop: analytics",
  },
];

export const getDataHealth = createServerFn({ method: "GET" }).handler(async () => {
  const c = await db();
  const desde = diasAtrasSP(30);

  // 1) Frescor: último dia com dado e última carga, por fonte.
  const ultimo = async (
    fonte: string,
    tabela: string,
    dataCol: string,
    cargaCol: string | null,
    filtro?: [string, string],
  ): Promise<Fonte> => {
    let q = c.from(tabela).select(cargaCol ? `${dataCol},${cargaCol}` : dataCol);
    if (filtro) q = q.eq(filtro[0], filtro[1]);
    const r = await q.order(dataCol, { ascending: false }).limit(1);
    const row = (r.data?.[0] ?? null) as Record<string, unknown> | null;
    return {
      fonte,
      ultimoDado: row ? String(row[dataCol] ?? "") || null : null,
      carregadoEm: row && cargaCol ? String(row[cargaCol] ?? "") || null : null,
      erro: r.error?.message ?? null,
    };
  };
  const fontes = await Promise.all([
    ultimo("Pedidos: Shopify", "fact_pedido_cliente", "data", "atualizado_em", [
      "canal",
      "Shopify",
    ]),
    ultimo("Pedidos: Mercado Livre", "fact_pedido_cliente", "data", "atualizado_em", [
      "canal",
      "Mercado Livre",
    ]),
    ultimo("Pedidos: Amazon", "fact_pedido_cliente", "data", "atualizado_em", ["canal", "Amazon"]),
    ultimo("Pedidos: TikTok Shop", "fact_pedido_cliente", "data", "atualizado_em", [
      "canal",
      "TikTok",
    ]),
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
      const cols = [
        "status",
        "tentativas",
        f.atualizadoCol,
        ...(f.erroCol ? [f.erroCol] : []),
      ].join(",");
      const r = await c
        .from(f.tabela)
        .select(cols)
        .gte(f.dataCol, desde)
        .order(f.atualizadoCol, { ascending: false })
        .limit(1000);
      const rows = (r.data ?? []) as Record<string, unknown>[];
      const porStatus: Record<string, number> = {};
      for (const x of rows)
        porStatus[String(x["status"] ?? "—")] = (porStatus[String(x["status"] ?? "—")] ?? 0) + 1;
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
    c
      .from("shopee_sync_log")
      .select("executado_em,erro,pedidos,itens")
      .order("executado_em", { ascending: false })
      .limit(50),
    c
      .from("tiktok_sync_log")
      .select("executado_em,erro,pedidos,itens")
      .order("executado_em", { ascending: false })
      .limit(50),
    c
      .from("ml_sync_log")
      .select("started_at,finished_at,status,job_type,error_message")
      .order("started_at", { ascending: false })
      .limit(50),
  ]);
  const resumoLog = (
    nome: string,
    rows: Record<string, unknown>[] | null,
    dataCol: string,
    erroCol: string,
    err: { message: string } | null,
  ) => {
    const list = rows ?? [];
    const erros = list.filter((x) => x[erroCol]);
    return {
      log: nome,
      execucoes: list.length,
      comErro: erros.length,
      ultimaExecucao: list[0] ? String(list[0][dataCol] ?? "") : null,
      ultimoErro: erros[0] ? String(erros[0][erroCol]).slice(0, 200) : null,
      erro: err?.message ?? null,
    };
  };
  const logs = [
    resumoLog(
      "Shopee",
      shp.data as Record<string, unknown>[] | null,
      "executado_em",
      "erro",
      shp.error,
    ),
    resumoLog(
      "TikTok Shop",
      tt.data as Record<string, unknown>[] | null,
      "executado_em",
      "erro",
      tt.error,
    ),
    resumoLog(
      "Mercado Ads",
      ml.data as Record<string, unknown>[] | null,
      "started_at",
      "error_message",
      ml.error,
    ),
  ];

  // 4) Problemas abertos já detectados pelo banco (pedido = ID do pedido; sem dado pessoal).
  const saude = await Promise.all(
    ["vw_saude_shopify", "vw_saude_ml", "vw_saude_amazon"].map((v) =>
      c
        .from(v)
        .select("canal,data,pedido,problema,severidade,dias_aberto,valor")
        .order("dias_aberto", { ascending: false })
        .limit(200),
    ),
  );
  const problemas = saude.flatMap((r) => (r.data ?? []) as Record<string, unknown>[]);
  const afiliadoMl = await c
    .from("vw_ml_afiliado_saude")
    .select("canal,situacao,ultimo_dia_ok,dias_atraso,dias_erro,dias_pendentes,pct_casou_ml_pedido")
    .limit(5);

  // 5) Validade dos tokens das integrações: só colunas de data, nunca o token.
  const [ttAuth, metaCred] = await Promise.all([
    c.from("tiktok_auth").select("shop_id,expires_at,updated_at"),
    c.from("meta_credentials").select("ad_account_id,token_expira_em,atualizado_em"),
  ]);
  const tokens = [
    ...((ttAuth.data ?? []) as Record<string, unknown>[]).map((r) => ({
      integracao: "TikTok Shop",
      conta: String(r["shop_id"] ?? "—"),
      expiraEm: (r["expires_at"] as string) ?? null,
      atualizadoEm: (r["updated_at"] as string) ?? null,
      ...validadeToken(r["expires_at"], r["updated_at"]),
    })),
    ...((metaCred.data ?? []) as Record<string, unknown>[]).map((r) => ({
      integracao: "Meta Ads",
      conta: String(r["ad_account_id"] ?? "—"),
      expiraEm: (r["token_expira_em"] as string) ?? null,
      atualizadoEm: (r["atualizado_em"] as string) ?? null, // Token de system user da Meta pode não expirar: aqui só vale a data de validade.
      ...validadeToken(r["token_expira_em"], null),
    })),
  ];
  const tokensErro = ttAuth.error?.message ?? metaCred.error?.message ?? null;

  return {
    fontes,
    filas,
    logs,
    problemas,
    afiliadoMl: (afiliadoMl.data ?? []) as Record<string, unknown>[],
    tokens,
    tokensErro,
    cortes: ultimosTruncamentos(),
  };
});
