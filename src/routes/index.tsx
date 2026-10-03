import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import type { getOverview } from "@/lib/data.functions";
import { PageHeader, PeriodPills, Kpi, Panel, Loading, ErrorBox, Table, Td } from "@/components/kit";
import { StackedArea, pivot } from "@/components/charts";
import { channelSummary, total, ratio, pct, RECEITA_FIELDS, PL_FIELDS } from "@/lib/aggregate";
import { fmtBRL, fmtNum, fmtPct, fmtX } from "@/lib/format";
import { useOverview } from "@/lib/queries";
import { Alertas } from "@/components/alertas";
import { MetasMes } from "@/components/metas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Center — Soldiers Platform" },
      { name: "description", content: "Receita, margem, investimento e clientes de todos os canais da Soldiers em uma tela." },
      { property: "og:title", content: "Command Center — Soldiers Platform" },
      { property: "og:description", content: "Visão consolidada de todos os canais da Soldiers Nutrition." },
    ],
  }),
  component: CommandCenter,
});

function CommandCenter() {
  const [dias, setDias] = useState("30");
  const q = useOverview(dias);

  return (
    <>
      <PageHeader title="Command Center" subtitle="Todos os canais, uma inteligência. Receita, margem e aquisição consolidadas." right={<PeriodPills value={dias} onChange={setDias} />} />
      {q.isLoading && <Loading />}
      {q.error && <ErrorBox error={q.error} />}
      {q.data && (
        <div className="space-y-6">
          <MetasMes />
          <Alertas />
          <Body data={q.data} />
        </div>
      )}
    </>
  );
}

function Body({ data }: { data: Awaited<ReturnType<typeof getOverview>> }) {
  const t = total(data.receita, RECEITA_FIELDS);
  const pl = total(data.pl, PL_FIELDS);
  const canais = channelSummary(data.receita, data.pl);
  const nr = total(data.novosRecorrentes, ["clientes_novos", "clientes_recorrentes", "receita_novos", "receita_recorrentes", "pedidos_novos", "pedidos_recorrentes"]);
  const serie = pivot(data.receita, "faturamento");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Receita" value={fmtBRL(t.faturamento)} />
        <Kpi label="Pedidos" value={fmtNum(t.pedidos)} hint={`Ticket ${fmtBRL(ratio(t.faturamento, t.pedidos))}`} />
        <Kpi label="Margem de contribuição" value={fmtBRL(pl.margem_contribuicao)} hint={`${fmtPct(pct(pl.margem_contribuicao, pl.receita_bruta))} da receita`} tone="up" />
        <Kpi label="Investimento aquisição" value={fmtBRL(t.invest_aquisicao)} hint={`Ads ${fmtBRL(t["invest_ads"])} · Afil. ${fmtBRL(t["invest_afiliados"])}`} />
        {/* Media e Affiliate separados (Plano Mestre, princípio 4): ROAS mídia usa só ads;
            o retorno de aquisição (MER) usa ads + afiliados sobre a receita total. */}
        <Kpi
          label="ROAS mídia"
          value={fmtX(ratio(t["receita_ads"], t["invest_ads"]))}
          hint={`Retorno aquisição (MER) ${fmtX(ratio(t.faturamento, t.invest_aquisicao))} · TACoS ${fmtPct(pct(t.invest_aquisicao, t.faturamento))}`}
          tone="warn"
        />
        <Kpi label="Clientes novos" value={fmtNum(nr.clientes_novos)} hint={`${fmtNum(nr.clientes_recorrentes)} recorrentes`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Receita por canal" className="xl:col-span-2">
          <StackedArea data={serie.data} keys={serie.series} />
        </Panel>
        <Panel title="Novos vs. recorrentes">
          <div className="space-y-4">
            <Split label="Clientes" a={nr.clientes_novos} b={nr.clientes_recorrentes} fmt={fmtNum} />
            <Split label="Pedidos" a={nr.pedidos_novos} b={nr.pedidos_recorrentes} fmt={fmtNum} />
            <Split label="Receita" a={nr.receita_novos} b={nr.receita_recorrentes} fmt={fmtBRL} />
            <Link to="/crm" className="inline-block text-sm font-medium text-primary hover:underline">Ver CRM / Growth →</Link>
          </div>
        </Panel>
      </div>

      <Panel title="Canais">
        <Table head={["Canal", "Receita", "Share", "Pedidos", "Invest. ads", "Invest. afil.", "ROAS mídia", "Retorno aquis.", "Custo canal", "CMV", "Margem contrib.", "Margem %"]}>
          {canais.map((c) => (
            <tr key={String(c.canal)}>
              <Td><span className="font-medium">{c.canal}</span></Td>
              <Td mono>{fmtBRL(c.faturamento)}</Td>
              <Td mono>{fmtPct(pct(c.faturamento, t.faturamento))}</Td>
              <Td mono>{fmtNum(c.pedidos)}</Td>
              <Td mono>{fmtBRL(c["invest_ads"])}</Td>
              <Td mono>{fmtBRL(c["invest_afiliados"])}</Td>
              <Td mono>{fmtX(ratio(c["receita_ads"], c["invest_ads"]))}</Td>
              <Td mono>{fmtX(ratio(c.faturamento, c.invest_aquisicao))}</Td>
              <Td mono>
                <span title={`Taxas ${fmtBRL(c["det_taxa"])} · Frete ${fmtBRL(c["det_frete"])} · Afiliado ${fmtBRL(c["det_afiliado"])}`}>{fmtBRL(c.custo_canal)}</span>
              </Td>
              <Td mono>{fmtBRL(c.cmv)}</Td>
              <Td mono className="text-success">{fmtBRL(c.margem_contribuicao)}</Td>
              <Td mono>{fmtPct(pct(c.margem_contribuicao, c.receita_bruta))}</Td>
            </tr>
          ))}
        </Table>
        <p className="mt-3 text-xs text-muted-foreground">
          Margem = receita − custo do canal (taxas, frete, afiliado) − ads − imposto − CMV (fonte: P&L por canal já calculado no banco). ROAS mídia = receita atribuída a ads ÷ investimento em ads (receita atribuída, não somar com a receita). Retorno aquisição (MER) = receita ÷ (ads + afiliados). Passe o mouse no custo do canal para ver o detalhe.
        </p>
      </Panel>
    </div>
  );
}

function Split({ label, a, b, fmt }: { label: string; a: number; b: number; fmt: (v: unknown) => string }) {
  const p = a + b ? (a / (a + b)) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>{label}</span><span>{fmtPct(p, 0)} novos</span></div>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div className="bg-primary" style={{ width: `${p}%` }} />
        <div className="bg-success" style={{ width: `${100 - p}%` }} />
      </div>
      <div className="mt-1 flex justify-between font-mono text-xs"><span className="text-primary">{fmt(a)}</span><span className="text-success">{fmt(b)}</span></div>
    </div>
  );
}
