import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  resumoAmazon,
  asin360,
  termosAds,
  shareDeBusca,
  reposicaoFba,
  recompraAsin,
  organicoVsAds,
  vendasPorHora,
  novosParaMarca,
  alvosKeywords,
  alvosSd,
  classificaLances,
} from "@/lib/amazon";

const AMZ_DE = "2026-09-01";
const AMZ_ATE = "2026-09-30";
const amazonFixture = {
  resumo: resumoAmazon(
    [
      {
        data: "2026-09-02",
        vendas: 20000,
        unidades: 200,
        sessoes: 4000,
        buybox_pct: 0.86,
        unidades_devolvidas: 4,
      },
    ],
    [{ data: "2026-09-02", ad_type: "SP", cost: 1500, sales_14d: 7500, clicks: 900 }],
    AMZ_DE,
    AMZ_ATE,
  ),
  asins: asin360(
    [
      {
        data: "2026-09-02",
        child_asin: "B0CREA",
        vendas: 12000,
        unidades: 120,
        sessoes: 1500,
        buybox_pct: 1,
      },
      {
        data: "2026-09-02",
        child_asin: "B0WHEY",
        vendas: 8000,
        unidades: 80,
        sessoes: 2500,
        buybox_pct: 0.7,
      },
    ],
    [
      {
        asin: "B0WHEY",
        ganho_buybox: false,
        concorrente_no_bb: true,
        meu_preco: 199.9,
        menor_preco_concorrente: 189.9,
      },
    ],
    [{ asin: "B0CREA", seller_sku: "CREA300", fulfillable: 90 }],
    [
      {
        asin: "B0CREA",
        sku: "CREA300",
        em_fba: true,
        cobertura_dias: 8,
        titulo: "Creatina Amazon 300g",
        fba_disponivel: 90,
      },
    ],
    [{ asin: "B0WHEY", titulo: "Whey Amazon 900g", tem_aplus: true }],
    AMZ_DE,
    AMZ_ATE,
  ),
  termos: termosAds(
    [
      {
        data: "2026-09-02",
        campaign_name: "C",
        search_term: "pre treino barato",
        keyword_text: "pre treino",
        match_type: "BROAD",
        cost: 80,
        clicks: 40,
        purchases_14d: 0,
        sales_14d: 0,
      },
      {
        data: "2026-09-02",
        campaign_name: "C",
        search_term: "creatina monohidratada",
        keyword_text: "creatina",
        match_type: "BROAD",
        cost: 50,
        clicks: 30,
        purchases_14d: 6,
        sales_14d: 900,
      },
      {
        data: "2026-09-02",
        campaign_name: "C",
        search_term: "whey",
        keyword_text: "whey",
        match_type: "BROAD",
        cost: 300,
        clicks: 100,
        purchases_14d: 3,
        sales_14d: 400,
      },
    ],
    AMZ_DE,
    AMZ_ATE,
  ),
  share: shareDeBusca([
    {
      semana_fim: "2026-09-20",
      termo: "creatina",
      nosso: true,
      click_share: 0.2,
      conversion_share: 0.25,
      rank_busca: 4,
    },
    {
      semana_fim: "2026-09-27",
      termo: "creatina",
      nosso: true,
      click_share: 0.12,
      conversion_share: 0.15,
      rank_busca: 4,
    },
  ]),
  reposicao: reposicaoFba(
    [
      {
        sku: "CREA300",
        asin: "B0CREA",
        titulo: "Creatina Amazon 300g",
        em_fba: true,
        fba_disponivel: 90,
        cobertura_dias: 8,
        enviar_30d: 300,
        alerta: "repor",
      },
    ],
    [{ seller_sku: "CREA300", imprestavel_total: 3 }],
  ),
  recompra: recompraAsin([
    {
      asin: "B0CREA",
      mes_fim: "2026-09-30",
      clientes_unicos: 300,
      pct_clientes_repetem: 0.18,
      receita_recompra: 4000,
    },
  ]),
  organico: organicoVsAds(
    [
      { semana_fim: "2026-09-20", termo: "whey", nosso: true, click_share: 0.2, rank_busca: 1 },
      { semana_fim: "2026-09-27", termo: "whey", nosso: true, click_share: 0.05, rank_busca: 1 },
      {
        semana_fim: "2026-09-27",
        termo: "creatina pura",
        nosso: true,
        click_share: 0.5,
        rank_busca: 3,
      },
    ],
    [{ data: "2026-09-02", search_term: "creatina pura", cost: 400, sales_14d: 2000 }],
    AMZ_DE,
    AMZ_ATE,
  ),
  horas: vendasPorHora(
    [
      { data: "2026-09-06", hora: 21, venda: 900, pedidos: 9 },
      { data: "2026-09-07", hora: 9, venda: 100, pedidos: 1 },
    ],
    AMZ_DE,
    AMZ_ATE,
  ),
  lances: {
    keywords: classificaLances(
      alvosKeywords(
        [
          {
            data: "2026-09-02",
            campaign_name: "SP Creatina",
            keyword: "creatina 1kg",
            match_type: "EXACT",
            cost: 100,
            clicks: 100,
            purchases_14d: 10,
            sales_14d: 1000,
          },
          {
            data: "2026-09-02",
            campaign_name: "SP Whey",
            keyword: "whey protein",
            match_type: "BROAD",
            cost: 300,
            clicks: 150,
            purchases_14d: 2,
            sales_14d: 600,
          },
        ],
        AMZ_DE,
        AMZ_ATE,
      ),
    ),
    sd: classificaLances(alvosSd([], AMZ_DE, AMZ_ATE)),
  },
  erros: { brand: "timeout" },
};

