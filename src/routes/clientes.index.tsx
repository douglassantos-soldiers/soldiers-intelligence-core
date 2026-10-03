import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getClientes, getClienteResumo } from "@/lib/data.functions";
import { PageHeader, Pills, Kpi, Panel, Loading, ErrorBox, Table, Td, SearchBox, StatusTag, CsvButton, Empty, Select } from "@/components/kit";
import { fmtBRL, fmtNum, fmtPct, fmtDate } from "@/lib/format";
import { sumBy } from "@/lib/aggregate";
import { ACAO_LABEL, ACAO_TONE } from "@/domain/sources";

export const Route = createFileRoute("/clientes/")({
  head: () => ({
    meta: [
      { title: "Customer 360 — Soldiers Platform" },
      { name: "description", content: "Base de clientes unificada da Soldiers: LTV, ritmo de recompra, risco e próxima ação." },
      { property: "og:title", content: "Customer 360 — Soldiers Platform" },
      { property: "og:description", content: "Clientes unificados entre todos os canais." },
    ],
  }),
  component: Clientes,
});

function Clientes() {
  const [busca, setBusca] = useState("");
  const [buscaAtiva, setBuscaAtiva] = useState("");
  const [acao, setAcao] = useState("");
  const [ordem, setOrdem] = useState<"potencial" | "chance">("potencial");
  const [page, setPage] = useState(0);
  const listFn = useServerFn(getClientes);
  const resumoFn = useServerFn(getClienteResumo);

  const resumo = useQuery({ queryKey: ["clientes-resumo"], queryFn: () => resumoFn() });
  const lista = useQuery({
    queryKey: ["clientes", buscaAtiva, acao, ordem, page],
    queryFn: () => listFn({ data: { busca: buscaAtiva || undefined, acao: acao || undefined, ordem, page } }),
    placeholderData: keepPreviousData,
  });

  const k = resumo.data?.kpis as Record<string, number> | null | undefined;
  const acoes = sumBy(resumo.data?.acoes ?? [], "acao", ["clientes", "valor_esperado"]).sort((a, b) => Number(b.clientes) - Number(a.clientes));
  const rows = (lista.data?.rows ?? []) as Record<string, string | number>[];

  return (
    <>
      <PageHeader title="Customer 360" subtitle="Cliente unificado entre Site, Mercado Livre, Amazon, Shopee e TikTok." />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Kpi label="Clientes" value={fmtNum(k?.clientes)} />
        <Kpi label="LTV médio" value={fmtBRL(k?.ltv_medio)} />
        <Kpi label="Ticket médio" value={fmtBRL(k?.ticket_medio)} />
        <Kpi label="Recompra" value={fmtPct(k?.pct_recompra)} hint={`${fmtNum(k?.recompradores)} recompradores`} tone="up" />
        <Kpi label="Multicanal" value={fmtPct(k?.pct_multicanal)} hint={`${fmtNum(k?.clientes_multicanal)} clientes`} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => { setAcao(""); setPage(0); }} className={`rounded-lg border px-3 py-1.5 text-sm ${acao === "" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}>Todas as ações</button>
        {acoes.map((a) => (
          <button key={String(a.acao)} onClick={() => { setAcao(String(a.acao)); setPage(0); }} className={`rounded-lg border px-3 py-1.5 text-sm ${acao === a.acao ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>
            {ACAO_LABEL[String(a.acao)] ?? a.acao} <span className="ml-1 font-mono text-xs opacity-70">{fmtNum(a.clientes)}</span>
          </button>
        ))}
      </div>

      <form className="mb-4 flex flex-wrap gap-3" onSubmit={(e) => { e.preventDefault(); setBuscaAtiva(busca); setPage(0); }}>
        <SearchBox value={busca} onChange={setBusca} placeholder="Buscar por e-mail ou CPF do cliente (Enter)" />
        <Select value={ordem} onChange={(v) => { setOrdem(v as "potencial" | "chance"); setPage(0); }} options={[{ id: "potencial", label: "Maior valor esperado 90d" }, { id: "chance", label: "Maior chance de compra 30d" }]} />
        <CsvButton name="clientes" rows={rows} />
      </form>

      <Panel>
        {lista.isLoading && <Loading />}
        {lista.error && <ErrorBox error={lista.error} />}
        {lista.data && !rows.length && <Empty>Nenhum cliente encontrado.</Empty>}
        {rows.length > 0 && (
          <Table head={["Cliente", "Entrada", "Pedidos", "Total gasto", "Última compra", "Ritmo", "Atraso", "Chance 30d", "Esperado 90d", "Ação"]}>
            {rows.map((r) => (
              <tr key={String(r.cliente_chave)} className="hover:bg-accent/40">
                <Td>
                  <Link to="/clientes/$chave" params={{ chave: String(r.cliente_chave) }} className="font-medium hover:text-primary">{r.nome}</Link>
                  <div className="text-xs text-muted-foreground">{[r.cidade, r.uf].filter(Boolean).join(" / ") || "—"}</div>
                </Td>
                <Td>{r.canal_entrada}</Td>
                <Td mono>{fmtNum(r.pedidos)}</Td>
                <Td mono>{fmtBRL(r.valor_total)}</Td>
                <Td mono>{fmtDate(r.ultima_compra)}</Td>
                <Td mono>{r.ritmo_dias ? `${r.ritmo_dias}d` : "—"}</Td>
                <Td mono className={Number(r.dias_atraso) > 30 ? "text-warning" : ""}>{fmtNum(r.dias_atraso)}d</Td>
                <Td mono>{fmtPct(r.chance_30)}</Td>
                <Td mono>{fmtBRL(r.valor_esperado_90)}</Td>
                <Td><StatusTag tone={ACAO_TONE[String(r.acao)] ?? "muted"}>{ACAO_LABEL[String(r.acao)] ?? r.acao}</StatusTag></Td>
              </tr>
            ))}
          </Table>
        )}
        {!buscaAtiva && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40">← Anterior</button>
            <span className="text-muted-foreground">Página {page + 1}</span>
            <button disabled={rows.length < 50} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40">Próxima →</button>
          </div>
        )}
      </Panel>
      {rows[0]?.gerado_em && <p className="mt-3 text-xs text-muted-foreground">Perfis atualizados em {new Date(String(rows[0].gerado_em)).toLocaleString("pt-BR")}.</p>}
    </>
  );
}
