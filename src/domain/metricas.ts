// Catálogo de métricas da Soldiers Platform (Plano Mestre, princípio 2: não criar métricas
// duplicadas por módulo; cap. 13.2: nunca somar receita atribuída com receita realizada;
// cap. 9.8: definições de fontes externas são versionadas).
//
// Toda tela que mostra uma destas métricas deve usar este nome e esta fórmula. Para mudar
// uma definição, crie uma nova versão em vez de editar a antiga.

export type TipoReceita =
  | "realizada" // pedido da Soldiers (fonte da verdade)
  | "atribuida" // explicação: quanto um canal/creator "levou" de um pedido que já está na receita
  | "reportada" // número informado pela plataforma externa (Meta, Google, Shopee…), com regra dela
  | "nao_se_aplica";

export type Metrica = {
  id: string;
  nome: string;
  modulo:
    | "Command Center"
    | "Commerce"
    | "Media"
    | "Affiliate"
    | "CRM / Growth"
    | "Product"
    | "Data Health";
  definicao: string;
  formula: string;
  fonte: string;
  tipoReceita: TipoReceita;
  /** Pode ser somada entre canais/linhas sem dupla contagem? */
  somavel: boolean;
  versao: string;
  validoDesde?: string;
  observacao?: string;
};

export const METRICAS: Metrica[] = [
  {
    id: "receita",
    nome: "Receita",
    modulo: "Command Center",
    definicao: "Faturamento dos pedidos da Soldiers no período, por canal de venda.",
    formula: "Σ faturamento",
    fonte: "vw_receita_consolidada.faturamento",
    tipoReceita: "realizada",
    somavel: true,
    versao: "1",
    observacao: "Cada pedido conta uma vez, no canal de venda. É a base para comparar canais.",
  },
  {
    id: "margem_contribuicao",
    nome: "Margem de contribuição",
    modulo: "Command Center",
    definicao:
      "Quanto sobra da receita depois de custos variáveis do canal, mídia, imposto e custo do produto.",
    formula: "receita_bruta − custo_canal − ads − imposto − cmv",
    fonte: "mv_pl_canal_dia.margem_contribuicao",
    tipoReceita: "realizada",
    somavel: true,
    versao: "1",
    observacao: "Calculada no banco. A % usa receita_bruta da mesma view.",
  },
  {
    id: "custo_canal",
    nome: "Custo do canal",
    modulo: "Command Center",
    definicao: "Custos cobrados pelo canal de venda e pela operação do pedido.",
    formula: "det_taxa + det_frete + det_afiliado",
    fonte: "mv_pl_canal_dia.custo_canal / det_*",
    tipoReceita: "nao_se_aplica",
    somavel: true,
    versao: "1",
    observacao: "Hipótese a confirmar no banco: o detalhe soma o total.",
  },
  {
    id: "cmv",
    nome: "CMV (custo do produto)",
    modulo: "Product",
    definicao: "Custo das unidades vendidas, usando o custo vigente na data de cada pedido.",
    formula: "Σ unidades × custo_unitario(vigência na data do pedido)",
    fonte: "dim_custo_sku (vigencia_inicio)",
    tipoReceita: "nao_se_aplica",
    somavel: true,
    versao: "2",
    validoDesde: "2026-10-03",
    observacao:
      "v1 usava o último custo cadastrado e mudava a margem passada. Pedido anterior à 1ª vigência é marcado como estimado.",
  },
  {
    id: "roas_midia",
    nome: "ROAS mídia",
    modulo: "Media",
    definicao:
      "Receita atribuída a anúncios dividida pelo investimento em anúncios. Não inclui afiliados.",
    formula: "Σ receita_ads ÷ Σ invest_ads",
    fonte: "vw_receita_consolidada (receita_ads, invest_ads); vw_ads_por_tipo_dia",
    tipoReceita: "reportada",
    somavel: false,
    versao: "1",
    observacao: "Razão calculada sobre os totais do período, nunca média de razões diárias.",
  },
  {
    id: "retorno_aquisicao",
    nome: "Retorno aquisição (MER)",
    modulo: "Command Center",
    definicao: "Receita total dividida pelo investimento em aquisição (anúncios + afiliados).",
    formula: "Σ faturamento ÷ Σ (invest_ads + invest_afiliados)",
    fonte: "vw_receita_consolidada",
    tipoReceita: "realizada",
    somavel: false,
    versao: "1",
    observacao:
      'Na Soldiers, MER = receita ÷ investimento (quanto volta por R$ 1). Atenção: o Triple Whale usa o inverso (investimento ÷ receita). Antes de 03/10/2026 este número aparecia como "ROAS total".',
  },
  {
    id: "tacos",
    nome: "TACoS",
    modulo: "Command Center",
    definicao: "Investimento em aquisição como % da receita total.",
    formula: "Σ invest_aquisicao ÷ Σ faturamento × 100",
    fonte: "vw_receita_consolidada",
    tipoReceita: "realizada",
    somavel: false,
    versao: "1",
  },
  {
    id: "receita_ads",
    nome: "Receita atribuída (mídia)",
    modulo: "Media",
    definicao:
      "Vendas que as plataformas de anúncio atribuem às campanhas, pela regra de atribuição de cada uma.",
    formula: "valor de conversão reportado",
    fonte: "vw_ads_por_tipo_dia.receita; vw_ads_funil_canal_dia.receita_ads",
    tipoReceita: "reportada",
    somavel: false,
    versao: "1",
    observacao: "Já está dentro da Receita. Não somar com ela nem entre plataformas.",
  },
  {
    id: "vendas_afiliado",
    nome: "Vendas atribuídas a afiliados",
    modulo: "Affiliate",
    definicao: "Valor dos pedidos atribuídos a afiliados e creators.",
    formula: "Σ rec",
    fonte: "mv_afiliado_canal_dia.rec; vw_awin_dia.venda",
    tipoReceita: "atribuida",
    somavel: false,
    versao: "1",
    observacao:
      "O pedido já está na Receita do canal. Usar contribuição, não GMV, para avaliar creators.",
  },
  {
    id: "awin_venda_aprovada",
    nome: "Awin: vendas aprovadas",
    modulo: "Affiliate",
    definicao: "Vendas Awin validadas; só elas geram comissão definitiva.",
    formula: "Σ venda_aprovada",
    fonte: "vw_awin_dia",
    tipoReceita: "atribuida",
    somavel: false,
    versao: "1",
  },
  {
    id: "ctr",
    nome: "CTR",
    modulo: "Media",
    definicao: "Cliques por impressão.",
    formula: "Σ cliques ÷ Σ impressões × 100",
    fonte: "vw_ads_por_tipo_dia; vw_ads_funil_canal_dia",
    tipoReceita: "nao_se_aplica",
    somavel: false,
    versao: "1",
  },
  {
    id: "ltv_esperado",
    nome: "LTV esperado",
    modulo: "CRM / Growth",
    definicao: "Valor que se espera do cliente, calculado pelo modelo de Growth do banco.",
    formula: "modelo do banco",
    fonte: "mv_growth_cliente_perfil.ltv_esperado",
    tipoReceita: "nao_se_aplica",
    somavel: true,
    versao: "1",
    observacao: "Preditivo. O LTV médio por canal (mv_growth_origem_canal.ltv_medio) é histórico.",
  },
  {
    id: "valor_esperado_90",
    nome: "Valor esperado 90d",
    modulo: "CRM / Growth",
    definicao: "Receita esperada do cliente nos próximos 90 dias.",
    formula: "modelo do banco (chance × ticket)",
    fonte: "mv_growth_cliente_perfil.valor_esperado_90; mv_growth_acao_resumo.valor_esperado",
    tipoReceita: "nao_se_aplica",
    somavel: true,
    versao: "1",
  },
  {
    id: "cohort_retorno",
    nome: "Retorno da safra (cohort)",
    modulo: "CRM / Growth",
    definicao: "% dos clientes da primeira compra no mês que voltaram a comprar no mês M+n.",
    formula: "clientes(safra, n) ÷ clientes_safra × 100",
    fonte: "mv_growth_cohort_mes",
    tipoReceita: "nao_se_aplica",
    somavel: false,
    versao: "1",
  },
  {
    id: "cobertura_estoque",
    nome: "Cobertura de estoque",
    modulo: "Product",
    definicao: "Dias que o estoque do site aguenta no ritmo atual de vendas.",
    formula: "estoque ÷ média diária de vendas",
    fonte: "dim_shopify_produto.cobertura_dias",
    tipoReceita: "nao_se_aplica",
    somavel: false,
    versao: "1",
    observacao: "Por local. Estoques de canais diferentes não são somados (cap. 6.4).",
  },
  {
    id: "frescor",
    nome: "Frescor do dado",
    modulo: "Data Health",
    definicao: "Dias desde o último dado recebido de uma fonte.",
    formula: "hoje − último dia com dado",
    fonte: "várias (ver Data Health)",
    tipoReceita: "nao_se_aplica",
    somavel: false,
    versao: "1",
    observacao: "D-1 = em dia; 2–3 dias = atenção; mais = atrasado.",
  },
  {
    id: "shopee_vendas_ads",
    nome: 'Shopee Ads: "Vendas" (antigo GMV)',
    modulo: "Media",
    definicao:
      "Valor dos pedidos atribuídos aos anúncios da Shopee, pagos e não pagos, incluindo cancelados e devolvidos, já sem descontos do vendedor.",
    formula: "definição da Shopee",
    fonte: "Shopee Ads (relatórios)",
    tipoReceita: "reportada",
    somavel: false,
    versao: "shopee-2026-01",
    validoDesde: "2026-01-01",
    observacao:
      "Até dez/2025 chamava GMV e incluía descontos; o histórico não foi recalculado pela Shopee. Não comparar meses de antes e depois sem ajuste. Fonte: ads.shopee.com.br/learn/faq/363/2198",
  },
];

export const TIPO_RECEITA_LABEL: Record<TipoReceita, string> = {
  realizada: "Receita realizada",
  atribuida: "Atribuída",
  reportada: "Reportada pela plataforma",
  nao_se_aplica: "—",
};

export function metrica(id: string): Metrica | undefined {
  return METRICAS.find((m) => m.id === id);
}
