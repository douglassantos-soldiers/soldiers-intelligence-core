import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  PageHeader,
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
import { getFechamento, mesAnterior } from "@/lib/fechamento.functions";
import { CAMPOS, BASES_CUPOM, PAGAMENTO_MINIMO, type BaseCupom } from "@/lib/fechamento";
import { fmtBRL2, fmtNum, fmtPct } from "@/lib/format";

// Fechamento de comissões de influenciadores e afiliados, com a MESMA regra da planilha "Vendas gerais":
// venda considerada = maior entre cupom (Shopify) e UpPromote; total = considerada + TikTok;
// comissão = considerada × %. Só leitura: nada é pago por aqui. Sem dado pessoal: cupom, @ público e valores.
export const Route = createFileRoute("/affiliate_/fechamento")({
  head: () => ({
    meta: [
      { title: "Fechamento de comissões — Soldiers Platform" },
      {
        name: "description",
        content:
          "Venda considerada, TikTok e comissão por cupom no mês, com a regra da planilha e a conferência linha a linha.",
      },
    ],
  }),
  component: Fechamento,
});

type D = Awaited<ReturnType<typeof getFechamento>>;
type Aba = "cupons" | "creators" | "conferencia" | "pagamento";
const T = (r: unknown) => r as Record<string, unknown>[];
const NOME_BASE: Record<BaseCupom, string> = {
  faturamento_liquido: "faturamento líquido",
  faturamento_bruto: "faturamento bruto",
  total_pago: "total pago",
};
const NOME_MES = (m: string) => {
  const [a, mm] = m.split("-");
  return `${["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][Number(mm) - 1]}/${a!.slice(2)}`;
};
const ultimosMeses = (n: number) => {
  const out: string[] = [];
  const base = mesAnterior();
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.UTC(+base.slice(0, 4), +base.slice(5, 7) - 1 - i, 1));
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
};

function Fechamento() {
  const [mes, setMes] = useState(mesAnterior());
  const [base, setBase] = useState<BaseCupom>("faturamento_liquido");
  const fn = useServerFn(getFechamento);
  const q = useQuery({
    queryKey: ["fechamento", mes, base],
    queryFn: () => fn({ data: { mes, base } }),
  });
  return (
    <>
      <PageHeader
        title="Fechamento de comissões"
        subtitle="A conta da planilha de influenciadores e afiliados: venda considerada, TikTok e comissão por cupom."
        right={
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/affiliate/creators"
              className="text-sm font-medium text-primary hover:underline"
            >
              ← Creators 360
            </Link>
            <Pills
              value={mes}
              onChange={setMes}
              options={ultimosMeses(6).map((m) => ({ id: m, label: NOME_MES(m) }))}
            />
          </div>
        }
      />
      {q.isLoading && <Loading />}
      {q.error && <ErrorBox error={q.error} />}
      {q.data && <Body d={q.data} base={base} setBase={setBase} />}
    </>
  );
}

function Body({ d, base, setBase }: { d: D; base: BaseCupom; setBase: (b: BaseCupom) => void }) {
  const [aba, setAba] = useState<Aba>(d.conferencia ? "conferencia" : "cupons");
  const r = d.resumo;
  const conf = d.conferencia;
  return (
    <div className="space-y-6">
      <ErrosLeitura erros={d.erros} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        <Kpi
          label="Venda considerada"
          value={fmtBRL2(r.vendaConsiderada)}
          hint="maior entre cupom e UpPromote"
        />
        <Kpi label="Vendas TikTok" value={fmtBRL2(r.vendaTikTok)} hint="pelo @, fora da comissão" />
        <Kpi label="Total" value={fmtBRL2(r.total)} hint="considerada + TikTok" />
        <Kpi
          label="Comissão a pagar"
          value={fmtBRL2(r.comissao)}
          hint={`${fmtPct(r.comissaoEfetivaPct, 2)} da venda considerada`}
        />
        <Kpi label="Cupons com venda" value={`${fmtNum(r.cuponsComVenda)} / ${fmtNum(r.cupons)}`} />
        <Kpi
          label="Conferência"
          value={conf ? `${fmtNum(conf.batem)} / ${fmtNum(conf.linhas.length)}` : "sem planilha"}
          hint={conf ? "cupons iguais à planilha" : "importar a planilha do mês"}
          {...(conf && conf.diferentes + conf.soPlanilha ? { tone: "warn" as const } : {})}
        />
      </div>
      {d.migracaoPendente && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
          A conferência com a planilha precisa da migração{" "}
          <span className="font-mono">20261006130000_affiliate_fechamento_planilha.sql</span>. O
          cálculo da plataforma funciona sem ela.
        </div>
      )}
      <Pills
        value={aba}
        onChange={setAba}
        options={[
          { id: "cupons", label: "Por cupom" },
          { id: "creators", label: "Por creator" },
          { id: "conferencia", label: "Conferência com a planilha" },
          { id: "pagamento", label: "Para pagamento" },
        ]}
      />
      {aba === "cupons" && <Cupons d={d} />}
      {aba === "creators" && <Creators d={d} />}
      {aba === "conferencia" && <Conferencia d={d} base={base} setBase={setBase} />}
      {aba === "pagamento" && <Pagamento d={d} />}
    </div>
  );
}

