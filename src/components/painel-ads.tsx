// Painel visual de Ads de marketplace (ML, Amazon, Shopee): abas por tipo de anúncio, filtros, cards que ligam e
// desligam séries, gráfico diário, competitividade, direto × indireto × orgânico e tabela por campanha que abre
// nos itens. Recebe as linhas já normalizadas (src/lib/painel-ads.ts) e filtra no navegador.
//
// Gráfico: uma escala por gráfico. Métricas de unidades diferentes (R$, ×, %, contagem) viram gráficos separados,
// lado a lado, em vez de dois eixos no mesmo gráfico. Cor fixa por métrica (não muda quando outra é desligada).
import { Fragment, useMemo, useState, type ReactNode } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { ChevronRight, Search } from "lucide-react";
import { Pills, Panel, Empty, CsvButton, StatusTag } from "@/components/kit";
import { fmtBRL, fmtBRL2, fmtNum, fmtPct, fmtX, fmtDate, fmtCompact } from "@/lib/format";
import {
  filtraLinhas,
  painelAds,
  logisticas,
  type LinhaAds,
  type FiltrosAds,
  type Metricas,
  type CampanhaPainel,
  type AbaAds,
  abasDe,
} from "@/lib/painel-ads";

// Cores da série: amarelo, azul e laranja do tema (validadas para daltonismo como trio; a 4ª cor nunca é usada
// no mesmo gráfico). Cada métrica tem posição fixa dentro do seu grupo.
const COR = ["#f6c919", "#3d98d1", "#e4882c"] as const;

export type ChaveMetrica =
  | "investimento"
  | "receita"
  | "roas"
  | "acos"
  | "unidades"
  | "cvr"
  | "impressoes"
  | "cliques"
  | "ctr"
  | "cpc"
  | "receitaDireta";

type DefMetrica = {
  chave: ChaveMetrica;
  rotulo: string;
  grupo: "valor" | "retorno" | "pct" | "contagem" | "impressoes" | "unitario";
  cor: number;
  fmt: (v: number | null) => string;
};

const METRICAS: Record<ChaveMetrica, DefMetrica> = {
  investimento: {
    chave: "investimento",
    rotulo: "Investimento",
    grupo: "valor",
    cor: 0,
    fmt: fmtBRL2,
  },
  receita: { chave: "receita", rotulo: "Receita", grupo: "valor", cor: 1, fmt: fmtBRL2 },
  receitaDireta: {
    chave: "receitaDireta",
    rotulo: "Receita direta",
    grupo: "valor",
    cor: 2,
    fmt: fmtBRL2,
  },
  roas: { chave: "roas", rotulo: "ROAS", grupo: "retorno", cor: 0, fmt: (v) => fmtX(v) },
  acos: { chave: "acos", rotulo: "ACoS", grupo: "pct", cor: 0, fmt: (v) => fmtPct(v, 2) },
  cvr: { chave: "cvr", rotulo: "CVR", grupo: "pct", cor: 1, fmt: (v) => fmtPct(v, 2) },
  ctr: { chave: "ctr", rotulo: "CTR", grupo: "pct", cor: 2, fmt: (v) => fmtPct(v, 2) },
  unidades: {
    chave: "unidades",
    rotulo: "Unidades",
    grupo: "contagem",
    cor: 0,
    fmt: (v) => fmtNum(v),
  },
  cliques: {
    chave: "cliques",
    rotulo: "Cliques",
    grupo: "contagem",
    cor: 1,
    fmt: (v) => fmtNum(v),
  },
  impressoes: {
    chave: "impressoes",
    rotulo: "Impressões",
    grupo: "impressoes",
    cor: 0,
    fmt: (v) => fmtNum(v),
  },
  cpc: { chave: "cpc", rotulo: "CPC", grupo: "unitario", cor: 0, fmt: fmtBRL2 },
};
const NOME_GRUPO: Record<DefMetrica["grupo"], string> = {
  valor: "R$",
  retorno: "ROAS (×)",
  pct: "%",
  contagem: "Quantidade",
  impressoes: "Impressões",
  unitario: "R$ por clique",
};
const PRINCIPAIS: ChaveMetrica[] = ["investimento", "receita", "roas", "acos", "unidades", "cvr"];
const SECUNDARIAS: ChaveMetrica[] = ["impressoes", "cliques", "ctr", "cpc", "receitaDireta"];

