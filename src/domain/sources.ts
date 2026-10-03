// Mapa "tela -> fonte existente no Supabase Ads Soldiers".
// Regra: a plataforma só LÊ objetos que já existem. Nada é criado/alterado no banco
// sem antes verificar se já há fonte equivalente (ver AGENTS.md).
export const SOURCES = {
  commandCenter: ["vw_receita_consolidada", "mv_pl_canal_dia", "growth_novos_recorrentes()"],
  customer360: ["mv_growth_cliente_perfil", "mv_growth_origem_cliente", "fact_pedido_cliente", "fact_pedido_item_cliente", "vw_cliente_kpis"],
  product360: ["mv_produto_dia", "mv_growth_produto_ciclo", "mv_growth_produto_proximo", "dim_custo_sku", "dim_shopify_produto"],
  orders: ["fact_pedido_cliente", "fact_pedido_item_cliente", "dim_custo_sku"],
  media: ["vw_receita_consolidada", "vw_ads_por_tipo_dia"],
  affiliate: ["vw_awin_dia", "vw_awin_publisher_dia", "mv_afiliado_canal_dia"],
  commerce: ["vw_receita_consolidada (Site)", "mv_pl_canal_dia", "mv_produto_dia", "dim_shopify_produto"],
  marketplace: ["vw_receita_consolidada", "mv_pl_canal_dia", "mv_produto_dia"],
  crm: ["mv_growth_mes", "mv_growth_rfm_segmento", "mv_growth_acao_resumo", "mv_growth_ltv_canal", "mv_growth_origem_canal", "mv_growth_cohort_mes"],
} as const;

// Canais de venda como aparecem nas views consolidadas.
export const CANAIS_VENDA = ["Site", "Mercado Livre", "Amazon", "Shopee", "TikTok"] as const;
export const MARKETPLACES = ["Mercado Livre", "Amazon", "Shopee", "TikTok"] as const;
// Canais presentes no nível de pedido (fact_pedido_cliente).
export const CANAIS_PEDIDO = ["Shopify", "Mercado Livre", "Amazon", "TikTok"] as const;

export const ACOES_LABEL: Record<string, string> = {
  aguardar: "Aguardar",
  resgate: "Resgate",
  reativacao: "Reativação",
  lembrete: "Lembrete",
  perdido: "Perdido",
};
