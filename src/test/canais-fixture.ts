// Dados de exemplo (fictícios) para TikTok Ads, Meli DSP, Creators 360, Mídia por produto e Devoluções.
// Usados nos testes e na prévia. Sem dados pessoais: creators com nomes inventados.
import {
  resumoTikTokAds,
  campanhasTikTok,
  produtosTikTokAds,
  criativosTikTok,
  alertasTikTokAds,
} from "@/lib/tiktokads";
import { resumoMeliDsp, campanhasMeliDsp, criativosMeliDsp, alertasMeliDsp } from "@/lib/melidsp";
import {
  afiliadosPorCanal,
  creators360,
  concentracao,
  produtosAfiliado,
  alertasAfiliados,
  tagsDinamicas,
  contagemTags,
} from "@/lib/afiliados";
import { midiaPorSku, ritmoCanais, alertasMidiaSku } from "@/lib/midiasku";
import {
  devolucoesPorCanal,
  motivosDevolucao,
  rankingML,
  alertasDevolucoes,
} from "@/lib/devolucoes";

export const DE = "2026-09-01";
export const ATE = "2026-09-30";

const dias = (de: string, n: number) =>
  Array.from({ length: n }, (_, i) =>
    new Date(Date.parse(de) + i * 86400000).toISOString().slice(0, 10),
  );
const set = dias("2026-08-18", 44); // 14 dias de base + setembro

// ---------------- TikTok Ads ----------------
export const tt = {
  tipo: set.flatMap((d, i) => [
    {
      data: d,
      tipo: "GMV Max",
      invest: i === 43 ? 900 : 400,
      receita: i === 43 ? 900 : 1600,
      pedidos: 12,
    },
    { data: d, tipo: "Vídeo", invest: 100, receita: 250, pedidos: 2 },
  ]),
  camp: set.map((d) => ({
    data: d,
    campaign_id: "c2",
    campanha: "VIDEO | CREATINA",
    tipo: "Vídeo",
    invest: 100,
    receita: 250,
    pedidos: 2,
    sugestao: "manter",
  })),
  gmv: set.map((d, i) => ({
    data: d,
    campaign_id: "c1",
    campanha: "GMV MAX | LOJA",
    tipo: "GMV Max",
    invest: 400,
    invest_liquido: 380,
    receita: i > 36 ? 1000 : 1600,
    pedidos: 12,
    sugestao: "",
  })),
  prod: dias(DE, 30).flatMap((d) => [
    {
      data: d,
      product_id: "p1",
      seller_sku: "CREA300",
      produto: "Creatina 300g",
      invest: 300,
      receita: 1200,
      pedidos: 10,
    },
    {
      data: d,
      product_id: "p2",
      seller_sku: "WHEY900",
      produto: "Whey 900g",
      invest: 100,
      receita: 300,
      pedidos: 2,
    },
  ]),
  cri: [
    {
      data: "2026-09-10",
      item_id: "v_ugc_01",
      produto: "Creatina 300g",
      campanha: "GMV MAX | LOJA",
      invest: 2000,
      receita: 9000,
      pedidos: 60,
    },
    {
      data: "2026-09-10",
      item_id: "v_talk_02",
      produto: "Whey 900g",
      campanha: "VIDEO | CREATINA",
      invest: 900,
      receita: 0,
      pedidos: 0,
    },
    {
      data: "2026-09-10",
      item_id: "v_demo_03",
      produto: "Creatina 300g",
      campanha: "GMV MAX | LOJA",
      invest: 3000,
      receita: 7500,
      pedidos: 40,
    },
    {
      data: "2026-09-10",
      item_id: "v_new_04",
      produto: "Pré-treino",
      campanha: "VIDEO | CREATINA",
      invest: 20,
      receita: 0,
      pedidos: 0,
    },
    {
      data: "2026-09-10",
      item_id: "",
      agregado: true,
      produto: "",
      campanha: "",
      invest: 500,
      receita: 600,
      pedidos: 4,
    },
  ],
  est: [
    { seller_sku: "CREA300", quantidade: 40 },
    { seller_sku: "WHEY900", quantidade: 500 },
  ],
};

