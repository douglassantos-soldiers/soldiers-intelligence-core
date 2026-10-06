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
import { getAfiliadosCreators } from "@/lib/canais.functions";
import { DIAS_ESTADO } from "@/lib/afiliados";
import { fmtBRL, fmtNum, fmtPct, fmtX, fmtDate, periodo } from "@/lib/format";

// Affiliate OS: afiliados por canal, Creator 360 e qualidade do cliente por creator (Plano Mestre caps. 8 e 8.14).
// Affiliate fica separado de Media. GMV de afiliado é parte da venda do canal: não somar ao total.
// Sem cidade, estado ou contato de creator: só nome público e @.
export const Route = createFileRoute("/affiliate_/creators")({
  head: () => ({
    meta: [
      { title: "Creators 360 — Soldiers Platform" },
      {
        name: "description",
        content:
          "Afiliados de ML, Shopee, TikTok Shop e site: GMV, custo, margem, qualidade do cliente e quem reativar.",
      },
    ],
  }),
  component: Creators,
});

type D = Awaited<ReturnType<typeof getAfiliadosCreators>>;
type Aba = "creators" | "canais" | "produtos";
const T = (r: unknown) => r as Record<string, unknown>[];
const TOM_ESTADO: Record<string, "success" | "warn" | "danger" | "muted"> = {
  ativo: "success",
  esfriando: "warn",
  parado: "danger",
  "sem venda": "muted",
};

