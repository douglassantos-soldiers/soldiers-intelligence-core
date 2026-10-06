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
import { getAffiliateOS } from "@/lib/affiliateos.functions";
import { ESTAGIO_LABEL, STATUS_AMOSTRA, STATUS_AMOSTRA_LABEL } from "@/lib/affiliateos";
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
  "creators" | "funil" | "amostras" | "outreach" | "conteudo" | "comissao" | "risco" | "qualidade";
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
  const [aba, setAba] = useState<Aba>("creators");
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
          label="Amostras"
          value={fmtNum(d.amostras.length)}
          hint={`${fmtNum(alertasAm)} com alerta`}
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
          { id: "creators", label: "Creators e notas" },
          { id: "funil", label: "Funil" },
          { id: "amostras", label: "Amostras" },
          { id: "outreach", label: "Outreach" },
          { id: "conteudo", label: "Conteúdo (DNA)" },
          { id: "comissao", label: "Comissão" },
          { id: "risco", label: "Risco e concorrentes" },
          { id: "qualidade", label: "Qualidade do cliente" },
        ]}
      />
      {aba === "creators" && <Creators d={d} />}
      {aba === "funil" && <Funil f={d.funil} />}
      {aba === "amostras" && <Amostras a={d.amostras} margem={d.margemAfiliadoPct} />}
      {aba === "outreach" && <Outreach o={d.outreach} />}
      {aba === "conteudo" && <Conteudo d={d} />}
      {aba === "comissao" && <Comissao e={d.elasticidade} />}
      {aba === "risco" && <Risco d={d} />}
      {aba === "qualidade" && <Qualidade q={d.qualidade} />}
    </div>
  );
}

function Creators({ d }: { d: D }) {
  return (
    <Panel
      title={`Creators por oportunidade (${d.foco})`}
      right={<CsvButton name="affiliate-os-creators" rows={T(d.creators)} />}
    >
      {d.creators.length ? (
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
          {d.creators.slice(0, 100).map((c) => (
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
          Creator com sinal de risco tem a Opportunity cortada pela metade até a revisão. Estágio
          cinza = deduzido pelas vendas; azul = do cadastro do Affiliate OS. Fonte: vídeos do TikTok
          Shop dos últimos 90 dias.
        </li>
      </ul>
    </Panel>
  );
}

function Funil({ f }: { f: D["funil"] }) {
  const max = Math.max(1, ...f.map((x) => x.chegaram));
  return (
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
  );
}

function Amostras({ a, margem }: { a: D["amostras"]; margem: number }) {
  if (!a.length) return <Empty>Nenhuma amostra cadastrada em affiliate_amostra.</Empty>;
  const colunas = STATUS_AMOSTRA.map((s) => ({ s, itens: a.filter((x) => x.status === s) }));
  return (
    <div className="space-y-6">
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
            <tr key={x.id}>
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
          comissão). Alertas: 7 dias sem publicar, 14 dias sem confirmar recebimento, publicou sem
          venda em 14 dias, ROI abaixo de 1× após 30 dias.
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

function Comissao({ e }: { e: D["elasticidade"] }) {
  return (
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
            Dias agrupados pela comissão efetiva (ML: por campanha; TikTok: por produto), 180 dias.
            É correlação: outros fatores mudam junto. Para saber de verdade, rodar um experimento
            com grupo de controle.
          </p>
        </Panel>
      ))}
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
