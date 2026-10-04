// CRM 2.0 (benchmarks/rd-station-klaviyo/ANALISE.md §6). Só leitura, com objetos que JÁ existem no Supabase:
// mv_growth_cliente_perfil, mv_growth_recompra_acuracia, mv_growth_produto_ciclo, mv_growth_produto_proximo,
// rd_email_campanha, rd_automacao_dia, vw_rd_campanha_venda, vw_rd_utm_venda_dia, vw_rd_lead_dia, rd_lead,
// growth_acoes, growth_resultados e klaviyo_resgate_log.
//
// Regras:
// - LGPD: nenhuma função aqui recebe ou devolve e-mail, nome ou telefone. O cliente aparece só pela cliente_chave.
// - Receita ligada a e-mail (UTM/campanha) é receita ATRIBUÍDA: mostrar ao lado, nunca somar à receita do mês.
// - Abertura de e-mail é inflada por proteção de privacidade dos leitores; a decisão usa clique e receita.
// - Tudo é recomendação. Disparar e-mail ou mexer em segmento continua no RD/Klaviyo (Fase 3: Policy + Approval + Audit).

import { escalaPct } from "@/lib/amazon";

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const nn = (v: unknown) =>
  v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
const txt = (v: unknown) => String(v ?? "").trim();
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const div = (a: number, b: number) => (b ? a / b : null);
const pct = (a: number, b: number) => (b ? (a / b) * 100 : null);

// Limites de saúde de envio. Ajustáveis; os de spam seguem as regras públicas dos grandes provedores
// (manter reclamação abaixo de 0,3% e, de preferência, abaixo de 0,1%).
export const LIMITES_EMAIL = {
  bouncePct: 2,
  spamPct: 0.1,
  spamMaxPct: 0.3,
  descadastroPct: 0.5,
} as const;
// Quantos dias antes do ciclo mediano a régua sugere o lembrete de reposição.
export const ANTECEDENCIA_DIAS = 5;
// Diferença (pontos percentuais) entre previsto e realizado a partir da qual a previsão é "descalibrada".
export const TOLERANCIA_PP = 5;

// ---------------------------------------------------------------------------------------------
// 1. Fila de ação por cliente

export type ItemFila = {
  cliente: string;
  acao: string;
  chance30: number | null;
  chance90: number | null;
  valor90: number;
  diasSemComprar: number | null;
  ritmoDias: number | null;
  diasAtraso: number | null;
  produtoProvavel: string;
  skuProvavel: string;
  pedidos: number;
  ticket: number | null;
  canal: string;
  motivo: string;
};

export function motivoFila(r: {
  acao: string;
  diasAtraso: number | null;
  ritmoDias: number | null;
  diasSemComprar: number | null;
  pedidos: number;
}) {
  const sem = r.diasSemComprar != null ? `${Math.round(r.diasSemComprar)} dias sem comprar` : "";
  if (r.pedidos <= 1 && r.acao === "segunda_compra") return `1 pedido só${sem ? `, ${sem}` : ""}`;
  if (r.ritmoDias != null && r.diasAtraso != null && r.diasAtraso > 0)
    return `costuma voltar a cada ${Math.round(r.ritmoDias)} dias e está ${Math.round(r.diasAtraso)} dias atrasado`;
  if (r.ritmoDias != null && r.diasAtraso != null && r.diasAtraso <= 0)
    return `costuma voltar a cada ${Math.round(r.ritmoDias)} dias; janela abre em ${Math.round(-r.diasAtraso)} dias`;
  return sem || "—";
}

