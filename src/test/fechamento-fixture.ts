// Dados de exemplo (fictícios) do Fechamento de comissões, com os casos da planilha "Vendas gerais":
// cupom maior que UpPromote, UpPromote maior que cupom, só TikTok, dois cupons do mesmo @, % 2,5 e 0%.
import {
  fechamentoMes,
  resumoFechamento,
  porCreator,
  exportPagamento,
  conferencia,
  linhasPlanilha,
  melhorBaseCupom,
  alertasFechamento,
} from "@/lib/fechamento";

export const MES = "2026-09";
const v = (data: string, cupom: string, liq: number, bruto = liq * 1.1) => ({
  data,
  cupom,
  faturamento_liquido: liq,
  faturamento_bruto: bruto,
  total_pago: bruto + 20,
});

export const fx = {
  influenciadores: [
    { nome: "Creator Alfa", cupom: "ALFA", tiktok_username: "alfa.fit", comissao_pct: 5 },
    { nome: "Creator Beta", cupom: "beta", tiktok_username: "@beta.treino", comissao_pct: 0.07 },
    { nome: "Creator Beta", cupom: "BETAUP", tiktok_username: "beta.treino", comissao_pct: 7 },
    { nome: "Creator Gama", cupom: "GAMA", tiktok_username: "gama", comissao_pct: 2.5 },
    { nome: "Creator Delta", cupom: "DELTA", tiktok_username: "0", comissao_pct: 0 },
    { nome: "Creator Ômega", cupom: "OMEGA", tiktok_username: "omega", comissao_pct: 5 },
  ],
  upAfiliados: [
    { uppromote_id: 1, nome: "Alfa", cupom: "ALFA", comissao_pct: 5 },
    { uppromote_id: 2, nome: "Beta", cupom: "BETAUP", comissao_pct: 7 },
    { uppromote_id: 3, nome: "Gama", cupom: "GAMA", comissao_pct: 2.5 },
    { uppromote_id: 9, nome: "Afiliado só UP", cupom: "SOUP", comissao_pct: 10 },
  ],
  upMes: [
    { uppromote_id: 1, mes: "2026-09-01", receita: 900 },
    { uppromote_id: 2, mes: "2026-09-01", receita: 1500 },
    { uppromote_id: 3, mes: "2026-09-01", receita: 228093.53 },
    { uppromote_id: 9, mes: "2026-09-01", receita: 300 },
    { uppromote_id: 1, mes: "2026-08-01", receita: 99999 },
  ],
  cuponsSite: [
    v("2026-09-02", "ALFA", 600),
    v("2026-09-20", "alfa", 400),
    v("2026-09-10", "BETAUP", 1200),
    v("2026-09-10", "GAMA", 226395.82),
    v("2026-09-15", "DELTA", 5499.77),
    v("2026-08-31", "ALFA", 77777),
  ],
  videos: [
    { data: "2026-09-05", criador: "beta.treino", gmv: 120.4 },
    { data: "2026-09-06", criador: "@OMEGA", gmv: 2230.05 },
    { data: "2026-10-01", criador: "omega", gmv: 999 },
  ],
  planilha: [
    // carga antiga (ignorada)
    {
      competencia: "2026-09-01",
      cupom: "ALFA",
      venda_considerada: 1,
      carregado_em: "2026-10-01T09:00:00Z",
    },
    // carga atual
    ...[
      ["ALFA", "alfa.fit", 5, 1000, 900, 1000, 0, 1000, 50],
      ["BETA", "beta.treino", 7, 0, 0, 0, 120.4, 120.4, 0],
      ["BETAUP", "beta.treino", 7, 1200, 1500, 1500, 120.4, 1620.4, 105],
      ["GAMA", "gama", 2.5, 226395.82, 228093.53, 228093.53, 0, 228093.53, 5702.34],
      ["DELTA", "", 0, 5499.77, 0, 5499.77, 0, 5499.77, 0],
      ["OMEGA", "omega", 5, 0, 0, 0, 2000, 2000, 0],
      ["DUPLICADO", "lucas", 7, 0, 0, 0, 0, 0, 0],
      ["DUPLICADO", "outro", 5, 0, 0, 0, 50, 50, 0],
      ["ANTIGO", "", 5, 80, 0, 80, 0, 80, 4],
      ["0", "0", 0, 0, 0, 0, 0, 0, 0],
    ].map(
      ([
        cupom,
        tiktok_username,
        comissao_pct,
        venda_cupom,
        venda_up,
        venda_considerada,
        venda_tiktok,
        total,
        comissao,
      ]) => ({
        competencia: "2026-09-01",
        cupom,
        tiktok_username,
        comissao_pct,
        venda_cupom,
        venda_up,
        venda_considerada,
        venda_tiktok,
        total,
        comissao,
        carregado_em: "2026-10-03T10:00:00Z",
      }),
    ),
  ],
};

export function fechamentoFixture() {
  const linhas = fechamentoMes(fx, MES);
  const plan = linhasPlanilha(fx.planilha, MES);
  const conf = conferencia(linhas, plan);
  return {
    mes: MES,
    base: "faturamento_liquido" as const,
    resumo: resumoFechamento(linhas),
    linhas,
    creators: porCreator(linhas),
    pagamento: exportPagamento(linhas, MES, conf),
    conferencia: conf,
    basesCupom: melhorBaseCupom(fx.cuponsSite, plan, MES),
    planilhaCarregadaEm: "2026-10-03T10:00:00Z",
    migracaoPendente: false,
    alertas: alertasFechamento(linhas, conf),
    erros: {} as Record<string, string>,
  };
}
