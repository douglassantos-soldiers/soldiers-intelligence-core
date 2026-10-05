import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { fmtCompact, fmtBRL, fmtDate } from "@/lib/format";

export const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];

const tooltipStyle = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--popover-foreground)" },
  labelStyle: { color: "var(--muted-foreground)" },
};

export function StackedArea({ data, keys, height = 280, money = true }: { data: Record<string, unknown>[]; keys: string[]; height?: number; money?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="data" tickFormatter={(v) => fmtDate(v).slice(0, 5)} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
        <YAxis tickFormatter={fmtCompact} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={50} />
        <Tooltip {...tooltipStyle} labelFormatter={fmtDate} formatter={(v: number) => (money ? fmtBRL(v) : fmtCompact(v))} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {keys.map((k, i) => (
          <Area key={k} type="monotone" dataKey={k} stackId="1" stroke={CHART_COLORS[i % 6]} fill={CHART_COLORS[i % 6]} fillOpacity={0.25} strokeWidth={1.5} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function Bars({ data, x, keys, height = 260, money = true, xIsDate = false, stacked = true }: { data: Record<string, unknown>[]; x: string; keys: string[]; height?: number; money?: boolean; xIsDate?: boolean; stacked?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={x} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} tickFormatter={xIsDate ? (v) => fmtDate(v).slice(0, 5) : undefined} />
        <YAxis tickFormatter={fmtCompact} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={50} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "var(--accent)" }} formatter={(v: number) => (money ? fmtBRL(v) : fmtCompact(v))} />
        {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {keys.map((k, i) => (
          <Bar key={k} dataKey={k} fill={CHART_COLORS[i % 6]} radius={[3, 3, 0, 0]} stackId={stacked && keys.length > 1 ? "s" : undefined} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// Pivota linhas {data, canal, valor} em {data, [canal]: valor}
export function pivot(rows: Record<string, unknown>[], valueKey: string, seriesKey = "canal", xKey = "data") {
  const map = new Map<string, Record<string, unknown>>();
  const series = new Set<string>();
  for (const r of rows) {
    const x = String(r[xKey]);
    const s = String(r[seriesKey] ?? "—");
    series.add(s);
    const o = map.get(x) ?? { [xKey]: x };
    o[s] = (Number(o[s]) || 0) + (Number(r[valueKey]) || 0);
    map.set(x, o);
  }
  return { data: [...map.values()].sort((a, b) => String(a[xKey]).localeCompare(String(b[xKey]))), series: [...series] };
}
