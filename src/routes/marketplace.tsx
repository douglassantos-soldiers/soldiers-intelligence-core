import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/kit";
import { ChannelView } from "@/components/channel-view";
import { MARKETPLACES } from "@/domain/sources";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — Soldiers Platform" },
      { name: "description", content: "Mercado Livre, Amazon, Shopee e TikTok Shop: receita, custo do canal, ads e margem." },
      { property: "og:title", content: "Marketplace — Soldiers Platform" },
      { property: "og:description", content: "Economia dos marketplaces da Soldiers." },
    ],
  }),
  component: () => {
    const [dias, setDias] = useState("30");
    return (
      <>
        <PageHeader title="Marketplace" subtitle="Operação e economia por marketplace: receita, taxas, ads, CMV e margem." />
        <ChannelView canais={MARKETPLACES} dias={dias} setDias={setDias} />
      </>
    );
  },
});
