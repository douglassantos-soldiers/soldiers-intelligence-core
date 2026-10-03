import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";
import {
  PageHeader,
  Panel,
  Loading,
  ErrorBox,
  Table,
  Td,
  StatusTag,
  Empty,
  Kpi,
} from "@/components/kit";
import { getAffiliateHoje } from "@/lib/data.functions";
import { fmtBRL, fmtNum, fmtPct, fmtDate, fmtX } from "@/lib/format";

// Affiliate Copilot: "O que devo fazer hoje?" (AffiliateOS BR §17; Plano Mestre caps. 8 e 28).
// Só leitura: cada bloco é uma RECOMENDAÇÃO. Convites, comissão e mensagens entram depois,
// com aprovação e política (caps. 23–25). GMV aqui é venda atribuída pelo TikTok, não receita.
export const Route = createFileRoute("/afiliados/hoje")({
  head: () => ({
    meta: [
      { title: "Affiliate Copilot — Soldiers Platform" },
      {
        name: "description",
        content:
          "O que fazer hoje com os afiliados: vídeos para escalar, creators em alta, reativação e contratos sem venda.",
      },
    ],
  }),
  component: AffiliateHoje,
});

type D = Awaited<ReturnType<typeof getAffiliateHoje>>;

function AffiliateHoje() {
  const fn = useServerFn(getAffiliateHoje);
  const q = useQuery({ queryKey: ["affiliate-hoje"], queryFn: () => fn() });
  return (
    <>
      <PageHeader
        title="O que fazer hoje"
        subtitle={`Affiliate Copilot · TikTok Shop${q.data?.referencia ? ` · dados até ${fmtDate(q.data.referencia)}` : ""}`}
        right={
          <Link to="/affiliate" className="text-sm font-medium text-primary hover:underline">
            Ver Affiliate →
          </Link>
        }
      />
      {q.isLoading && <Loading />}
      {q.error && <ErrorBox error={q.error} />}
      {q.data && <Body d={q.data} />}
    </>
  );
}

const tiktok = (h: string) => (
  <a
    href={`https://www.tiktok.com/@${h}`}
    target="_blank"
    rel="noreferrer"
    className="font-medium hover:text-primary"
  >
    @{h}
  </a>
);

function Bloco({
  tag,
  tone,
  titulo,
  acao,
  children,
}: {
  tag: string;
  tone: "primary" | "success" | "warn" | "danger" | "muted";
  titulo: string;
  acao: string;
  children: ReactNode;
}) {
  return (
    <Panel title={titulo} right={<StatusTag tone={tone}>{tag}</StatusTag>}>
      <p className="mb-3 text-sm text-muted-foreground">{acao}</p>
      {children}
    </Panel>
  );
}

