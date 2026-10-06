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
import { getDevolucoes } from "@/lib/canais.functions";
import { fmtBRL, fmtNum, fmtPct, periodo } from "@/lib/format";

// Marketplace Health: cancelamentos, devoluções e ranking do ML (Plano Mestre caps. 9.5, 9.7 e 9.8). Só leitura.
// Reviews e nota dos anúncios ainda não existem no banco.
export const Route = createFileRoute("/marketplace_/devolucoes")({
  head: () => ({
    meta: [
      { title: "Devoluções e ranking — Soldiers Platform" },
      {
        name: "description",
        content:
          "Cancelamentos e devoluções por canal contra o período anterior, motivos e ranking da Soldiers no Mercado Livre.",
      },
    ],
  }),
  component: Devolucoes,
});

type D = Awaited<ReturnType<typeof getDevolucoes>>;
type Aba = "canais" | "ranking";
const T = (r: unknown) => r as Record<string, unknown>[];
const pp = (v: number | null) =>
  v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1).replace(".", ",")} p.p.`;

function Devolucoes() {
  const [dias, setDias] = useState("28");
  const fn = useServerFn(getDevolucoes);
  const p = periodo(dias);
  const q = useQuery({ queryKey: ["devolucoes", p], queryFn: () => fn({ data: p }) });
  return (
    <>
      <PageHeader
        title="Devoluções e ranking"
        subtitle="Onde cancelamento e devolução estão subindo, por quê, e como a Soldiers está no ranking do Mercado Livre."
        right={
          <div className="flex items-center gap-4">
            <Link to="/marketplace" className="text-sm font-medium text-primary hover:underline">
              ← Marketplace
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
  const [aba, setAba] = useState<Aba>("canais");
  const perdido = d.canais.reduce((s, c) => s + (c.valorPerdido ?? 0), 0);
  const piorando = d.canais.filter(
    (c) => (c.deltaDevolucaoPp ?? 0) >= 1 || (c.deltaCancelPp ?? 0) >= 2,
  ).length;
  const comNos = d.ranking.filter((r) => r.nossa);
  return (
    <div className="space-y-6">
      <ErrosLeitura erros={d.erros} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="Valor perdido"
          value={fmtBRL(perdido)}
          hint="cancelado + reembolso (ML, Shopee, TikTok)"
        />
        <Kpi
          label="Canais piorando"
          value={fmtNum(piorando)}
          hint="contra o período anterior"
          {...(piorando ? { tone: "warn" as const } : {})}
        />
        <Kpi
          label="Categorias no ranking ML"
          value={fmtNum(comNos.length)}
          hint={`de ${fmtNum(d.ranking.length)} acompanhadas`}
        />
        <Kpi
          label="Melhor posição ML"
          value={comNos.length ? `${Math.min(...comNos.map((r) => r.nossa!.posicao ?? 99))}º` : "—"}
        />
      </div>
      <Pills
        value={aba}
        onChange={setAba}
        options={[
          { id: "canais", label: "Cancelamento e devolução" },
          { id: "ranking", label: "Ranking Mercado Livre" },
        ]}
      />
      {aba === "canais" && <Canais d={d} />}
      {aba === "ranking" && <Ranking r={d.ranking} />}
    </div>
  );
}

function Canais({ d }: { d: D }) {
  return (
    <div className="space-y-6">
      <Panel
        title="Por canal × período anterior"
        right={<CsvButton name="devolucoes-por-canal" rows={T(d.canais)} />}
      >
        {d.canais.length ? (
          <Table
            head={[
              "Canal",
              "Pedidos",
              "Cancelamento",
              "vs. anterior",
              "Devolução",
              "Base",
              "vs. anterior",
              "Valor perdido",
            ]}
          >
            {d.canais.map((c) => (
              <tr key={c.canal}>
                <Td>{c.canal}</Td>
                <Td mono>{fmtNum(c.pedidos)}</Td>
                <Td mono>{fmtPct(c.cancelPct, 1)}</Td>
                <Td mono className={(c.deltaCancelPp ?? 0) >= 2 ? "text-destructive" : ""}>
                  {pp(c.deltaCancelPp)}
                </Td>
                <Td mono>{fmtPct(c.devolucaoPct, 1)}</Td>
                <Td className="text-xs text-muted-foreground">{c.baseDevolucao ?? "—"}</Td>
                <Td mono className={(c.deltaDevolucaoPp ?? 0) >= 1 ? "text-destructive" : ""}>
                  {pp(c.deltaDevolucaoPp)}
                </Td>
                <Td mono>{c.valorPerdido == null ? "—" : fmtBRL(c.valorPerdido)}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty />
        )}
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          <li>
            Site e Amazon medem devolução por unidade; TikTok por pedido. Não compare bases
            diferentes.
          </li>
          <li>
            ML e Shopee trazem cancelamento, não devolução. Shopee inclui o frete reverso no valor
            perdido.
          </li>
          <li>
            Em vermelho: cancelamento +2 p.p. ou devolução +1 p.p. sobre o período anterior de mesmo
            tamanho.
          </li>
        </ul>
      </Panel>
      <div className="grid gap-6 2xl:grid-cols-2">
        <Panel title="TikTok Shop: motivos de devolução">
          {d.motivos.length ? (
            <Table head={["Motivo", "Devoluções", "%", "Reembolso"]}>
              {d.motivos.slice(0, 12).map((m) => (
                <tr key={m.motivo}>
                  <Td>{m.motivo}</Td>
                  <Td mono>{fmtNum(m.devolucoes)}</Td>
                  <Td mono>{fmtPct(m.sharePct, 0)}</Td>
                  <Td mono>{fmtBRL(m.valor)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty />
          )}
        </Panel>
        <Panel title="TikTok Shop: motivos de cancelamento">
          {d.cancelamentosTikTok.length ? (
            <Table head={["Motivo", "Quem cancelou", "Pedidos", "%", "Valor perdido"]}>
              {d.cancelamentosTikTok.slice(0, 12).map((m) => (
                <tr key={m.motivo + m.iniciador}>
                  <Td>{m.motivo}</Td>
                  <Td>{m.iniciador || "—"}</Td>
                  <Td mono>{fmtNum(m.pedidos)}</Td>
                  <Td mono>{fmtPct(m.sharePct, 0)}</Td>
                  <Td mono>{fmtBRL(m.valorPerdido)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty />
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Visão acumulada da fonte (não segue o período escolhido).
          </p>
        </Panel>
      </div>
    </div>
  );
}

function Ranking({ r }: { r: D["ranking"] }) {
  const [cat, setCat] = useState(r[0]?.categoria ?? "");
  const atual = r.find((x) => x.categoria === cat) ?? r[0];
  if (!r.length) return <Empty>Sem dados de ranking.</Empty>;
  return (
    <div className="space-y-6">
      <Panel title="Soldiers por categoria">
        <Table
          head={[
            "Categoria",
            "Posição",
            "Share",
            "Crescimento",
            "Líder",
            "Distância do líder",
            "Logo acima",
          ]}
        >
          {r.map((x) => (
            <tr key={x.categoria} className="cursor-pointer" onClick={() => setCat(x.categoria)}>
              <Td>
                <span
                  className={x.categoria === atual?.categoria ? "font-semibold text-primary" : ""}
                >
                  {x.categoria}
                </span>
              </Td>
              <Td mono>{x.nossa?.posicao != null ? `${x.nossa.posicao}º` : "fora"}</Td>
              <Td mono>{fmtPct(x.nossa?.sharePct, 1)}</Td>
              <Td mono className={(x.nossa?.crescimento ?? 0) < 0 ? "text-destructive" : ""}>
                {x.nossa?.crescimento == null ? "—" : fmtPct(x.nossa.crescimento, 0)}
              </Td>
              <Td>{x.lider?.nome ?? "—"}</Td>
              <Td mono>
                {x.distanciaLiderPp == null
                  ? "—"
                  : `${x.distanciaLiderPp.toFixed(1).replace(".", ",")} p.p.`}
              </Td>
              <Td>{x.acima?.nome ?? "—"}</Td>
            </tr>
          ))}
        </Table>
        <p className="mt-3 text-xs text-muted-foreground">
          Clique numa categoria para ver o ranking completo.
        </p>
      </Panel>
      {atual && (
        <Panel
          title={`Ranking: ${atual.categoria}${atual.mes ? ` (${atual.mes})` : ""}`}
          right={<CsvButton name="ranking-ml" rows={T(atual.linhas)} />}
        >
          <Table head={["Posição", "Marca / loja", "Share", "Crescimento", "Receita", "Unidades"]}>
            {atual.linhas.map((l) => (
              <tr key={`${l.posicao}-${l.nome}`} className={l.nosso ? "bg-primary/10" : ""}>
                <Td mono>{l.posicao != null ? `${l.posicao}º` : "—"}</Td>
                <Td>
                  {l.nome} {l.nosso && <StatusTag tone="primary">Soldiers</StatusTag>}
                </Td>
                <Td mono>{fmtPct(l.sharePct, 1)}</Td>
                <Td mono>{l.crescimento == null ? "—" : fmtPct(l.crescimento, 0)}</Td>
                <Td mono>{fmtBRL(l.receita)}</Td>
                <Td mono>{fmtNum(l.unidades)}</Td>
              </tr>
            ))}
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">
            Ranking estimado pela view vw_ml_ranking_atual. A linha da Soldiers é achada pelo nome;
            se não aparecer, conferir o apelido usado na fonte.
          </p>
        </Panel>
      )}
    </div>
  );
}