// As telas chamam server functions via useServerFn. Aqui elas devolvem dados fixos,
// para testar a renderização sem banco.
const fixtures: Record<string, unknown> = {
  amazon: amazonFixture,
  media: {
    amazonNtb: novosParaMarca(
      [
        {
          data: "2026-09-02",
          campaign_id: "1",
          campaign_name: "SB Marca Soldiers",
          cost: 200,
          sales: 1000,
          ntb_sales: 600,
          ntb_purchases: 8,
        },
      ],
      [],
      "2026-09-01",
      "2026-09-30",
    ),
    tipos: [
      {
        data: "2026-09-01",
        tipo: "Meta",
        investimento: 100,
        receita: 400,
        impressoes: 10000,
        cliques: 200,
        unidades: 10,
      },
      {
        data: "2026-09-02",
        tipo: "Google",
        investimento: 50,
        receita: 150,
        impressoes: 5000,
        cliques: 100,
        unidades: 4,
      },
    ],
    funil: [
      {
        data: "2026-09-01",
        canal: "Site",
        invest: 150,
        receita_ads: 550,
        impressoes: 15000,
        cliques: 300,
        conversoes: 12,
        base_conversao: "pedidos",
      },
    ],
  },
  affiliate: {
    dia: [
      {
        data: "2026-09-01",
        pedidos: 5,
        pedidos_recusados: 1,
        venda: 1000,
        venda_aprovada: 800,
        venda_pendente: 150,
        venda_recusada: 50,
        comissao: 80,
        taxa_awin: 20,
      },
    ],
    pub: [
      {
        publisher_id: 1,
        publisher: "Blog Fitness",
        pedidos: 5,
        venda: 1000,
        comissao: 80,
        taxa_awin: 20,
      },
    ],
    canal: [{ data: "2026-09-01", canal: "Site", rec: 1000, inv: 100 }],
  },
  crm: {
    meses: [
      {
        mes: "2026-09-01",
        clientes: 100,
        novos: 60,
        recorrentes: 40,
        receita: 20000,
        pedidos: 120,
        gerado_em: "2026-10-01",
      },
    ],
    rfm: [
      {
        segmento: "Campeões",
        clientes: 10,
        receita: 5000,
        ticket_medio: 250,
        recencia_media: 12,
        frequencia_media: 4.2,
      },
    ],
    acoes: [
      {
        acao: "recompra",
        canal: "Site",
        clientes: 30,
        valor_esperado: 3000,
        valor_historico: 9000,
      },
    ],
    ltv: [],
    origem: [
      {
        canal_entrada: "Site",
        clientes: 80,
        ltv_medio: 400,
        pct_recompra: 35,
        pedidos: 160,
        receita: 32000,
      },
    ],
    cohort: [
      { safra: "2026-08-01", mes_offset: 1, clientes_safra: 50, clientes: 10, receita: 2000 },
    ],
  },
  health: {
    fontes: [
      { fonte: "Meta Ads", ultimoDado: "2026-01-01", carregadoEm: "2026-01-02", erro: null },
      {
        fonte: "Pedidos: Shopify",
        ultimoDado: new Date().toISOString().slice(0, 10),
        carregadoEm: null,
        erro: null,
      },
    ],
    filas: [
      {
        fila: "Shopee: pedidos",
        linhas: 3,
        porStatus: { ok: 2, erro: 1 },
        maxTentativas: 4,
        ultimoErro: "timeout",
        atualizado: "2026-10-02",
        erro: null,
      },
    ],
    logs: [
      {
        log: "Shopee",
        execucoes: 50,
        comErro: 2,
        ultimaExecucao: "2026-10-02",
        ultimoErro: "429",
        erro: null,
      },
    ],
    problemas: [
      {
        canal: "Shopify",
        problema: "pedido sem custo",
        severidade: "alta",
        dias_aberto: 5,
        pedido: "1001",
        valor: 199,
        data: "2026-09-28",
      },
    ],
    afiliadoMl: [],
    tokens: [
      {
        integracao: "TikTok Shop",
        conta: "shop1",
        expiraEm: "2026-09-01",
        atualizadoEm: "2026-08-25",
        dias: -30,
        semRenovar: 38,
        nivel: "expirado",
      },
    ],
    tokensErro: null,
  },
  alertas: {
    estoque: [
      {
        sku: "CREA300",
        title: "Creatina 300g",
        estoque: 120,
        cobertura_dias: 5,
        alerta: "ruptura",
        media_diaria: 24,
      },
    ],
    problemasDados: 3,
    amazon: [
      {
        tipo: "problema",
        tag: "Amazon FBA",
        tom: "warn",
        texto: "2 ASIN(s) com venda e menos de 14 dias de estoque no FBA.",
      },
      {
        tipo: "oportunidade",
        tag: "Amazon busca",
        tom: "primary",
        texto: "1 termo(s) perderam espaço orgânico e não têm anúncio.",
      },
    ],
    buybox: { perdendo_concorrente: 2, suprimida: 1, em_risco: 4 },
    acoes: [
      { acao: "recompra", clientes: 30, valor_esperado: 3000 },
      { acao: "aguardar", clientes: 500, valor_esperado: 0 },
    ],
    skusEmAlta: [
      { sku: "WHEY900", produto: "Whey 900g", atual: 9000, anterior: 6000, variacao: 50 },
    ],
  },
  hoje: {
    referencia: "2026-10-02",
    videosEscalar: [
      {
        video_id: "v1",
        criador: "joao.fit",
        titulo: "Creatina do jeito certo",
        produto: "Creatina 300g",
        views: 80000,
        gmv: 9200,
        pedidos: 102,
        gpm: 115,
        vsMediana: 3.2,
      },
    ],
    emAlta: [{ criador: "ana.treina", atual: 6400, anterior: 2100, variacao: 204.8, videos: 5 }],
    reativar: [{ criador: "caio.run", atual: 0, anterior: 18000, variacao: -100, videos: 12 }],
    semVenda: [
      { nome: "Lia Souza", tiktok: "lia.souza", tier: "micro", custo: 1500, desde: "2026-08-01" },
    ],
    influenciadoresErro: null,
    mix30d: { gmv: 100000, video: 62000, live: 30000, card: 8000, pedidos: 900 },
  },
  tiktok: {
    economia: {
      pedidos: 120,
      receitaItens: 18000,
      descontoPlataforma: 900,
      descontoVendedor: 400,
      amostras: { pedidos: 6, custoProduto: 310 },
      liquidacao: { liquidados: 90, pctLiquidado: 75, emAbertoValor: 4500, prazoMedianoDias: 18 },
      liquidado: {
        repasse: 11000,
        cmv: 5200,
        contribuicao: 5800,
        margemPct: 52.7,
        custos: [
          { chave: "comissao_plataforma", label: "Comissão TikTok", valor: 1300 },
          { chave: "comissao_afiliado_ads", label: "Comissão de afiliado (anúncios)", valor: 240 },
        ],
      },
      itensSemCusto: 3,
      skus: [
        {
          sku: "CREA300",
          produto: "Creatina 300g",
          unidades: 80,
          receita: 7200,
          repasse: 5900,
          cmv: 3040,
          contribuicao: 2860,
        },
      ],
    },
    devolucoes: [{ motivo: "Produto danificado", devolucoes: 4, valor: 360 }],
    listings: {
      anuncios: 12,
      comProblema: 1,
      semEstoque: 1,
      foraDeVenda: 0,
      lista: [
        { product_id: "1", titulo: "Whey 900g", problemas: ["1 SKU sem estoque"], health: 70 },
      ],
    },
  },
};
let current = "media";