export function filaDeAcao(perfis: Row[], limite = 500) {
  const f = escalaPct(perfis.flatMap((r) => [r["chance_30"], r["chance_90"]]));
  const acionaveis = perfis.filter((r) =>
    r["acionavel"] == null
      ? txt(r["acao"]) !== "" && txt(r["acao"]) !== "aguardar"
      : r["acionavel"] === true,
  );
  const itens: ItemFila[] = acionaveis
    .map((r) => {
      const base = {
        acao: txt(r["acao"]),
        diasAtraso: nn(r["dias_atraso"]),
        ritmoDias: nn(r["ritmo_dias"]),
        diasSemComprar: nn(r["dias_ultima_compra"]),
        pedidos: n(r["pedidos"]),
      };
      const c30 = nn(r["chance_30"]);
      const c90 = nn(r["chance_90"]);
      return {
        ...base,
        cliente: txt(r["cliente_chave"]),
        chance30: c30 == null ? null : c30 * f,
        chance90: c90 == null ? null : c90 * f,
        valor90: n(r["valor_esperado_90"]),
        produtoProvavel: txt(r["produto_provavel"]) || txt(r["produto_principal"]),
        skuProvavel: txt(r["sku_provavel"]) || txt(r["sku_principal"]),
        ticket: nn(r["ticket_medio"]),
        canal: txt(r["canal_ultimo"]),
        motivo: motivoFila(base),
      };
    })
    .filter((i) => i.cliente)
    .sort((a, b) => b.valor90 - a.valor90);
  const porAcao = new Map<string, { acao: string; clientes: number; valor90: number }>();
  for (const i of itens) {
    const cur = porAcao.get(i.acao) ?? { acao: i.acao, clientes: 0, valor90: 0 };
    cur.clientes++;
    cur.valor90 += i.valor90;
    porAcao.set(i.acao, cur);
  }
  return {
    total: itens.length,
    valor90: itens.reduce((s, i) => s + i.valor90, 0),
    porAcao: [...porAcao.values()].sort((a, b) => b.valor90 - a.valor90),
    itens: itens.slice(0, limite),
  };
}

// ---------------------------------------------------------------------------------------------
// 2. Confiabilidade da previsão (previsto × realizado)

export type FaixaCalibracao = {
  horizonte: number;
  faixa: string;
  clientes: number;
  previsto: number | null;
  realizado: number | null;
  desvioPp: number | null;
  leitura: "calibrada" | "otimista" | "conservadora" | "sem dado";
};

export function calibracao(rows: Row[]) {
  const f = escalaPct(rows.flatMap((r) => [r["previsto_pct"], r["realizado_pct"]]));
  const faixas: FaixaCalibracao[] = rows
    .map((r) => {
      const p = nn(r["previsto_pct"]);
      const re = nn(r["realizado_pct"]);
      const previsto = p == null ? null : p * f;
      const realizado = re == null ? null : re * f;
      const desvioPp = previsto != null && realizado != null ? realizado - previsto : null;
      const leitura: FaixaCalibracao["leitura"] =
        desvioPp == null
          ? "sem dado"
          : desvioPp < -TOLERANCIA_PP
            ? "otimista"
            : desvioPp > TOLERANCIA_PP
              ? "conservadora"
              : "calibrada";
      return {
        horizonte: n(r["horizonte_dias"]),
        faixa: txt(r["faixa"]),
        clientes: n(r["clientes"]),
        previsto,
        realizado,
        desvioPp,
        leitura,
      };
    })
    .sort((a, b) => a.horizonte - b.horizonte || a.faixa.localeCompare(b.faixa));
  const horizontes = [...new Set(faixas.map((x) => x.horizonte))].map((h) => {
    const fx = faixas.filter((x) => x.horizonte === h && x.desvioPp != null);
    const cli = fx.reduce((s, x) => s + x.clientes, 0);
    // Erro médio absoluto ponderado por clientes: quanto, em média, a chance prevista erra.
    const erro = cli ? fx.reduce((s, x) => s + Math.abs(x.desvioPp!) * x.clientes, 0) / cli : null;
    const previsto = cli ? fx.reduce((s, x) => s + x.previsto! * x.clientes, 0) / cli : null;
    const realizado = cli ? fx.reduce((s, x) => s + x.realizado! * x.clientes, 0) / cli : null;
    return { horizonte: h, clientes: cli, erroMedioPp: erro, previsto, realizado };
  });
  return { faixas, horizontes };
}

// ---------------------------------------------------------------------------------------------
// 3. Régua de reposição por SKU

export type Regua = {
  sku: string;
  produto: string;
  clientes: number;
  recompras: number;
  cicloMediano: number;
  lembreteDia: number;
  retorno30: number | null;
  retorno60: number | null;
  retorno90: number | null;
  repete: { forca: number | null; ocorrencias: number } | null;
  proximo: { sku: string; produto: string; forca: number | null; ocorrencias: number } | null;
};

