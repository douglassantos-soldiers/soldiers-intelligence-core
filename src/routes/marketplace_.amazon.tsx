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
import { getAmazon } from "@/lib/data.functions";
import { fmtBRL, fmtBRL2, fmtNum, fmtPct, fmtDate, periodo } from "@/lib/format";
import { DIAS_SEMANA, type ShareTermo } from "@/lib/amazon";
import { CRITERIOS_ANUNCIO } from "@/lib/amazon-operacao";
import { Bars } from "@/components/charts";

// Amazon: o que já é coletado e não aparecia em nenhuma tela (benchmarks/amazon/ANALISE.md §4).
// ASIN 360°, search terms de Ads, share de busca (Brand Analytics), reposição FBA e recompra.
// Venda de Ads é atribuída pela Amazon (janela de 14 dias): não somar com a venda realizada.
// Tarifas reais e repasse entram com a Finances API (ainda não conectada).
export const Route = createFileRoute("/marketplace_/amazon")({
  head: () => ({
    meta: [
      { title: "Amazon — Soldiers Platform" },
      {
        name: "description",
        content:
          "Amazon por ASIN: tráfego, conversão, Buy Box, estoque FBA, termos de busca de Ads, share de busca e recompra.",
      },
    ],
  }),
  component: Amazon,
});

type D = Awaited<ReturnType<typeof getAmazon>>;

const NOMES_BLOCO: Record<string, string> = {
  trafego: "vendas e tráfego da conta",
  ads: "Sponsored Products por campanha",
  adsSb: "Sponsored Brands por campanha",
  adsSd: "Sponsored Display por campanha",
  vendas: "vendas por ASIN",
  buybox: "Buy Box",
  estoque: "estoque FBA",
  reposicao: "reposição",
  cadastro: "cadastro",
  termos: "search terms de Ads",
  brand: "Brand Analytics",
  recompra: "recompra",
  horas: "vendas por hora",
  keywords: "keywords de Ads",
  sd: "alvos de Sponsored Display",
  semanas: "tendência semanal",
  intraday: "venda de hoje",
  sbTermos: "termos de Sponsored Brands",
  sdProduto: "Sponsored Display por produto",
  campanhas: "orçamento das campanhas",
  pedidos: "pedidos",
};

