// Dados de exemplo (fictícios) para Estado da base, próxima ação do cliente e Attribution. Sem dados pessoais.
import {
  distribuicaoEstados,
  afinidadeCliente,
  proximaAcao,
  consentimentoDe,
  linhaDoTempo,
  transicoes,
} from "@/lib/clientes360";
import {
  atribuicaoPorCanal,
  siteUtm,
  plataformasVsUtm,
  siteUtmPorFonte,
  modelosRegistrados,
  resumoAtribuicao,
  alertasAtribuicao,
} from "@/lib/atribuicao";

export const HOJE = "2026-09-30";
export const DE = "2026-09-01";

export const cli = {
  itens: [
    { sku: "CREA300", produto: "Creatina 300g", quantidade: 2, data: "2026-08-01" },
    { sku: "CREA300", produto: "Creatina 300g", quantidade: 1, data: "2026-09-20" },
    { sku: "WHEY900", produto: "Whey 900g", quantidade: 1, data: "2026-03-01" },
  ],
  proximos: [
    {
      sku_origem: "CREA300",
      sku_seguinte: "GLUT300",
      produto_seguinte: "Glutamina 300g",
      forca_pct: 30,
    },
    {
      sku_origem: "CREA300",
      sku_seguinte: "WHEY900",
      produto_seguinte: "Whey 900g",
      forca_pct: 50,
    },
  ],
  perfil: {
    pedidos: 3,
    dias_ultima_compra: 50,
    razao_ritmo: 1.8,
    dias_atraso: 20,
    canal_ultimo: "Site",
    produto_provavel: "Creatina 300g",
  },
  consent: [
    { order_created_at: "2026-01-10T10:00:00Z", order_customer_accepts_marketing: false },
    { order_created_at: "2026-09-20T10:00:00Z", order_customer_accepts_marketing: true },
  ],
};

export const atr = {
  consol: [
    {
      data: "2026-09-10",
      canal: "Site",
      faturamento: 100000,
      receita_ads: 40000,
      afiliado_pct: 10,
      invest_ads: 10000,
      invest_afiliados: 1500,
    },
    {
      data: "2026-09-10",
      canal: "Mercado Livre",
      faturamento: 50000,
      receita_ads: 45000,
      afiliado_pct: 20,
      invest_ads: 5000,
      invest_afiliados: 1000,
    },
    {
      data: "2026-08-10",
      canal: "Site",
      faturamento: 999999,
      receita_ads: 0,
      afiliado_pct: 0,
      invest_ads: 0,
      invest_afiliados: 0,
    },
  ],
  origem: [
    { data: "2026-09-10", origem: "Direto", faturamento_liquido: 45000, pedidos: 300 },
    { data: "2026-09-10", origem: "Meta Ads", faturamento_liquido: 30000, pedidos: 200 },
    { data: "2026-09-10", origem: "Google Ads", faturamento_liquido: 20000, pedidos: 130 },
  ],
  recon: [
    {
      data: "2026-09-10",
      gasto_meta: 10000,
      receita_informada_meta: 60000,
      receita_meta_utm: 20000,
      compras_informadas_meta: 300,
      pedidos_meta_utm: 100,
      enviados_meta: 90,
      pedidos_totais: 100,
    },
  ],
  funil: [
    { data: "2026-09-10", canal: "Meta Ads", invest: 9000, receita_ads: 50000 },
    { data: "2026-09-10", canal: "Google Ads", invest: 3000, receita_ads: 15000 },
    { data: "2026-09-10", canal: "TikTok Ads", invest: 2000, receita_ads: 9000 },
    { data: "2026-09-10", canal: "Mercado Livre Ads", invest: 5000, receita_ads: 45000 },
    { data: "2026-09-10", canal: "Amazon Ads", invest: 800, receita_ads: 4000 },
    { data: "2026-08-10", canal: "Google Ads", invest: 99999, receita_ads: 1 },
  ],
  utmSite: [
    {
      data: "2026-09-10",
      utm_source: "facebook",
      utm_medium: "paid",
      pedidos: 100,
      receita: 20000,
    },
    { data: "2026-09-10", utm_source: "google", utm_medium: "cpc", pedidos: 40, receita: 6000 },
    { data: "2026-09-10", utm_source: "google", utm_medium: "organic", pedidos: 30, receita: 5000 },
    { data: "2026-09-10", utm_source: "klaviyo", utm_medium: "email", pedidos: 20, receita: 4000 },
    { data: "2026-09-10", utm_source: "", utm_medium: "", pedidos: 300, receita: 60000 },
  ],
  modelos: [
    { chave: "ultimo_clique", inicio: "2026-01-01", obs: "UTM do último clique" },
    { chave: "ultimo_clique", inicio: "2026-09-15", obs: "Inclui cupom de influenciador" },
    { chave: "data_driven", inicio: "2027-01-01", obs: "Planejado" },
  ],
};

