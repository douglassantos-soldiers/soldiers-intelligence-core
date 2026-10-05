import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { inteligenciaFixture } from "./inteligencia-fixture";

vi.mock("@tanstack/react-start", async (orig) => ({
  ...(await orig<typeof import("@tanstack/react-start")>()),
  useServerFn: () => async () => inteligenciaFixture(),
}));
vi.mock("@tanstack/react-router", async (orig) => ({
  ...(await orig<typeof import("@tanstack/react-router")>()),
  Link: ({ children, className }: { children: ReactNode; className?: string }) => (
    <a className={className}>{children}</a>
  ),
}));

describe("tela Intelligence", () => {
  it("canais, matriz, estoque e experimentos", async () => {
    const { Route } = await import("@/routes/intelligence");
    const C = Route.options.component!;
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <C />
      </QueryClientProvider>,
    );
    expect(await screen.findByText("Canais lado a lado")).toBeTruthy();
    expect(screen.getByText("Unit economics por pedido")).toBeTruthy();
    fireEvent.click(screen.getByText("Produto × canal"));
    expect(screen.getByText("dá prejuízo em Site; lucro vem de Mercado Livre")).toBeTruthy();
    fireEvent.click(screen.getByText("Demanda e estoque"));
    expect(screen.getByText("Glutamina 300g")).toBeTruthy();
    expect(screen.getByText("632")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Experimentos" }));
    expect(screen.getByText("Lembrete de reposição da creatina")).toBeTruthy();
    expect(screen.getByText("vencedor")).toBeTruthy();
    expect(screen.getByText("sem grupo de controle")).toBeTruthy();
  });
});
