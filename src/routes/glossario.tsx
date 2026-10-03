import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel, Table, Td, StatusTag, SearchBox, Empty } from "@/components/kit";
import { METRICAS, TIPO_RECEITA_LABEL } from "@/domain/metricas";

// Glossário de métricas (Plano Mestre, princípio 2 e cap. 13.2). A fonte é src/domain/metricas.ts.
export const Route = createFileRoute("/glossario")({
  head: () => ({
    meta: [
      { title: "Glossário de métricas — Soldiers Platform" },
      {
        name: "description",
        content: "Definição, fórmula, fonte e versão de cada métrica da Soldiers Platform.",
      },
    ],
  }),
  component: Glossario,
});

function Glossario() {
  const [busca, setBusca] = useState("");
  const b = busca.trim().toLowerCase();
  const rows = b
    ? METRICAS.filter((m) =>
        [m.nome, m.definicao, m.modulo, m.fonte].some((x) => x.toLowerCase().includes(b)),
      )
    : METRICAS;

  return (
    <>
      <PageHeader
        title="Glossário de métricas"
        subtitle="Uma definição por métrica. Receita atribuída ou reportada nunca é somada à receita realizada."
      />
      <Panel
        title="Métricas"
        right={
          <SearchBox
            value={busca}
            onChange={setBusca}
            placeholder="Buscar métrica, módulo ou fonte"
          />
        }
      >
        {rows.length ? (
          <Table
            head={[
              "Métrica",
              "Módulo",
              "Definição",
              "Fórmula",
              "Tipo",
              "Soma entre canais?",
              "Fonte",
              "Versão",
            ]}
          >
            {rows.map((m) => (
              <tr key={m.id} className="align-top">
                <Td>
                  <span className="font-medium">{m.nome}</span>
                </Td>
                <Td>{m.modulo}</Td>
                <Td className="min-w-[260px]">
                  {m.definicao}
                  {m.observacao && (
                    <div className="mt-1 text-xs text-muted-foreground">{m.observacao}</div>
                  )}
                </Td>
                <Td mono className="min-w-[200px] text-xs">
                  {m.formula}
                </Td>
                <Td>
                  <StatusTag
                    tone={
                      m.tipoReceita === "realizada"
                        ? "success"
                        : m.tipoReceita === "nao_se_aplica"
                          ? "muted"
                          : "warn"
                    }
                  >
                    {TIPO_RECEITA_LABEL[m.tipoReceita]}
                  </StatusTag>
                </Td>
                <Td>{m.somavel ? "Sim" : "Não"}</Td>
                <Td mono className="text-xs">
                  {m.fonte}
                </Td>
                <Td mono className="text-xs">
                  {m.versao}
                  {m.validoDesde ? ` · desde ${m.validoDesde}` : ""}
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty />
        )}
      </Panel>
    </>
  );
}
