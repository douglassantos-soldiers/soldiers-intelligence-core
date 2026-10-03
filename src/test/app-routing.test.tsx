import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("todos os links do menu resolvem para uma página (sem 404)", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const paths = [
      "/clientes",
      "/produtos",
      "/pedidos",
      "/commerce",
      "/marketplace",
      "/marketplace/tiktok",
      "/marketplace/amazon",
      "/marketplace/mercado-livre",
      "/data-health",
      "/glossario",
      "/media",
      "/affiliate",
      "/afiliados/hoje",
      "/crm",
      "/em-breve/ai",
    ];
    for (const path of paths) {
      expect(router.matchRoutes(path).at(-1)?.routeId, path).not.toBe(rootRouteId);
    }
  });
});
