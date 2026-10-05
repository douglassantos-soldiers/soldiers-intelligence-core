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
import { Bars } from "@/components/charts";
import { ErrosLeitura } from "@/components/erros-leitura";
import { getMeliDsp } from "@/lib/canais.functions";
import { ETAPA_LABEL } from "@/lib/melidsp";
import { fmtBRL, fmtBRL2, fmtNum, fmtPct, fmtX, fmtDate, periodo } from "@/lib/format";

// Mercado Ads / Meli DSP (display e vídeo do Mercado Livre). Receita atribuída pelo ML: não somar com a venda
// realizada. A coluna "TP" da fonte aparece separada (significado a confirmar). Só leitura.
export const Route = createFileRoute("/media_/meli-dsp")({
  head: () => ({
    meta: [
      { title: "Meli DSP — Soldiers Platform" },
      {
        name: "description",
        content:
          "Mercado Ads display e vídeo: funil, divisão de verba por etapa, campanhas e criativos.",
      },
    ],
  }),
  component: MeliDsp,
});

type D = Awaited<ReturnType<typeof getMeliDsp>>;
type Aba = "mix" | "campanhas" | "criativos";
const T = (r: unknown) => r as Record<string, unknown>[];

function MeliDsp() {
  const [dias, setDias] = useState("30");
  const fn = useServerFn(getMeliDsp);
  const p = periodo(dias);
  const q = useQuery({ queryKey: ["meli-dsp", p], queryFn: () => fn({ data: p }) });
  return (
    <>
      <PageHeader
        title="Meli DSP"
        subtitle="Display e vídeo do Mercado Ads: do alcance à unidade vendida, e se a verba segue a divisão 70/22/8."
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
  const [aba, setAba] = useState<Aba>("mix");
  const r = d.resumo;
  const a = r.anomalia;
  return (
    <div className="space-y-6">
      <ErrosLeitura
        erros={d.erros}
        nomes={{ kpi: "resumo diário", campanhas: "campanhas", criativos: "criativos" }}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        <Kpi label="Investido" value={fmtBRL(r.investimento)} />
        <Kpi
          label="Receita atribuída"
          value={fmtBRL(r.receita)}
          hint={`TP: ${fmtBRL(r.receita_tp)}`}
        />
        <Kpi label="ROAS" value={fmtX(r.roas)} hint={`com TP: ${fmtX(r.roasTp)}`} />
        <Kpi
          label="Alcance"
          value={fmtNum(r.alcance)}
          hint={`frequência ${r.frequencia == null ? "—" : r.frequencia.toFixed(1).replace(".", ",")}`}
        />
        <Kpi label="CPM / CTR" value={`${fmtBRL2(r.cpm)} · ${fmtPct(r.ctrPct, 2)}`} />
        <Kpi
          label="Último dia"
          value={a ? (a.sinais.length ? a.sinais.join(" · ") : "normal") : "—"}
          hint={a ? `${fmtDate(a.data)}: ${fmtBRL(a.gasto)}` : "pouco histórico"}
          {...(a?.sinais.length ? { tone: "warn" as const } : {})}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Investido e receita por dia" className="xl:col-span-2">
          {r.dias.length ? (
            <Bars
              data={r.dias.map((x) => ({ data: x.data, Investido: x.gasto, Receita: x.receita }))}
              x="data"
              keys={["Investido", "Receita"]}
              xIsDate
              stacked={false}
            />
          ) : (
            <Empty />
          )}
        </Panel>
        <Panel title="Funil">
          <Table head={["Etapa", "Volume", "Passagem"]}>
            {r.funil.map((f) => (
              <tr key={f.etapa}>
                <Td>{f.etapa}</Td>
                <Td mono>{fmtNum(f.valor)}</Td>
                <Td mono>{fmtPct(f.passagemPct, 1)}</Td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>

      <Pills
        value={aba}
        onChange={setAba}
        options={[
          { id: "mix", label: "Verba por etapa" },
          { id: "campanhas", label: "Campanhas" },
          { id: "criativos", label: "Criativos e vídeo" },
        ]}
      />
      {aba === "mix" && <Mix m={d.mix} />}
      {aba === "campanhas" && <Campanhas c={d.campanhas} />}
      {aba === "criativos" && <Criativos c={d.criativos} />}
    </div>
  );
}

function Mix({ m }: { m: D["mix"] }) {
  return (
    <Panel title="Verba por etapa do funil × divisão 70/22/8">
      <Table head={["Etapa", "Campanhas", "Investido", "Real", "Alvo", "Diferença", "ROAS"]}>
        {m.map((x) => (
          <tr key={x.etapa}>
            <Td>{ETAPA_LABEL[x.etapa]}</Td>
            <Td mono>{fmtNum(x.campanhas)}</Td>
            <Td mono>{fmtBRL(x.investimento)}</Td>
            <Td mono>{fmtPct(x.realPct, 0)}</Td>
            <Td mono>{x.alvoPct == null ? "—" : `${x.alvoPct}%`}</Td>
            <Td
              mono
              className={x.desvioPp != null && Math.abs(x.desvioPp) > 10 ? "text-warning" : ""}
            >
              {x.desvioPp == null
                ? "—"
                : `${x.desvioPp > 0 ? "+" : ""}${Math.round(x.desvioPp)} p.p.`}
            </Td>
            <Td mono>{fmtX(x.roas)}</Td>
          </tr>
        ))}
      </Table>
      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
        <li>
          Etapa lida pelo nome, tipo ou objetivo da campanha (CONVERSAO, DCA_RETARGETING,
          IN_MARKETING, VIDEO_INSTITU…).
        </li>
        <li>"Sem etapa" = campanha cujo nome não diz a etapa. Padronizar o nome resolve.</li>
        <li>
          ROAS de reconhecimento é naturalmente baixo: a verba dessa etapa se mede por alcance e
          vídeo assistido.
        </li>
      </ul>
    </Panel>
  );
}

function Campanhas({ c }: { c: D["campanhas"] }) {
  return (
    <Panel title="Campanhas" right={<CsvButton name="meli-dsp-campanhas" rows={T(c)} />}>
      {c.length ? (
        <Table
          head={[
            "Campanha",
            "Etapa",
            "Status",
            "Investido",
            "Alcance",
            "Freq.",
            "CTR",
            "Carrinho",
            "Unidades",
            "Receita",
            "ROAS",
          ]}
        >
          {c.map((x) => (
            <tr key={x.id}>
              <Td>{x.campanha}</Td>
              <Td>
                <StatusTag tone={x.etapa === "outros" ? "muted" : "primary"}>
                  {ETAPA_LABEL[x.etapa]}
                </StatusTag>
              </Td>
              <Td>{x.status || "—"}</Td>
              <Td mono>{fmtBRL(x.investimento)}</Td>
              <Td mono>{fmtNum(x.alcance)}</Td>
              <Td mono>{x.frequencia == null ? "—" : x.frequencia.toFixed(1).replace(".", ",")}</Td>
              <Td mono>{fmtPct(x.ctrPct, 2)}</Td>
              <Td mono>{fmtNum(x.add_to_cart)}</Td>
              <Td mono>{fmtNum(x.unidades)}</Td>
              <Td mono>{fmtBRL(x.receita)}</Td>
              <Td mono>{fmtX(x.roas)}</Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty />
      )}
    </Panel>
  );
}

function Criativos({ c }: { c: D["criativos"] }) {
  return (
    <Panel title="Criativos" right={<CsvButton name="meli-dsp-criativos" rows={T(c)} />}>
      {c.length ? (
        <Table
          head={[
            "Criativo",
            "Campanha",
            "Investido",
            "CTR",
            "ROAS",
            "Viu 25%",
            "→ 50%",
            "→ 75%",
            "→ fim",
          ]}
        >
          {c.slice(0, 100).map((x) => (
            <tr key={x.id}>
              <Td>{x.criativo}</Td>
              <Td>{x.campanha || "—"}</Td>
              <Td mono>{fmtBRL(x.investimento)}</Td>
              <Td mono>{fmtPct(x.ctrPct, 2)}</Td>
              <Td mono>{fmtX(x.roas)}</Td>
              <Td mono>{x.video ? fmtPct(x.q25Pct, 1) : "—"}</Td>
              <Td mono>{x.video ? fmtPct(x.q50Pct, 0) : "—"}</Td>
              <Td mono>{x.video ? fmtPct(x.q75Pct, 0) : "—"}</Td>
              <Td
                mono
                className={
                  x.video && x.completoPct != null && x.completoPct < 25 ? "text-warning" : ""
                }
              >
                {x.video ? fmtPct(x.completoPct, 0) : "—"}
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty />
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Retenção do vídeo: "Viu 25%" sobre as impressões; as demais sobre quem chegou a 25%. Em
        amarelo, vídeos que menos de 1 em 4 assiste até o fim: o começo prende, o meio perde.
      </p>
    </Panel>
  );
}
