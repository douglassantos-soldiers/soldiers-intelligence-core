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
import { PadroesVencedores } from "@/components/padroes-conteudo";
import { CopiarTexto } from "@/components/copiar";
import { getAffiliateOS } from "@/lib/affiliateos.functions";
import {
  ESTAGIO_LABEL,
  STATUS_AMOSTRA,
  STATUS_AMOSTRA_LABEL,
  STATUS_ENCERRADOS,
} from "@/lib/affiliateos";
import { PLAYBOOKS, PLAYBOOK_TITULO, LIMIARES_PLAYBOOK } from "@/lib/playbooks";
import { EVENTOS_RESPOSTA } from "@/lib/workflows";
import {
  STATUS_DIREITO,
  STATUS_DIREITO_LABEL,
  PLATAFORMA_DIREITO_LABEL,
  DIREITO_VENCENDO_DIAS,
  SPARK_MIN_VIEWS,
  rotuloFaixa,
} from "@/lib/programa";
import { fmtBRL, fmtNum, fmtPct, fmtX, fmtDate } from "@/lib/format";

// Affiliate OS (Plano Mestre cap. 8): Discovery → Qualification → Outreach → Sample → Content → Sales → Contribution.
// Só leitura e recomendação; convidar, enviar amostra ou mudar comissão continua fora da plataforma até a Fase 3.
export const Route = createFileRoute("/affiliate_/os")({
  head: () => ({
    meta: [
      { title: "Affiliate OS — Soldiers Platform" },
      {
        name: "description",
        content:
          "Notas dos creators, funil, amostras com ROI, outreach, elasticidade da comissão, risco e qualidade do cliente.",
      },
    ],
  }),
  component: AffiliateOS,
});

type D = Awaited<ReturnType<typeof getAffiliateOS>>;
type Aba =
  | "acoes"
  | "creators"
  | "funil"
  | "amostras"
  | "outreach"
  | "conteudo"
  | "comissao"
  | "direitos"
  | "workflows"
  | "placar"
  | "risco"
  | "qualidade";
