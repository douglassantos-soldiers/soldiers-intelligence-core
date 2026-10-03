import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { getProduto } from "@/lib/data.functions";
import type { amazonDoSku } from "@/lib/amazon";
import { PeriodPills, Kpi, Panel, Loading, ErrorBox, Table, Td, Empty, StatusTag } from "@/components/kit";
import { StackedArea, pivot } from "@/components/charts";
import { sumBy, custoHistorico, custoNaData } from "@/lib/aggregate";
import { fmtBRL, fmtBRL2, fmtNum, fmtPct, fmtX, fmtDate, periodo } from "@/lib/format";

export const Route = createFileRoute("/produtos/$sku")({
  head: () => ({
    meta: [
      { title: "Ficha do produto — Soldiers Platform" },
      { name: "description", content: "Visão 360 de um SKU: vendas por canal, margem, mídia, recompra e estoque." },
      { property: "og:title", content: "Ficha do produto — Soldiers Platform" },
      { property: "og:description", content: "Visão 360 de um SKU Soldiers." },
    ],
  }),
  component: Produto,
});

function Produto() {
  const { sku } = Route.useParams();
  const [dias, setDias] = useState("90");
  const fn = useServerFn(getProduto);
  const p = periodo(dias);
  const q = useQuery({ queryKey: ["produto", sku, p], queryFn: () => fn({ data: { ...p, sku } }) });

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Link to="/produtos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Product 360</Link>
        <PeriodPills value={dias} onChange={setDias} />
      </div>
      {q.isLoading && <Loading />}
      {q.error && <ErrorBox error={q.error} />}
      {q.data && <Body sku={sku} d={q.data} />}
    </>
  );
}

