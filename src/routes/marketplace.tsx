import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageHeader, Panel, Kpi } from "@/components/kit";
import { ChannelView } from "@/components/channel-view";
import { MARKETPLACES } from "@/domain/sources";
import { getMarketplaceSaude } from "@/lib/data.functions";
import { fmtNum, fmtPct, fmtDate } from "@/lib/format";
import { pct } from "@/lib/aggregate";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — Soldiers Platform" },
      {
        name: "description",
        content:
          "Mercado Livre, Amazon, Shopee e TikTok Shop: receita, custo do canal, ads e margem.",
      },
      { property: "og:title", content: "Marketplace — Soldiers Platform" },
      { property: "og:description", content: "Economia dos marketplaces da Soldiers." },
    ],
  }),
  component: () => {
    const [dias, setDias] = useState("30");
    return (
      <>
        <PageHeader
          title="Marketplace"
          subtitle="Operação e economia por marketplace: receita, taxas, ads, CMV e margem."
        />
        <SaudeAmazon />
        <ChannelView canais={MARKETPLACES} dias={dias} setDias={setDias} />
      </>
    );
  },
});

// Marketplace Health (Plano Mestre cap. 9.5): Buy Box da Amazon, a partir de vw_abb_resumo.
function SaudeAmazon() {
  const fn = useServerFn(getMarketplaceSaude);
  const q = useQuery({ queryKey: ["marketplace-saude"], queryFn: () => fn() });
  const b = q.data?.buybox as Record<string, unknown> | null | undefined;
  if (!b) return null;
  const asins = Number(b["asins"]) || 0;
  return (
    <Panel
      title="Saúde Amazon: Buy Box"
      className="mb-6"
      right={
        b["atualizado"] ? (
          <span className="text-xs text-muted-foreground">
            Atualizado {fmtDate(b["atualizado"])}
          </span>
        ) : undefined
      }
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="ASINs monitorados" value={fmtNum(asins)} />
        <Kpi
          label="Com Buy Box"
          value={fmtNum(b["ganha_bb"])}
          hint={fmtPct(pct(b["ganha_bb"], asins), 0)}
          tone="up"
        />
        <Kpi
          label="Perdendo p/ concorrente"
          value={fmtNum(b["perdendo_concorrente"])}
          tone="warn"
        />
        <Kpi
          label="Em risco"
          value={fmtNum(b["em_risco"])}
          hint={`${fmtNum(b["com_concorrente"])} com concorrente`}
          tone="warn"
        />
        <Kpi label="Suprimida" value={fmtNum(b["suprimida"])} tone="down" />
      </div>
    </Panel>
  );
}