function Body({ d }: { d: D }) {
  const total = d.videosEscalar.length + d.emAlta.length + d.reativar.length + d.semVenda.length;
  const mix = d.mix30d;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-primary/40 bg-primary/5 p-5">
        <div className="font-display text-xl font-bold uppercase tracking-wide">
          Hoje existem {fmtNum(total)} ações sugeridas
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {fmtNum(d.videosEscalar.length)} vídeos para avaliar como anúncio ·{" "}
          {fmtNum(d.emAlta.length)} creators em alta · {fmtNum(d.reativar.length)} creators para
          reativar · {fmtNum(d.semVenda.length)} contratos sem venda em 30 dias. Nada é executado
          aqui: são recomendações para o time decidir.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="Vendas atribuídas TikTok (30d)"
          value={fmtBRL(mix.gmv)}
          hint={`${fmtNum(mix.pedidos)} pedidos · não somar com a receita`}
        />
        <Kpi
          label="Por vídeo"
          value={fmtPct(mix.gmv ? (mix.video / mix.gmv) * 100 : null, 0)}
          hint={fmtBRL(mix.video)}
        />
        <Kpi
          label="Por live"
          value={fmtPct(mix.gmv ? (mix.live / mix.gmv) * 100 : null, 0)}
          hint={fmtBRL(mix.live)}
        />
        <Kpi
          label="Por card de produto"
          value={fmtPct(mix.gmv ? (mix.card / mix.gmv) * 100 : null, 0)}
          hint={fmtBRL(mix.card)}
        />
      </div>

      <div className="grid gap-6 2xl:grid-cols-2">
        <Bloco
          tag="Escalar"
          tone="primary"
          titulo="Vídeos para avaliar como anúncio"
          acao="Vendem bem acima da média por mil views (14 dias). Candidatos a Spark Ads: pedir o código de autorização ao creator."
        >
          {d.videosEscalar.length ? (
            <Table
              head={[
                "Creator",
                "Vídeo / produto",
                "Views",
                "Vendas atrib.",
                "Por mil views",
                "vs. mediana",
              ]}
            >
              {d.videosEscalar.map((v) => (
                <tr key={v.video_id}>
                  <Td>{v.criador ? tiktok(v.criador) : "—"}</Td>
                  <Td className="max-w-[280px] truncate">
                    <span title={v.titulo}>{v.titulo || v.video_id}</span>
                    <div className="truncate text-xs text-muted-foreground">{v.produto}</div>
                  </Td>
                  <Td mono>{fmtNum(v.views)}</Td>
                  <Td mono>{fmtBRL(v.gmv)}</Td>
                  <Td mono>{fmtBRL(v.gpm)}</Td>
                  <Td mono className="text-success">
                    {fmtX(v.vsMediana)}
                  </Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>Nenhum vídeo acima do critério nos últimos 14 dias.</Empty>
          )}
        </Bloco>

        <Bloco
          tag="Em alta"
          tone="success"
          titulo="Creators crescendo"
          acao="Vendas atribuídas subiram 50% ou mais na semana (ou creator novo). Avaliar amostra extra, novo produto ou comissão maior, se o estoque permitir."
        >
          {d.emAlta.length ? (
            <Table head={["Creator", "Últimos 7d", "7d anteriores", "Variação", "Vídeos"]}>
              {d.emAlta.map((c) => (
                <tr key={c.criador}>
                  <Td>{tiktok(c.criador)}</Td>
                  <Td mono>{fmtBRL(c.atual)}</Td>
                  <Td mono>{fmtBRL(c.anterior)}</Td>
                  <Td mono className="text-success">
                    {c.variacao == null ? "novo" : `+${fmtPct(c.variacao, 0)}`}
                  </Td>
                  <Td mono>{fmtNum(c.videos)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>Nenhum creator com crescimento relevante na semana.</Empty>
          )}
        </Bloco>

        <Bloco
          tag="Reativar"
          tone="warn"
          titulo="Creators que pararam de vender"
          acao="Venderam entre 31 e 90 dias atrás e nada nos últimos 30. Sugestões: novo produto, nova amostra ou novo brief."
        >
          {d.reativar.length ? (
            <Table head={["Creator", "Vendas atrib. (31–90d)", "Vídeos no período"]}>
              {d.reativar.map((c) => (
                <tr key={c.criador}>
                  <Td>{tiktok(c.criador)}</Td>
                  <Td mono>{fmtBRL(c.anterior)}</Td>
                  <Td mono>{fmtNum(c.videos)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>Nenhum creator relevante parado.</Empty>
          )}
        </Bloco>

        <Bloco
          tag="Cobrar"
          tone="danger"
          titulo="Contratos ativos sem venda em 30 dias"
          acao="Influenciadores com contrato ativo e @ do TikTok cadastrado, sem vídeo com venda da Soldiers no período. Verificar entregas e cupom."
        >
          {d.influenciadoresErro ? (
            <Empty>Não foi possível ler os contratos: {d.influenciadoresErro}</Empty>
          ) : d.semVenda.length ? (
            <Table head={["Influenciador", "TikTok", "Tier", "Custo cadastrado", "Desde"]}>
              {d.semVenda.map((i) => (
                <tr key={i.tiktok}>
                  <Td>{i.nome}</Td>
                  <Td>{tiktok(i.tiktok)}</Td>
                  <Td>{i.tier}</Td>
                  <Td mono>{i.custo ? fmtBRL(i.custo) : "—"}</Td>
                  <Td mono>{i.desde ? fmtDate(i.desde) : "—"}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>Todos os contratos ativos tiveram venda no período.</Empty>
          )}
        </Bloco>
      </div>

      <Panel title="Amostras e convites">
        <p className="text-sm text-muted-foreground">
          Amostras pendentes, atrasadas (7 e 14 dias), convites e colaborações entram quando o
          conector da Affiliate API do TikTok Shop estiver ativo (Fase 2 do AffiliateOS). Até lá,
          esta tela usa só vendas atribuídas por vídeo e os contratos cadastrados em
          dim_influenciador.
        </p>
      </Panel>
    </div>
  );
}