function Body({ sku, d }: { sku: string; d: Awaited<ReturnType<typeof getProduto>> }) {
  const serie = d.serie as Record<string, unknown>[];
  const canais = sumBy(serie, "canal", ["receita", "unidades", "pedidos", "invest_ads", "receita_ads"]).sort((a, b) => Number(b.receita) - Number(a.receita));
  const t = canais.reduce((s, c) => ({ receita: s.receita + Number(c.receita), unidades: s.unidades + Number(c.unidades), ads: s.ads + Number(c.invest_ads), pedidos: s.pedidos + Number(c.pedidos) }), { receita: 0, unidades: 0, ads: 0, pedidos: 0 });
  const custo = d.custo ? Number((d.custo as Record<string, unknown>).custo_unitario) : null;
  // CMV do período: cada dia usa o custo vigente naquela data (não o último cadastrado).
  const hist = custoHistorico(d.custos ?? []);
  const cmv = custo != null ? serie.reduce((s, r) => s + (Number(r["unidades"]) || 0) * (custoNaData(hist, sku, r["data"])?.custo ?? 0), 0) : null;
  const margem = cmv != null ? t.receita - cmv - t.ads : null;
  const nomeTop = [...serie].sort((a, b) => Number(b.receita) - Number(a.receita))[0]?.produto as string | undefined;
  const ciclo = d.ciclo as Record<string, number> | null;
  const est = d.estoque as Record<string, number | string> | null;
  const chart = pivot(serie, "receita");

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-xs text-primary">SKU {sku}</div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">{nomeTop ?? `SKU ${sku}`}</h1>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Kpi label="Receita" value={fmtBRL(t.receita)} />
        <Kpi label="Unidades" value={fmtNum(t.unidades)} hint={`Preço médio ${fmtBRL(t.unidades ? t.receita / t.unidades : null)}`} />
        <Kpi label="Custo unit." value={fmtBRL(custo)} hint={custo == null ? "sem custo cadastrado" : undefined} tone={custo == null ? "warn" : undefined} />
        <Kpi label="Margem pós-ads" value={fmtBRL(margem)} hint={margem != null && t.receita ? fmtPct((margem / t.receita) * 100) : undefined} tone="up" />
        <Kpi label="Ads / TACoS" value={fmtBRL(t.ads)} hint={`TACoS ${fmtPct(t.receita ? (t.ads / t.receita) * 100 : null)}`} />
        <Kpi label="Recompra 90d" value={fmtPct(ciclo?.pct_retorno_90)} hint={ciclo ? `${fmtNum(ciclo.clientes)} clientes` : undefined} />
        <Kpi label="Ciclo mediano" value={ciclo?.ciclo_mediano ? `${ciclo.ciclo_mediano} dias` : "—"} />
        <Kpi label="Estoque site" value={fmtNum(est?.estoque)} hint={est?.cobertura_dias != null ? `${fmtNum(est.cobertura_dias)} dias de cobertura` : undefined} />
      </div>
      <Panel title="Receita por canal"><StackedArea data={chart.data} keys={chart.series} /></Panel>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Por canal">
          <Table head={["Canal", "Receita", "Unid.", "Pedidos", "Ads", "ROAS ads", "TACoS"]}>
            {canais.map((c) => (
              <tr key={String(c.canal)}>
                <Td>{c.canal}</Td>
                <Td mono>{fmtBRL(c.receita)}</Td>
                <Td mono>{fmtNum(c.unidades)}</Td>
                <Td mono>{fmtNum(c.pedidos)}</Td>
                <Td mono>{fmtBRL(c.invest_ads)}</Td>
                <Td mono>{fmtX(Number(c.invest_ads) ? Number(c.receita_ads) / Number(c.invest_ads) : null)}</Td>
                <Td mono>{fmtPct(Number(c.receita) ? (Number(c.invest_ads) / Number(c.receita)) * 100 : null)}</Td>
              </tr>
            ))}
          </Table>
        </Panel>
        <Panel title="Próximo produto que os clientes compram">
          {!d.proximo.length ? <Empty /> : (
            <Table head={["Produto seguinte", "SKU", "Ocorrências", "Força"]}>
              {(d.proximo as Record<string, string | number>[]).map((x) => (
                <tr key={String(x.sku_seguinte)}>
                  <Td className="max-w-[300px] truncate"><Link to="/produtos/$sku" params={{ sku: String(x.sku_seguinte) }} className="hover:text-primary">{x.produto_seguinte}</Link></Td>
                  <Td mono>{x.sku_seguinte}</Td>
                  <Td mono>{fmtNum(x.ocorrencias)}</Td>
                  <Td mono>{fmtPct(x.forca_pct)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      </div>
      <Panel title="Estoque por canal">
        {/* Plano Mestre cap. 6.4: estoques de canais diferentes não são intercambiáveis,
            por isso cada canal aparece separado e não existe "estoque total". */}
        <Table head={["Canal", "Disponível", "Total no canal / cobertura", "Registros", "Atualizado"]}>
          <tr>
            <Td>Site (Shopify)</Td>
            <Td mono>{fmtNum(est?.["estoque"])}</Td>
            <Td mono>{est?.["cobertura_dias"] != null ? `${fmtNum(est["cobertura_dias"])} dias de cobertura` : "—"}</Td>
            <Td mono>{est ? 1 : 0}</Td>
            <Td mono>{est?.["atualizado_em"] ? fmtDate(est["atualizado_em"]) : "—"}</Td>
          </tr>
          {(d.estoqueCanais ?? []).map((e) => (
            <tr key={e.canal}>
              <Td>{e.canal}</Td>
              <Td mono>{e.registros ? fmtNum(e.disponivel) : "—"}</Td>
              <Td mono>{e.registros ? fmtNum(e.total) : "—"}</Td>
              <Td mono>{e.erro ? <span className="text-warning" title={e.erro}>erro</span> : fmtNum(e.registros)}</Td>
              <Td mono>{e.atualizado ? fmtDate(e.atualizado) : "—"}</Td>
            </tr>
          ))}
        </Table>
        <p className="mt-3 text-xs text-muted-foreground">
          O vínculo com cada marketplace é pelo SKU do vendedor. "—" significa que o SKU não foi encontrado no canal
          (pode não ser vendido lá ou estar cadastrado com outro SKU).
        </p>
      </Panel>
      <AmazonDoSku
        a={(d as { amazon?: AmazonSku }).amazon ?? null}
        erro={(d as { amazonErro?: string | null }).amazonErro ?? null}
      />
    </div>
  );
}

type AmazonSku = ReturnType<typeof amazonDoSku>;

// Bloco Amazon do Product 360 (benchmarks/amazon/ANALISE.md §4): ASINs do SKU, Buy Box, conversão,
// FBA e Ads do produto. Venda de Ads é atribuída pela Amazon; não somar com a receita.
function AmazonDoSku({ a, erro }: { a: AmazonSku; erro: string | null }) {
  if (erro)
    return (
      <Panel title="Amazon">
        <Empty>Não foi possível ler os dados da Amazon: {erro}</Empty>
      </Panel>
    );
  if (!a) return null;
  return (
    <Panel
      title="Amazon"
      right={
        <Link to="/marketplace/amazon" className="text-sm font-medium text-primary hover:underline">
          Ver Amazon →
        </Link>
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Vendas Amazon" value={fmtBRL(a.vendas)} hint={`${a.asins.length} ASIN(s)`} />
        <Kpi label="Ads: investimento" value={fmtBRL(a.ads.custo)} />
        <Kpi label="ACoS" value={fmtPct(a.ads.acosPct)} hint={`sobre ${fmtBRL(a.ads.vendasAtribuidas)} atribuídos`} />
        <Kpi label="TACoS" value={fmtPct(a.ads.tacosPct)} hint="Ads ÷ venda do produto" />
      </div>
      {a.linhas.length ? (
        <Table head={["ASIN", "Sessões", "Conversão", "Buy Box", "Preço / menor concorr.", "FBA", "Cobertura", "O que olhar"]}>
          {a.linhas.map((x) => (
            <tr key={x.asin}>
              <Td mono>{x.asin}</Td>
              <Td mono>{fmtNum(x.sessoes)}</Td>
              <Td mono>{fmtPct(x.conversaoPct)}</Td>
              <Td mono className={x.ganhaBuyBox === false ? "text-destructive" : ""}>{fmtPct(x.buyboxPct, 0)}</Td>
              <Td mono>
                {fmtBRL2(x.meuPreco)} / {fmtBRL2(x.menorConcorrente)}
              </Td>
              <Td mono>{fmtNum(x.fbaDisponivel)}</Td>
              <Td mono>{x.coberturaDias == null ? "—" : `${fmtNum(x.coberturaDias)} d`}</Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {x.problemas.length ? (
                    x.problemas.map((p) => (
                      <StatusTag key={p} tone="warn">
                        {p}
                      </StatusTag>
                    ))
                  ) : (
                    <StatusTag tone="success">ok</StatusTag>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty>ASIN vinculado, mas sem vendas no período.</Empty>
      )}
    </Panel>
  );
}
