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
  StatusTag,
  Empty,
} from "@/components/kit";
import { ErrosLeitura } from "@/components/erros-leitura";
import { getCrmBase } from "@/lib/clientes.functions";
import { fmtNum, fmtPct } from "@/lib/format";

// Estado e saúde da base, consentimento e cliente único (Plano Mestre caps. 11.3, 11.8, 13.1 e 32).
// As contagens são feitas no banco (sem trazer clientes para o app). Só leitura.
export const Route = createFileRoute("/crm_/base")({
  head: () => ({
    meta: [
      { title: "Estado da base — Soldiers Platform" },
      {
        name: "description",
        content:
          "Quantos clientes estão novos, recorrentes, fiéis, em risco, adormecidos ou perdidos; consentimento e cliente único.",
      },
    ],
  }),
  component: Base,
});

type D = Awaited<ReturnType<typeof getCrmBase>>;
const TOM_SAUDE: Record<string, "success" | "warn" | "danger" | "muted"> = {
  saudável: "success",
  atenção: "warn",
  "em risco": "danger",
  perdido: "muted",
};

function Base() {
  const fn = useServerFn(getCrmBase);
  const q = useQuery({ queryKey: ["crm-base"], queryFn: () => fn() });
  return (
    <>
      <PageHeader
        title="Estado da base"
        subtitle="Em que estado está cada cliente, quem pode receber mensagem e quantos compram em mais de um canal."
        right={
          <Link to="/crm/acao" className="text-sm font-medium text-primary hover:underline">
            Fila de ação →
          </Link>
        }
      />
      {q.isLoading && <Loading />}
      {q.error && <ErrorBox error={q.error} />}
      {q.data && <Body d={q.data} />}
    </>
  );
}

function Body({ d }: { d: D }) {
  const e = d.estados;
  const cs = d.consentimento;
  const cu = d.clienteUnico;
  const saudavel = e.saude.find((s) => s.saude === "saudável");
  return (
    <div className="space-y-6">
      <ErrosLeitura erros={d.erros} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        <Kpi
          label="Clientes na base"
          value={fmtNum(e.total)}
          hint={d.semDado ? `${fmtNum(d.semDado)} sem data de compra` : undefined}
        />
        <Kpi
          label="Saudáveis"
          value={fmtPct(saudavel?.pct, 0)}
          hint={`${fmtNum(saudavel?.clientes)} clientes`}
          tone="up"
        />
        <Kpi
          label="Leads sem compra (90d)"
          value={fmtNum(d.leads90.semCompra)}
          hint={`${fmtNum(d.leads90.compraram)} de ${fmtNum(d.leads90.leads)} compraram`}
        />
        <Kpi
          label="Aceitam marketing"
          value={fmtPct(cs.aceitaPct, 0)}
          hint="itens do site, 12 meses"
        />
        <Kpi
          label="Compram em 2+ canais"
          value={fmtPct(cu.multiPct, 1)}
          hint={`${fmtNum(cu.doisCanais + cu.tresMais)} clientes`}
        />
        <Kpi label="Ids internos" value={fmtNum(cu.idsInternos)} hint="dim_cliente" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Estado do cliente" className="xl:col-span-2">
          <Table head={["Estado", "Regra", "Clientes", "% da base", "Saúde"]}>
            {e.linhas.map((l) => (
              <tr key={l.estado}>
                <Td>
                  <span className="font-medium">{l.label}</span>
                </Td>
                <Td className="text-xs text-muted-foreground">{l.regra}</Td>
                <Td mono>{fmtNum(l.clientes)}</Td>
                <Td mono>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 rounded bg-muted">
                      <div
                        className="h-2 rounded bg-primary"
                        style={{ width: `${Math.min(100, l.pct ?? 0)}%` }}
                      />
                    </div>
                    {fmtPct(l.pct, 1)}
                  </div>
                </Td>
                <Td>
                  <StatusTag tone={TOM_SAUDE[l.saude] ?? "muted"}>{l.saude}</StatusTag>
                </Td>
              </tr>
            ))}
          </Table>
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
            <li>
              As regras são testadas de baixo para cima: primeiro perdido e adormecido (dias sem
              comprar), depois em risco (ritmo), depois pedidos.
            </li>
            <li>
              "Ritmo" usa razao_ritmo do banco (dias sem comprar ÷ ritmo do cliente). Estado é foto
              de hoje; a linha do tempo por mês precisa de uma foto diária gravada no banco (ainda
              não existe).
            </li>
          </ul>
        </Panel>
        <Panel title="Saúde da base">
          <Table head={["Saúde", "Clientes", "%"]}>
            {e.saude.map((s) => (
              <tr key={s.saude}>
                <Td>
                  <StatusTag tone={TOM_SAUDE[s.saude] ?? "muted"}>{s.saude}</StatusTag>
                </Td>
                <Td mono>{fmtNum(s.clientes)}</Td>
                <Td mono>{fmtPct(s.pct, 1)}</Td>
              </tr>
            ))}
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">
            Saudável = novo, recorrente ou fiel. Atenção = em risco. Em risco = adormecido.
          </p>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Consentimento de marketing">
          {cs.base ? (
            <Table head={["Situação", "% dos itens vendidos no site (12 meses)"]}>
              <tr>
                <Td>
                  <StatusTag tone="success">aceita</StatusTag>
                </Td>
                <Td mono>{fmtPct(cs.aceitaPct, 1)}</Td>
              </tr>
              <tr>
                <Td>
                  <StatusTag tone="danger">não aceita</StatusTag>
                </Td>
                <Td mono>{fmtPct(cs.recusaPct, 1)}</Td>
              </tr>
              <tr>
                <Td>
                  <StatusTag tone="muted">sem informação</StatusTag>
                </Td>
                <Td mono>{fmtPct(cs.semInfoPct, 1)}</Td>
              </tr>
            </Table>
          ) : (
            <Empty />
          )}
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
            <li>
              Fonte: o campo accepts_marketing dos pedidos do Shopify. Conta itens de pedido, então
              é uma aproximação por cliente.
            </li>
            <li>
              Clientes de marketplace não trazem consentimento: só podem ser impactados por mídia no
              próprio canal.
            </li>
            <li>
              WhatsApp precisa de opt-in próprio, que o banco ainda não registra. Lacuna de LGPD
              para a Fase 3.
            </li>
          </ul>
        </Panel>
        <Panel title="Cliente único entre canais">
          {cu.clientes ? (
            <Table head={["Comprou em", "Clientes", "%"]}>
              {(
                [
                  ["1 canal", cu.umCanal],
                  ["2 canais", cu.doisCanais],
                  ["3 ou mais", cu.tresMais],
                ] as const
              ).map(([k, v]) => (
                <tr key={k}>
                  <Td>{k}</Td>
                  <Td mono>{fmtNum(v)}</Td>
                  <Td mono>{fmtPct(cu.clientes ? (v / cu.clientes) * 100 : null, 1)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty />
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            O mesmo cliente_chave em mais de um canal significa que a identidade foi ligada
            (atualiza_identidade_cliente). IDs externos de marketplace e de CRM (RD, Klaviyo) ainda
            não entram no cliente único.
          </p>
        </Panel>
      </div>
    </div>
  );
}