// ---------------- Meli DSP ----------------
const dsp = (inv: number, rec: number) => ({
  investimento: inv,
  impressoes: inv * 200,
  alcance: inv * 20,
  cliques: inv * 2,
  ppv: inv,
  add_to_cart: inv / 10,
  checkout: inv / 20,
  unidades: inv / 25,
  receita: rec,
  receita_tp: rec * 1.6,
  views_ativas: 0,
  views_completas: 0,
});
export const ml = {
  kpi: set.map((d, i) => ({ data: d, ...dsp(i === 43 ? 300 : 1000, i === 43 ? 900 : 4000) })),
  camp: [
    {
      data: "2026-09-05",
      campaign_id: "m1",
      campaign_name: "CONVERSAO | CREATINA",
      tipo: "",
      goal: "",
      status: "active",
      ...dsp(12000, 60000),
    },
    {
      data: "2026-09-05",
      campaign_id: "m2",
      campaign_name: "DCA_RETARGETING",
      tipo: "",
      goal: "",
      status: "active",
      ...dsp(3000, 15000),
    },
    {
      data: "2026-09-05",
      campaign_id: "m3",
      campaign_name: "IN_MARKETING WHEY",
      tipo: "",
      goal: "",
      status: "active",
      ...dsp(9000, 20000),
    },
    {
      data: "2026-09-05",
      campaign_id: "m4",
      campaign_name: "VIDEO_INSTITU",
      tipo: "",
      goal: "",
      status: "active",
      ...dsp(4000, 2000),
    },
    {
      data: "2026-09-05",
      campaign_id: "m5",
      campaign_name: "Teste 01",
      tipo: "",
      goal: "",
      status: "paused",
      ...dsp(500, 300),
    },
  ],
  cri: [
    {
      data: "2026-09-05",
      creative_id: "k1",
      creative_name: "Vídeo Creatina 15s",
      campaign_name: "VIDEO_INSTITU",
      line_item_name: "LI vídeo",
      q25: 40000,
      q50: 24000,
      q75: 12000,
      q100: 6000,
      ...dsp(4000, 2000),
    },
    {
      data: "2026-09-05",
      creative_id: "k2",
      creative_name: "Banner Whey 300x250",
      campaign_name: "CONVERSAO | CREATINA",
      line_item_name: "LI banner",
      q25: 0,
      q50: 0,
      q75: 0,
      q100: 0,
      ...dsp(12000, 60000),
    },
  ],
};

