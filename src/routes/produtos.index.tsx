import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, PeriodPills, Kpi, Panel, Loading, ErrorBox, SearchBox, CsvButton, Select } from "@/components/kit";
import { aggregateProdutos, ProductTable } from "@/components/product-table";
import { useProdutos } from "@/lib/queries";
import { CANAIS_VENDA } from "@/domain/sources";
import { fmtBRL, fmtNum, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/produtos/")({
  head: () => ({
    meta: [
      { title: "Product 360 — Soldiers Platform" },
      { name: "description", content: "Ranking de SKUs da Soldiers com receita, margem, mídia, recompra e estoque." },
      { property: "og:title", content: "Product 360 — Soldiers Platform" },
      { property: "og:description", content: "Inteligência de produto em todos os canais." },
    ],
  }),
  component: Produtos,
});

function Produtos() {
  const [dias, setDias] = useState("28");
  const [canal, setCanal] = useState("");
  const [busca, setBusca] = useState("");
  const q = useProdutos(dias, canal || undefined);
  const all = q.data ? aggregateProdutos(q.data) : [];
  const b = busca.trim().toLowerCase();
  const rows = b ? all.filter((r) => r.produto.toLowerCase().includes(b) || r.sku.toLowerCase().includes(b)) : all;
  const receita = all.reduce((s, r) => s + r.receita, 0);
  const comCusto = all.filter((r) => r.cmv != null);
  const recCusto = comCusto.reduce((s, r) => s + r.receita, 0);
  const margem = comCusto.reduce((s, r) => s + (r.margem ?? 0), 0);

  return (
    <>
      <PageHeader title="Product 360" subtitle="Vendas, margem, mídia, recompra e estoque por SKU." right={<PeriodPills value={dias} onChange={setDias} />} />
      {q.isLoading && <Loading />}
      {q.error && <ErrorBox error={q.error} />}
      {q.data && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi label="SKUs vendidos" value={fmtNum(all.length)} />
            <Kpi label="Receita" value={fmtBRL(receita)} />
            <Kpi label="Margem pós-CMV e ads" value={fmtBRL(margem)} hint={`${fmtPct(recCusto ? (margem / recCusto) * 100 : null)} · cobre ${fmtPct(receita ? (recCusto / receita) * 100 : null, 0)} da receita`} tone="up" />
            <Kpi label="SKUs sem custo" value={fmtNum(all.length - comCusto.length)} tone="warn" hint="cadastrar em dim_custo_sku" />
          </div>
          <div className="mb-4 flex flex-wrap gap-3">
            <SearchBox value={busca} onChange={setBusca} placeholder="Buscar por produto ou SKU" />
            <Select value={canal} onChange={setCanal} options={[{ id: "", label: "Todos os canais" }, ...CANAIS_VENDA.map((c) => ({ id: c, label: c }))]} />
            <CsvButton name="produtos" rows={rows.map(({ canais, ...r }) => ({ ...r, canais: [...canais].join(", ") }))} />
          </div>
          <Panel><ProductTable rows={rows} limit={200} /></Panel>
        </>
      )}
    </>
  );
}