function Creators() {
  const [dias, setDias] = useState("90");
  const fn = useServerFn(getAfiliadosCreators);
  const p = periodo(dias);
  const q = useQuery({ queryKey: ["creators-360", p], queryFn: () => fn({ data: p }) });
  return (
    <>
      <PageHeader
        title="Creators 360"
        subtitle="Quem vende, quanto custa, que cliente traz e quem está esfriando, em todos os canais de afiliado."
        right={
          <div className="flex items-center gap-4">
            <Link to="/affiliate" className="text-sm font-medium text-primary hover:underline">
              ← Affiliate
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
  const [aba, setAba] = useState<Aba>("creators");
  const gmv = d.canais.reduce((s, c) => s + c.gmvAfiliado, 0);
  const custo = d.canais.reduce((s, c) => s + c.custo, 0);
  const c = d.concentracao;
  return (
    <div className="space-y-6">
      <ErrosLeitura erros={d.erros} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        <Kpi label="GMV via afiliado" value={fmtBRL(gmv)} hint="ML, Shopee e TikTok Shop" />
        <Kpi
          label="Custo de afiliado"
          value={fmtBRL(custo)}
          hint={`comissão efetiva ${fmtPct(gmv ? (custo / gmv) * 100 : null, 1)}`}
        />
        <Kpi
          label="Creators com venda"
          value={fmtNum(c.comVenda)}
          hint={`de ${fmtNum(c.total)} no período`}
        />
        <Kpi label="Fazem 80% do GMV" value={fmtNum(c.fazem80)} hint="creators" />
        <Kpi
          label="Top 3"
          value={fmtPct(c.top3Pct, 0)}
          hint="do GMV de creators"
          {...(c.top3Pct != null && c.top3Pct > 60 ? { tone: "warn" as const } : {})}
        />
        <Kpi
          label="Esfriando"
          value={fmtNum(d.creators.filter((x) => x.estado === "esfriando").length)}
          hint={`${DIAS_ESTADO.ativo}–${DIAS_ESTADO.esfriando} dias sem venda`}
        />
      </div>
      <Pills
        value={aba}
        onChange={setAba}
        options={[
          { id: "creators", label: "Creators" },
          { id: "canais", label: "Por canal" },
          { id: "produtos", label: "Produtos" },
        ]}
      />
      {aba === "creators" && <ListaCreators d={d} />}
      {aba === "canais" && <Canais c={d.canais} />}
      {aba === "produtos" && <Produtos p={d.produtos} />}
    </div>
  );
}

function ListaCreators({ d }: { d: D }) {
  const [fonte, setFonte] = useState("todas");
  const [estado, setEstado] = useState("todos");
  const [tag, setTag] = useState("todas");
  const lista = d.creators.filter(
    (x) =>
      (fonte === "todas" || x.fonte === fonte) &&
      (estado === "todos" || x.estado === estado) &&
      (tag === "todas" || x.tags.includes(tag)),
  );
  const nomeTag = Object.fromEntries(d.tags.map((t) => [t.id, t.label]));
  return (
    <Panel
      title="Creator 360"
      right={
        <div className="flex flex-wrap items-center gap-2">
          <Pills
            value={fonte}
            onChange={setFonte}
            options={[
              { id: "todas", label: "Todas" },
              { id: "Influenciador", label: "Influenciadores" },
              { id: "Mercado Livre", label: "ML" },
              { id: "UpPromote", label: "Site (UpPromote)" },
            ]}
          />
          <Pills
            value={estado}
            onChange={setEstado}
            options={[
              { id: "todos", label: "Todos" },
              { id: "ativo", label: "Ativos" },
              { id: "esfriando", label: "Esfriando" },
              { id: "parado", label: "Parados" },
              { id: "sem venda", label: "Sem venda" },
            ]}
          />
          <CsvButton name="creators-360" rows={T(lista)} />
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Tags automáticas:</span>
        <Pills
          value={tag}
          onChange={setTag}
          options={[
            { id: "todas", label: "Todas" },
            ...d.tags
              .filter((t) => t.creators > 0)
              .map((t) => ({ id: t.id, label: `${t.label} (${t.creators})` })),
          ]}
        />
      </div>
      {lista.length ? (
        <Table
          head={[
            "Creator",
            "Tags",
            "Fonte",
            "GMV",
            "Custo",
            "ROI",
            "Pedidos",
            "Ticket",
            "% clientes novos",
            "Devolução",
            "Desconto",
            "Última venda",
            "Estado",
          ]}
        >
          {lista.slice(0, 150).map((x) => (
            <tr key={x.chave}>
              <Td>
                <span className="font-medium">{x.nome}</span>
                {x.handle && <span className="ml-1 text-xs text-muted-foreground">{x.handle}</span>}
                {x.tier && <span className="ml-1 text-xs text-muted-foreground">· {x.tier}</span>}
              </Td>
              <Td className="max-w-[220px]">
                <div className="flex flex-wrap gap-1">
                  {x.tags.map((t) => (
                    <StatusTag
                      key={t}
                      tone={
                        t === "em_risco" || t === "devolucao_alta" || t === "pago_sem_venda"
                          ? "warn"
                          : "primary"
                      }
                    >
                      {nomeTag[t] ?? t}
                    </StatusTag>
                  ))}
                </div>
              </Td>
              <Td>{x.fonte}</Td>
              <Td mono>
                {fmtBRL(x.gmv)}
                {x.gmvTikTok > 0 && x.gmvSite > 0 && (
                  <span className="block text-[11px] text-muted-foreground">
                    site {fmtBRL(x.gmvSite)} · TT {fmtBRL(x.gmvTikTok)}
                  </span>
                )}
              </Td>
              <Td mono className={x.pagoSemVenda ? "text-destructive" : ""}>
                {fmtBRL(x.custo)}
              </Td>
              <Td mono>{fmtX(x.roi)}</Td>
              <Td mono>{fmtNum(x.pedidos)}</Td>
              <Td mono>{fmtBRL(x.ticket)}</Td>
              <Td mono>{fmtPct(x.pctNovos, 0)}</Td>
              <Td mono>{fmtPct(x.devolucaoPct, 1)}</Td>
              <Td mono>{fmtPct(x.descontoPct, 0)}</Td>
              <Td mono>{x.ultimaVenda ? fmtDate(x.ultimaVenda) : "—"}</Td>
              <Td>
                <StatusTag tone={TOM_ESTADO[x.estado] ?? "muted"}>{x.estado}</StatusTag>
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty />
      )}
      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
        <li>
          ROI = GMV ÷ custo (cachê + comissão). No UpPromote o custo é estimado pela comissão
          cadastrada.
        </li>
        <li>
          % clientes novos, devolução e desconto vêm dos pedidos do site com o cupom do creator.
          Recompra e LTV por creator ainda não: o banco não liga o cupom ao cliente.
        </li>
        <li>
          Estado pela última venda: ativo até {DIAS_ESTADO.ativo} dias, esfriando até{" "}
          {DIAS_ESTADO.esfriando}, parado depois disso. Afiliados da Shopee e do TikTok Shop não vêm
          por creator nas views atuais.
        </li>
        <li>
          Tags automáticas recalculadas a cada leitura:{" "}
          {d.tags.map((t) => `${t.label} = ${t.regra}`).join("; ")}.
        </li>
      </ul>
    </Panel>
  );
}

function Canais({ c }: { c: D["canais"] }) {
  return (
    <Panel title="Afiliados por canal" right={<CsvButton name="afiliados-por-canal" rows={T(c)} />}>
      {c.length ? (
        <Table
          head={[
            "Canal",
            "GMV via afiliado",
            "% do GMV do canal",
            "Custo",
            "Comissão efetiva",
            "Ticket com / sem afiliado",
            "Margem com / sem afiliado",
          ]}
        >
          {c.map((x) => {
            const pior =
              x.margemComPct != null &&
              x.margemSemPct != null &&
              x.margemSemPct - x.margemComPct > 15;
            return (
              <tr key={x.canal}>
                <Td>{x.canal}</Td>
                <Td mono>{fmtBRL(x.gmvAfiliado)}</Td>
                <Td mono>{fmtPct(x.pctGmv, 1)}</Td>
                <Td mono>{fmtBRL(x.custo)}</Td>
                <Td mono>{fmtPct(x.comissaoEfetivaPct, 1)}</Td>
                <Td mono>
                  {fmtBRL(x.ticketAfiliado)} / {fmtBRL(x.ticketSem)}
                </Td>
                <Td mono className={pior ? "text-warning" : ""}>
                  {x.margemComPct == null
                    ? "—"
                    : `${fmtPct(x.margemComPct, 0)} / ${fmtPct(x.margemSemPct, 0)}`}
                </Td>
              </tr>
            );
          })}
        </Table>
      ) : (
        <Empty />
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        GMV via afiliado já está dentro do GMV do canal. Margem com/sem afiliado vem das views da
        Shopee e do TikTok (o ML não traz). Em amarelo: venda via afiliado com margem mais de 15
        p.p. abaixo da venda sem afiliado.
      </p>
    </Panel>
  );
}

function Produtos({ p }: { p: D["produtos"] }) {
  return (
    <Panel
      title="Produtos que dependem de afiliado"
      right={<CsvButton name="afiliados-produtos" rows={T(p)} />}
    >
      {p.length ? (
        <Table
          head={[
            "Canal",
            "Produto",
            "SKU",
            "GMV via afiliado",
            "% da venda do produto",
            "Custo",
            "Comissão efetiva",
          ]}
        >
          {p.slice(0, 100).map((x) => (
            <tr key={`${x.canal}-${x.sku}`}>
              <Td>{x.canal}</Td>
              <Td>{x.produto}</Td>
              <Td mono>{x.sku}</Td>
              <Td mono>{fmtBRL(x.gmvAfiliado)}</Td>
              <Td mono>{fmtPct(x.pctViaAfiliado, 0)}</Td>
              <Td mono>{fmtBRL(x.custo)}</Td>
              <Td mono>{fmtPct(x.comissaoEfetivaPct, 1)}</Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty />
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Produto com venda muito concentrada em afiliado depende da comissão. Base para a análise de
        elasticidade de comissão (cap. 8.13).
      </p>
    </Panel>
  );
}