export function reguaReposicao(ciclos: Row[], proximos: Row[], minClientes = 30): Regua[] {
  const f = escalaPct(
    ciclos.flatMap((r) => [r["pct_retorno_30"], r["pct_retorno_60"], r["pct_retorno_90"]]),
  );
  const fp = escalaPct(proximos.map((r) => r["forca_pct"]));
  const porOrigem = new Map<string, Row[]>();
  for (const p of proximos) {
    const k = txt(p["sku_origem"]);
    if (!k) continue;
    porOrigem.set(k, [...(porOrigem.get(k) ?? []), p]);
  }
  const forca = (r: Row) => (nn(r["forca_pct"]) == null ? null : nn(r["forca_pct"])! * fp);
  return ciclos
    .filter(
      (r) =>
        txt(r["sku"]) &&
        nn(r["ciclo_mediano"]) != null &&
        n(r["ciclo_mediano"]) > 0 &&
        n(r["clientes"]) >= minClientes,
    )
    .map((r) => {
      const sku = txt(r["sku"]);
      const ciclo = Math.round(n(r["ciclo_mediano"]));
      const lista = [...(porOrigem.get(sku) ?? [])].sort(
        (a, b) => n(b["ocorrencias"]) - n(a["ocorrencias"]),
      );
      const mesmo = lista.find((p) => txt(p["sku_seguinte"]) === sku);
      const outro = lista.find((p) => txt(p["sku_seguinte"]) && txt(p["sku_seguinte"]) !== sku);
      const r30 = nn(r["pct_retorno_30"]);
      const r60 = nn(r["pct_retorno_60"]);
      const r90 = nn(r["pct_retorno_90"]);
      return {
        sku,
        produto: txt(r["produto"]) || sku,
        clientes: n(r["clientes"]),
        recompras: n(r["recompras"]),
        cicloMediano: ciclo,
        lembreteDia: Math.max(1, ciclo - ANTECEDENCIA_DIAS),
        retorno30: r30 == null ? null : r30 * f,
        retorno60: r60 == null ? null : r60 * f,
        retorno90: r90 == null ? null : r90 * f,
        repete: mesmo ? { forca: forca(mesmo), ocorrencias: n(mesmo["ocorrencias"]) } : null,
        proximo: outro
          ? {
              sku: txt(outro["sku_seguinte"]),
              produto: txt(outro["produto_seguinte"]) || txt(outro["sku_seguinte"]),
              forca: forca(outro),
              ocorrencias: n(outro["ocorrencias"]),
            }
          : null,
      };
    })
    .sort((a, b) => b.clientes - a.clientes);
}

// ---------------------------------------------------------------------------------------------
// 4. E-mail (RD): receita por e-mail entregue e saúde de envio

export type CampanhaEmail = {
  id: string;
  nome: string;
  data: string;
  contatos: number;
  entregues: number;
  cliques: number;
  bounces: number;
  spam: number;
  descadastros: number;
  pedidos: number;
  receita: number;
  receitaPorMilEntregues: number | null;
  cliquePct: number | null;
  aberturaPct: number | null;
  bouncePct: number | null;
  spamPct: number | null;
  descadastroPct: number | null;
  alertas: string[];
};

function saudeEnvio(x: {
  contatos: number;
  entregues: number;
  bounces: number;
  spam: number;
  descadastros: number;
}) {
  const bouncePct = pct(x.bounces, x.contatos || x.entregues + x.bounces);
  const spamPct = pct(x.spam, x.entregues);
  const descadastroPct = pct(x.descadastros, x.entregues);
  const alertas: string[] = [];
  if (bouncePct != null && bouncePct > LIMITES_EMAIL.bouncePct) alertas.push("bounce alto");
  if (spamPct != null && spamPct > LIMITES_EMAIL.spamPct)
    alertas.push(spamPct > LIMITES_EMAIL.spamMaxPct ? "spam acima do limite" : "spam em atenção");
  if (descadastroPct != null && descadastroPct > LIMITES_EMAIL.descadastroPct)
    alertas.push("descadastro alto");
  return { bouncePct, spamPct, descadastroPct, alertas };
}