// Recharts usa ResizeObserver, que o jsdom não tem.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

vi.mock("@tanstack/react-start", async (orig) => ({
  ...(await orig<typeof import("@tanstack/react-start")>()),
  useServerFn: () => async () => fixtures[current],
}));

// Link precisa de um router montado; para o teste basta um <a>.
vi.mock("@tanstack/react-router", async (orig) => ({
  ...(await orig<typeof import("@tanstack/react-router")>()),
  Link: ({ children, className }: { children: ReactNode; className?: string }) => (
    <a className={className}>{children}</a>
  ),
}));

function wrap(node: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{node}</QueryClientProvider>);
}

describe("telas novas renderizam com dados", () => {
  it("Media", async () => {
    current = "media";
    const { Route } = await import("@/routes/media");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("Por tipo de campanha")).toBeTruthy();
    expect(screen.getByText("Funil por canal de venda")).toBeTruthy();
    expect(screen.getAllByText("3,67x").length).toBeGreaterThan(0); // ROAS mídia = 550 / 150
    expect(screen.getByText("Amazon Ads: clientes novos para a marca")).toBeTruthy();
    expect(screen.getAllByText("60%").length).toBeGreaterThan(0); // 600 de 1000 de clientes novos
  });

  it("Affiliate", async () => {
    current = "affiliate";
    const { Route } = await import("@/routes/affiliate");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("Publishers Awin")).toBeTruthy();
    expect(screen.getByText("Blog Fitness")).toBeTruthy();
  });

  it("CRM / Growth", async () => {
    current = "crm";
    const { Route } = await import("@/routes/crm");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("Segmentos RFM")).toBeTruthy();
    expect(screen.getByText("Campeões")).toBeTruthy();
    expect(screen.getByText("20%")).toBeTruthy(); // cohort: 10 de 50 voltaram em M1
  });

  it("Data Health", async () => {
    current = "health";
    const { Route } = await import("@/routes/data-health");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("Frescor por fonte")).toBeTruthy();
    expect(screen.getByText("Atrasado")).toBeTruthy(); // Meta Ads parado desde janeiro
    expect(screen.getByText("Em dia")).toBeTruthy();
    expect(screen.getByText("pedido sem custo")).toBeTruthy();
  });

  it("Command Center: problemas e oportunidades", async () => {
    current = "alertas";
    const { Alertas } = await import("@/components/alertas");
    wrap(<Alertas />);
    expect(await screen.findByText("Creatina 300g")).toBeTruthy();
    expect(screen.getByText("Whey 900g")).toBeTruthy();
    expect(screen.getByText("Recompra")).toBeTruthy();
    expect(screen.queryByText("Aguardar")).toBeNull(); // "aguardar" não é oportunidade
    expect(screen.getByText("Amazon FBA")).toBeTruthy();
    expect(screen.getByText("Amazon busca")).toBeTruthy();
  });

  it("Affiliate Copilot: o que fazer hoje", async () => {
    current = "hoje";
    const { Route } = await import("@/routes/afiliados.hoje");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("Hoje existem 4 ações sugeridas")).toBeTruthy();
    expect(screen.getByText("@joao.fit")).toBeTruthy();
    expect(screen.getByText("+205%")).toBeTruthy();
    expect(screen.getByText("Lia Souza")).toBeTruthy();
    expect(screen.getByText("62%")).toBeTruthy(); // vídeo = 62% das vendas atribuídas
  });

  it("TikTok Shop: economia", async () => {
    current = "tiktok";
    const { Route } = await import("@/routes/marketplace_.tiktok");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("Para onde vai o dinheiro (pedidos liquidados)")).toBeTruthy();
    expect(screen.getByText("75%")).toBeTruthy();
    expect(screen.getByText("Creatina 300g")).toBeTruthy();
    expect(screen.getByText("Produto danificado")).toBeTruthy();
    expect(screen.getByText("Media × Affiliate")).toBeTruthy();
  });

  it("Amazon: ASIN 360°, termos e reposição", async () => {
    current = "amazon";
    const { Route } = await import("@/routes/marketplace_.amazon");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("ASIN 360°")).toBeTruthy();
    expect(screen.getByText("concorrente com a Buy Box")).toBeTruthy();
    expect(screen.getByText("Reposição FBA")).toBeTruthy();
    expect(screen.getByText(/Não foi possível ler: Brand Analytics/)).toBeTruthy();
    expect(screen.getByText("TACoS")).toBeTruthy();

    fireEvent.click(screen.getByText("Ads"));
    expect(screen.getByText("pre treino barato")).toBeTruthy();
    expect(screen.getByText("creatina monohidratada")).toBeTruthy();
    expect(screen.getByText("creatina 1kg")).toBeTruthy(); // subir lance
    expect(screen.getByText("whey protein")).toBeTruthy(); // baixar lance

    fireEvent.click(screen.getByText("Busca"));
    expect(screen.getByText("perdeu")).toBeTruthy();
    expect(screen.getByText("Busca orgânica × Ads")).toBeTruthy();
    expect(screen.getAllByText("creatina pura").length).toBeGreaterThan(0); // domina e paga

    fireEvent.click(screen.getByText("Horários"));
    expect(screen.getByText("Melhores horários")).toBeTruthy();
    expect(screen.getByText("Dom 21h–22h")).toBeTruthy();
  });

  it("Data Health mostra token com renovação parada", async () => {
    current = "health";
    const { Route } = await import("@/routes/data-health");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("Expirado: renovação parou")).toBeTruthy();
  });
});
