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
import { StackedArea, pivot } from "@/components/charts";
import { getMedia } from "@/lib/data.functions";
import type { novosParaMarca } from "@/lib/amazon";
import { sumBy, total, ratio, pct } from "@/lib/aggregate";
import { fmtBRL, fmtBRL2, fmtNum, fmtPct, fmtX } from "@/lib/format";
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
  const [dias, setDias] = useState("28");
  const fn = useServerFn(getMedia);
  const p = periodo(dias);
  const q = useQuery({ queryKey: ["media", p], queryFn: () => fn({ data: p }) });

  return (
    <>
      <PageHeader
        title="Media"
        subtitle="Mídia paga por tipo e por canal de venda. Receita atribuída pelas plataformas, sem afiliados."
        right={
          <div className="flex items-center gap-4">
            <Link to="/media/meta" className="text-sm font-medium text-primary hover:underline">
              Meta Ads →
            </Link>
            <Link to="/media/google" className="text-sm font-medium text-primary hover:underline">
              Google Ads →
            </Link>
            <PeriodPills value={dias} onChange={setDias} />
          </div>
        }
      />
      {q.isLoading && <Loading />}
      {q.error && <ErrorBox error={q.error} />}
      {q.data && (
        <Body
          tipos={q.data.tipos}
          funil={q.data.funil}
          amazonNtb={(q.data as { amazonNtb?: Ntb }).amazonNtb ?? null}
        />
      )}
    </>
  );
}

type Ntb = ReturnType<typeof novosParaMarca> | null;

function Body({
  tipos,
  funil,
  amazonNtb,
}: {
  tipos: Record<string, unknown>[];
  funil: Record<string, unknown>[];
  amazonNtb: Ntb;
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
        <Kpi label="CPC" value={fmtBRL2(ratio(t["investimento"], t["cliques"]))} />
      </div>

      <Panel title="Investimento diário por tipo de campanha">
        {serie.data.length ? <StackedArea data={serie.data} keys={serie.series} /> : <Empty />}
      </Panel>

      <div className="grid gap-6 2xl:grid-cols-2">
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
                <Td mono>{fmtBRL2(ratio(r["investimento"], r["cliques"]))}</Td>
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
                  <Td mono>{fmtBRL2(ratio(r["invest"], r["conversoes"]))}</Td>
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

      {amazonNtb && <AmazonNtb n={amazonNtb} />}
    </div>
  );
}

// Amazon Ads: clientes novos para a marca (Plano Mestre cap. 10; benchmarks/amazon/ANALISE.md §4 item 5).
// "Novo para a marca" é a definição da Amazon (sem compra da marca nos 12 meses anteriores).
function AmazonNtb({ n }: { n: NonNullable<Ntb> }) {
  return (
    <Panel
      title="Amazon Ads: clientes novos para a marca"
      right={<CsvButton name="amazon-novos-para-marca" rows={n.campanhas} />}
    >
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="Sponsored Brands: venda de novos"
          value={fmtPct(n.sb.pctNtb, 0)}
          hint={`${fmtBRL(n.sb.ntbVendas)} de ${fmtBRL(n.sb.vendas)} atribuídos`}
        />
        <Kpi
          label="SB: custo por cliente novo"
          value={fmtBRL2(n.sb.custoPorNovo)}
          hint={`${fmtNum(n.sb.ntbCompras)} compras de novos`}
        />
        <Kpi
          label="Sponsored Display: venda de novos"
          value={fmtPct(n.sd.pctNtb, 0)}
          hint={`${fmtBRL(n.sd.ntbVendas)} de ${fmtBRL(n.sd.vendas)} (só por clique)`}
        />
        <Kpi
          label="SD: custo por cliente novo"
          value={fmtBRL2(n.sd.custoPorNovo)}
          hint={`${fmtNum(n.sd.ntbCompras)} compras de novos`}
        />
      </div>
      {n.campanhas.length ? (
        <Table
          head={[
            "Campanha",
            "Tipo",
            "Investido",
            "Vendas atrib.",
            "De clientes novos",
            "% novos",
            "Custo por novo",
          ]}
        >
          {n.campanhas.map((c) => (
            <tr key={`${c.tipo}|${c.campanha}`}>
              <Td className="max-w-[280px] truncate">{c.campanha}</Td>
              <Td>{c.tipo}</Td>
              <Td mono>{fmtBRL(c.custo)}</Td>
              <Td mono>{fmtBRL(c.vendas)}</Td>
              <Td mono>{fmtBRL(c.ntbVendas)}</Td>
              <Td mono>{fmtPct(c.pctNtb, 0)}</Td>
              <Td mono>{fmtBRL2(c.custoPorNovo)}</Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty />
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Venda atribuída pela Amazon, não somar com a receita. Cliente novo para a marca, segundo a
        Amazon, é quem não comprou Soldiers na Amazon nos 12 meses anteriores: não é o mesmo
        conceito de cliente novo do CRM.
      </p>
    </Panel>
  );
}
