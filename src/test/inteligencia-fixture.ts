// Dados de exemplo (fictícios) para a tela Intelligence. Usados nos testes e na prévia.
import {
  channelIntelligence,
  matrizProdutoCanal,
  previsaoEstoque,
  resultadosExperimentos,
  alertasInteligencia,
} from "@/lib/inteligencia";

export const DE = "2026-09-01";
export const ATE = "2026-09-30";
export const HOJE = "2026-10-01";
const dias = (de: string, n: number) =>
  Array.from({ length: n }, (_, i) =>
    new Date(Date.parse(de) + i * 86400000).toISOString().slice(0, 10),
  );
const serie56 = dias("2026-08-06", 56);

export const ig = {
  pl: [
    {
      data: "2026-09-10",
      canal: "Site",
      receita_bruta: 100000,
      margem_contribuicao: 30000,
      ads: 10000,
      custo_canal: 8000,
      imposto: 7000,
    },
    {
      data: "2026-09-10",
      canal: "Mercado Livre",
      receita_bruta: 50000,
      margem_contribuicao: 5000,
      ads: 5000,
      custo_canal: 10000,
      imposto: 3500,
    },
    {
      data: "2026-08-10",
      canal: "Site",
      receita_bruta: 80000,
      margem_contribuicao: 20000,
      ads: 9000,
      custo_canal: 0,
      imposto: 0,
    },
    {
      data: "2026-08-10",
      canal: "Mercado Livre",
      receita_bruta: 60000,
      margem_contribuicao: 9000,
      ads: 4000,
      custo_canal: 0,
      imposto: 0,
    },
  ],
  receita: [
    { data: "2026-09-10", canal_venda: "Site", pedidos: 500 },
    { data: "2026-09-10", canal_venda: "Mercado Livre", pedidos: 400 },
  ],
  cac: [
    { canal: "Site", mes: "2026-09-01", novos: 200, invest_aquisicao: 8000 },
    { canal: "Mercado Livre", mes: "2026-09-01", novos: 100, invest_aquisicao: 5000 },
    { canal: "Site", mes: "2026-07-01", novos: 999, invest_aquisicao: 1 },
  ],
  origem: [
    { canal_entrada: "Shopify", clientes: 5000, ltv_medio: 300, pct_recompra: 35 },
    { canal_entrada: "Mercado Livre", clientes: 3000, ltv_medio: 40, pct_recompra: 8 },
  ],
  matriz: [
    {
      data: "2026-09-10",
      canal: "Site",
      sku: "CREA300",
      produto: "Creatina 300g",
      unidades: 100,
      receita: 10000,
      invest_ads: 1000,
    },
    {
      data: "2026-09-10",
      canal: "Mercado Livre",
      sku: "CREA300",
      produto: "Creatina 300g",
      unidades: 50,
      receita: 5000,
      invest_ads: 2000,
    },
    {
      data: "2026-09-10",
      canal: "Site",
      sku: "WHEY900",
      produto: "Whey 900g",
      unidades: 20,
      receita: 3000,
      invest_ads: 1500,
    },
    {
      data: "2026-09-10",
      canal: "Mercado Livre",
      sku: "WHEY900",
      produto: "Whey 900g",
      unidades: 25,
      receita: 4000,
      invest_ads: 0,
    },
    {
      data: "2026-09-10",
      canal: "Site",
      sku: "NOVO1",
      produto: "Lançamento",
      unidades: 5,
      receita: 500,
      invest_ads: 0,
    },
  ],
  custos: [
    { sku: "CREA300", custo_unitario: 30, vigencia_inicio: "2026-01-01" },
    { sku: "WHEY900", custo_unitario: 70, vigencia_inicio: "2026-01-01" },
  ],
  vendas: serie56.flatMap((d, i) => [
    {
      data: d,
      canal: "Site",
      sku: "CREA300",
      produto: "Creatina 300g",
      unidades: i >= 49 ? 20 : 10,
      receita: 0,
      invest_ads: 0,
    },
    {
      data: d,
      canal: "Amazon",
      sku: "CREA300",
      produto: "Creatina 300g",
      unidades: 2,
      receita: 0,
      invest_ads: 0,
    },
    {
      data: d,
      canal: "Site",
      sku: "GLUT300",
      produto: "Glutamina 300g",
      unidades: 1,
      receita: 0,
      invest_ads: 0,
    },
  ]),
  site: [
    { sku: "CREA300", estoque: 100 },
    { sku: "GLUT300", estoque: 0 },
  ],
  fba: [{ seller_sku: "CREA300", fulfillable: 200 }],
  mlFull: [{ seller_sku: "WHEY900", disponivel: 50 }],
  experimentos: [
    {
      id: "e1",
      titulo: "Lembrete de reposição da creatina",
      hipotese: "Lembrar antes do ciclo aumenta a recompra",
      area: "crm",
      metrica_principal: "recompra",
      inicio: "2026-09-01",
      fim: null,
      status: "rodando",
      decisao: null,
      aprendizado: null,
    },
    {
      id: "e2",
      titulo: "Comissão 25% no TikTok",
      hipotese: "Comissão maior traz mais creators ativos",
      area: "affiliate",
      metrica_principal: "receita",
      inicio: "2026-08-01",
      fim: null,
      status: "rodando",
      decisao: null,
      aprendizado: null,
    },
    {
      id: "e3",
      titulo: "Frete grátis acima de R$ 199",
      hipotese: "Frete grátis aumenta o ticket",
      area: "commerce",
      metrica_principal: "receita",
      inicio: "2026-07-01",
      fim: null,
      status: "planejado",
      decisao: null,
      aprendizado: null,
    },
  ],
  grupos: [
    {
      experimento_id: "e1",
      grupo: "controle",
      descricao: "sem lembrete",
      participantes: 1000,
      convertidos: 80,
      receita: 9000,
    },
    {
      experimento_id: "e1",
      grupo: "tratamento",
      descricao: "e-mail no dia 33",
      participantes: 1000,
      convertidos: 110,
      receita: 12000,
    },
    {
      experimento_id: "e2",
      grupo: "tratamento",
      descricao: "25% de comissão",
      participantes: 300,
      convertidos: 40,
      receita: 8000,
    },
  ],
};

export function inteligenciaFixture() {
  const canais = channelIntelligence(
    { pl: ig.pl, receita: ig.receita, cac: ig.cac, origem: ig.origem },
    DE,
    ATE,
  );
  const estoque = previsaoEstoque(
    { produtos: ig.vendas, site: ig.site, fba: ig.fba, mlFull: ig.mlFull, shopee: [], tiktok: [] },
    HOJE,
  );
  const experimentos = resultadosExperimentos(ig.experimentos, ig.grupos);
  return {
    canais,
    matriz: matrizProdutoCanal({ produtos: ig.matriz, custos: ig.custos, pl: ig.pl }, DE, ATE),
    estoque: { linhas: estoque.linhas, total: estoque.linhas.length, backtest: estoque.backtest },
    experimentos,
    migracaoPendente: false,
    alertas: alertasInteligencia({ canais, estoque: estoque.linhas, experimentos }),
    erros: {} as Record<string, string>,
  };
}
