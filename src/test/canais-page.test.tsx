import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  tiktokFixture,
  meliFixture,
  afiliadosFixture,
  midiaSkuFixture,
  devolucoesFixture,
} from "./canais-fixture";

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
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

function wrap(node: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{node}</QueryClientProvider>);
}
async function tela(rota: string) {
  const { Route } = (await import(`../routes/${rota}.tsx`)) as {
    Route: { options: { component: () => ReactNode } };
  };
  const C = Route.options.component;
  wrap(<C />);
}

describe("telas novas de canais", () => {
  it("TikTok Ads", async () => {
    atual = tiktokFixture;
    await tela("media_.tiktok");
    // painel visual (aba padrão): sem impressões/cliques, pedidos como unidade
    expect(await screen.findByText("Desempenho por campanha")).toBeTruthy();
    expect(screen.getAllByText("Pedidos").length).toBeGreaterThan(0);
    expect(screen.queryByText("Impressões")).toBeNull();
    expect(screen.queryByText("Pausadas")).toBeNull(); // TikTok não traz status por campanha
    fireEvent.click(screen.getByRole("button", { name: "Campanhas" }));
    expect(screen.getByText("GMV MAX | LOJA")).toBeTruthy();
    expect(screen.getByText("gasto alto · ROAS caiu")).toBeTruthy();
    fireEvent.click(screen.getByText("Produtos e estoque"));
    expect(screen.getByText("4 dias")).toBeTruthy();
    fireEvent.click(screen.getByText("Vídeos"));
    expect(screen.getByText("v_talk_02")).toBeTruthy();
    expect(screen.getByText("cortar")).toBeTruthy();
  });

  it("Meli DSP", async () => {
    atual = meliFixture;
    await tela("media_.meli-dsp");
    // painel visual (aba padrão): abas por etapa do funil, line items ao abrir a campanha
    expect(await screen.findByText("Desempenho por campanha")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Todas as etapas" }).length).toBeGreaterThan(0);
    expect(screen.getByText("CONVERSAO | CREATINA")).toBeTruthy();
    fireEvent.click(screen.getByText("Verba por etapa"));
    expect(screen.getByText("Verba por etapa do funil × divisão 70/22/8")).toBeTruthy();
    expect(screen.getByText("-17 p.p.")).toBeTruthy();
    fireEvent.click(screen.getByText("Criativos e vídeo"));
    expect(screen.getByText("Vídeo Creatina 15s")).toBeTruthy();
  });

  it("Creators 360", async () => {
    atual = afiliadosFixture;
    await tela("affiliate_.creators");
    expect(await screen.findByText("Atleta Alfa")).toBeTruthy();
    expect(screen.getByText("@atleta.alfa")).toBeTruthy();
    expect(screen.getAllByText("esfriando").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText("Por canal"));
    expect(screen.getByText("12% / 31%")).toBeTruthy();
    fireEvent.click(screen.getByText("Produtos"));
    expect(screen.getByText("Produtos que dependem de afiliado")).toBeTruthy();
    expect(screen.getAllByText("75%").length).toBeGreaterThan(0);
  });

  it("Mídia por produto", async () => {
    atual = midiaSkuFixture;
    await tela("media_.produtos");
    expect(await screen.findByText("Ritmo por canal")).toBeTruthy();
    expect(screen.getAllByText("estoque curto com mídia").length).toBeGreaterThan(0);
    expect(screen.getByText("sem custo")).toBeTruthy();
    fireEvent.click(screen.getByText("Espaço para mídia (1)"));
    expect(screen.getByText("Glutamina 300g")).toBeTruthy();
    expect(screen.queryByText("Whey 900g")).toBeNull();
  });

  it("Devoluções e ranking", async () => {
    atual = devolucoesFixture;
    await tela("marketplace_.devolucoes");
    expect(await screen.findByText("Por canal × período anterior")).toBeTruthy();
    expect(screen.getByText("+4,0 p.p.")).toBeTruthy();
    expect(screen.getByText("Produto danificado")).toBeTruthy();
    fireEvent.click(screen.getByText("Ranking Mercado Livre"));
    expect(screen.getAllByText("Soldiers Nutrition").length).toBeGreaterThan(0);
    expect(screen.getByText("Marca Dois")).toBeTruthy();
  });
});