function Cupons({ d }: { d: D }) {
  const r = d.resumo;
  return (
    <Panel
      title={`Cupons em ${NOME_MES(d.mes)}`}
      right={<CsvButton name={`fechamento-${d.mes}`} rows={T(d.linhas)} />}
    >
      {d.linhas.length ? (
        <Table
          head={[
            "Cupom",
            "@ do TikTok",
            "Comissão",
            "Venda cupom",
            "Venda UP Promote",
            "Venda considerada",
            "Vendas TikTok",
            "Total",
            "A receber",
          ]}
        >
          {d.linhas
            .filter((l) => l.total > 0 || l.comissaoPct > 0)
            .slice(0, 400)
            .map((l) => (
              <tr key={l.cupom}>
                <Td className="font-medium">{l.cupom}</Td>
                <Td>{l.tiktok ? `@${l.tiktok}` : "—"}</Td>
                <Td mono>{fmtPct(l.comissaoPct, l.comissaoPct % 1 ? 1 : 0)}</Td>
                <Td mono className={l.fonteConsiderada === "cupom" ? "font-semibold" : ""}>
                  {fmtBRL2(l.vendaCupom)}
                </Td>
                <Td mono className={l.fonteConsiderada === "uppromote" ? "font-semibold" : ""}>
                  {fmtBRL2(l.vendaUp)}
                </Td>
                <Td mono>{fmtBRL2(l.vendaConsiderada)}</Td>
                <Td mono>{fmtBRL2(l.vendaTikTok)}</Td>
                <Td mono>{fmtBRL2(l.total)}</Td>
                <Td mono className="font-semibold">
                  {fmtBRL2(l.comissao)}
                </Td>
              </tr>
            ))}
        </Table>
      ) : (
        <Empty>Nenhum cupom cadastrado.</Empty>
      )}
      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
        <li>
          Venda considerada = o maior entre cupom e UpPromote (em negrito, o lado que valeu). A
          Shopify não marca toda venda nos dois lugares; somar contaria a mesma venda duas vezes.
          Neste mês: {fmtNum(r.pelaFonte.cupom)} cupons pelo cupom, {fmtNum(r.pelaFonte.uppromote)}{" "}
          pelo UpPromote e {fmtNum(r.pelaFonte.iguais)} iguais.
        </li>
        <li>
          Comissão = venda considerada × %. O TikTok fica fora da comissão. Mostrando só cupons com
          venda ou com comissão cadastrada; o CSV traz todos.
        </li>
        {r.tiktokRepetido > 0 && (
          <li>
            Creator com mais de um cupom (e-mails diferentes no site e no UpPromote) tem o TikTok
            repetido em cada cupom, como na planilha: {fmtBRL2(r.tiktokRepetido)} a mais no Total. A
            aba Por creator conta uma vez só.
          </li>
        )}
        {r.vendaSemComissao > 0 && (
          <li>{fmtBRL2(r.vendaSemComissao)} de venda considerada em cupons com 0% de comissão.</li>
        )}
      </ul>
    </Panel>
  );
}

