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
import { getCrmAcao } from "@/lib/data.functions";
import { LIMITES_EMAIL, TOLERANCIA_PP, ANTECEDENCIA_DIAS } from "@/lib/crm";
import { ACAO_LABEL, ACAO_TONE } from "@/domain/sources";
import { fmtBRL, fmtNum, fmtPct, fmtDate, periodo } from "@/lib/format";

// CRM 2.0 (benchmarks/rd-station-klaviyo/ANALISE.md §6): fila de ação por cliente, confiabilidade da
// previsão, régua de reposição por produto, e-mail do RD, funil de leads, ações de growth e saúde do Klaviyo.
// Só leitura. Cliente aparece só pela chave (sem nome, e-mail ou telefone). Receita ligada a e-mail é atribuída.
export const Route = createFileRoute("/crm_/acao")({
  head: () => ({
    meta: [
      { title: "CRM 2.0 — Soldiers Platform" },
      {
        name: "description",
        content:
          "Quem acionar hoje e por quê, quanto a previsão acerta, régua de reposição, e-mail do RD, leads e ações de growth.",
      },
    ],
  }),
  component: CrmAcao,
});

type D = Awaited<ReturnType<typeof getCrmAcao>>;
type Aba = "fila" | "reposicao" | "email" | "leads" | "acoes";

const NOMES: Record<string, string> = {
  fila: "fila de clientes",
  acuracia: "acerto da previsão",
  ciclos: "ciclo dos produtos",
  proximos: "próximo produto",
  campanhas: "campanhas de e-mail",
  vendasCampanha: "venda por campanha",
  automacoes: "automações",
  utm: "venda com UTM de e-mail",
  leadDia: "leads por dia",
  leads: "leads",
  acoes: "ações de growth",
  resultados: "resultados das ações",
  klaviyo: "envio ao Klaviyo",
};

const f1 = (v: number | null | undefined) => (v == null ? "—" : v.toFixed(1).replace(".", ","));

