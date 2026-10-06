import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Sun, Moon, Menu, X, ChevronRight } from "lucide-react";
import { GRUPOS, TOPO, RODAPE, grupoDaRota, type ItemNav } from "@/components/nav-config";

const CHAVE_ABERTOS = "sp-nav-abertos";

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

const CLASSE_ITEM =
  "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground";
const CLASSE_ATIVO = "!bg-sidebar-accent !text-sidebar-foreground font-medium";

function LinkNav({
  it,
  onNavigate,
  icon: Icon,
  recuo,
}: {
  it: ItemNav;
  onNavigate?: (() => void) | undefined;
  icon?: typeof Sun | undefined;
  recuo?: boolean | undefined;
}) {
  return (
    <Link
      to={it.to}
      params={it.params as never}
      onClick={onNavigate}
      activeOptions={{ exact: !!it.exato, includeSearch: false }}
      className={`${CLASSE_ITEM} ${recuo ? "pl-9" : ""}`}
      activeProps={{ className: CLASSE_ATIVO }}
    >
      {({ isActive }) => (
        <>
          {Icon ? (
            <Icon className="h-4 w-4 opacity-70" />
          ) : (
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${isActive ? "bg-primary" : "bg-sidebar-foreground/25 group-hover:bg-primary/60"}`}
            />
          )}
          <span className="truncate">{it.label}</span>
          {it.emBreve && (
            <span className="ml-auto rounded border border-sidebar-foreground/20 px-1 text-[9px] uppercase tracking-wide text-sidebar-foreground/50">
              em breve
            </span>
          )}
        </>
      )}
    </Link>
  );
}

function Nav({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const atual = grupoDaRota(pathname);
  const [abertos, setAbertos] = useState<string[]>([]);
  // Grupos que a pessoa deixou abertos ficam salvos neste navegador (conveniência; sem isso, abre só o atual).
  useEffect(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE_ABERTOS) ?? "[]");
      if (Array.isArray(salvo)) setAbertos(salvo.filter((x) => typeof x === "string"));
    } catch {
      /* sem armazenamento: segue só com o grupo atual */
    }
  }, []);
  const alterna = (id: string) =>
    setAbertos((prev) => {
      const aberto = prev.includes(id) || (id === atual && !prev.includes(`-${id}`));
      const next = aberto
        ? [...prev.filter((x) => x !== id), ...(id === atual ? [`-${id}`] : [])]
        : [...prev.filter((x) => x !== `-${id}`), id];
      try {
        // Só os abertos de propósito ficam salvos; fechar o grupo atual vale até trocar de módulo.
        localStorage.setItem(CHAVE_ABERTOS, JSON.stringify(next.filter((x) => !x.startsWith("-"))));
      } catch {
        /* ignora */
      }
      return next;
    });
  // Ao trocar de módulo, o grupo novo volta a abrir sozinho.
  useEffect(() => {
    setAbertos((prev) => prev.filter((x) => !x.startsWith("-")));
  }, [atual]);
  // O grupo da tela atual abre sozinho, a não ser que a pessoa tenha fechado ("-id").
  const estaAberto = (id: string) =>
    abertos.includes(id) || (id === atual && !abertos.includes(`-${id}`));
  return (
    <nav aria-label="Menu principal" className="flex flex-1 flex-col overflow-y-auto px-3 pb-4">
      <LinkNav it={TOPO} icon={TOPO.icon} onNavigate={onNavigate} />
      <div className="mt-3 space-y-1">
        {GRUPOS.map((g) => {
          const aberto = estaAberto(g.id);
          return (
            <div key={g.id}>
              <button
                type="button"
                onClick={() => alterna(g.id)}
                aria-expanded={aberto}
                aria-controls={`nav-${g.id}`}
                className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium transition-colors hover:bg-sidebar-accent ${g.id === atual ? "text-sidebar-foreground" : "text-sidebar-foreground/80"}`}
              >
                <g.icon className={`h-4 w-4 ${g.id === atual ? "text-primary" : "opacity-70"}`} />
                <span className="flex-1">{g.title}</span>
                <ChevronRight
                  className={`h-3.5 w-3.5 opacity-50 transition-transform ${aberto ? "rotate-90" : ""}`}
                />
              </button>
              {aberto && (
                <div id={`nav-${g.id}`} className="mt-0.5 space-y-0.5 pb-1">
                  {g.items.map((it) => (
                    <LinkNav key={it.label} it={it} onNavigate={onNavigate} recuo />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-auto space-y-0.5 border-t border-sidebar-border pt-3">
        {RODAPE.map((it) => (
          <LinkNav key={it.label} it={it} icon={it.icon} onNavigate={onNavigate} />
        ))}
      </div>
    </nav>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary font-display text-xl font-bold text-primary-foreground">
        S
      </div>
      <div className="leading-none">
        <div className="font-display text-base font-bold text-sidebar-foreground">Soldiers</div>
        <div className="font-display text-[10px] font-semibold tracking-[0.2em] text-primary">
          Platform
        </div>
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
              <button
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="text-sidebar-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Nav onNavigate={() => setOpen(false)} />
          </aside>
          <div className="flex-1 bg-background/70" onClick={() => setOpen(false)} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 border-b border-border bg-sidebar px-4 py-3 lg:hidden">
          <button
            aria-label="Abrir menu"
            onClick={() => setOpen(true)}
            className="text-sidebar-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo />
        </div>
        <main className="mx-auto max-w-[1600px] px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
