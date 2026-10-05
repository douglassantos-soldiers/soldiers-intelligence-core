import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  PageHeader,
  PeriodPills,
  Pills,
  Kpi,
  Panel,
  Loading,
  ErrorBox,
  Table,
  Td,
  StatusTag,
  Empty,
  CsvButton,
} from "@/components/kit";
import { ErrosLeitura } from "@/components/erros-leitura";
import { getCriativos } from "@/lib/criativos360.functions";
import { REGRAS } from "@/lib/criativos360";
import { fmtBRL, fmtNum, fmtPct, fmtX, fmtDate, periodo } from "@/lib/format";

// Central de criativos (Plano Mestre cap. 7.5): Criativo → Cliente → LTV → Contribuição.
// Receita do Meta é a informada pela plataforma; receita, clientes e LTV vêm do Shopify pelo utm_content.
// As duas ficam em colunas separadas e nunca se somam. Só leitura e recomendação.
export const Route = createFileRoute("/media_/criativos")({
  head: () => ({
    meta: [
      { title: "Central de criativos — Soldiers Platform" },
      {
        name: "description",
        content:
          "Cada criativo do gasto ao cliente, ao LTV e à contribuição; o que funciona, o que renovar e a biblioteca.",
      },
    ],
  }),
  component: Central,
});

type D = Awaited<ReturnType<typeof getCriativos>>;
type Aba = "placar" | "funciona" | "renovar" | "multicanal" | "biblioteca";
const T = (r: unknown) => r as Record<string, unknown>[];
const TOM: Record<string, "success" | "danger" | "warn" | "muted" | "primary"> = {
  escalar: "success",
  cortar: "danger",
  renovar: "warn",
  observar: "muted",
  manter: "primary",
  BEST: "success",
  GOOD: "primary",
  LOW: "danger",
  LEARNING: "muted",
};

function Central() {
  const [dias, setDias] = useState("30");
  const fn = useServerFn(getCriativos);
  const p = periodo(dias);
  const q = useQuery({ queryKey: ["central-criativos", p], queryFn: () => fn({ data: p }) });
  return (
    <>
      <PageHeader
        title="Central de criativos"
        subtitle="Não só o ROAS: que cliente cada criativo trouxe, quanto ele vale e se o criativo se pagou."
        right={
          <div className="flex items-center gap-4">
            <Link
              to="/media/meta/criativos"
              className="text-sm font-medium text-primary hover:underline"
            >
              Subir criativos →
            </Link>
            <PeriodPills value={dias} onChange={setDias} />
          </div>
        }
      />
      {q.isLoading && <Loading />}
      {q.error && <ErrorBox error={q.error} />}
      {q.data && <Body d={q.data} />}
    </>
  );
}

