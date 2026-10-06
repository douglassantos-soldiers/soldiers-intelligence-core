import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  PageHeader,
  PeriodPills,
  Pills,
  Kpi,
  Panel,
  Loading,
  ErrorBox,
  Table,
  Td,
  StatusTag,
  Empty,
  CsvButton,
} from "@/components/kit";
import { getGoogle } from "@/lib/data.functions";
import { fmtBRL, fmtNum, fmtPct, fmtX, fmtDate, periodo } from "@/lib/format";

// Google Ads e site (benchmarks/google/ANALISE.md §4). Receita do Google é atribuída; a coluna Shopify é a
// venda do Shopify ligada à campanha. POAS usa margem bruta estimada (sem frete e taxas). Só recomendação.
export const Route = createFileRoute("/media_/google")({
  head: () => ({
    meta: [
      { title: "Google Ads — Soldiers Platform" },
      {
        name: "description",
        content:
          "Google Ads por campanha, termo e produto com POAS, assets de PMax e conversão das páginas do site.",
      },
    ],
  }),
  component: Google,
});

type D = Awaited<ReturnType<typeof getGoogle>>;
type Aba = "campanhas" | "termos" | "produtos" | "assets" | "paginas";

const NOMES: Record<string, string> = {
  campanhas: "campanhas por dia",
  lista: "cadastro das campanhas",
  intraday: "gasto do dia",
  produtos: "produtos",
  variantes: "variantes do Shopify",
  custos: "custos",
  negativar: "termos para negativar",
  graduar: "termos para graduar",
  keywords: "keywords",
  assets: "assets de PMax",
  sessoes: "sessões do site",
  pedidosPag: "pedidos por página",
  paginas: "cadastro de páginas",
};

const DIAG = {
  orcamento: {
    label: "orçamento",
    tom: "primary" as const,
    acao: "Dentro da meta e perdendo impressões por verba: avaliar aumentar o orçamento.",
  },
  abaixo_meta: {
    label: "abaixo da meta",
    tom: "danger" as const,
    acao: "ROAS 20% abaixo da meta da campanha: revisar lances, termos e produtos.",
  },
  rank: {
    label: "rank",
    tom: "warn" as const,
    acao: "Perde muitas impressões por posição: melhorar anúncio, página ou lance.",
  },
  ok: { label: "ok", tom: "success" as const, acao: "" },
};

function Google() {
  const [dias, setDias] = useState("28");
  const fn = useServerFn(getGoogle);
  const p = periodo(dias);
  const q = useQuery({ queryKey: ["google", p], queryFn: () => fn({ data: p }) });
  return (
    <>
      <PageHeader
        title="Google Ads"
        subtitle="Onde o Google gasta, o que volta em venda e lucro, e onde o site perde a compra."
        right={
          <div className="flex items-center gap-4">
            <Link to="/media" className="text-sm font-medium text-primary hover:underline">
              ← Media
            </Link>
            <PeriodPills value={dias} onChange={setDias} />
          </div>
        }
      />
      {q.isLoading && <Loading />}
      {q.error && <ErrorBox error={q.error} />}
      {q.data && <Body d={q.data} />}
    </>
  );
}

