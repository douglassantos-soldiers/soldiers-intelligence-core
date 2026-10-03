import { createFileRoute, Link } from "@tanstack/react-router";
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
import { getTikTokEconomia } from "@/lib/data.functions";
import { fmtBRL, fmtNum, fmtPct, periodo } from "@/lib/format";

// TikTok Shop: economia real (Plano Mestre cap. 14; benchmarks/tiktok-shop/ANALISE.md §6–7).
// Receita estimada até o extrato sair; contribuição liquidada = repasse do extrato − custo do produto.
export const Route = createFileRoute("/marketplace_/tiktok")({
  head: () => ({
    meta: [
      { title: "TikTok Shop: economia — Soldiers Platform" },
      {
        name: "description",
        content:
          "Lucro real dos pedidos do TikTok Shop: extrato, taxas, comissões, liquidação, devoluções e saúde dos anúncios.",
      },
    ],
  }),
  component: TikTokEconomia,
});

type D = Awaited<ReturnType<typeof getTikTokEconomia>>;

function TikTokEconomia() {
  const [dias, setDias] = useState("90");
  const fn = useServerFn(getTikTokEconomia);
  const p = periodo(dias);
  const q = useQuery({ queryKey: ["tiktok-economia", p], queryFn: () => fn({ data: p }) });
  return (
    <>
      <PageHeader
        title="TikTok Shop: economia"
        subtitle="Quanto cada pedido realmente deixa: repasse do extrato menos custo do produto. Estimado até o extrato sair."
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
  const e = d.economia;
  const l = d.listings;
  const totalCustos = e.liquidado.custos.reduce((s, c) => s + c.valor, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Pedidos" value={fmtNum(e.pedidos)} hint={`Vendas ${fmtBRL(e.receitaItens)}`} />
        <Kpi
          label="Já liquidados"
          value={fmtPct(e.liquidacao.pctLiquidado, 0)}
          hint={`${fmtNum(e.liquidacao.liquidados)} pedidos · extrato em ~${e.liquidacao.prazoMedianoDias ?? "—"} dias`}
        />
        <Kpi
          label="Em aberto (estimado)"
          value={fmtBRL(e.liquidacao.emAbertoValor)}
          hint="vendido, extrato ainda não saiu"
          tone="warn"
        />
        <Kpi
          label="Repasse liquidado"
          value={fmtBRL(e.liquidado.repasse)}
          hint="soma dos extratos, já com taxas e estornos"
        />
        <Kpi
          label="Contribuição liquidada"
          value={fmtBRL(e.liquidado.contribuicao)}
          hint={`${fmtPct(e.liquidado.margemPct)} do repasse · CMV ${fmtBRL(e.liquidado.cmv)}`}
          tone={e.liquidado.contribuicao >= 0 ? "up" : "down"}
        />
        <Kpi
          label="Amostras enviadas"
          value={fmtNum(e.amostras.pedidos)}
          hint={`custo do produto ${fmtBRL(e.amostras.custoProduto)}`}
        />
      </div>

      <div className="grid gap-6 2xl:grid-cols-2">
        <Panel title="Para onde vai o dinheiro (pedidos liquidados)">
          <Table head={["Item do extrato", "Valor", "% do bruto (repasse + custos)"]}>
            {e.liquidado.custos
              .filter((c) => c.valor > 0)
              .sort((a, b) => b.valor - a.valor)
              .map((c) => (
                <tr key={c.chave}>
                  <Td>
                    {c.label}
                    {c.chave === "comissao_afiliado_ads" && (
                      <span className="ml-2">
                        <StatusTag tone="muted">Media × Affiliate</StatusTag>
                      </span>
                    )}
                  </Td>
                  <Td mono>{fmtBRL(c.valor)}</Td>
                  <Td mono>
                    {fmtPct(
                      e.liquidado.repasse + totalCustos
                        ? (c.valor / (e.liquidado.repasse + totalCustos)) * 100
                        : null,
                    )}
                  </Td>
                </tr>
              ))}
            <tr>
              <Td>
                <span className="font-medium">Custo do produto (CMV)</span>
              </Td>
              <Td mono>{fmtBRL(e.liquidado.cmv)}</Td>
              <Td mono>—</Td>
            </tr>
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">
            Valores do extrato do TikTok (fact_tiktok_financeiro) em valor absoluto. Comissão de
            afiliado sobre anúncios é custo de conteúdo de creator usado em mídia: fica entre Media
            e Affiliate. CMV com o custo vigente na data do pedido
            {e.itensSemCusto ? `; ${fmtNum(e.itensSemCusto)} itens sem custo cadastrado` : ""}.
          </p>
        </Panel>

        <Panel title="Descontos">
          <div className="grid grid-cols-2 gap-3">
            <Kpi
              label="Pago pelo TikTok"
              value={fmtBRL(e.descontoPlataforma)}
              hint="não reduz a receita da Soldiers"
              tone="up"
            />
            <Kpi
              label="Pago pela Soldiers"
              value={fmtBRL(e.descontoVendedor)}
              hint="reduz a receita"
              tone="warn"
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            O valor pago pelo comprador não é a receita da Soldiers: o desconto subsidiado pelo
            TikTok volta no repasse.
          </p>
        </Panel>
      </div>

      <Panel
        title="Contribuição por produto (pedidos liquidados)"
        right={<CsvButton name="tiktok-contribuicao-sku" rows={e.skus} />}
      >
        {e.skus.length ? (
          <Table
            head={[
              "Produto",
              "SKU",
              "Unid.",
              "Vendas",
              "Repasse (rateado)",
              "CMV",
              "Contribuição",
              "% do repasse",
            ]}
          >
            {e.skus.slice(0, 20).map((s) => (
              <tr key={s.sku || s.produto}>
                <Td className="max-w-[320px] truncate">{s.produto}</Td>
                <Td mono>{s.sku || "—"}</Td>
                <Td mono>{fmtNum(s.unidades)}</Td>
                <Td mono>{fmtBRL(s.receita)}</Td>
                <Td mono>{fmtBRL(s.repasse)}</Td>
                <Td mono>{fmtBRL(s.cmv)}</Td>
                <Td mono className={s.contribuicao >= 0 ? "text-success" : "text-destructive"}>
                  {fmtBRL(s.contribuicao)}
                </Td>
                <Td mono>{fmtPct(s.repasse ? (s.contribuicao / s.repasse) * 100 : null)}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Nenhum pedido liquidado no período.</Empty>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          O extrato é por pedido; o repasse é dividido entre os itens pelo preço de venda
          (estimativa).
        </p>
      </Panel>

      <div className="grid gap-6 2xl:grid-cols-2">
        <Panel title="Devoluções por motivo">
          {d.devolucoes.length ? (
            <Table head={["Motivo", "Devoluções", "Reembolsado"]}>
              {d.devolucoes.map((r) => (
                <tr key={r.motivo}>
                  <Td>{r.motivo}</Td>
                  <Td mono>{fmtNum(r.devolucoes)}</Td>
                  <Td mono>{fmtBRL(r.valor)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>Nenhuma devolução no período.</Empty>
          )}
        </Panel>

        <Panel title="Saúde dos anúncios">
          <div className="mb-4 grid grid-cols-3 gap-3">
            <Kpi label="Anúncios ativos" value={fmtNum(l.anuncios)} />
            <Kpi
              label="Com SKU sem estoque"
              value={fmtNum(l.semEstoque)}
              tone={l.semEstoque ? "warn" : "up"}
            />
            <Kpi
              label="Fora de venda"
              value={fmtNum(l.foraDeVenda)}
              tone={l.foraDeVenda ? "down" : "up"}
            />
          </div>
          {l.lista.length ? (
            <Table head={["Anúncio", "Problemas", "Saúde"]}>
              {l.lista.slice(0, 15).map((x) => (
                <tr key={x.product_id}>
                  <Td className="max-w-[260px] truncate">{x.titulo}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {x.problemas.map((pr) => (
                        <StatusTag
                          key={pr}
                          tone={/fora de venda|sem estoque/.test(pr) ? "danger" : "warn"}
                        >
                          {pr}
                        </StatusTag>
                      ))}
                    </div>
                  </Td>
                  <Td mono>{x.health ?? "—"}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>Nenhum anúncio com problema.</Empty>
          )}
        </Panel>
      </div>
    </div>
  );
}
