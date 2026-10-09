import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { fechamentoFixture } from "./fechamento-fixture";

vi.mock("@tanstack/react-start", async (orig) => ({
  ...(await orig<typeof import("@tanstack/react-start")>()),
  useServerFn: () => async () => fechamentoFixture(),
}));
vi.mock("@tanstack/react-router", async (orig) => ({
  ...(await orig<typeof import("@tanstack/react-router")>()),
  Link: ({ children, className }: { children: ReactNode; className?: string }) => (
    <a className={className}>{children}</a>
  ),
}));

describe("tela Fechamento de comissões", () => {
  it("abre na conferência e mostra cupons e creators", async () => {
    const { Route } = await import("@/routes/affiliate_.fechamento");
    const C = Route.options.component!;
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <C />
      </QueryClientProvider>,
    );
    expect(await screen.findByText("Totais: plataforma × planilha")).toBeTruthy();
    expect(screen.getByText("só na planilha")).toBeTruthy();
    expect(screen.getByText("ANTIGO")).toBeTruthy();
    const aba = (n: string) => fireEvent.click(screen.getByRole("button", { name: n }));
    aba("Por cupom");
    expect(screen.getByText("Cupons em set/26")).toBeTruthy();
    expect(screen.getByText("GAMA")).toBeTruthy();
    aba("Por creator");
    expect(screen.getByText("@beta.treino")).toBeTruthy();
    aba("Para pagamento");
    expect(screen.getByText("Lista para pagamento (2026-09)")).toBeTruthy();
    expect(screen.getAllByText("pronto")).toHaveLength(3);
    expect(screen.getByText("diferente da planilha ou fora dela: SOUP")).toBeTruthy();
  });
});
