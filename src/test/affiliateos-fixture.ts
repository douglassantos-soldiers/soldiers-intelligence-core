// Dados de exemplo (fictícios) do Affiliate OS. Creators com nomes e @ inventados.
import {
  listaCreatorsOS,
  funilCreators,
  amostrasOS,
  outreachOS,
  elasticidade,
  sinaisDeRisco,
  qualidadePorCreator,
  alertasAffiliateOS,
  funilAmostrasSemanal,
  retencaoCoortes,
} from "@/lib/affiliateos";
import {
  mapaManual,
  dnaTikTok,
  dnaPorCreator,
  padroesVencedores,
  MEDIDA_TIKTOK,
  NAO_IDENTIFICADO,
} from "@/lib/dna";
import { produtoDoTexto } from "@/lib/criativos360";
import { videos as videosConteudo } from "./criativos360-fixture";

export const REF = "2026-09-30";
export const HOJE = "2026-10-01";
const dias = (de: string, n: number) =>
  Array.from({ length: n }, (_, i) =>
    new Date(Date.parse(de) + i * 86400000).toISOString().slice(0, 10),
  );

export const ao = {
  videos: [
    ...dias("2026-08-01", 61).map((d, i) => ({
      data: d,
      criador: "atleta.alfa",
      produto_nome: "Creatina 300g",
      gmv: 500,
      views: 10000,
      video_id: `va${i % 6}`,
    })),
    {
      data: "2026-09-20",
      criador: "coach.beta",
      produto_nome: "Whey 900g",
      gmv: 1000,
      views: 2000,
      video_id: "vb1",
    },
    {
      data: "2026-09-27",
      criador: "coach.beta",
      produto_nome: "Whey 900g",
      gmv: 1000,
      views: 2000,
      video_id: "vb2",
    },
    {
      data: "2026-09-29",
      criador: "fit.gama",
      produto_nome: "Creatina 300g",
      gmv: 3000,
      views: 100,
      video_id: "vg1",
    },
    {
      data: "2026-09-10",
      criador: "novato",
      produto_nome: "Creatina 300g",
      gmv: 0,
      views: 5000,
      video_id: "vn1",
    },
  ],
  cadastro: [
    {
      id: "c1",
      nome: "Atleta Alfa",
      tiktok_username: "atleta.alfa",
      cupom: "ALFA10",
      nicho: "fitness",
      tier: "macro",
      estagio: "escala",
      concorrentes: [],
    },
    {
      id: "c2",
      nome: "Rival Fit",
      tiktok_username: "rival.fit",
      cupom: null,
      nicho: "suplementos",
      tier: "micro",
      estagio: "convidado",
      concorrentes: ["MarcaX"],
    },
    {
      id: "c3",
      nome: "Coach Beta",
      tiktok_username: "coach.beta",
      cupom: "BETA",
      nicho: "crossfit",
      tier: "micro",
      estagio: "amostra",
      concorrentes: ["MarcaY"],
    },
  ],
  amostras: [
    {
      id: "a1",
      creator_id: "c1",
      sku: "CREA300",
      produto: "Creatina 300g",
      status: "enviado",
      solicitado_em: "2026-09-05",
      enviado_em: "2026-09-10",
      custo_produto: 45,
      frete: 18,
      desconto: 0,
      outros_custos: 0,
    },
    {
      id: "a2",
      creator_id: "c3",
      sku: "WHEY900",
      produto: "Whey 900g",
      status: "recebido",
      solicitado_em: "2026-09-10",
      enviado_em: "2026-09-15",
      recebido_em: "2026-09-20",
      custo_produto: 40,
      frete: 10,
      desconto: 0,
      outros_custos: 0,
    },
    {
      id: "a3",
      creator_id: "c2",
      sku: "CREA300",
      produto: "Creatina 300g",
      status: "publicado",
      solicitado_em: "2026-08-01",
      enviado_em: "2026-08-10",
      recebido_em: "2026-08-14",
      publicado_em: "2026-08-20",
      custo_produto: 45,
      frete: 20,
      desconto: 5,
      outros_custos: 0,
    },
    {
      id: "a4",
      creator_id: "c1",
      sku: "WHEY900",
      produto: "Whey 900g",
      status: "cancelado",
      solicitado_em: "2026-09-01",
      custo_produto: 0,
      frete: 0,
      desconto: 0,
      outros_custos: 0,
    },
  ],
  campanhas: [
    {
      id: "cp1",
      nome: "Creatina Q4",
      sku: "CREA300",
      comissao_pct: 20,
      creator_score_min: 50,
      product_fit_min: 50,
      gmv_min: 0,
      status: "ativa",
    },
  ],
  convites: [{ campanha_id: "cp1", creator_id: "c1", status: "convidado" }],
  skuNome: new Map([["CREA300", "Creatina 300g"]]),
  ml: [
    ...dias("2026-07-01", 5).map((d) => ({ data: d, taxa_efetiva_pct: 10, gmv: 1000 })),
    ...dias("2026-08-01", 5).map((d) => ({ data: d, taxa_efetiva_pct: 15, gmv: 1300 })),
    ...dias("2026-09-01", 5).map((d) => ({ data: d, taxa_efetiva_pct: 20, gmv: 1500 })),
  ],
  tt: [
    ...dias("2026-08-01", 3).map((d) => ({
      data: d,
      comissao_efetiva_pct: 0.1,
      gmv_afiliado: 2000,
    })),
    ...dias("2026-09-01", 3).map((d) => ({
      data: d,
      comissao_efetiva_pct: 0.2,
      gmv_afiliado: 1800,
    })),
  ],
  cupons: [
    {
      data: "2026-09-10",
      cupom: "ALFA10",
      pedidos: 50,
      unidades: 60,
      unidades_devolvidas: 1,
      desconto: 800,
      faturamento_bruto: 8800,
    },
    {
      data: "2026-09-10",
      cupom: "BETA",
      pedidos: 20,
      unidades: 22,
      unidades_devolvidas: 4,
      desconto: 600,
      faturamento_bruto: 3600,
    },
    {
      data: "2026-09-10",
      cupom: "VAZOU",
      pedidos: 10,
      unidades: 10,
      unidades_devolvidas: 0,
      desconto: 400,
      faturamento_bruto: 1000,
    },
  ],
  qualidade: [
    {
      cupom: "ALFA10",
      clientes: 40,
      clientes_novos: 30,
      recompraram: 12,
      ltv_medio: 410,
      pedidos_medio: 2.1,
    },
    {
      cupom: "BETA",
      clientes: 15,
      clientes_novos: 3,
      recompraram: 2,
      ltv_medio: 180,
      pedidos_medio: 1.2,
    },
  ],
};

