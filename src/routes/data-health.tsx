import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  PageHeader,
  Panel,
  Loading,
  ErrorBox,
  Table,
  Td,
  StatusTag,
  Empty,
  Kpi,
} from "@/components/kit";
import { getDataHealth } from "@/lib/data.functions";
import { diasDesde, semaforoFrescor, type Semaforo } from "@/lib/aggregate";
import { fmtNum, fmtDate, fmtBRL, fmtPct } from "@/lib/format";

// Data Health (Plano Mestre cap. 31): o dado está chegando? Antes de confiar em qualquer
// número das outras telas, esta tela mostra frescor, filas, erros de sincronização e
// problemas abertos. Só leitura.
export const Route = createFileRoute("/data-health")({
  head: () => ({
    meta: [
      { title: "Data Health — Soldiers Platform" },
      {
        name: "description",
        content: "Frescor dos dados, filas de sincronização e problemas abertos por fonte.",
      },
    ],
  }),
  component: DataHealth,
});

const TONE: Record<Semaforo, "success" | "warn" | "danger" | "muted"> = {
  ok: "success",
  atencao: "warn",
  critico: "danger",
  sem_dado: "muted",
};
const LABEL: Record<Semaforo, string> = {
  ok: "Em dia",
  atencao: "Atenção",
  critico: "Atrasado",
  sem_dado: "Sem dado",
};

function DataHealth() {
  const fn = useServerFn(getDataHealth);
  const q = useQuery({ queryKey: ["data-health"], queryFn: () => fn() });
  return (
    <>
      <PageHeader
        title="Data Health"
        subtitle="O dado está chegando? Frescor, filas, erros de sincronização e problemas abertos."
      />
      {q.isLoading && <Loading />}
      {q.error && <ErrorBox error={q.error} />}
      {q.data && <Body d={q.data} />}
    </>
  );
}

type D = Awaited<ReturnType<typeof getDataHealth>>;