const ESTADOS_DIA: Record<string, number> = {
  novo: 100,
  recorrente: 200,
  fiel: 50,
  em_risco: 80,
  adormecido: 120,
  perdido: 450,
};
export const estadoDia = Array.from(
  { length: 10 },
  (_, i) => `2026-09-${String(21 + i).padStart(2, "0")}`,
).flatMap((data, i) =>
  Object.entries(ESTADOS_DIA).map(([estado, v]) => ({
    data,
    estado,
    clientes: v + (estado === "perdido" ? i * 3 : estado === "fiel" ? i : 0),
  })),
);
export const historico = [
  ...Array.from({ length: 30 }, () => ({ estado: "em_risco", estado_anterior: "recorrente" })),
  ...Array.from({ length: 12 }, () => ({ estado: "fiel", estado_anterior: "recorrente" })),
  ...Array.from({ length: 7 }, () => ({ estado: "recorrente", estado_anterior: "em_risco" })),
  { estado: "novo", estado_anterior: null },
];

export function crmBaseFixture() {
  return {
    estados: distribuicaoEstados({
      novo: 100,
      recorrente: 200,
      fiel: 50,
      em_risco: 80,
      adormecido: 120,
      perdido: 450,
    }),
    semDado: 12,
    leads90: { leads: 2700, compraram: 105, semCompra: 2595 },
    consentimento: {
      aceitaPct: 62,
      recusaPct: 30,
      semInfoPct: 8,
      base: 50000,
      registro: { emailConcedido: 640, emailRevogado: 210, whatsappConcedido: 85, total: 850 },
    },
    clienteUnico: {
      clientes: 1000,
      umCanal: 940,
      doisCanais: 50,
      tresMais: 10,
      multiPct: 6,
      idsInternos: 1012,
    },
    linhaDoTempo: linhaDoTempo(estadoDia),
    transicoes30d: transicoes(historico),
    migracaoPendente: false,
    erros: {} as Record<string, string>,
  };
}

export function clienteAcaoFixture() {
  const afinidade = afinidadeCliente(cli.itens, cli.proximos, HOJE);
  const consentimento = consentimentoDe(cli.consent);
  return { afinidade, consentimento, acao: proximaAcao(cli.perfil, afinidade, consentimento) };
}

export function atribuicaoFixture() {
  const canais = atribuicaoPorCanal(atr.consol, DE, HOJE);
  const site = siteUtm(atr.origem, DE, HOJE);
  const plataformas = plataformasVsUtm(atr.recon, DE, HOJE, {
    funil: atr.funil,
    utmSite: atr.utmSite,
    consolidada: atr.consol,
  });
  const realizadaSite = canais.find((c) => c.canal === "Site")?.realizada ?? null;
  return {
    resumo: resumoAtribuicao(canais),
    canais,
    site,
    realizadaSite,
    plataformas,
    siteFontes: siteUtmPorFonte(atr.utmSite, DE, HOJE),
    modelos: modelosRegistrados(atr.modelos, HOJE),
    alertas: alertasAtribuicao({ canais, plataformas, site, realizadaSite }),
    erros: {} as Record<string, string>,
  };
}
