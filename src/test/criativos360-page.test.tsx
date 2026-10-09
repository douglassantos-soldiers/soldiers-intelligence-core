import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { criativosFixture } from "./criativos360-fixture";

vi.mock("@tanstack/react-start", async (orig) => ({
  ...(await orig<typeof import("@tanstack/react-start")>()),
  useServerFn: () => async () => criativosFixture(),
}));
vi.mock("@tanstack/react-router", async (orig) => ({
  ...(await orig<typeof import("@tanstack/react-router")>()),
  Link: ({ children, className }: { children: ReactNode; className?: string }) => (
    <a className={className}>{children}</a>
  ),
}));

describe("tela Central de criativos", () => {
  it("placar e abas", async () => {
    const { Route } = await import("@/routes/media_.criativos");
    const C = Route.options.component!;
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <C />
      </QueryClientProvider>,
    );
    expect(await screen.findByText("Placar dos criativos (Meta)")).toBeTruthy();
    expect(screen.getByText("BF_VID_9x16_001 creatina @atleta.alfa")).toBeTruthy();
    const aba = (n: string) => fireEvent.click(screen.getByRole("button", { name: n }));
    aba("O que funciona");
    expect(screen.getByText("Por formato")).toBeTruthy();
    aba("DNA do conteúdo");
    expect(screen.getByText("Ângulo nos vídeos de creators")).toBeTruthy();
    expect(screen.getByText("Vida útil do vídeo")).toBeTruthy();
    expect(screen.getAllByText("Impacto").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ciência / pureza").length).toBeGreaterThan(0);
    expect(screen.getAllByText("@atleta.alfa").length).toBeGreaterThan(0);
    expect(screen.getByText("Padrões vencedores por produto (vídeos de creators)")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Anúncios (Meta)" }));
    expect(screen.getByText("Ângulo nos anúncios do Meta")).toBeTruthy();
    expect(screen.getByText("Padrões vencedores por produto (anúncios do Meta)")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Formato" }));
    expect(screen.getByText("Formato nos anúncios do Meta")).toBeTruthy();
    aba("Renovar e cortar");
    expect(screen.getByText("gastou sem nenhuma compra")).toBeTruthy();
    aba("Outros canais");
    expect(screen.getByText("Banner creatina")).toBeTruthy();
    aba("Biblioteca");
    expect(screen.getByText("antigo.png")).toBeTruthy();
    expect(screen.getByText("tiktok: erro")).toBeTruthy();
  });
});
