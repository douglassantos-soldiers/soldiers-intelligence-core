import { Link } from "@tanstack/react-router";
import { Table, Td, StatusTag, Empty } from "@/components/kit";
import { fmtBRL, fmtNum, fmtPct, fmtX } from "@/lib/format";
import { custoMap, custoHistorico, custoNaData } from "@/lib/aggregate";

type Row = Record<string, unknown>;
export type ProdutoAgg = {
  sku: string; produto: string; unidades: number; pedidos: number; receita: number; invest_ads: number; receita_ads: number;
  canais: Set<string>; custo?: number; cmv?: number; margem?: number; ciclo?: number; retorno90?: number; estoque?: number; alerta?: string;
};

export function aggregateProdutos(d: { rows: Row[]; custos: Row[]; ciclos: Row[]; estoque: Row[] }) {
  const custos = custoMap(d.custos); // custo atual (exibição)
  const hist = custoHistorico(d.custos); // CMV usa o custo vigente em cada dia
  const ciclos = new Map(d.ciclos.map((c) => [String(c.sku), c]));
  const est = new Map(d.estoque.map((e) => [String(e.sku), e]));
  const m = new Map<string, ProdutoAgg & { _best: number; _cmv: number; _semCusto: boolean }>();
  for (const r of d.rows) {
    const sku = String(r.sku ?? "");
    if (!sku) continue;
    const rec = Number(r.receita) || 0;
    const cur = m.get(sku) ?? { sku, produto: String(r.produto ?? ""), unidades: 0, pedidos: 0, receita: 0, invest_ads: 0, receita_ads: 0, canais: new Set<string>(), _best: -1, _cmv: 0, _semCusto: false };
    cur.unidades += Number(r.unidades) || 0;
    cur.pedidos += Number(r.pedidos) || 0;
    cur.receita += rec;
    cur.invest_ads += Number(r.invest_ads) || 0;
    cur.receita_ads += Number(r.receita_ads) || 0;
    cur.canais.add(String(r.canal));
    const cv = custoNaData(hist, sku, r["data"]);
    if (cv) cur._cmv += cv.custo * (Number(r["unidades"]) || 0);
    else cur._semCusto = true;
    if (rec > cur._best) { cur._best = rec; cur.produto = String(r.produto ?? cur.produto); }
    m.set(sku, cur);
  }
  return [...m.values()]
    .map((p) => {
      const c = custos.get(p.sku);
      const ci = ciclos.get(p.sku);
      const e = est.get(p.sku);
      const cmv = c && !p._semCusto ? p._cmv : undefined;
      return {
        ...p,
        custo: c?.custo,
        cmv,
        margem: cmv != null ? p.receita - cmv - p.invest_ads : undefined,
        ciclo: ci ? Number(ci.ciclo_mediano) : undefined,
        retorno90: ci ? Number(ci.pct_retorno_90) : undefined,
        estoque: e ? Number(e.estoque) : undefined,
        alerta: e ? String(e.alerta ?? "") : undefined,
      };
    })
    .sort((a, b) => b.receita - a.receita);
}

export function ProductTable({ rows, limit = 100 }: { rows: ProdutoAgg[]; limit?: number }) {
  if (!rows.length) return <Empty />;
  const tot = rows.reduce((s, r) => s + r.receita, 0);
  return (
    <Table head={["Produto", "SKU", "Receita", "Share", "Unid.", "Ads", "TACoS", "Margem pós-ads", "Recompra 90d", "Ciclo", "Estoque site"]}>
      {rows.slice(0, limit).map((r) => (
        <tr key={r.sku} className="hover:bg-accent/40">
          <Td className="max-w-[360px] truncate"><Link to="/produtos/$sku" params={{ sku: r.sku }} className="font-medium hover:text-primary">{r.produto}</Link></Td>
          <Td mono>{r.sku}</Td>
          <Td mono>{fmtBRL(r.receita)}</Td>
          <Td mono>{fmtPct(tot ? (r.receita / tot) * 100 : 0)}</Td>
          <Td mono>{fmtNum(r.unidades)}</Td>
          <Td mono>{fmtBRL(r.invest_ads)}</Td>
          <Td mono>{r.receita ? fmtPct((r.invest_ads / r.receita) * 100) : "—"}</Td>
          <Td mono className={r.margem != null && r.margem < 0 ? "text-destructive" : "text-success"}>{r.margem != null ? fmtBRL(r.margem) : <span className="text-muted-foreground">sem custo</span>}</Td>
          <Td mono>{fmtPct(r.retorno90)}</Td>
          <Td mono>{r.ciclo ? `${r.ciclo}d` : "—"}</Td>
          <Td>{r.estoque != null ? <StatusTag tone={r.alerta && r.alerta !== "ok" && r.alerta !== "null" ? "warn" : "muted"}>{fmtNum(r.estoque)}</StatusTag> : "—"}</Td>
        </tr>
      ))}
    </Table>
  );
}

export { fmtX };
