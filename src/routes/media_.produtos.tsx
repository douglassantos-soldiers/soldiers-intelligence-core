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
import { getMidiaSku } from "@/lib/canais.functions";
import { LIMITES_SKU } from "@/lib/midiasku";
import { LIMITES_RITMO } from "@/lib/ritmo";
import { fmtBRL, fmtNum, fmtPct, fmtX, fmtDate, periodo } from "@/lib/format";

// Mídia por produto: onde a verba encontra estoque curto ou margem negativa, e o ritmo de todos os canais
// (Plano Mestre caps. 7.6 "Stock-aware / Margin-aware Ads" e 14). Contribuição por SKU é estimada. Só recomendação.
export const Route = createFileRoute("/media_/produtos")({
  head: () => ({
    meta: [
      { title: "Mídia por produto — Soldiers Platform" },
      {
        name: "description",
        content:
          "Verba de Ads por SKU cruzada com estoque e margem, e ritmo/anomalia de todos os canais.",
      },
    ],
  }),
  component: MidiaProdutos,
});

type D = Awaited<ReturnType<typeof getMidiaSku>>;
type Filtro = "todos" | "estoque curto com mídia" | "mídia com prejuízo" | "espaço para mídia";
const T = (r: unknown) => r as Record<string, unknown>[];
const TOM: Record<string, "danger" | "warn" | "success"> = {
  "estoque curto com mídia": "danger",
  "mídia com prejuízo": "warn",
  "espaço para mídia": "success",
};

