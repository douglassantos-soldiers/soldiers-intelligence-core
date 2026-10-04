import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { crmFixture } from "./crm-fixture";

vi.mock("@tanstack/react-start", async (orig) => ({
  ...(await orig<typeof import("@tanstack/react-start")>()),
  useServerFn: () => async () => crmFixture(),
}));
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

describe("tela CRM 2.0", () => {
  it("mostra fila, previsão, reposição, e-mail, leads, ações e Klaviyo", async () => {
    const { Route } = await import("@/routes/crm_.acao");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("A previsão acerta?")).toBeTruthy();
    expect(screen.getByText("costuma voltar a cada 35 dias e está 6 dias atrasado")).toBeTruthy();
    expect(screen.getAllByText("otimista").length).toBeGreaterThan(0);
    expect(screen.queryByText(/c_0000aguarda/)).toBeNull();
    expect(screen.getByText("Falhando")).toBeTruthy();

    fireEvent.click(screen.getByText("Reposição por produto"));
    expect(screen.getByText("dia 33")).toBeTruthy();

    fireEvent.click(screen.getByText("E-mail (RD)"));
    expect(screen.getByText("Semana da Creatina")).toBeTruthy();
    expect(screen.getAllByText("spam acima do limite")[0]).toBeTruthy();
    expect(screen.getByText("pos-compra")).toBeTruthy();

    fireEvent.click(screen.getByText("Leads"));
    expect(screen.getByText("Landing sorteio")).toBeTruthy();

    fireEvent.click(screen.getByText("Ações e Klaviyo"));
    expect(screen.getByText("Régua de reposição da creatina")).toBeTruthy();
    expect(screen.getByText("em andamento · atrasada")).toBeTruthy();
    expect(screen.getAllByText("token inválido").length).toBeGreaterThan(0);
  });
});