function Body({ d }: { d: D }) {
  const [aba, setAba] = useState<Aba>("campanhas");
  const c = d.campanhas;
  const erros = Object.keys(d.erros);
  return (
    <div className="space-y-6">
      {erros.length > 0 && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
          Não foi possível ler: {erros.map((k) => NOMES[k] ?? k).join(", ")}. O resto da tela usa o
          que carregou. Ver Data Health.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        <Kpi label="Investido" value={fmtBRL(c.gasto)} />
        <Kpi
          label="Receita atribuída (Google)"
          value={fmtBRL(c.receitaGoogle)}
          hint={`ROAS ${fmtX(c.roas)}`}
        />
        <Kpi
          label="Venda no Shopify"
          value={fmtBRL(c.receitaShopify)}
          hint={`ROAS ${fmtX(c.roasShopify)} · ligada às campanhas`}
        />
        <Kpi
          label="Limitadas por orçamento"
          value={fmtNum(c.campanhas.filter((x) => x.diagnostico === "orcamento").length)}
        />
        <Kpi
          label="Produtos com POAS < 1"
          value={fmtNum(d.produtos.prejuizo.length)}
          {...(d.produtos.prejuizo.length ? { tone: "down" as const } : {})}
        />
        <Kpi label="Assets PMax fracos" value={fmtNum(d.assets.totalBaixos)} />
      </div>

      <Pills
        value={aba}
        onChange={setAba}
        options={[
          { id: "campanhas", label: "Campanhas" },
          { id: "termos", label: "Termos" },
          { id: "produtos", label: "Produtos (POAS)" },
          { id: "assets", label: "PMax assets" },
          { id: "paginas", label: "Páginas do site" },
        ]}
      />

      {aba === "campanhas" && <Campanhas d={d} />}
      {aba === "termos" && <Termos t={d.termos} />}
      {aba === "produtos" && <Produtos p={d.produtos} />}
      {aba === "assets" && <Assets a={d.assets} />}
      {aba === "paginas" && <Paginas p={d.paginas} />}
    </div>
  );
}

function Campanhas({ d }: { d: D }) {
  const c = d.campanhas;
  const r = d.ritmo;
  return (
    <div className="space-y-6">
      <Panel title="Campanhas" right={<CsvButton name="google-campanhas" rows={c.campanhas} />}>
        {c.campanhas.length ? (
          <Table
            head={[
              "Diagnóstico",
              "Campanha",
              "Investido",
              "ROAS Google",
              "ROAS Shopify",
              "Meta",
              "Parcela de impressões",
              "Perda orçamento",
              "Perda rank",
              "Otimização",
            ]}
          >
            {c.campanhas.map((x) => {
              const g = DIAG[x.diagnostico];
              return (
                <tr key={x.id}>
                  <Td>
                    <span title={g.acao}>
                      <StatusTag tone={g.tom}>{g.label}</StatusTag>
                    </span>
                  </Td>
                  <Td className="max-w-[240px]">
                    <div className="truncate" title={x.nome}>
                      {x.nome}
                    </div>
                    <div className="text-xs text-muted-foreground">{x.tipo}</div>
                  </Td>
                  <Td mono>{fmtBRL(x.gasto)}</Td>
                  <Td mono>{fmtX(x.roas)}</Td>
                  <Td mono>{fmtX(x.roasShopify)}</Td>
                  <Td mono>{x.meta == null ? "—" : fmtX(x.meta)}</Td>
                  <Td mono>{fmtPct(x.parcelaImpressaoPct, 0)}</Td>
                  <Td mono>{fmtPct(x.perdaOrcamentoPct, 0)}</Td>
                  <Td mono>{fmtPct(x.perdaRankPct, 0)}</Td>
                  <Td mono>{fmtPct(x.optimizationScore, 0)}</Td>
                </tr>
              );
            })}
          </Table>
        ) : (
          <Empty />
        )}
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {(["orcamento", "abaixo_meta", "rank"] as const).map((k) => (
            <li key={k}>
              <strong>{DIAG[k].label}:</strong> {DIAG[k].acao}
            </li>
          ))}
          <li>
            ROAS Google = receita atribuída pelo Google; ROAS Shopify = venda do Shopify ligada à
            campanha. Não somar com a receita.
          </li>
        </ul>
      </Panel>
      <Panel
        title="Ritmo do orçamento hoje"
        right={
          r.data ? (
            <span className="text-xs text-muted-foreground">{fmtDate(r.data)}</span>
          ) : undefined
        }
      >
        {r.campanhas.length ? (
          <Table
            head={[
              "Campanha",
              "Gasto até agora",
              "Orçamento diário",
              "% do orçamento",
              "% do dia",
              "Ritmo",
            ]}
          >
            {r.campanhas.map((x) => (
              <tr key={x.nome}>
                <Td className="max-w-[260px] truncate">{x.nome}</Td>
                <Td mono>{fmtBRL(x.gasto)}</Td>
                <Td mono>{fmtBRL(x.orcamento)}</Td>
                <Td mono>{fmtPct(x.pctGasto, 0)}</Td>
                <Td mono>{fmtPct(x.pctDia, 0)}</Td>
                <Td>
                  <StatusTag
                    tone={x.ritmo === "acima" ? "warn" : x.ritmo === "abaixo" ? "primary" : "muted"}
                  >
                    {x.ritmo === "sem_orcamento" ? "sem orçamento" : x.ritmo}
                  </StatusTag>
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Sem captura de hoje.</Empty>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Acima = gastou 25 p.p. a mais do que o tempo já passado do dia (pode acabar a verba cedo).
          Abaixo = gastou 25 p.p. a menos (pode não entregar o orçamento).
        </p>
      </Panel>
    </div>
  );
}

function Termos({ t }: { t: D["termos"] }) {
  return (
    <div className="grid gap-6 2xl:grid-cols-2">
      <Panel
        title="Termos para negativar"
        right={<CsvButton name="google-negativar" rows={t.negativar} />}
      >
        {t.negativar.length ? (
          <Table head={["Termo", "Campanha", "Cliques", "Sem retorno", "Sugestão"]}>
            {t.negativar.map((x, i) => (
              <tr key={i}>
                <Td className="max-w-[200px] truncate">{x.termo}</Td>
                <Td className="max-w-[160px] truncate">{x.campanha}</Td>
                <Td mono>{fmtNum(x.cliques)}</Td>
                <Td mono>{fmtBRL(x.semRetorno)}</Td>
                <Td className="max-w-[220px] text-xs">{x.sugestao}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Nenhum termo sugerido.</Empty>
        )}
      </Panel>
      <Panel
        title="Termos para graduar (virar keyword)"
        right={<CsvButton name="google-graduar" rows={t.graduar} />}
      >
        {t.graduar.length ? (
          <Table head={["Termo", "Campanha", "Conversões", "Receita", "ROAS", "Sugestão"]}>
            {t.graduar.map((x, i) => (
              <tr key={i}>
                <Td className="max-w-[200px] truncate">{x.termo}</Td>
                <Td className="max-w-[160px] truncate">{x.campanha}</Td>
                <Td mono>{fmtNum(x.conversoes)}</Td>
                <Td mono>{fmtBRL(x.receita)}</Td>
                <Td mono>{fmtX(x.roas)}</Td>
                <Td className="max-w-[220px] text-xs">{x.sugestao}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Nenhum termo sugerido.</Empty>
        )}
      </Panel>
      <Panel
        title="Keywords com mais investimento"
        right={<CsvButton name="google-keywords" rows={t.keywords} />}
      >
        {t.keywords.length ? (
          <Table
            head={[
              "Keyword",
              "Correspondência",
              "Índice de qualidade",
              "Investido",
              "ROAS",
              "Sugestão",
            ]}
          >
            {t.keywords.map((x, i) => (
              <tr key={i}>
                <Td className="max-w-[200px] truncate">{x.keyword}</Td>
                <Td>{x.correspondencia}</Td>
                <Td mono>{x.qualidade == null ? "—" : fmtNum(x.qualidade)}</Td>
                <Td mono>{fmtBRL(x.invest)}</Td>
                <Td mono>{fmtX(x.roas)}</Td>
                <Td className="max-w-[220px] text-xs">{x.sugestao}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty />
        )}
      </Panel>
      <p className="text-xs text-muted-foreground 2xl:col-span-2">
        Listas das views vw_gads_* do banco, com o período e as regras definidos nelas. Nada é
        aplicado na conta: negativar e criar keyword são decisões do time.
      </p>
    </div>
  );
}

function Produtos({ p }: { p: D["produtos"] }) {
  const tom = { prejuizo: "danger", escalar: "success", ok: "muted", sem_custo: "warn" } as const;
  const rotulo = {
    prejuizo: "POAS < 1",
    escalar: "escalar",
    ok: "ok",
    sem_custo: "sem custo",
  } as const;
  return (
    <Panel
      title="Shopping e PMax por produto"
      right={<CsvButton name="google-produtos-poas" rows={p.lista} />}
    >
      {p.lista.length ? (
        <Table
          head={[
            "",
            "Produto",
            "Investido",
            "Receita atrib.",
            "ROAS",
            "Margem bruta",
            "POAS",
            "Lucro após anúncio",
          ]}
        >
          {p.lista.map((x) => (
            <tr key={x.item}>
              <Td>
                <StatusTag tone={tom[x.sinal]}>{rotulo[x.sinal]}</StatusTag>
              </Td>
              <Td className="max-w-[280px]">
                <div className="truncate" title={x.titulo}>
                  {x.titulo}
                </div>
                <div className="font-mono text-xs text-muted-foreground">{x.sku || x.item}</div>
              </Td>
              <Td mono>{fmtBRL(x.gasto)}</Td>
              <Td mono>{fmtBRL(x.receita)}</Td>
              <Td mono>{fmtX(x.roas)}</Td>
              <Td mono>{fmtPct(x.margemPct, 0)}</Td>
              <Td mono className={x.poas != null && x.poas < 1 ? "text-destructive" : ""}>
                {fmtX(x.poas)}
              </Td>
              <Td
                mono
                className={
                  x.contribuicao == null
                    ? ""
                    : x.contribuicao >= 0
                      ? "text-success"
                      : "text-destructive"
                }
              >
                {fmtBRL(x.contribuicao)}
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty />
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        POAS = margem bruta da receita atribuída ÷ investimento (margem = 1 − custo ÷ preço da
        variante; sem frete e taxas). POAS &lt; 1: o anúncio custa mais do que a margem que ele
        traz. Escalar: POAS ≥ 2.
        {p.semVinculo ? ` ${fmtNum(p.semVinculo)} produto(s) sem SKU ou custo encontrados.` : ""}
      </p>
    </Panel>
  );
}

function Assets({ a }: { a: D["assets"] }) {
  return (
    <div className="grid gap-6 2xl:grid-cols-2">
      <Panel title="Grupos de assets">
        {a.grupos.length ? (
          <Table head={["Campanha", "Grupo", "Assets", "Fracos", "Melhores"]}>
            {a.grupos.map((g) => (
              <tr key={`${g.campanha}|${g.grupo}`}>
                <Td className="max-w-[200px] truncate">{g.campanha}</Td>
                <Td className="max-w-[200px] truncate">{g.grupo}</Td>
                <Td mono>{fmtNum(g.total)}</Td>
                <Td mono className={g.baixo ? "text-destructive" : ""}>
                  {fmtNum(g.baixo)}
                </Td>
                <Td mono>{fmtNum(g.melhor)}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty />
        )}
      </Panel>
      <Panel title="Assets com desempenho baixo">
        {a.baixos.length ? (
          <Table head={["Grupo", "Tipo", "Asset"]}>
            {a.baixos.map((b, i) => (
              <tr key={i}>
                <Td className="max-w-[180px] truncate">{b.grupo}</Td>
                <Td>{b.tipo.toLowerCase()}</Td>
                <Td className="max-w-[280px] truncate">{b.texto}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Nenhum asset marcado como baixo pelo Google.</Empty>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Rótulo de desempenho dado pelo Google. Sugestão: trocar os fracos por variações dos
          melhores.
        </p>
      </Panel>
    </div>
  );
}

function Paginas({ p }: { p: D["paginas"] }) {
  return (
    <div className="space-y-6">
      <Panel title="Por tipo de página">
        {p.porTipo.length ? (
          <Table head={["Tipo", "Sessões", "Pedidos", "Conversão", "Receita"]}>
            {p.porTipo.map((t) => (
              <tr key={t.tipo}>
                <Td>{t.tipo}</Td>
                <Td mono>{fmtNum(t.sessoes)}</Td>
                <Td mono>{fmtNum(t.pedidos)}</Td>
                <Td mono>{fmtPct(t.conversaoPct, 2)}</Td>
                <Td mono>{fmtBRL(t.receita)}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty />
        )}
      </Panel>
      <Panel
        title="Páginas com mais tráfego"
        right={
          <CsvButton
            name="site-paginas"
            rows={p.lista.map((x) => ({ ...x, problemas: x.problemas.join("; ") }))}
          />
        }
      >
        {p.lista.length ? (
          <Table
            head={[
              "Página",
              "Tipo",
              "Sessões",
              "Foi ao checkout",
              "Pedidos",
              "Conversão",
              "Receita/sessão",
              "O que olhar",
            ]}
          >
            {p.lista.map((x) => (
              <tr key={x.path}>
                <Td className="max-w-[260px]">
                  <div className="truncate" title={x.path}>
                    {x.rotulo}
                  </div>
                  <div className="truncate font-mono text-xs text-muted-foreground">{x.path}</div>
                </Td>
                <Td>{x.tipo}</Td>
                <Td mono>{fmtNum(x.sessoes)}</Td>
                <Td mono>{fmtPct(x.checkoutPct, 1)}</Td>
                <Td mono>{fmtNum(x.pedidos)}</Td>
                <Td mono>{fmtPct(x.conversaoPct, 2)}</Td>
                <Td mono>{fmtBRL(x.receitaPorSessao)}</Td>
                <Td className="min-w-[200px]">
                  <div className="flex flex-wrap gap-1">
                    {x.problemas.length ? (
                      x.problemas.map((pr) => (
                        <StatusTag key={pr} tone="warn">
                          {pr}
                        </StatusTag>
                      ))
                    ) : (
                      <StatusTag tone="success">ok</StatusTag>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty />
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Sessões vêm do GA4 (fact_site_pagina_dia) e pedidos do Shopify
          (mv_site_pedido_pagina_dia). Conversão mediana das páginas com 300+ sessões:{" "}
          {fmtPct(p.medianaConversaoPct, 2)}.
        </p>
      </Panel>
    </div>
  );
}