export function affiliateOSFixture(foco = "Creatina") {
  const sinais = sinaisDeRisco(ao.cupons, ao.videos, REF);
  const creators = listaCreatorsOS(
    ao.videos,
    ao.cadastro,
    REF,
    foco,
    new Set(sinais.filter((s) => s.tipo === "creator").map((s) => s.quem)),
  );
  const amostras = amostrasOS(ao.amostras, ao.cadastro, ao.videos, 20, HOJE);
  const nomes = new Map(
    ao.cadastro.filter((c) => c.cupom).map((c) => [String(c.cupom).toUpperCase(), c.nome]),
  );
  // Conteúdo usa vídeos com título (fixture da Central de criativos), para não mexer nos números acima.
  const pecas = dnaTikTok(videosConteudo, mapaManual([]), "2026-07-01", REF);
  const focoNome = produtoDoTexto(foco) || foco;
  const pecasFoco = pecas.filter((x) => x.dna.produto === focoNome);
  return {
    ref: REF,
    foco,
    conteudo: {
      padroes: padroesVencedores(pecas, MEDIDA_TIKTOK),
      creators: dnaPorCreator(pecasFoco),
      videos: pecasFoco,
      videosFoco: pecasFoco.length,
      semProduto: pecas.filter((x) => x.dna.produto === NAO_IDENTIFICADO).length,
    },
    margemAfiliadoPct: 20,
    creators,
    totalCreators: creators.length,
    funil: funilCreators(creators),
    amostras,
    funilAmostras: funilAmostrasSemanal(amostras, HOJE),
    coortes: retencaoCoortes(ao.videos, HOJE),
    coorteIncompleta: false,
    contasLoja: creators.filter((c) => c.tipoConta === "loja").length,
    outreach: outreachOS(ao.campanhas, ao.convites, ao.cadastro, ao.videos, ao.skuNome, REF),
    elasticidade: [
      elasticidade("Mercado Livre", ao.ml, { taxa: "taxa_efetiva_pct", gmv: "gmv" }, 30),
      elasticidade("TikTok Shop", ao.tt, { taxa: "comissao_efetiva_pct", gmv: "gmv_afiliado" }, 30),
    ],
    sinais,
    qualidade: qualidadePorCreator(ao.qualidade, nomes),
    migracaoPendente: false,
    alertas: alertasAffiliateOS({ amostras, creators, sinais }),
    erros: {} as Record<string, string>,
  };
}
