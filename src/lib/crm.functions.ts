// Leituras da Soldiers Platform — CRM: visão geral e CRM 2.0 (fila de ação, e-mail, leads, Klaviyo).
// Somente leitura de objetos JÁ EXISTENTES no Supabase. data.functions.ts reexporta as server functions.
import { hojeSP } from "@/lib/datas";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  filaDeAcao,
  calibracao,
  reguaReposicao,
  emailRD,
  automacoesRD,
  utmEmail,
  funilLeads,
  acoesGrowth,
  saudeKlaviyo,
  alertasCRM,
} from "@/lib/crm";
import { db, fetchAll } from "@/lib/db-helpers";

const Periodo = z.object({
  de: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const getCrm = createServerFn({ method: "GET" }).handler(async () => {
  const c = await db();
  const [meses, rfm, acoes, ltv, origem, cohort] = await Promise.all([
    c.from("mv_growth_mes").select("*").order("mes"),
    c.from("mv_growth_rfm_segmento").select("*"),
    c.from("mv_growth_acao_resumo").select("*"),
    c.from("mv_growth_ltv_canal").select("*"),
    c.from("mv_growth_origem_canal").select("*"),
    // Safra × mês pode passar de 1.000 linhas: paginado.
    fetchAll(
      () =>
        c
          .from("mv_growth_cohort_mes")
          .select("safra,mes_offset,clientes_safra,clientes,receita")
          .order("safra"),
      "cohort",
      20000,
    )
      .then((data) => ({ data }))
      .catch(() => ({ data: [] })),
  ]);
  return {
    meses: meses.data ?? [],
    rfm: rfm.data ?? [],
    acoes: acoes.data ?? [],
    ltv: ltv.data ?? [],
    origem: origem.data ?? [],
    cohort: cohort.data ?? [],
  } as Record<string, Record<string, unknown>[]>;
});

/* ---------------- CRM 2.0 ----------------
 * benchmarks/rd-station-klaviyo/ANALISE.md §6. Só leitura. LGPD: nenhuma coluna de e-mail, nome ou telefone
 * é selecionada aqui (rd_lead.email_hash e rd_automacao_dia.email ficam de fora). */
const COLS_FILA =
  "cliente_chave,acao,acionavel,chance_30,chance_90,valor_esperado_90,dias_ultima_compra,dias_atraso,ritmo_dias,produto_provavel,sku_provavel,produto_principal,sku_principal,pedidos,ticket_medio,canal_ultimo";

export async function dadosCrm(data: { de: string; ate: string }) {
  const c = await db();
  const erros: Record<string, string> = {};
  const safe = async (nome: string, p: Promise<Record<string, unknown>[]>) => {
    try {
      return await p;
    } catch (e) {
      erros[nome] = e instanceof Error ? e.message : String(e);
      return [] as Record<string, unknown>[];
    }
  };
  const agora = new Date().toISOString();
  const hoje = hojeSP();
  const [
    perfis,
    acuracia,
    ciclos,
    proximos,
    campanhas,
    vendasCamp,
    automacoes,
    utm,
    leadDia,
    leads,
    acoes,
    resultados,
    klaviyo,
  ] = await Promise.all([
    // Os 1.000 clientes acionáveis de maior valor esperado (a fila é para agir, não para listar a base toda).
    safe(
      "fila",
      fetchAll(
        () =>
          c
            .from("mv_growth_cliente_perfil")
            .select(COLS_FILA)
            .eq("acionavel", true)
            .order("valor_esperado_90", { ascending: false }),
        "crm fila",
        1000,
        { tetoIntencional: true },
      ),
    ),
    safe(
      "acuracia",
      fetchAll(
        () =>
          c
            .from("mv_growth_recompra_acuracia")
            .select("horizonte_dias,faixa,clientes,previsto_pct,realizado_pct,gerado_em"),
        "crm acuracia",
      ),
    ),
    safe(
      "ciclos",
      fetchAll(
        () =>
          c
            .from("mv_growth_produto_ciclo")
            .select(
              "sku,produto,clientes,compras,recompras,ciclo_mediano,pct_retorno_30,pct_retorno_60,pct_retorno_90",
            ),
        "crm ciclos",
      ),
    ),
    safe(
      "proximos",
      fetchAll(
        () =>
          c
            .from("mv_growth_produto_proximo")
            .select("sku_origem,sku_seguinte,produto_seguinte,ocorrencias,forca_pct,pos"),
        "crm proximos",
      ),
    ),
    safe(
      "campanhas",
      fetchAll(
        () =>
          c
            .from("rd_email_campanha")
            .select(
              "campaign_id,nome,data,enviado_em,contatos,entregues,aberturas,cliques,bounces,spam,descadastros,descartados",
            )
            .gte("data", data.de)
            .lte("data", data.ate),
        "rd campanhas",
      ),
    ),
    safe(
      "vendasCampanha",
      fetchAll(
        () =>
          c
            .from("vw_rd_campanha_venda")
            .select("campaign_id,data,pedidos,receita")
            .gte("data", data.de)
            .lte("data", data.ate),
        "rd campanha venda",
      ),
    ),
    safe(
      "automacoes",
      fetchAll(
        () =>
          c
            .from("rd_automacao_dia")
            .select("data,fluxo,acao_id,contatos,entregues,aberturas,cliques,bounces,descadastros")
            .gte("data", data.de)
            .lte("data", data.ate),
        "rd automacoes",
        60000,
      ),
    ),
    safe(
      "utm",
      fetchAll(
        () =>
          c
            .from("vw_rd_utm_venda_dia")
            .select("data,utm_campaign,ligada_campanha,pedidos,receita")
            .gte("data", data.de)
            .lte("data", data.ate),
        "rd utm",
      ),
    ),
    safe(
      "leadDia",
      fetchAll(
        () =>
          c
            .from("vw_rd_lead_dia")
            .select("data,origem,leads,leads_compraram,receita_leads")
            .gte("data", data.de)
            .lte("data", data.ate),
        "rd lead dia",
      ),
    ),
    safe(
      "leads",
      fetchAll(
        () =>
          c
            .from("rd_lead")
            .select("criado_em,estagio,conversao,utm_source,utm_medium,utm_campaign")
            .gte("criado_em", data.de)
            .lte("criado_em", data.ate + "T23:59:59"),
        "rd leads",
        60000,
      ),
    ),
    safe(
      "acoes",
      fetchAll(
        () =>
          c
            .from("growth_acoes")
            .select(
              "id,titulo,canal,status,responsavel,prazo,prioridade,impacto_estimado,esforco,criada_em",
            ),
        "growth acoes",
      ),
    ),
    safe(
      "resultados",
      fetchAll(
        () =>
          c
            .from("growth_resultados")
            .select("acao_id,resultado,metrica_antes,metrica_depois,observacao,registrado_em"),
        "growth resultados",
      ),
    ),
    safe(
      "klaviyo",
      fetchAll(
        () =>
          c
            .from("klaviyo_resgate_log")
            .select("executado_em,modo,ok,http_status,perfis_no_segmento,erro")
            .order("executado_em", { ascending: false }),
        "klaviyo log",
        200,
      ),
    ),
  ]);
  const cal = calibracao(acuracia);
  const regua = reguaReposicao(ciclos, proximos);
  const email = emailRD(campanhas, vendasCamp, data.de, data.ate);
  const ac = acoesGrowth(acoes, resultados, hoje);
  const kl = saudeKlaviyo(klaviyo, agora);
  return {
    fila: filaDeAcao(perfis),
    calibracao: cal,
    geradoEm: String(acuracia[0]?.["gerado_em"] ?? ""),
    regua,
    email,
    automacoes: automacoesRD(automacoes, data.de, data.ate),
    utm: utmEmail(utm, data.de, data.ate),
    leads: funilLeads(leadDia, leads, data.de, data.ate),
    acoes: ac,
    klaviyo: kl,
    alertas: alertasCRM({
      klaviyo: kl,
      email: campanhas.length ? email.total : null,
      calibracao: acuracia.length ? cal : null,
      acoes: acoes.length ? ac : null,
      regua,
    }),
    erros,
  };
}

export const getCrmAcao = createServerFn({ method: "GET" })
  .inputValidator((d) => Periodo.parse(d))
  .handler(async ({ data }) => dadosCrm(data));
