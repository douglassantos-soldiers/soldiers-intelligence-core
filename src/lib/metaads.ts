// Meta Ads e metas do mês, com views que JÁ existem no Supabase.
// benchmarks/meta-ads/ANALISE.md §4.
//
// Atenção ao nome: no banco, "meta" aparece com dois sentidos.
// - Meta Ads (a plataforma): vw_meta_criativos, vw_meta_fadiga, vw_meta_publicos, vw_meta_funil,
//   vw_meta_intraday, vw_meta_kpi_dia, vw_reconciliacao_shopify_meta_dia.
// - Meta = objetivo do mês: metas, meta_curva_dia e vw_meta_vs_real_dia (meta × realizado por canal).
//
// Regras: receita informada pelo Meta é REPORTADA pela plataforma; a receita com UTM do Meta é a venda do
// Shopify ligada ao Meta. Nunca somar com a receita realizada (cap. 13.2). Só leitura e recomendação.

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const txt = (v: unknown) => String(v ?? "").trim();
const div = (a: number, b: number) => (b ? a / b : null);

// ---------------------------------------------------------------------------------------------
// Meta Ads × Shopify (reconciliação)

export function reconciliacaoMeta(rows: Row[], de: string, ate: string) {
  const r0 = rows
    .filter((r) => dia(r["data"]) >= de && dia(r["data"]) <= ate)
    .sort((a, b) => dia(a["data"]).localeCompare(dia(b["data"])));
  const s = (k: string) => r0.reduce((t, r) => t + n(r[k]), 0);
  const gasto = s("gasto_meta");
  const receitaInformada = s("receita_informada_meta");
  const receitaUtm = s("receita_meta_utm");
  const comprasInformadas = s("compras_informadas_meta");
  const pedidosUtm = s("pedidos_meta_utm");
  const enviados = s("enviados_meta");
  const pedidosTotais = s("pedidos_totais");
  return {
    gasto,
    receitaInformada,
    receitaUtm,
    comprasInformadas,
    pedidosUtm,
    enviados,
    pedidosTotais,
    roasInformado: div(receitaInformada, gasto),
    roasUtm: div(receitaUtm, gasto),
    /** Quantas vezes a receita que o Meta informa é maior que a venda com UTM do Meta. */
    inflacao: div(receitaInformada, receitaUtm),
    /** Pedidos do Shopify que chegaram ao Meta como evento (cobertura do envio de conversões). */
    coberturaEnvioPct: div(enviados * 100, pedidosTotais),
    dias: r0.map((r) => ({
      data: dia(r["data"]),
      gasto: n(r["gasto_meta"]),
      roasInformado: div(n(r["receita_informada_meta"]), n(r["gasto_meta"])),
      roasUtm: div(n(r["receita_meta_utm"]), n(r["gasto_meta"])),
      coberturaPct: div(n(r["enviados_meta"]) * 100, n(r["pedidos_totais"])),
    })),
  };
}

// ---------------------------------------------------------------------------------------------
// Criativos

