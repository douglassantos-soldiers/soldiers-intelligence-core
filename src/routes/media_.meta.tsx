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
import { getMeta } from "@/lib/data.functions";
import { fmtBRL, fmtNum, fmtPct, fmtX, fmtDate, periodo } from "@/lib/format";

// Meta Ads (benchmarks/meta-ads/ANALISE.md §4). Receita informada pelo Meta é reportada pela plataforma;
// venda com UTM do Meta vem do Shopify. Não somar com a receita. Só recomendação.
export const Route = createFileRoute("/media_/meta")({
  head: () => ({
    meta: [
      { title: "Meta Ads — Soldiers Platform" },
      {
        name: "description",
        content:
          "Meta Ads × Shopify, envio de eventos, criativos e fadiga, públicos, posicionamento, funil e ritmo do dia.",
      },
    ],
  }),
  component: Meta,
});

type D = Awaited<ReturnType<typeof getMeta>>;
type Aba = "atribuicao" | "criativos" | "segmentos" | "funil";

const NOMES: Record<string, string> = {
  reconciliacao: "reconciliação Shopify × Meta",
  criativos: "criativos",
  fadiga: "fadiga",
  formatos: "formatos",
  publicos: "públicos",
  posicionamento: "posicionamento",
  demografia: "demografia",
  horario: "horário",
  funil: "funil",
  intraday: "gasto de hoje",
  kpi: "gasto por dia",
};