function Creators({ d }: { d: D }) {
  return (
    <Panel
      title="Por creator (cupons do mesmo @ somados)"
      right={<CsvButton name={`fechamento-creators-${d.mes}`} rows={T(d.creators)} />}
    >
      {d.creators.filter((c) => c.total > 0).length ? (
        <Table
          head={["Creator", "Cupons", "Venda considerada", "Vendas TikTok", "Total", "A receber"]}
        >
          {d.creators
            .filter((c) => c.total > 0)
            .slice(0, 200)
            .map((c) => (
              <tr key={c.creator}>
                <Td className="font-medium">{c.creator}</Td>
                <Td className="text-xs">{c.cupons.join(", ")}</Td>
                <Td mono>{fmtBRL2(c.considerada)}</Td>
                <Td mono>{fmtBRL2(c.tiktok)}</Td>
                <Td mono>{fmtBRL2(c.total)}</Td>
                <Td mono>{fmtBRL2(c.comissao)}</Td>
              </tr>
            ))}
        </Table>
      ) : (
        <Empty>Sem venda no mês.</Empty>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Agrupa pelo @ do TikTok; cupom sem @ fica sozinho. Aqui o TikTok entra uma vez por creator.
      </p>
    </Panel>
  );
}

function Conferencia({
  d,
  base,
  setBase,
}: {
  d: D;
  base: BaseCupom;
  setBase: (b: BaseCupom) => void;
}) {
  const c = d.conferencia;
  if (!c)
    return (
      <Panel title="Conferência com a planilha">
        <Empty>
          Nenhuma planilha carregada para {NOME_MES(d.mes)}. Importe o CSV do fechamento em{" "}
          <span className="font-mono">affiliate_fechamento_planilha</span> (Supabase → Table Editor
          → Import data from CSV) para comparar linha a linha.
        </Empty>
      </Panel>
    );
  const TOM = {
    bate: "success",
    diferente: "warn",
    "só na planilha": "danger",
    "só na plataforma": "primary",
  } as const;
  const nomeCampo = Object.fromEntries(CAMPOS.map((x) => [x.id, x.nome]));
  return (
    <div className="space-y-6">
      <Panel title="Totais: plataforma × planilha">
        <Table head={["Coluna", "Plataforma", "Planilha", "Diferença", "Cupons iguais"]}>
          {c.porCampo.map((x) => (
            <tr key={x.campo}>
              <Td className="font-medium">{x.nome}</Td>
              <Td mono>{fmtBRL2(x.plataforma)}</Td>
              <Td mono>{fmtBRL2(x.planilha)}</Td>
              <Td mono className={Math.abs(x.plataforma - x.planilha) > 0.05 ? "text-warning" : ""}>
                {fmtBRL2(x.plataforma - x.planilha)}
              </Td>
              <Td mono>
                {fmtNum(x.linhasBatem)} / {fmtNum(x.linhasComparadas)}
              </Td>
            </tr>
          ))}
        </Table>
        <p className="mt-3 text-xs text-muted-foreground">
          Planilha carregada em {d.planilhaCarregadaEm.slice(0, 16).replace("T", " ")}. Cupom
          repetido na planilha (ex.: &quot;DUPLICADO&quot;) é comparado pela primeira linha.
          Tolerância de R$ 0,05 por cupom.
        </p>
      </Panel>
      {d.basesCupom.length > 0 && (
        <Panel title='Qual venda do site é a "venda cupom" da planilha'>
          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-muted-foreground">Base usada:</span>
            <Pills
              value={base}
              onChange={setBase}
              options={BASES_CUPOM.map((b) => ({ id: b, label: NOME_BASE[b] }))}
            />
          </div>
          <Table head={["Coluna do site", "Cupons iguais à planilha", "%"]}>
            {d.basesCupom.map((b) => (
              <tr key={b.base}>
                <Td>{NOME_BASE[b.base]}</Td>
                <Td mono>
                  {fmtNum(b.batem)} / {fmtNum(b.comparados)}
                </Td>
                <Td mono>{fmtPct(b.pct, 0)}</Td>
              </tr>
            ))}
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">
            [HIPÓTESE] A planilha usa uma destas colunas de vw_site_cupom_dia. A de maior % é a que
            deve ficar como base.
          </p>
        </Panel>
      )}
      <Panel
        title={`Cupons: ${fmtNum(c.batem)} iguais, ${fmtNum(c.diferentes)} diferentes, ${fmtNum(c.soPlanilha)} só na planilha, ${fmtNum(c.soPlataforma)} só na plataforma`}
        right={
          <CsvButton
            name={`conferencia-${d.mes}`}
            rows={c.linhas.map((l) => ({
              cupom: l.cupom,
              situacao: l.situacao,
              diferencas: l.diferencas.map((x) => nomeCampo[x]).join("; "),
              ...Object.fromEntries(
                CAMPOS.flatMap((x) => [
                  [`plataforma_${x.col}`, l.plataforma[x.id] ?? null],
                  [`planilha_${x.col}`, l.planilha[x.id] ?? null],
                ]),
              ),
            }))}
          />
        }
      >
        {c.linhas.filter((l) => l.situacao !== "bate" || l.pctDiferente).length ? (
          <Table
            head={[
              "Cupom",
              "Situação",
              "Onde difere",
              "Considerada (plat. / plan.)",
              "TikTok (plat. / plan.)",
              "Comissão (plat. / plan.)",
              "% (plat. / plan.)",
            ]}
          >
            {c.linhas
              .filter((l) => l.situacao !== "bate" || l.pctDiferente)
              .slice(0, 200)
              .map((l) => (
                <tr key={l.cupom + l.situacao}>
                  <Td className="font-medium">{l.cupom}</Td>
                  <Td>
                    <StatusTag tone={TOM[l.situacao]}>{l.situacao}</StatusTag>
                  </Td>
                  <Td className="text-xs">
                    {l.diferencas.map((x) => nomeCampo[x]).join(", ") ||
                      (l.pctDiferente ? "% cadastrado" : "—")}
                  </Td>
                  <Td mono>
                    {fmtBRL2(l.plataforma.vendaConsiderada)} /{" "}
                    {fmtBRL2(l.planilha.vendaConsiderada)}
                  </Td>
                  <Td mono>
                    {fmtBRL2(l.plataforma.vendaTikTok)} / {fmtBRL2(l.planilha.vendaTikTok)}
                  </Td>
                  <Td mono>
                    {fmtBRL2(l.plataforma.comissao)} / {fmtBRL2(l.planilha.comissao)}
                  </Td>
                  <Td mono>
                    {fmtPct(l.plataforma.comissaoPct, 1)} / {fmtPct(l.planilha.comissaoPct, 1)}
                  </Td>
                </tr>
              ))}
          </Table>
        ) : (
          <Empty>Todos os cupons batem com a planilha.</Empty>
        )}
      </Panel>
    </div>
  );
}

const TOM_PAGAMENTO = { pronto: "success", conferir: "warn", "abaixo do mínimo": "muted" } as const;

function Pagamento({ d }: { d: D }) {
  const p = d.pagamento;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="Pronto para pagar"
          value={fmtBRL2(p.valorPronto)}
          hint={`${fmtNum(p.prontos)} creator(s)`}
          tone="up"
        />
        <Kpi
          label="Conferir antes"
          value={fmtBRL2(p.valorConferir)}
          hint="cupom diferente da planilha ou fora dela"
          {...(p.valorConferir ? { tone: "warn" as const } : {})}
        />
        <Kpi
          label="Abaixo do mínimo"
          value={fmtBRL2(p.valorAbaixo)}
          hint={`menos de R$ ${PAGAMENTO_MINIMO} acumula`}
        />
        <Kpi
          label="Total de comissão"
          value={fmtBRL2(p.total)}
          hint={`${fmtNum(p.linhas.length)} creator(s)`}
        />
      </div>
      <Panel
        title={`Lista para pagamento (${d.mes})`}
        right={<CsvButton name={`pagamento-${d.mes}`} rows={T(p.linhas)} />}
      >
        {p.linhas.length ? (
          <Table
            head={["Creator", "TikTok", "Cupons", "Venda considerada", "Comissão", "Situação"]}
          >
            {p.linhas.slice(0, 300).map((x) => (
              <tr key={`${x.creator}-${x.cupons}`}>
                <Td className="font-medium">{x.creator}</Td>
                <Td>{x.tiktok || "—"}</Td>
                <Td className="text-xs">{x.cupons}</Td>
                <Td mono>{fmtBRL2(x.vendaConsiderada)}</Td>
                <Td mono>{fmtBRL2(x.comissao)}</Td>
                <Td>
                  <StatusTag tone={TOM_PAGAMENTO[x.situacao]}>{x.situacao}</StatusTag>
                  {x.motivo && <div className="mt-1 text-xs text-muted-foreground">{x.motivo}</div>}
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Nenhuma comissão a pagar no mês.</Empty>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Uma linha por creator (cupons do mesmo @ juntos), só a comissão sobre a venda considerada.
          O CSV não tem CPF, CNPJ, chave PIX nem conta: o financeiro completa fora da plataforma,
          com o documento fiscal (RPA ou nota do MEI). Pagar continua fora da plataforma até a Fase
          3. O mínimo de R$ {PAGAMENTO_MINIMO} é hipótese a definir com o financeiro.
        </p>
      </Panel>
    </div>
  );
}