export function emailRD(campanhas: Row[], vendas: Row[], de: string, ate: string) {
  const vend = new Map<string, { pedidos: number; receita: number }>();
  for (const v of vendas) {
    const d = dia(v["data"]);
    if (d && (d < de || d > ate)) continue;
    const k = txt(v["campaign_id"]);
    const cur = vend.get(k) ?? { pedidos: 0, receita: 0 };
    cur.pedidos += n(v["pedidos"]);
    cur.receita += n(v["receita"]);
    vend.set(k, cur);
  }
  const lista: CampanhaEmail[] = campanhas
    .map((c) => ({ c, d: dia(c["enviado_em"]) || dia(c["data"]) }))
    .filter(({ d }) => d >= de && d <= ate)
    .map(({ c, d }) => {
      const id = txt(c["campaign_id"]);
      const base = {
        contatos: n(c["contatos"]),
        entregues: n(c["entregues"]),
        bounces: n(c["bounces"]),
        spam: n(c["spam"]),
        descadastros: n(c["descadastros"]),
      };
      const v = vend.get(id) ?? { pedidos: 0, receita: 0 };
      const s = saudeEnvio(base);
      return {
        id,
        nome: txt(c["nome"]) || `Campanha ${id}`,
        data: d,
        ...base,
        cliques: n(c["cliques"]),
        pedidos: v.pedidos,
        receita: v.receita,
        receitaPorMilEntregues: base.entregues ? (v.receita / base.entregues) * 1000 : null,
        cliquePct: pct(n(c["cliques"]), base.entregues),
        aberturaPct: pct(n(c["aberturas"]), base.entregues),
        ...s,
      };
    })
    .sort((a, b) => b.data.localeCompare(a.data));
  const t = (k: keyof CampanhaEmail) => lista.reduce((s, c) => s + n(c[k]), 0);
  const tot = {
    contatos: t("contatos"),
    entregues: t("entregues"),
    bounces: t("bounces"),
    spam: t("spam"),
    descadastros: t("descadastros"),
  };
  const receita = t("receita");
  return {
    campanhas: lista,
    total: {
      campanhas: lista.length,
      ...tot,
      cliques: t("cliques"),
      pedidos: t("pedidos"),
      receita,
      receitaPorMilEntregues: tot.entregues ? (receita / tot.entregues) * 1000 : null,
      cliquePct: pct(t("cliques"), tot.entregues),
      ...saudeEnvio(tot),
    },
  };
}

export function automacoesRD(rows: Row[], de: string, ate: string) {
  const m = new Map<
    string,
    {
      fluxo: string;
      contatos: number;
      entregues: number;
      aberturas: number;
      cliques: number;
      bounces: number;
      spam: number;
      descadastros: number;
    }
  >();
  for (const r of rows) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    const k = txt(r["fluxo"]) || "(sem nome)";
    const cur = m.get(k) ?? {
      fluxo: k,
      contatos: 0,
      entregues: 0,
      aberturas: 0,
      cliques: 0,
      bounces: 0,
      spam: 0,
      descadastros: 0,
    };
    cur.contatos += n(r["contatos"]);
    cur.entregues += n(r["entregues"]);
    cur.aberturas += n(r["aberturas"]);
    cur.cliques += n(r["cliques"]);
    cur.bounces += n(r["bounces"]);
    cur.descadastros += n(r["descadastros"]);
    m.set(k, cur);
  }
  return [...m.values()]
    .map((x) => ({ ...x, cliquePct: pct(x.cliques, x.entregues), ...saudeEnvio(x) }))
    .sort((a, b) => b.entregues - a.entregues);
}

