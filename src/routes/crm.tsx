import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  PageHeader,
  Kpi,
  Panel,
  Loading,
  ErrorBox,
  Table,
  Td,
  CsvButton,
  StatusTag,
  Empty,
} from "@/components/kit";
import { Bars } from "@/components/charts";
import { getCrm } from "@/lib/data.functions";
import { sumBy, ratio, pct, buildCohort } from "@/lib/aggregate";
import { ACAO_LABEL, ACAO_TONE } from "@/domain/sources";
import { fmtBRL, fmtNum, fmtPct, fmtDate } from "@/lib/format";

// CRM / Growth OS (Plano Mestre caps. 11 e 12). Lê só as tabelas mv_growth_* que já existem
// e são atualizadas pelas rotinas do banco (atualiza_growth_mv). Percentuais seguem a mesma
// escala usada no Customer 360 (valores já em %).
export const Route = createFileRoute("/crm")({
  head: () => ({
    meta: [
      { title: "CRM / Growth — Soldiers Platform" },
      {
        name: "description",
        content:
          "Base de clientes da Soldiers: novos e recorrentes, RFM, LTV por canal, cohorts e próximas ações.",
      },
    ],
  }),
  component: Crm,
});

type R = Record<string, unknown>;

function Crm() {
  const fn = useServerFn(getCrm);
  const q = useQuery({ queryKey: ["crm"], queryFn: () => fn() });
  const gerado = (q.data?.["meses"] ?? [])[0]?.["gerado_em"];

  return (
    <>
      <PageHeader
        title="CRM / Growth"
        subtitle={`Quem são os clientes, de onde vêm e qual a próxima ação.${gerado ? ` Dados de ${fmtDate(gerado)}.` : ""}`}
      />
      {q.isLoading && <Loading />}
      {q.error && <ErrorBox error={q.error} />}
      {q.data && <Body d={q.data} />}
    </>
  );
}

function Body({ d }: { d: Record<string, R[]> }) {
  const meses = [...(d["meses"] ?? [])].sort((a, b) =>
    String(a["mes"]).localeCompare(String(b["mes"])),
  );
  const ultimo = meses.at(-1);
  const serie = meses.slice(-12).map((m) => ({
    mes: String(m["mes"]).slice(0, 7),
    Novos: Number(m["novos"]) || 0,
    Recorrentes: Number(m["recorrentes"]) || 0,
  }));
  const rfm = [...(d["rfm"] ?? [])].sort((a, b) => Number(b["receita"]) - Number(a["receita"]));
  const acoes = sumBy(d["acoes"] ?? [], "acao", [
    "clientes",
    "valor_esperado",
    "valor_historico",
  ]).sort((a, b) => Number(b["valor_esperado"]) - Number(a["valor_esperado"]));
  const origem = [...(d["origem"] ?? [])].sort(
    (a, b) => Number(b["receita"]) - Number(a["receita"]),
  );
  const cohort = buildCohort(d["cohort"] ?? []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label={`Clientes em ${ultimo ? String(ultimo["mes"]).slice(0, 7) : "—"}`}
          value={fmtNum(ultimo?.["clientes"])}
          hint={`${fmtNum(ultimo?.["novos"])} novos · ${fmtNum(ultimo?.["recorrentes"])} recorrentes`}
        />
        <Kpi
          label="% recorrentes no mês"
          value={fmtPct(pct(ultimo?.["recorrentes"], ultimo?.["clientes"]))}
        />
        <Kpi label="Receita do mês" value={fmtBRL(ultimo?.["receita"])} />
        <Kpi
          label="Valor esperado (ações)"
          value={fmtBRL(acoes.reduce((s, a) => s + (Number(a["valor_esperado"]) || 0), 0))}
          hint="soma do valor esperado em 90 dias"
          tone="up"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Novos × recorrentes (12 meses)" className="xl:col-span-2">
          {serie.length ? (
            <Bars data={serie} x="mes" keys={["Novos", "Recorrentes"]} money={false} />
          ) : (
            <Empty />
          )}
        </Panel>
        <Panel
          title="Próximas ações"
          right={
            <Link to="/clientes" className="text-xs text-primary hover:underline">
              Ver clientes →
            </Link>
          }
        >
          <Table head={["Ação", "Clientes", "Valor esperado"]}>
            {acoes.map((a) => (
              <tr key={String(a["acao"])}>
                <Td>
                  <StatusTag tone={ACAO_TONE[String(a["acao"])] ?? "muted"}>
                    {ACAO_LABEL[String(a["acao"])] ?? String(a["acao"])}
                  </StatusTag>
                </Td>
                <Td mono>{fmtNum(a["clientes"])}</Td>
                <Td mono>{fmtBRL(a["valor_esperado"])}</Td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>

      <div className="grid gap-6 2xl:grid-cols-2">
        <Panel title="Segmentos RFM" right={<CsvButton name="rfm-segmentos" rows={rfm} />}>
          <Table head={["Segmento", "Clientes", "Receita", "Ticket", "Recência (d)", "Frequência"]}>
            {rfm.map((r) => (
              <tr key={String(r["segmento"])}>
                <Td>
                  <span className="font-medium">{String(r["segmento"])}</span>
                </Td>
                <Td mono>{fmtNum(r["clientes"])}</Td>
                <Td mono>{fmtBRL(r["receita"])}</Td>
                <Td mono>{fmtBRL(r["ticket_medio"])}</Td>
                <Td mono>{fmtNum(r["recencia_media"])}</Td>
                <Td mono>
                  {Number(r["frequencia_media"] ?? 0)
                    .toFixed(2)
                    .replace(".", ",")}
                </Td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel
          title="Canal de entrada: qualidade do cliente"
          right={<CsvButton name="origem-canal" rows={origem} />}
        >
          <Table
            head={["Canal de entrada", "Clientes", "LTV médio", "Recompra", "Pedidos/cliente"]}
          >
            {origem.map((r) => (
              <tr key={String(r["canal_entrada"])}>
                <Td>
                  <span className="font-medium">{String(r["canal_entrada"])}</span>
                </Td>
                <Td mono>{fmtNum(r["clientes"])}</Td>
                <Td mono>{fmtBRL(r["ltv_medio"])}</Td>
                <Td mono>{fmtPct(r["pct_recompra"])}</Td>
                <Td mono>
                  {(ratio(r["pedidos"], r["clientes"]) ?? 0).toFixed(2).replace(".", ",")}
                </Td>
              </tr>
            ))}
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">
            Responde ao Plano Mestre cap. 12: quais canais trazem clientes de maior LTV.
          </p>
        </Panel>
      </div>

      <Panel title="Cohort mensal: % da safra que voltou a comprar">
        {cohort.safras.length ? (
          <Table head={["Safra", "Clientes", ...cohort.offsets.map((o) => `M${o}`)]}>
            {cohort.safras.map((s) => (
              <tr key={s.safra}>
                <Td mono>{s.safra}</Td>
                <Td mono>{fmtNum(s.tamanho)}</Td>
                {cohort.offsets.map((o) => {
                  const v = s.pct[o];
                  return (
                    <Td key={o} mono className={v == null ? "text-muted-foreground" : ""}>
                      <span
                        style={v != null ? { opacity: 0.45 + Math.min(v, 60) / 110 } : undefined}
                      >
                        {v == null ? "·" : fmtPct(v, 0)}
                      </span>
                    </Td>
                  );
                })}
              </tr>
            ))}
          </Table>
        ) : (
          <Empty />
        )}
      </Panel>
    </div>
  );
}