function Body({ d }: { d: D }) {
  const fontes = d.fontes.map((f) => {
    const dias = diasDesde(f.ultimoDado);
    return { ...f, dias, sem: f.erro ? ("sem_dado" as Semaforo) : semaforoFrescor(dias) };
  });
  const atrasadas = fontes.filter((f) => f.sem === "critico").length;
  const atencao = fontes.filter((f) => f.sem === "atencao").length;
  const problemas = d.problemas;
  const porSev = problemas.reduce<Record<string, number>>((m, p) => {
    const k = String(p["severidade"] ?? "—");
    m[k] = (m[k] ?? 0) + 1;
    return m;
  }, {});
  const logsComErro = d.logs.reduce((s, l) => s + l.comErro, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="Fontes atrasadas"
          value={fmtNum(atrasadas)}
          hint={`${fmtNum(atencao)} em atenção · ${fontes.length} monitoradas`}
          tone={atrasadas ? "down" : "up"}
        />
        <Kpi
          label="Problemas abertos"
          value={fmtNum(problemas.length)}
          hint={
            Object.entries(porSev)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" · ") || "nenhum"
          }
          tone={problemas.length ? "warn" : "up"}
        />
        <Kpi
          label="Execuções com erro"
          value={fmtNum(logsComErro)}
          hint="nas últimas 50 de cada log"
          tone={logsComErro ? "warn" : "up"}
        />
        <Kpi label="Filas monitoradas" value={fmtNum(d.filas.length)} hint="últimos 30 dias" />
      </div>

      <Panel title="Frescor por fonte">
        <Table head={["Fonte", "Situação", "Último dado", "Dias", "Última carga"]}>
          {fontes.map((f) => (
            <tr key={f.fonte}>
              <Td>
                <span className="font-medium">{f.fonte}</span>
              </Td>
              <Td>
                <StatusTag tone={TONE[f.sem]}>
                  {f.erro ? "Erro de leitura" : LABEL[f.sem]}
                </StatusTag>
              </Td>
              <Td mono>{fmtDate(f.ultimoDado)}</Td>
              <Td mono>{f.dias ?? "—"}</Td>
              <Td mono>{f.carregadoEm ? fmtDate(f.carregadoEm) : "—"}</Td>
            </tr>
          ))}
        </Table>
        <p className="mt-3 text-xs text-muted-foreground">
          Fontes diárias chegam em D-1, então 1 dia é normal. 2–3 dias = atenção; mais que isso =
          atrasado.
        </p>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Filas de sincronização (30 dias)">
          <Table head={["Fila", "Status", "Máx. tentativas", "Último erro", "Atualizado"]}>
            {d.filas.map((f) => (
              <tr key={f.fila}>
                <Td>{f.fila}</Td>
                <Td>
                  {f.erro ? (
                    <StatusTag tone="muted">erro de leitura</StatusTag>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(f.porStatus).map(([s, n]) => (
                        <StatusTag key={s} tone="muted">
                          {s}: {n}
                        </StatusTag>
                      ))}
                    </div>
                  )}
                </Td>
                <Td mono className={f.maxTentativas >= 3 ? "text-warning" : ""}>
                  {fmtNum(f.maxTentativas)}
                </Td>
                <Td className="max-w-[240px] truncate text-xs text-muted-foreground">
                  <span title={f.ultimoErro ?? ""}>{f.ultimoErro ?? "—"}</span>
                </Td>
                <Td mono>{f.atualizado ? fmtDate(f.atualizado) : "—"}</Td>
              </tr>
            ))}
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">
            Os status aparecem como estão gravados em cada fila.
          </p>
        </Panel>

        <Panel title="Logs de sincronização">
          <Table head={["Integração", "Execuções", "Com erro", "Última execução", "Último erro"]}>
            {d.logs.map((l) => (
              <tr key={l.log}>
                <Td>{l.log}</Td>
                <Td mono>{fmtNum(l.execucoes)}</Td>
                <Td mono className={l.comErro ? "text-warning" : ""}>
                  {fmtNum(l.comErro)}
                </Td>
                <Td mono>{l.ultimaExecucao ? fmtDate(l.ultimaExecucao) : "—"}</Td>
                <Td className="max-w-[240px] truncate text-xs text-muted-foreground">
                  <span title={l.ultimoErro ?? ""}>
                    {l.erro ? `erro de leitura: ${l.erro}` : (l.ultimoErro ?? "—")}
                  </span>
                </Td>
              </tr>
            ))}
          </Table>
          {d.afiliadoMl.map((a, i) => (
            <p key={i} className="mt-3 text-xs text-muted-foreground">
              ML Afiliados: {String(a["situacao"] ?? "—")} · último dia ok{" "}
              {fmtDate(a["ultimo_dia_ok"])} · {fmtNum(a["dias_pendentes"])} dias pendentes ·{" "}
              {fmtNum(a["dias_erro"])} com erro · {fmtPct(a["pct_casou_ml_pedido"])} casados com
              pedido ML
            </p>
          ))}
        </Panel>
      </div>

      <Panel title="Problemas abertos (detectados pelo banco)">
        {problemas.length ? (
          <Table
            head={["Canal", "Problema", "Severidade", "Dias aberto", "Pedido", "Valor", "Data"]}
          >
            {problemas.slice(0, 100).map((p, i) => (
              <tr key={i}>
                <Td>{String(p["canal"] ?? "—")}</Td>
                <Td>{String(p["problema"] ?? "—")}</Td>
                <Td>
                  <StatusTag tone={/alta|crit/i.test(String(p["severidade"])) ? "danger" : "warn"}>
                    {String(p["severidade"] ?? "—")}
                  </StatusTag>
                </Td>
                <Td mono>{fmtNum(p["dias_aberto"])}</Td>
                <Td mono>{String(p["pedido"] ?? "—")}</Td>
                <Td mono>{fmtBRL(p["valor"])}</Td>
                <Td mono>{fmtDate(p["data"])}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Nenhum problema aberto.</Empty>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Fonte: vw_saude_shopify, vw_saude_ml, vw_saude_amazon.
        </p>
      </Panel>
    </div>
  );
}