// Venda com UTM de e-mail: quanto está ligado a uma campanha do RD e quanto ficou solto (UTM sem campanha).
export function utmEmail(rows: Row[], de: string, ate: string) {
  const r0 = rows.filter((r) => dia(r["data"]) >= de && dia(r["data"]) <= ate);
  const soma = (f: (r: Row) => boolean) => ({
    pedidos: r0.filter(f).reduce((s, r) => s + n(r["pedidos"]), 0),
    receita: r0.filter(f).reduce((s, r) => s + n(r["receita"]), 0),
  });
  const ligada = soma((r) => r["ligada_campanha"] === true);
  const solta = soma((r) => r["ligada_campanha"] !== true);
  const porUtm = new Map<string, { utm: string; pedidos: number; receita: number }>();
  for (const r of r0.filter((x) => x["ligada_campanha"] !== true)) {
    const k = txt(r["utm_campaign"]) || "(vazio)";
    const cur = porUtm.get(k) ?? { utm: k, pedidos: 0, receita: 0 };
    cur.pedidos += n(r["pedidos"]);
    cur.receita += n(r["receita"]);
    porUtm.set(k, cur);
  }
  return {
    ligada,
    solta,
    pctLigada: pct(ligada.receita, ligada.receita + solta.receita),
    soltasTop: [...porUtm.values()].sort((a, b) => b.receita - a.receita).slice(0, 10),
  };
}

// ---------------------------------------------------------------------------------------------
// 5. Funil de leads → cliente

export function funilLeads(leadDia: Row[], leads: Row[], de: string, ate: string) {
  const ld = leadDia.filter((r) => dia(r["data"]) >= de && dia(r["data"]) <= ate);
  const m = new Map<
    string,
    { origem: string; leads: number; compraram: number; receita: number }
  >();
  for (const r of ld) {
    const k = txt(r["origem"]) || "(sem origem)";
    const cur = m.get(k) ?? { origem: k, leads: 0, compraram: 0, receita: 0 };
    cur.leads += n(r["leads"]);
    cur.compraram += n(r["leads_compraram"]);
    cur.receita += n(r["receita_leads"]);
    m.set(k, cur);
  }
  const porOrigem = [...m.values()]
    .map((x) => ({
      ...x,
      conversaoPct: pct(x.compraram, x.leads),
      receitaPorLead: div(x.receita, x.leads),
    }))
    .sort((a, b) => b.leads - a.leads);
  const novos = leads.filter((r) => dia(r["criado_em"]) >= de && dia(r["criado_em"]) <= ate);
  const conta = (k: string) => {
    const c = new Map<string, number>();
    for (const r of novos) {
      const v = txt(r[k]) || "(vazio)";
      c.set(v, (c.get(v) ?? 0) + 1);
    }
    return [...c.entries()]
      .map(([nome, qtd]) => ({ nome, qtd, pct: pct(qtd, novos.length) }))
      .sort((a, b) => b.qtd - a.qtd);
  };
  const totLeads = porOrigem.reduce((s, x) => s + x.leads, 0);
  const totCompraram = porOrigem.reduce((s, x) => s + x.compraram, 0);
  return {
    leads: totLeads,
    compraram: totCompraram,
    conversaoPct: pct(totCompraram, totLeads),
    receita: porOrigem.reduce((s, x) => s + x.receita, 0),
    porOrigem,
    novosCadastrados: novos.length,
    porEstagio: conta("estagio"),
    porFonte: conta("utm_source").slice(0, 10),
    porConversao: conta("conversao").slice(0, 10),
  };
}

// ---------------------------------------------------------------------------------------------
// 6a. Ações de growth: o que foi decidido, quem faz, até quando e o que deu

// Os valores de status não estão documentados no banco; estes padrões tratam como "fechada"
// tudo que pareça concluído, cancelado ou descartado.
const FECHADA = /conclu|feit|done|cancel|descart|arquiv/i;

export type AcaoGrowth = {
  id: string;
  titulo: string;
  canal: string;
  status: string;
  fechada: boolean;
  responsavel: string;
  prazo: string;
  atrasada: boolean;
  prioridade: number | null;
  impacto: number | null;
  esforco: string;
  resultado: {
    resultado: string;
    antes: number | null;
    depois: number | null;
    variacaoPct: number | null;
    quando: string;
    observacao: string;
  } | null;
};

