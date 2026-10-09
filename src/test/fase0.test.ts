import { describe, expect, it } from "vitest";
import { hojeSP, diasAtrasSP, somaDias } from "@/lib/datas";
import {
  colunasDoSelect,
  ordenaEstavel,
  fetchAll,
  foiCortado,
  ultimosTruncamentos,
} from "@/lib/db-helpers";
import { mesAnterior } from "@/lib/fechamento.functions";

describe("datas em Brasília", () => {
  it("depois das 21h de Brasília ainda é o mesmo dia (UTC já virou)", () => {
    const quase = new Date("2026-10-10T01:30:00Z"); // 22h30 de 09/10 em Brasília
    expect(hojeSP(quase)).toBe("2026-10-09");
    expect(diasAtrasSP(0, quase)).toBe("2026-10-09");
    expect(diasAtrasSP(1, quase)).toBe("2026-10-08");
  });

  it("soma dias atravessando mês e ano", () => {
    expect(somaDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(somaDias("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("mês anterior usa o mês de Brasília na virada", () => {
    // 01/11 01:00 UTC = 31/10 22:00 em Brasília → mês corrente é outubro, anterior é setembro.
    expect(mesAnterior(new Date("2026-11-01T01:00:00Z"))).toBe("2026-09");
    expect(mesAnterior(new Date("2026-01-15T12:00:00Z"))).toBe("2025-12");
  });
});

// Construtor falso no formato do postgrest-js: guarda a URL e responde com fatias de uma tabela.
function fakeBuilder(tabela: Record<string, unknown>[], select: string, order?: string) {
  const url = new URL("http://x/rest/v1/t");
  url.searchParams.set("select", select);
  if (order) url.searchParams.set("order", order);
  const b = {
    url,
    order(col: string, o: { ascending?: boolean } = {}) {
      const atual = url.searchParams.get("order");
      url.searchParams.set(
        "order",
        `${atual ? `${atual},` : ""}${col}.${o.ascending === false ? "desc" : "asc"}`,
      );
      return b;
    },
    async range(de: number, ate: number) {
      return { data: tabela.slice(de, ate + 1), error: null };
    },
  };
  return b;
}

describe("busca paginada", () => {
  it("lê as colunas simples do select (alias e cast) e recusa os complexos", () => {
    expect(colunasDoSelect("data,canal, total:receita,valor::text")).toEqual([
      "data",
      "canal",
      "receita",
      "valor",
    ]);
    expect(colunasDoSelect("*")).toBeNull();
    expect(colunasDoSelect("id,itens(sku)")).toBeNull();
    expect(colunasDoSelect("payload->x")).toBeNull();
  });

  it("acrescenta todas as colunas como desempate, depois da ordem da consulta", () => {
    const q = ordenaEstavel(fakeBuilder([], "data,sku,receita", "data.asc"));
    expect(q.url.searchParams.get("order")).toBe("data.asc,sku.asc,receita.asc");
  });

  it("marca e registra quando o resultado bate no teto", async () => {
    const linhas = Array.from({ length: 2500 }, (_, i) => ({ id: i }));
    const cortado = await fetchAll(() => fakeBuilder(linhas, "id"), "teste corte", 2000);
    expect(cortado).toHaveLength(2000);
    expect(foiCortado(cortado)).toBe(true);
    expect(ultimosTruncamentos()[0]).toMatchObject({ ctx: "teste corte", max: 2000 });

    const inteiro = await fetchAll(() => fakeBuilder(linhas, "id"), "teste inteiro", 3000);
    expect(inteiro).toHaveLength(2500);
    expect(foiCortado(inteiro)).toBe(false);

    const intencional = await fetchAll(() => fakeBuilder(linhas, "id"), "top", 1000, {
      tetoIntencional: true,
    });
    expect(foiCortado(intencional)).toBe(false);
  });

  it("teto que não é múltiplo de 1000 não lê linha a mais", async () => {
    const linhas = Array.from({ length: 3000 }, (_, i) => ({ id: i }));
    const r = await fetchAll(() => fakeBuilder(linhas, "id"), "teto quebrado", 1500);
    expect(r).toHaveLength(1500);
  });
});