function MidiaProdutos() {
  const [dias, setDias] = useState("28");
  const fn = useServerFn(getMidiaSku);
  const p = periodo(dias);
  const q = useQuery({ queryKey: ["midia-sku", p], queryFn: () => fn({ data: p }) });
  return (
    <>
      <PageHeader
        title="Mídia por produto"
        subtitle="A verba está indo para produto com estoque e margem? E algum canal saiu do ritmo hoje?"
        right={
          <div className="flex items-center gap-4">
            <Link to="/media" className="text-sm font-medium text-primary hover:underline">
              ← Media
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
  const [f, setF] = useState<Filtro>("todos");
  const conta = (s: Filtro) => d.skus.filter((x) => x.sinais.includes(s as never)).length;
  const lista = f === "todos" ? d.skus : d.skus.filter((x) => x.sinais.includes(f as never));
  const ads = d.skus.reduce((s, x) => s + x.ads, 0);
  const adsRuim = d.skus
    .filter(
      (x) =>
        x.sinais.includes("estoque curto com mídia") || x.sinais.includes("mídia com prejuízo"),
    )
    .reduce((s, x) => s + x.ads, 0);
  return (
    <div className="space-y-6">
      <ErrosLeitura
        erros={d.erros}
        nomes={{
          produtos: "venda por SKU",
          custos: "custos",
          pl: "taxas do canal",
          estoqueSite: "estoque do site",
          fba: "estoque FBA",
          funil: "ritmo dos canais",
        }}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="Ads nos SKUs"
          value={fmtBRL(ads)}
          hint={`${fmtNum(d.totalSkus)} SKUs com venda ou Ads`}
        />
        <Kpi
          label="Verba em risco"
          value={fmtBRL(adsRuim)}
          hint="estoque curto ou contribuição negativa"
          {...(adsRuim ? { tone: "down" as const } : {})}
        />
        <Kpi
          label="Estoque curto com mídia"
          value={fmtNum(conta("estoque curto com mídia"))}
          {...(conta("estoque curto com mídia") ? { tone: "down" as const } : {})}
        />
        <Kpi label="Espaço para mídia" value={fmtNum(conta("espaço para mídia"))} tone="up" />
      </div>

      <Panel title="Ritmo por canal">
        {d.ritmo.length ? (
          <Table
            head={[
              "Canal",
              "Investido",
              "% da verba",
              "ROAS (Ads)",
              "Últimos 7d × 7d antes",
              "Último dia",
              "Normal",
              "Sinal",
            ]}
          >
            {d.ritmo.map((c) => (
              <tr key={c.canal}>
                <Td>{c.canal}</Td>
                <Td mono>{fmtBRL(c.gasto)}</Td>
                <Td mono>{fmtPct(c.sharePct, 0)}</Td>
                <Td mono>{fmtX(c.roas)}</Td>
                <Td mono>
                  {c.variacao7Pct == null
                    ? "—"
                    : `${c.variacao7Pct > 0 ? "+" : ""}${fmtPct(c.variacao7Pct, 0)}`}
                </Td>
                <Td mono>
                  {c.anomalia
                    ? `${fmtDate(c.anomalia.data).slice(0, 5)} · ${fmtBRL(c.anomalia.gasto)}`
                    : "—"}
                </Td>
                <Td mono>{fmtBRL(c.anomalia?.gastoBase)}</Td>
                <Td>
                  {c.anomalia?.sinais.length ? (
                    <span className="flex flex-wrap gap-1">
                      {c.anomalia.sinais.map((s) => (
                        <StatusTag key={s} tone="warn">
                          {s}
                        </StatusTag>
                      ))}
                    </span>
                  ) : (
                    <StatusTag tone="success">normal</StatusTag>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty />
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Último dia com dado comparado à mediana dos {LIMITES_RITMO.diasBase} dias anteriores:
          gasto acima de {LIMITES_RITMO.gastoAlto}× ou abaixo de {LIMITES_RITMO.gastoBaixo}× o
          normal, ou ROAS abaixo de {Math.round(LIMITES_RITMO.roasBaixo * 100)}% do normal. ROAS
          aqui é o informado pelas plataformas.
        </p>
      </Panel>

      <Pills
        value={f}
        onChange={setF}
        options={[
          { id: "todos", label: "Todos" },
          {
            id: "estoque curto com mídia",
            label: `Estoque curto (${conta("estoque curto com mídia")})`,
          },
          { id: "mídia com prejuízo", label: `Prejuízo (${conta("mídia com prejuízo")})` },
          { id: "espaço para mídia", label: `Espaço para mídia (${conta("espaço para mídia")})` },
        ]}
      />
      <Panel
        title="SKUs: mídia × estoque × margem"
        right={<CsvButton name="midia-por-sku" rows={T(lista)} />}
      >
        {lista.length ? (
          <Table
            head={[
              "Produto",
              "Receita",
              "Ads",
              "TACoS",
              "Contribuição",
              "Margem",
              "Cobertura site",
              "Cobertura FBA",
              "Ads por canal",
              "Sinal",
            ]}
          >
            {lista.slice(0, 150).map((x) => (
              <tr key={x.sku}>
                <Td>
                  <Link
                    to="/produtos/$sku"
                    params={{ sku: x.sku }}
                    className="font-medium hover:text-primary"
                  >
                    {x.produto}
                  </Link>
                </Td>
                <Td mono>{fmtBRL(x.receita)}</Td>
                <Td mono>{fmtBRL(x.ads)}</Td>
                <Td mono>{fmtPct(x.tacosPct, 1)}</Td>
                <Td
                  mono
                  className={x.contribuicao != null && x.contribuicao < 0 ? "text-destructive" : ""}
                >
                  {x.semCusto ? "sem custo" : fmtBRL(x.contribuicao)}
                </Td>
                <Td mono>{fmtPct(x.margemPct, 0)}</Td>
                <Td
                  mono
                  className={
                    x.coberturaSite != null && x.coberturaSite < LIMITES_SKU.coberturaCurta
                      ? "text-destructive"
                      : ""
                  }
                >
                  {x.coberturaSite == null ? "—" : `${fmtNum(x.coberturaSite)} d`}
                </Td>
                <Td
                  mono
                  className={
                    x.coberturaFba != null && x.coberturaFba < LIMITES_SKU.coberturaCurta
                      ? "text-destructive"
                      : ""
                  }
                >
                  {x.coberturaFba == null ? "—" : `${fmtNum(x.coberturaFba)} d`}
                </Td>
                <Td className="text-xs">
                  {x.adsPorCanal.map((a) => `${a.canal} ${fmtBRL(a.ads)}`).join(" · ") || "—"}
                </Td>
                <Td>
                  <span className="flex flex-wrap gap-1">
                    {x.sinais.map((s) => (
                      <StatusTag key={s} tone={TOM[s] ?? "muted"}>
                        {s}
                      </StatusTag>
                    ))}
                  </span>
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty />
        )}
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          <li>
            Contribuição estimada = receita − custo do produto na data − taxa média do canal no
            período (taxas, frete e imposto do P&amp;L por canal) − Ads.
          </li>
          <li>
            Estoque curto: menos de {LIMITES_SKU.coberturaCurta} dias no canal onde há Ads (site ou
            FBA). Espaço para mídia: margem ≥ {LIMITES_SKU.margemBoaPct}%, TACoS abaixo de{" "}
            {LIMITES_SKU.tacosBaixoPct}% e estoque para {LIMITES_SKU.coberturaFolgada}+ dias.
          </li>
          <li>Estoque de ML, Shopee e TikTok fica nas telas de cada canal.</li>
        </ul>
      </Panel>
    </div>
  );
}
