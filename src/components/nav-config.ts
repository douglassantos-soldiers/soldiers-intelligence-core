// Menu lateral organizado pelos módulos do Plano Mestre (Media e Affiliate separados; Commerce = site + marketplaces).
// Nomes de módulo em inglês, como no Plano; telas em português. Só o menu muda: nenhuma rota foi alterada.
import {
  LayoutGrid,
  Users,
  Megaphone,
  Handshake,
  Store,
  HeartHandshake,
  Brain,
  Activity,
  BookOpen,
} from "lucide-react";

export type ItemNav = {
  to: string;
  label: string;
  params?: Record<string, string>;
  /** Só fica ativo na rota exata (visões gerais, para não acender junto com as telas filhas). */
  exato?: boolean;
  emBreve?: boolean;
};
export type GrupoNav = { id: string; title: string; icon: typeof LayoutGrid; items: ItemNav[] };

export const TOPO: ItemNav & { icon: typeof LayoutGrid } = {
  to: "/",
  label: "Command Center",
  icon: LayoutGrid,
  exato: true,
};

export const GRUPOS: GrupoNav[] = [
  {
    id: "core",
    title: "Core 360",
    icon: Users,
    items: [
      { to: "/clientes", label: "Clientes" },
      { to: "/produtos", label: "Produtos" },
      { to: "/pedidos", label: "Pedidos" },
    ],
  },
  {
    id: "media",
    title: "Media",
    icon: Megaphone,
    items: [
      { to: "/media", label: "Visão geral", exato: true },
      { to: "/media/meta", label: "Meta" },
      { to: "/media/google", label: "Google" },
      { to: "/media/tiktok", label: "TikTok Ads" },
      { to: "/media/meli-dsp", label: "Meli DSP" },
      { to: "/media/criativos", label: "Criativos" },
      { to: "/media/produtos", label: "Mídia por produto" },
    ],
  },
  {
    id: "affiliate",
    title: "Affiliate",
    icon: Handshake,
    items: [
      { to: "/affiliate", label: "Visão geral", exato: true },
      { to: "/afiliados/hoje", label: "Copilot de hoje" },
      { to: "/affiliate/creators", label: "Creators 360" },
      { to: "/affiliate/os", label: "Affiliate OS" },
      { to: "/affiliate/fechamento", label: "Fechamento" },
    ],
  },
  {
    id: "commerce",
    title: "Commerce",
    icon: Store,
    items: [
      { to: "/commerce", label: "Site (Shopify)" },
      { to: "/marketplace", label: "Marketplaces", exato: true },
      { to: "/marketplace/mercado-livre", label: "Mercado Livre" },
      { to: "/marketplace/amazon", label: "Amazon" },
      { to: "/marketplace/shopee", label: "Shopee" },
      { to: "/marketplace/tiktok", label: "TikTok Shop" },
      { to: "/marketplace/devolucoes", label: "Devoluções e ranking" },
    ],
  },
  {
    id: "crm",
    title: "CRM",
    icon: HeartHandshake,
    items: [
      { to: "/crm", label: "Visão geral", exato: true },
      { to: "/crm/acao", label: "Ação" },
      { to: "/crm/base", label: "Estado da base" },
    ],
  },
  {
    id: "inteligencia",
    title: "Inteligência",
    icon: Brain,
    items: [
      { to: "/intelligence", label: "Intelligence" },
      { to: "/attribution", label: "Attribution" },
      { to: "/em-breve/$modulo", params: { modulo: "profit" }, label: "Profit", emBreve: true },
      { to: "/em-breve/$modulo", params: { modulo: "ai" }, label: "AI", emBreve: true },
    ],
  },
];

export const RODAPE: (ItemNav & { icon: typeof LayoutGrid })[] = [
  { to: "/data-health", label: "Data Health", icon: Activity },
  { to: "/glossario", label: "Glossário", icon: BookOpen },
];

/** Caminho real do item (com params preenchidos). */
export const caminho = (it: ItemNav) =>
  Object.entries(it.params ?? {}).reduce((s, [k, v]) => s.replace(`$${k}`, v), it.to);

/** Grupo da rota atual: o do item com o caminho mais longo que casa (exato ou como prefixo de pasta). */
export function grupoDaRota(pathname: string): string | null {
  const p = pathname.replace(/\/+$/, "") || "/";
  let melhor: { id: string; len: number } | null = null;
  for (const g of GRUPOS)
    for (const it of g.items) {
      const c = caminho(it);
      if ((p === c || p.startsWith(c + "/")) && (!melhor || c.length > melhor.len))
        melhor = { id: g.id, len: c.length };
    }
  return melhor?.id ?? null;
}
