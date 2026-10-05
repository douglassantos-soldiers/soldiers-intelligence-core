import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Respostas fixas por server function (a chave é a própria função importada).
const fx = new Map<unknown, unknown>();
let sessao: { user: { email: string } } | null = null;

vi.mock("@tanstack/react-start", async (orig) => ({
  ...(await orig<typeof import("@tanstack/react-start")>()),
  useServerFn: (fn: unknown) => async () => fx.get(fn),
}));
vi.mock("@tanstack/react-router", async (orig) => ({
  ...(await orig<typeof import("@tanstack/react-router")>()),
  Link: ({ children, className }: { children: ReactNode; className?: string }) => (
    <a className={className}>{children}</a>
  ),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: sessao } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithOtp: async () => ({ error: null }),
    },
  },
}));

function wrap(node: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{node}</QueryClientProvider>);
}

describe("tela de subida de criativos", () => {
  beforeEach(() => {
    fx.clear();
  });

  it("sem login, pede para entrar", async () => {
    sessao = null;
    const { Route } = await import("@/routes/media_.meta_.criativos");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("Enviar link", {}, { timeout: 10000 })).toBeTruthy();
  }, 15000);

  it("logado: lista lotes e abre o acompanhamento com auditoria", async () => {
    sessao = { user: { email: "malu@soldiersnutrition.com.br" } };
    const fns = await import("@/lib/criativos.functions");
    fx.set(fns.getCriativosInicio, {
      email: "malu@soldiersnutrition.com.br",
      contas: ["act_123"],
      contasSemPermissao: [],
      lotes: [
        {
          id: "l1",
          nome: "Black Friday Creatina",
          conta: "act_123",
          status: "concluido_com_erros",
          criadoPor: "malu@soldiersnutrition.com.br",
          criadoEm: "2026-10-03T10:00:00Z",
          contagem: { enviado: 118, erro: 2 },
        },
      ],
      ctas: { SHOP_NOW: "Comprar agora" },
      limites: { maxItens: 300, imagemMB: 30, videoMB: 200 },
      executorConfigurado: false,
    });
    fx.set(fns.getLote, {
      lote: {
        id: "l1",
        nome: "Black Friday Creatina",
        conta: "act_123",
        pageId: "999",
        instagramUserId: "",
        linkPadrao: "",
        urlTagsPadrao: "",
        ctaPadrao: "SHOP_NOW",
        status: "concluido_com_erros",
        criadoPor: "malu@soldiersnutrition.com.br",
        confirmadoPor: "malu@soldiersnutrition.com.br",
        confirmadoEm: "2026-10-03T10:05:00Z",
      },
      itens: [
        {
          id: "i1",
          ordem: 0,
          arquivo: "c1.jpg",
          tipo: "imagem",
          nome: "BF_IMG_4x5_001",
          status: "enviado",
          avisos: [],
          erros: [],
          creativeId: "120000000001",
          tentativas: 1,
          ultimoErro: null,
        },
        {
          id: "i2",
          ordem: 1,
          arquivo: "v1.mp4",
          tipo: "video",
          nome: "BF_VID_9x16_002",
          status: "erro",
          avisos: [],
          erros: [],
          creativeId: null,
          tentativas: 8,
          ultimoErro: "Vídeo recusado",
        },
      ],
      auditoria: [
        {
          acao: "lote_confirmado",
          ator: "malu@soldiersnutrition.com.br",
          quando: "2026-10-03T10:05:00Z",
          detalhe: '{"total":120}',
        },
      ],
    });
    const { Route } = await import("@/routes/media_.meta_.criativos");
    const C = Route.options.component!;
    wrap(<C />);
    expect(await screen.findByText("Black Friday Creatina")).toBeTruthy();
    expect(screen.getByText(/O executor ainda não está configurado/)).toBeTruthy();
    expect(screen.getByText("Criar lote e escolher arquivos")).toBeTruthy();
    fireEvent.click(screen.getByText("Abrir"));
    expect(await screen.findByText("Reenviar os 1 com erro")).toBeTruthy();
    expect(screen.getByText("120000000001")).toBeTruthy();
    expect(screen.getByText("Vídeo recusado")).toBeTruthy();
    expect(screen.getByText("lote_confirmado")).toBeTruthy();
  });

  it("rascunho: adiciona arquivos, aplica a planilha e valida antes de subir", async () => {
    sessao = { user: { email: "malu@soldiersnutrition.com.br" } };
    const fns = await import("@/lib/criativos.functions");
    fx.set(fns.getCriativosInicio, {
      email: "malu@soldiersnutrition.com.br",
      contas: ["act_123"],
      contasSemPermissao: [],
      lotes: [
        {
          id: "l2",
          nome: "Lote teste",
          conta: "act_123",
          status: "rascunho",
          criadoPor: "malu",
          criadoEm: "2026-10-03T10:00:00Z",
          contagem: {},
        },
      ],
      ctas: { SHOP_NOW: "Comprar agora" },
      limites: { maxItens: 300, imagemMB: 30, videoMB: 200 },
      executorConfigurado: true,
    });
    fx.set(fns.getLote, {
      lote: {
        id: "l2",
        nome: "Lote teste",
        conta: "act_123",
        pageId: "999",
        instagramUserId: "",
        linkPadrao: "https://www.soldiersnutrition.com.br/",
        urlTagsPadrao: "utm_source=meta&utm_medium=paid&utm_campaign=bf",
        ctaPadrao: "SHOP_NOW",
        status: "rascunho",
        criadoPor: "malu",
        confirmadoPor: null,
        confirmadoEm: null,
      },
      itens: [],
      auditoria: [],
    });
    const { Route } = await import("@/routes/media_.meta_.criativos");
    const C = Route.options.component!;
    const { container } = wrap(<C />);
    fireEvent.click(await screen.findByText("Abrir"));
    await screen.findByText(/Arraste imagens e vídeos/);
    const input = container.querySelector('input[type="file"][multiple]') as HTMLInputElement;
    const arquivos = [
      new File([new Uint8Array([1, 2, 3])], "creatina.jpg", { type: "image/jpeg" }),
      new File([new Uint8Array([4, 5, 6])], "whey.png", { type: "image/png" }),
      new File([new Uint8Array([7])], "animado.gif", { type: "image/gif" }),
    ];
    fireEvent.change(input, { target: { files: arquivos } });
    expect(await screen.findByDisplayValue("LOTE-TESTE_IMG_LIVRE_001")).toBeTruthy();
    expect(screen.getByDisplayValue("LOTE-TESTE_IMG_LIVRE_002")).toBeTruthy();
    expect(screen.getByText(/1 arquivo\(s\) ignorado\(s\)/)).toBeTruthy();
    expect(screen.getAllByText(/sem texto principal/).length).toBe(2);

    const planilha = container.querySelector('input[accept=".csv,text/csv"]') as HTMLInputElement;
    const csv = new File(
      ["arquivo;nome;texto\ncreatina.jpg;BF_CREATINA_01;Creatina pura\n"],
      "copy.csv",
      { type: "text/csv" },
    );
    fireEvent.change(planilha, { target: { files: [csv] } });
    expect(await screen.findByDisplayValue("BF_CREATINA_01")).toBeTruthy();
    expect(screen.getByDisplayValue("Creatina pura")).toBeTruthy();
    expect(screen.getByText("Subir 2 arquivo(s) e salvar no lote")).toBeTruthy();
  });
});
