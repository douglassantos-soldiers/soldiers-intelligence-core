// Google Ads e site (GA4): diagnóstico com views que JÁ existem no Supabase.
// benchmarks/google/ANALISE.md §4 (itens 1–7).
//
// Regras:
// - Receita do Google Ads é ATRIBUÍDA pelo Google; receita_shopify da view é a venda do Shopify ligada à
//   campanha. Nenhuma das duas se soma à receita realizada (cap. 13.2).
// - POAS = contribuição ÷ gasto. Aqui a contribuição é a margem bruta estimada sobre a receita atribuída
//   (receita × (1 − custo ÷ preço)), sem frete e taxas: serve para comparar produtos, não é lucro final.
// - HIPÓTESES: fatias de impressão podem vir em fração (0–1) ou % (escalaPct resolve); target_roas é razão
//   (4 = 400%); product_item_id do Google contém o ID da variante do Shopify (ex.: shopify_BR_<produto>_<variante>).

import { custoHistorico, custoNaData } from "@/lib/aggregate";
import { escalaPct } from "@/lib/amazon";

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const txt = (v: unknown) => String(v ?? "").trim();
const div = (a: number, b: number) => (b ? a / b : null);

// ---------------------------------------------------------------------------------------------
// Campanhas

export type CampanhaGoogle = {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  gasto: number;
  receitaGoogle: number;
  receitaShopify: number;
  roas: number | null;
  roasShopify: number | null;
  meta: number | null;
  parcelaImpressaoPct: number | null;
  perdaOrcamentoPct: number | null;
  perdaRankPct: number | null;
  optimizationScore: number | null;
  orcamentoDiario: number | null;
  gastoMedioDia: number | null;
  diagnostico: "orcamento" | "abaixo_meta" | "rank" | "ok";
};

export function campanhasGoogle(
  dias: Row[],
  lista: Row[],
  de: string,
  ate: string,
  { perdaMin = 20 } = {},
) {
  const info = new Map(lista.map((c) => [txt(c["campaign_id"]), c]));
  const r0 = dias.filter((r) => dia(r["data"]) >= de && dia(r["data"]) <= ate);
  const fIS = escalaPct(
    r0.flatMap((r) => [
      r["fatia_impressao"],
      r["fatia_perdida_orcamento"],
      r["fatia_perdida_rank"],
    ]),
  );
  const fOS = escalaPct(lista.map((c) => c["optimization_score"]));
  const m = new Map<
    string,
    {
      nome: string;
      tipo: string;
      gasto: number;
      rg: number;
      rs: number;
      imp: number;
      is: number;
      po: number;
      pr: number;
      wIs: number;
      dias: Set<string>;
    }
  >();
  for (const r of r0) {
    const id = txt(r["campaign_id"]);
    if (!id) continue;
    const cur = m.get(id) ?? {
      nome: txt(r["campaign_name"]) || id,
      tipo: txt(r["tipo"]),
      gasto: 0,
      rg: 0,
      rs: 0,
      imp: 0,
      is: 0,
      po: 0,
      pr: 0,
      wIs: 0,
      dias: new Set<string>(),
    };
    const imp = n(r["impressoes"]);
    cur.gasto += n(r["gasto"]);
    cur.rg += n(r["receita"]);
    cur.rs += n(r["receita_shopify"]);
    cur.imp += imp;
    cur.dias.add(dia(r["data"]));
    if (r["fatia_impressao"] != null) {
      const w = imp || 1;
      cur.is += n(r["fatia_impressao"]) * fIS * w;
      cur.po += n(r["fatia_perdida_orcamento"]) * fIS * w;
      cur.pr += n(r["fatia_perdida_rank"]) * fIS * w;
      cur.wIs += w;
    }
    m.set(id, cur);
  }
  const campanhas: CampanhaGoogle[] = [...m.entries()]
    .filter(([, x]) => x.gasto > 0)
    .map(([id, x]) => {
      const c = info.get(id);
      const roas = div(x.rg, x.gasto);
      const meta =
        c?.["target_roas"] == null || n(c["target_roas"]) === 0 ? null : n(c["target_roas"]);
      const po = x.wIs ? x.po / x.wIs : null;
      const pr = x.wIs ? x.pr / x.wIs : null;
      let diagnostico: CampanhaGoogle["diagnostico"] = "ok";
      if (po != null && po >= perdaMin && (meta == null || (roas != null && roas >= meta)))
        diagnostico = "orcamento";
      else if (meta != null && roas != null && roas < meta * 0.8) diagnostico = "abaixo_meta";
      else if (pr != null && pr >= perdaMin * 1.5) diagnostico = "rank";
      return {
        id,
        nome: txt(c?.["campaign_name"]) || x.nome,
        tipo: txt(c?.["tipo"]) || x.tipo || "—",
        status: txt(c?.["status"]),
        gasto: x.gasto,
        receitaGoogle: x.rg,
        receitaShopify: x.rs,
        roas,
        roasShopify: div(x.rs, x.gasto),
        meta,
        parcelaImpressaoPct: x.wIs ? x.is / x.wIs : null,
        perdaOrcamentoPct: po,
        perdaRankPct: pr,
        optimizationScore:
          c?.["optimization_score"] == null ? null : n(c["optimization_score"]) * fOS,
        orcamentoDiario: c?.["orcamento_diario"] == null ? null : n(c["orcamento_diario"]),
        gastoMedioDia: x.dias.size ? x.gasto / x.dias.size : null,
        diagnostico,
      };
    })
    .sort((a, b) => b.gasto - a.gasto);
  const gasto = campanhas.reduce((s, c) => s + c.gasto, 0);
  const rg = campanhas.reduce((s, c) => s + c.receitaGoogle, 0);
  const rs = campanhas.reduce((s, c) => s + c.receitaShopify, 0);
  return {
    gasto,
    receitaGoogle: rg,
    receitaShopify: rs,
    roas: div(rg, gasto),
    roasShopify: div(rs, gasto),
    campanhas,
  };
}

