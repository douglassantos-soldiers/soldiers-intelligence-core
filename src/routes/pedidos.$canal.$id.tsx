import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";
import { getPedido } from "@/lib/data.functions";
import { Kpi, Panel, Loading, ErrorBox, Table, Td, StatusTag, Empty } from "@/components/kit";
import { custoMap } from "@/lib/aggregate";
import { fmtBRL, fmtBRL2, fmtNum, fmtPct, fmtDate } from "@/lib/format";

export const Route = createFileRoute("/pedidos/$canal/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe do pedido — Soldiers Platform" },
      { name: "description", content: "Itens, custo e margem de um pedido Soldiers." },
      { property: "og:title", content: "Detalhe do pedido — Soldiers Platform" },
      { property: "og:description", content: "Itens, custo e margem de um pedido." },
    ],
  }),
  component: Pedido,
});

function Pedido() {
  const { canal, id } = Route.useParams();
  const fn = useServerFn(getPedido);
  const q = useQuery({ queryKey: ["pedido", canal, id], queryFn: () => fn({ data: { canal, id } }) });
  const ped = q.data?.pedido as Record<string, string | number> | null | undefined;
  const custos = custoMap((q.data?.custos ?? []) as Record<string, unknown>[]);
  const itens = (q.data?.itens ?? []) as Record<string, string | number>[];
  const receita = itens.reduce((s, i) => s + (Number(i.valor_total) || 0), 0);
  const cmv = itens.reduce((s, i) => s + (Number(i.quantidade) || 0) * (custos.get(String(i.sku))?.custo ?? 0), 0);
  const taxa = itens.reduce((s, i) => s + (Number(i.sale_fee) || 0), 0);
  const semCusto = itens.some((i) => !custos.has(String(i.sku)));

  return (
    <>
      <Link to="/pedidos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Orders</Link>
      {q.isLoading && <Loading />}
      {q.error && <ErrorBox error={q.error} />}
      {q.data && !ped && <Empty>Pedido não encontrado.</Empty>}
      {ped && (
        <div className="space-y-6">
          <div>
            <div className="font-mono text-xs text-primary">{ped.canal} · {ped.pedido_id}</div>
            <h1 className="font-display text-3xl font-bold">Pedido de {fmtDate(ped.data)}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {ped.cliente_chave ? <Link to="/clientes/$chave" params={{ chave: String(ped.cliente_chave) }} className="text-foreground hover:text-primary">{ped.cliente}</Link> : <span>{ped.cliente}</span>}
              <span>{[ped.cidade, ped.uf].filter(Boolean).join(" / ")}</span>
              <StatusTag tone="muted">{ped.status}</StatusTag>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Kpi label="Valor" value={fmtBRL2(ped.valor)} />
            <Kpi label="Desconto" value={fmtBRL2(ped.desconto)} />
            <Kpi label="Frete" value={fmtBRL2(ped.frete)} />
            <Kpi label="Taxa do canal" value={fmtBRL2(taxa)} />
            <Kpi label="CMV" value={fmtBRL2(cmv)} hint={semCusto ? "algum item sem custo" : undefined} tone={semCusto ? "warn" : undefined} />
            <Kpi label="Margem bruta" value={fmtBRL2(receita - cmv - taxa)} hint={receita ? fmtPct(((receita - cmv - taxa) / receita) * 100) : undefined} tone="up" />
          </div>
          <Panel title="Itens">
            <Table head={["Produto", "SKU", "Qtd.", "Preço unit.", "Total", "Taxa", "Custo unit.", "Margem"]}>
              {itens.map((i) => {
                const c = custos.get(String(i.sku));
                const tot = Number(i.valor_total) || 0;
                return (
                  <tr key={String(i.linha)}>
                    <Td className="max-w-[380px] truncate">{i.sku ? <Link to="/produtos/$sku" params={{ sku: String(i.sku) }} className="hover:text-primary">{i.produto}</Link> : i.produto}{i.variacao ? <span className="text-muted-foreground"> · {i.variacao}</span> : null}</Td>
                    <Td mono>{i.sku || "—"}</Td>
                    <Td mono>{fmtNum(i.quantidade)}</Td>
                    <Td mono>{fmtBRL2(i.preco_unitario)}</Td>
                    <Td mono>{fmtBRL2(tot)}</Td>
                    <Td mono>{fmtBRL2(i.sale_fee)}</Td>
                    <Td mono>{c ? fmtBRL2(c.custo) : "—"}</Td>
                    <Td mono className="text-success">{c ? fmtBRL2(tot - c.custo * (Number(i.quantidade) || 0) - (Number(i.sale_fee) || 0)) : "—"}</Td>
                  </tr>
                );
              })}
            </Table>
          </Panel>
        </div>
      )}
    </>
  );
}