function CrmAcao() {
  const [dias, setDias] = useState("28");
  const fn = useServerFn(getCrmAcao);
  const p = periodo(dias);
  const q = useQuery({ queryKey: ["crm-acao", p], queryFn: () => fn({ data: p }) });
  return (
    <>
      <PageHeader
        title="CRM 2.0"
        subtitle="Quem acionar e por quê, quanto a previsão acerta e o que o e-mail realmente vende."
        right={
          <div className="flex items-center gap-4">
            <Link to="/crm" className="text-sm font-medium text-primary hover:underline">
              ← CRM
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
  const [aba, setAba] = useState<Aba>("fila");
  const erros = Object.keys(d.erros);
  const h30 = d.calibracao.horizontes.find((h) => h.horizonte === 30) ?? d.calibracao.horizontes[0];
  const k = d.klaviyo;
  return (
    <div className="space-y-6">
      {erros.length > 0 && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
          Não foi possível ler: {erros.map((e) => NOMES[e] ?? e).join(", ")}. O resto da tela usa o
          que carregou. Ver Data Health.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        <Kpi
          label="Clientes para acionar"
          value={fmtNum(d.fila.total)}
          hint={`${fmtBRL(d.fila.valor90)} esperados em 90 dias`}
        />
        <Kpi
          label="Erro médio da previsão"
          value={h30?.erroMedioPp == null ? "—" : `${f1(h30.erroMedioPp)} p.p.`}
          hint={h30 ? `chance de ${h30.horizonte} dias` : "sem histórico"}
          {...(h30?.erroMedioPp != null && h30.erroMedioPp > TOLERANCIA_PP
            ? { tone: "warn" as const }
            : {})}
        />
        <Kpi
          label="Receita por mil e-mails"
          value={fmtBRL(d.email.total.receitaPorMilEntregues)}
          hint={`${fmtNum(d.email.total.entregues)} entregues no período`}
        />
        <Kpi
          label="Spam / bounce"
          value={`${fmtPct(d.email.total.spamPct, 2)} · ${fmtPct(d.email.total.bouncePct, 1)}`}
          hint="limites: 0,1% · 2%"
          {...(d.email.total.alertas.length ? { tone: "down" as const } : {})}
        />
        <Kpi
          label="Leads que compraram"
          value={fmtPct(d.leads.conversaoPct, 1)}
          hint={`${fmtNum(d.leads.compraram)} de ${fmtNum(d.leads.leads)}`}
        />
        <Kpi
          label="Envio ao Klaviyo"
          value={
            k.status === "ok"
              ? "Em dia"
              : k.status === "sem dados"
                ? "—"
                : k.status === "parado"
                  ? "Parado"
                  : "Falhando"
          }
          hint={k.ultimaExecucao ? `último: ${fmtDate(k.ultimaExecucao)}` : "sem execuções"}
          {...(k.status === "falhando"
            ? { tone: "down" as const }
            : k.status === "parado"
              ? { tone: "warn" as const }
              : {})}
        />
      </div>

      <Pills
        value={aba}
        onChange={setAba}
        options={[
          { id: "fila", label: "Fila de ação" },
          { id: "reposicao", label: "Reposição por produto" },
          { id: "email", label: "E-mail (RD)" },
          { id: "leads", label: "Leads" },
          { id: "acoes", label: "Ações e Klaviyo" },
        ]}
      />

      {aba === "fila" && <Fila d={d} />}
      {aba === "reposicao" && <Reposicao r={d.regua} />}
      {aba === "email" && <Email d={d} />}
      {aba === "leads" && <Leads l={d.leads} />}
      {aba === "acoes" && <Acoes d={d} />}
    </div>
  );
}

function Fila({ d }: { d: D }) {
  const [acao, setAcao] = useState("todas");
  const itens = d.fila.itens.filter((i) => acao === "todas" || i.acao === acao);
  const cal = d.calibracao;
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Por ação">
          <Table head={["Ação", "Clientes", "Valor esperado 90d"]}>
            {d.fila.porAcao.map((a) => (
              <tr key={a.acao}>
                <Td>
                  <button onClick={() => setAcao(acao === a.acao ? "todas" : a.acao)}>
                    <StatusTag tone={acao === a.acao ? "primary" : (ACAO_TONE[a.acao] ?? "muted")}>
                      {ACAO_LABEL[a.acao] ?? a.acao}
                    </StatusTag>
                  </button>
                </Td>
                <Td mono>{fmtNum(a.clientes)}</Td>
                <Td mono>{fmtBRL(a.valor90)}</Td>
              </tr>
            ))}
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">
            Clique numa ação para filtrar a fila. Considera os 1.000 clientes acionáveis de maior
            valor esperado.
          </p>
        </Panel>
        <Panel title="A previsão acerta?" className="xl:col-span-2">
          {cal.faixas.length ? (
            <Table
              head={[
                "Horizonte",
                "Faixa de chance",
                "Clientes",
                "Previsto",
                "Voltaram",
                "Diferença",
                "Leitura",
              ]}
            >
              {cal.faixas.map((f) => (
                <tr key={`${f.horizonte}-${f.faixa}`}>
                  <Td mono>{f.horizonte} dias</Td>
                  <Td>{f.faixa}</Td>
                  <Td mono>{fmtNum(f.clientes)}</Td>
                  <Td mono>{fmtPct(f.previsto, 1)}</Td>
                  <Td mono>{fmtPct(f.realizado, 1)}</Td>
                  <Td mono>
                    {f.desvioPp == null
                      ? "—"
                      : `${f.desvioPp > 0 ? "+" : ""}${f1(f.desvioPp)} p.p.`}
                  </Td>
                  <Td>
                    <StatusTag
                      tone={
                        f.leitura === "calibrada"
                          ? "success"
                          : f.leitura === "otimista"
                            ? "warn"
                            : "muted"
                      }
                    >
                      {f.leitura}
                    </StatusTag>
                  </Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty />
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Compara a chance prevista com quem de fato voltou. Otimista = previu mais do que
            aconteceu (mais de {TOLERANCIA_PP} p.p.): leia o valor esperado com desconto.
          </p>
        </Panel>
      </div>

      <Panel
        title={`Fila de clientes${acao === "todas" ? "" : ` · ${ACAO_LABEL[acao] ?? acao}`}`}
        right={
          <CsvButton
            name="crm-fila-de-acao"
            rows={itens.slice(0, 1000) as unknown as Record<string, unknown>[]}
          />
        }
      >
        {itens.length ? (
          <Table
            head={[
              "Cliente",
              "Ação",
              "Por que agora",
              "Chance 30d",
              "Chance 90d",
              "Valor esperado 90d",
              "Produto provável",
              "Último canal",
            ]}
          >
            {itens.slice(0, 100).map((i) => (
              <tr key={i.cliente}>
                <Td mono>
                  <Link
                    to="/clientes/$chave"
                    params={{ chave: i.cliente }}
                    className="hover:text-primary"
                  >
                    {i.cliente.slice(0, 12)}
                  </Link>
                </Td>
                <Td>
                  <StatusTag tone={ACAO_TONE[i.acao] ?? "muted"}>
                    {ACAO_LABEL[i.acao] ?? i.acao}
                  </StatusTag>
                </Td>
                <Td>{i.motivo}</Td>
                <Td mono>{fmtPct(i.chance30, 0)}</Td>
                <Td mono>{fmtPct(i.chance90, 0)}</Td>
                <Td mono>{fmtBRL(i.valor90)}</Td>
                <Td>{i.produtoProvavel || "—"}</Td>
                <Td>{i.canal || "—"}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty />
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Mostra os 100 primeiros; o CSV leva a fila inteira. Só a chave do cliente sai da tela.
          Disparo de e-mail ou WhatsApp continua no RD/Klaviyo.
        </p>
      </Panel>
    </div>
  );
}

function Reposicao({ r }: { r: D["regua"] }) {
  return (
    <Panel
      title="Régua de reposição por produto"
      right={
        <CsvButton name="crm-regua-reposicao" rows={r as unknown as Record<string, unknown>[]} />
      }
    >
      {r.length ? (
        <Table
          head={[
            "Produto",
            "Clientes",
            "Ciclo mediano",
            "Lembrete sugerido",
            "Voltam 30 / 60 / 90d",
            "Recompra do mesmo",
            "Próximo produto mais comum",
          ]}
        >
          {r.map((x) => (
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
              <Td mono>{fmtNum(x.clientes)}</Td>
              <Td mono>{x.cicloMediano} dias</Td>
              <Td mono>dia {x.lembreteDia}</Td>
              <Td mono>
                {fmtPct(x.retorno30, 0)} · {fmtPct(x.retorno60, 0)} · {fmtPct(x.retorno90, 0)}
              </Td>
              <Td mono>{x.repete ? `${fmtNum(x.repete.ocorrencias)} vezes` : "—"}</Td>
              <Td>
                {x.proximo ? (
                  <>
                    {x.proximo.produto}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({fmtPct(x.proximo.forca, 0)})
                    </span>
                  </>
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
      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
        <li>
          Produtos com pelo menos 30 clientes. Ciclo mediano = dias entre uma compra e a seguinte.
        </li>
        <li>
          Lembrete sugerido = {ANTECEDENCIA_DIAS} dias antes do ciclo. Vale como ponto de partida
          para o fluxo de reposição no RD/Klaviyo; ajuste pelo teste.
        </li>
        <li>
          Próximo produto = o que mais se compra depois deste (cross-sell para o mesmo e-mail).
        </li>
      </ul>
    </Panel>
  );
}

function Email({ d }: { d: D }) {
  const e = d.email;
  const u = d.utm;
  return (
    <div className="space-y-6">
      <Panel
        title="Campanhas"
        right={
          <CsvButton
            name="crm-email-campanhas"
            rows={e.campanhas as unknown as Record<string, unknown>[]}
          />
        }
      >
        {e.campanhas.length ? (
          <Table
            head={[
              "Enviada",
              "Campanha",
              "Entregues",
              "Clique",
              "Pedidos",
              "Receita ligada",
              "Receita / mil",
              "Spam",
              "Bounce",
              "Descadastro",
              "Saúde",
            ]}
          >
            {e.campanhas.map((c) => (
              <tr key={c.id}>
                <Td mono>{fmtDate(c.data)}</Td>
                <Td>{c.nome}</Td>
                <Td mono>{fmtNum(c.entregues)}</Td>
                <Td mono>{fmtPct(c.cliquePct, 1)}</Td>
                <Td mono>{fmtNum(c.pedidos)}</Td>
                <Td mono>{fmtBRL(c.receita)}</Td>
                <Td mono>{fmtBRL(c.receitaPorMilEntregues)}</Td>
                <Td
                  mono
                  className={
                    c.spamPct != null && c.spamPct > LIMITES_EMAIL.spamPct ? "text-destructive" : ""
                  }
                >
                  {fmtPct(c.spamPct, 2)}
                </Td>
                <Td
                  mono
                  className={
                    c.bouncePct != null && c.bouncePct > LIMITES_EMAIL.bouncePct
                      ? "text-destructive"
                      : ""
                  }
                >
                  {fmtPct(c.bouncePct, 1)}
                </Td>
                <Td mono>{fmtPct(c.descadastroPct, 2)}</Td>
                <Td>
                  {c.alertas.length ? (
                    <span className="flex flex-wrap gap-1">
                      {c.alertas.map((t) => (
                        <StatusTag key={t} tone="warn">
                          {t}
                        </StatusTag>
                      ))}
                    </span>
                  ) : (
                    <StatusTag tone="success">ok</StatusTag>
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
            Receita ligada = venda do Shopify com UTM da campanha. É atribuída: não somar à receita
            do mês.
          </li>
          <li>
            Receita por mil e-mails entregues é a métrica para comparar campanhas. Abertura fica
            fora: leitores de e-mail abrem sozinhos para proteger a privacidade e inflam o número.
          </li>
          <li>
            Limites: spam até {fmtPct(LIMITES_EMAIL.spamPct, 1)} (nunca acima de{" "}
            {fmtPct(LIMITES_EMAIL.spamMaxPct, 1)}), bounce até {fmtPct(LIMITES_EMAIL.bouncePct, 0)},
            descadastro até {fmtPct(LIMITES_EMAIL.descadastroPct, 1)}.
          </li>
        </ul>
      </Panel>

      <div className="grid gap-6 2xl:grid-cols-2">
        <Panel
          title="Automações (fluxos)"
          right={
            <CsvButton
              name="crm-automacoes"
              rows={d.automacoes as unknown as Record<string, unknown>[]}
            />
          }
        >
          {d.automacoes.length ? (
            <Table head={["Fluxo", "Entregues", "Clique", "Bounce", "Descadastro", "Saúde"]}>
              {d.automacoes.map((a) => (
                <tr key={a.fluxo}>
                  <Td>{a.fluxo}</Td>
                  <Td mono>{fmtNum(a.entregues)}</Td>
                  <Td mono>{fmtPct(a.cliquePct, 1)}</Td>
                  <Td mono>{fmtPct(a.bouncePct, 1)}</Td>
                  <Td mono>{fmtPct(a.descadastroPct, 2)}</Td>
                  <Td>
                    {a.alertas.length ? (
                      <span className="flex flex-wrap gap-1">
                        {a.alertas.map((t) => (
                          <StatusTag key={t} tone="warn">
                            {t}
                          </StatusTag>
                        ))}
                      </span>
                    ) : (
                      <StatusTag tone="success">ok</StatusTag>
                    )}
                  </Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty />
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            O banco ainda não liga venda a fluxo de automação; só a campanhas. Por isso aqui não há
            receita.
          </p>
        </Panel>
        <Panel title="Venda com UTM de e-mail">
          <div className="grid grid-cols-2 gap-3">
            <Kpi
              label="Ligada a campanha do RD"
              value={fmtBRL(u.ligada.receita)}
              hint={`${fmtNum(u.ligada.pedidos)} pedidos`}
            />
            <Kpi
              label="UTM sem campanha"
              value={fmtBRL(u.solta.receita)}
              hint={`${fmtPct(u.pctLigada == null ? null : 100 - u.pctLigada, 0)} da venda de e-mail`}
              {...(u.pctLigada != null && u.pctLigada < 70 ? { tone: "warn" as const } : {})}
            />
          </div>
          {u.soltasTop.length ? (
            <div className="mt-4">
              <Table head={["utm_campaign sem campanha ligada", "Pedidos", "Receita"]}>
                {u.soltasTop.map((x) => (
                  <tr key={x.utm}>
                    <Td mono>{x.utm}</Td>
                    <Td mono>{fmtNum(x.pedidos)}</Td>
                    <Td mono>{fmtBRL(x.receita)}</Td>
                  </tr>
                ))}
              </Table>
            </div>
          ) : null}
          <p className="mt-3 text-xs text-muted-foreground">
            UTM sem campanha = venda que veio de e-mail mas não casa com nenhuma campanha do RD
            (geralmente automação ou UTM digitada diferente). Padronizar a UTM faz essa venda
            aparecer.
          </p>
        </Panel>
      </div>
    </div>
  );
}

function Leads({ l }: { l: D["leads"] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Leads no período" value={fmtNum(l.leads)} />
        <Kpi label="Compraram" value={fmtNum(l.compraram)} hint={fmtPct(l.conversaoPct, 1)} />
        <Kpi label="Receita dos leads" value={fmtBRL(l.receita)} />
        <Kpi label="Cadastros novos no RD" value={fmtNum(l.novosCadastrados)} />
      </div>
      <Panel
        title="Lead → cliente por origem"
        right={
          <CsvButton
            name="crm-leads-origem"
            rows={l.porOrigem as unknown as Record<string, unknown>[]}
          />
        }
      >
        {l.porOrigem.length ? (
          <Table
            head={["Origem", "Leads", "Compraram", "Conversão", "Receita", "Receita por lead"]}
          >
            {l.porOrigem.map((o) => (
              <tr key={o.origem}>
                <Td>{o.origem}</Td>
                <Td mono>{fmtNum(o.leads)}</Td>
                <Td mono>{fmtNum(o.compraram)}</Td>
                <Td mono>{fmtPct(o.conversaoPct, 1)}</Td>
                <Td mono>{fmtBRL(o.receita)}</Td>
                <Td mono>{fmtBRL(o.receitaPorLead)}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty />
        )}
      </Panel>
      <div className="grid gap-6 xl:grid-cols-3">
        {(
          [
            ["Estágio no funil", l.porEstagio],
            ["Fonte (utm_source)", l.porFonte],
            ["Conversão (formulário)", l.porConversao],
          ] as const
        ).map(([t, rows]) => (
          <Panel key={t} title={t}>
            {rows.length ? (
              <Table head={["", "Leads", "%"]}>
                {rows.map((x) => (
                  <tr key={x.nome}>
                    <Td>{x.nome}</Td>
                    <Td mono>{fmtNum(x.qtd)}</Td>
                    <Td mono>{fmtPct(x.pct, 0)}</Td>
                  </tr>
                ))}
              </Table>
            ) : (
              <Empty />
            )}
          </Panel>
        ))}
      </div>
    </div>
  );
}

function Acoes({ d }: { d: D }) {
  const a = d.acoes;
  const k = d.klaviyo;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Ações abertas" value={fmtNum(a.abertas)} />
        <Kpi
          label="Com prazo vencido"
          value={fmtNum(a.atrasadas)}
          {...(a.atrasadas ? { tone: "warn" as const } : {})}
        />
        <Kpi label="Abertas sem responsável" value={fmtNum(a.semResponsavel)} />
        <Kpi
          label="Concluídas sem resultado"
          value={fmtNum(a.fechadasSemResultado)}
          hint="registrar antes e depois"
          {...(a.fechadasSemResultado ? { tone: "warn" as const } : {})}
        />
      </div>
      <Panel
        title="Ações de growth"
        right={
          <CsvButton
            name="crm-acoes-growth"
            rows={a.itens as unknown as Record<string, unknown>[]}
          />
        }
      >
        {a.itens.length ? (
          <Table
            head={[
              "Ação",
              "Canal",
              "Status",
              "Responsável",
              "Prazo",
              "Impacto estimado",
              "Resultado",
              "Antes → depois",
            ]}
          >
            {a.itens.map((x) => (
              <tr key={x.id}>
                <Td>{x.titulo}</Td>
                <Td>{x.canal || "—"}</Td>
                <Td>
                  <StatusTag tone={x.fechada ? "muted" : x.atrasada ? "warn" : "primary"}>
                    {x.status}
                    {x.atrasada ? " · atrasada" : ""}
                  </StatusTag>
                </Td>
                <Td>{x.responsavel || "—"}</Td>
                <Td mono>{x.prazo ? fmtDate(x.prazo) : "—"}</Td>
                <Td mono>{fmtBRL(x.impacto)}</Td>
                <Td>{x.resultado?.resultado || "—"}</Td>
                <Td mono>
                  {x.resultado && x.resultado.antes != null && x.resultado.depois != null
                    ? `${fmtNum(x.resultado.antes)} → ${fmtNum(x.resultado.depois)}${x.resultado.variacaoPct != null ? ` (${x.resultado.variacaoPct > 0 ? "+" : ""}${fmtPct(x.resultado.variacaoPct, 0)})` : ""}`
                    : "—"}
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Nenhuma ação registrada em growth_acoes.</Empty>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Toda ação fechada deveria ter um resultado com a métrica antes e depois. É assim que a
          plataforma aprende quais ações repetir.
        </p>
      </Panel>
      <Panel
        title="Envio de segmentos ao Klaviyo"
        right={
          <StatusTag
            tone={
              k.status === "ok"
                ? "success"
                : k.status === "falhando"
                  ? "danger"
                  : k.status === "parado"
                    ? "warn"
                    : "muted"
            }
          >
            {k.status}
          </StatusTag>
        }
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi
            label="Último envio certo"
            value={k.ultimoOk ? fmtDate(k.ultimoOk) : "—"}
            hint={k.horasDesdeOk != null ? `há ${Math.round(k.horasDesdeOk)} h` : undefined}
          />
          <Kpi
            label="Falhas seguidas"
            value={fmtNum(k.falhasSeguidas)}
            {...(k.falhasSeguidas ? { tone: "down" as const } : {})}
          />
          <Kpi
            label="Execuções em 7 dias"
            value={fmtNum(k.execucoes7d)}
            hint={`${fmtNum(k.falhas7d)} com falha`}
          />
          <Kpi label="Perfis no último segmento" value={fmtNum(k.perfis)} />
        </div>
        {k.execucoes.length ? (
          <div className="mt-4">
            <Table head={["Quando", "Modo", "Resultado", "HTTP", "Perfis", "Erro"]}>
              {k.execucoes.map((x) => (
                <tr key={x.quando + x.modo}>
                  <Td mono>{x.quando.slice(0, 16).replace("T", " ")}</Td>
                  <Td>{x.modo}</Td>
                  <Td>
                    <StatusTag tone={x.ok ? "success" : "danger"}>
                      {x.ok ? "ok" : "falhou"}
                    </StatusTag>
                  </Td>
                  <Td mono>{x.http ?? "—"}</Td>
                  <Td mono>{fmtNum(x.perfis)}</Td>
                  <Td>{x.erro ? x.erro.slice(0, 120) : "—"}</Td>
                </tr>
              ))}
            </Table>
          </div>
        ) : (
          <Empty>Nenhuma execução registrada.</Empty>
        )}
      </Panel>
    </div>
  );
}
