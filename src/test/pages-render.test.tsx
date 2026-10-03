import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// As telas chamam server functions via useServerFn. Aqui elas devolvem dados fixos,
// para testar a renderização sem banco.
const fixtures: Record<string, unknown> = {
  media: {
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
});
