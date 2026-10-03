import { createFileRoute, Link } from "@tanstack/react-router";
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
import { Bars, pivot } from "@/components/charts";
import { getAffiliate } from "@/lib/data.functions";
import { sumBy, total, ratio, pct } from "@/lib/aggregate";
import { fmtBRL, fmtNum, fmtPct, fmtX, periodo } from "@/lib/format";

// Affiliate OS (Plano Mestre cap. 8). Unidade separada de Media (princípio 4).
// Vendas de afiliado são receita ATRIBUÍDA ao afiliado: o pedido já está na receita do
// canal, então estes valores nunca são somados à receita (cap. 2.3 e 13.2).
export const Route = createFileRoute("/affiliate")({
  head: () => ({
    meta: [
      { title: "Affiliate — Soldiers Platform" },
      {
        name: "description",
        content:
          "Afiliados da Soldiers: vendas atribuídas, comissão e custo por canal e por publisher.",
      },
    ],
  }),
  component: Affiliate,
});

const AWIN_FIELDS = [
  "pedidos",
  "pedidos_recusados",
  "venda",
  "venda_aprovada",
  "venda_pendente",
  "venda_recusada",
  "comissao",
  "taxa_awin",
];
const PUB_FIELDS = ["pedidos", "venda", "comissao", "taxa_awin"];

function Affiliate() {
  const [dias, setDias] = useState("30");
  const fn = useServerFn(getAffiliate);
  const p = periodo(dias);
  const q = useQuery({ queryKey: ["affiliate", p], queryFn: () => fn({ data: p }) });

  return (
    <>
      <PageHeader
        title="Affiliate"
        subtitle="Vendas atribuídas a afiliados e custo do programa. Separado de Media."
        right={
          <div className="flex items-center gap-4">
            <Link to="/afiliados/hoje" className="text-sm font-medium text-primary hover:underline">
              O que fazer hoje →
            </Link>
            <PeriodPills value={dias} onChange={setDias} />
          </div>
        }
      />
      {q.isLoading && <Loading />}
      {q.error && <ErrorBox error={q.error} />}
      {q.data && <Body dia={q.data.dia} pub={q.data.pub} canal={q.data.canal} />}
    </>
  );
}

function Body({
  dia,
  pub,
  canal,
}: {
  dia: Record<string, unknown>[];
  pub: Record<string, unknown>[];
  canal: Record<string, unknown>[];
}) {
  const aw = total(dia, AWIN_FIELDS);
  const custoAwin = (aw["comissao"] ?? 0) + (aw["taxa_awin"] ?? 0);
  const canais = sumBy(canal, "canal", ["rec", "inv"]).sort(
    (a, b) => Number(b["rec"]) - Number(a["rec"]),
  );
  const tc = total(canal, ["rec", "inv"]);
  const pubs = sumBy(pub, "publisher", PUB_FIELDS).sort(
    (a, b) => Number(b["venda"]) - Number(a["venda"]),
  );
  const serie = pivot(canal, "rec");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Kpi
          label="Vendas atribuídas (todos)"
          value={fmtBRL(tc["rec"])}
          hint="atribuídas a afiliados; já estão na receita dos canais"
        />
        <Kpi label="Investimento afiliados" value={fmtBRL(tc["inv"])} />
        <Kpi label="Retorno afiliados" value={fmtX(ratio(tc["rec"], tc["inv"]))} tone="warn" />
        <Kpi
          label="Awin: vendas aprovadas"
          value={fmtBRL(aw["venda_aprovada"])}
          hint={`Pendentes ${fmtBRL(aw["venda_pendente"])} · Recusadas ${fmtBRL(aw["venda_recusada"])}`}
        />
        <Kpi
          label="Awin: custo"
          value={fmtBRL(custoAwin)}
          hint={`Comissão ${fmtBRL(aw["comissao"])} · Taxa Awin ${fmtBRL(aw["taxa_awin"])} · ${fmtPct(pct(custoAwin, aw["venda"]))} das vendas`}
        />
      </div>

      <Panel title="Vendas atribuídas a afiliados por canal">
        {serie.data.length ? (
          <Bars data={serie.data} x="data" keys={serie.series} xIsDate />
        ) : (
          <Empty />
        )}
      </Panel>

      <div className="grid gap-6 2xl:grid-cols-2">
        <Panel title="Por canal" right={<CsvButton name="afiliados-por-canal" rows={canais} />}>
          <Table head={["Canal", "Vendas atrib.", "Investimento", "Retorno", "Custo %"]}>
            {canais.map((r) => (
              <tr key={String(r["canal"])}>
                <Td>
                  <span className="font-medium">{String(r["canal"])}</span>
                </Td>
                <Td mono>{fmtBRL(r["rec"])}</Td>
                <Td mono>{fmtBRL(r["inv"])}</Td>
                <Td mono>{fmtX(ratio(r["rec"], r["inv"]))}</Td>
                <Td mono>{fmtPct(pct(r["inv"], r["rec"]))}</Td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Publishers Awin" right={<CsvButton name="awin-publishers" rows={pubs} />}>
          {pubs.length ? (
            <Table head={["Publisher", "Pedidos", "Vendas", "Comissão", "Taxa Awin", "Custo %"]}>
              {pubs.slice(0, 50).map((r) => (
                <tr key={String(r["publisher"])}>
                  <Td className="max-w-[260px] truncate">{String(r["publisher"])}</Td>
                  <Td mono>{fmtNum(r["pedidos"])}</Td>
                  <Td mono>{fmtBRL(r["venda"])}</Td>
                  <Td mono>{fmtBRL(r["comissao"])}</Td>
                  <Td mono>{fmtBRL(r["taxa_awin"])}</Td>
                  <Td mono>
                    {fmtPct(pct(Number(r["comissao"]) + Number(r["taxa_awin"]), r["venda"]))}
                  </Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty />
          )}
        </Panel>
      </div>
      <p className="text-xs text-muted-foreground">
        Vendas Awin incluem pendentes e recusadas; só as aprovadas geram comissão definitiva.
        Creators de TikTok Shop, Mercado Livre e Shopee Afiliados entram na Fase 5 do Plano Mestre.
      </p>
    </div>
  );
}
