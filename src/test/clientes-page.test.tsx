import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { crmBaseFixture, clienteAcaoFixture, atribuicaoFixture } from "./clientes-fixture";

let atual: () => unknown = () => null;
vi.mock("@tanstack/react-start", async (orig) => ({
  ...(await orig<typeof import("@tanstack/react-start")>()),
  useServerFn: () => async () => atual(),
}));
vi.mock("@tanstack/react-router", async (orig) => ({
  ...(await orig<typeof import("@tanstack/react-router")>()),
  Link: ({ children, className }: { children: ReactNode; className?: string }) => (
    <a className={className}>{children}</a>
  ),
}));

// Recharts usa ResizeObserver, que o jsdom não tem.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

function wrap(node: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{node}</QueryClientProvider>);
}

describe("CRM: base, cliente e atribuição", () => {
  it("Estado da base", async () => {
    atual = crmBaseFixture;
    const { Route } = await import("@/routes/crm_.base");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("Estado do cliente")).toBeTruthy();
    expect(screen.getByText("Adormecido")).toBeTruthy();
    expect(screen.getByText("3 ou mais")).toBeTruthy();
    expect(screen.getByText("Mudanças de estado (30 dias)")).toBeTruthy();
    expect(screen.getByText("E-mail liberado")).toBeTruthy();
  });

  it("Customer 360: estado, próxima ação e afinidade", async () => {
    atual = clienteAcaoFixture;
    const { ClienteAcao } = await import("@/components/cliente-acao");
    wrap(<ClienteAcao chave="c_9f2a71b0e4d3" />);
    expect(await screen.findByText("Recompra urgente")).toBeTruthy();
    expect(screen.getByText("E-mail (RD / Klaviyo)")).toBeTruthy();
    expect(screen.getByText("aguardando aprovação (Fase 3)")).toBeTruthy();
    expect(screen.getByText("Glutamina 300g")).toBeTruthy();
  });

  it("Attribution", async () => {
    atual = atribuicaoFixture;
    const { Route } = await import("@/routes/attribution");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("Por canal de venda")).toBeTruthy();
    expect(screen.getByText("fontes se sobrepõem")).toBeTruthy();
    expect(screen.getByText("vigente")).toBeTruthy();
    expect(screen.getByText("não medido")).toBeTruthy();
    expect(
      screen.getByText("Plataforma × venda (Google, Meta, TikTok e marketplaces)"),
    ).toBeTruthy();
    expect(screen.getByText("sem UTM no site")).toBeTruthy();
    expect(screen.getByText("quase toda a venda")).toBeTruthy();
    expect(screen.getByText("Site por fonte de UTM")).toBeTruthy();
    expect(screen.getByText("Google orgânico")).toBeTruthy();
  });
});
