import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Panel, Table, Td, StatusTag, Empty } from "@/components/kit";
import { getClienteAcao } from "@/lib/clientes.functions";
import { ESTADO_LABEL, ESTADO_REGRA_TEXTO } from "@/lib/clientes360";
import { fmtDate } from "@/lib/format";

// Customer 360: estado, saúde, próxima melhor ação com canal e afinidade por produto (Plano Mestre caps. 11.3–11.8).
// A ação fica "aguardando aprovação": envio só na Fase 3 (Policy + Approval + Audit).
const TOM_SAUDE: Record<string, "success" | "warn" | "danger" | "muted"> = {
  saudável: "success",
  atenção: "warn",
  "em risco": "danger",
  perdido: "muted",
};

export function ClienteAcao({ chave }: { chave: string }) {
  const fn = useServerFn(getClienteAcao);
  const q = useQuery({ queryKey: ["cliente-acao", chave], queryFn: () => fn({ data: { chave } }) });
  const d = q.data;
  if (!d?.acao) return null;
  const a = d.acao;
  const cs = d.consentimento;
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Panel title="Estado e próxima ação">
        <dl className="space-y-2 text-sm">
          {(
            [
              [
                "Estado",
                <StatusTag key="e" tone="primary">
                  {ESTADO_LABEL[a.estado]}
                </StatusTag>,
              ],
              [
                "Saúde",
                <StatusTag key="s" tone={TOM_SAUDE[a.saude] ?? "muted"}>
                  {a.saude}
                </StatusTag>,
              ],
              ["Ação", a.acao],
              ["Quando", a.quando],
              ["Produto", a.produto || "—"],
              ["Canal", a.canal],
              [
                "Consentimento",
                cs.aceita == null && cs.whatsapp == null
                  ? "sem registro"
                  : `e-mail ${cs.aceita == null ? "—" : cs.aceita ? "sim" : "não"}${
                      cs.whatsapp == null ? "" : ` · WhatsApp ${cs.whatsapp ? "sim" : "não"}`
                    } (${cs.fonte === "registro" ? "registro" : "pedido do site"}, ${fmtDate(cs.desde)})`,
              ],
              [
                "Envio",
                <StatusTag key="ap" tone="warn">
                  {a.aprovacao}
                </StatusTag>,
              ],
            ] as const
          ).map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between gap-4 border-b border-border pb-2 last:border-0"
            >
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          {ESTADO_REGRA_TEXTO[a.estado]}. Canal: {a.porqueCanal}
        </p>
      </Panel>
      <Panel title="Afinidade por produto (nota)" className="xl:col-span-2">
        {d.afinidade.length ? (
          <Table head={["Produto", "Nota", "", "Por quê"]}>
            {d.afinidade.map((x) => (
              <tr key={x.sku}>
                <Td className="max-w-[300px] truncate">
                  <Link to="/produtos/$sku" params={{ sku: x.sku }} className="hover:text-primary">
                    {x.produto}
                  </Link>
                </Td>
                <Td mono>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 rounded bg-muted">
                      <div className="h-2 rounded bg-primary" style={{ width: `${x.nota}%` }} />
                    </div>
                    {x.nota}
                  </div>
                </Td>
                <Td>
                  <StatusTag tone={x.origem === "comprou" ? "muted" : "success"}>
                    {x.origem}
                  </StatusTag>
                </Td>
                <Td className="text-xs text-muted-foreground">{x.motivo}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty />
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Nota 0–100: para o que comprou, 60% fatia das unidades + 40% recência; "sugerido" vem de
          quem compra o mesmo produto. Regra explicável, não modelo treinado.
        </p>
      </Panel>
    </div>
  );
}