const T = (r: unknown) => r as Record<string, unknown>[];
const FOCOS = ["Creatina", "Whey", "Pré-treino", "Glutamina"] as const;
const TOM_CONC: Record<string, "success" | "warn" | "danger" | "primary" | "muted"> = {
  Soldiers: "success",
  híbrido: "primary",
  migrável: "warn",
  "exclusivo concorrente": "danger",
  "—": "muted",
};
const nota = (v: number) => (
  <span
    className={`inline-block w-9 rounded text-center font-mono text-xs font-semibold ${v >= 70 ? "bg-success/20 text-success" : v >= 40 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
  >
    {v}
  </span>
);

function AffiliateOS() {
  const [foco, setFoco] = useState<string>("Creatina");
  const fn = useServerFn(getAffiliateOS);
  const q = useQuery({ queryKey: ["affiliate-os", foco], queryFn: () => fn({ data: { foco } }) });
  return (
    <>
      <PageHeader
        title="Affiliate OS"
        subtitle="Quem vale convidar agora, como estão as amostras, se comissão maior traz venda e que cliente cada creator traz."
        right={
          <div className="flex items-center gap-4">
            <Link
              to="/affiliate/creators"
              className="text-sm font-medium text-primary hover:underline"
            >
              ← Creators 360
            </Link>
            <Pills
              value={foco}
              onChange={setFoco}
              options={FOCOS.map((f) => ({ id: f, label: f }))}
            />
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
  const [aba, setAba] = useState<Aba>("acoes");
  const alertasAm = d.amostras.filter((a) => a.alertas.length).length;
  const invest = d.amostras.reduce((s, a) => s + a.investimento, 0);
  const contrib = d.amostras.reduce((s, a) => s + a.contribuicao, 0);
  return (
    <div className="space-y-6">
      <ErrosLeitura erros={d.erros} />
      {d.migracaoPendente && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
          Cadastro de creators, amostras e outreach precisam da migração{" "}
          <span className="font-mono">20261005140000_affiliate_os.sql</span>. Sem ela, a tela usa só
          os vídeos do TikTok e os cupons do site.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        <Kpi
          label="Creators"
          value={fmtNum(d.totalCreators)}
          hint={`dados até ${fmtDate(d.ref)}`}
        />
        <Kpi
          label="Nota ≥ 70"
          value={fmtNum(d.creators.filter((c) => c.creatorScore >= 70).length)}
          hint="Creator Score"
          tone="up"
        />
        <Kpi
          label={`Fit com ${d.foco}`}
          value={fmtNum(d.creators.filter((c) => c.productFit >= 50).length)}
          hint="Product Fit ≥ 50"
        />
        <Kpi
          label="Amostras em andamento"
          value={fmtNum(d.amostras.filter((a) => !a.encerrada).length)}
          hint={`${fmtNum(alertasAm)} com alerta · ${fmtNum(d.amostras.filter((a) => a.encerrada).length)} encerrada(s)`}
          {...(alertasAm ? { tone: "warn" as const } : {})}
        />
        <Kpi
          label="ROI das amostras"
          value={fmtX(invest ? contrib / invest : null)}
          hint={`${fmtBRL(invest)} investidos`}
        />
        <Kpi
          label="Sinais de risco"
          value={fmtNum(d.sinais.length)}
          {...(d.sinais.length ? { tone: "warn" as const } : {})}
        />
      </div>
      <Pills
        value={aba}
        onChange={setAba}
        options={[
          { id: "acoes", label: `Ações do dia (${d.recomendacoes.length})` },
          { id: "creators", label: "Creators e notas" },
          { id: "funil", label: "Funil" },
          { id: "amostras", label: "Amostras" },
          { id: "outreach", label: "Outreach" },
          { id: "conteudo", label: "Conteúdo (DNA)" },
          { id: "comissao", label: "Comissão" },
          { id: "direitos", label: "Direitos de uso" },
          { id: "workflows", label: "Workflows" },
          { id: "placar", label: "Placar do creator" },
          { id: "risco", label: "Risco e concorrentes" },
          { id: "qualidade", label: "Qualidade do cliente" },
        ]}
      />
      {aba === "acoes" && <Acoes d={d} />}
      {aba === "creators" && <Creators d={d} />}
      {aba === "funil" && <Funil f={d.funil} d={d} />}
      {aba === "amostras" && (
        <Amostras a={d.amostras} margem={d.margemAfiliadoPct} funil={d.funilAmostras} />
      )}
      {aba === "outreach" && (
        <div className="space-y-6">
          <Outreach o={d.outreach} />
          <Parecidos d={d} />
        </div>
      )}
      {aba === "conteudo" && <Conteudo d={d} />}
      {aba === "comissao" && <Comissao d={d} />}
      {aba === "direitos" && <Direitos d={d} />}
      {aba === "workflows" && <Workflows d={d} />}
      {aba === "placar" && <PlacarCreator d={d} />}
      {aba === "risco" && <Risco d={d} />}
      {aba === "qualidade" && <Qualidade q={d.qualidade} />}
    </div>
  );
}

function Creators({ d }: { d: D }) {
  const [tipo, setTipo] = useState<"creator" | "loja" | "todos">("creator");
  const lista = d.creators.filter((c) => tipo === "todos" || c.tipoConta === tipo);
  return (
    <Panel
      title={`Creators por oportunidade (${d.foco})`}
      right={
        <div className="flex flex-wrap items-center gap-2">
          <Pills
            value={tipo}
            onChange={setTipo}
            options={[
              { id: "creator", label: "Creators" },
              { id: "loja", label: `Contas de loja (${d.contasLoja})` },
              { id: "todos", label: "Todos" },
            ]}
          />
          <CsvButton name="affiliate-os-creators" rows={T(lista)} />
        </div>
      }
    >
      {lista.length ? (
        <Table
          head={[
            "Creator",
            "Estágio",
            "Creator Score",
            "Product Fit",
            "Opportunity",
            "GMV 90d",
            "28d vs. 28d antes",
            "Vídeos",
            "Última venda",
            "Categoria principal",
          ]}
        >
          {lista.slice(0, 100).map((c) => (
            <tr key={c.chave}>
              <Td>
                <span className="font-medium">{c.nome}</span>
                {c.nome !== c.handle && (
                  <span className="ml-1 text-xs text-muted-foreground">{c.handle}</span>
                )}
                {!c.cadastrado && (
                  <span className="ml-1 text-[11px] text-muted-foreground">· fora do cadastro</span>
                )}
                {c.risco && (
                  <span className="ml-1">
                    <StatusTag tone="warn">revisar risco</StatusTag>
                  </span>
                )}
                {c.tipoConta !== "creator" && (
                  <span className="ml-1" title={c.tipoMotivo}>
                    <StatusTag tone="muted">
                      {c.tipoConta === "loja"
                        ? c.tipoFonte === "regra"
                          ? "provável conta de loja"
                          : "conta de loja"
                        : "agência"}
                    </StatusTag>
                  </span>
                )}
              </Td>
              <Td>
                <StatusTag tone={c.estagioFonte === "cadastro" ? "primary" : "muted"}>
                  {ESTAGIO_LABEL[c.estagio] ?? c.estagio}
                </StatusTag>
              </Td>
              <Td>{nota(c.creatorScore)}</Td>
              <Td>{nota(c.productFit)}</Td>
              <Td>{nota(c.opportunity)}</Td>
              <Td mono>{fmtBRL(c.gmv)}</Td>
              <Td
                mono
                className={(c.crescimentoPct ?? 0) < 0 ? "text-destructive" : "text-success"}
              >
                {c.crescimentoPct == null
                  ? "—"
                  : `${c.crescimentoPct > 0 ? "+" : ""}${fmtPct(c.crescimentoPct, 0)}`}
              </Td>
              <Td mono>{fmtNum(c.videos)}</Td>
              <Td mono>{c.ultimaVenda ? fmtDate(c.ultimaVenda) : "—"}</Td>
              <Td className="text-xs">{c.categoriaPrincipal || "—"}</Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty />
      )}
      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
        <li>
          Creator Score: 40% GMV, 20% constância (dias com venda), 20% recência, 20% GMV por mil
          views. Mede a qualidade histórica.
        </li>
        <li>
          Product Fit: quanto do GMV do creator vem da categoria escolhida no topo. Opportunity:
          Score × Fit × crescimento × disponibilidade ÷ quantos creators já vendem a categoria.
        </li>
        <li>
          Conta de loja (vende R$ 2 mil+ com menos de 1 mil seguidores, ou sem seguidores no
          cadastro e menos de 2 mil views em 90 dias) fica fora do ranking: Opportunity zero. O tipo
          informado no cadastro (tipo_conta) vence a regra. Creator com sinal de risco tem a
          Opportunity cortada pela metade até a revisão. Estágio cinza = deduzido pelas vendas; azul
          = do cadastro do Affiliate OS. Fonte: vídeos do TikTok Shop dos últimos 90 dias.
        </li>
      </ul>
    </Panel>
  );
}

function Funil({ f, d }: { f: D["funil"]; d: D }) {
  const max = Math.max(1, ...f.map((x) => x.chegaram));
  return (
    <div className="space-y-6">
      <Panel title="Funil do creator">
        <Table head={["Etapa", "Chegaram", "", "Passagem", "Parados aqui"]}>
          {f.map((x) => (
            <tr key={x.estagio}>
              <Td>{x.label}</Td>
              <Td mono>{fmtNum(x.chegaram)}</Td>
              <Td>
                <div className="h-2 w-40 rounded bg-muted">
                  <div
                    className="h-2 rounded bg-primary"
                    style={{ width: `${(x.chegaram / max) * 100}%` }}
                  />
                </div>
              </Td>
              <Td mono>{fmtPct(x.passagemPct, 0)}</Td>
              <Td mono>{fmtNum(x.agora)}</Td>
            </tr>
          ))}
        </Table>
        <p className="mt-3 text-xs text-muted-foreground">
          Sem cadastro, só as etapas a partir de "Conteúdo" aparecem (vêm das vendas). Encontrado,
          qualificado, convidado e amostra dependem do cadastro do Affiliate OS.
        </p>
      </Panel>
      <Coortes d={d} />
    </div>
  );
}

function Coortes({ d }: { d: D }) {
  const c = d.coortes;
  const n = c[0]?.meses.length ?? 0;
  const tom = (v: number | null) =>
    v == null
      ? ""
      : v >= 50
        ? "bg-success/25"
        : v >= 25
          ? "bg-primary/20"
          : v > 0
            ? "bg-warning/15"
            : "";
  return (
    <Panel title="Retenção por coorte (creators que voltam a postar)">
      {c.length ? (
        <Table
          head={[
            "Coorte (1º vídeo)",
            "Creators",
            ...Array.from({ length: n }, (_, k) => `Mês ${k}`),
          ]}
        >
          {c.map((x) => (
            <tr key={x.coorte}>
              <Td mono>
                {x.coorte.slice(5, 7)}/{x.coorte.slice(2, 4)}
              </Td>
              <Td mono>{fmtNum(x.creators)}</Td>
              {x.meses.map((v, k) => (
                <Td key={k} mono className={tom(v)}>
                  {v == null ? "" : fmtPct(v, 0)}
                </Td>
              ))}
            </tr>
          ))}
        </Table>
      ) : (
        <Empty>Sem vídeos de creators nos últimos 6 meses.</Empty>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Coorte = mês do primeiro vídeo do creator no TikTok Shop. Mês N = % da coorte que publicou
        vídeo novo naquele mês. Mês 0 é sempre 100%. Fonte: 12 meses de vídeos.
        {d.coorteIncompleta &&
          " A leitura atingiu o limite de linhas: os meses mais antigos podem estar incompletos."}
      </p>
    </Panel>
  );
}

function Amostras({
  a,
  margem,
  funil,
}: {
  a: D["amostras"];
  margem: number;
  funil: D["funilAmostras"];
}) {
  if (!a.length) return <Empty>Nenhuma amostra cadastrada em affiliate_amostra.</Empty>;
  const ativas = a.filter((x) => !x.encerrada);
  const colunas = STATUS_AMOSTRA.map((s) => ({ s, itens: ativas.filter((x) => x.status === s) }));
  const atrasadas = ativas.filter((x) => x.atrasada).length;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 text-xs">
        <StatusTag tone={atrasadas ? "warn" : "muted"}>Atrasadas: {atrasadas}</StatusTag>
        {STATUS_ENCERRADOS.map((s) => (
          <StatusTag key={s} tone="muted">
            {STATUS_AMOSTRA_LABEL[s]}: {a.filter((x) => x.status === s).length}
          </StatusTag>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-4 2xl:grid-cols-8">
        {colunas.map(({ s, itens }) => (
          <div key={s} className="rounded-lg border border-border bg-card p-3">
            <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {STATUS_AMOSTRA_LABEL[s]} <span>{itens.length}</span>
            </div>
            <div className="space-y-2">
              {itens.map((x) => (
                <div
                  key={x.id}
                  className={`rounded border p-2 text-xs ${x.alertas.length ? "border-warning/60 bg-warning/10" : "border-border"}`}
                >
                  <div className="font-medium">{x.creator}</div>
                  <div className="text-muted-foreground">{x.produto}</div>
                  <div className="text-muted-foreground">
                    {x.diasNaEtapa == null ? "" : `${x.diasNaEtapa} dias aqui`}
                  </div>
                  {x.alertas.map((t) => (
                    <div key={t} className="mt-1 text-warning">
                      {t}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Panel title="Funil de amostras por semana de entrega">
        {funil.length ? (
          <Table
            head={[
              "Semana",
              "Entregues",
              "Publicadas",
              "Cumprimento",
              "Dias até postar (mediana)",
              "",
            ]}
          >
            {funil.map((w) => (
              <tr key={w.semana}>
                <Td mono>{fmtDate(w.semana)}</Td>
                <Td mono>{fmtNum(w.entregues)}</Td>
                <Td mono>{fmtNum(w.publicadas)}</Td>
                <Td mono>{fmtPct(w.cumprimentoPct, 0)}</Td>
                <Td mono>{w.diasAtePostar == null ? "—" : fmtNum(w.diasAtePostar)}</Td>
                <Td className="text-xs text-muted-foreground">
                  {w.emAberto ? "ainda em prazo" : ""}
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Nenhuma amostra recebida nas últimas 8 semanas.</Empty>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Semana em que o creator recebeu a amostra. Cumprimento = quantas dessas já viraram post.
          Semanas recentes ainda podem subir.
        </p>
      </Panel>
      <Panel title="ROI por amostra" right={<CsvButton name="affiliate-amostras" rows={T(a)} />}>
        <Table
          head={[
            "Creator",
            "Produto",
            "Etapa",
            "Investimento",
            "GMV depois do envio",
            "Contribuição",
            "ROI",
          ]}
        >
          {a.map((x) => (
            <tr key={x.id} className={x.encerrada ? "opacity-60" : ""}>
              <Td>{x.creator}</Td>
              <Td>{x.produto}</Td>
              <Td>{STATUS_AMOSTRA_LABEL[x.status] ?? x.status}</Td>
              <Td mono>{fmtBRL(x.investimento)}</Td>
              <Td mono>{fmtBRL(x.gmvDepois)}</Td>
              <Td mono>{fmtBRL(x.contribuicao)}</Td>
              <Td mono className={x.roi != null && x.roi < 1 ? "text-destructive" : "text-success"}>
                {fmtX(x.roi)}
              </Td>
            </tr>
          ))}
        </Table>
        <p className="mt-3 text-xs text-muted-foreground">
          Investimento = produto + frete + desconto + outros. Contribuição = GMV do creator no
          TikTok depois do envio × {fmtPct(margem, 0)} (margem da venda via afiliado, já sem
          comissão). Atrasada: 3+ dias para revisar, 5+ dias sem envio depois de aprovada, 14 dias
          sem confirmar recebimento ou 7 dias sem publicar. Também alerta publicou sem venda em 14
          dias e ROI abaixo de 1× após 30 dias. Rejeitada, expirada, ignorada e cancelada saem do
          kanban.
        </p>
      </Panel>
    </div>
  );
}

function Outreach({ o }: { o: D["outreach"] }) {
  if (!o.length) return <Empty>Nenhuma campanha em affiliate_outreach_campanha.</Empty>;
  return (
    <div className="space-y-4">
      {o.map((c) => (
        <Panel
          key={c.id}
          title={c.nome}
          right={
            <div className="flex items-center gap-2 text-xs">
              <StatusTag tone="muted">{c.produto}</StatusTag>
              {c.comissaoPct != null && (
                <StatusTag tone="primary">{fmtPct(c.comissaoPct, 0)} comissão</StatusTag>
              )}
              <StatusTag tone="muted">{c.status}</StatusTag>
            </div>
          }
        >
          <p className="mb-3 text-sm text-muted-foreground">
            Convites:{" "}
            {Object.entries(c.convites)
              .map(([k, v]) => `${k} ${v}`)
              .join(" · ") || "nenhum"}
          </p>
          {c.sugeridos.length ? (
            <Table
              head={[
                "Sugestão de convite",
                "Creator Score",
                "Product Fit",
                "Opportunity",
                "GMV 90d",
              ]}
            >
              {c.sugeridos.map((s) => (
                <tr key={s.handle}>
                  <Td>{s.nome}</Td>
                  <Td>{nota(s.creatorScore)}</Td>
                  <Td>{nota(s.productFit)}</Td>
                  <Td>{nota(s.opportunity)}</Td>
                  <Td mono>{fmtBRL(s.gmv)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>Nenhum creator atende aos critérios da campanha.</Empty>
          )}
        </Panel>
      ))}
      <p className="text-xs text-muted-foreground">
        Sugestões respeitam a nota mínima, o fit mínimo e o GMV mínimo da campanha, e deixam de fora
        quem já foi convidado.
      </p>
    </div>
  );
}

function Conteudo({ d }: { d: D }) {
  const c = d.conteudo;
  const foco = c.padroes.filter((p) => p.produto === d.foco);
  const outros = c.padroes.filter((p) => p.produto !== d.foco);
  return (
    <div className="space-y-6">
      <PadroesVencedores
        padroes={[...foco, ...outros]}
        titulo={`Padrões vencedores (cap. 8.12): brief para ${d.foco} e demais produtos`}
        medida="gmvMil"
        csv="affiliate-os-padroes"
        vazio="Ainda não há produto com vídeos suficientes e DNA identificado (mínimo de 4 vídeos)."
      />
      <BriefProduto d={d} />
      <Panel
        title={`O que vende para cada creator em ${d.foco}`}
        right={<CsvButton name="affiliate-os-dna-creators" rows={T(c.creators)} />}
      >
        {c.creators.length ? (
          <Table
            head={[
              "Creator",
              "Vídeos",
              "GMV",
              "GMV / mil views",
              "Gancho",
              "Ângulo",
              "Formato",
              "CTA",
            ]}
          >
            {c.creators.slice(0, 40).map((x) => (
              <tr key={x.creator}>
                <Td className="font-medium">@{x.creator}</Td>
                <Td mono>{fmtNum(x.videos)}</Td>
                <Td mono>{fmtBRL(x.gmv)}</Td>
                <Td mono>{fmtBRL(x.gmvMilViews)}</Td>
                <Td>{x.ganchoQueVende || "—"}</Td>
                <Td>{x.anguloQueVende || "—"}</Td>
                <Td>{x.formatoQueVende || "—"}</Td>
                <Td>{x.ctaQueVende || "—"}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Nenhum vídeo de {d.foco} nos últimos 90 dias.</Empty>
        )}
      </Panel>
      <Panel title={`Vídeos de ${d.foco} e DNA lido (${fmtNum(c.videosFoco)})`}>
        {c.videos.length ? (
          <Table head={["Vídeo", "Creator", "Gancho", "Ângulo", "Formato", "CTA", "Views", "GMV"]}>
            {c.videos.slice(0, 40).map((v) => (
              <tr key={v.id}>
                <Td className="max-w-[320px] truncate">{v.titulo || v.id}</Td>
                <Td>{v.creator ? `@${v.creator}` : "—"}</Td>
                <Td>{v.dna.gancho}</Td>
                <Td>{v.dna.angulo}</Td>
                <Td>{v.dna.formato}</Td>
                <Td>{v.dna.cta}</Td>
                <Td mono>{fmtNum(v.views)}</Td>
                <Td mono>{fmtBRL(v.gmv)}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Sem vídeos no período.</Empty>
        )}
      </Panel>
      <p className="text-xs text-muted-foreground">
        Content DNA (cap. 8.11) dos vídeos de creators no TikTok, últimos 90 dias, lido do título do
        vídeo. {c.semProduto ? `${fmtNum(c.semProduto)} vídeo(s) sem produto reconhecido. ` : ""}
        Transcrição, problema e prova pedem a leitura do áudio pela IA, que entra com login e
        aprovação. A visão completa (Meta e TikTok) está na Central de criativos.
      </p>
    </div>
  );
}

function Comissao({ d }: { d: D }) {
  const e = d.elasticidade;
  return (
    <div className="space-y-6">
      <Faixas d={d} />
      <div className="grid gap-6 2xl:grid-cols-2">
        {e.map((x) => (
          <Panel
            key={x.canal}
            title={`${x.canal}: comissão × venda`}
            right={
              x.compensa == null ? null : (
                <StatusTag tone={x.compensa ? "success" : "warn"}>
                  {x.compensa ? "comissão maior compensa" : "não compensa"}
                </StatusTag>
              )
            }
          >
            {x.faixas.length ? (
              <Table head={["Comissão efetiva", "Dias", "GMV / dia", "Custo", "GMV líquido / dia"]}>
                {x.faixas.map((f) => (
                  <tr key={f.faixa}>
                    <Td mono>{f.faixa}</Td>
                    <Td mono>{fmtNum(f.dias)}</Td>
                    <Td mono>{fmtBRL(f.gmvDia)}</Td>
                    <Td mono>{fmtPct(f.custoPct, 1)}</Td>
                    <Td mono>{fmtBRL(f.liquidoDia)}</Td>
                  </tr>
                ))}
              </Table>
            ) : (
              <Empty />
            )}
            <p className="mt-3 text-sm">{x.leitura}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Dias agrupados pela comissão efetiva (ML: por campanha; TikTok: por produto), 180
              dias. É correlação: outros fatores mudam junto. Para saber de verdade, rodar um
              experimento com grupo de controle.
            </p>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function Risco({ d }: { d: D }) {
  const conc = d.creators.filter((c) => c.concorrencia !== "—");
  return (
    <div className="grid gap-6 2xl:grid-cols-2">
      <Panel
        title="Sinais para revisar"
        right={<CsvButton name="affiliate-sinais" rows={T(d.sinais)} />}
      >
        {d.sinais.length ? (
          <Table head={["Quem", "Sinal", "Detalhe"]}>
            {d.sinais.map((s, i) => (
              <tr key={`${s.quem}-${s.sinal}-${i}`}>
                <Td mono>{s.quem}</Td>
                <Td>
                  <StatusTag tone="warn">{s.sinal}</StatusTag>
                </Td>
                <Td className="text-xs">{s.detalhe}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Nenhum sinal.</Empty>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Sinais, não acusação: cupom com devolução acima do dobro da média ou desconto acima de
          30%; creator com GMV por mil views 5× acima da mediana ou com 70% do GMV num único dia.
        </p>
      </Panel>
      <Panel title="Creators e concorrentes">
        {conc.length ? (
          <Table head={["Creator", "Classificação", "GMV Soldiers 90d"]}>
            {conc.map((c) => (
              <tr key={c.chave}>
                <Td>{c.nome}</Td>
                <Td>
                  <StatusTag tone={TOM_CONC[c.concorrencia] ?? "muted"}>{c.concorrencia}</StatusTag>
                </Td>
                <Td mono>{fmtBRL(c.gmv)}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Sem concorrentes cadastrados. Preencha affiliate_creator.concorrentes.</Empty>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Híbrido = vende Soldiers e concorrente. Exclusivo concorrente = só concorrente. Migrável =
          exclusivo concorrente com nicho de suplementos ou fitness. Não há fonte pública de vendas
          de concorrentes no banco: a lista vem do cadastro.
        </p>
      </Panel>
    </div>
  );
}

function Qualidade({ q }: { q: D["qualidade"] }) {
  return (
    <Panel
      title="Que cliente cada cupom traz"
      right={<CsvButton name="affiliate-qualidade-cliente" rows={T(q)} />}
    >
      {q.length ? (
        <Table
          head={[
            "Cupom",
            "Creator",
            "Clientes",
            "Novos",
            "Recompraram",
            "LTV médio",
            "Pedidos por cliente",
          ]}
        >
          {q.slice(0, 100).map((x) => (
            <tr key={x.cupom}>
              <Td mono>{x.cupom}</Td>
              <Td>{x.creator || "—"}</Td>
              <Td mono>{fmtNum(x.clientes)}</Td>
              <Td mono>{fmtPct(x.novosPct, 0)}</Td>
              <Td mono>{fmtPct(x.recompraPct, 0)}</Td>
              <Td mono>{fmtBRL(x.ltvMedio)}</Td>
              <Td mono>
                {x.pedidosMedio == null ? "—" : x.pedidosMedio.toFixed(1).replace(".", ",")}
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty>Precisa da migração e de affiliate_atualiza_qualidade_cupom().</Empty>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Cliente que usou o cupom no site: se a primeira compra dele foi com o cupom (novo), se
        voltou a comprar depois e o LTV. Responde ao cap. 8.14: GMV maior não é necessariamente
        cliente melhor.
      </p>
    </Panel>
  );
}

// ---------------------------------------------------------------------------------------------
// Onda 2 do benchmark Cruva: ações do dia, faixas de comissão, direitos de uso e brief por produto

const PRIORIDADE: Record<number, { rotulo: string; tom: "danger" | "warn" | "primary" }> = {
  1: { rotulo: "Alta", tom: "danger" },
  2: { rotulo: "Média", tom: "warn" },
  3: { rotulo: "Baixa", tom: "primary" },
};

function Acoes({ d }: { d: D }) {
  const [filtro, setFiltro] = useState<string>("todas");
  const lista =
    filtro === "todas" ? d.recomendacoes : d.recomendacoes.filter((r) => r.playbook === filtro);
  return (
    <div className="space-y-6">
      <Panel
        title="Ações sugeridas para hoje"
        right={<CsvButton name="affiliate-acoes-do-dia" rows={T(lista)} />}
      >
        <div className="mb-4">
          <Pills
            value={filtro}
            onChange={setFiltro}
            options={[
              { id: "todas", label: `Todas (${d.recomendacoes.length})` },
              ...d.playbooks
                .filter((p) => p.total)
                .map((p) => ({ id: p.id, label: `${p.titulo} (${p.total})` })),
            ]}
          />
        </div>
        {lista.length ? (
          <Table head={["Prioridade", "Ação", "Creator", "Por quê", "Sugestão e mensagem"]}>
            {lista.slice(0, 80).map((r, i) => (
              <tr key={`${r.playbook}-${r.handle || r.creator}-${i}`}>
                <Td>
                  <StatusTag tone={PRIORIDADE[r.prioridade]!.tom}>
                    {PRIORIDADE[r.prioridade]!.rotulo}
                  </StatusTag>
                </Td>
                <Td className="whitespace-nowrap font-medium">{PLAYBOOK_TITULO[r.playbook]}</Td>
                <Td>
                  <div>{r.creator}</div>
                  {r.handle && r.handle !== r.creator && (
                    <div className="text-xs text-muted-foreground">{r.handle}</div>
                  )}
                </Td>
                <Td className="min-w-[220px] !whitespace-normal text-xs">{r.motivo}</Td>
                <Td className="min-w-[220px] !whitespace-normal text-xs">
                  <div className="mb-1.5">{r.acao}</div>
                  <CopiarTexto texto={r.mensagem} rotulo="Copiar mensagem" />
                </Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Nenhuma ação sugerida hoje.</Empty>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Só sugestão: a mensagem é copiada para uma pessoa revisar e enviar. Enviar, pausar
          amostras ou mudar a faixa continua fora da plataforma até a Fase 3 (login, aprovação e
          auditoria). Contas de loja não entram.
        </p>
      </Panel>
      <Panel title="Quando cada ação aparece">
        <Table head={["Ação", "Gatilho", "O que fazer"]}>
          {PLAYBOOKS.map((p) => (
            <tr key={p.id}>
              <Td className="whitespace-nowrap font-medium">{p.titulo}</Td>
              <Td className="min-w-[220px] !whitespace-normal text-xs">{p.gatilho}</Td>
              <Td className="min-w-[220px] !whitespace-normal text-xs">{p.acao}</Td>
            </tr>
          ))}
        </Table>
        <p className="mt-3 text-xs text-muted-foreground">
          Limiares iniciais, a validar: primeira venda em {LIMIARES_PLAYBOOK.primeiraVendaDias}{" "}
          dias, R$ {LIMIARES_PLAYBOOK.categoriaMin} por categoria,{" "}
          {LIMIARES_PLAYBOOK.videosComVendaVip} vídeos com venda para VIP e{" "}
          {LIMIARES_PLAYBOOK.pausarDias} dias sem post para pausar. VIP = estágio embaixador no
          cadastro.
        </p>
      </Panel>
    </div>
  );
}

function AvisoOnda2({ d }: { d: D }) {
  if (!d.onda2Pendente) return null;
  return (
    <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
      Faixas cadastradas e direitos de uso precisam da migração{" "}
      <span className="font-mono">20261006150000_affiliate_onda2.sql</span>. Sem ela, a tela usa a
      regra de faixas padrão do código e não lista direitos.
    </div>
  );
}

function Faixas({ d }: { d: D }) {
  const f = d.faixas;
  const r = f.regra;
  return (
    <>
      <AvisoOnda2 d={d} />
      <Panel
        title={`Faixas de comissão: ${r.nome}${r.versao ? ` (v${r.versao})` : ""}`}
        right={
          <div className="flex items-center gap-2">
            <StatusTag tone={r.fonte === "padrao" ? "warn" : "success"}>
              {r.fonte === "padrao"
                ? "regra padrão (hipótese)"
                : `vigente desde ${fmtDate(r.vigenteDesde)}`}
            </StatusTag>
            <CsvButton name="affiliate-faixas" rows={T(f.creators)} />
          </div>
        }
      >
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          {f.porFaixa.map((x) => (
            <Kpi
              key={x.faixa}
              label={x.faixa}
              value={fmtNum(x.creators)}
              hint={`${fmtBRL(x.gmv)} de GMV · ${fmtBRL(x.custoExtra)} de custo extra`}
            />
          ))}
          <Kpi
            label="Custo extra total"
            value={fmtBRL(f.custoExtraTotal)}
            hint={`janela de ${r.janelaDias} dias`}
          />
        </div>
        {f.creators.length ? (
          <Table
            head={[
              "Creator",
              `GMV ${r.janelaDias}d`,
              "Contribuição",
              "Faixa sugerida",
              "Custo extra",
              "Contribuição depois",
              "Leitura",
            ]}
          >
            {f.creators.slice(0, 60).map((c) => (
              <tr key={c.handle}>
                <Td>
                  <div>{c.nome}</div>
                  {c.nome !== c.handle && (
                    <div className="text-xs text-muted-foreground">{c.handle}</div>
                  )}
                </Td>
                <Td mono>{fmtBRL(c.gmvJanela)}</Td>
                <Td mono>{fmtBRL(c.contribuicao)}</Td>
                <Td>
                  <span className="font-mono">{c.faixaSugerida.comissaoPct}%</span>
                  {c.deltaPp > 0 && (
                    <span className="ml-1 text-xs text-muted-foreground">(+{c.deltaPp} p.p.)</span>
                  )}
                  {c.cruzou && (
                    <span className="ml-2">
                      <StatusTag tone="success">passou de faixa</StatusTag>
                    </span>
                  )}
                </Td>
                <Td mono>{fmtBRL(c.custoExtra)}</Td>
                <Td mono>{fmtBRL(c.contribuicaoDepois)}</Td>
                <Td className="min-w-[220px] !whitespace-normal text-xs">{c.leitura}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Nenhum creator com venda na janela.</Empty>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Faixas: {r.faixas.map((x) => rotuloFaixa(x, r.base)).join(" · ")}. Contribuição = GMV do
          creator no TikTok Shop × margem via afiliado ({fmtPct(d.margemAfiliadoPct, 1)}, já com a
          comissão base). Custo extra = GMV × p.p. acima da base. A tela nunca sugere faixa que
          deixe a contribuição negativa. Regra versionada em affiliate_regra_comissao (só inserção).
        </p>
      </Panel>
    </>
  );
}

function Direitos({ d }: { d: D }) {
  const x = d.direitos;
  return (
    <div className="space-y-6">
      <AvisoOnda2 d={d} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="Ativos"
          value={fmtNum(x.contagem.ativo)}
          hint={`${fmtBRL(x.valorAtivo)} pagos`}
        />
        <Kpi
          label={`Vencendo em ${DIREITO_VENCENDO_DIAS} dias`}
          value={fmtNum(x.vencendo.length)}
          hint={
            x.vencidos
              ? `${fmtNum(x.vencidos)} ativo(s) com data vencida`
              : "renovar ou pausar o anúncio"
          }
          {...(x.vencendo.length || x.vencidos ? { tone: "warn" as const } : {})}
        />
        <Kpi
          label="Pagamento pendente"
          value={fmtNum(x.contagem.pagamento_pendente)}
          hint={fmtBRL(x.pagamentoPendente)}
        />
        <Kpi
          label="Candidatos a Spark"
          value={fmtNum(x.candidatos.length)}
          hint="vídeos acima da média sem direito"
          tone="up"
        />
      </div>
      <Panel
        title="Direitos de uso"
        right={<CsvButton name="affiliate-direitos-uso" rows={T(x.lista)} />}
      >
        <p className="mb-3 text-xs text-muted-foreground">
          {STATUS_DIREITO.map((s) => `${STATUS_DIREITO_LABEL[s]}: ${x.contagem[s]}`).join(" · ")}
        </p>
        {x.lista.length ? (
          <Table
            head={["Creator", "Vídeo", "Plataforma", "Status", "Início", "Fim", "Valor", "Código"]}
          >
            {x.lista.slice(0, 100).map((r) => (
              <tr key={r.id}>
                <Td>{r.creator}</Td>
                <Td mono>{r.videoId}</Td>
                <Td>{PLATAFORMA_DIREITO_LABEL[r.plataforma] ?? r.plataforma}</Td>
                <Td>
                  <StatusTag
                    tone={
                      r.vencido
                        ? "danger"
                        : r.vencendo
                          ? "warn"
                          : r.status === "ativo"
                            ? "success"
                            : r.status === "pagamento_pendente" || r.status === "solicitado"
                              ? "primary"
                              : "muted"
                    }
                  >
                    {r.vencido
                      ? "ativo, data vencida"
                      : r.vencendo
                        ? `vence em ${r.diasParaVencer} dia(s)`
                        : (STATUS_DIREITO_LABEL[r.status] ?? r.status)}
                  </StatusTag>
                </Td>
                <Td mono>{r.inicio ? fmtDate(r.inicio) : "—"}</Td>
                <Td mono>{r.fim ? fmtDate(r.fim) : "—"}</Td>
                <Td mono>{fmtBRL(r.valor)}</Td>
                <Td>{r.temCodigo ? "recebido" : "—"}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Nenhum direito de uso cadastrado.</Empty>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          A plataforma só registra se o código foi recebido; o código Spark em si nunca é guardado
          aqui. Pedir, renovar ou pagar direito continua fora da plataforma até a Fase 3.
        </p>
      </Panel>
      <Panel
        title="Candidatos a Spark Ads"
        right={<CsvButton name="affiliate-candidatos-spark" rows={T(x.candidatos)} />}
      >
        {x.candidatos.length ? (
          <Table
            head={["Vídeo", "Creator", "Produto", "Views", "GMV", "GMV / mil views", "Por quê"]}
          >
            {x.candidatos.map((c) => (
              <tr key={c.videoId}>
                <Td className="max-w-[280px] truncate">{c.titulo || c.videoId}</Td>
                <Td>@{c.creator}</Td>
                <Td>{c.produto || "—"}</Td>
                <Td mono>{fmtNum(c.views)}</Td>
                <Td mono>{fmtBRL(c.gmv)}</Td>
                <Td mono>{fmtBRL(c.gmvMilViews)}</Td>
                <Td className="min-w-[220px] !whitespace-normal text-xs">{c.motivo}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty>Nenhum vídeo acima da média sem direito de uso.</Empty>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Vídeos de creators nos últimos 90 dias com pelo menos {fmtNum(SPARK_MIN_VIEWS)} views, GMV
          por mil views acima da média ({fmtBRL(x.mediaGmvMilViews)}) e sem direito pedido ou ativo.
        </p>
      </Panel>
    </div>
  );
}

function BriefProduto({ d }: { d: D }) {
  const [sel, setSel] = useState<string>("");
  if (!d.briefs.length) return null;
  const b = d.briefs.find((x) => x.produto === sel) ?? d.briefs[0]!;
  return (
    <Panel
      title={`Brief para creators: ${b.produto}`}
      right={<CopiarTexto texto={b.texto} rotulo="Copiar brief" />}
    >
      {d.briefs.length > 1 && (
        <div className="mb-4">
          <Pills
            value={b.produto}
            onChange={setSel}
            options={d.briefs.map((x) => ({ id: x.produto, label: x.produto }))}
          />
        </div>
      )}
      <p className="text-sm">{b.objetivo}</p>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-success">
            Use
          </div>
          <ul className="space-y-1 text-sm">
            {b.usar.map((u) => (
              <li key={u.dimensao}>
                <span className="font-medium">{u.dimensao}:</span> {u.valor}{" "}
                <span className="text-xs text-muted-foreground">({u.detalhe})</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-danger">
            Evite
          </div>
          {b.evitar.length ? (
            <ul className="space-y-1 text-sm">
              {b.evitar.map((u) => (
                <li key={u.dimensao}>
                  <span className="font-medium">{u.dimensao}:</span> {u.valor}{" "}
                  <span className="text-xs text-muted-foreground">({u.detalhe})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nada claramente abaixo da média ainda.</p>
          )}
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider">Prazos</div>
          <ul className="list-disc space-y-1 pl-4 text-sm">
            {b.prazos.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider">
            Cuidados (validar com o regulatório)
          </div>
          <ul className="list-disc space-y-1 pl-4 text-sm">
            {b.regulatorio.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Gerado dos padrões vencedores do DNA (confiança {b.confianca}, {fmtNum(b.videos)} vídeos).
        Template sem IA: a IA para reescrever o brief entra com login e aprovação. Os cuidados são
        hipótese até o jurídico validar.
      </p>
    </Panel>
  );
}

// ---------------------------------------------------------------------------------------------
// Onda 3 do benchmark Cruva: workflows (definição + simulação), creators parecidos e placar do creator

const TOM_PASSO = {
  gatilho: "border-primary/50 bg-primary/10",
  condicao: "border-border bg-muted/40",
  espera: "border-border bg-transparent",
  acao: "border-success/50 bg-success/10",
} as const;
const ROTULO_PASSO = { gatilho: "Quando", condicao: "Se", espera: "Espera", acao: "Ação" } as const;

function Workflows({ d }: { d: D }) {
  const [aberto, setAberto] = useState<string>(d.workflows[0]?.chave ?? "");
  const total = d.workflows.reduce((s, w) => s + w.disparos.length, 0);
  return (
    <div className="space-y-6">
      {d.onda3Pendente && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
          Workflows próprios precisam da migração{" "}
          <span className="font-mono">20261006160000_affiliate_workflow.sql</span>. Sem ela, valem
          os 6 modelos.
        </div>
      )}
      <Panel
        title={`Workflows: quem dispararia hoje (${fmtNum(total)})`}
        right={
          <CsvButton
            name="affiliate-workflows-simulacao"
            rows={d.workflows.flatMap((w) => w.disparos.map((x) => ({ workflow: w.nome, ...x })))}
          />
        }
      >
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {d.workflows.map((w) => (
            <button
              key={w.chave}
              type="button"
              onClick={() => setAberto(w.chave)}
              className={`rounded-lg border p-4 text-left transition ${aberto === w.chave ? "border-primary" : "border-border hover:border-primary/50"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{w.nome}</span>
                <StatusTag tone={!w.ativo ? "muted" : w.disparos.length ? "primary" : "muted"}>
                  {!w.ativo ? "inativo" : `${w.disparos.length} hoje`}
                </StatusTag>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {w.fonte === "modelo" ? "modelo" : `cadastrado, v${w.versao}`} · base: {w.origem}
              </div>
            </button>
          ))}
        </div>
        {d.workflows
          .filter((w) => w.chave === aberto)
          .map((w) => (
            <div key={w.chave} className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {w.passos.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {i > 0 && <span className="text-muted-foreground">→</span>}
                    <div className={`rounded-md border px-3 py-2 text-xs ${TOM_PASSO[p.tipo]}`}>
                      <div className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">
                        {ROTULO_PASSO[p.tipo]}
                        {p.aprovacao ? " · com aprovação" : ""}
                      </div>
                      <div>{p.texto}</div>
                    </div>
                  </div>
                ))}
              </div>
              {w.disparos.length ? (
                <Table head={["Creator", "Etapa que dispararia", "Por quê"]}>
                  {w.disparos.map((x, i) => (
                    <tr key={`${x.handle || x.creator}-${i}`}>
                      <Td>
                        <div>{x.creator}</div>
                        {x.handle && x.handle !== x.creator && (
                          <div className="text-xs text-muted-foreground">{x.handle}</div>
                        )}
                      </Td>
                      <Td className="font-medium">{x.etapa}</Td>
                      <Td className="min-w-[260px] !whitespace-normal text-xs">{x.motivo}</Td>
                    </tr>
                  ))}
                </Table>
              ) : (
                <Empty>{w.ativo ? "Ninguém dispararia hoje." : "Workflow inativo."}</Empty>
              )}
            </div>
          ))}
        <p className="mt-4 text-xs text-muted-foreground">
          Simulação: nada é enviado nem muda de estado. Os modelos seguem os 6 fluxos da Cruva,
          adaptados (R$, contribuição no lugar de GMV, revisão humana no lugar de blacklist). Toda
          ação nasce com aprovação; o motor que espera e executa entra na Fase 3. Versões próprias
          ficam em affiliate_workflow (só inserção).
        </p>
      </Panel>
      <Panel title="Eventos de resposta (7)">
        <Table head={["Evento", "De onde viria", "Hoje"]}>
          {EVENTOS_RESPOSTA.map((x) => (
            <tr key={x.evento}>
              <Td className="font-medium">{x.evento}</Td>
              <Td className="text-xs">{x.fonte}</Td>
              <Td>
                <StatusTag tone="muted">sem fonte</StatusTag>
              </Td>
            </tr>
          ))}
        </Table>
        <p className="mt-3 text-xs text-muted-foreground">
          Os gatilhos de resposta automática da Cruva dependem de mensagens e da API oficial do
          TikTok Shop, que ainda não estão ligadas. Ficam listados para o motor da Fase 3.
        </p>
      </Panel>
    </div>
  );
}

