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
import { ErrosLeitura } from "@/components/erros-leitura";
import { getInteligencia } from "@/lib/inteligencia.functions";
import { NOTA_REGRA, PREVISAO } from "@/lib/inteligencia";
import { fmtBRL, fmtNum, fmtPct, fmtX, fmtDate, periodo } from "@/lib/format";

// Intelligence (Plano Mestre caps. 14–16, 29 e 30): o papel econômico de cada canal e de cada produto,
// a previsão de demanda e estoque por local e o que os experimentos ensinaram. Só leitura e recomendação.
export const Route = createFileRoute("/intelligence")({
  head: () => ({
    meta: [
      { title: "Intelligence — Soldiers Platform" },
      {
        name: "description",
        content:
          "Canais lado a lado, matriz produto × canal, previsão de demanda e estoque por local e experimentos.",
      },
    ],
  }),
  component: Inteligencia,
});

type D = Awaited<ReturnType<typeof getInteligencia>>;
type Aba = "canais" | "matriz" | "estoque" | "experimentos";
const T = (r: unknown) => r as Record<string, unknown>[];
const TOM_NOTA: Record<string, string> = {
  A: "bg-success/20 text-success",
  B: "bg-primary/15 text-primary",
  C: "bg-warning/15 text-warning",
  D: "bg-destructive/20 text-destructive",
};
const TOM_SITUACAO: Record<string, "danger" | "warn" | "success" | "muted" | "primary"> = {
  ruptura: "danger",
  crítico: "danger",
  atenção: "warn",
  ok: "success",
  parado: "muted",
};
const TOM_LEITURA: Record<string, "success" | "danger" | "muted" | "warn"> = {
  vencedor: "success",
  perdedor: "danger",
  inconclusivo: "muted",
  "sem grupo de controle": "warn",
  "sem dados": "muted",
};

function Inteligencia() {
  const [dias, setDias] = useState("30");
  const fn = useServerFn(getInteligencia);
  const p = periodo(dias);
  const q = useQuery({ queryKey: ["inteligencia", p], queryFn: () => fn({ data: p }) });
  return (
    <>
      <PageHeader
        title="Intelligence"
        subtitle="Qual canal e qual produto dão lucro de verdade, onde o estoque vai acabar e o que os testes ensinaram."
        right={<PeriodPills value={dias} onChange={setDias} />}
      />
      {q.isLoading && <Loading />}
      {q.error && <ErrorBox error={q.error} />}
      {q.data && <Body d={q.data} />}
    </>
  );
}

function Body({ d }: { d: D }) {
  const [aba, setAba] = useState<Aba>("canais");
  const tot = d.canais.reduce(
    (s, c) => ({ rec: s.rec + c.receita, con: s.con + c.contribuicao, ads: s.ads + c.ads }),
    { rec: 0, con: 0, ads: 0 },
  );
  const risco = d.estoque.linhas.filter(
    (l) => l.situacao === "ruptura" || l.situacao === "crítico",
  ).length;
  return (
    <div className="space-y-6">
      <ErrosLeitura erros={d.erros} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        <Kpi label="Receita" value={fmtBRL(tot.rec)} hint="todos os canais" />
        <Kpi
          label="Contribuição"
          value={fmtBRL(tot.con)}
          hint={`margem ${fmtPct(tot.rec ? (tot.con / tot.rec) * 100 : null, 0)}`}
          tone="up"
        />
        <Kpi
          label="Ads"
          value={fmtBRL(tot.ads)}
          hint={`${fmtPct(tot.rec ? (tot.ads / tot.rec) * 100 : null, 1)} da receita`}
        />
        <Kpi label="Canais" value={fmtNum(d.canais.length)} />
        <Kpi
          label="Estoque crítico"
          value={fmtNum(risco)}
          hint={`SKU × local, menos de ${PREVISAO.coberturaCritica} dias`}
          {...(risco ? { tone: "down" as const } : {})}
        />
        <Kpi
          label="Experimentos"
          value={fmtNum(d.experimentos.length)}
          hint={`${fmtNum(d.experimentos.filter((e) => e.leitura === "vencedor").length)} com vencedor`}
        />
      </div>
      <Pills
        value={aba}
        onChange={setAba}
        options={[
          { id: "canais", label: "Canais" },
          { id: "matriz", label: "Produto × canal" },
          { id: "estoque", label: "Demanda e estoque" },
          { id: "experimentos", label: "Experimentos" },
        ]}
      />
      {aba === "canais" && <Canais c={d.canais} />}
      {aba === "matriz" && <Matriz m={d.matriz} />}
      {aba === "estoque" && <Estoque e={d.estoque} />}
      {aba === "experimentos" && <Experimentos x={d.experimentos} pendente={d.migracaoPendente} />}
    </div>
  );
}