// ---------------- Afiliados ----------------
export const af = {
  ml: [
    {
      data: "2026-09-10",
      gmv_afiliado: 30000,
      gmv_total: 200000,
      custo_afiliado: 3600,
      pedidos_afiliado: 200,
      pedidos_total: 1500,
    },
  ],
  shopee: [
    {
      data: "2026-09-10",
      gmv_afiliado: 20000,
      gmv_total: 80000,
      custo_afiliado: 3000,
      pedidos_afiliado: 150,
      pedidos_total: 700,
      margem_afiliado_pct: 12,
      margem_sem_afiliado_pct: 31,
    },
  ],
  tiktok: [
    {
      data: "2026-09-10",
      gmv_afiliado: 50000,
      gmv_total: 90000,
      custo_total: 9000,
      pedidos_afiliado: 400,
      pedidos_total: 720,
      margem_afiliado_pct: 22,
      margem_sem_afiliado_pct: 30,
    },
  ],
  inf: [
    {
      data: "2026-09-25",
      creator_id: "i1",
      nome: "Atleta Alfa",
      tiktok_username: "atleta.alfa",
      tier: "Macro",
      cupom: "ALFA10",
      receita_site: 8000,
      receita_tiktok: 12000,
      pedidos_total: 140,
      custo_dia: 3000,
      comissao_dia: 1000,
    },
    {
      data: "2026-09-05",
      creator_id: "i2",
      nome: "Coach Beta",
      tiktok_username: "coachbeta",
      tier: "Micro",
      cupom: "BETA",
      receita_site: 3000,
      receita_tiktok: 0,
      pedidos_total: 20,
      custo_dia: 500,
      comissao_dia: 300,
    },
    {
      data: "2026-09-12",
      creator_id: "i3",
      nome: "Fit Gama",
      tiktok_username: "fitgama",
      tier: "Nano",
      cupom: "GAMA",
      receita_site: 0,
      receita_tiktok: 0,
      pedidos_total: 0,
      custo_dia: 1200,
      comissao_dia: 0,
    },
  ],
  cupons: [
    {
      data: "2026-09-25",
      cupom: "alfa10",
      pedidos: 50,
      pedidos_cliente_novo: 35,
      unidades: 60,
      unidades_devolvidas: 1,
      desconto: 800,
      faturamento_bruto: 8800,
      faturamento_liquido: 8000,
    },
    {
      data: "2026-09-05",
      cupom: "BETA",
      pedidos: 20,
      pedidos_cliente_novo: 4,
      unidades: 22,
      unidades_devolvidas: 2,
      desconto: 600,
      faturamento_bruto: 3600,
      faturamento_liquido: 3000,
    },
  ],
  mlCre: [
    {
      data: "2026-09-28",
      afiliado_username: "dicasdesupl",
      afiliado_nome: "Dicas de Suplemento",
      gmv: 15000,
      custo: 1800,
      pedidos: 100,
    },
    {
      data: "2026-08-30",
      afiliado_username: "antigo",
      afiliado_nome: "Fora do período",
      gmv: 999,
      custo: 1,
      pedidos: 1,
    },
  ],
  up: [
    {
      uppromote_id: 7,
      nome: "Blog Treino",
      cupom: "TREINO",
      comissao_pct: 10,
      programa: "Padrão",
      status: "active",
    },
  ],
  upMes: [
    { uppromote_id: 7, mes: "2026-09-01", receita: 5000, pedidos: 40, pedidos_cliente_novo: 30 },
  ],
  mlProd: [
    {
      data: "2026-09-10",
      item_id: "MLB1",
      seller_sku: "CREA300",
      produto: "Creatina 300g",
      gmv_afiliado: 20000,
      gmv_total: 50000,
      custo_afiliado: 2400,
    },
  ],
  shProd: [
    {
      data: "2026-09-10",
      item_id: "S1",
      item_sku: "WHEY900",
      produto: "Whey 900g",
      gmv_afiliado: 9000,
      gmv_total: 12000,
      custo_afiliado: 1350,
    },
  ],
  ttProd: [
    {
      data: "2026-09-10",
      seller_sku: "CREA300",
      produto: "Creatina 300g",
      gmv_afiliado: 30000,
      gmv_total: 40000,
      custo_afiliado: 5400,
    },
  ],
};

