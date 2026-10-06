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
import { getTikTokAds } from "@/lib/canais.functions";
import { TOM_LEITURA } from "@/lib/ritmo";
import { fmtBRL, fmtNum, fmtPct, fmtX, fmtDate, periodo } from "@/lib/format";

// TikTok Ads (Plano Mestre cap. 7; cap. 10: não confundir com TikTok Shop). Receita informada pelo TikTok,
// atribuída: não somar com a venda realizada. Só leitura e recomendação.
export const Route = createFileRoute("/media_/tiktok")({
  head: () => ({
    meta: [
      { title: "TikTok Ads — Soldiers Platform" },
      {
        name: "description",
        content:
          "Campanhas, GMV Max, produtos e vídeos do TikTok Ads, com ritmo e anomalia do dia.",
      },
    ],
  }),
  component: TikTokAds,
});

type D = Awaited<ReturnType<typeof getTikTokAds>>;
type Aba = "campanhas" | "produtos" | "criativos";
const NOMES: Record<string, string> = {
  tipos: "resumo por tipo",
  campanhas: "campanhas",
  gmvMax: "GMV Max",
  produtos: "produtos",
  criativos: "vídeos",
  estoque: "estoque TikTok",
};
const T = (r: unknown) => r as Record<string, unknown>[];

