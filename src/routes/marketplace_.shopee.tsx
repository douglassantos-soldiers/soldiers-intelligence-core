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
import { getShopee } from "@/lib/data.functions";
import { PainelAds } from "@/components/painel-ads";
import { abasDe } from "@/lib/painel-ads";
import { DIAS_SEMANA } from "@/lib/shopee";
import { fmtBRL, fmtBRL2, fmtNum, fmtPct, fmtX, fmtDate, periodo } from "@/lib/format";

// Shopee (benchmarks/shopee/ANALISE.md §4): economia pelo escrow, Ads (direta × ampla, por hora),
// produtos, lives e cancelamentos. Venda de Ads é atribuída pela Shopee: não somar com a receita.
export const Route = createFileRoute("/marketplace_/shopee")({
  head: () => ({
    meta: [
      { title: "Shopee — Soldiers Platform" },
      {
        name: "description",
        content:
          "Lucro real da Shopee pelo repasse, Ads por hora, produtos, lives e cancelamentos.",
      },
    ],
  }),
  component: Shopee,
});

type D = Awaited<ReturnType<typeof getShopee>>;
type Aba = "economia" | "ads" | "produtos" | "lives" | "cancelamentos";

const NOMES: Record<string, string> = {
  pedidos: "pedidos",
  itens: "itens dos pedidos",
  financeiro: "repasse (escrow)",
  custos: "custos",
  adsDia: "Shopee Ads",
  adsCamp: "campanhas",
  adsHora: "Ads por hora",
  itemDia: "visitas por produto",
  estoque: "estoque",
  produtos: "cadastro",
  metricas: "notas",
  lives: "lives",
  produtosLive: "produtos das lives",
};

