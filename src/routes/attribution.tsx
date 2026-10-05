import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  PageHeader,
  PeriodPills,
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
import { getAtribuicao } from "@/lib/clientes.functions";
import { fmtBRL, fmtNum, fmtPct, fmtX, fmtDate, periodo } from "@/lib/format";

// Attribution Engine v1 (Plano Mestre cap. 13.2). Quatro receitas que NUNCA se somam:
// realizada (venda do canal), reportada pelas plataformas de Ads, de afiliados e atribuída por UTM no site.
// Incremental fica como lacuna até existir grupo de controle. Só leitura.
export const Route = createFileRoute("/attribution")({
  head: () => ({
    meta: [
      { title: "Attribution — Soldiers Platform" },
      {
        name: "description",
        content:
          "Receita realizada × reportada pelas plataformas × atribuída por UTM, por canal, com o modelo registrado.",
      },
    ],
  }),
  component: Atribuicao,
});

type D = Awaited<ReturnType<typeof getAtribuicao>>;
const T = (r: unknown) => r as Record<string, unknown>[];

function Atribuicao() {
  const [dias, setDias] = useState("30");
  const fn = useServerFn(getAtribuicao);
  const p = periodo(dias);
  const q = useQuery({ queryKey: ["atribuicao", p], queryFn: () => fn({ data: p }) });
  return (
    <>
      <PageHeader
        title="Attribution"
        subtitle="Quanto foi vendido de verdade, quanto cada fonte diz que trouxe e onde as contas se sobrepõem."
        right={<PeriodPills value={dias} onChange={setDias} />}
      />
      {q.isLoading && <Loading />}
      {q.error && <ErrorBox error={q.error} />}
      {q.data && <Body d={q.data} />}
    </>
  );
}

function Body({ d }: { d: D }) {
  const r = d.resumo;
  return (
    <div className="space-y-6">
      <ErrosLeitura erros={d.erros} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        <Kpi label="Receita realizada" value={fmtBRL(r.realizada)} hint="venda dos canais" />
        <Kpi
          label="Reportada por Ads"
          value={fmtBRL(r.reportadaAds)}
          hint={`${fmtPct(r.realizada ? (r.reportadaAds / r.realizada) * 100 : null, 0)} da realizada`}
        />
        <Kpi label="Via afiliados" value={fmtBRL(r.afiliados)} />
        <Kpi
          label="Investimento"
          value={fmtBRL(r.investAds + r.investAfiliados)}
          hint={`Ads ${fmtBRL(r.investAds)} · afiliados ${fmtBRL(r.investAfiliados)}`}
        />
        <Kpi label="MER" value={fmtX(r.mer)} hint="realizada ÷ investimento total" />
        <Kpi
          label="Incremental"
          value="não medido"
          hint="precisa de grupo de controle"
          tone="warn"
        />
      </div>

      <Panel
        title="Por canal de venda"
        right={<CsvButton name="atribuicao-por-canal" rows={T(d.canais)} />}
      >
        {d.canais.length ? (
          <Table
            head={[
              "Canal",
              "Realizada",
              "Reportada por Ads",
              "Via afiliados",
              "Fontes somadas",
              "Sem atribuição",
              "Investido",
              "Leitura",
            ]}
          >
            {d.canais.map((c) => (
              <tr key={c.canal}>
                <Td>{c.canal}</Td>
                <Td mono>{fmtBRL(c.realizada)}</Td>
                <Td mono>{fmtBRL(c.reportadaAds)}</Td>
                <Td mono>{c.afiliados == null ? "—" : fmtBRL(c.afiliados)}</Td>
                <Td mono className={c.sobreposicao ? "text-destructive" : ""}>
                  {fmtPct(c.reportadaPct, 0)}
                </Td>
                <Td mono>{c.semAtribuicao == null ? "—" : fmtBRL(c.semAtribuicao)}</Td>
                <Td mono>{fmtBRL(c.investAds + c.investAfiliados)}</Td>
                <Td>
                  {c.sobreposicao ? (
                    <StatusTag tone="warn">fontes se sobrepõem</StatusTag>
                  ) : (
                    <StatusTag tone="success">cabe na venda</StatusTag>
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
            Realizada = venda do canal. Reportada = o que as plataformas de Ads atribuem a si. Via
            afiliados = fatia da venda marcada como afiliado.
          </li>
          <li>
            "Fontes somadas" acima de 100% quer dizer que Ads e afiliados contam a mesma venda. Por
            isso a plataforma não soma: cada número fica na sua coluna.
          </li>
          <li>
            "Sem atribuição" = o que sobra (orgânico, direto, CRM e o que nenhuma fonte reclamou).
          </li>
        </ul>
      </Panel>

      <div className="grid gap-6 2xl:grid-cols-2">
        <Panel
          title="Site por origem (UTM, último clique)"
          right={<CsvButton name="atribuicao-site-origem" rows={T(d.site.origens)} />}
        >
          {d.site.origens.length ? (
            <Table head={["Origem", "Pedidos", "Receita", "%"]}>
              {d.site.origens.slice(0, 15).map((o) => (
                <tr key={o.origem}>
                  <Td>{o.origem}</Td>
                  <Td mono>{fmtNum(o.pedidos)}</Td>
                  <Td mono>{fmtBRL(o.receita)}</Td>
                  <Td mono>{fmtPct(o.sharePct, 1)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty />
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Cada pedido do site tem uma origem só, então aqui a soma bate com a venda:{" "}
            {fmtBRL(d.site.total)} por origem contra {fmtBRL(d.realizadaSite)} realizados no site.
          </p>
        </Panel>
        <div className="space-y-6">
          <Panel title="Plataforma × UTM no Shopify">
            {d.plataformas.length ? (
              <Table head={["Plataforma", "Informa", "Com UTM dela", "Informa ×"]}>
                {d.plataformas.map((p) => (
                  <tr key={p.plataforma}>
                    <Td>{p.plataforma}</Td>
                    <Td mono>{fmtBRL(p.informada)}</Td>
                    <Td mono>{fmtBRL(p.utm)}</Td>
                    <Td mono className={(p.razao ?? 0) > 2 ? "text-warning" : ""}>
                      {p.razao == null ? "—" : `${p.razao.toFixed(1).replace(".", ",")}×`}
                    </Td>
                  </tr>
                ))}
              </Table>
            ) : (
              <Empty />
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Hoje só o Meta tem as duas pontas no banco. Google, TikTok e marketplaces entram
              quando houver venda com UTM ligada a cada um.
            </p>
          </Panel>
          <Panel title="Modelo registrado">
            {d.modelos.length ? (
              <Table head={["Modelo", "Desde", "Observação", ""]}>
                {d.modelos.map((m) => (
                  <tr key={m.chave + m.inicio}>
                    <Td mono>{m.chave}</Td>
                    <Td mono>{fmtDate(m.inicio)}</Td>
                    <Td className="text-xs">{m.obs || "—"}</Td>
                    <Td>
                      {m.vigente ? (
                        <StatusTag tone="success">vigente</StatusTag>
                      ) : m.futuro ? (
                        <StatusTag tone="primary">programado</StatusTag>
                      ) : (
                        <StatusTag tone="muted">anterior</StatusTag>
                      )}
                    </Td>
                  </tr>
                ))}
              </Table>
            ) : (
              <Empty>Nenhum modelo registrado em config_atribuicao_site.</Empty>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Toda receita atribuída deve dizer qual modelo usou e desde quando (cap. 13.3). Mudou o
              modelo, os números antes e depois não se comparam direto.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
