import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/kit";

// Módulos do menu que ainda não têm tela. Evita 404 e diz em que fase cada um entra
// (numeração do Plano Mestre, cap. 36) e de onde virão os dados.
const MODULOS: Record<string, { titulo: string; fase: string; resumo: string; fontes?: string }> = {
  media: {
    titulo: "Media",
    fase: "Fase 2 — Media Foundation",
    resumo:
      "Investimento, ROAS de mídia, funil e criativos por plataforma (Meta, Google, TikTok, Amazon Ads, Mercado Ads, Shopee Ads).",
    fontes: "vw_ads_por_tipo_dia, vw_ads_funil_canal_dia, vw_receita_consolidada",
  },
  affiliate: {
    titulo: "Affiliate",
    fase: "Fase 5 — Affiliate Foundation",
    resumo: "Creators, publishers, comissão e receita atribuída a afiliados, separados de Media.",
    fontes: "vw_awin_dia, vw_awin_publisher_dia, mv_afiliado_canal_dia",
  },
  crm: {
    titulo: "CRM / Growth",
    fase: "Fase 4 — CRM / Growth Foundation",
    resumo: "Cohorts, RFM, LTV por canal, recompra e próxima ação por segmento.",
    fontes:
      "mv_growth_mes, mv_growth_rfm_segmento, mv_growth_cohort_mes, mv_growth_ltv_canal, mv_growth_acao_resumo",
  },
  intelligence: {
    titulo: "Intelligence",
    fase: "Fase 6 — Intelligence",
    resumo: "Problemas, oportunidades e anomalias entre canais.",
  },
  attribution: {
    titulo: "Attribution",
    fase: "Fase 6 — Intelligence",
    resumo:
      "Receita realizada × atribuída × reportada pela plataforma, sem somar atribuição à receita.",
  },
  profit: {
    titulo: "Profit",
    fase: "Fase 6 — Intelligence",
    resumo: "Contribution por pedido, produto, cliente, canal e creator, com custo por vigência.",
  },
  ai: {
    titulo: "AI",
    fase: "Fases 7 a 10 — AI Read → Recommend → Execute",
    resumo:
      "Agentes que leem, depois recomendam e só então executam, com política, aprovação e auditoria.",
  },
};

export const Route = createFileRoute("/em-breve/$modulo")({
  head: () => ({ meta: [{ title: "Em breve — Soldiers Platform" }] }),
  component: EmBreve,
});

function EmBreve() {
  const { modulo } = Route.useParams();
  const m = MODULOS[modulo];
  return (
    <>
      <PageHeader
        title={m?.titulo ?? "Em breve"}
        subtitle={m?.fase ?? "Módulo ainda não disponível."}
      />
      <Panel title="O que vai ter aqui">
        <div className="space-y-3 text-sm">
          <p>{m?.resumo ?? "Este módulo entra numa próxima fase do Plano Mestre."}</p>
          {m?.fontes && (
            <p className="text-muted-foreground">
              Dados que já existem no Supabase:{" "}
              <span className="font-mono text-xs">{m.fontes}</span>
            </p>
          )}
          <Link to="/" className="inline-block font-medium text-primary hover:underline">
            ← Voltar ao Command Center
          </Link>
        </div>
      </Panel>
    </>
  );
}
