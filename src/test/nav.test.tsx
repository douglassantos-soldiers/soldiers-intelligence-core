import { describe, expect, it } from "vitest";
import { GRUPOS, RODAPE, TOPO, grupoDaRota, caminho } from "@/components/nav-config";
import fs from "fs";
import path from "path";

describe("menu lateral", () => {
  it("cada rota leva ao grupo certo", () => {
    expect(grupoDaRota("/")).toBeNull();
    expect(grupoDaRota("/media")).toBe("media");
    expect(grupoDaRota("/media/meta/criativos")).toBe("media");
    expect(grupoDaRota("/afiliados/hoje")).toBe("affiliate");
    expect(grupoDaRota("/affiliate/fechamento/")).toBe("affiliate");
    expect(grupoDaRota("/marketplace/amazon")).toBe("commerce");
    expect(grupoDaRota("/commerce")).toBe("commerce");
    expect(grupoDaRota("/clientes/abc123")).toBe("core");
    expect(grupoDaRota("/pedidos/site/42")).toBe("core");
    expect(grupoDaRota("/crm/base")).toBe("crm");
    expect(grupoDaRota("/em-breve/profit")).toBe("inteligencia");
    expect(grupoDaRota("/glossario")).toBeNull();
  });

  it("todo item aponta para uma rota que existe e nenhum se repete", () => {
    const gen = fs.readFileSync(path.resolve(__dirname, "../routeTree.gen.ts"), "utf8");
    const bloco = gen.slice(gen.indexOf("export interface FileRoutesByFullPath"));
    const rotas = new Set(
      [...bloco.slice(0, bloco.indexOf("}")).matchAll(/'([^']+)':/g)].map(
        (m) => m[1]!.replace(/\/$/, "") || "/",
      ),
    );
    const todos = [TOPO, ...GRUPOS.flatMap((g) => g.items), ...RODAPE];
    for (const it of todos) expect(rotas.has(it.to), it.to).toBe(true);
    const caminhos = todos.map(caminho);
    expect(new Set(caminhos).size).toBe(caminhos.length);
    // Eram 33 itens; "Meta: subir criativos" virou só o botão da tela de Criativos.
    expect(todos.length).toBe(32);
  });
});
