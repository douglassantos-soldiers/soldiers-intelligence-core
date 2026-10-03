import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  PageHeader,
  PeriodPills,
  Kpi,
  Panel,
  Loading,
  ErrorBox,
  Table,
  Td,
  CsvButton,
  Empty,
} from "@/components/kit";
import { StackedArea, pivot } from "@/components/charts";
import { getMedia } from "@/lib/data.functions";
import { sumBy, total, ratio, pct } from "@/lib/aggregate";
import { fmtBRL, fmtNum, fmtPct, fmtX } from "@/lib/format";
import { periodo } from "@/lib/format";

// Media OS (Plano Mestre cap. 7). Só mídia paga: afiliados ficam em /affiliate (princípio 4).
// A receita aqui é ATRIBUÍDA pelas plataformas de anúncio: não é receita da Soldiers e não
// deve ser somada com a receita dos canais (cap. 13.2).
export const Route = createFileRoute("/media")({
  head: () => ({
    meta: [
      { title: "Media — Soldiers Platform" },
      {
        name: "description",
        content: "Mídia paga da Soldiers: investimento, receita atribuída, ROAS e funil por canal.",
      },
    ],
  }),
  component: Media,
});

const TIPO_FIELDS = ["investimento", "receita", "impressoes", "cliques", "unidades"];
const FUNIL_FIELDS = ["invest", "receita_ads", "impressoes", "cliques", "conversoes"];

function Media() {
  const [dias, setDias] = useState("30");
  const fn = useServerFn(getMedia);
  const p = periodo(dias);
  const q = useQuery({ queryKey: ["media", p], queryFn: () => fn({ data: p }) });

  return (
    <>
      <PageHeader
        title="Media"
        subtitle="Mídia paga por tipo e por canal de venda. Receita atribuída pelas plataformas, sem afiliados."
        right={<PeriodPills value={dias} onChange={setDias} />}
      />
      {q.isLoading && <Loading />}
      {q.error && <ErrorBox error={q.error} />}
      {q.data && <Body tipos={q.data.tipos} funil={q.data.funil} />}
    </>
  );
}

function Body({
  tipos,
  funil,
}: {
  tipos: Record<string, unknown>[];
  funil: Record<string, unknown>[];
}) {
  const t = total(tipos, TIPO_FIELDS);
  const porTipo = sumBy(tipos, "tipo", TIPO_FIELDS).sort(
    (a, b) => Number(b["investimento"]) - Number(a["investimento"]),
  );
  const porCanal = sumBy(funil, "canal", FUNIL_FIELDS).sort(
    (a, b) => Number(b["invest"]) - Number(a["invest"]),
  );
  const serie = pivot(tipos, "investimento", "tipo");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Kpi label="Investimento" value={fmtBRL(t["investimento"])} />
        <Kpi
          label="Receita atribuída"
          value={fmtBRL(t["receita"])}
          hint="reportada pelas plataformas; não somar com a receita"
        />
        <Kpi label="ROAS mídia" value={fmtX(ratio(t["receita"], t["investimento"]))} tone="warn" />
        <Kpi
          label="CTR"
          value={fmtPct(pct(t["cliques"], t["impressoes"]), 2)}
          hint={`${fmtNum(t["cliques"])} cliques`}
        />
        <Kpi label="CPC" value={fmtBRL(ratio(t["investimento"], t["cliques"]))} />
      </div>

      <Panel title="Investimento diário por tipo de campanha">
        {serie.data.length ? <StackedArea data={serie.data} keys={serie.series} /> : <Empty />}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Por tipo de campanha"
          right={<CsvButton name="media-por-tipo" rows={porTipo} />}
        >
          <Table
            head={["Tipo", "Invest.", "Receita atrib.", "ROAS", "Cliques", "CTR", "CPC", "Unid."]}
          >
            {porTipo.map((r) => (
              <tr key={String(r["tipo"])}>
                <Td>
                  <span className="font-medium">{String(r["tipo"])}</span>
                </Td>
                <Td mono>{fmtBRL(r["investimento"])}</Td>
                <Td mono>{fmtBRL(r["receita"])}</Td>
                <Td mono>{fmtX(ratio(r["receita"], r["investimento"]))}</Td>
                <Td mono>{fmtNum(r["cliques"])}</Td>
                <Td mono>{fmtPct(pct(r["cliques"], r["impressoes"]), 2)}</Td>
                <Td mono>{fmtBRL(ratio(r["investimento"], r["cliques"]))}</Td>
                <Td mono>{fmtNum(r["unidades"])}</Td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel
          title="Funil por canal de venda"
          right={<CsvButton name="media-funil-canal" rows={porCanal} />}
        >
          {porCanal.length ? (
            <Table
              head={[
                "Canal",
                "Invest.",
                "Impressões",
                "Cliques",
                "Conversões",
                "CTR",
                "Conv. %",
                "Custo/conv.",
                "ROAS",
              ]}
            >
              {porCanal.map((r) => (
                <tr key={String(r["canal"])}>
                  <Td>
                    <span className="font-medium">{String(r["canal"])}</span>
                  </Td>
                  <Td mono>{fmtBRL(r["invest"])}</Td>
                  <Td mono>{fmtNum(r["impressoes"])}</Td>
                  <Td mono>{fmtNum(r["cliques"])}</Td>
                  <Td mono>{fmtNum(r["conversoes"])}</Td>
                  <Td mono>{fmtPct(pct(r["cliques"], r["impressoes"]), 2)}</Td>
                  <Td mono>{fmtPct(pct(r["conversoes"], r["cliques"]), 2)}</Td>
                  <Td mono>{fmtBRL(ratio(r["invest"], r["conversoes"]))}</Td>
                  <Td mono>{fmtX(ratio(r["receita_ads"], r["invest"]))}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty />
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Taxas calculadas sobre os totais do período (não é média das taxas diárias). A base de
            conversão varia por canal (coluna base_conversao da view).
          </p>
        </Panel>
      </div>
    </div>
  );
}