/**
 * Ritmo do dia: gasto de hoje (última captura de cada campanha) × orçamento diário, contra a fração do dia
 * já passada. acima = gastou 25 p.p. a mais que o tempo decorrido; abaixo = 25 p.p. a menos.
 */
export function ritmoIntraday(rows: Row[], lista: Row[], agora: Date = new Date()) {
  const hojeDado =
    rows
      .map((r) => dia(r["data"]))
      .sort()
      .at(-1) ?? null;
  if (!hojeDado)
    return {
      data: null,
      campanhas: [] as {
        nome: string;
        gasto: number;
        orcamento: number | null;
        pctGasto: number | null;
        pctDia: number;
        ritmo: "acima" | "abaixo" | "ok" | "sem_orcamento";
      }[],
    };
  const ultima = new Map<string, Row>();
  for (const r of rows) {
    if (dia(r["data"]) !== hojeDado) continue;
    const id = txt(r["campaign_id"]);
    const prev = ultima.get(id);
    if (!prev || txt(r["captured_at"]) > txt(prev["captured_at"])) ultima.set(id, r);
  }
  const info = new Map(lista.map((c) => [txt(c["campaign_id"]), c]));
  const capt = [...ultima.values()]
    .map((r) => txt(r["captured_at"]))
    .sort()
    .at(-1);
  const ref = capt ? new Date(capt) : agora;
  // Fração do dia em Brasília (UTC−3), pelo horário da última captura.
  const minutos = ((ref.getUTCHours() + 21) % 24) * 60 + ref.getUTCMinutes();
  const pctDia = (minutos / 1440) * 100;
  const campanhas = [...ultima.entries()]
    .map(([id, r]) => {
      const orc = info.get(id)?.["orcamento_diario"];
      const orcamento = orc == null || n(orc) === 0 ? null : n(orc);
      const gasto = n(r["gasto"]);
      const pctGasto = orcamento ? (gasto / orcamento) * 100 : null;
      const ritmo: "acima" | "abaixo" | "ok" | "sem_orcamento" =
        pctGasto == null
          ? "sem_orcamento"
          : pctGasto > pctDia + 25
            ? "acima"
            : pctGasto < pctDia - 25
              ? "abaixo"
              : "ok";
      return {
        nome: txt(info.get(id)?.["campaign_name"]) || txt(r["campaign_name"]) || id,
        gasto,
        orcamento,
        pctGasto,
        pctDia,
        ritmo,
      };
    })
    .filter((c) => c.gasto > 0 || c.orcamento)
    .sort((a, b) => b.gasto - a.gasto);
  return { data: hojeDado, capturado: capt ?? null, campanhas };
}

