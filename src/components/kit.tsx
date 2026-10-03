import type { ReactNode } from "react";
import { Search, Download, Loader2, AlertTriangle } from "lucide-react";
import { PERIODOS } from "@/lib/format";

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Pills<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: readonly { id: T; label: string }[] }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-md px-3 py-1.5 text-sm transition-colors ${value === o.id ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function PeriodPills({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <Pills value={value} onChange={onChange} options={PERIODOS as unknown as { id: string; label: string }[]} />;
}

export function Kpi({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "up" | "down" | "warn" }) {
  const toneCls = tone === "up" ? "text-success" : tone === "down" ? "text-destructive" : tone === "warn" ? "text-warning" : "text-muted-foreground";
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-mono text-2xl font-semibold text-card-foreground">{value}</div>
      {hint && <div className={`mt-1 text-xs ${toneCls}`}>{hint}</div>}
    </div>
  );
}

export function Panel({ title, right, children, className = "" }: { title?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-border bg-card ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          {title && <h2 className="font-display text-sm font-semibold tracking-wide text-card-foreground">{title}</h2>}
          {right}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
      <Search className="h-4 w-4 text-muted-foreground" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
    </div>
  );
}

export function StatusTag({ children, tone = "primary" }: { children: ReactNode; tone?: "primary" | "success" | "warn" | "danger" | "muted" }) {
  const cls = {
    primary: "border-primary/60 bg-primary/10 text-primary",
    success: "border-success/60 bg-success/10 text-success",
    warn: "border-warning/60 bg-warning/10 text-warning",
    danger: "border-destructive/60 bg-destructive/10 text-destructive",
    muted: "border-border bg-muted text-muted-foreground",
  }[tone];
  return <span className={`inline-flex items-center whitespace-nowrap rounded border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{children}</span>;
}

export function Loading({ label = "Carregando dados…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-primary" /> {label}
    </div>
  );
}

export function ErrorBox({ error }: { error: unknown }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
      <AlertTriangle className="mt-0.5 h-4 w-4" />
      <div>Não foi possível carregar estes dados. {error instanceof Error ? error.message : ""}</div>
    </div>
  );
}

export function Empty({ children = "Sem dados para este filtro." }: { children?: ReactNode }) {
  return <div className="py-8 text-center text-sm text-muted-foreground">{children}</div>;
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap px-3 py-2 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, mono, className = "" }: { children: ReactNode; mono?: boolean; className?: string }) {
  return <td className={`whitespace-nowrap px-3 py-2.5 ${mono ? "font-mono text-[13px]" : ""} ${className}`}>{children}</td>;
}

export function exportCsv(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [cols.join(";"), ...rows.map((r) => cols.map((c) => esc(r[c])).join(";"))].join("\n");
  const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function CsvButton({ name, rows }: { name: string; rows: Record<string, unknown>[] }) {
  return (
    <button onClick={() => exportCsv(name, rows)} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:border-primary/60">
      <Download className="h-4 w-4" /> Exportar CSV
    </button>
  );
}

export function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { id: string; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary">
      {options.map((o) => (
        <option key={o.id} value={o.id}>{o.label}</option>
      ))}
    </select>
  );
}