function TikTokAds() {
  const [dias, setDias] = useState("28");
  const fn = useServerFn(getTikTokAds);
  const p = periodo(dias);
  const q = useQuery({ queryKey: ["tiktok-ads", p], queryFn: () => fn({ data: p }) });
  return (
    <>
      <PageHeader
        title="TikTok Ads"
        subtitle="Onde a verba do TikTok rende, quais vídeos escalar ou cortar e se o dia saiu do normal."
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
  const [aba, setAba] = useState<Aba>("campanhas");
  const r = d.resumo;
  const a = r.anomalia;
  return (
    <div className="space-y-6">
      <ErrosLeitura erros={d.erros} nomes={NOMES} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        <Kpi label="Investido" value={fmtBRL(r.invest)} />
        <Kpi label="Receita informada" value={fmtBRL(r.receita)} hint="atribuída pelo TikTok" />
        <Kpi label="ROAS" value={fmtX(r.roas)} />
        <Kpi label="Pedidos" value={fmtNum(r.pedidos)} />
        <Kpi label="Custo por pedido" value={fmtBRL(r.cpa)} />
        <Kpi
          label="Último dia"
          value={a ? (a.sinais.length ? a.sinais.join(" · ") : "normal") : "—"}
          hint={
            a
              ? `${fmtDate(a.data)}: ${fmtBRL(a.gasto)} (normal ${fmtBRL(a.gastoBase)})`
              : "pouco histórico"
          }
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
        <Panel title="Por tipo de campanha">
          {r.porTipo.length ? (
            <Table head={["Tipo", "Investido", "ROAS", "% da verba"]}>
              {r.porTipo.map((t) => (
                <tr key={t.tipo}>
                  <Td>{t.tipo}</Td>
                  <Td mono>{fmtBRL(t.invest)}</Td>
                  <Td mono>{fmtX(t.roas)}</Td>
                  <Td mono>{fmtPct(t.sharePct, 0)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty />
          )}
        </Panel>
      </div>

      <Pills
        value={aba}
        onChange={setAba}
        options={[
          { id: "campanhas", label: "Campanhas" },
          { id: "produtos", label: "Produtos e estoque" },
          { id: "criativos", label: "Vídeos" },
        ]}
      />
      {aba === "campanhas" && <Campanhas c={d.campanhas} />}
      {aba === "produtos" && <Produtos p={d.produtos} />}
      {aba === "criativos" && <Criativos c={d.criativos} />}
    </div>
  );
}

function Campanhas({ c }: { c: D["campanhas"] }) {
  return (
    <Panel title="Campanhas" right={<CsvButton name="tiktok-ads-campanhas" rows={T(c)} />}>
      {c.length ? (
        <Table
          head={[
            "Campanha",
            "Tipo",
            "Investido",
            "Receita",
            "ROAS",
            "ROAS 7d / 7d antes",
            "Pedidos",
            "Custo/pedido",
            "Sugestão",
          ]}
        >
          {c.map((x) => {
            const caiu = x.roas7 != null && x.roasAnt7 != null && x.roas7 < x.roasAnt7 * 0.8;
            return (
              <tr key={x.id}>
                <Td>{x.campanha}</Td>
                <Td>{x.tipo || "—"}</Td>
                <Td mono>{fmtBRL(x.invest)}</Td>
                <Td mono>{fmtBRL(x.receita)}</Td>
                <Td mono>{fmtX(x.roas)}</Td>
                <Td mono className={caiu ? "text-destructive" : ""}>
                  {fmtX(x.roas7)} / {fmtX(x.roasAnt7)}
                </Td>
                <Td mono>{fmtNum(x.pedidos)}</Td>
                <Td mono>{fmtBRL(x.cpa)}</Td>
                <Td>{x.sugestao || "—"}</Td>
              </tr>
            );
          })}
        </Table>
      ) : (
        <Empty />
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        GMV Max vem da view própria; o investimento líquido (quando a fonte informa) aparece no CSV.
        Em vermelho: ROAS dos últimos 7 dias 20% abaixo dos 7 anteriores.
      </p>
    </Panel>
  );
}

function Produtos({ p }: { p: D["produtos"] }) {
  return (
    <Panel title="Produtos anunciados" right={<CsvButton name="tiktok-ads-produtos" rows={T(p)} />}>
      {p.length ? (
        <Table
          head={[
            "Produto",
            "SKU",
            "Investido",
            "% da verba",
            "ROAS",
            "Pedidos",
            "Estoque TikTok",
            "Cobertura",
          ]}
        >
          {p.map((x) => (
            <tr key={x.sku}>
              <Td>{x.produto}</Td>
              <Td mono>{x.sku}</Td>
              <Td mono>{fmtBRL(x.invest)}</Td>
              <Td mono>{fmtPct(x.shareInvestPct, 0)}</Td>
              <Td mono>{fmtX(x.roas)}</Td>
              <Td mono>{fmtNum(x.pedidos)}</Td>
              <Td mono>{fmtNum(x.estoque)}</Td>
              <Td
                mono
                className={x.coberturaDias != null && x.coberturaDias < 7 ? "text-destructive" : ""}
              >
                {x.coberturaDias == null ? "—" : `${fmtNum(x.coberturaDias)} dias`}
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty />
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Cobertura = estoque no TikTok ÷ pedidos por dia vindos de Ads. Como ignora a venda orgânica,
        é o teto: o estoque acaba antes disso.
      </p>
    </Panel>
  );
}

function Criativos({ c }: { c: D["criativos"] }) {
  return (
    <Panel
      title="Vídeos anunciados"
      right={
        <div className="flex items-center gap-2">
          <StatusTag tone="success">{c.escalar.length} escalar</StatusTag>
          <StatusTag tone="danger">{c.cortar.length} cortar</StatusTag>
          <CsvButton name="tiktok-ads-videos" rows={T(c.itens)} />
        </div>
      }
    >
      {c.itens.length ? (
        <Table
          head={[
            "Vídeo (item)",
            "Produto",
            "Campanha",
            "Investido",
            "ROAS",
            "Pedidos",
            "Custo/pedido",
            "Leitura",
          ]}
        >
          {c.itens.slice(0, 100).map((x) => (
            <tr key={x.item}>
              <Td mono>{x.item}</Td>
              <Td>{x.produto || "—"}</Td>
              <Td>{x.campanha || "—"}</Td>
              <Td mono>{fmtBRL(x.invest)}</Td>
              <Td mono>{fmtX(x.roas)}</Td>
              <Td mono>{fmtNum(x.pedidos)}</Td>
              <Td mono>{fmtBRL(x.cpa)}</Td>
              <Td>
                <StatusTag tone={TOM_LEITURA[x.leitura] ?? "muted"}>{x.leitura}</StatusTag>
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty />
      )}
      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
        <li>
          Escalar: ROAS 30% acima da média ({fmtX(c.roasMedio)}) com pelo menos 3 pedidos. Cortar:
          gastou 2 custos por pedido ({fmtBRL(c.cpaMedio)} cada) sem vender. Observar: ainda gastou
          pouco para julgar.
        </li>
        <li>Linhas agregadas pela fonte (sem vídeo identificado) ficam fora desta lista.</li>
      </ul>
    </Panel>
  );
}
