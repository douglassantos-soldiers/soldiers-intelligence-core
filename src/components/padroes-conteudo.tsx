// Padrões vencedores por produto (Plano Mestre cap. 8.12), usado na Central de criativos e no Affiliate OS.
import { Panel, Table, Td, StatusTag, Empty, CsvButton } from "@/components/kit";
import { fmtBRL, fmtNum, fmtX } from "@/lib/format";
import type { Padrao } from "@/lib/dna";

const DIM: Record<string, string> = {
  gancho: "Gancho",
  angulo: "Ângulo",
  formato: "Formato",
  cta: "CTA",
};
const TOM_CONF = { alta: "success", média: "primary", baixa: "muted" } as const;

export function PadroesVencedores({
  padroes,
  titulo,
  medida,
  csv,
  vazio,
}: {
  padroes: Padrao[];
  titulo: string;
  medida: "gmvMil" | "roas";
  csv: string;
  vazio?: string;
}) {
  const fmt = (v: number | null) => (medida === "roas" ? fmtX(v) : fmtBRL(v));
  const nomeMedida = medida === "roas" ? "ROAS" : "GMV / mil views";
  return (
    <Panel
      title={titulo}
      right={
        <CsvButton
          name={csv}
          rows={padroes.map((p) => ({
            produto: p.produto,
            pecas: p.pecas,
            media: p.media,
            brief: p.brief,
            confianca: p.confianca,
          }))}
        />
      }
    >
      {padroes.length ? (
        <div className="space-y-4">
          {padroes.map((p) => (
            <div key={p.produto} className="rounded-lg border border-border p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">{p.brief}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {fmtNum(p.pecas)} peças · média do produto {fmt(p.media)}
                  <StatusTag tone={TOM_CONF[p.confianca]}>confiança {p.confianca}</StatusTag>
                </div>
              </div>
              <Table head={["Dimensão", "Valor", "Peças", nomeMedida, "× média do produto"]}>
                {p.escolhas.map((e) => (
                  <tr key={e.dimensao}>
                    <Td>{DIM[e.dimensao]}</Td>
                    <Td className="font-medium">{e.valor}</Td>
                    <Td mono>{fmtNum(e.pecas)}</Td>
                    <Td mono>{fmt(e.resultado)}</Td>
                    <Td mono>{fmtX(e.indice)}</Td>
                  </tr>
                ))}
              </Table>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Para cada produto, o valor de cada dimensão que mais vende acima da média do próprio
            produto (mínimo de 2 peças por valor). É ponto de partida de brief, não regra: cada
            dimensão foi medida sozinha e o resultado é correlação. Confiança pela menor amostra:
            alta com 10 peças ou mais, média com 5.
          </p>
        </div>
      ) : (
        <Empty>
          {vazio ??
            "Ainda não há produto com peças suficientes e DNA identificado para apontar um padrão."}
        </Empty>
      )}
    </Panel>
  );
}