function Body({ d }: { d: D }) {
  const [aba, setAba] = useState<Aba>("placar");
  const gasto = d.placar.reduce((s, c) => s + c.gasto, 0);
  const novos = d.placar.reduce((s, c) => s + (c.clientesNovos ?? 0), 0);
  const contrib = d.placar.reduce((s, c) => s + (c.contribuicaoLtv ?? c.contribuicao ?? 0), 0);
  const conta = (l: string) => d.placar.filter((c) => c.leitura === l).length;
  return (
    <div className="space-y-6">
      <ErrosLeitura erros={d.erros} />
      {(d.migracaoPendente || !d.temCliente) && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
          Cliente, LTV e contribuição por criativo precisam da migração{" "}
          <span className="font-mono">20261005150000_criativo_cliente.sql</span> e de links do Meta
          com <span className="font-mono">utm_content={"{{ad.id}}"}</span> (ou o nome do anúncio).
          Até lá, a tela mostra o desempenho informado pelo Meta.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        <Kpi
          label="Criativos com gasto"
          value={fmtNum(d.totalCriativos)}
          hint={`${fmtNum(d.placar.filter((c) => c.noAr).length)} no ar`}
        />
        <Kpi label="Gasto" value={fmtBRL(gasto)} />
        <Kpi
          label="Clientes novos"
          value={fmtNum(d.temCliente ? novos : null)}
          hint={
            d.temCliente ? `CAC ${fmtBRL(novos ? gasto / novos : null)}` : "precisa do utm_content"
          }
        />
        <Kpi
          label="Contribuição"
          value={fmtBRL(d.temCliente ? contrib : null)}
          hint={`margem do site ${fmtPct(d.margemSitePct, 0)} antes de Ads`}
          {...(contrib < 0 ? { tone: "down" as const } : {})}
        />
        <Kpi label="Escalar" value={fmtNum(conta("escalar"))} tone="up" />
        <Kpi
          label="Renovar / cortar"
          value={`${fmtNum(conta("renovar"))} / ${fmtNum(conta("cortar"))}`}
          {...(conta("cortar") ? { tone: "warn" as const } : {})}
        />
      </div>
      <Pills
        value={aba}
        onChange={setAba}
        options={[
          { id: "placar", label: "Placar" },
          { id: "funciona", label: "O que funciona" },
          { id: "renovar", label: "Renovar e cortar" },
          { id: "multicanal", label: "Outros canais" },
          { id: "biblioteca", label: "Biblioteca" },
        ]}
      />
      {aba === "placar" && <Placar p={d.placar} />}
      {aba === "funciona" && <Funciona g={d.oQueFunciona} />}
      {aba === "renovar" && (
        <Placar
          p={d.placar.filter((c) => c.leitura === "renovar" || c.leitura === "cortar")}
          titulo="Renovar e cortar"
        />
      )}
      {aba === "multicanal" && <Multicanal m={d.multicanal} />}
      {aba === "biblioteca" && <Biblioteca b={d.biblioteca} total={d.totalBiblioteca} />}
    </div>
  );
}

function Placar({
  p,
  titulo = "Placar dos criativos (Meta)",
}: {
  p: D["placar"];
  titulo?: string;
}) {
  return (
    <Panel
      title={titulo}
      right={
        <CsvButton
          name="central-criativos"
          rows={T(p.map(({ etiquetas, ...x }) => ({ ...x, ...etiquetas })))}
        />
      }
    >
      {p.length ? (
        <Table
          head={[
            "Criativo",
            "Etiquetas",
            "Gasto",
            "CTR",
            "Gancho / retenção",
            "ROAS Meta",
            "Receita Shopify",
            "Clientes novos",
            "CAC",
            "LTV ÷ CAC",
            "Contribuição LTV",
            "Leitura",
          ]}
        >
          {p.slice(0, 120).map((c) => (
            <tr key={c.creativeId}>
              <Td className="max-w-[280px]">
                <div className="flex items-center gap-2">
                  {c.thumbnail ? (
                    <img
                      src={c.thumbnail}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded bg-muted" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate font-medium">{c.nome}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {c.anuncios} anúncio(s){c.noAr ? " · no ar" : ""}
                    </div>
                  </div>
                </div>
              </Td>
              <Td className="text-xs">
                {[
                  c.etiquetas.formato,
                  c.etiquetas.proporcao,
                  c.etiquetas.produto,
                  c.etiquetas.ugc ? "UGC" : "",
                ]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </Td>
              <Td mono>{fmtBRL(c.gasto)}</Td>
              <Td mono>{fmtPct(c.ctrPct, 2)}</Td>
              <Td mono>
                {c.hookPct == null ? "—" : `${fmtPct(c.hookPct, 0)} / ${fmtPct(c.retencaoPct, 0)}`}
              </Td>
              <Td mono>{fmtX(c.roasMeta)}</Td>
              <Td mono>{fmtBRL(c.receitaShopify)}</Td>
              <Td mono>{fmtNum(c.clientesNovos)}</Td>
              <Td mono>{fmtBRL(c.cac)}</Td>
              <Td
                mono
                className={
                  c.ltvCac != null && c.ltvCac < 1
                    ? "text-destructive"
                    : c.ltvCac != null && c.ltvCac >= REGRAS.ltvCacBom
                      ? "text-success"
                      : ""
                }
              >
                {fmtX(c.ltvCac)}
              </Td>
              <Td
                mono
                className={(c.contribuicaoLtv ?? c.contribuicao ?? 0) < 0 ? "text-destructive" : ""}
              >
                {fmtBRL(c.contribuicaoLtv ?? c.contribuicao)}
              </Td>
              <Td>
                <StatusTag tone={TOM[c.leitura] ?? "muted"}>{c.leitura}</StatusTag>
                {c.motivo && (
                  <div className="mt-1 max-w-[180px] text-[11px] text-muted-foreground">
                    {c.motivo}
                  </div>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty />
      )}
      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
        <li>
          Agrupado por criativo (vários anúncios podem usar o mesmo). Gancho = quem viu 25% do vídeo
          ÷ impressões; retenção = quem chegou ao fim ÷ quem viu 25%.
        </li>
        <li>
          Receita Shopify, clientes novos e LTV vêm dos pedidos com utm_content do anúncio.
          Contribuição LTV = clientes novos × LTV × margem do site − gasto. Sem LTV, vale a
          contribuição pela receita do Shopify.
        </li>
        <li>
          Escalar: LTV ≥ {REGRAS.ltvCacBom}× o CAC. Renovar: CTR dos últimos 7 dias caiu{" "}
          {Math.round(REGRAS.quedaCtr * 100)}% ou mais com frequência ≥ {REGRAS.freqFadiga}. Cortar:
          nem o LTV paga o gasto. Observar: gastou menos de {fmtBRL(REGRAS.gastoMinimo)}.
        </li>
      </ul>
    </Panel>
  );
}

function Funciona({ g }: { g: D["oQueFunciona"] }) {
  const dims = [...new Set(g.map((x) => x.dimensao))];
  return (
    <div className="grid gap-6 2xl:grid-cols-2">
      {dims.map((dim) => (
        <Panel key={dim} title={`Por ${dim.toLowerCase()}`}>
          <Table
            head={[
              dim,
              "Criativos",
              "Gasto",
              "CTR",
              "ROAS Meta",
              "Clientes novos",
              "CAC",
              "LTV ÷ CAC",
              "Contribuição LTV",
            ]}
          >
            {g
              .filter((x) => x.dimensao === dim)
              .map((x) => (
                <tr key={x.valor}>
                  <Td>{x.valor}</Td>
                  <Td mono>{fmtNum(x.criativos)}</Td>
                  <Td mono>{fmtBRL(x.gasto)}</Td>
                  <Td mono>{fmtPct(x.ctrPct, 2)}</Td>
                  <Td mono>{fmtX(x.roasMeta)}</Td>
                  <Td mono>{fmtNum(x.clientesNovos)}</Td>
                  <Td mono>{fmtBRL(x.cac)}</Td>
                  <Td mono>{fmtX(x.ltvCac)}</Td>
                  <Td mono>{fmtBRL(x.contribuicaoLtv)}</Td>
                </tr>
              ))}
          </Table>
        </Panel>
      ))}
      <p className="text-xs text-muted-foreground 2xl:col-span-2">
        Etiquetas lidas do nome, título e texto do anúncio (formato, proporção como 9x16, produto,
        UGC ou @creator). Padronizar o nome dos anúncios (como a subida em massa faz:
        LOTE_TIPO_PROPORÇÃO_NNN) deixa essa leitura mais precisa. Gancho, ângulo e CTA ainda
        precisam de etiqueta manual.
      </p>
    </div>
  );
}

function Multicanal({ m }: { m: D["multicanal"] }) {
  return (
    <Panel
      title="Criativos em TikTok Ads, Meli DSP e Google PMax"
      right={<CsvButton name="criativos-multicanal" rows={T(m)} />}
    >
      {m.length ? (
        <Table head={["Canal", "Criativo", "Gasto", "Receita informada", "ROAS", "Leitura"]}>
          {m.slice(0, 150).map((c) => (
            <tr key={`${c.canal}-${c.id}`}>
              <Td>{c.canal}</Td>
              <Td className="max-w-[300px] truncate">{c.nome}</Td>
              <Td mono>{fmtBRL(c.gasto)}</Td>
              <Td mono>{fmtBRL(c.receita)}</Td>
              <Td mono>{fmtX(c.roas)}</Td>
              <Td>
                {c.leitura ? (
                  <StatusTag tone={TOM[c.leitura] ?? "muted"}>{c.leitura}</StatusTag>
                ) : (
                  "—"
                )}
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty />
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Receita informada por cada plataforma. Cliente e LTV por criativo ainda só existem no Meta
        (pelo utm_content no site). Google PMax traz a nota do próprio Google (BEST, GOOD, LOW), sem
        gasto por asset.
      </p>
    </Panel>
  );
}

function Biblioteca({ b, total }: { b: D["biblioteca"]; total: number }) {
  return (
    <Panel
      title={`Biblioteca (${fmtNum(total)} arquivos)`}
      right={
        <CsvButton
          name="biblioteca-criativos"
          rows={T(
            b.map(({ plataformas, ...x }) => ({
              ...x,
              plataformas: plataformas.map((p) => `${p.plataforma}:${p.estado}`).join(" "),
            })),
          )}
        />
      }
    >
      {b.length ? (
        <Table
          head={[
            "Arquivo",
            "Tipo",
            "Dimensões",
            "Origem",
            "Criado em",
            "Envio por plataforma",
            "Em uso",
            "Gasto",
          ]}
        >
          {b.slice(0, 150).map((x) => (
            <tr key={x.id}>
              <Td className="max-w-[260px] truncate">{x.nome}</Td>
              <Td>{x.tipo || "—"}</Td>
              <Td mono>
                {x.dimensoes || "—"}
                {x.duracaoSeg ? ` · ${Math.round(x.duracaoSeg)}s` : ""}
              </Td>
              <Td className="text-xs">{x.origem || "—"}</Td>
              <Td mono>{x.criadoEm ? fmtDate(x.criadoEm) : "—"}</Td>
              <Td>
                <span className="flex flex-wrap gap-1">
                  {x.plataformas.length
                    ? x.plataformas.map((p) => (
                        <StatusTag
                          key={p.plataforma}
                          tone={
                            /erro|falh/i.test(p.estado)
                              ? "danger"
                              : /ok|enviad|pronto|conclu/i.test(p.estado)
                                ? "success"
                                : "muted"
                          }
                        >
                          {p.plataforma}: {p.estado}
                        </StatusTag>
                      ))
                    : "—"}
                </span>
              </Td>
              <Td mono>{x.emUso ? `${x.emUso} criativo(s)` : "—"}</Td>
              <Td mono>{x.emUso ? fmtBRL(x.gasto) : "—"}</Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty>Biblioteca vazia (cria_criativo).</Empty>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Arquivo ligado ao criativo pelo id gravado na subida em massa ou pelo nome do arquivo dentro
        do nome do anúncio. Arquivo sem uso há tempo é candidato a teste.
      </p>
    </Panel>
  );
}