// ---------------------------------------------------------------------------------------------
// Produtos (Shopping / PMax) com margem

/** Tenta achar o SKU de um product_item_id do Google: igual ao SKU, ou pelo ID da variante do Shopify. */
export function skuDoItemGoogle(itemId: string, variantes: Row[]) {
  const id = itemId.trim();
  const porSku = new Map<string, Row>();
  const porVariante = new Map<string, Row>();
  for (const v of variantes) {
    const sku = txt(v["product_variant_sku"]) || txt(v["product_variant_inventory_item_sku"]);
    if (sku) porSku.set(sku.toLowerCase(), v);
    const vid = txt(v["product_variant_id"]).replace(/\D/g, "");
    if (vid) porVariante.set(vid, v);
  }
  const s = porSku.get(id.toLowerCase());
  if (s) return s;
  const numeros = id.match(/\d{6,}/g) ?? [];
  return numeros.length ? porVariante.get(numeros.at(-1)!) : undefined;
}

export function produtosGoogle(
  rows: Row[],
  variantes: Row[],
  custos: Row[],
  de: string,
  ate: string,
  { top = 60 } = {},
) {
  const hist = custoHistorico(custos);
  const m = new Map<
    string,
    { titulo: string; gasto: number; receita: number; conversoes: number; cliques: number }
  >();
  for (const r of rows) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    const id = txt(r["product_item_id"]);
    if (!id) continue;
    const cur = m.get(id) ?? {
      titulo: txt(r["product_title"]) || id,
      gasto: 0,
      receita: 0,
      conversoes: 0,
      cliques: 0,
    };
    cur.gasto += n(r["gasto"]);
    cur.receita += n(r["receita"]);
    cur.conversoes += n(r["conversoes"]);
    cur.cliques += n(r["cliques"]);
    m.set(id, cur);
  }
  let semVinculo = 0;
  const lista = [...m.entries()]
    .filter(([, x]) => x.gasto > 0)
    .map(([id, x]) => {
      const v = skuDoItemGoogle(id, variantes);
      const sku = v
        ? txt(v["product_variant_sku"]) || txt(v["product_variant_inventory_item_sku"])
        : "";
      const preco = v ? n(v["product_variant_price"]) : 0;
      const custo = sku ? custoNaData(hist, sku, ate) : undefined;
      if (!sku || !custo || !preco) semVinculo++;
      const margemPct = custo && preco ? Math.max(-100, (1 - custo.custo / preco) * 100) : null;
      const contribuicao = margemPct == null ? null : (x.receita * margemPct) / 100;
      const poas = contribuicao == null ? null : div(contribuicao, x.gasto);
      return {
        item: id,
        titulo: x.titulo,
        sku,
        gasto: x.gasto,
        receita: x.receita,
        conversoes: x.conversoes,
        roas: div(x.receita, x.gasto),
        margemPct,
        contribuicao: contribuicao == null ? null : contribuicao - x.gasto,
        poas,
        sinal:
          poas == null
            ? ("sem_custo" as const)
            : poas < 1
              ? ("prejuizo" as const)
              : poas >= 2
                ? ("escalar" as const)
                : ("ok" as const),
      };
    })
    .sort((a, b) => b.gasto - a.gasto);
  return {
    semVinculo,
    prejuizo: lista.filter((p) => p.sinal === "prejuizo"),
    lista: lista.slice(0, top),
  };
}

