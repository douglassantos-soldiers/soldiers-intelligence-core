// Leitura do Fechamento de comissões (/affiliate/fechamento). Só leitura; nada é pago ou alterado por aqui.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, fetchAll } from "@/lib/db-helpers";
import {
  fechamentoMes,
  resumoFechamento,
  porCreator,
  exportPagamento,
  conferencia,
  linhasPlanilha,
  melhorBaseCupom,
  alertasFechamento,
  limitesDoMes,
  BASES_CUPOM,
  BASE_PADRAO,
} from "@/lib/fechamento";

type Rows = Record<string, unknown>[];

/** Mês anterior ao de hoje (o fechamento é sempre do mês que acabou). */
export const mesAnterior = (hoje = new Date()) => {
  const d = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - 1, 1));
  return d.toISOString().slice(0, 7);
};

export async function dadosFechamento(p: { mes: string; base: (typeof BASES_CUPOM)[number] }) {
  const c = await db();
  const erros: Record<string, string> = {};
  let migracaoPendente = false;
  const safe = async (nome: string, pr: Promise<Rows>, opcional = false) => {
    try {
      return await pr;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (opcional && /does not exist|não existe|schema cache|Could not find/i.test(msg))
        migracaoPendente = true;
      else erros[nome] = msg;
      return [] as Rows;
    }
  };
  const { de, ate } = limitesDoMes(p.mes);
  const [influenciadores, upAfiliados, upMes, cuponsSite, videos, planilha] = await Promise.all([
    // Só cupom, @ público, % e nome público (sem cidade/estado).
    safe(
      "influenciadores",
      fetchAll(
        () => c.from("dim_influenciador").select("nome,cupom,tiktok_username,comissao_pct"),
        "influenciadores",
      ),
    ),
    safe(
      "upAfiliados",
      fetchAll(
        () => c.from("vw_up_afiliado").select("uppromote_id,nome,cupom,comissao_pct"),
        "uppromote",
      ),
    ),
    safe(
      "upMes",
      fetchAll(
        () =>
          c
            .from("vw_up_afiliado_mes")
            .select("uppromote_id,mes,receita")
            .gte("mes", de)
            .lte("mes", ate),
        "uppromote mes",
      ),
    ),
    safe(
      "cuponsSite",
      fetchAll(
        () =>
          c
            .from("vw_site_cupom_dia")
            .select(`data,cupom,${BASES_CUPOM.join(",")}`)
            .gte("data", de)
            .lte("data", ate),
        "cupons site",
        60000,
      ),
    ),
    safe(
      "videosTikTok",
      fetchAll(
        () =>
          c
            .from("fact_tiktok_video_dia")
            .select("data,criador,gmv")
            .gte("data", de)
            .lte("data", ate),
        "tiktok videos",
        150000,
      ),
    ),
    safe(
      "planilha",
      fetchAll(
        () =>
          c
            .from("vw_affiliate_fechamento_planilha_atual")
            .select(
              "competencia,registro,cupom,tiktok_username,comissao_pct,venda_cupom,venda_up,venda_considerada,venda_tiktok,total,comissao,carregado_em",
            )
            .eq("competencia", de),
        "planilha",
      ),
      true,
    ),
  ]);
  const linhas = fechamentoMes(
    { influenciadores, upAfiliados, upMes, cuponsSite, videos },
    p.mes,
    p.base,
  );
  const plan = linhasPlanilha(planilha, p.mes);
  const conf = plan.length ? conferencia(linhas, plan) : null;
  return {
    mes: p.mes,
    base: p.base,
    resumo: resumoFechamento(linhas),
    linhas: linhas.slice(0, 1500),
    creators: porCreator(linhas).slice(0, 500),
    pagamento: exportPagamento(linhas, p.mes, conf),
    conferencia: conf,
    basesCupom: plan.length ? melhorBaseCupom(cuponsSite, plan, p.mes) : [],
    planilhaCarregadaEm: plan[0] ? String(plan[0]["carregado_em"] ?? "") : "",
    migracaoPendente,
    alertas: alertasFechamento(linhas, conf),
    erros,
  };
}

export const getFechamento = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        mes: z
          .string()
          .regex(/^\d{4}-\d{2}$/)
          .default(mesAnterior()),
        base: z.enum(BASES_CUPOM).default(BASE_PADRAO),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => dadosFechamento(data));