export function criativosMeta(criativos: Row[], fadiga: Row[], formatos: Row[], { top = 15 } = {}) {
  const lista = criativos
    .map((c) => ({
      criativo: txt(c["criativo"]) || txt(c["titulo"]),
      titulo: txt(c["titulo"]),
      campanha: txt(c["campanha"]),
      publico: txt(c["publico"]),
      invest: n(c["invest"]),
      receita: n(c["receita"]),
      roas: c["roas"] == null ? div(n(c["receita"]), n(c["invest"])) : n(c["roas"]),
      ctrPct: c["ctr_pct"] == null ? null : n(c["ctr_pct"]),
      hookPct: c["hook_pct"] == null ? null : n(c["hook_pct"]),
      frequencia: c["frequencia"] == null ? null : n(c["frequencia"]),
      compras: n(c["compras"]),
      sugestao: txt(c["sugestao"]),
    }))
    .filter((c) => c.invest > 0);
  const invest = lista.reduce((s, c) => s + c.invest, 0);
  const receita = lista.reduce((s, c) => s + c.receita, 0);
  const roasMedio = div(receita, invest);
  const relevantes = lista.filter((c) => invest && c.invest >= invest * 0.02);
  return {
    roasMedio,
    melhores: [...relevantes]
      .filter((c) => c.roas != null)
      .sort((a, b) => (b.roas ?? 0) - (a.roas ?? 0))
      .slice(0, top),
    piores: [...relevantes]
      .filter((c) => roasMedio != null && c.roas != null && c.roas < roasMedio * 0.5)
      .sort((a, b) => b.invest - a.invest)
      .slice(0, top),
    lista: lista.sort((a, b) => b.invest - a.invest).slice(0, 60),
    fadiga: fadiga
      .map((f) => ({
        criativo: txt(f["criativo"]),
        publico: txt(f["publico"]),
        diagnostico: txt(f["diagnostico"]),
        freq7d: f["freq_7d"] == null ? null : n(f["freq_7d"]),
        freqAnt: f["freq_ant"] == null ? null : n(f["freq_ant"]),
        roas7d: f["roas_7d"] == null ? null : n(f["roas_7d"]),
        roasAnt: f["roas_ant"] == null ? null : n(f["roas_ant"]),
        invest7d: n(f["invest_7d"]),
      }))
      .filter((f) => f.diagnostico && !/^ok$|saud|est[aá]vel|normal/i.test(f.diagnostico))
      .sort((a, b) => b.invest7d - a.invest7d),
    formatos: formatos
      .map((f) => ({
        formato: txt(f["formato"]) || "—",
        criativos: n(f["criativos"]),
        invest: n(f["invest"]),
        receita: n(f["receita"]),
        roas: f["roas"] == null ? null : n(f["roas"]),
        ctrPct: f["ctr_pct"] == null ? null : n(f["ctr_pct"]),
      }))
      .sort((a, b) => b.invest - a.invest),
  };
}

// ---------------------------------------------------------------------------------------------
// Segmentos (públicos, posicionamento, demografia, horário)

type Seg = {
  rotulo: string;
  invest: number;
  receita: number;
  roas: number | null;
  ctrPct: number | null;
  sinal: "forte" | "fraco" | "neutro";
};

function segmentos(rows: Row[], rotulo: (r: Row) => string): Seg[] {
  const base = rows.map((r) => ({
    rotulo: rotulo(r) || "—",
    invest: n(r["invest"]),
    receita: n(r["receita"]),
    roas: r["roas"] == null ? div(n(r["receita"]), n(r["invest"])) : n(r["roas"]),
    ctrPct: r["ctr_pct"] == null ? null : n(r["ctr_pct"]),
  }));
  const invest = base.reduce((s, x) => s + x.invest, 0);
  const media = div(
    base.reduce((s, x) => s + x.receita, 0),
    invest,
  );
  return base
    .filter((x) => x.invest > 0)
    .map((x) => ({
      ...x,
      sinal:
        media == null || x.roas == null || x.invest < invest * 0.03
          ? ("neutro" as const)
          : x.roas >= media * 1.3
            ? ("forte" as const)
            : x.roas <= media * 0.7
              ? ("fraco" as const)
              : ("neutro" as const),
    }))
    .sort((a, b) => b.invest - a.invest);
}

export function segmentosMeta(
  publicos: Row[],
  posicionamento: Row[],
  demografia: Row[],
  horario: Row[],
) {
  return {
    publicos: segmentos(publicos, (r) =>
      [txt(r["publico"]), txt(r["grupo"])].filter(Boolean).join(" · "),
    ),
    posicionamento: segmentos(posicionamento, (r) =>
      [txt(r["plataforma"]), txt(r["posicionamento"]), txt(r["dispositivo"])]
        .filter(Boolean)
        .join(" · "),
    ),
    demografia: segmentos(demografia, (r) =>
      [txt(r["faixa_idade"]), txt(r["genero"])].filter(Boolean).join(" · "),
    ),
    horario: segmentos(horario, (r) => (r["hora"] == null ? "" : `${n(r["hora"])}h`)).sort(
      (a, b) => parseInt(a.rotulo) - parseInt(b.rotulo),
    ),
  };
}

