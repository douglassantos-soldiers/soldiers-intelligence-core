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
    const aba = (n: string | RegExp) => fireEvent.click(screen.getByRole("button", { name: n }));
    // abre em "Ações do dia" (playbooks), com mensagem para copiar
    expect(await screen.findByText("Ações sugeridas para hoje")).toBeTruthy();
    expect(screen.getAllByText("Subir para VIP").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Copiar mensagem" }).length).toBe(5);
    aba(/^Convidar para outro produto \(2\)$/);
    expect(screen.getByText("Vendeu R$ 2.000 em Whey e nada em Creatina.")).toBeTruthy();
    expect(screen.queryByText(/Recebeu Whey 900g/)).toBeNull();
    aba("Creators e notas");
    expect(screen.getByText("Creators por oportunidade (Creatina)")).toBeTruthy();
    expect(screen.getByText("Atleta Alfa")).toBeTruthy();
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
    expect(screen.getByText("Brief para creators: Creatina")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copiar brief" })).toBeTruthy();
    aba("Comissão");
    expect(screen.getByText("comissão maior compensa")).toBeTruthy();
    expect(screen.getByText("regra padrão (hipótese)")).toBeTruthy();
    expect(
      screen.getByText("+4 p.p. custam R$ 600 e sobram R$ 2.400 de contribuição."),
    ).toBeTruthy();
    aba("Direitos de uso");
    expect(screen.getByText("vence em 4 dia(s)")).toBeTruthy();
    expect(screen.getByText("Candidatos a Spark Ads")).toBeTruthy();
    expect(screen.getByText(/Solicitado: 1 · Ativo: 1/)).toBeTruthy();
    aba("Risco e concorrentes");
    expect(screen.getByText("desconto alto")).toBeTruthy();
    expect(screen.getByText("migrável")).toBeTruthy();
    aba("Qualidade do cliente");
    expect(screen.getByText("ALFA10")).toBeTruthy();
  });
});
