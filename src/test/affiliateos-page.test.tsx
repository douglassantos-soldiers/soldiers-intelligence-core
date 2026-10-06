import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { affiliateOSFixture } from "./affiliateos-fixture";

vi.mock("@tanstack/react-start", async (orig) => ({
  ...(await orig<typeof import("@tanstack/react-start")>()),
  useServerFn: () => async () => affiliateOSFixture(),
}));
vi.mock("@tanstack/react-router", async (orig) => ({
  ...(await orig<typeof import("@tanstack/react-router")>()),
  Link: ({ children, className }: { children: ReactNode; className?: string }) => (
    <a className={className}>{children}</a>
  ),
}));

describe("tela Affiliate OS", () => {
  it("todas as abas", async () => {
    const { Route } = await import("@/routes/affiliate_.os");
    const C = Route.options.component!;
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <C />
      </QueryClientProvider>,
    );
    expect(await screen.findByText("Creators por oportunidade (Creatina)")).toBeTruthy();
    expect(screen.getByText("Atleta Alfa")).toBeTruthy();
    const aba = (n: string) => fireEvent.click(screen.getByRole("button", { name: n }));
    // conta de loja fica numa aba separada da lista de creators
    expect(screen.queryByText("@fit.gama")).toBeNull();
    aba("Contas de loja (1)");
    expect(screen.getByText("provável conta de loja")).toBeTruthy();
    aba("Funil");
    expect(screen.getByText("Funil do creator")).toBeTruthy();
    expect(screen.getByText("Retenção por coorte (creators que voltam a postar)")).toBeTruthy();
    aba("Amostras");
    expect(screen.getByText("ROI por amostra")).toBeTruthy();
    expect(screen.getByText("Funil de amostras por semana de entrega")).toBeTruthy();
    expect(screen.getByText(/Cancelado: 1/)).toBeTruthy();
    expect(screen.getAllByText("publicou sem venda").length).toBeGreaterThan(0);
    aba("Outreach");
    expect(screen.getByText("Creatina Q4")).toBeTruthy();
    aba("Conteúdo (DNA)");
    expect(screen.getByText("O que vende para cada creator em Creatina")).toBeTruthy();
    expect(screen.getAllByText(/^Creatina: /).length).toBeGreaterThan(0);
    aba("Comissão");
    expect(screen.getByText("comissão maior compensa")).toBeTruthy();
    aba("Risco e concorrentes");
    expect(screen.getByText("desconto alto")).toBeTruthy();
    expect(screen.getByText("migrável")).toBeTruthy();
    aba("Qualidade do cliente");
    expect(screen.getByText("ALFA10")).toBeTruthy();
  });
});