// ---------------------------------------------------------------------------------------------
// PMax assets

export function assetsPmax(rows: Row[], { top = 20 } = {}) {
  const grupos = new Map<
    string,
    { campanha: string; grupo: string; total: number; baixo: number; melhor: number }
  >();
  const baixos: { campanha: string; grupo: string; tipo: string; texto: string }[] = [];
  for (const r of rows) {
    if (/removed|paused/i.test(txt(r["status"]))) continue;
    const k = `${txt(r["campaign_id"])}|${txt(r["asset_group_id"])}`;
    const cur = grupos.get(k) ?? {
      campanha: txt(r["campaign_name"]),
      grupo: txt(r["asset_group_name"]),
      total: 0,
      baixo: 0,
      melhor: 0,
    };
    const label = txt(r["performance_label"]).toUpperCase();
    cur.total++;
    if (label === "LOW") {
      cur.baixo++;
      baixos.push({
        campanha: cur.campanha,
        grupo: cur.grupo,
        tipo: txt(r["field_type"]) || txt(r["asset_type"]),
        texto:
          txt(r["texto"]) ||
          (txt(r["youtube_video_id"]) ? `vídeo ${txt(r["youtube_video_id"])}` : "imagem"),
      });
    }
    if (label === "BEST") cur.melhor++;
    grupos.set(k, cur);
  }
  return {
    grupos: [...grupos.values()].sort((a, b) => b.baixo - a.baixo),
    baixos: baixos.slice(0, top),
    totalBaixos: baixos.length,
  };
}

// ---------------------------------------------------------------------------------------------
// Páginas do site (GA4 + pedidos Shopify)

export function paginasSite(
  sessoes: Row[],
  pedidos: Row[],
  paginas: Row[],
  de: string,
  ate: string,
  { sessoesMin = 300, top = 40 } = {},
) {
  const tipo = new Map(paginas.map((p) => [txt(p["pagina_path"]), p]));
  const m = new Map<
    string,
    { sessoes: number; checkout: number; pedidos: number; receita: number }
  >();
  const get = (path: string) => m.get(path) ?? { sessoes: 0, checkout: 0, pedidos: 0, receita: 0 };
  for (const r of sessoes) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    const path = txt(r["pagina_path"]);
    const cur = get(path);
    cur.sessoes += n(r["sessoes"]);
    cur.checkout += n(r["sessoes_checkout"]);
    m.set(path, cur);
  }
  for (const r of pedidos) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    const path = txt(r["pagina_path"]);
    const cur = get(path);
    cur.pedidos += n(r["pedidos"]);
    cur.receita += n(r["receita"]);
    m.set(path, cur);
  }
  const linhas = [...m.entries()].map(([path, x]) => {
    const p = tipo.get(path);
    return {
      path,
      rotulo: txt(p?.["rotulo"]) || path,
      tipo: txt(p?.["tipo"]) || "—",
      produto: txt(p?.["produto"]),
      ...x,
      conversaoPct: div(x.pedidos * 100, x.sessoes),
      checkoutPct: div(x.checkout * 100, x.sessoes),
      fechamentoPct: div(x.pedidos * 100, x.checkout),
      receitaPorSessao: div(x.receita, x.sessoes),
    };
  });
  const relevantes = linhas.filter((l) => l.sessoes >= sessoesMin);
  const meds = (k: "conversaoPct" | "fechamentoPct") => {
    const xs = relevantes
      .map((l) => l[k])
      .filter((v): v is number => v != null)
      .sort((a, b) => a - b);
    return xs.length ? xs[Math.floor((xs.length - 1) / 2)]! : null;
  };
  const medConv = meds("conversaoPct");
  const medFech = meds("fechamentoPct");
  const comProblema = relevantes
    .map((l) => {
      const problemas: string[] = [];
      if (medConv != null && l.conversaoPct != null && l.conversaoPct < medConv / 2)
        problemas.push("conversão abaixo da metade da mediana");
      if (
        medFech != null &&
        l.fechamentoPct != null &&
        l.checkout >= 30 &&
        l.fechamentoPct < medFech / 2
      )
        problemas.push("chega ao checkout e não fecha");
      return { ...l, problemas };
    })
    .sort((a, b) => b.sessoes - a.sessoes);
  const porTipo = new Map<
    string,
    { tipo: string; sessoes: number; pedidos: number; receita: number }
  >();
  for (const l of linhas) {
    const cur = porTipo.get(l.tipo) ?? { tipo: l.tipo, sessoes: 0, pedidos: 0, receita: 0 };
    cur.sessoes += l.sessoes;
    cur.pedidos += l.pedidos;
    cur.receita += l.receita;
    porTipo.set(l.tipo, cur);
  }
  return {
    medianaConversaoPct: medConv,
    porTipo: [...porTipo.values()]
      .map((t) => ({ ...t, conversaoPct: div(t.pedidos * 100, t.sessoes) }))
      .sort((a, b) => b.sessoes - a.sessoes),
    lista: comProblema.slice(0, top),
  };
}