export function funilMeta(rows: Row[]) {
  return rows
    .map((r) => ({
      ord: n(r["ord"]),
      etapa: txt(r["etapa"]),
      valor: n(r["valor"]),
      passagem: txt(r["taxa_passagem"]),
      cpa: r["cpa"] == null ? null : n(r["cpa"]),
    }))
    .sort((a, b) => a.ord - b.ord);
}

// ---------------------------------------------------------------------------------------------
// Ritmo do dia (conta)

/**
 * Gasto de hoje até a última captura, projetado para o dia inteiro pela fração do dia passada (Brasília),
 * contra a média diária dos últimos 7 dias fechados.
 */
export function ritmoMeta(intraday: Row[], kpiDia: Row[]) {
  const hoje =
    intraday
      .map((r) => dia(r["data"]))
      .sort()
      .at(-1) ?? null;
  if (!hoje) return null;
  const ult = intraday
    .filter((r) => dia(r["data"]) === hoje)
    .sort((a, b) => txt(a["captured_at"]).localeCompare(txt(b["captured_at"])))
    .at(-1)!;
  const ref = new Date(txt(ult["captured_at"]) || `${hoje}T15:00:00Z`);
  const minutos = ((ref.getUTCHours() + 21) % 24) * 60 + ref.getUTCMinutes();
  const pctDia = Math.max(1, (minutos / 1440) * 100);
  const fechados = kpiDia
    .filter((r) => dia(r["data"]) < hoje)
    .sort((a, b) => dia(b["data"]).localeCompare(dia(a["data"])))
    .slice(0, 7);
  const mediaDia = fechados.length
    ? fechados.reduce((s, r) => s + n(r["gasto"]), 0) / fechados.length
    : null;
  const mediaRoas = div(
    fechados.reduce((s, r) => s + n(r["receita"]), 0),
    fechados.reduce((s, r) => s + n(r["gasto"]), 0),
  );
  const gasto = n(ult["gasto"]);
  const projecao = (gasto / pctDia) * 100;
  return {
    data: hoje,
    capturado: txt(ult["captured_at"]) || null,
    gasto,
    receita: n(ult["receita"]),
    roas: div(n(ult["receita"]), gasto),
    pctDia,
    projecao,
    mediaDia,
    mediaRoas,
    ritmo:
      mediaDia == null
        ? ("sem_base" as const)
        : projecao > mediaDia * 1.25
          ? ("acima" as const)
          : projecao < mediaDia * 0.75
            ? ("abaixo" as const)
            : ("ok" as const),
  };
}

// ---------------------------------------------------------------------------------------------
// Metas do mês (meta = objetivo) × realizado, por canal

/**
 * vw_meta_vs_real_dia: receita_meta = objetivo do dia (curva), receita_real = realizado.
 * Projeção do mês = realizado até hoje × (meta do mês ÷ meta até hoje).
 * HIPÓTESE: receita_meta já distribui a meta mensal pela curva (peso); dia_futuro marca os dias ainda por vir.
 */
