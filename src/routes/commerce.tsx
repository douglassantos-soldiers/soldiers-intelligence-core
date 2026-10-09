import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/kit";
import { ChannelView } from "@/components/channel-view";

export const Route = createFileRoute("/commerce")({
  head: () => ({
    meta: [
      { title: "Commerce — Soldiers Platform" },
      { name: "description", content: "Operação do site Soldiers (Shopify): receita, margem, ads e produtos." },
      { property: "og:title", content: "Commerce — Soldiers Platform" },
      { property: "og:description", content: "Operação do site próprio da Soldiers." },
    ],
  }),
  component: () => {
    const [dias, setDias] = useState("28");
    return (
      <>
        <PageHeader title="Commerce" subtitle="Site próprio (Shopify): receita, margem, mídia e produtos." />
        <ChannelView canais={["Site"]} dias={dias} setDias={setDias} />
      </>
    );
  },
});
