// Dados de exemplo (fictícios) da Central de criativos.
import {
  placarMeta,
  oQueFunciona,
  multicanal,
  biblioteca,
  alertasCriativos,
} from "@/lib/criativos360";
import {
  mapaManual,
  dnaMeta,
  dnaTikTok,
  resumoMeta,
  resumoTikTok,
  combinacoesTikTok,
  dnaPorCreator,
  cobertura,
  alertasDNA,
} from "@/lib/dna";

export const DE = "2026-09-01";
export const ATE = "2026-09-30";
const dias = (de: string, n: number) =>
  Array.from({ length: n }, (_, i) =>
    new Date(Date.parse(de) + i * 86400000).toISOString().slice(0, 10),
  );
const set = dias(DE, 30);

const base = {
  effective_status: "ACTIVE",
  alcance: 4000,
  video_25: 0,
  video_100: 0,
  thumbnail_url: "",
  instagram_permalink_url: "",
};
export const cr = {
  anuncios: [
    ...set.map((d) => ({
      ...base,
      data: d,
      ad_id: "111",
      creative_id: "c1",
      ad_name: "BF_VID_9x16_001 creatina @atleta.alfa",
      ad_title: "Você toma creatina do jeito errado?",
      ad_body: "Creapure com laudo de pureza. Use o cupom ATLETA10.",
      object_type: "VIDEO",
      gasto: 100,
      impressoes: 10000,
      cliques: 150,
      frequencia: 2.5,
      video_25: 3000,
      video_100: 600,
      compras: 3,
      receita: 450,
    })),
    ...set.map((d) => ({
      ...base,
      data: d,
      ad_id: "222",
      creative_id: "c2",
      ad_name: "BF_IMG_4x5_002",
      ad_title: "Whey 900g",
      ad_body: "Leve 2 com 20% OFF. Sabor que dissolve fácil. Compre agora.",
      object_type: "PHOTO",
      gasto: 50,
      impressoes: 10000,
      cliques: d >= "2026-09-24" ? 100 : 200,
      frequencia: d >= "2026-09-24" ? 4 : 2,
      compras: 1,
      receita: 100,
    })),
    {
      ...base,
      data: "2026-09-15",
      ad_id: "333",
      creative_id: "c3",
      ad_name: "Teste institucional",
      ad_title: "Mais vendido do Brasil",
      ad_body: "Mais de 1 milhão de clientes. Saiba mais.",
      object_type: "SHARE",
      gasto: 2000,
      impressoes: 50000,
      cliques: 300,
      frequencia: 1.5,
      compras: 0,
      receita: 0,
    },
    {
      ...base,
      data: "2026-09-15",
      ad_id: "444",
      creative_id: "c4",
      ad_name: "Novo teste",
      ad_title: "",
      ad_body: "",
      object_type: "PHOTO",
      gasto: 100,
      impressoes: 3000,
      cliques: 30,
      frequencia: 1,
      compras: 0,
      receita: 0,
    },
    {
      ...base,
      data: "2026-09-15",
      ad_id: "555",
      creative_id: "c5",
      ad_name: "Carrossel kit",
      ad_title: "",
      ad_body: "",
      object_type: "SHARE",
      gasto: 300,
      impressoes: 8000,
      cliques: 80,
      frequencia: 1.2,
      compras: 1,
      receita: 200,
    },
    {
      ...base,
      data: "2026-09-16",
      ad_id: "556",
      creative_id: "c5",
      ad_name: "Carrossel kit",
      ad_title: "",
      ad_body: "",
      object_type: "SHARE",
      gasto: 300,
      impressoes: 8000,
      cliques: 80,
      frequencia: 1.2,
      compras: 1,
      receita: 100,
    },
    {
      ...base,
      data: "2026-08-20",
      ad_id: "111",
      creative_id: "c1",
      ad_name: "BF_VID_9x16_001 creatina @atleta.alfa",
      object_type: "VIDEO",
      gasto: 9999,
      impressoes: 1,
      cliques: 0,
      compras: 0,
      receita: 0,
    },
  ],
  cliente: [
    {
      ad_id: "111",
      pedidos: 40,
      receita: 9000,
      clientes: 35,
      clientes_novos: 20,
      novos_que_recompraram: 8,
      ltv_medio_novos: 500,
    },
    {
      ad_id: "222",
      pedidos: 15,
      receita: 3000,
      clientes: 12,
      clientes_novos: 10,
      novos_que_recompraram: 2,
      ltv_medio_novos: 600,
    },
    {
      ad_id: "555",
      pedidos: 2,
      receita: 200,
      clientes: 2,
      clientes_novos: 2,
      novos_que_recompraram: 0,
      ltv_medio_novos: 100,
    },
    {
      ad_id: "556",
      pedidos: 1,
      receita: 100,
      clientes: 1,
      clientes_novos: 1,
      novos_que_recompraram: 0,
      ltv_medio_novos: 400,
    },
  ],
  cria: [
    {
      id: "f1",
      nome: "BF_VID_9x16_001.mp4",
      tipo: "video",
      largura: 1080,
      altura: 1920,
      duracao_seg: 15,
      origem: "drive",
      criado_em: "2026-09-01T10:00:00Z",
    },
    {
      id: "f2",
      nome: "BF_IMG_4x5_002.jpg",
      tipo: "imagem",
      largura: 1080,
      altura: 1350,
      duracao_seg: null,
      origem: "upload",
      criado_em: "2026-09-02T10:00:00Z",
    },
    {
      id: "f3",
      nome: "antigo.png",
      tipo: "imagem",
      largura: 1080,
      altura: 1080,
      duracao_seg: null,
      origem: "upload",
      criado_em: "2026-06-01T10:00:00Z",
    },
  ],
  criaAsset: [
    { criativo_id: "f1", plataforma: "meta", estado: "ok", erro_msg: null },
    { criativo_id: "f1", plataforma: "tiktok", estado: "erro", erro_msg: "formato" },
  ],
  lote: [{ nome_criativo: "BF_IMG_4x5_002", meta_creative_id: "c2" }],
  tiktok: [
    { data: "2026-09-10", item_id: "v1", produto: "Creatina 300g", invest: 1000, receita: 4000 },
    { data: "2026-09-10", item_id: "v2", produto: "Whey 900g", invest: 1000, receita: 0 },
    { data: "2026-09-10", item_id: "v3", produto: "Pré-treino", invest: 50, receita: 0 },
  ],
  pmax: [
    {
      asset_id: "g1",
      asset_type: "IMAGE",
      field_type: "MARKETING_IMAGE",
      texto: "",
      youtube_video_id: "",
      performance_label: "BEST",
    },
    {
      asset_id: "g2",
      asset_type: "TEXT",
      field_type: "HEADLINE",
      texto: "Creatina pura",
      youtube_video_id: "",
      performance_label: "GOOD",
    },
  ],
  dsp: [
    {
      data: "2026-09-10",
      creative_id: "k1",
      creative_name: "Banner creatina",
      investimento: 500,
      receita: 1000,
    },
  ],
};