export function metasDoMes(rows: Row[], mes: string) {
  const r0 = rows.filter(
    (r) =>
      txt(r["mes"]).slice(0, 7) === mes.slice(0, 7) ||
      dia(r["data"]).slice(0, 7) === mes.slice(0, 7),
  );
  const m = new Map<
    string,
    {
      canal: string;
      metaMes: number;
      metaAteHoje: number;
      realAteHoje: number;
      adsMetaMes: number;
      adsReal: number;
      provisorio: boolean;
    }
  >();
  for (const r of r0) {
    const canal = txt(r["canal"]) || "Total";
    const cur = m.get(canal) ?? {
      canal,
      metaMes: 0,
      metaAteHoje: 0,
      realAteHoje: 0,
      adsMetaMes: 0,
      adsReal: 0,
      provisorio: false,
    };
    cur.metaMes += n(r["receita_meta"]);
    cur.adsMetaMes += n(r["ads_meta"]);
    if (r["dia_futuro"] !== true) {
      cur.metaAteHoje += n(r["receita_meta"]);
      cur.realAteHoje += n(r["receita_real"]);
      cur.adsReal += n(r["ads_real"]);
      if (r["dado_provisorio"] === true) cur.provisorio = true;
    }
    m.set(canal, cur);
  }
  return [...m.values()]
    .map((c) => {
      const projecao = c.metaAteHoje ? c.realAteHoje * (c.metaMes / c.metaAteHoje) : null;
      return {
        ...c,
        atingimentoPct: div(c.realAteHoje * 100, c.metaAteHoje),
        projecao,
        projecaoPct: projecao == null ? null : div(projecao * 100, c.metaMes),
      };
    })
    .filter((c) => c.metaMes > 0 || c.realAteHoje > 0)
    .sort((a, b) => b.metaMes - a.metaMes);
}

// ---------------------------------------------------------------------------------------------
// Command Center

export type AlertaMeta = {
  tipo: "problema" | "oportunidade";
  tag: string;
  tom: "danger" | "warn" | "success" | "primary";
  texto: string;
};

export function alertasMeta(i: {
  recon: ReturnType<typeof reconciliacaoMeta>;
  criativos: ReturnType<typeof criativosMeta>;
  ritmo: ReturnType<typeof ritmoMeta>;
}): AlertaMeta[] {
  const out: AlertaMeta[] = [];
  const brl = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
  if (i.criativos.fadiga.length)
    out.push({
      tipo: "problema",
      tag: "Meta criativos",
      tom: "warn",
      texto: `${i.criativos.fadiga.length} criativo(s) com sinal de fadiga (${brl(i.criativos.fadiga.reduce((s, f) => s + f.invest7d, 0))} nos últimos 7 dias), como ${i.criativos.fadiga[0]!.criativo}.`,
    });
  if (i.recon.coberturaEnvioPct != null && i.recon.coberturaEnvioPct < 80)
    out.push({
      tipo: "problema",
      tag: "Meta eventos",
      tom: "danger",
      texto: `Só ${Math.round(i.recon.coberturaEnvioPct)}% dos pedidos chegaram ao Meta como evento. O Meta otimiza com menos sinal do que tem.`,
    });
  if (i.recon.inflacao != null && i.recon.inflacao > 1.5)
    out.push({
      tipo: "problema",
      tag: "Meta atribuição",
      tom: "warn",
      texto: `O Meta informa ${i.recon.inflacao.toFixed(1).replace(".", ",")}× a venda com UTM do Meta. Decidir verba olhando as duas.`,
    });
  if (i.ritmo?.ritmo === "acima")
    out.push({
      tipo: "problema",
      tag: "Meta ritmo",
      tom: "warn",
      texto: `Gasto de hoje projetado em ${brl(i.ritmo.projecao)}, acima da média de ${brl(i.ritmo.mediaDia ?? 0)} por dia.`,
    });
  if (i.criativos.melhores.length)
    out.push({
      tipo: "oportunidade",
      tag: "Meta criativos",
      tom: "success",
      texto: `Melhor criativo do período: ${i.criativos.melhores[0]!.criativo} (ROAS ${(i.criativos.melhores[0]!.roas ?? 0).toFixed(1).replace(".", ",")}×). Avaliar variações e mais verba.`,
    });
  return out;
}
