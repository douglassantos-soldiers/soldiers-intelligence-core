// Leituras da Soldiers Platform — Affiliate: visão geral e "O que fazer hoje".
// Somente leitura de objetos JÁ EXISTENTES no Supabase. data.functions.ts reexporta as server functions.
import { diasAtrasSP, hojeSP } from "@/lib/datas";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  videosParaEscalar,
  creatorsEmAlta,
  creatorsParaReativar,
  influenciadoresSemVenda,
} from "@/lib/affiliate";
import { db, fetchAll } from "@/lib/db-helpers";

const Periodo = z.object({
  de: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const getAffiliate = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => {
    const c = await db();
    const [dia, pub, canal] = await Promise.all([
      fetchAll(
        () =>
          c
            .from("vw_awin_dia")
            .select(
              "data,pedidos,pedidos_recusados,venda,venda_aprovada,venda_pendente,venda_recusada,comissao,taxa_awin",
            )
            .gte("data", data.de)
            .lte("data", data.ate)
            .order("data"),
        "awin dia",
      ),
      fetchAll(
        () =>
          c
            .from("vw_awin_publisher_dia")
            .select("publisher_id,publisher,pedidos,venda,comissao,taxa_awin")
            .gte("data", data.de)
            .lte("data", data.ate),
        "awin pub",
      ),
      fetchAll(
        () =>
          c
            .from("mv_afiliado_canal_dia")
            .select("data,canal,rec,inv")
            .gte("data", data.de)
            .lte("data", data.ate)
            .order("data"),
        "afiliado canal",
      ),
    ]);
    return { dia, pub, canal };
  });

/* ---------------- Affiliate Copilot: "O que devo fazer hoje?" ----------------
 * Plano AffiliateOS BR §17 e Plano Mestre caps. 8 e 28. Só leitura; tudo é recomendação.
 * Os cálculos ficam no servidor (lib/affiliate.ts) para não mandar 90 dias de vídeos ao navegador. */
export const getAffiliateHoje = createServerFn({ method: "GET" }).handler(async () => {
  const c = await db();
  const hoje = hojeSP();
  const de90 = diasAtrasSP(89);
  const de30 = diasAtrasSP(29);
  const [videos, infl, conteudo] = await Promise.all([
    fetchAll(
      () =>
        c
          .from("fact_tiktok_video_dia")
          .select("data,video_id,criador,titulo,produto_nome,views,gmv,sku_orders")
          .gte("data", de90)
          .lte("data", hoje)
          .order("data"),
      "tiktok videos",
      90000,
    ),
    // Só colunas de contrato e @ público; sem cidade/estado.
    fetchAll(
      () =>
        c
          .from("dim_influenciador")
          .select("nome,tiktok_username,tier,status,data_inicio,data_fim,cache_fixo,custo_total"),
      "influenciadores",
    )
      .then((data) => ({ data, error: null as { message: string } | null }))
      .catch((e: Error) => ({
        data: [] as Record<string, unknown>[],
        error: { message: e.message },
      })),
    fetchAll(
      () =>
        c
          .from("fact_tiktok_conteudo_dia")
          .select("data,gmv,gmv_video,gmv_live,gmv_card,pedidos")
          .gte("data", de30)
          .lte("data", hoje)
          .order("data"),
      "tiktok conteudo",
    ),
  ]);
  const v = videos as Record<string, unknown>[];
  const sum = (k: string) =>
    (conteudo as Record<string, unknown>[]).reduce((s, r) => s + (Number(r[k]) || 0), 0);
  const ultimoDia = v.reduce((m, r) => (String(r["data"]) > m ? String(r["data"]) : m), "");
  // Referência = último dia com dado, para o "hoje" não ficar vazio quando a carga é D-1.
  const ref = ultimoDia || hoje;
  return {
    referencia: ref,
    videosEscalar: videosParaEscalar(v, ref),
    emAlta: creatorsEmAlta(v, ref),
    reativar: creatorsParaReativar(v, ref),
    semVenda: influenciadoresSemVenda((infl.data ?? []) as Record<string, unknown>[], v, ref),
    influenciadoresErro: infl.error?.message ?? null,
    mix30d: {
      gmv: sum("gmv"),
      video: sum("gmv_video"),
      live: sum("gmv_live"),
      card: sum("gmv_card"),
      pedidos: sum("pedidos"),
    },
  };
});
