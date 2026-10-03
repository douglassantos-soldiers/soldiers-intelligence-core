import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getPedidos } from "@/lib/data.functions";
import { PageHeader, PeriodPills, Pills, Panel, Loading, ErrorBox, Table, Td, SearchBox, StatusTag, CsvButton, Empty } from "@/components/kit";
import { CANAIS_PEDIDO, canalVenda } from "@/domain/sources";
import { fmtBRL, fmtNum, fmtDate, periodo } from "@/lib/format";

export const Route = createFileRoute("/pedidos/")({
  head: () => ({
    meta: [
      { title: "Orders — Soldiers Platform" },
      { name: "description", content: "Pedidos de todos os canais da Soldiers, com cliente, valor, desconto, frete e status." },
      { property: "og:title", content: "Orders — Soldiers Platform" },
      { property: "og:description", content: "Pedidos unificados da Soldiers Nutrition." },
    ],
  }),
  component: Pedidos,
});

function statusTone(s: string): "success" | "warn" | "danger" | "muted" | "primary" {
  const x = s.toLowerCase();
  if (/(cancel|refund|reject|return|lost|undeliver|expired)/.test(x)) return "danger";
  if (/(deliver|completed|paid|shipped)/.test(x)) return "success";
  if (/(pending|await|hold|unpaid|unshipped)/.test(x)) return "warn";
  return "muted";
}

function Pedidos() {
  const [canal, setCanal] = useState<string>("Shopify");
  const [dias, setDias] = useState("7");
  const [busca, setBusca] = useState("");
  const [buscaAtiva, setBuscaAtiva] = useState("");
  const [page, setPage] = useState(0);
  const fn = useServerFn(getPedidos);
  const p = periodo(dias);
  const q = useQuery({
    queryKey: ["pedidos", canal, p, buscaAtiva, page],
    queryFn: () => fn({ data: { ...p, canal, busca: buscaAtiva || undefined, page } }),
    placeholderData: keepPreviousData,
  });
  const rows = (q.data ?? []) as Record<string, string | number>[];

  return (
    <>
      <PageHeader title="Orders" subtitle="Pedidos com cliente unificado. Escolha o canal e o período." right={<PeriodPills value={dias} onChange={(v) => { setDias(v); setPage(0); }} />} />
      <div className="mb-4">
        <Pills value={canal} onChange={(v) => { setCanal(v); setPage(0); }} options={CANAIS_PEDIDO.map((c) => ({ id: c, label: canalVenda(c) }))} />
      </div>
      <form className="mb-4 flex flex-wrap gap-3" onSubmit={(e) => { e.preventDefault(); setBuscaAtiva(busca); setPage(0); }}>
        <SearchBox value={busca} onChange={setBusca} placeholder="Buscar pelo número do pedido (Enter)" />
        <CsvButton name={`pedidos-${canal}`} rows={rows} />
      </form>
      <Panel>
        {q.isLoading && <Loading />}
        {q.error && <ErrorBox error={q.error} />}
        {q.data && !rows.length && <Empty>Nenhum pedido encontrado.</Empty>}
        {rows.length > 0 && (
          <Table head={["Data", "Pedido", "Cliente", "UF", "Valor", "Desconto", "Frete", "Itens", "Pagamento", "Status"]}>
            {rows.map((r) => (
              <tr key={String(r.pedido_id)} className="hover:bg-accent/40">
                <Td mono>{fmtDate(r.data)}</Td>
                <Td mono><Link to="/pedidos/$canal/$id" params={{ canal: String(r.canal), id: String(r.pedido_id) }} className="hover:text-primary">{r.pedido_id}</Link></Td>
                <Td>{r.cliente_chave ? <Link to="/clientes/$chave" params={{ chave: String(r.cliente_chave) }} className="hover:text-primary">{r.cliente}</Link> : r.cliente}</Td>
                <Td>{r.uf || "—"}</Td>
                <Td mono>{fmtBRL(r.valor)}</Td>
                <Td mono>{fmtBRL(r.desconto)}</Td>
                <Td mono>{fmtBRL(r.frete)}</Td>
                <Td mono>{fmtNum(r.itens)}</Td>
                <Td className="text-muted-foreground">{r.pagamento_metodo || "—"}</Td>
                <Td><StatusTag tone={statusTone(String(r.status ?? ""))}>{r.status || "—"}</StatusTag></Td>
              </tr>
            ))}
          </Table>
        )}
        {!buscaAtiva && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <button disabled={page === 0} onClick={() => setPage((x) => x - 1)} className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40">← Anterior</button>
            <span className="text-muted-foreground">Página {page + 1}</span>
            <button disabled={rows.length < 50} onClick={() => setPage((x) => x + 1)} className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40">Próxima →</button>
          </div>
        )}
      </Panel>
    </>
  );
}