function Canais({ c }: { c: D["canais"] }) {
  return (
    <div className="space-y-6">
      <Panel
        title="Canais lado a lado"
        right={<CsvButton name="channel-intelligence" rows={T(c)} />}
      >
        {c.length ? (
          <Table
            head={[
              "Canal",
              "Receita",
              "vs. anterior",
              "% do total",
              "Contribuição",
              "Margem",
              "Ads",
              "Novos",
              "CAC",
              "LTV",
              "LTV ÷ CAC",
              "Recompra",
            ]}
          >
            {c.map((x) => (
              <tr key={x.canal}>
                <Td>
                  <span className="font-medium">{x.canal}</span>
                </Td>
                <Td mono>{fmtBRL(x.receita)}</Td>
                <Td
                  mono
                  className={(x.crescimentoPct ?? 0) < 0 ? "text-destructive" : "text-success"}
                >
                  {x.crescimentoPct == null
                    ? "—"
                    : `${x.crescimentoPct > 0 ? "+" : ""}${fmtPct(x.crescimentoPct, 0)}`}
                </Td>
                <Td mono>{fmtPct(x.sharePct, 0)}</Td>
                <Td mono>{fmtBRL(x.contribuicao)}</Td>
                <Td mono>{fmtPct(x.margemPct, 0)}</Td>
                <Td mono>{fmtBRL(x.ads)}</Td>
                <Td mono>{fmtNum(x.novos)}</Td>
                <Td mono>{fmtBRL(x.cac)}</Td>
                <Td mono>{fmtBRL(x.ltv)}</Td>
                <Td mono className={x.ltvCac != null && x.ltvCac < 1 ? "text-destructive" : ""}>
                  {fmtX(x.ltvCac)}
                </Td>
                <Td mono>{fmtPct(x.recompraPct, 0)}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty />
        )}
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          <li>
            Receita, contribuição e Ads do P&amp;L por canal. Novos e CAC por mês (meses que tocam o
            período). LTV e recompra pela safra do canal de entrada.
          </li>
          <li>
            LTV ÷ CAC abaixo de 1× em vermelho: o cliente novo daquele canal não paga o que custou.
          </li>
        </ul>
      </Panel>
      <Panel title="Unit economics por pedido">
        {c.length ? (
          <Table
            head={["Canal", "Pedidos", "Receita / pedido", "Contribuição / pedido", "Ads / pedido"]}
          >
            {c.map((x) => (
              <tr key={x.canal}>
                <Td>{x.canal}</Td>
                <Td mono>{fmtNum(x.pedidos)}</Td>
                <Td mono>{fmtBRL(x.receitaPorPedido)}</Td>
                <Td mono className={(x.contribuicaoPorPedido ?? 0) < 0 ? "text-destructive" : ""}>
                  {fmtBRL(x.contribuicaoPorPedido)}
                </Td>
                <Td mono>{fmtBRL(x.adsPorPedido)}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty />
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Por cliente: LTV ÷ CAC na tabela acima e o lucro de cada cliente no Customer 360. Por
          creator: ROI em{" "}
          <Link to="/affiliate/creators" className="text-primary hover:underline">
            Creators 360
          </Link>
          . Por campanha: telas de Meta, Google, TikTok e Meli DSP.
        </p>
      </Panel>
    </div>
  );
}

function Matriz({ m }: { m: D["matriz"] }) {
  return (
    <Panel title="Matriz produto × canal (25 SKUs que mais vendem)">
      {m.linhas.length ? (
        <Table head={["Produto", ...m.canais.map((c) => c.nome), "Papel"]}>
          {m.linhas.map((l) => (
            <tr key={l.sku}>
              <Td className="max-w-[260px] truncate">
                <Link
                  to="/produtos/$sku"
                  params={{ sku: l.sku }}
                  className="font-medium hover:text-primary"
                >
                  {l.produto}
                </Link>
              </Td>
              {m.canais.map((c) => {
                const x = l.celulas[c.chave];
                if (!x || !x.receita)
                  return (
                    <Td key={c.chave} className="text-muted-foreground">
                      ·
                    </Td>
                  );
                return (
                  <Td key={c.chave} mono>
                    <span
                      className={`mr-2 inline-block w-6 rounded text-center font-semibold ${x.nota ? TOM_NOTA[x.nota] : "bg-muted text-muted-foreground"}`}
                    >
                      {x.nota ?? "?"}
                    </span>
                    <span className="text-xs">{fmtBRL(x.receita)}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {x.margemPct == null ? "sem custo" : `margem ${fmtPct(x.margemPct, 0)}`}
                    </span>
                  </Td>
                );
              })}
              <Td className="text-xs">{l.papel}</Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty />
      )}
      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
        <li>
          Nota pela contribuição estimada (receita − custo do produto na data − taxa média do canal
          − Ads do SKU no canal): A {NOTA_REGRA.A}; B {NOTA_REGRA.B}; C {NOTA_REGRA.C}; D{" "}
          {NOTA_REGRA.D}. "?" = SKU sem custo cadastrado.
        </li>
        <li>
          Não é ranking: um produto pode ser D num canal e ainda valer a pena lá (porta de entrada
          de cliente). Cruze com LTV do canal.
        </li>
      </ul>
    </Panel>
  );
}

function Estoque({ e }: { e: D["estoque"] }) {
  const [f, setF] = useState("risco");
  const lista =
    f === "todos"
      ? e.linhas
      : f === "risco"
        ? e.linhas.filter(
            (l) => l.situacao === "ruptura" || l.situacao === "crítico" || l.situacao === "atenção",
          )
        : e.linhas.filter((l) => l.situacao === "parado");
  return (
    <div className="space-y-6">
      <Panel
        title="Previsão por SKU e local"
        right={
          <div className="flex items-center gap-2">
            <Pills
              value={f}
              onChange={setF}
              options={[
                { id: "risco", label: "Vai faltar" },
                { id: "parado", label: "Parado" },
                { id: "todos", label: "Todos" },
              ]}
            />
            <CsvButton name="previsao-estoque" rows={T(lista)} />
          </div>
        }
      >
        {lista.length ? (
          <Table
            head={[
              "Produto",
              "Local",
              "Estoque",
              "Venda prevista / dia",
              "Tendência",
              "Cobertura",
              "Acaba em",
              `Repor (${PREVISAO.alvoCobertura} dias)`,
              "Situação",
            ]}
          >
            {lista.slice(0, 150).map((l) => (
              <tr key={`${l.sku}-${l.local}`}>
                <Td className="max-w-[260px] truncate">{l.produto}</Td>
                <Td className="text-xs">{l.local}</Td>
                <Td mono>{fmtNum(l.estoque)}</Td>
                <Td mono>{l.previsaoDia.toFixed(1).replace(".", ",")}</Td>
                <Td
                  mono
                  className={
                    (l.tendenciaPct ?? 0) > 20
                      ? "text-success"
                      : (l.tendenciaPct ?? 0) < -20
                        ? "text-destructive"
                        : ""
                  }
                >
                  {l.tendenciaPct == null
                    ? "—"
                    : `${l.tendenciaPct > 0 ? "+" : ""}${fmtPct(l.tendenciaPct, 0)}`}
                </Td>
                <Td mono>{l.coberturaDias == null ? "—" : `${fmtNum(l.coberturaDias)} d`}</Td>
                <Td mono>{l.ruptura ? fmtDate(l.ruptura) : "—"}</Td>
                <Td mono>{l.repor ? fmtNum(l.repor) : "—"}</Td>
                <Td>
                  <StatusTag tone={TOM_SITUACAO[l.situacao] ?? "muted"}>{l.situacao}</StatusTag>
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty />
        )}
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          <li>
            Venda prevista = metade da média dos últimos {PREVISAO.janelaCurta} dias + metade da
            média de {PREVISAO.janelaLonga} dias, só no canal que consome aquele estoque. Tendência
            = 7 dias contra 28.
          </li>
          <li>
            Cada local é separado: estoque do site não cobre o FBA nem o Full. Os números nunca são
            somados.
          </li>
          <li>Parado = tem estoque e não vendeu nos últimos 28 dias naquele canal.</li>
        </ul>
      </Panel>
      <Panel title="Quanto a previsão acerta (últimos 28 dias)">
        {e.backtest.length ? (
          <Table head={["Canal", "SKUs", "Previsto", "Vendido", "Erro", "Viés"]}>
            {e.backtest.map((b) => (
              <tr key={b.canal}>
                <Td>{b.canal}</Td>
                <Td mono>{fmtNum(b.skus)}</Td>
                <Td mono>{fmtNum(b.previsto)}</Td>
                <Td mono>{fmtNum(b.vendido)}</Td>
                <Td mono className={(b.erroPct ?? 0) > 40 ? "text-warning" : ""}>
                  {fmtPct(b.erroPct, 0)}
                </Td>
                <Td mono>
                  {b.viesPct == null ? "—" : `${b.viesPct > 0 ? "+" : ""}${fmtPct(b.viesPct, 0)}`}
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty />
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          A mesma regra prevê os últimos 28 dias só com os 28 anteriores e compara com o que vendeu.
          Erro = diferença absoluta ÷ vendido (somado por canal). Viés positivo = a previsão costuma
          exagerar.
        </p>
      </Panel>
    </div>
  );
}

function Experimentos({ x, pendente }: { x: D["experimentos"]; pendente: boolean }) {
  if (pendente)
    return (
      <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
        O motor de experimentos precisa da migração{" "}
        <span className="font-mono">20261005130000_experimentos.sql</span>. Depois de aplicar,
        cadastre experimentos pelo SQL (exemplo no fim da migração). O cadastro pela tela vem com o
        login e a aprovação.
      </div>
    );
  if (!x.length) return <Empty>Nenhum experimento cadastrado.</Empty>;
  return (
    <div className="space-y-4">
      {x.map((e) => (
        <Panel
          key={e.id}
          title={e.titulo}
          right={
            <div className="flex items-center gap-2">
              <StatusTag tone="muted">{e.area}</StatusTag>
              <StatusTag tone="primary">{e.status}</StatusTag>
              <StatusTag tone={TOM_LEITURA[e.leitura] ?? "muted"}>{e.leitura}</StatusTag>
            </div>
          }
        >
          <p className="mb-3 text-sm">
            <span className="text-muted-foreground">Hipótese:</span> {e.hipotese}{" "}
            <span className="text-xs text-muted-foreground">
              ({fmtDate(e.inicio)}
              {e.fim ? ` a ${fmtDate(e.fim)}` : ", em andamento"} · métrica: {e.metrica})
            </span>
          </p>
          <Table
            head={[
              "Grupo",
              "O que recebeu",
              "Participantes",
              "Conversão",
              "Receita / participante",
              "Lift",
              "p-valor",
              "Amostra p/ concluir",
            ]}
          >
            {e.controle && (
              <tr>
                <Td>
                  <StatusTag tone="muted">controle</StatusTag>
                </Td>
                <Td>—</Td>
                <Td mono>{fmtNum(e.controle.participantes)}</Td>
                <Td mono>{fmtPct(e.controle.taxaPct, 2)}</Td>
                <Td mono>{fmtBRL(e.controle.receitaPorParticipante)}</Td>
                <Td mono>—</Td>
                <Td mono>—</Td>
                <Td mono>—</Td>
              </tr>
            )}
            {e.tratamentos.map((t) => (
              <tr key={t.grupo}>
                <Td>
                  <StatusTag tone="primary">{t.grupo}</StatusTag>
                </Td>
                <Td className="text-xs">{t.descricao}</Td>
                <Td mono>{fmtNum(t.participantes)}</Td>
                <Td mono>{fmtPct(t.taxaPct, 2)}</Td>
                <Td mono>{fmtBRL(t.receitaPorParticipante)}</Td>
                <Td
                  mono
                  className={
                    (t.liftPct ?? 0) > 0
                      ? "text-success"
                      : (t.liftPct ?? 0) < 0
                        ? "text-destructive"
                        : ""
                  }
                >
                  {t.liftPct == null ? "—" : `${t.liftPct > 0 ? "+" : ""}${fmtPct(t.liftPct, 0)}`}
                </Td>
                <Td mono>
                  {t.pValor == null
                    ? "—"
                    : t.pValor < 0.001
                      ? "< 0,001"
                      : t.pValor.toFixed(3).replace(".", ",")}
                </Td>
                <Td mono>
                  {t.amostraNecessaria == null ? "—" : `${fmtNum(t.amostraNecessaria)} por grupo`}
                </Td>
              </tr>
            ))}
          </Table>
          <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Decisão</dt>
              <dd>{e.decisao || "ainda não registrada"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Aprendizado</dt>
              <dd>{e.aprendizado || "—"}</dd>
            </div>
          </dl>
        </Panel>
      ))}
      <p className="text-xs text-muted-foreground">
        Vencedor = tratamento com conversão maior que o controle e p-valor abaixo de 0,05 (teste de
        duas proporções). "Amostra p/ concluir" é quantos participantes cada grupo precisa para ver
        esse lift com 80% de chance.
      </p>
    </div>
  );
}
