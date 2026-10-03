import { useState } from "react";
import { PeriodPills, Kpi, Panel, Loading, ErrorBox, Pills } from "@/components/kit";
import { StackedArea, Bars, pivot } from "@/components/charts";
import { aggregateProdutos, ProductTable } from "@/components/product-table";
import { useOverview, useProdutos } from "@/lib/queries";
import { channelSummary, ratio, pct } from "@/lib/aggregate";
import { fmtBRL, fmtNum, fmtPct, fmtX } from "@/lib/format";

/** Visão operacional de um conjunto de canais (Commerce = Site; Marketplace = ML/Amazon/Shopee/TikTok). */
export function ChannelView({ canais, dias, setDias }: { canais: readonly string[]; dias: string; setDias: (v: string) => void }) {
  const [foco, setFoco] = useState<string>(canais.length > 1 ? "todos" : canais[0]);
  const ov = useOverview(dias);
  const prod = useProdutos(dias, foco === "todos" ? undefined : foco);
  const sel = foco === "todos" ? canais : [foco];

  const rec = (ov.data?.receita ?? []).filter((r) => sel.includes(String(r.canal)));
  const pl = (ov.data?.pl ?? []).filter((r) => sel.includes(String(r.canal)));
  const resumo = channelSummary(rec, pl);
  const t = resumo.reduce<Record<string, number>>((s, c) => {
    for (const k of ["faturamento", "pedidos", "invest_ads", "receita_ads", "invest_afiliados", "invest_aquisicao", "margem_contribuicao", "receita_bruta", "cmv", "custo_canal"]) s[k] = (s[k] ?? 0) + (Number(c[k]) || 0);
    return s;
  }, {});
  const chart = pivot(rec, "faturamento");
  const produtos = prod.data ? aggregateProdutos({ ...prod.data, rows: prod.data.rows.filter((r) => sel.includes(String(r.canal))) }) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {canais.length > 1 ? (
          <Pills value={foco} onChange={setFoco} options={[{ id: "todos", label: "Todos" }, ...canais.map((c) => ({ id: c, label: c }))]} />
        ) : <span />}
        <PeriodPills value={dias} onChange={setDias} />
      </div>
      {ov.isLoading && <Loading />}
      {ov.error && <ErrorBox error={ov.error} />}
      {ov.data && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Kpi label="Receita" value={fmtBRL(t.faturamento)} />
            <Kpi label="Pedidos" value={fmtNum(t.pedidos)} hint={`Ticket ${fmtBRL(ratio(t.faturamento, t.pedidos))}`} />
            <Kpi label="Custo do canal" value={fmtBRL(t.custo_canal)} hint={`${fmtPct(pct(t.custo_canal, t.receita_bruta))} (taxas, frete, afiliado)`} />
            <Kpi label="Ads" value={fmtBRL(t.invest_ads)} hint={`ROAS ads ${fmtX(ratio(t.receita_ads, t.invest_ads))}`} />
            <Kpi label="TACoS" value={fmtPct(pct(t.invest_aquisicao, t.faturamento))} tone="warn" />
            <Kpi label="Margem contrib." value={fmtBRL(t.margem_contribuicao)} hint={fmtPct(pct(t.margem_contribuicao, t.receita_bruta))} tone="up" />
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <Panel title="Receita diária" className="xl:col-span-2"><StackedArea data={chart.data} keys={chart.series} /></Panel>
            <Panel title="Margem por canal">
              <Bars data={resumo.map((c) => ({ canal: c.canal, Margem: c.margem_contribuicao, Ads: c.invest_ads, CMV: c.cmv }))} x="canal" keys={["CMV", "Ads", "Margem"]} />
            </Panel>
          </div>
        </>
      )}
      <Panel title="Produtos (SKU)">
        {prod.isLoading ? <Loading /> : prod.error ? <ErrorBox error={prod.error} /> : <ProductTable rows={produtos} limit={30} />}
      </Panel>
    </div>
  );
}
