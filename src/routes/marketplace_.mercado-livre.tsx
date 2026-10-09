import { PainelAds } from "@/components/painel-ads";
import { abasDe } from "@/lib/painel-ads";
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
import { getMercadoLivre } from "@/lib/data.functions";
import { fmtBRL, fmtBRL2, fmtNum, fmtPct, periodo } from "@/lib/format";

// Mercado Livre: economia real e diagnóstico (benchmarks/mercado-livre/ANALISE.md §4).
// Receita realizada dos itens do pedido; tarifa, frete, cupom da Soldiers, afiliado, Ads e custo
// do produto na data saem da contribuição. Venda de Ads e de afiliado é atribuída: não se soma.
export const Route = createFileRoute("/marketplace_/mercado-livre")({
  head: () => ({
    meta: [
      { title: "Mercado Livre — Soldiers Platform" },
      {
        name: "description",
        content:
          "Lucro real do Mercado Livre por pedido e produto, anúncio 360° com catálogo e Full, e diagnóstico de Product Ads.",
      },
    ],
  }),
  component: MercadoLivre,
});

type D = Awaited<ReturnType<typeof getMercadoLivre>>;

const NOMES: Record<string, string> = {
  pedidos: "pedidos",
  itens: "itens dos pedidos",
  cupons: "cupons",
  afiliados: "afiliados",
  custos: "custos",
  ads: "Product Ads",
  adsConta: "investimento de Ads",
  anuncioDia: "visitas por anúncio",
  competicao: "catálogo",
  full: "estoque Full",
  fretes: "frete",
};