function Parecidos({ d }: { d: D }) {
  const p = d.parecidos;
  return (
    <Panel
      title="Parecidos com os melhores creators"
      right={<CsvButton name="affiliate-creators-parecidos" rows={T(p.parecidos)} />}
    >
      <p className="mb-3 text-xs text-muted-foreground">
        Referências: {p.referencias.map((r) => `${r.handle} (${fmtBRL(r.gmv)})`).join(" · ") || "—"}
      </p>
      {p.parecidos.length ? (
        <Table
          head={[
            "Creator",
            "Parecido com",
            "Similaridade",
            "Em comum",
            "Vídeos",
            "GMV 90d",
            "GMV / mil views",
          ]}
        >
          {p.parecidos.map((x) => (
            <tr key={x.handle}>
              <Td>
                <div className="font-medium">{x.nome}</div>
                <div className="text-xs text-muted-foreground">
                  {x.nome !== x.handle ? `${x.handle} · ` : ""}
                  {x.cadastrado ? "no cadastro" : "fora do cadastro"}
                </div>
              </Td>
              <Td>{x.parecidoCom}</Td>
              <Td mono>{x.similaridade}%</Td>
              <Td className="min-w-[220px] !whitespace-normal text-xs">
                {x.emComum.join(" · ") || "—"}
              </Td>
              <Td mono>{fmtNum(x.videos)}</Td>
              <Td mono>{fmtBRL(x.gmv)}</Td>
              <Td mono>{fmtBRL(x.gmvMilViews)}</Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty>Nenhum creator com conteúdo parecido o bastante (similaridade ≥ 50%).</Empty>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Só creators que já postaram vídeo de produto Soldiers no TikTok ({fmtNum(p.avaliados)} com
        2+ vídeos em 90 dias), sem base de terceiros. Perfil = produto, gancho, ângulo, formato e
        CTA dos vídeos; similaridade de cosseno com os creators de maior GMV. Sugestão para olhar
        primeiro, não previsão de venda. Contas de loja ficam fora.
      </p>
    </Panel>
  );
}

function PlacarCreator({ d }: { d: D }) {
  const [sel, setSel] = useState<string>(d.placares[0]?.handle ?? "");
  const p = d.placares.find((x) => x.handle === sel) ?? d.placares[0];
  if (!p) return <Empty>Nenhum creator com venda nos últimos 90 dias.</Empty>;
  const brief = d.briefs.find((b) => b.produto === p.briefProduto);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-muted-foreground" htmlFor="placar-creator">
          Creator
        </label>
        <select
          id="placar-creator"
          value={p.handle}
          onChange={(e) => setSel(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          {d.placares.map((x) => (
            <option key={x.handle} value={x.handle}>
              {x.posicao}º · {x.nome}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">
          Prévia interna do portal do creator: nada é publicado para ele.
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="Posição no ranking"
          value={`${p.posicao}º de ${p.de}`}
          hint="GMV no TikTok, 90 dias"
        />
        <Kpi
          label="Vendas em 90 dias"
          value={fmtBRL(p.gmv)}
          hint={`${fmtBRL(p.gmv28)} nos últimos 28`}
        />
        <Kpi
          label="Comissão"
          value={`${p.faixaPct}%`}
          hint={
            p.proximaFaixa
              ? `faltam ${fmtBRL(p.proximaFaixa.faltaVendas)} em vendas para ${p.proximaFaixa.comissaoPct}%`
              : "na faixa mais alta"
          }
          tone="up"
        />
        <Kpi
          label="Vídeos"
          value={fmtNum(p.videos)}
          hint={p.ultimaVenda ? `última venda em ${fmtDate(p.ultimaVenda)}` : "sem venda"}
        />
      </div>
      <div className="grid gap-6 2xl:grid-cols-2">
        <Panel title="Amostras em andamento">
          {p.amostras.length ? (
            <Table head={["Produto", "Situação", "Dias", "Aviso"]}>
              {p.amostras.map((a, i) => (
                <tr key={`${a.produto}-${i}`}>
                  <Td>{a.produto}</Td>
                  <Td>{a.status}</Td>
                  <Td mono>{a.dias == null ? "—" : fmtNum(a.dias)}</Td>
                  <Td className="text-xs">{a.alerta || "—"}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>Nenhuma amostra em andamento.</Empty>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Direitos de uso ativos: {fmtNum(p.direitosAtivos)}.
          </p>
        </Panel>
        <Panel
          title={brief ? `Brief: ${brief.produto}` : "Brief"}
          right={brief ? <CopiarTexto texto={brief.texto} rotulo="Copiar brief" /> : null}
        >
          {brief ? (
            <ul className="space-y-1 text-sm">
              {brief.usar.map((u) => (
                <li key={u.dimensao}>
                  <span className="font-medium">{u.dimensao}:</span> {u.valor}
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Sem padrão vencedor para a categoria principal deste creator ainda.</Empty>
          )}
        </Panel>
      </div>
      <p className="text-xs text-muted-foreground">
        O que o portal mostraria ao creator: posição, comissão e quanto falta para a próxima faixa
        (em vendas, sem expor a margem), amostras e o brief do produto que ele mais vende. O portal
        em si (login do creator, PIX, comunidade) fica para depois da Fase 3.
      </p>
    </div>
  );
}