function Meta() {
  const [dias, setDias] = useState("30");
  const fn = useServerFn(getMeta);
  const p = periodo(dias);
  const q = useQuery({ queryKey: ["meta", p], queryFn: () => fn({ data: p }) });
  return (
    <>
      <PageHeader
        title="Meta Ads"
        subtitle="O que o Meta diz × o que o Shopify mostra, quais criativos cansaram e onde a verba rende."
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
  const [aba, setAba] = useState<Aba>("atribuicao");
  const r = d.reconciliacao;
  const erros = Object.keys(d.erros);
  return (
    <div className="space-y-6">
      {erros.length > 0 && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
          Não foi possível ler: {erros.map((k) => NOMES[k] ?? k).join(", ")}. O resto da tela usa o
          que carregou. Ver Data Health.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        <Kpi label="Investido" value={fmtBRL(r.gasto)} />
        <Kpi
          label="ROAS informado pelo Meta"
          value={fmtX(r.roasInformado)}
          hint={fmtBRL(r.receitaInformada)}
        />
        <Kpi
          label="ROAS pela venda com UTM"
          value={fmtX(r.roasUtm)}
          hint={`${fmtBRL(r.receitaUtm)} no Shopify`}
        />
        <Kpi
          label="Meta informa"
          value={r.inflacao == null ? "—" : `${r.inflacao.toFixed(1).replace(".", ",")}×`}
          hint="a venda com UTM do Meta"
          {...(r.inflacao != null && r.inflacao > 1.5 ? { tone: "warn" as const } : {})}
        />
        <Kpi
          label="Pedidos enviados ao Meta"
          value={fmtPct(r.coberturaEnvioPct, 0)}
          hint={`${fmtNum(r.enviados)} de ${fmtNum(r.pedidosTotais)}`}
          {...(r.coberturaEnvioPct != null && r.coberturaEnvioPct < 80
            ? { tone: "down" as const }
            : {})}
        />
        <Kpi label="Criativos com fadiga" value={fmtNum(d.criativos.fadiga.length)} />
      </div>

      <Pills
        value={aba}
        onChange={setAba}
        options={[
          { id: "atribuicao", label: "Meta × Shopify" },
          { id: "criativos", label: "Criativos" },
          { id: "segmentos", label: "Públicos e posicionamento" },
          { id: "funil", label: "Funil e ritmo" },
        ]}
      />

      {aba === "atribuicao" && <Atribuicao r={r} />}
      {aba === "criativos" && <Criativos c={d.criativos} />}
      {aba === "segmentos" && <Segmentos s={d.segmentos} />}
      {aba === "funil" && <FunilRitmo d={d} />}
    </div>
  );
}

function Atribuicao({ r }: { r: D["reconciliacao"] }) {
  return (
    <Panel title="Por dia" right={<CsvButton name="meta-reconciliacao" rows={r.dias} />}>
      {r.dias.length ? (
        <Table
          head={[
            "Dia",
            "Investido",
            "ROAS informado (Meta)",
            "ROAS com UTM (Shopify)",
            "Pedidos enviados ao Meta",
          ]}
        >
          {[...r.dias].reverse().map((x) => (
            <tr key={x.data}>
              <Td mono>{fmtDate(x.data)}</Td>
              <Td mono>{fmtBRL(x.gasto)}</Td>
              <Td mono>{fmtX(x.roasInformado)}</Td>
              <Td mono>{fmtX(x.roasUtm)}</Td>
              <Td
                mono
                className={x.coberturaPct != null && x.coberturaPct < 80 ? "text-destructive" : ""}
              >
                {fmtPct(x.coberturaPct, 0)}
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty />
      )}
      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
        <li>ROAS informado = receita que o Meta atribui a si (janela e modelo do Meta).</li>
        <li>
          ROAS com UTM = venda do Shopify com UTM do Meta (último clique rastreado). A verdade fica
          entre os dois.
        </li>
        <li>
          Pedidos enviados = pedidos do Shopify que chegaram ao Meta como evento de compra. Abaixo
          de 80%, o Meta otimiza com sinal faltando.
        </li>
      </ul>
    </Panel>
  );
}

function Criativos({ c }: { c: D["criativos"] }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 2xl:grid-cols-2">
        <Panel title="Fadiga" right={<StatusTag tone="warn">trocar ou renovar</StatusTag>}>
          {c.fadiga.length ? (
            <Table
              head={[
                "Criativo",
                "Público",
                "Freq. 7d / antes",
                "ROAS 7d / antes",
                "Investido 7d",
                "Diagnóstico",
              ]}
            >
              {c.fadiga.map((f, i) => (
                <tr key={i}>
                  <Td className="max-w-[200px] truncate">{f.criativo}</Td>
                  <Td className="max-w-[140px] truncate">{f.publico}</Td>
                  <Td mono>
                    {f.freq7d == null ? "—" : f.freq7d.toFixed(1).replace(".", ",")} /{" "}
                    {f.freqAnt == null ? "—" : f.freqAnt.toFixed(1).replace(".", ",")}
                  </Td>
                  <Td mono>
                    {fmtX(f.roas7d)} / {fmtX(f.roasAnt)}
                  </Td>
                  <Td mono>{fmtBRL(f.invest7d)}</Td>
                  <Td className="max-w-[200px] text-xs">{f.diagnostico}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>Nenhum criativo com sinal de fadiga.</Empty>
          )}
        </Panel>
        <Panel title="Por formato">
          {c.formatos.length ? (
            <Table head={["Formato", "Criativos", "Investido", "ROAS", "CTR"]}>
              {c.formatos.map((f) => (
                <tr key={f.formato}>
                  <Td>{f.formato}</Td>
                  <Td mono>{fmtNum(f.criativos)}</Td>
                  <Td mono>{fmtBRL(f.invest)}</Td>
                  <Td mono>{fmtX(f.roas)}</Td>
                  <Td mono>{fmtPct(f.ctrPct, 2)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty />
          )}
        </Panel>
      </div>
      <Panel title="Criativos" right={<CsvButton name="meta-criativos" rows={c.lista} />}>
        {c.lista.length ? (
          <Table
            head={[
              "Criativo",
              "Campanha / público",
              "Investido",
              "ROAS",
              "Hook",
              "CTR",
              "Freq.",
              "Sugestão",
            ]}
          >
            {c.lista.map((x, i) => {
              const forte = c.roasMedio != null && x.roas != null && x.roas >= c.roasMedio * 1.3;
              const fraco = c.roasMedio != null && x.roas != null && x.roas <= c.roasMedio * 0.5;
              return (
                <tr key={i}>
                  <Td className="max-w-[220px]">
                    <div className="truncate font-medium" title={x.criativo}>
                      {x.criativo}
                    </div>
                    {x.titulo && x.titulo !== x.criativo && (
                      <div className="truncate text-xs text-muted-foreground">{x.titulo}</div>
                    )}
                  </Td>
                  <Td className="max-w-[200px]">
                    <div className="truncate">{x.campanha}</div>
                    <div className="truncate text-xs text-muted-foreground">{x.publico}</div>
                  </Td>
                  <Td mono>{fmtBRL(x.invest)}</Td>
                  <Td mono className={forte ? "text-success" : fraco ? "text-destructive" : ""}>
                    {fmtX(x.roas)}
                  </Td>
                  <Td mono>{fmtPct(x.hookPct, 0)}</Td>
                  <Td mono>{fmtPct(x.ctrPct, 2)}</Td>
                  <Td mono>
                    {x.frequencia == null ? "—" : x.frequencia.toFixed(1).replace(".", ",")}
                  </Td>
                  <Td className="max-w-[220px] text-xs">{x.sugestao}</Td>
                </tr>
              );
            })}
          </Table>
        ) : (
          <Empty />
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Verde: ROAS 30% acima da média ({fmtX(c.roasMedio)}); vermelho: metade da média ou menos.
          Hook = retenção dos primeiros segundos do vídeo, como definido na view. Janela definida em
          vw_meta_criativos.
        </p>
      </Panel>
    </div>
  );
}

function SegTabela({ titulo, linhas }: { titulo: string; linhas: D["segmentos"]["publicos"] }) {
  return (
    <Panel title={titulo}>
      {linhas.length ? (
        <Table head={["", "Investido", "ROAS", "CTR"]}>
          {linhas.slice(0, 15).map((x) => (
            <tr key={x.rotulo}>
              <Td className="max-w-[240px]">
                <span className="truncate">{x.rotulo}</span>
                {x.sinal !== "neutro" && (
                  <span className="ml-2">
                    <StatusTag tone={x.sinal === "forte" ? "success" : "danger"}>
                      {x.sinal}
                    </StatusTag>
                  </span>
                )}
              </Td>
              <Td mono>{fmtBRL(x.invest)}</Td>
              <Td mono>{fmtX(x.roas)}</Td>
              <Td mono>{fmtPct(x.ctrPct, 2)}</Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty />
      )}
    </Panel>
  );
}

function Segmentos({ s }: { s: D["segmentos"] }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-6 2xl:grid-cols-2">
        <SegTabela titulo="Públicos" linhas={s.publicos} />
        <SegTabela titulo="Posicionamento" linhas={s.posicionamento} />
        <SegTabela titulo="Idade e gênero" linhas={s.demografia} />
        <SegTabela titulo="Horário" linhas={s.horario} />
      </div>
      <p className="text-xs text-muted-foreground">
        Forte: ROAS 30% acima da média do bloco; fraco: 30% abaixo (só segmentos com 3%+ do
        investimento). Janelas definidas nas views vw_meta_*. Números agregados, sem dado pessoal.
      </p>
    </div>
  );
}

function FunilRitmo({ d }: { d: D }) {
  const r = d.ritmo;
  return (
    <div className="grid gap-6 2xl:grid-cols-2">
      <Panel title="Funil">
        {d.funil.length ? (
          <Table head={["Etapa", "Volume", "Passagem", "Custo por etapa"]}>
            {d.funil.map((f) => (
              <tr key={f.etapa}>
                <Td>{f.etapa}</Td>
                <Td mono>{fmtNum(f.valor)}</Td>
                <Td mono>{f.passagem || "—"}</Td>
                <Td mono>{fmtBRL(f.cpa)}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty />
        )}
      </Panel>
      <Panel
        title="Ritmo de hoje"
        right={
          r ? <span className="text-xs text-muted-foreground">{fmtDate(r.data)}</span> : undefined
        }
      >
        {r ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Kpi
                label="Gasto até agora"
                value={fmtBRL(r.gasto)}
                hint={`${fmtPct(r.pctDia, 0)} do dia passado`}
              />
              <Kpi
                label="Projeção do dia"
                value={fmtBRL(r.projecao)}
                hint={`média de 7 dias: ${fmtBRL(r.mediaDia)}`}
                {...(r.ritmo === "acima" ? { tone: "warn" as const } : {})}
              />
              <Kpi
                label="ROAS de hoje (Meta)"
                value={fmtX(r.roas)}
                hint={`média de 7 dias: ${fmtX(r.mediaRoas)}`}
              />
              <Kpi label="Ritmo" value={r.ritmo === "sem_base" ? "—" : r.ritmo} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Acima/abaixo = projeção 25% acima/abaixo da média diária dos últimos 7 dias fechados.
            </p>
          </>
        ) : (
          <Empty>Sem captura de hoje.</Empty>
        )}
      </Panel>
    </div>
  );
}