function Amazon() {
  const [dias, setDias] = useState("30");
  const fn = useServerFn(getAmazon);
  const p = periodo(dias);
  const q = useQuery({ queryKey: ["amazon", p], queryFn: () => fn({ data: p }) });
  return (
    <>
      <PageHeader
        title="Amazon"
        subtitle="Por que cada ASIN vende mais ou menos: tráfego, conversão, Buy Box, estoque e busca."
        right={
          <div className="flex items-center gap-4">
            <Link to="/marketplace" className="text-sm font-medium text-primary hover:underline">
              ← Marketplace
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

const NOME_TIPO_ADS: Record<string, string> = {
  SP: "Sponsored Products",
  SB: "Sponsored Brands",
  SD: "Sponsored Display",
};

const SHARE_TOM: Record<ShareTermo["status"], "success" | "danger" | "muted" | "primary"> = {
  ganhou: "success",
  novo: "primary",
  estavel: "muted",
  perdeu: "danger",
  saiu: "danger",
};

function Body({ d }: { d: D }) {
  const r = d.resumo;
  const [filtro, setFiltro] = useState<"problema" | "todos">("problema");
  const asins = filtro === "problema" ? d.asins.filter((a) => a.problemas.length) : d.asins;
  const erros = Object.keys(d.erros);
  const [aba, setAba] = useState<
    "tendencia" | "visao" | "anuncio" | "ads" | "busca" | "pedidos" | "horas"
  >("visao");
  const [tipoTermo, setTipoTermo] = useState<"sp" | "sb">("sp");
  const termos = tipoTermo === "sp" ? d.termos : d.termosSb;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Ainda sem tarifas reais nem repasse da Amazon: margem e contribuição entram quando a
        Finances API for conectada. Venda de Ads é <strong>atribuída</strong> pela Amazon (Sponsored
        Products em 7 dias, Brands e Display em 14, como no Console para vendedor) e não se soma à
        venda realizada. Ads = Sponsored Products + Brands + Display; Amazon DSP ainda não é
        coletado.
        {r.diasEmConsolidacao > 0 &&
          ` ${fmtNum(r.diasEmConsolidacao)} dia(s) do período ainda em consolidação pela Amazon.`}
        {r.ads.diasMaturando > 0 &&
          ` ${fmtNum(r.ads.diasMaturando)} dia(s) com anúncio ainda maturando: a venda atribuída chega em até 14 dias, então o ACoS recente tende a cair.`}
      </div>

      {erros.length > 0 && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
          Não foi possível ler: {erros.map((k) => NOMES_BLOCO[k] ?? k).join(", ")}. O resto da tela
          usa o que carregou. Ver Data Health.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-8">
        <Kpi
          label="Vendas (realizadas)"
          value={fmtBRL(r.vendas)}
          hint={`${fmtNum(r.unidades)} unid.`}
        />
        <Kpi label="Sessões" value={fmtNum(r.sessoes)} />
        <Kpi label="Conversão" value={fmtPct(r.conversaoPct)} hint="unidades ÷ sessões" />
        <Kpi
          label="Buy Box"
          value={fmtPct(r.buyboxPct, 0)}
          hint="% das sessões"
          {...(r.buyboxPct != null && r.buyboxPct < 90 ? { tone: "warn" as const } : {})}
        />
        <Kpi label="Devolução" value={fmtPct(r.devolucaoPct)} hint="unid. devolvidas ÷ vendidas" />
        <Kpi label="Ads: investimento" value={fmtBRL(r.ads.custo)} />
        <Kpi
          label="ACoS"
          value={fmtPct(r.ads.acosPct)}
          hint={`sobre ${fmtBRL(r.ads.vendasAtribuidas)} atribuídos (${r.ads.janelas.join(" · ") || "—"}) · tudo em 14d: ${fmtPct(r.ads.acos14dPct)}`}
        />
        <Kpi label="TACoS" value={fmtPct(r.ads.tacosPct)} hint="Ads ÷ venda realizada" />
      </div>

      <Pills
        value={aba}
        onChange={setAba}
        options={[
          { id: "tendencia", label: "Tendência e hoje" },
          { id: "visao", label: "Produtos e estoque" },
          { id: "anuncio", label: "Buy Box e anúncio" },
          { id: "ads", label: "Ads" },
          { id: "busca", label: "Busca" },
          { id: "pedidos", label: "Pedidos" },
          { id: "horas", label: "Horários" },
        ]}
      />

      {aba === "visao" && (
        <>
          <Panel
            title="ASIN 360°"
            right={
              <div className="flex items-center gap-3">
                <Pills
                  value={filtro}
                  onChange={setFiltro}
                  options={[
                    { id: "problema", label: "Com problema" },
                    { id: "todos", label: "Todos" },
                  ]}
                />
                <CsvButton
                  name="amazon-asin-360"
                  rows={d.asins.map((a) => ({ ...a, problemas: a.problemas.join("; ") }))}
                />
              </div>
            }
          >
            {asins.length ? (
              <Table
                head={[
                  "Produto",
                  "Vendas",
                  "Sessões",
                  "Conversão",
                  "Buy Box",
                  "Preço / menor concorr.",
                  "FBA",
                  "Cobertura",
                  "O que olhar",
                ]}
              >
                {asins.map((a) => (
                  <tr key={a.asin}>
                    <Td className="max-w-[260px]">
                      <div className="truncate font-medium" title={a.titulo}>
                        {a.titulo}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">{a.asin}</div>
                    </Td>
                    <Td mono>{fmtBRL(a.vendas)}</Td>
                    <Td mono>{fmtNum(a.sessoes)}</Td>
                    <Td mono>{fmtPct(a.conversaoPct)}</Td>
                    <Td mono className={a.ganhaBuyBox === false ? "text-destructive" : ""}>
                      {fmtPct(a.buyboxPct, 0)}
                    </Td>
                    <Td mono>
                      {fmtBRL2(a.meuPreco)} / {fmtBRL2(a.menorConcorrente)}
                    </Td>
                    <Td mono>{fmtNum(a.fbaDisponivel)}</Td>
                    <Td mono>{a.coberturaDias == null ? "—" : `${fmtNum(a.coberturaDias)} d`}</Td>
                    <Td className="min-w-[220px]">
                      <div className="flex flex-wrap gap-1">
                        {a.problemas.length ? (
                          a.problemas.map((p) => (
                            <StatusTag key={p} tone="warn">
                              {p}
                            </StatusTag>
                          ))
                        ) : (
                          <StatusTag tone="success">ok</StatusTag>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </Table>
            ) : (
              <Empty>
                {filtro === "problema" ? "Nenhum ASIN com problema no período." : undefined}
              </Empty>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Buy Box e conversão do período (Sales &amp; Traffic); preço, Buy Box atual, estoque e
              cadastro na última leitura. Mostra os 60 ASINs que mais venderam.
            </p>
          </Panel>

          <EstoqueFbaPanel e={d.estoqueFba} />

          <div className="grid gap-6 2xl:grid-cols-2">
            <Panel title="Reposição FBA">
              <p className="mb-3 text-sm text-muted-foreground">
                SKUs com alerta ou menos de 21 dias de cobertura. Estoque FBA não se soma ao estoque
                próprio nem ao Full.
                {d.reposicao.imprestavelTotal > 0 &&
                  ` ${fmtNum(d.reposicao.imprestavelTotal)} unid. imprestáveis no FBA (avaliar remoção).`}
              </p>
              {d.reposicao.lista.length ? (
                <Table
                  head={[
                    "Produto",
                    "Disponível",
                    "A caminho",
                    "Média/dia",
                    "Cobertura",
                    "Enviar (30d)",
                    "Alerta",
                  ]}
                >
                  {d.reposicao.lista.slice(0, 20).map((x) => (
                    <tr key={x.sku}>
                      <Td className="max-w-[240px]">
                        <div className="truncate" title={x.titulo}>
                          {x.titulo}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">{x.sku}</div>
                      </Td>
                      <Td mono>{fmtNum(x.disponivel)}</Td>
                      <Td mono>{fmtNum(x.aCaminho)}</Td>
                      <Td mono>
                        {x.mediaDiaria == null ? "—" : x.mediaDiaria.toFixed(1).replace(".", ",")}
                      </Td>
                      <Td
                        mono
                        className={
                          x.coberturaDias != null && x.coberturaDias < 14 ? "text-destructive" : ""
                        }
                      >
                        {x.coberturaDias == null ? "—" : `${fmtNum(x.coberturaDias)} d`}
                      </Td>
                      <Td mono>{fmtNum(x.enviar30d)}</Td>
                      <Td>{x.alerta || "—"}</Td>
                    </tr>
                  ))}
                </Table>
              ) : (
                <Empty>Nenhum SKU com cobertura curta.</Empty>
              )}
            </Panel>

            <Panel
              title="Recompra por ASIN"
              right={
                d.recompra.mes ? (
                  <span className="text-xs text-muted-foreground">
                    mês até {fmtDate(d.recompra.mes)}
                  </span>
                ) : undefined
              }
            >
              {d.recompra.lista.length ? (
                <Table head={["ASIN", "Clientes", "% que recompram", "Receita de recompra"]}>
                  {d.recompra.lista.map((x) => (
                    <tr key={x.asin}>
                      <Td mono>{x.asin}</Td>
                      <Td mono>{fmtNum(x.clientes)}</Td>
                      <Td mono>{fmtPct(x.pctRepetem)}</Td>
                      <Td mono>{fmtBRL(x.receitaRecompra)}</Td>
                    </tr>
                  ))}
                </Table>
              ) : (
                <Empty>Sem dados de recompra recentes.</Empty>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Brand Analytics (Repeat Purchase): clientes da Amazon, sem identificação. Não se
                cruza com o CRM da Soldiers.
              </p>
            </Panel>
          </div>
        </>
      )}

      {aba === "ads" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Termos de busca de</span>
            <Pills
              value={tipoTermo}
              onChange={setTipoTermo}
              options={[
                { id: "sp", label: "Sponsored Products" },
                { id: "sb", label: "Sponsored Brands" },
              ]}
            />
            <span className="text-xs text-muted-foreground">
              Sponsored Display não tem relatório de termo de busca: entra por produto e por alvo.
            </span>
          </div>
          <div className="grid gap-6 2xl:grid-cols-2">
            <Panel
              title="Termos para negativar"
              right={<StatusTag tone="danger">gasto sem venda</StatusTag>}
            >
              <p className="mb-3 text-sm text-muted-foreground">
                Gastaram R$ 30 ou mais, com 10+ cliques e nenhuma compra no período. Recomendação:
                avaliar como negativa. Nada é alterado na conta.
              </p>
              {termos.negativar.length ? (
                <Table head={["Termo", "Investido", "Cliques", "Campanhas"]}>
                  {termos.negativar.map((t) => (
                    <tr key={t.termo}>
                      <Td>{t.termo}</Td>
                      <Td mono>{fmtBRL(t.custo)}</Td>
                      <Td mono>{fmtNum(t.cliques)}</Td>
                      <Td mono>{fmtNum(t.campanhas)}</Td>
                    </tr>
                  ))}
                </Table>
              ) : (
                <Empty>Nenhum termo acima do critério.</Empty>
              )}
            </Panel>

            <Panel
              title="Termos para virar palavra-chave exata"
              right={<StatusTag tone="success">converte barato</StatusTag>}
            >
              <p className="mb-3 text-sm text-muted-foreground">
                2+ compras e ACoS abaixo da referência ({fmtPct(termos.acosReferenciaPct)}), ainda
                sem keyword exata. Recomendação: criar a exata e controlar o lance.
              </p>
              {termos.promover.length ? (
                <Table head={["Termo", "Vendas atrib.", "Compras", "ACoS", "Investido"]}>
                  {termos.promover.map((t) => (
                    <tr key={t.termo}>
                      <Td>{t.termo}</Td>
                      <Td mono>{fmtBRL(t.vendasAtribuidas)}</Td>
                      <Td mono>{fmtNum(t.compras)}</Td>
                      <Td mono className="text-success">
                        {fmtPct(t.acosPct)}
                      </Td>
                      <Td mono>{fmtBRL(t.custo)}</Td>
                    </tr>
                  ))}
                </Table>
              ) : (
                <Empty>Nenhum termo acima do critério.</Empty>
              )}
            </Panel>

            <Lances titulo="Keywords: ajustar lance" l={d.lances.keywords} tipoAlvo="Keyword" />
            <Lances titulo="Sponsored Display: alvos" l={d.lances.sd} tipoAlvo="Alvo" />
            <Panel title="Ads por tipo">
              {r.ads.porTipo.length ? (
                <Table head={["Tipo", "Investido", "Vendas atrib.", "Janela", "ACoS", "Cliques"]}>
                  {r.ads.porTipo.map((t) => (
                    <tr key={t.tipo}>
                      <Td>{NOME_TIPO_ADS[t.tipo] ?? t.tipo}</Td>
                      <Td mono>{fmtBRL(t.custo)}</Td>
                      <Td mono>{fmtBRL(t.vendasAtribuidas)}</Td>
                      <Td mono>{t.janela}</Td>
                      <Td mono>{fmtPct(t.acosPct)}</Td>
                      <Td mono>{fmtNum(t.cliques)}</Td>
                    </tr>
                  ))}
                </Table>
              ) : (
                <Empty />
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Sponsored Brands e Display vêm das tabelas próprias de cada tipo; um tipo que não
                aparece aqui não tem gasto no período ou não está sendo coletado (ver Data Health).
                Amazon DSP: sem dados no banco; precisa de conector próprio (acesso de DSP e
                relatórios de DSP da Amazon Ads API).
              </p>
            </Panel>
            <Orcamento o={d.orcamento} />
            <SdProduto l={d.sdProduto} />
          </div>
        </div>
      )}

      {aba === "busca" && (
        <div className="grid gap-6 2xl:grid-cols-2">
          <Panel
            title="Share de busca (Brand Analytics)"
            right={
              d.share.semana ? (
                <span className="text-xs text-muted-foreground">
                  semana até {fmtDate(d.share.semana)}
                </span>
              ) : undefined
            }
          >
            <p className="mb-3 text-sm text-muted-foreground">
              Participação dos ASINs da Soldiers entre os 3 mais clicados de cada termo, contra a
              semana anterior.
              {d.share.perderam > 0 && ` ${fmtNum(d.share.perderam)} termo(s) perderam espaço.`}
            </p>
            {d.share.lista.length ? (
              <Table
                head={[
                  "Termo",
                  "Rank de busca",
                  "Click share",
                  "Conversion share",
                  "vs. semana ant.",
                  "",
                ]}
              >
                {d.share.lista.map((t) => (
                  <tr key={t.termo}>
                    <Td>{t.termo}</Td>
                    <Td mono>{fmtNum(t.rank)}</Td>
                    <Td mono>{fmtPct(t.clickShare)}</Td>
                    <Td mono>{fmtPct(t.conversionShare)}</Td>
                    <Td mono>
                      {t.variacaoPp == null
                        ? "—"
                        : `${t.variacaoPp > 0 ? "+" : ""}${t.variacaoPp.toFixed(1).replace(".", ",")} p.p.`}
                    </Td>
                    <Td>
                      <StatusTag tone={SHARE_TOM[t.status]}>{t.status}</StatusTag>
                    </Td>
                  </tr>
                ))}
              </Table>
            ) : (
              <Empty>Sem dados de Brand Analytics nas últimas semanas.</Empty>
            )}
          </Panel>

          <OrganicoAds o={d.organico} />
        </div>
      )}

      {aba === "horas" && <Horas h={d.horas} />}
      {aba === "tendencia" && <Tendencia d={d} />}
      {aba === "anuncio" && <BuyBoxAnuncio d={d} />}
      {aba === "pedidos" && <Pedidos p={d.pedidos} />}
    </div>
  );
}

function Lances({
  titulo,
  l,
  tipoAlvo,
}: {
  titulo: string;
  l: D["lances"]["keywords"];
  tipoAlvo: string;
}) {
  const linhas = [
    ...l.subir.map((a) => ({ ...a, acao: "subir" as const })),
    ...l.baixar.map((a) => ({ ...a, acao: "baixar" as const })),
    ...l.pausar.map((a) => ({ ...a, acao: "pausar" as const })),
  ];
  const tom = { subir: "success", baixar: "warn", pausar: "danger" } as const;
  return (
    <Panel
      title={titulo}
      right={<CsvButton name={`amazon-${tipoAlvo.toLowerCase()}-lances`} rows={linhas} />}
    >
      <p className="mb-3 text-sm text-muted-foreground">
        ACoS de referência {fmtPct(l.acosReferenciaPct)}. Subir: ACoS até 70% da referência e 3+
        compras. Baixar: ACoS 50% acima da referência. Pausar: gasto sem compra. Lance sugerido =
        CPC atual ajustado ao ACoS de referência, no máximo ±30%. Nada é alterado na conta.
      </p>
      {linhas.length ? (
        <Table
          head={[
            "Ação",
            tipoAlvo,
            "Campanha",
            "Investido",
            "Compras",
            "ACoS",
            "CPC",
            "Lance sugerido",
          ]}
        >
          {linhas.map((a) => (
            <tr key={`${a.acao}|${a.campanha}|${a.alvo}|${a.tipoMatch}`}>
              <Td>
                <StatusTag tone={tom[a.acao]}>{a.acao}</StatusTag>
              </Td>
              <Td className="max-w-[220px]">
                <div className="truncate" title={a.alvo}>
                  {a.alvo}
                </div>
                {a.tipoMatch && (
                  <div className="text-xs text-muted-foreground">{a.tipoMatch.toLowerCase()}</div>
                )}
              </Td>
              <Td className="max-w-[180px] truncate">{a.campanha}</Td>
              <Td mono>{fmtBRL(a.custo)}</Td>
              <Td mono>{fmtNum(a.compras)}</Td>
              <Td mono>{fmtPct(a.acosPct)}</Td>
              <Td mono>{fmtBRL2(a.cpc)}</Td>
              <Td mono>{a.acao === "pausar" ? "—" : fmtBRL2(a.lanceSugerido)}</Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty>Nenhum ajuste sugerido no período.</Empty>
      )}
    </Panel>
  );
}

function OrganicoAds({ o }: { o: D["organico"] }) {
  return (
    <Panel title="Busca orgânica × Ads">
      <p className="mb-3 text-sm text-muted-foreground">
        Cruza o share de busca (Brand Analytics) com o gasto em Ads do mesmo termo.
      </p>
      <h3 className="mb-2 text-sm font-semibold">Perdemos espaço e não anunciamos</h3>
      {o.anunciar.length ? (
        <Table head={["Termo", "Rank de busca", "Click share", "vs. semana ant."]}>
          {o.anunciar.map((t) => (
            <tr key={t.termo}>
              <Td>{t.termo}</Td>
              <Td mono>{fmtNum(t.rank)}</Td>
              <Td mono>{fmtPct(t.clickShare)}</Td>
              <Td mono className="text-destructive">
                {t.variacaoPp == null ? "—" : `${t.variacaoPp.toFixed(1).replace(".", ",")} p.p.`}
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty>Nenhum termo nessa situação.</Empty>
      )}
      <h3 className="mb-2 mt-5 text-sm font-semibold">Dominamos a busca e ainda pagamos</h3>
      {o.reduzirLance.length ? (
        <Table head={["Termo", "Click share", "Investido em Ads", "ACoS"]}>
          {o.reduzirLance.map((t) => (
            <tr key={t.termo}>
              <Td>{t.termo}</Td>
              <Td mono>{fmtPct(t.clickShare)}</Td>
              <Td mono>{fmtBRL(t.custoAds)}</Td>
              <Td mono>{fmtPct(t.acosPct)}</Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty>Nenhum termo nessa situação.</Empty>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Hipótese a testar: em termos com click share alto, parte do tráfego pago viria pela busca
        orgânica. Reduzir o lance aos poucos e medir a venda total do ASIN, não só a de Ads.
      </p>
    </Panel>
  );
}

function Horas({ h }: { h: D["horas"] }) {
  if (!h.total) return <Empty>Sem vendas por hora no período.</Empty>;
  // Escala sequencial de uma cor (primária), clara → escura conforme a venda média.
  const nivel = (v: number) => (h.max ? v / h.max : 0);
  return (
    <div className="space-y-6">
      <Panel title="Venda média por dia da semana e hora">
        <div className="overflow-x-auto">
          <table className="border-separate" style={{ borderSpacing: 2 }}>
            <thead>
              <tr>
                <th />
                {Array.from({ length: 24 }, (_, hr) => (
                  <th
                    key={hr}
                    className="w-7 text-center font-mono text-[10px] font-normal text-muted-foreground"
                  >
                    {hr}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DIAS_SEMANA.map((dn, dow) => (
                <tr key={dn}>
                  <th className="pr-2 text-right text-xs font-normal text-muted-foreground">
                    {dn}
                  </th>
                  {h.celulas
                    .filter((c) => c.dow === dow)
                    .map((c) => {
                      const t = nivel(c.vendaMedia);
                      return (
                        <td
                          key={c.hora}
                          title={`${dn} ${c.hora}h: ${fmtBRL(c.vendaMedia)} em média · ${c.pedidosMedia.toFixed(1).replace(".", ",")} pedidos`}
                          aria-label={`${dn} ${c.hora}h: ${fmtBRL(c.vendaMedia)}`}
                          className="h-6 w-7 rounded-[3px] hover:ring-2 hover:ring-foreground/60"
                          style={{
                            background:
                              c.vendaMedia > 0
                                ? `color-mix(in oklab, var(--primary) ${Math.round(12 + t * 88)}%, transparent)`
                                : "var(--muted)",
                          }}
                        />
                      );
                    })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>menos venda</span>
          {[0.12, 0.34, 0.56, 0.78, 1].map((x) => (
            <span
              key={x}
              className="inline-block h-3 w-5 rounded-[3px]"
              style={{
                background: `color-mix(in oklab, var(--primary) ${Math.round(x * 100)}%, transparent)`,
              }}
            />
          ))}
          <span>mais venda</span>
          <span className="ml-4">Passe o mouse em uma célula para ver o valor.</span>
        </div>
      </Panel>
      <div className="grid gap-6 2xl:grid-cols-2">
        <Panel title="Melhores horários">
          <Table head={["Quando", "Venda média", "Pedidos médios"]}>
            {h.melhores.map((c) => (
              <tr key={`${c.dow}-${c.hora}`}>
                <Td>
                  {DIAS_SEMANA[c.dow]} {c.hora}h–{c.hora + 1}h
                </Td>
                <Td mono>{fmtBRL(c.vendaMedia)}</Td>
                <Td mono>{c.pedidosMedia.toFixed(1).replace(".", ",")}</Td>
              </tr>
            ))}
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">
            Base para dayparting: concentrar orçamento nos horários fortes. O gasto por hora entra
            com o Marketing Stream (não conectado). Hora no fuso de Brasília (a confirmar).
          </p>
        </Panel>
        <Panel title="Venda por hora (todos os dias)">
          <Table head={["Hora", "% da venda"]}>
            {[...h.porHora]
              .sort((a, b) => b.pct - a.pct)
              .slice(0, 8)
              .map((x) => (
                <tr key={x.hora}>
                  <Td>
                    {x.hora}h–{x.hora + 1}h
                  </Td>
                  <Td mono>{fmtPct(x.pct)}</Td>
                </tr>
              ))}
          </Table>
        </Panel>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Segunda leva (benchmarks/amazon/REVISAO_IMPLEMENTACAO.md §3)

const sinal = (v: number | null) =>
  v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1).replace(".", ",")}%`;

function Tendencia({ d }: { d: D }) {
  const t = d.tendencia;
  const h = d.hoje;
  const ult = t.ultima;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="Hoje até agora"
          value={h.data ? fmtBRL(h.venda) : "—"}
          hint={
            h.data
              ? `${fmtNum(h.pedidos)} pedidos · ${sinal(h.variacaoPct)} vs. ${fmtDate(h.semanaPassada)} no mesmo horário`
              : "sem venda de hoje no banco"
          }
          {...(h.variacaoPct != null
            ? { tone: h.variacaoPct >= 0 ? ("up" as const) : ("warn" as const) }
            : {})}
        />
        <Kpi
          label="Última semana fechada"
          value={ult ? fmtBRL(ult.faturamento) : "—"}
          hint={ult ? `${sinal(t.variacao.faturamentoPct)} vs. semana anterior` : ""}
        />
        <Kpi
          label="Pedidos na semana"
          value={ult ? fmtNum(ult.pedidos) : "—"}
          hint={ult ? `${sinal(t.variacao.pedidosPct)} vs. semana anterior` : ""}
        />
        <Kpi
          label="TACoS na semana"
          value={ult ? fmtPct(ult.tacosPct) : "—"}
          hint={ult ? `Ads ${fmtBRL(ult.investAds)} (${sinal(t.variacao.investAdsPct)})` : ""}
        />
      </div>
      <Panel
        title="Últimas 12 semanas"
        right={<CsvButton name="amazon-tendencia-semanal" rows={t.semanas} />}
      >
        {t.semanas.length ? (
          <>
            <Bars
              data={t.semanas.map((s) => ({
                semana: s.parcial ? `${s.rotulo}*` : s.rotulo,
                Faturamento: s.faturamento,
                "Investimento em Ads": s.investAds,
              }))}
              x="semana"
              keys={["Faturamento", "Investimento em Ads"]}
              stacked={false}
            />
            <Table
              head={[
                "Semana",
                "Faturamento",
                "Pedidos",
                "Conversão",
                "Ads",
                "TACoS",
                "ROAS Ads",
                "Devolução",
              ]}
            >
              {[...t.semanas].reverse().map((s) => (
                <tr key={s.semana}>
                  <Td mono>
                    {fmtDate(s.semana)}
                    {s.parcial && (
                      <span className="ml-2">
                        <StatusTag tone="muted">parcial</StatusTag>
                      </span>
                    )}
                  </Td>
                  <Td mono>{fmtBRL(s.faturamento)}</Td>
                  <Td mono>{fmtNum(s.pedidos)}</Td>
                  <Td mono>{fmtPct(s.conversaoPct)}</Td>
                  <Td mono>{fmtBRL(s.investAds)}</Td>
                  <Td mono>{fmtPct(s.tacosPct)}</Td>
                  <Td mono>
                    {s.roasAds == null ? "—" : `${s.roasAds.toFixed(1).replace(".", ",")}×`}
                    {s.adsMaturando && (
                      <span className="ml-2">
                        <StatusTag tone="warn">maturando</StatusTag>
                      </span>
                    )}
                  </Td>
                  <Td mono>{fmtPct(s.devolucaoPct)}</Td>
                </tr>
              ))}
            </Table>
          </>
        ) : (
          <Empty>Sem semanas em vw_amazon_tendencia_semana.</Empty>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Sempre as últimas 12 semanas, independente do período escolhido. * = semana em andamento
          (fora da comparação). &quot;Maturando&quot; = venda atribuída de anúncio ainda chegando
          (até 14 dias): o ROAS dessas semanas tende a subir.
        </p>
      </Panel>
      <Panel
        title={
          h.data
            ? `Hoje (${fmtDate(h.data)}) × ${fmtDate(h.semanaPassada)}, por faixa de horário`
            : "Hoje até agora"
        }
      >
        {h.linhas.length ? (
          <Bars
            data={h.linhas.map((l) => ({
              faixa: l.faixa,
              Hoje: l.hoje,
              "Semana passada": l.semanaPassada,
            }))}
            x="faixa"
            keys={["Hoje", "Semana passada"]}
            stacked={false}
            height={220}
          />
        ) : (
          <Empty>Sem venda de hoje em vw_amazon_venda_intraday.</Empty>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Compara só as faixas que já aparecem hoje com as mesmas faixas 7 dias antes, para ser
          &quot;até agora&quot;. Pedido recente pode entrar com atraso.
        </p>
      </Panel>
    </div>
  );
}

function BuyBoxAnuncio({ d }: { d: D }) {
  const b = d.buybox;
  const q = d.qualidade;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="ASINs sem Buy Box"
          value={fmtNum(b.semBuyBox)}
          hint={`${fmtBRL(b.vendaSemBuyBox)} vendidos no período`}
          {...(b.semBuyBox ? { tone: "warn" as const } : {})}
        />
        <Kpi
          label="Acima do preço da Buy Box"
          value={fmtNum(b.acimaDaBuyBox)}
          hint="entre os sem Buy Box"
        />
        <Kpi
          label="Nota média do anúncio"
          value={q.notaMedia == null ? "—" : fmtNum(Math.round(q.notaMedia))}
          hint={`${fmtNum(q.abaixoDe70)} ASIN(s) abaixo de 70`}
        />
        <Kpi
          label="Sem ingredientes"
          value={fmtNum(q.semIngredientes)}
          hint="essencial para suplemento"
          {...(q.semIngredientes ? { tone: "warn" as const } : {})}
        />
      </div>
      <Panel title="Buy Box" right={<CsvButton name="amazon-buybox" rows={b.lista} />}>
        {b.lista.length ? (
          <Table
            head={[
              "Produto",
              "Buy Box",
              "Nosso preço",
              "Preço da Buy Box",
              "Diferença",
              "Ofertas",
              "Buy Box é FBA?",
              "Leitura",
            ]}
          >
            {b.lista.slice(0, 40).map((x) => (
              <tr key={x.asin}>
                <Td className="max-w-[240px]">
                  <div className="truncate font-medium" title={x.titulo}>
                    {x.titulo}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {x.asin} · {fmtBRL(x.vendas)}
                  </div>
                </Td>
                <Td>
                  <StatusTag tone={x.ganha === false ? "danger" : x.ganha ? "success" : "muted"}>
                    {x.ganha === false ? "sem" : x.ganha ? "com" : "—"}
                  </StatusTag>
                </Td>
                <Td mono>{fmtBRL2(x.meuPreco)}</Td>
                <Td mono>
                  {fmtBRL2(x.precoBuyBox)}
                  <div className="text-xs text-muted-foreground">
                    menor: {fmtBRL2(x.menorConcorrente)}
                  </div>
                </Td>
                <Td
                  mono
                  className={
                    (x.difBuyBoxPct ?? 0) > 0.5 && x.ganha === false ? "text-destructive" : ""
                  }
                >
                  {sinal(x.difBuyBoxPct)}
                </Td>
                <Td mono>{fmtNum(x.ofertas)}</Td>
                <Td>{x.buyboxFba == null ? "—" : x.buyboxFba ? "sim" : "não"}</Td>
                <Td className="min-w-[240px] !whitespace-normal text-xs">{x.leitura || "—"}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Sem leitura de Buy Box.</Empty>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Foto atual da Buy Box (dim_amazon_buybox); venda do período só para ordenar. Diferença =
          nosso preço contra o preço que está ganhando a Buy Box, não contra o menor preço.
        </p>
      </Panel>
      <Panel
        title="Qualidade do anúncio"
        right={
          <CsvButton
            name="amazon-qualidade-anuncio"
            rows={q.lista.map((x) => ({ ...x, melhorias: x.melhorias.join("; ") }))}
          />
        }
      >
        {q.lista.length ? (
          <Table
            head={[
              "Produto",
              "Nota",
              "Fotos",
              "Bullets",
              "A+",
              "Ingredientes",
              "Descrição",
              "BSR",
              "O que melhorar",
            ]}
          >
            {q.lista.slice(0, 40).map((x) => (
              <tr key={x.asin}>
                <Td className="max-w-[240px]">
                  <div className="truncate font-medium" title={x.titulo}>
                    {x.titulo}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {x.asin} · {fmtBRL(x.vendas)}
                  </div>
                </Td>
                <Td>
                  <StatusTag tone={x.nota >= 85 ? "success" : x.nota >= 70 ? "primary" : "warn"}>
                    {fmtNum(x.nota)}
                  </StatusTag>
                </Td>
                <Td mono>{fmtNum(x.fotos)}</Td>
                <Td mono>{fmtNum(x.bullets)}</Td>
                <Td>{x.temAplus == null ? "—" : x.temAplus ? "sim" : "não"}</Td>
                <Td>{x.temIngredientes == null ? "—" : x.temIngredientes ? "sim" : "não"}</Td>
                <Td>{x.temDescricao == null ? "—" : x.temDescricao ? "sim" : "não"}</Td>
                <Td mono>
                  {x.bsr == null ? "—" : `#${fmtNum(x.bsr)}`}
                  {x.bsrCategoria && (
                    <div className="text-xs text-muted-foreground">{x.bsrCategoria}</div>
                  )}
                </Td>
                <Td className="min-w-[220px] !whitespace-normal text-xs">
                  {x.melhorias.join(" · ") || "—"}
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Sem leitura de cadastro.</Empty>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Nota de 0 a 100, pesos a calibrar: fotos ≥ {CRITERIOS_ANUNCIO.fotosMin} (20), bullets ≥{" "}
          {CRITERIOS_ANUNCIO.bulletsMin} (20), A+ (15), ingredientes (15), descrição (10), título
          entre {CRITERIOS_ANUNCIO.tituloMin} e {CRITERIOS_ANUNCIO.tituloMax} caracteres (10) e
          cadastro completo (10). BSR = ranking de vendas atual na categoria (menor é melhor); o
          banco guarda só a última leitura, sem histórico.
        </p>
      </Panel>
    </div>
  );
}

function EstoqueFbaPanel({ e }: { e: D["estoqueFba"] }) {
  const t = e.totais;
  return (
    <Panel
      title="Estoque FBA detalhado"
      right={
        <CsvButton
          name="amazon-estoque-fba"
          rows={e.lista.map((x) => ({ ...x, sinais: x.sinais.join("; ") }))}
        />
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        <Kpi label="Disponível" value={fmtNum(t.disponivel)} />
        <Kpi
          label="Reservado"
          value={fmtNum(t.reservado)}
          hint="pedido, transferência, processamento"
        />
        <Kpi label="A caminho" value={fmtNum(t.aCaminho)} hint="em preparo ou enviado" />
        <Kpi
          label="Em recebimento"
          value={fmtNum(t.emRecebimento)}
          hint="chegou ao CD, ainda não disponível"
        />
        <Kpi
          label="Vencido"
          value={fmtNum(t.vencido)}
          hint={`${fmtNum(e.skusComVencido)} SKU(s)`}
          {...(t.vencido ? { tone: "warn" as const } : {})}
        />
        <Kpi
          label="Danificado"
          value={fmtNum(t.danificado)}
          hint={`${fmtNum(t.imprestavel)} imprestáveis no total`}
        />
      </div>
      {e.lista.length ? (
        <Table
          head={[
            "Produto",
            "Disponível",
            "Reservado",
            "A caminho",
            "Em recebimento",
            "Vencido",
            "Cobertura",
            "Sinais",
          ]}
        >
          {e.lista.slice(0, 30).map((x) => (
            <tr key={x.sku}>
              <Td className="max-w-[240px]">
                <div className="truncate" title={x.titulo}>
                  {x.titulo}
                </div>
                <div className="font-mono text-xs text-muted-foreground">{x.sku}</div>
              </Td>
              <Td mono>{fmtNum(x.disponivel)}</Td>
              <Td mono>
                {fmtNum(x.reservado)}
                {x.reservado > 0 && (
                  <div className="text-xs text-muted-foreground">
                    ped. {fmtNum(x.reservadoPedido)} · transf. {fmtNum(x.reservadoTransferencia)} ·
                    proc. {fmtNum(x.reservadoProcessamento)}
                  </div>
                )}
              </Td>
              <Td mono>{fmtNum(x.aCaminho)}</Td>
              <Td mono>{fmtNum(x.emRecebimento)}</Td>
              <Td mono className={x.vencido ? "text-destructive" : ""}>
                {fmtNum(x.vencido)}
              </Td>
              <Td mono>{x.coberturaDias == null ? "—" : `${fmtNum(x.coberturaDias)} d`}</Td>
              <Td className="min-w-[180px] !whitespace-normal">
                <div className="flex flex-wrap gap-1">
                  {x.sinais.length ? (
                    x.sinais.map((sn) => (
                      <StatusTag key={sn} tone={/vencid/.test(sn) ? "danger" : "warn"}>
                        {sn}
                      </StatusTag>
                    ))
                  ) : (
                    <StatusTag tone="success">ok</StatusTag>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty>Sem leitura de estoque FBA.</Empty>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Vencido no FBA não volta a ser vendável: pedir remoção ou descarte (o armazenamento continua
        sendo cobrado). O banco guarda só a foto atual, então não dá para saber há quantos dias um
        envio está em recebimento; o sinal aparece quando há unidades em recebimento e a cobertura
        está abaixo de 14 dias.
      </p>
    </Panel>
  );
}

function Orcamento({ o }: { o: D["orcamento"] }) {
  return (
    <Panel
      title="Campanhas batendo no orçamento"
      right={<CsvButton name="amazon-campanhas-orcamento" rows={o.lista} />}
    >
      {o.lista.length ? (
        <Table
          head={["Campanha", "Orçamento/dia", "Dias no limite", "Investido", "ACoS", "Leitura"]}
        >
          {o.lista.map((c) => (
            <tr key={c.campanha}>
              <Td className="font-medium">
                {c.campanha}
                <div className="text-xs text-muted-foreground">{c.tipo}</div>
              </Td>
              <Td mono>{fmtBRL(c.orcamento)}</Td>
              <Td mono>
                {fmtNum(c.diasNoLimite)} de {fmtNum(c.diasComGasto)}
              </Td>
              <Td mono>{fmtBRL(c.custo)}</Td>
              <Td mono>{fmtPct(c.acosPct)}</Td>
              <Td className="min-w-[220px] !whitespace-normal text-xs">{c.leitura}</Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty>Nenhuma campanha ativa gastou 95%+ do orçamento em 30%+ dos dias.</Empty>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Dia no limite = gasto ≥ 95% do orçamento diário. O orçamento é o atual da campanha (sem
        histórico): se mudou no período, a contagem distorce. ACoS de referência:{" "}
        {fmtPct(o.acosReferenciaPct)}.
      </p>
    </Panel>
  );
}

function SdProduto({ l }: { l: D["sdProduto"] }) {
  return (
    <Panel
      title="Sponsored Display por produto"
      right={<CsvButton name="amazon-sd-produto" rows={l} />}
    >
      {l.length ? (
        <Table head={["Produto", "Investido", "Cliques", "Compras", "Vendas atrib.", "ACoS"]}>
          {l.map((x) => (
            <tr key={x.asin}>
              <Td className="max-w-[240px]">
                <div className="truncate" title={x.titulo}>
                  {x.titulo}
                </div>
                <div className="font-mono text-xs text-muted-foreground">{x.asin}</div>
              </Td>
              <Td mono>{fmtBRL(x.custo)}</Td>
              <Td mono>{fmtNum(x.cliques)}</Td>
              <Td mono>{fmtNum(x.compras)}</Td>
              <Td mono>{fmtBRL(x.vendas)}</Td>
              <Td mono>{fmtPct(x.acosPct)}</Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty>Sem Sponsored Display no período.</Empty>
      )}
    </Panel>
  );
}

function Pedidos({ p }: { p: D["pedidos"] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="Pedidos"
          value={fmtNum(p.pedidos)}
          hint={`${fmtBRL(p.valor)} sem os cancelados`}
        />
        <Kpi
          label="Cancelamento"
          value={fmtPct(p.cancelamentoPct)}
          hint={`${fmtNum(p.cancelados)} pedido(s)`}
          {...(p.cancelamentoPct != null && p.cancelamentoPct >= 2
            ? { tone: "warn" as const }
            : {})}
        />
        {p.porCanal.slice(0, 2).map((c) => (
          <Kpi
            key={c.canal}
            label={c.canal}
            value={fmtPct(c.fatiaValorPct, 0)}
            hint={`${fmtNum(c.pedidos)} pedidos · cancel. ${fmtPct(c.cancelamentoPct)}`}
          />
        ))}
      </div>
      <div className="grid gap-6 2xl:grid-cols-2">
        <Panel title="FBA × envio próprio">
          {p.porCanal.length ? (
            <Table head={["Canal", "Pedidos", "Unidades", "Valor", "Fatia", "Cancelamento"]}>
              {p.porCanal.map((c) => (
                <tr key={c.canal}>
                  <Td className="font-medium">{c.canal}</Td>
                  <Td mono>{fmtNum(c.pedidos)}</Td>
                  <Td mono>{fmtNum(c.unidades)}</Td>
                  <Td mono>{fmtBRL(c.valor)}</Td>
                  <Td mono>{fmtPct(c.fatiaValorPct, 0)}</Td>
                  <Td mono>{fmtPct(c.cancelamentoPct)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>Sem pedidos no período.</Empty>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            FBA = a Amazon envia (AFN); envio próprio = a Soldiers envia (MFN). Valor sem os pedidos
            cancelados.
          </p>
        </Panel>
        <Panel title="Status dos pedidos">
          {p.porStatus.length ? (
            <Table head={["Status", "Pedidos"]}>
              {p.porStatus.map((x) => (
                <tr key={x.status}>
                  <Td>{x.status}</Td>
                  <Td mono>{fmtNum(x.pedidos)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty />
          )}
        </Panel>
        <Panel
          title="Produtos com cancelamento"
          right={<CsvButton name="amazon-cancelamentos" rows={p.skusComCancelamento} />}
        >
          {p.skusComCancelamento.length ? (
            <Table head={["Produto", "Pedidos", "Cancelados", "%"]}>
              {p.skusComCancelamento.map((x) => (
                <tr key={x.sku}>
                  <Td className="max-w-[240px]">
                    <div className="truncate" title={x.titulo}>
                      {x.titulo}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">{x.sku}</div>
                  </Td>
                  <Td mono>{fmtNum(x.pedidos)}</Td>
                  <Td mono>{fmtNum(x.cancelados)}</Td>
                  <Td mono>{fmtPct(x.cancelamentoPct)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>Nenhum cancelamento no período.</Empty>
          )}
        </Panel>
      </div>
      <p className="text-xs text-muted-foreground">
        Pedidos da Amazon sem dado do comprador: cidade, UF e CEP não são lidos por esta tela.
      </p>
    </div>
  );
}