function Shopee() {
  const [dias, setDias] = useState("28");
  const fn = useServerFn(getShopee);
  const p = periodo(dias);
  const q = useQuery({ queryKey: ["shopee", p], queryFn: () => fn({ data: p }) });
  return (
    <>
      <PageHeader
        title="Shopee"
        subtitle="Quanto a Shopee realmente repassa, onde a mídia rende e o que olhar em cada produto."
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

function Body({ d }: { d: D }) {
  const [aba, setAba] = useState<Aba>("economia");
  const e = d.economia;
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
        <Kpi label="Pedidos" value={fmtNum(e.pedidos)} hint={`Vendas ${fmtBRL(e.receita)}`} />
        <Kpi
          label="Já liquidados"
          value={fmtPct(e.pctLiquidado, 0)}
          hint={`${fmtBRL(e.emAbertoValor)} ainda sem repasse`}
        />
        <Kpi label="Repasse" value={fmtBRL(e.repasse)} hint="pedidos liquidados" />
        <Kpi
          label="Contribuição liquidada"
          value={fmtBRL(e.contribuicaoLiquidada)}
          hint={`${fmtPct(e.margemPct)} do repasse · antes de Ads`}
          tone={e.contribuicaoLiquidada >= 0 ? "up" : "down"}
        />
        <Kpi
          label="Shopee Ads"
          value={fmtBRL(e.adsGasto)}
          hint={`ROAS direto ${fmtX(d.ads.roasDireto)}`}
        />
        <Kpi
          label="Desconto pago pela Shopee"
          value={fmtBRL(e.descontoShopee)}
          hint="não reduz a receita"
        />
      </div>

      <Pills
        value={aba}
        onChange={setAba}
        options={[
          { id: "economia", label: "Economia" },
          { id: "ads", label: "Ads" },
          { id: "produtos", label: "Produtos" },
          { id: "lives", label: "Lives" },
          { id: "cancelamentos", label: "Cancelamentos" },
        ]}
      />

      {aba === "economia" && <Economia d={d} />}
      {aba === "ads" && <Ads d={d} />}
      {aba === "produtos" && <Produtos p={d.produtos} />}
      {aba === "lives" && <Lives l={d.lives} />}
      {aba === "cancelamentos" && <Cancelamentos c={d.cancelamentos} />}
    </div>
  );
}

function Economia({ d }: { d: D }) {
  const e = d.economia;
  const custos = e.custos.filter((c) => c.valor > 0).sort((a, b) => b.valor - a.valor);
  return (
    <>
      <div className="grid gap-6 2xl:grid-cols-2">
        <Panel title="Para onde vai o dinheiro (pedidos liquidados)">
          {custos.length ? (
            <Table head={["Item do repasse", "Valor"]}>
              {custos.map((c) => (
                <tr key={c.chave}>
                  <Td>{c.label}</Td>
                  <Td mono>{fmtBRL(c.valor)}</Td>
                </tr>
              ))}
              <tr>
                <Td>Frete pago pela Soldiers (estimado)</Td>
                <Td mono>{fmtBRL(e.freteLoja)}</Td>
              </tr>
              <tr>
                <Td>
                  <span className="font-medium">Custo do produto (CMV)</span>
                </Td>
                <Td mono>{fmtBRL(e.cmvLiquidado)}</Td>
              </tr>
            </Table>
          ) : (
            <Empty>Nenhum pedido liquidado no período.</Empty>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Valores do escrow (fact_shopee_financeiro) em valor absoluto: o repasse já vem líquido
            deles, então a contribuição é repasse − CMV. Frete da Soldiers = frete real − subsídio
            da Shopee − frete pago pelo comprador (a confirmar).
            {e.itensSemCusto ? ` ${fmtNum(e.itensSemCusto)} itens sem custo cadastrado.` : ""}
          </p>
        </Panel>
        <Panel title="Quem pagou os descontos">
          <div className="grid grid-cols-3 gap-3">
            <Kpi
              label="Shopee"
              value={fmtBRL(e.descontoShopee)}
              hint="desconto + cupom"
              tone="up"
            />
            <Kpi
              label="Soldiers"
              value={fmtBRL(e.descontoLoja)}
              hint="desconto + cupom"
              tone="warn"
            />
            <Kpi label="Moedas" value={fmtBRL(e.moedas)} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            O que a Shopee paga volta no repasse e não reduz a receita da Soldiers.
          </p>
        </Panel>
      </div>
      <Panel
        title="Contribuição por produto (pedidos liquidados)"
        right={<CsvButton name="shopee-contribuicao-sku" rows={e.skus} />}
      >
        {e.skus.length ? (
          <Table
            head={[
              "Produto",
              "Unid.",
              "Vendas",
              "Repasse (rateado)",
              "CMV",
              "Contribuição",
              "% do repasse",
            ]}
          >
            {e.skus.slice(0, 30).map((s) => (
              <tr key={s.sku || s.nome}>
                <Td className="max-w-[300px]">
                  <div className="truncate" title={s.nome}>
                    {s.nome}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {s.sku || "sem SKU"}
                    {!s.temCusto && " · sem custo"}
                  </div>
                </Td>
                <Td mono>{fmtNum(s.unidades)}</Td>
                <Td mono>{fmtBRL(s.receita)}</Td>
                <Td mono>{fmtBRL(s.repasse)}</Td>
                <Td mono>{fmtBRL(s.cmv)}</Td>
                <Td mono className={s.contribuicao >= 0 ? "text-success" : "text-destructive"}>
                  {fmtBRL(s.contribuicao)}
                </Td>
                <Td mono>{fmtPct(s.margemPct)}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Nenhum pedido liquidado no período.</Empty>
        )}
      </Panel>
    </>
  );
}

function Ads({ d }: { d: D }) {
  const a = d.ads;
  const h = d.horas;
  const maxRoas = Math.max(0, ...h.celulas.map((c) => c.roas ?? 0));
  return (
    <div className="space-y-6">
      <PainelAds
        linhas={d.painel}
        abas={abasDe(d.painel, [
          { id: "product", label: "Anúncios de produto" },
          { id: "shop", label: "Anúncios da loja" },
        ])}
        nomeCsv="shopee-ads-campanhas"
        rotuloUnidades="Pedidos"
        rotuloReceita="Receita (ampla)"
        composicaoTitulo="Direta × indireta"
        nota="Receita = GMV amplo atribuído pela Shopee (inclui o direto); direta = GMV direto; indireta = amplo − direto. A Shopee reporta pedidos, não unidades. Abas = tipos de anúncio da Shopee."
      />
      <h3 className="pt-2 font-display text-lg font-semibold">Meta de ROAS e horários</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Investido" value={fmtBRL(a.gasto)} />
        <Kpi
          label="Venda direta (atrib.)"
          value={fmtBRL(a.direta)}
          hint={`ROAS ${fmtX(a.roasDireto)}`}
        />
        <Kpi
          label="Venda ampla (atrib.)"
          value={fmtBRL(a.ampla)}
          hint={`ROAS ${fmtX(a.roasAmplo)} · inclui a direta`}
        />
        <Kpi
          label="Campanhas abaixo da meta"
          value={fmtNum(a.campanhas.filter((c) => c.abaixoDaMeta).length)}
        />
      </div>
      <Panel title="Campanhas" right={<CsvButton name="shopee-ads-campanhas" rows={a.campanhas} />}>
        {a.campanhas.length ? (
          <Table
            head={[
              "Campanha",
              "Tipo",
              "Investido",
              "Venda direta",
              "ROAS direto",
              "Venda ampla",
              "ROAS amplo",
              "Meta",
            ]}
          >
            {a.campanhas.map((c) => (
              <tr key={c.id}>
                <Td className="max-w-[260px] truncate">{c.nome}</Td>
                <Td>{c.tipo}</Td>
                <Td mono>{fmtBRL(c.gasto)}</Td>
                <Td mono>{fmtBRL(c.diretaGmv)}</Td>
                <Td mono>{fmtX(c.roasDireto)}</Td>
                <Td mono>{fmtBRL(c.amplaGmv)}</Td>
                <Td mono className={c.abaixoDaMeta ? "text-destructive" : ""}>
                  {fmtX(c.roasAmplo)}
                </Td>
                <Td mono>{c.meta == null ? "—" : fmtX(c.meta)}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty />
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Direta = compra do produto anunciado; ampla = qualquer compra na loja depois do clique.
          Não somar as duas. A meta de ROAS da campanha é comparada com o ROAS amplo (a confirmar).
        </p>
      </Panel>
      <Panel title="ROAS direto por dia da semana e hora">
        {h.gasto ? (
          <>
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
                          const t = maxRoas && c.roas != null ? c.roas / maxRoas : 0;
                          return (
                            <td
                              key={c.hora}
                              title={`${dn} ${c.hora}h: gasto ${fmtBRL2(c.gasto)} · venda direta ${fmtBRL2(c.venda)} · ROAS ${fmtX(c.roas)}`}
                              aria-label={`${dn} ${c.hora}h: ROAS ${fmtX(c.roas)}`}
                              className="h-6 w-7 rounded-[3px] hover:ring-2 hover:ring-foreground/60"
                              style={{
                                background:
                                  c.gasto > 0
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
            <p className="mt-3 text-xs text-muted-foreground">
              Cor = ROAS direto (mais escuro, mais retorno). Cinza = sem investimento. Passe o mouse
              para ver gasto e venda. ROAS médio {fmtX(h.roasMedio)}. Hora no fuso de Brasília (a
              confirmar).
            </p>
          </>
        ) : (
          <Empty>Sem Ads por hora no período.</Empty>
        )}
      </Panel>
      <div className="grid gap-6 2xl:grid-cols-2">
        <Panel
          title="Horários para reduzir verba"
          right={<StatusTag tone="warn">ROAS &lt; metade da média</StatusTag>}
        >
          <HorasTabela linhas={h.reduzir} vazio="Nenhum horário com ROAS muito abaixo da média." />
        </Panel>
        <Panel
          title="Horários para concentrar verba"
          right={<StatusTag tone="success">ROAS &gt; 1,5× a média</StatusTag>}
        >
          <HorasTabela
            linhas={h.concentrar}
            vazio="Nenhum horário com ROAS muito acima da média."
          />
        </Panel>
      </div>
    </div>
  );
}

function HorasTabela({ linhas, vazio }: { linhas: D["horas"]["reduzir"]; vazio: string }) {
  if (!linhas.length) return <Empty>{vazio}</Empty>;
  return (
    <Table head={["Hora", "Investido", "% do gasto", "Venda direta", "ROAS"]}>
      {linhas.map((x) => (
        <tr key={x.hora}>
          <Td>
            {x.hora}h–{x.hora + 1}h
          </Td>
          <Td mono>{fmtBRL(x.gasto)}</Td>
          <Td mono>{fmtPct(x.pctGasto)}</Td>
          <Td mono>{fmtBRL(x.venda)}</Td>
          <Td mono>{fmtX(x.roas)}</Td>
        </tr>
      ))}
    </Table>
  );
}

function Produtos({ p }: { p: D["produtos"] }) {
  const [filtro, setFiltro] = useState<"problema" | "todos">("problema");
  const lista = filtro === "problema" ? p.filter((x) => x.problemas.length) : p;
  return (
    <Panel
      title="Produtos"
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
            name="shopee-produtos"
            rows={p.map((x) => ({ ...x, problemas: x.problemas.join("; ") }))}
          />
        </div>
      }
    >
      {lista.length ? (
        <Table
          head={[
            "Produto",
            "Receita",
            "Visitas",
            "Conversão",
            "Nota",
            "Estoque",
            "Cobertura",
            "O que olhar",
          ]}
        >
          {lista.map((x) => (
            <tr key={x.item}>
              <Td className="max-w-[260px]">
                <div className="truncate font-medium" title={x.nome}>
                  {x.nome}
                </div>
                <div className="font-mono text-xs text-muted-foreground">{x.sku || x.item}</div>
              </Td>
              <Td mono>{fmtBRL(x.receita)}</Td>
              <Td mono>{fmtNum(x.visitas)}</Td>
              <Td mono>{fmtPct(x.conversaoPct)}</Td>
              <Td mono>
                {x.nota == null ? "—" : x.nota.toFixed(1).replace(".", ",")}
                {x.comentarios != null && (
                  <div className="text-xs text-muted-foreground">
                    {fmtNum(x.comentarios)} coment.
                  </div>
                )}
              </Td>
              <Td mono>{fmtNum(x.estoque)}</Td>
              <Td mono>{x.coberturaDias == null ? "—" : `${fmtNum(x.coberturaDias)} d`}</Td>
              <Td className="min-w-[200px]">
                <div className="flex flex-wrap gap-1">
                  {x.problemas.length ? (
                    x.problemas.map((pr) => (
                      <StatusTag key={pr} tone={/sem estoque|caiu/.test(pr) ? "danger" : "warn"}>
                        {pr}
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
        <Empty>Nenhum produto neste filtro.</Empty>
      )}
    </Panel>
  );
}

function Lives({ l }: { l: D["lives"] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Lives no período" value={fmtNum(l.sessoes)} />
        <Kpi
          label="Vendas confirmadas"
          value={fmtBRL(l.vendas)}
          hint="atribuídas à live pela Shopee"
        />
        <Kpi label="Pedidos" value={fmtNum(l.pedidos)} />
        <Kpi label="Vendas por hora de live" value={fmtBRL(l.vendasPorHora)} />
      </div>
      <div className="grid gap-6 2xl:grid-cols-2">
        <Panel title="Sessões">
          {l.lista.length ? (
            <Table
              head={["Live", "Quando", "Duração", "Espectadores", "Pedidos", "Conversão", "Vendas"]}
            >
              {l.lista.map((s) => (
                <tr key={s.sessao}>
                  <Td className="max-w-[220px] truncate">{s.titulo}</Td>
                  <Td mono>{fmtDate(s.inicio)}</Td>
                  <Td mono>{fmtNum(s.duracaoMin)} min</Td>
                  <Td mono>{fmtNum(s.espectadores)}</Td>
                  <Td mono>{fmtNum(s.pedidos)}</Td>
                  <Td mono>{fmtPct(s.conversaoPct)}</Td>
                  <Td mono>{fmtBRL(s.vendas)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>Nenhuma live no período.</Empty>
          )}
        </Panel>
        <Panel title="Produtos que vendem na live">
          {l.produtos.length ? (
            <Table head={["Produto", "Cliques", "Carrinho", "Pedidos", "Vendas"]}>
              {l.produtos.map((x) => (
                <tr key={x.item}>
                  <Td className="max-w-[240px] truncate">{x.nome}</Td>
                  <Td mono>{fmtNum(x.cliques)}</Td>
                  <Td mono>{fmtNum(x.carrinho)}</Td>
                  <Td mono>{fmtNum(x.pedidos)}</Td>
                  <Td mono>{fmtBRL(x.vendas)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty />
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Venda da live é atribuída pela Shopee e já está dentro das vendas da loja: não somar.
          </p>
        </Panel>
      </div>
    </div>
  );
}

function Cancelamentos({ c }: { c: D["cancelamentos"] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="Cancelados"
          value={fmtNum(c.cancelados)}
          hint={`${fmtPct(c.pctCancelados)} dos pedidos`}
        />
      </div>
      <div className="grid gap-6 2xl:grid-cols-2">
        <Panel title="Cancelamentos por motivo">
          {c.motivos.length ? (
            <Table head={["Motivo", "Quem cancelou", "Pedidos", "Valor"]}>
              {c.motivos.map((m) => (
                <tr key={`${m.motivo}|${m.quem}`}>
                  <Td>{m.motivo}</Td>
                  <Td>{m.quem}</Td>
                  <Td mono>{fmtNum(m.pedidos)}</Td>
                  <Td mono>{fmtBRL(m.valor)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>Nenhum cancelamento no período.</Empty>
          )}
        </Panel>
        <Panel title="Devoluções por produto">
          {c.devolucoes.length ? (
            <Table head={["Produto", "Devolvidas", "Vendidas", "% devolvida"]}>
              {c.devolucoes.map((x) => (
                <tr key={x.sku || x.nome}>
                  <Td className="max-w-[240px] truncate">{x.nome}</Td>
                  <Td mono>{fmtNum(x.devolvidas)}</Td>
                  <Td mono>{fmtNum(x.vendidas)}</Td>
                  <Td mono>{fmtPct(x.pct)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>Nenhuma devolução registrada no período.</Empty>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Motivo da devolução e disputas entram com o módulo Returns da API (não conectado).
          </p>
        </Panel>
      </div>
    </div>
  );
}