// ---------------------------------------------------------------------------------------------
// Command Center

export type AlertaGoogle = {
  tipo: "problema" | "oportunidade";
  tag: string;
  tom: "danger" | "warn" | "success" | "primary";
  texto: string;
};

export function alertasGoogle(i: {
  campanhas: ReturnType<typeof campanhasGoogle>;
  produtos: ReturnType<typeof produtosGoogle>;
  termosNegativar: Row[];
  paginas: ReturnType<typeof paginasSite>;
}): AlertaGoogle[] {
  const out: AlertaGoogle[] = [];
  const brl = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
  const orc = i.campanhas.campanhas.filter((c) => c.diagnostico === "orcamento");
  if (orc.length)
    out.push({
      tipo: "oportunidade",
      tag: "Google Ads",
      tom: "primary",
      texto: `${orc.length} campanha(s) dentro da meta perdendo impressões por orçamento, como ${orc[0]!.nome}. Avaliar mais verba.`,
    });
  const meta = i.campanhas.campanhas.filter((c) => c.diagnostico === "abaixo_meta");
  if (meta.length)
    out.push({
      tipo: "problema",
      tag: "Google Ads",
      tom: "warn",
      texto: `${meta.length} campanha(s) com ROAS 20% abaixo da meta (${brl(meta.reduce((s, c) => s + c.gasto, 0))} investidos).`,
    });
  if (i.produtos.prejuizo.length)
    out.push({
      tipo: "problema",
      tag: "Google Shopping",
      tom: "danger",
      texto: `${i.produtos.prejuizo.length} produto(s) em que a margem bruta da venda atribuída não paga o anúncio (POAS < 1), como ${i.produtos.prejuizo[0]!.titulo}.`,
    });
  const desp = i.termosNegativar.reduce((s, t) => s + n(t["invest_desperdicado"]), 0);
  if (i.termosNegativar.length)
    out.push({
      tipo: "problema",
      tag: "Google termos",
      tom: "warn",
      texto: `${i.termosNegativar.length} termo(s) de busca sugeridos para negativar (${brl(desp)} sem retorno).`,
    });
  const pag = i.paginas.lista.filter((p) => p.problemas.length);
  if (pag.length)
    out.push({
      tipo: "problema",
      tag: "Site",
      tom: "warn",
      texto: `${pag.length} página(s) com muito tráfego e conversão baixa, como ${pag[0]!.rotulo}.`,
    });
  return out;
}
