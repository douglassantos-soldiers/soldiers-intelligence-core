// Acesso ao banco para as server functions (só no servidor: o cliente admin é importado sob demanda).
// Separado de data.functions.ts para que telas novas tenham seu próprio arquivo de leituras.
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = any;
export async function db(): Promise<Db> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as Db;
}

export function check<T>(r: { data: T; error: { message: string } | null }, ctx: string): T {
  if (r.error) throw new Error(`${ctx}: ${r.error.message}`);
  return r.data;
}

// ---------------------------------------------------------------------------------------------
// Busca paginada (o PostgREST devolve no máximo 1000 linhas por consulta).
//
// Ordem estável: paginar com range() sem ORDER BY deixa o Postgres devolver as páginas em qualquer ordem, e
// linhas podem repetir ou sumir entre uma página e outra. Por isso toda busca paginada ordena por TODAS as
// colunas selecionadas (depois da ordem que a consulta já pedir). Linhas que empatam em todas as colunas são
// idênticas, então a troca entre elas não muda o resultado.
//
// Corte: quando a busca chega no teto (max) com a última página cheia, o resultado foi cortado. Isso fica
// registrado (console + lista exibida no Data Health) em vez de passar em silêncio.

export type Truncamento = { ctx: string; max: number; quando: string };
const TRUNCAMENTOS: Truncamento[] = [];
const cortados = new WeakSet<object>();

/** Últimas leituras que bateram no teto (memória do servidor; zera ao reiniciar). */
export function ultimosTruncamentos(): Truncamento[] {
  return [...TRUNCAMENTOS].reverse();
}

/** true se este resultado de fetchAll foi cortado pelo teto. */
export function foiCortado(rows: object): boolean {
  return cortados.has(rows);
}

function registraCorte(ctx: string, max: number) {
  TRUNCAMENTOS.push({ ctx, max, quando: new Date().toISOString() });
  if (TRUNCAMENTOS.length > 50) TRUNCAMENTOS.shift();
  console.warn(`[fetchAll] "${ctx}" chegou no teto de ${max} linhas: resultado cortado.`);
}

/** Colunas simples de um select do PostgREST; null quando não dá para ordenar por elas com segurança. */
export function colunasDoSelect(select: string | null | undefined): string[] | null {
  if (!select) return null;
  const partes = select
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (!partes.length || partes.some((x) => x === "*" || /[()]|->/.test(x))) return null;
  const cols = partes.map((x) => {
    const semCast = x.split("::")[0]!;
    return semCast.includes(":") ? semCast.split(":").pop()!.trim() : semCast;
  });
  return cols.every((c) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(c)) ? cols : null;
}

/** Acrescenta como desempate todas as colunas do select que ainda não estão na ordem da consulta. */
export function ordenaEstavel(q: Db): Db {
  const url = q?.url;
  if (!(url instanceof URL) || typeof q.order !== "function") return q;
  const cols = colunasDoSelect(url.searchParams.get("select"));
  if (!cols) return q;
  const jaOrdena = new Set(
    (url.searchParams.get("order") ?? "")
      .split(",")
      .map((x) => x.split(".")[0])
      .filter(Boolean),
  );
  let out = q;
  for (const c of cols) if (!jaOrdena.has(c)) out = out.order(c, { ascending: true });
  return out;
}

export async function fetchAll<T = Record<string, unknown>>(
  make: () => Db,
  ctx: string,
  max = 30000,
  opts: { tetoIntencional?: boolean } = {},
): Promise<T[]> {
  const out: T[] = [];
  let ultimaCheia = false;
  for (let from = 0; from < max; from += 1000) {
    const ate = Math.min(from + 999, max - 1);
    const rows = check(await ordenaEstavel(make()).range(from, ate), ctx) as T[];
    out.push(...rows);
    ultimaCheia = rows.length === ate - from + 1;
    if (!ultimaCheia) break;
  }
  // tetoIntencional: a consulta quer só as N primeiras (ex.: fila dos 1.000 de maior valor); não é corte.
  if (ultimaCheia && out.length >= max && !opts.tetoIntencional) {
    cortados.add(out);
    registraCorte(ctx, max);
  }
  return out;
}

// Busca por lista de IDs em lotes (para views sem coluna de data, como vw_ml_frete_pedido).
export async function fetchIn(
  c: Db,
  tabela: string,
  select: string,
  col: string,
  ids: (string | number)[],
  ctx: string,
  lote = 300,
) {
  const out: Record<string, unknown>[] = [];
  for (let i = 0; i < ids.length; i += lote) {
    const r = await c
      .from(tabela)
      .select(select)
      .in(col, ids.slice(i, i + lote));
    out.push(...((check(r, ctx) ?? []) as Record<string, unknown>[]));
  }
  return out;
}

export const Periodo = z.object({
  de: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
