import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutGrid, Users, Package, ShoppingCart, Megaphone, Handshake, Store, Boxes, HeartHandshake,
  Brain, GitBranch, Coins, Bot, Sun, Moon, Menu, X, Activity, BookOpen, Sparkles, Receipt,
} from "lucide-react";

type Item = { to: string; label: string; icon: typeof LayoutGrid; params?: Record<string, string> };
const GROUPS: { title?: string; items: Item[] }[] = [
  { items: [{ to: "/", label: "Command Center", icon: LayoutGrid }] },
  {
    title: "Core 360",
    items: [
      { to: "/clientes", label: "Customer 360", icon: Users },
      { to: "/produtos", label: "Product 360", icon: Package },
      { to: "/pedidos", label: "Orders", icon: ShoppingCart },
    ],
  },
  {
    title: "Canais",
    items: [
      { to: "/media", label: "Media", icon: Megaphone },
      { to: "/media/google", label: "Google Ads", icon: Megaphone },
      { to: "/media/meta", label: "Meta Ads", icon: Megaphone },
      { to: "/media/meta/criativos", label: "Meta: subir criativos", icon: Megaphone },
      { to: "/affiliate", label: "Affiliate", icon: Handshake },
      { to: "/afiliados/hoje", label: "Affiliate: hoje", icon: Sparkles },
      { to: "/commerce", label: "Commerce", icon: Store },
      { to: "/marketplace", label: "Marketplace", icon: Boxes },
      { to: "/marketplace/tiktok", label: "TikTok Shop: economia", icon: Receipt },
      { to: "/marketplace/amazon", label: "Amazon: ASIN 360°", icon: Boxes },
      { to: "/marketplace/mercado-livre", label: "Mercado Livre: economia", icon: Receipt },
      { to: "/marketplace/shopee", label: "Shopee: economia", icon: Receipt },
      { to: "/crm", label: "CRM / Growth", icon: HeartHandshake },
      { to: "/crm/acao", label: "CRM 2.0: ação", icon: HeartHandshake },
    ],
  },
  {
    title: "Plataforma",
    items: [
      { to: "/data-health", label: "Data Health", icon: Activity },
      { to: "/glossario", label: "Glossário de métricas", icon: BookOpen },
    ],
  },
  {
    title: "Em breve",
    items: [
      { to: "/em-breve/$modulo", params: { modulo: "intelligence" }, label: "Intelligence", icon: Brain },
      { to: "/em-breve/$modulo", params: { modulo: "attribution" }, label: "Attribution", icon: GitBranch },
      { to: "/em-breve/$modulo", params: { modulo: "profit" }, label: "Profit", icon: Coins },
      { to: "/em-breve/$modulo", params: { modulo: "ai" }, label: "AI", icon: Bot },
    ],
  },
];

function ThemeToggle() {
  const [light, setLight] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("sp-theme") === "light";
    setLight(saved);
    document.documentElement.classList.toggle("light", saved);
  }, []);
  return (
    <button
      aria-label="Alternar tema"
      onClick={() => {
        const next = !light;
        setLight(next);
        document.documentElement.classList.toggle("light", next);
        localStorage.setItem("sp-theme", next ? "light" : "dark");
      }}
      className="rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
    >
      {light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
      {GROUPS.map((g, i) => (
        <div key={i}>
          {g.title && (
            <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">
              {g.title}
            </div>
          )}
          <div className="space-y-0.5">
            {g.items.map((it) => (
              <Link
                key={it.label}
                to={it.to}
                params={it.params as never}
                onClick={onNavigate}
                activeOptions={{ exact: it.to === "/" }}
                className="group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                activeProps={{ className: "!bg-sidebar-accent !text-sidebar-foreground font-medium" }}
              >
                {({ isActive }) => (
                  <>
                    <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-primary" : "bg-sidebar-foreground/25 group-hover:bg-primary/60"}`} />
                    <it.icon className="h-4 w-4 opacity-70" />
                    {it.label}
                  </>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary font-display text-xl font-bold text-primary-foreground">S</div>
      <div className="leading-none">
        <div className="font-display text-base font-bold text-sidebar-foreground">Soldiers</div>
        <div className="font-display text-[10px] font-semibold tracking-[0.2em] text-primary">Platform</div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex items-center justify-between px-5 py-5">
          <Logo />
          <ThemeToggle />
        </div>
        <Nav />
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <aside className="flex h-full w-64 flex-col bg-sidebar">
            <div className="flex items-center justify-between px-5 py-5">
              <Logo />
              <button aria-label="Fechar menu" onClick={() => setOpen(false)} className="text-sidebar-foreground"><X className="h-5 w-5" /></button>
            </div>
            <Nav onNavigate={() => setOpen(false)} />
          </aside>
          <div className="flex-1 bg-background/70" onClick={() => setOpen(false)} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 border-b border-border bg-sidebar px-4 py-3 lg:hidden">
          <button aria-label="Abrir menu" onClick={() => setOpen(true)} className="text-sidebar-foreground"><Menu className="h-5 w-5" /></button>
          <Logo />
        </div>
        <main className="mx-auto max-w-[1600px] px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