const v = (id: string, criador: string, titulo: string, views: number, gmv: number) =>
  ["2026-09-05", "2026-09-06"].map((data) => ({
    data,
    video_id: id,
    titulo,
    criador,
    views: views / 2,
    gmv: gmv / 2,
    unidades: Math.round(gmv / 100),
  }));
export const videos = [
  ...v(
    "t1",
    "atleta.alfa",
    "Pare de tomar creatina assim! Creapure com laudo, link na bio",
    20000,
    3000,
  ),
  ...v("t2", "atleta.alfa", "3 erros com whey. Pureza importa, cupom ALFA", 15000, 2000),
  ...v("t3", "fit.beta", "Creatina pura sem enrolação, carrinho amarelo", 10000, 1500),
  ...v("t4", "fit.beta", "Minha rotina de treino com whey, prático no dia a dia", 30000, 600),
  ...v("t5", "gym.gama", "Quanto custa? Whey em promoção com desconto", 25000, 900),
  ...v("t6", "gym.gama", "Antes e depois de 60 dias com creatina", 12000, 1200),
  ...v("t7", "gym.gama", "unboxing", 5000, 100),
];
export const etiquetasManuais = [
  { canal: "tiktok_creator", conteudo_id: "t7", dimensao: "gancho", valor: "Novidade" },
  { canal: "meta", conteudo_id: "c4", dimensao: "angulo", valor: "Autoridade" },
];

export function criativosFixture() {
  const placar = placarMeta(cr.anuncios, cr.cliente, 40, DE, ATE);
  const biblio = biblioteca(cr.cria, cr.criaAsset, cr.lote, placar);
  const manual = mapaManual(etiquetasManuais);
  const pm = dnaMeta(placar, manual);
  const pt = dnaTikTok(videos, manual, DE, ATE);
  const rm = resumoMeta(pm);
  const rt = resumoTikTok(pt);
  const cob = cobertura(pm, pt);
  return {
    margemSitePct: 40,
    temCliente: true,
    placar,
    totalCriativos: placar.length,
    oQueFunciona: oQueFunciona(placar),
    multicanal: multicanal({ tiktok: cr.tiktok, pmax: cr.pmax, dsp: cr.dsp }, DE, ATE),
    biblioteca: biblio,
    totalBiblioteca: biblio.length,
    migracaoPendente: false,
    dna: {
      meta: rm,
      tiktok: rt,
      combinacoes: combinacoesTikTok(pt, 1),
      creators: dnaPorCreator(pt),
      pecasMeta: pm,
      pecasTikTok: pt,
      cobertura: cob,
    },
    alertas: [...alertasCriativos(placar, biblio), ...alertasDNA(rm, rt, cob)],
    erros: {} as Record<string, string>,
  };
}