// ---------------- Mídia por produto ----------------
export const ms = {
  produtos: [
    {
      data: "2026-09-10",
      canal: "Site",
      sku: "CREA300",
      produto: "Creatina 300g",
      unidades: 100,
      receita: 10000,
      invest_ads: 2000,
      receita_ads: 6000,
    },
    {
      data: "2026-09-10",
      canal: "Amazon",
      sku: "CREA300",
      produto: "Creatina 300g",
      unidades: 50,
      receita: 5000,
      invest_ads: 800,
      receita_ads: 2500,
    },
    {
      data: "2026-09-10",
      canal: "Site",
      sku: "WHEY900",
      produto: "Whey 900g",
      unidades: 20,
      receita: 3000,
      invest_ads: 2500,
      receita_ads: 2800,
    },
    {
      data: "2026-09-10",
      canal: "Site",
      sku: "GLUT300",
      produto: "Glutamina 300g",
      unidades: 80,
      receita: 8000,
      invest_ads: 100,
      receita_ads: 300,
    },
    {
      data: "2026-09-10",
      canal: "Site",
      sku: "NOVO1",
      produto: "Lançamento sem custo",
      unidades: 5,
      receita: 500,
      invest_ads: 50,
      receita_ads: 100,
    },
  ],
  custos: [
    { sku: "CREA300", custo_unitario: 30, vigencia_inicio: "2026-01-01" },
    { sku: "WHEY900", custo_unitario: 70, vigencia_inicio: "2026-01-01" },
    { sku: "GLUT300", custo_unitario: 25, vigencia_inicio: "2026-01-01" },
  ],
  pl: [
    { data: "2026-09-10", canal: "Site", receita_bruta: 100000, custo_canal: 8000, imposto: 7000 },
    {
      data: "2026-09-10",
      canal: "Amazon",
      receita_bruta: 50000,
      custo_canal: 10000,
      imposto: 3500,
    },
  ],
  site: [
    { sku: "CREA300", cobertura_dias: 9 },
    { sku: "WHEY900", cobertura_dias: 60 },
    { sku: "GLUT300", cobertura_dias: 80 },
  ],
  fba: [{ sku: "CREA300", em_fba: true, cobertura_dias: 40 }],
  funil: set.flatMap((d, i) => [
    { data: d, canal: "Meta Ads", invest: i === 43 ? 3000 : 1500, receita_ads: 6000 },
    { data: d, canal: "Google Ads", invest: 800, receita_ads: i === 43 ? 900 : 4000 },
  ]),
};

// ---------------- Devoluções e ranking ----------------
const ant = dias("2026-08-02", 30);
const cur = dias(DE, 30);
export const dv = {
  site: [
    ...ant.map((d) => ({ data: d, pedidos: 100, unidades: 120, unidades_devolvidas: 1 })),
    ...cur.map((d) => ({ data: d, pedidos: 100, unidades: 120, unidades_devolvidas: 3 })),
  ],
  amazon: cur.map((d) => ({ data: d, pedidos: 30, unidades: 35, unidades_devolvidas: 0 })),
  ml: [
    ...ant.map((d) => ({
      data: d,
      pedidos: 50,
      pedidos_cancelados: 1,
      faturamento_cancelado: 100,
    })),
    ...cur.map((d) => ({
      data: d,
      pedidos: 50,
      pedidos_cancelados: 3,
      faturamento_cancelado: 300,
    })),
  ],
  shopee: cur.map((d) => ({
    data: d,
    pedidos: 20,
    pedidos_cancelados: 1,
    faturamento_cancelado: 80,
    frete_reverso: 10,
  })),
  tiktok: cur.map((d) => ({ data: d, pedidos: 25, pedidos_cancelados: 1 })),
  ttDev: cur.map((d) => ({ data: d, pedidos: 25, devolucoes: 1, valor_reembolso: 90 })),
  motivos: [
    { dia: "2026-09-03", motivo: "Produto danificado", valor_reembolso: 120 },
    { dia: "2026-09-04", motivo: "Produto danificado", valor_reembolso: 100 },
    { dia: "2026-09-05", motivo: "Arrependimento", valor_reembolso: 90 },
  ],
  canc: [
    {
      motivo: "Atraso na entrega",
      iniciador: "comprador",
      pedidos: 12,
      share_pct: 40,
      valor_perdido: 1500,
    },
  ],
  ranking: [
    {
      categoria: "Creatina",
      mes: "2026-09",
      nome: "Marca Líder",
      posicao: 1,
      share_pct: 18,
      crescimento: 5,
      receita_periodo: 900000,
    },
    {
      categoria: "Creatina",
      mes: "2026-09",
      nome: "Marca Dois",
      posicao: 2,
      share_pct: 15,
      crescimento: 12,
      receita_periodo: 750000,
    },
    {
      categoria: "Creatina",
      mes: "2026-09",
      nome: "Soldiers Nutrition",
      posicao: 3,
      share_pct: 14,
      crescimento: -6,
      receita_periodo: 700000,
    },
    {
      categoria: "Whey",
      mes: "2026-09",
      nome: "Gigante Whey",
      posicao: 1,
      share_pct: 20,
      crescimento: 2,
      receita_periodo: 1200000,
    },
    {
      categoria: "Whey",
      mes: "2026-09",
      nome: "Soldiers Nutrition",
      posicao: 2,
      share_pct: 18.5,
      crescimento: 8,
      receita_periodo: 1100000,
    },
  ],
};

