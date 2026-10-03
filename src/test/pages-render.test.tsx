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
});
