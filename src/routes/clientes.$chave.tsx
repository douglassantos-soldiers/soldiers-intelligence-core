import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";
import { getCliente } from "@/lib/data.functions";
import { Kpi, Panel, Loading, ErrorBox, Table, Td, StatusTag, Empty } from "@/components/kit";
import { fmtBRL, fmtNum, fmtPct, fmtDate } from "@/lib/format";
import { custoHistorico, custoNaData } from "@/lib/aggregate";
import { ACAO_LABEL, ACAO_TONE, canalVenda } from "@/domain/sources";
import { ClienteAcao } from "@/components/cliente-acao";

export const Route = createFileRoute("/clientes/$chave")({
  head: () => ({
    meta: [
      { title: "Ficha do cliente — Soldiers Platform" },
      { name: "description", content: "Visão 360 de um cliente: pedidos, produtos, margem, ritmo e próxima recompra." },
      { property: "og:title", content: "Ficha do cliente — Soldiers Platform" },
      { property: "og:description", content: "Visão 360 de um cliente Soldiers." },
    ],
  }),
  component: Cliente,
});

function Cliente() {
  const { chave } = Route.useParams();
  const fn = useServerFn(getCliente);
  const q = useQuery({ queryKey: ["cliente", chave], queryFn: () => fn({ data: { chave } }) });

  return (
    <>
      <Link to="/clientes" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Customer 360</Link>
      {q.isLoading && <Loading />}
      {q.error && <ErrorBox error={q.error} />}
      {q.data && <Body d={q.data} />}
    </>
  );
}

function Body({ d }: { d: Awaited<ReturnType<typeof getCliente>> }) {
  const { chave } = Route.useParams();
  const p = (d.perfil ?? {}) as Record<string, string | number>;
  const o = (d.origem ?? {}) as Record<string, string | number>;
  const c = d.contato;
  // Custo vigente na data de cada item (não o último cadastrado).
  const custos = custoHistorico(d.custos as Record<string, unknown>[]);

  const prodMap = new Map<string, { sku: string; produto: string; unidades: number; receita: number; cmv: number; temCusto: boolean }>();
  for (const i of d.itens as Record<string, string | number>[]) {
    const sku = String(i.sku ?? "—");
    const cur = prodMap.get(sku) ?? { sku, produto: String(i.produto ?? ""), unidades: 0, receita: 0, cmv: 0, temCusto: custos.has(sku) };
    cur.unidades += Number(i.quantidade) || 0;
    cur.receita += Number(i.valor_total) || 0;
    cur.cmv += (Number(i["quantidade"]) || 0) * (custoNaData(custos, sku, i["data"])?.custo ?? 0);
    prodMap.set(sku, cur);
  }
  const produtos = [...prodMap.values()].sort((a, b) => b.receita - a.receita);
  const receitaItens = produtos.reduce((s, x) => s + x.receita, 0);
  const cmv = produtos.reduce((s, x) => s + x.cmv, 0);
  const canais = [...new Set((d.pedidos as Record<string, string>[]).map((x) => canalVenda(String(x["canal"]))))];
  const proxima = p.ultima_compra && p.ritmo_dias ? new Date(new Date(String(p.ultima_compra)).getTime() + Number(p.ritmo_dias) * 86400000).toISOString() : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">{c?.nome ?? "Cliente"}</h1>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{[c?.cidade, c?.uf].filter(Boolean).join(" / ")}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {canais.map((x) => <StatusTag key={x} tone="muted">{x}</StatusTag>)}
            {p.acao && <StatusTag tone={ACAO_TONE[String(p.acao)] ?? "muted"}>{ACAO_LABEL[String(p.acao)] ?? p.acao}</StatusTag>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Kpi label="Total gasto" value={fmtBRL(p.valor_total)} />
        <Kpi label="Pedidos" value={fmtNum(p.pedidos)} hint={`Ticket ${fmtBRL(p.ticket_medio)}`} />
        <Kpi label="Margem bruta (CMV)" value={fmtBRL(receitaItens - cmv)} hint={receitaItens ? `${fmtPct(((receitaItens - cmv) / receitaItens) * 100)} s/ itens` : undefined} tone="up" />
        <Kpi label="LTV esperado" value={fmtBRL(p.ltv_esperado)} />
        <Kpi label="Ritmo" value={p.ritmo_dias ? `${p.ritmo_dias} dias` : "—"} hint={p.ritmo_proprio ? "ritmo do próprio cliente" : "ritmo do produto"} />
        <Kpi label="Próx. recompra" value={fmtDate(proxima)} hint={`${fmtNum(p.dias_ultima_compra)} dias desde a última`} />
        <Kpi label="Atraso" value={`${fmtNum(p.dias_atraso)}d`} tone={Number(p.dias_atraso) > 30 ? "warn" : undefined} hint={Number(p.dias_atraso) > 30 ? "risco de churn" : "dentro do ritmo"} />
        <Kpi label="Chance 30/90d" value={`${fmtPct(p.chance_30, 0)}`} hint={`90d: ${fmtPct(p.chance_90, 0)}`} />
      </div>

      <ClienteAcao chave={chave} />

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Como chegou">
          <dl className="space-y-2 text-sm">
            {[
              ["Canal de entrada", o.canal_entrada ?? p.canal_entrada],
              ["Data de entrada", fmtDate(o.data_entrada ?? p.primeira_compra)],
              ["Origem", o.origem_entrada],
              ["Mídia", o.midia_entrada],
              ["Campanha", o.campanha_entrada],
              ["Último canal", p.canal_ultimo],
              ["Produto provável na próxima", p.produto_provavel],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between gap-4 border-b border-border pb-2 last:border-0">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right">{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel title="Produtos comprados" className="xl:col-span-2">
          {!produtos.length ? <Empty /> : (
            <Table head={["Produto", "SKU", "Unid.", "Receita", "CMV", "Margem"]}>
              {produtos.slice(0, 12).map((x) => (
                <tr key={x.sku}>
                  <Td className="max-w-[340px] truncate"><Link to="/produtos/$sku" params={{ sku: x.sku }} className="hover:text-primary">{x.produto}</Link></Td>
                  <Td mono>{x.sku}</Td>
                  <Td mono>{fmtNum(x.unidades)}</Td>
                  <Td mono>{fmtBRL(x.receita)}</Td>
                  <Td mono>{x.temCusto ? fmtBRL(x.cmv) : "sem custo"}</Td>
                  <Td mono className="text-success">{x.temCusto ? fmtBRL(x.receita - x.cmv) : "—"}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      </div>

      <Panel title={`Linha do tempo de pedidos (${d.pedidos.length})`}>
        <Table head={["Data", "Canal", "Pedido", "Valor", "Desconto", "Frete", "Itens", "Status"]}>
          {(d.pedidos as Record<string, string | number>[]).map((x) => (
            <tr key={`${x.canal}-${x.pedido_id}`}>
              <Td mono>{fmtDate(x.data)}</Td>
              <Td>{canalVenda(String(x["canal"]))}</Td>
              <Td mono><Link to="/pedidos/$canal/$id" params={{ canal: String(x.canal), id: String(x.pedido_id) }} className="hover:text-primary">{x.pedido_id}</Link></Td>
              <Td mono>{fmtBRL(x.valor)}</Td>
              <Td mono>{fmtBRL(x.desconto)}</Td>
              <Td mono>{fmtBRL(x.frete)}</Td>
              <Td mono>{fmtNum(x.itens)}</Td>
              <Td><StatusTag tone="muted">{x.status}</StatusTag></Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}
