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

// Busca paginada para contornar o limite de 1000 linhas por consulta.
export async function fetchAll<T = Record<string, unknown>>(
  make: () => Db,
  ctx: string,
  max = 30000,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < max; from += 1000) {
    const rows = check(await make().range(from, from + 999), ctx) as T[];
    out.push(...rows);
    if (rows.length < 1000) break;
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