export function acoesGrowth(acoes: Row[], resultados: Row[], hoje: string) {
  const ult = new Map<string, Row>();
  for (const r of resultados) {
    const k = txt(r["acao_id"]);
    const cur = ult.get(k);
    if (!cur || txt(r["registrado_em"]) > txt(cur["registrado_em"])) ult.set(k, r);
  }
  const itens: AcaoGrowth[] = acoes.map((a) => {
    const id = txt(a["id"]);
    const status = txt(a["status"]);
    const fechada = FECHADA.test(status);
    const prazo = dia(a["prazo"]);
    const r = ult.get(id);
    const antes = r ? nn(r["metrica_antes"]) : null;
    const depois = r ? nn(r["metrica_depois"]) : null;
    return {
      id,
      titulo: txt(a["titulo"]),
      canal: txt(a["canal"]),
      status,
      fechada,
      responsavel: txt(a["responsavel"]),
      prazo,
      atrasada: !fechada && !!prazo && prazo < hoje,
      prioridade: nn(a["prioridade"]),
      impacto: nn(a["impacto_estimado"]),
      esforco: txt(a["esforco"]),
      resultado: r
        ? {
            resultado: txt(r["resultado"]),
            antes,
            depois,
            variacaoPct:
              antes != null && depois != null && antes !== 0
                ? ((depois - antes) / Math.abs(antes)) * 100
                : null,
            quando: dia(r["registrado_em"]),
            observacao: txt(r["observacao"]),
          }
        : null,
    };
  });
  itens.sort(
    (a, b) =>
      Number(a.fechada) - Number(b.fechada) ||
      Number(b.atrasada) - Number(a.atrasada) ||
      (a.prioridade ?? 99) - (b.prioridade ?? 99) ||
      (a.prazo || "9999").localeCompare(b.prazo || "9999"),
  );
  const abertas = itens.filter((i) => !i.fechada);
  return {
    itens,
    abertas: abertas.length,
    atrasadas: abertas.filter((i) => i.atrasada).length,
    semResponsavel: abertas.filter((i) => !i.responsavel).length,
    fechadasSemResultado: itens.filter((i) => i.fechada && !i.resultado).length,
    comResultado: itens.filter((i) => i.resultado).length,
  };
}

// ---------------------------------------------------------------------------------------------
// 6b. Saúde do envio de segmentos ao Klaviyo (klaviyo_resgate_log)

export type SaudeKlaviyo = {
  status: "sem dados" | "ok" | "falhando" | "parado";
  ultimaExecucao: string | null;
  ultimoOk: string | null;
  horasDesdeOk: number | null;
  falhasSeguidas: number;
  execucoes7d: number;
  falhas7d: number;
  perfis: number | null;
  ultimoErro: string;
  execucoes: {
    quando: string;
    modo: string;
    ok: boolean;
    http: number | null;
    perfis: number | null;
    erro: string;
  }[];
};

export function saudeKlaviyo(log: Row[], agoraIso: string, horasParado = 48): SaudeKlaviyo {
  const agora = Date.parse(agoraIso);
  const ex = [...log]
    .map((r) => ({
      quando: txt(r["executado_em"]),
      modo: txt(r["modo"]),
      ok: r["ok"] === true,
      http: nn(r["http_status"]),
      perfis: nn(r["perfis_no_segmento"]),
      erro: txt(r["erro"]),
    }))
    .filter((e) => e.quando)
    .sort((a, b) => b.quando.localeCompare(a.quando));
  if (!ex.length)
    return {
      status: "sem dados",
      ultimaExecucao: null,
      ultimoOk: null,
      horasDesdeOk: null,
      falhasSeguidas: 0,
      execucoes7d: 0,
      falhas7d: 0,
      perfis: null,
      ultimoErro: "",
      execucoes: [],
    };
  let falhasSeguidas = 0;
  for (const e of ex) {
    if (e.ok) break;
    falhasSeguidas++;
  }
  const ok = ex.find((e) => e.ok) ?? null;
  const horasDesdeOk = ok ? (agora - Date.parse(ok.quando)) / 3600000 : null;
  const horasDesdeUltima = (agora - Date.parse(ex[0]!.quando)) / 3600000;
  const sete = ex.filter((e) => agora - Date.parse(e.quando) <= 7 * 86400000);
  const status: SaudeKlaviyo["status"] =
    falhasSeguidas > 0 ? "falhando" : horasDesdeUltima > horasParado ? "parado" : "ok";
  return {
    status,
    ultimaExecucao: ex[0]!.quando,
    ultimoOk: ok?.quando ?? null,
    horasDesdeOk,
    falhasSeguidas,
    execucoes7d: sete.length,
    falhas7d: sete.filter((e) => !e.ok).length,
    perfis: ok?.perfis ?? null,
    ultimoErro: ex.find((e) => !e.ok)?.erro ?? "",
    execucoes: ex.slice(0, 15),
  };
}

