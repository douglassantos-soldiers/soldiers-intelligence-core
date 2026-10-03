import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Panel, Table, Td, StatusTag, Empty } from "@/components/kit";
import { getMetasMes } from "@/lib/data.functions";
import { fmtBRL, fmtPct, fmtDate } from "@/lib/format";

// Command Center: meta do mês (objetivo) × realizado por canal, com projeção (vw_meta_vs_real_dia)
// e as anotações do mês (meta_evento). Projeção = realizado até hoje × meta do mês ÷ meta até hoje.
export function MetasMes() {
  const fn = useServerFn(getMetasMes);
  const q = useQuery({ queryKey: ["metas-mes"], queryFn: () => fn() });
  const d = q.data;
  if (!d || (!d.canais.length && !d.eventos.length)) return null;
  return (
    <Panel title={`Meta do mês × realizado (${d.mes.slice(5, 7)}/${d.mes.slice(0, 4)})`}>
      {d.canais.length ? (
        <Table
          head={[
            "Canal",
            "Meta do mês",
            "Meta até hoje",
            "Realizado",
            "Atingimento",
            "Projeção",
            "",
          ]}
        >
          {d.canais.map((c) => {
            const tom =
              c.projecaoPct == null
                ? "muted"
                : c.projecaoPct >= 100
                  ? "success"
                  : c.projecaoPct >= 90
                    ? "warn"
                    : "danger";
            return (
              <tr key={c.canal}>
                <Td>
                  <span className="font-medium">{c.canal}</span>
                  {c.provisorio && (
                    <div className="text-xs text-muted-foreground">inclui dia provisório</div>
                  )}
                </Td>
                <Td mono>{fmtBRL(c.metaMes)}</Td>
                <Td mono>{fmtBRL(c.metaAteHoje)}</Td>
                <Td mono>{fmtBRL(c.realAteHoje)}</Td>
                <Td mono>{fmtPct(c.atingimentoPct, 0)}</Td>
                <Td mono>{fmtBRL(c.projecao)}</Td>
                <Td>
                  <StatusTag tone={tom}>
                    {c.projecaoPct == null ? "—" : `${fmtPct(c.projecaoPct, 0)} da meta`}
                  </StatusTag>
                </Td>
              </tr>
            );
          })}
        </Table>
      ) : (
        <Empty>Sem meta cadastrada para o mês.</Empty>
      )}
      {d.eventos.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Anotações do mês
          </div>
          <ul className="space-y-1 text-sm">
            {d.eventos.map((e, i) => (
              <li key={i}>
                <span className="font-mono text-xs text-muted-foreground">{fmtDate(e.data)}</span>{" "}
                <StatusTag tone="muted">{e.tipo}</StatusTag> {e.titulo}
                {e.obs && <span className="text-muted-foreground"> · {e.obs}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Meta diária distribuída pela curva do mês (meta_curva_dia). Projeção supõe que o resto do
        mês segue o ritmo de atingimento até hoje.
      </p>
    </Panel>
  );
}