export function tiktokFixture() {
  const resumo = resumoTikTokAds(tt.tipo, DE, ATE);
  resumo.anomalia = resumoTikTokAds(tt.tipo, "2026-08-18", ATE).anomalia;
  const criativos = criativosTikTok(tt.cri, DE, ATE);
  const produtos = produtosTikTokAds(tt.prod, tt.est, DE, ATE);
  return {
    resumo,
    campanhas: campanhasTikTok(tt.camp, tt.gmv, DE, ATE),
    produtos,
    criativos,
    alertas: alertasTikTokAds({ resumo, criativos, produtos }),
    erros: {} as Record<string, string>,
  };
}

export function meliFixture() {
  const resumo = resumoMeliDsp(ml.kpi, DE, ATE);
  resumo.anomalia = resumoMeliDsp(ml.kpi, "2026-08-18", ATE).anomalia;
  const cp = campanhasMeliDsp(ml.camp, DE, ATE);
  return {
    resumo,
    campanhas: cp.campanhas,
    mix: cp.mix,
    criativos: criativosMeliDsp(ml.cri, DE, ATE),
    alertas: alertasMeliDsp({ resumo, mix: cp.mix }),
    erros: {} as Record<string, string>,
  };
}

export function afiliadosFixture() {
  const canais = afiliadosPorCanal({ ml: af.ml, shopee: af.shopee, tiktok: af.tiktok }, DE, ATE);
  const creators = creators360(
    {
      influenciadores: af.inf,
      cuponsSite: af.cupons,
      mlCreators: af.mlCre,
      upAfiliados: af.up,
      upMes: af.upMes,
    },
    DE,
    ATE,
    ATE,
  );
  const conc = concentracao(creators);
  const comTags = tagsDinamicas(creators);
  return {
    canais,
    creators: comTags,
    tags: contagemTags(comTags),
    totalCreators: creators.length,
    concentracao: conc,
    produtos: produtosAfiliado({ ml: af.mlProd, shopee: af.shProd, tiktok: af.ttProd }, DE, ATE),
    alertas: alertasAfiliados({ canais, creators, concentracao: conc }),
    erros: {} as Record<string, string>,
  };
}

export function midiaSkuFixture() {
  const skus = midiaPorSku(
    { produtos: ms.produtos, custos: ms.custos, pl: ms.pl, estoqueSite: ms.site, fba: ms.fba },
    DE,
    ATE,
  );
  const ritmo = ritmoCanais(ms.funil, DE, ATE);
  return {
    skus,
    totalSkus: skus.length,
    ritmo,
    alertas: alertasMidiaSku({ skus, ritmo }),
    erros: {} as Record<string, string>,
  };
}

export function devolucoesFixture() {
  const canais = devolucoesPorCanal(
    {
      site: dv.site,
      amazon: dv.amazon,
      ml: dv.ml,
      shopee: dv.shopee,
      tiktok: dv.tiktok,
      tiktokDev: dv.ttDev,
    },
    DE,
    ATE,
  );
  const ranking = rankingML(dv.ranking);
  return {
    canais,
    motivos: motivosDevolucao(dv.motivos, DE, ATE),
    cancelamentosTikTok: dv.canc.map((x) => ({
      motivo: x.motivo,
      iniciador: x.iniciador,
      pedidos: x.pedidos,
      sharePct: x.share_pct,
      valorPerdido: x.valor_perdido,
    })),
    ranking,
    alertas: alertasDevolucoes({ canais, ranking }),
    erros: {} as Record<string, string>,
  };
}