// ---------------------------------------------------------------------------------------------
// Alertas do CRM para o Command Center

export type AlertaCRM = {
  tipo: "problema" | "oportunidade";
  tag: string;
  tom: "danger" | "warn" | "success" | "primary";
  texto: string;
};

export function alertasCRM(i: {
  klaviyo: SaudeKlaviyo;
  email: ReturnType<typeof emailRD>["total"] | null;
  calibracao: ReturnType<typeof calibracao> | null;
  acoes: ReturnType<typeof acoesGrowth> | null;
  regua: Regua[];
}): AlertaCRM[] {
  const out: AlertaCRM[] = [];
  const f1 = (v: number) => v.toFixed(1).replace(".", ",");
  if (i.klaviyo.status === "falhando")
    out.push({
      tipo: "problema",
      tag: "Klaviyo",
      tom: "danger",
      texto: `Envio de segmento ao Klaviyo falhou nas últimas ${i.klaviyo.falhasSeguidas} execução(ões)${i.klaviyo.ultimoErro ? `: ${i.klaviyo.ultimoErro.slice(0, 80)}` : ""}. Os fluxos lá rodam com lista velha.`,
    });
  if (i.klaviyo.status === "parado")
    out.push({
      tipo: "problema",
      tag: "Klaviyo",
      tom: "warn",
      texto: "Nenhum envio de segmento ao Klaviyo nas últimas 48 horas.",
    });
  const e = i.email;
  if (e && e.spamPct != null && e.spamPct > LIMITES_EMAIL.spamPct)
    out.push({
      tipo: "problema",
      tag: "E-mail",
      tom: e.spamPct > LIMITES_EMAIL.spamMaxPct ? "danger" : "warn",
      texto: `Reclamação de spam em ${f1(e.spamPct)}% dos e-mails entregues (limite recomendado 0,1%). Revise lista e frequência.`,
    });
  if (e && e.bouncePct != null && e.bouncePct > LIMITES_EMAIL.bouncePct)
    out.push({
      tipo: "problema",
      tag: "E-mail",
      tom: "warn",
      texto: `Bounce em ${f1(e.bouncePct)}% dos envios. Limpe contatos inválidos antes do próximo disparo.`,
    });
  const otimista = (i.calibracao?.faixas ?? []).filter(
    (f) => f.leitura === "otimista" && f.clientes >= 50,
  );
  if (otimista.length) {
    const pior = [...otimista].sort((a, b) => (a.desvioPp ?? 0) - (b.desvioPp ?? 0))[0]!;
    out.push({
      tipo: "problema",
      tag: "Previsão",
      tom: "warn",
      texto: `A chance de recompra está otimista: na faixa ${pior.faixa} (${pior.horizonte} dias) previu ${f1(pior.previsto ?? 0)}% e voltaram ${f1(pior.realizado ?? 0)}%. Ler "valor esperado" com desconto.`,
    });
  }
  if (i.acoes && i.acoes.atrasadas)
    out.push({
      tipo: "problema",
      tag: "Growth",
      tom: "warn",
      texto: `${i.acoes.atrasadas} ação(ões) de growth com prazo vencido.`,
    });
  if (i.acoes && i.acoes.fechadasSemResultado)
    out.push({
      tipo: "problema",
      tag: "Growth",
      tom: "warn",
      texto: `${i.acoes.fechadasSemResultado} ação(ões) concluída(s) sem resultado registrado. Sem isso não se sabe o que funcionou.`,
    });
  const topo = i.regua.find((r) => r.retorno90 != null && r.retorno90 >= 20);
  if (topo)
    out.push({
      tipo: "oportunidade",
      tag: "Reposição",
      tom: "success",
      texto: `${topo.produto}: ${Math.round(topo.retorno90!)}% voltam em 90 dias, ciclo de ${topo.cicloMediano} dias. Lembrete no dia ${topo.lembreteDia} após a compra.`,
    });
  return out;
}