export function PainelAds({
  linhas,
  itens = [],
  abas,
  de = "0000-00-00",
  ate = "9999-12-31",
  nomeCsv,
  rotuloUnidades = "Unidades",
  rotuloReceita = "Receita",
  filtrosMl = false,
  nota,
  composicaoTitulo = "Direto × indireto × orgânico",
  ocultar = [],
  rotuloCampanha = "Campanha",
}: {
  linhas: LinhaAds[];
  itens?: LinhaAds[];
  abas: AbaAds[];
  /** Período da tela; as linhas já vêm do servidor no período, então é opcional. */
  de?: string;
  ate?: string;
  nomeCsv: string;
  rotuloUnidades?: string;
  rotuloReceita?: string;
  /** Filtros de item do Mercado Livre (Buy Box, catálogo, logística). */
  filtrosMl?: boolean;
  nota?: ReactNode;
  composicaoTitulo?: string;
  /** Métricas que a plataforma não informa (somem dos cards, do gráfico e da tabela). */
  ocultar?: ChaveMetrica[];
  /** Nome da linha da tabela: "Campanha", "Canal"… */
  rotuloCampanha?: string;
}) {
  const [tipo, setTipo] = useState(abas[0]?.id ?? "");
  // Sem status por campanha (TikTok, visão geral), o filtro Ativas/Pausadas só esvaziaria a tela.
  const temStatus = linhas.some((l) => l.status === "ativo" || l.status === "pausado");
  const [f, setF] = useState<FiltrosAds>({
    status: "todos",
    busca: "",
    buyBox: "todos",
    catalogo: "todos",
    logistica: "",
  });
  const [ligadas, setLigadas] = useState<ChaveMetrica[]>(["investimento", "receita", "roas"]);
  const aba = abas.find((a) => a.id === tipo);
  const doTipo = useMemo(
    () => (tipo === "*" ? linhas : linhas.filter((l) => l.tipo === tipo)),
    [linhas, tipo],
  );
  const visivel = (k: ChaveMetrica) => !ocultar.includes(k);
  const temItens = doTipo.some((l) => l.itemId) || itens.some((l) => l.tipo === tipo);
  const filtradas = useMemo(() => filtraLinhas(doTipo, f, de, ate), [doTipo, f, de, ate]);
  const itensFiltrados = useMemo(
    () =>
      filtraLinhas(
        tipo === "*" ? itens : itens.filter((l) => l.tipo === tipo),
        { busca: "" },
        de,
        ate,
      ),
    [itens, tipo, de, ate],
  );
  const p = useMemo(() => painelAds(filtradas, itensFiltrados), [filtradas, itensFiltrados]);
  const t = p.totais;
  const rot = (k: ChaveMetrica) =>
    k === "unidades" ? rotuloUnidades : k === "receita" ? rotuloReceita : METRICAS[k].rotulo;
  const liga = (k: ChaveMetrica) =>
    setLigadas((xs) => (xs.includes(k) ? xs.filter((x) => x !== k) : [...xs, k]));
  const opcoesLog = useMemo(() => logisticas(doTipo), [doTipo]);

  return (
    <div className="space-y-5">
      {abas.length > 1 && (
        <Pills
          value={tipo}
          onChange={setTipo}
          options={abas.map((a) => ({ id: a.id, label: a.label }))}
        />
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border border-border bg-card px-4 py-3">
        {temStatus && (
          <Filtro rotulo={rotuloCampanha}>
            <Pills
              value={f.status ?? "todos"}
              onChange={(v) => setF({ ...f, status: v })}
              options={[
                { id: "todos", label: "Todas" },
                { id: "ativo", label: "Ativas" },
                { id: "pausado", label: "Pausadas" },
              ]}
            />
          </Filtro>
        )}
        {filtrosMl && (
          <>
            <Filtro rotulo="Buy Box">
              <Pills
                value={f.buyBox ?? "todos"}
                onChange={(v) => setF({ ...f, buyBox: v })}
                options={[
                  { id: "todos", label: "Todas" },
                  { id: "ganhando", label: "Ganhando" },
                  { id: "perdendo", label: "Perdendo" },
                ]}
              />
            </Filtro>
            <Filtro rotulo="Catálogo">
              <Pills
                value={f.catalogo ?? "todos"}
                onChange={(v) => setF({ ...f, catalogo: v })}
                options={[
                  { id: "todos", label: "Todos" },
                  { id: "catalogo", label: "Catálogo" },
                  { id: "nao", label: "Não catálogo" },
                ]}
              />
            </Filtro>
            {opcoesLog.length > 0 && (
              <Filtro rotulo="Logística">
                <select
                  value={f.logistica ?? ""}
                  onChange={(e) => setF({ ...f, logistica: e.target.value })}
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                  aria-label="Tipo logístico"
                >
                  <option value="">Todas</option>
                  {opcoesLog.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Filtro>
            )}
          </>
        )}
        <div className="ml-auto flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={f.busca ?? ""}
            onChange={(e) => setF({ ...f, busca: e.target.value })}
            placeholder={
              temItens
                ? `Buscar ${rotuloCampanha.toLowerCase()} ou item…`
                : `Buscar ${rotuloCampanha.toLowerCase()}…`
            }
            className="w-56 bg-transparent text-sm outline-none"
            aria-label="Buscar campanha"
          />
        </div>
      </div>

      {aba?.aviso && (
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          {aba.aviso}
        </div>
      )}

      {/* Cards principais: clicar liga/desliga a série no gráfico */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {PRINCIPAIS.filter(visivel).map((k) => (
          <CardMetrica
            key={k}
            rotulo={rot(k)}
            valor={METRICAS[k].fmt(t[k] as number | null)}
            ligada={ligadas.includes(k)}
            cor={ligadas.includes(k) ? COR[METRICAS[k].cor] : undefined}
            onClick={() => liga(k)}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {SECUNDARIAS.filter(
          (k) => visivel(k) && (k !== "receitaDireta" || t.receitaDireta != null),
        ).map((k) => (
          <CardMetrica
            key={k}
            pequeno
            rotulo={rot(k)}
            valor={METRICAS[k].fmt(t[k] as number | null)}
            ligada={ligadas.includes(k)}
            cor={ligadas.includes(k) ? COR[METRICAS[k].cor] : undefined}
            onClick={() => liga(k)}
          />
        ))}
      </div>

      <Panel title="Séries diárias (clique nos cards para ligar e desligar métricas)">
        {p.serie.length ? (
          <Series serie={p.serie} ligadas={ligadas} rot={rot} />
        ) : (
          <Empty>Sem dados de anúncio neste filtro.</Empty>
        )}
      </Panel>

      {(p.competitividade || p.composicao) && (
        <div className="grid gap-5 2xl:grid-cols-2">
          {p.competitividade && <Competitividade c={p.competitividade} />}
          {p.composicao && (
            <Composicao
              titulo={composicaoTitulo}
              c={p.composicao}
              receita={t.receita}
              rotuloUnidades={rotuloUnidades}
            />
          )}
        </div>
      )}

      <TabelaCampanhas
        campanhas={p.campanhas}
        totais={t}
        temItens={temItens}
        rot={rot}
        nomeCsv={nomeCsv}
        temDireta={t.receitaDireta != null}
        ocultar={ocultar}
        rotuloCampanha={rotuloCampanha}
      />
      {nota && <p className="text-xs text-muted-foreground">{nota}</p>}
    </div>
  );
}

function Filtro({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {rotulo}
      </span>
      {children}
    </div>
  );
}

function CardMetrica({
  rotulo,
  valor,
  ligada,
  cor,
  onClick,
  pequeno,
}: {
  rotulo: string;
  valor: string;
  ligada: boolean;
  cor?: string | undefined;
  onClick: () => void;
  pequeno?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ligada}
      title={ligada ? "Tirar do gráfico" : "Mostrar no gráfico"}
      className={`rounded-lg border bg-card text-left transition-colors ${pequeno ? "px-3 py-2" : "p-4"} ${ligada ? "border-primary/70" : "border-border hover:border-primary/40"}`}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: cor ?? "var(--muted-foreground)", opacity: cor ? 1 : 0.4 }}
        />
        {rotulo}
      </div>
      <div
        className={`font-mono font-semibold text-card-foreground ${pequeno ? "mt-0.5 text-base" : "mt-2 text-xl 2xl:text-2xl"}`}
      >
        {valor}
      </div>
    </button>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--popover-foreground)",
  },
  labelStyle: { color: "var(--muted-foreground)" },
};

function Series({
  serie,
  ligadas,
  rot,
}: {
  serie: (Metricas & { data: string })[];
  ligadas: ChaveMetrica[];
  rot: (k: ChaveMetrica) => string;
}) {
  const grupos = (["valor", "retorno", "pct", "contagem", "impressoes", "unitario"] as const)
    .map((g) => ({
      g,
      ks: (Object.keys(METRICAS) as ChaveMetrica[]).filter(
        (k) => METRICAS[k].grupo === g && ligadas.includes(k),
      ),
    }))
    .filter((x) => x.ks.length);
  if (!grupos.length) return <Empty>Ligue uma métrica nos cards acima.</Empty>;
  return (
    <div className={`grid gap-4 ${grupos.length > 1 ? "xl:grid-cols-2" : ""}`}>
      {grupos.map(({ g, ks }) => (
        <div key={g}>
          <div className="mb-1 text-xs text-muted-foreground">{NOME_GRUPO[g]}</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={serie} margin={{ left: 0, right: 12, top: 8 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="data"
                tickFormatter={(v) => fmtDate(v).slice(0, 5)}
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) =>
                  g === "retorno"
                    ? `${fmtCompact(v)}×`
                    : g === "pct"
                      ? `${fmtCompact(v)}%`
                      : fmtCompact(v)
                }
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={52}
              />
              <Tooltip
                {...tooltipStyle}
                labelFormatter={(v) => fmtDate(v as string)}
                formatter={(v: number, nome: string) => {
                  const k = ks.find((x) => rot(x) === nome);
                  return [k ? METRICAS[k].fmt(v) : String(v), nome];
                }}
              />
              {ks.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
              {ks.map((k) => (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  name={rot(k)}
                  stroke={COR[METRICAS[k].cor]}
                  strokeWidth={2}
                  dot={serie.length <= 14 ? { r: 3 } : false}
                  activeDot={{ r: 5 }}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}

function Competitividade({
  c,
}: {
  c: NonNullable<ReturnType<typeof painelAds>["competitividade"]>;
}) {
  const itens: [string, number | null][] = [
    ["Impression share", c.impressionShare],
    ["Top impression share", c.topImpressionShare],
    ["Perdido por orçamento", c.perdidoOrcamento],
    ["Perdido por lance/qualidade", c.perdidoRank],
    // Benchmark de ACoS só o Mercado Livre informa; nas outras plataformas o card some.
    ...(c.acosBenchmark == null ? [] : [["ACoS benchmark", c.acosBenchmark] as [string, number]]),
  ];
  return (
    <Panel title="Competitividade">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {itens.map(([r, v]) => (
          <div key={r} className="rounded-md border border-border bg-background/40 px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {r}
            </div>
            <div className="mt-0.5 font-mono text-base font-semibold">
              {v == null ? "—" : fmtPct(v, 1)}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Médias ponderadas pelo investimento, como informadas pela plataforma. — = a plataforma não
        informa.
      </p>
    </Panel>
  );
}

function Barra({ partes }: { partes: { rotulo: string; valor: number; cor: string }[] }) {
  const tot = partes.reduce((s, x) => s + x.valor, 0);
  if (!tot) return <div className="h-6 rounded bg-muted" />;
  return (
    <div className="flex h-6 gap-0.5 overflow-hidden rounded">
      {partes
        .filter((x) => x.valor > 0)
        .map((x) => (
          <div
            key={x.rotulo}
            className="flex items-center justify-center text-[11px] font-semibold text-black"
            style={{ width: `${(x.valor / tot) * 100}%`, background: x.cor }}
            title={`${x.rotulo}: ${fmtPct((x.valor / tot) * 100, 1)}`}
          >
            {(x.valor / tot) * 100 >= 12 ? `${x.rotulo} ${fmtPct((x.valor / tot) * 100, 1)}` : ""}
          </div>
        ))}
    </div>
  );
}

function Composicao({
  titulo,
  c,
  receita,
  rotuloUnidades,
}: {
  titulo: string;
  c: NonNullable<ReturnType<typeof painelAds>["composicao"]>;
  receita: number;
  rotuloUnidades: string;
}) {
  return (
    <Panel title={titulo}>
      {c.direta != null && (
        <div className="mb-4">
          <div className="mb-1 text-xs text-muted-foreground">
            Receita atribuída ({fmtBRL(receita)})
          </div>
          <Barra
            partes={[
              { rotulo: "Direta", valor: c.direta ?? 0, cor: COR[0] },
              { rotulo: "Indireta", valor: c.indireta ?? 0, cor: COR[1] },
            ]}
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>Direta {fmtBRL(c.direta)}</span>
            <span>Indireta {fmtBRL(c.indireta)}</span>
          </div>
        </div>
      )}
      {c.unidadesOrganicas != null && (
        <div>
          <div className="mb-1 text-xs text-muted-foreground">
            {rotuloUnidades} vendidas ({fmtNum(c.unidadesAds + (c.unidadesOrganicas ?? 0))})
          </div>
          <Barra
            partes={[
              { rotulo: "Ads", valor: c.unidadesAds, cor: COR[0] },
              { rotulo: "Orgânico", valor: c.unidadesOrganicas ?? 0, cor: "#8a8f98" },
            ]}
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>Ads {fmtNum(c.unidadesAds)}</span>
            <span>Orgânico {fmtNum(c.unidadesOrganicas)}</span>
          </div>
        </div>
      )}
    </Panel>
  );
}

type Col = { k: ChaveMetrica; fmt: (v: number | null) => string };

function TabelaCampanhas({
  ocultar,
  rotuloCampanha,
  campanhas,
  totais,
  temItens,
  rot,
  nomeCsv,
  temDireta,
}: {
  campanhas: CampanhaPainel[];
  totais: Metricas;
  temItens: boolean;
  rot: (k: ChaveMetrica) => string;
  nomeCsv: string;
  temDireta: boolean;
  ocultar: ChaveMetrica[];
  rotuloCampanha: string;
}) {
  const [ordem, setOrdem] = useState<{ k: ChaveMetrica; desc: boolean }>({
    k: "investimento",
    desc: true,
  });
  const [abertas, setAbertas] = useState<Set<string>>(new Set());
  const cols: Col[] = (
    [
      "investimento",
      "receita",
      "roas",
      "acos",
      "unidades",
      "impressoes",
      "cliques",
      "ctr",
      "cpc",
      "cvr",
      ...(temDireta ? (["receitaDireta"] as const) : []),
    ] as ChaveMetrica[]
  )
    .filter((k) => !ocultar.includes(k))
    .map((k) => ({ k, fmt: METRICAS[k].fmt }));
  const lista = [...campanhas].sort((a, b) => {
    const va = a[ordem.k] ?? -Infinity;
    const vb = b[ordem.k] ?? -Infinity;
    return ordem.desc ? (vb as number) - (va as number) : (va as number) - (vb as number);
  });
  const csv = campanhas.map((c) => ({
    [rotuloCampanha.toLowerCase()]: c.nome,
    status: c.status,
    ...Object.fromEntries(cols.map((x) => [x.k, c[x.k]])),
  }));
  const abre = (id: string) =>
    setAbertas((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  return (
    <Panel
      title={`Desempenho por ${rotuloCampanha.toLowerCase()}`}
      right={<CsvButton name={nomeCsv} rows={csv} />}
    >
      {lista.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="sticky left-0 z-10 bg-card px-3 py-2 font-medium">
                  {rotuloCampanha}
                </th>
                {cols.map((c) => (
                  <th key={c.k} className="whitespace-nowrap px-3 py-2 text-right font-medium">
                    <button
                      type="button"
                      onClick={() =>
                        setOrdem((o) => ({ k: c.k, desc: o.k === c.k ? !o.desc : true }))
                      }
                      className={ordem.k === c.k ? "text-primary" : "hover:text-foreground"}
                    >
                      {rot(c.k)}
                      {ordem.k === c.k ? (ordem.desc ? " ↓" : " ↑") : ""}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => {
                const aberta = abertas.has(c.id);
                return (
                  <Fragment key={c.id}>
                    <tr className="border-b border-border/60 hover:bg-muted/30">
                      <td className="sticky left-0 z-10 max-w-[320px] bg-card px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          {temItens && c.itens.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => abre(c.id)}
                              aria-label={aberta ? "Fechar itens" : "Abrir itens"}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ChevronRight
                                className={`h-4 w-4 transition-transform ${aberta ? "rotate-90" : ""}`}
                              />
                            </button>
                          ) : (
                            <span className="w-4" />
                          )}
                          <span className="truncate font-medium" title={c.nome}>
                            {c.nome}
                          </span>
                          {c.status !== "outro" && (
                            <StatusTag tone={c.status === "ativo" ? "success" : "muted"}>
                              {c.status === "ativo" ? "ativa" : "pausada"}
                            </StatusTag>
                          )}
                        </div>
                      </td>
                      {cols.map((x) => (
                        <td
                          key={x.k}
                          className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-[13px]"
                        >
                          {x.fmt(c[x.k] as number | null)}
                        </td>
                      ))}
                    </tr>
                    {aberta &&
                      c.itens.slice(0, 50).map((it) => (
                        <tr
                          key={`${c.id}-${it.id}`}
                          className="border-b border-border/40 bg-muted/20 text-muted-foreground"
                        >
                          <td className="sticky left-0 z-10 max-w-[320px] bg-card px-3 py-2 pl-10">
                            <div className="truncate" title={it.nome}>
                              {it.nome}
                            </div>
                            <div className="font-mono text-[11px]">{it.id}</div>
                          </td>
                          {cols.map((x) => (
                            <td
                              key={x.k}
                              className="whitespace-nowrap px-3 py-2 text-right font-mono text-[12px]"
                            >
                              {x.fmt(it[x.k] as number | null)}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </Fragment>
                );
              })}
              <tr className="border-t-2 border-border font-semibold">
                <td className="sticky left-0 z-10 bg-card px-3 py-2.5">Total</td>
                {cols.map((x) => (
                  <td
                    key={x.k}
                    className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-[13px]"
                  >
                    {x.fmt(totais[x.k] as number | null)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Nenhuma campanha neste filtro.</Empty>
      )}
    </Panel>
  );
}