function MercadoLivre() {
  const [dias, setDias] = useState("28");
  const fn = useServerFn(getMercadoLivre);
  const p = periodo(dias);
  const q = useQuery({ queryKey: ["mercado-livre", p], queryFn: () => fn({ data: p }) });
  return (
    <>
      <PageHeader
        title="Mercado Livre"
        subtitle="Quanto cada pedido realmente deixa e o que travar ou destravar em cada anúncio."
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

const DIAG: Record<string, { label: string; tom: "primary" | "warn" | "danger"; acao: string }> = {
  orcamento: {
    label: "orçamento",
    tom: "primary",
    acao: "ACoS dentro da referência e perdendo impressões por verba: avaliar aumentar o orçamento.",
  },
  rank: {
    label: "rank",
    tom: "warn",
    acao: "Perde impressões por posição: melhorar anúncio, preço ou lance.",
  },
  acos_alto: {
    label: "ACoS alto",
    tom: "danger",
    acao: "ACoS 20% acima da referência do ML: revisar lance ou pausar.",
  },
};

function Body({ d }: { d: D }) {
  const [aba, setAba] = useState<"economia" | "anuncios" | "ads">("economia");
  const e = d.economia;
  const erros = Object.keys(d.erros);
  const custos = [
    { label: "Tarifa de venda do ML", valor: e.tarifa },
    { label: "Frete pago pela Soldiers", valor: e.frete },
    { label: "Cupom pago pela Soldiers", valor: e.cupomVendedor },
    { label: "Comissão de afiliados", valor: e.afiliado },
    { label: "Custo do produto (CMV)", valor: e.cmv },
    { label: "Mercado Ads (Product, Brand e Display)", valor: e.ads },
  ];

  return (
    <div className="space-y-6">
      {erros.length > 0 && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
          Não foi possível ler: {erros.map((k) => NOMES[k] ?? k).join(", ")}. O resto da tela usa o
          que carregou. Ver Data Health.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        <Kpi
          label="Pedidos"
          value={fmtNum(e.pedidos)}
          hint={`${fmtNum(e.unidades)} unid. · ${fmtNum(e.cancelados)} cancelados`}
        />
        <Kpi
          label="Receita líquida"
          value={fmtBRL(e.receitaLiquida)}
          hint="itens − cupom da Soldiers"
        />
        <Kpi
          label="Tarifa ML"
          value={fmtPct(e.tarifaPct)}
          hint={`${fmtBRL(e.tarifa)} da receita`}
        />
        <Kpi
          label="Frete por pedido"
          value={fmtBRL2(e.fretePorPedido)}
          hint={`${fmtBRL(e.frete)} no período`}
        />
        <Kpi
          label="Contribuição"
          value={fmtBRL(e.contribuicao)}
          hint={`${fmtPct(e.margemPct)} da receita · após Ads`}
          {...(e.contribuicao < 0 ? { tone: "down" as const } : { tone: "up" as const })}
        />
        <Kpi label="Cupom pago pelo ML" value={fmtBRL(e.cupomMeli)} hint="não reduz a receita" />
      </div>

      <Pills
        value={aba}
        onChange={setAba}
        options={[
          { id: "economia", label: "Economia" },
          { id: "anuncios", label: "Anúncios" },
          { id: "ads", label: "Mercado Ads" },
        ]}
      />

      {aba === "economia" && (
        <>
          <div className="grid gap-6 2xl:grid-cols-2">
            <Panel title="Para onde vai o dinheiro">
              <Table head={["Custo", "Valor", "% da receita líquida"]}>
                {custos.map((c) => (
                  <tr key={c.label}>
                    <Td>{c.label}</Td>
                    <Td mono>{fmtBRL(c.valor)}</Td>
                    <Td mono>
                      {fmtPct(e.receitaLiquida ? (c.valor / e.receitaLiquida) * 100 : null)}
                    </Td>
                  </tr>
                ))}
                <tr>
                  <Td>
                    <span className="font-medium">Contribuição</span>
                  </Td>
                  <Td mono className={e.contribuicao >= 0 ? "text-success" : "text-destructive"}>
                    {fmtBRL(e.contribuicao)}
                  </Td>
                  <Td mono>{fmtPct(e.margemPct)}</Td>
                </tr>
              </Table>
              <p className="mt-3 text-xs text-muted-foreground">
                Tarifa do pedido (ml_pedido), frete rateado por envio (vw_ml_frete_pedido), cupons
                (ml_pedido_cupom), comissão de afiliados casada com o pedido e CMV com o custo
                vigente na data da venda
                {e.itensSemCusto ? `; ${fmtNum(e.itensSemCusto)} itens sem custo cadastrado` : ""}.
                A semântica de tarifa e frete ainda deve ser conferida com pedidos reais no painel
                do ML.
              </p>
            </Panel>
            <Panel title="Antes e depois de Ads">
              <div className="grid grid-cols-2 gap-3">
                <Kpi label="Contribuição antes de Ads" value={fmtBRL(e.contribuicaoAntesAds)} />
                <Kpi label="Mercado Ads" value={fmtBRL(e.ads)} hint="Product + Brand + Display" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Na tabela por produto, só o Product Ads é atribuído ao SKU (pelo anúncio). Brand e
                Display ficam no total da conta.
              </p>
            </Panel>
          </div>

          <Panel
            title="Contribuição por produto"
            right={<CsvButton name="ml-contribuicao-sku" rows={e.skus} />}
          >
            {e.skus.length ? (
              <Table
                head={[
                  "Produto",
                  "Unid.",
                  "Receita",
                  "Tarifa",
                  "Frete",
                  "Afiliado",
                  "Ads",
                  "CMV",
                  "Contribuição",
                  "Margem",
                ]}
              >
                {e.skus.slice(0, 30).map((s) => (
                  <tr key={s.sku || s.titulo}>
                    <Td className="max-w-[260px]">
                      <div className="truncate" title={s.titulo}>
                        {s.titulo}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {s.sku || "sem SKU"}
                        {!s.temCusto && " · sem custo"}
                      </div>
                    </Td>
                    <Td mono>{fmtNum(s.unidades)}</Td>
                    <Td mono>{fmtBRL(s.receita)}</Td>
                    <Td mono>{fmtBRL(s.tarifa)}</Td>
                    <Td mono>{fmtBRL(s.frete)}</Td>
                    <Td mono>{fmtBRL(s.afiliado)}</Td>
                    <Td mono>{fmtBRL(s.ads)}</Td>
                    <Td mono>{fmtBRL(s.cmv)}</Td>
                    <Td mono className={s.contribuicao >= 0 ? "text-success" : "text-destructive"}>
                      {fmtBRL(s.contribuicao)}
                    </Td>
                    <Td mono>{fmtPct(s.margemPct)}</Td>
                  </tr>
                ))}
              </Table>
            ) : (
              <Empty />
            )}
          </Panel>
        </>
      )}

      {aba === "anuncios" && <Anuncios a={d.anuncios} />}

      {aba === "ads" && (
        <div className="space-y-6">
          <PainelAds
            linhas={d.painel}
            abas={abasDe(
              d.painel,
              [
                { id: "product", label: "Product Ads" },
                {
                  id: "brand",
                  label: "Brand Ads",
                  aviso:
                    "Brand Ads: o banco só tem o investimento diário da conta (tab_ml_kpi_dia). Receita, cliques e campanhas de Brand Ads entram quando a coleta trouxer o relatório por campanha.",
                },
                { id: "display", label: "Display" },
              ],
              ["product", "brand", "display"],
            )}
            nomeCsv="ml-ads-campanhas"
            filtrosMl
            nota="Receita = venda atribuída pelo Mercado Ads (direta + indireta), não a venda realizada do canal. Product Ads abre por anúncio; Display por campanha. Os filtros de Buy Box, catálogo e logística valem para Product Ads."
          />
          <h3 className="pt-2 font-display text-lg font-semibold">Diagnóstico de Product Ads</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Kpi label="Product Ads: investimento" value={fmtBRL(d.ads.custo)} />
            <Kpi label="ACoS" value={fmtPct(d.ads.acosPct)} hint="sobre venda direta + indireta" />
            <Kpi label="Venda direta (atrib.)" value={fmtBRL(d.ads.vendasDiretas)} />
            <Kpi label="Venda indireta (atrib.)" value={fmtBRL(d.ads.vendasIndiretas)} />
            <Kpi label="Venda orgânica dos anunciados" value={fmtBRL(d.ads.vendasOrganicas)} />
          </div>
          <Panel
            title="Onde está o gargalo"
            right={<CsvButton name="ml-product-ads-diagnostico" rows={d.ads.lista} />}
          >
            <p className="mb-3 text-sm text-muted-foreground">
              {fmtNum(d.ads.contagem.orcamento)} limitados por orçamento ·{" "}
              {fmtNum(d.ads.contagem.rank)} perdendo por posição ·{" "}
              {fmtNum(d.ads.contagem.acos_alto)} com ACoS alto. Referência = ACoS benchmark
              informado pelo próprio ML. Só recomendação.
            </p>
            {d.ads.lista.length ? (
              <Table
                head={[
                  "Diagnóstico",
                  "Anúncio",
                  "Investido",
                  "Vendas atrib.",
                  "ACoS",
                  "Ref. ML",
                  "Perda por orçamento",
                  "Perda por posição",
                ]}
              >
                {d.ads.lista.map((i) => {
                  const g = DIAG[i.diagnostico]!;
                  return (
                    <tr key={i.item}>
                      <Td>
                        <span title={g.acao}>
                          <StatusTag tone={g.tom}>{g.label}</StatusTag>
                        </span>
                      </Td>
                      <Td className="max-w-[260px]">
                        <div className="truncate" title={i.titulo}>
                          {i.titulo}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">{i.item}</div>
                      </Td>
                      <Td mono>{fmtBRL(i.custo)}</Td>
                      <Td mono>{fmtBRL(i.vendasAtribuidas)}</Td>
                      <Td mono>{fmtPct(i.acosPct)}</Td>
                      <Td mono>{fmtPct(i.acosBenchmarkPct)}</Td>
                      <Td mono>{fmtPct(i.perdaOrcamentoPct, 0)}</Td>
                      <Td mono>{fmtPct(i.perdaRankPct, 0)}</Td>
                    </tr>
                  );
                })}
              </Table>
            ) : (
              <Empty>Nenhum anúncio com gargalo no período.</Empty>
            )}
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {Object.values(DIAG).map((g) => (
                <li key={g.label}>
                  <strong>{g.label}:</strong> {g.acao}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
    </div>
  );
}

function Anuncios({ a }: { a: D["anuncios"] }) {
  const [filtro, setFiltro] = useState<"problema" | "catalogo" | "todos">("problema");
  const lista =
    filtro === "problema"
      ? a.filter((x) => x.problemas.length)
      : filtro === "catalogo"
        ? a.filter((x) => x.priceToWin != null)
        : a;
  return (
    <Panel
      title="Anúncio 360°"
      right={
        <div className="flex items-center gap-3">
          <Pills
            value={filtro}
            onChange={setFiltro}
            options={[
              { id: "problema", label: "Com problema" },
              { id: "catalogo", label: "Catálogo" },
              { id: "todos", label: "Todos" },
            ]}
          />
          <CsvButton
            name="ml-anuncio-360"
            rows={a.map((x) => ({ ...x, problemas: x.problemas.join("; ") }))}
          />
        </div>
      }
    >
      {lista.length ? (
        <Table
          head={[
            "Anúncio",
            "Faturamento",
            "Visitas",
            "Conversão",
            "Preço / p/ ganhar",
            "Lucro/un. no preço p/ ganhar",
            "Full",
            "O que olhar",
          ]}
        >
          {lista.map((x) => (
            <tr key={x.item}>
              <Td className="max-w-[260px]">
                <div className="truncate font-medium" title={x.titulo}>
                  {x.titulo}
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  {x.item}
                  {x.sku ? ` · ${x.sku}` : ""}
                </div>
              </Td>
              <Td mono>{fmtBRL(x.faturamento)}</Td>
              <Td mono>{fmtNum(x.visitas)}</Td>
              <Td mono>{fmtPct(x.conversaoPct)}</Td>
              <Td mono>
                {fmtBRL2(x.preco)} / {fmtBRL2(x.priceToWin)}
              </Td>
              <Td
                mono
                className={
                  x.contribuicaoNoPtw == null
                    ? ""
                    : x.contribuicaoNoPtw >= 0
                      ? "text-success"
                      : "text-destructive"
                }
              >
                {fmtBRL2(x.contribuicaoNoPtw)}
              </Td>
              <Td mono>
                {x.fullDisponivel == null ? "—" : fmtNum(x.fullDisponivel)}
                {x.coberturaDias != null && (
                  <div className="text-xs text-muted-foreground">{fmtNum(x.coberturaDias)} d</div>
                )}
              </Td>
              <Td className="min-w-[220px]">
                <div className="flex flex-wrap gap-1">
                  {x.problemas.length ? (
                    x.problemas.map((p) => (
                      <StatusTag
                        key={p}
                        tone={
                          /prejuízo|negativa/.test(p)
                            ? "danger"
                            : /dá lucro/.test(p)
                              ? "success"
                              : "warn"
                        }
                      >
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
        <Empty>Nenhum anúncio neste filtro.</Empty>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Lucro por unidade no preço para ganhar o catálogo = preço vencedor − tarifa média do produto
        no período − frete médio por unidade − custo do produto. Se for negativo, ganhar o catálogo
        dá prejuízo: não baixar o preço. Só recomendação; nada é alterado no ML.
      </p>
    </Panel>
  );
}
