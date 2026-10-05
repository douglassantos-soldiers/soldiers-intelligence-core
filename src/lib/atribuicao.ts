// Attribution Engine v1 (Plano Mestre cap. 13.2): separa receita REALIZADA, REPORTADA pelas plataformas,
// ATRIBUÍDA por UTM (último clique do site) e de AFILIADOS, sem somar uma com a outra. A receita incremental
// não é medida (precisa de grupo de controle) e aparece como lacuna.
// Objetos que JÁ existem: vw_receita_consolidada, vw_site_origem_dia, vw_reconciliacao_shopify_meta_dia
// e config_atribuicao_site (modelo registrado, com início de vigência).

import { reconciliacaoMeta } from "@/lib/metaads";

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const nn = (v: unknown) =>
  v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
const txt = (v: unknown) => String(v ?? "").trim();
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const pct = (a: number, b: number) => (b ? (a / b) * 100 : null);

export type LinhaAtribuicao = {
  canal: string;
  realizada: number;
  reportadaAds: number;
  afiliados: number | null;
  investAds: number;
  investAfiliados: number;
  reportadaPct: number | null;
  semAtribuicao: number | null;
  sobreposicao: boolean;
};

/**
 * Por canal de venda. Afiliados = afiliado_pct × faturamento (afiliado_pct é a fatia da venda via afiliado).
 * "Sem atribuição" = realizada − Ads − afiliados; se der negativo, as fontes se sobrepõem (contam a mesma venda).
 */
export function atribuicaoPorCanal(rows: Row[], de: string, ate: string): LinhaAtribuicao[] {
  const m = new Map<
    string,
    { real: number; ads: number; afil: number; temAfil: boolean; inv: number; invAf: number }
  >();
  for (const r of rows) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    const k = txt(r["canal"]) || "(sem canal)";
    const cur = m.get(k) ?? { real: 0, ads: 0, afil: 0, temAfil: false, inv: 0, invAf: 0 };
    const fat = n(r["faturamento"]);
    cur.real += fat;
    cur.ads += n(r["receita_ads"]);
    const ap = nn(r["afiliado_pct"]);
    if (ap != null) {
      cur.afil += (fat * ap) / 100;
      cur.temAfil = true;
    }
    cur.inv += n(r["invest_ads"]);
    cur.invAf += n(r["invest_afiliados"]);
    m.set(k, cur);
  }
  return [...m.entries()]
    .map(([canal, x]) => {
      const afiliados = x.temAfil ? x.afil : null;
      const resto = x.real - x.ads - (afiliados ?? 0);
      return {
        canal,
        realizada: x.real,
        reportadaAds: x.ads,
        afiliados,
        investAds: x.inv,
        investAfiliados: x.invAf,
        reportadaPct: pct(x.ads + (afiliados ?? 0), x.real),
        semAtribuicao: resto >= 0 ? resto : null,
        sobreposicao: resto < 0,
      };
    })
    .filter((l) => l.realizada > 0 || l.reportadaAds > 0)
    .sort((a, b) => b.realizada - a.realizada);
}

/** Site por origem (UTM, último clique): cada pedido tem uma origem só, então a soma bate com a venda do site. */
export function siteUtm(rows: Row[], de: string, ate: string) {
  const m = new Map<string, { origem: string; receita: number; pedidos: number }>();
  for (const r of rows) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    const k = txt(r["origem"]) || "(sem origem)";
    const cur = m.get(k) ?? { origem: k, receita: 0, pedidos: 0 };
    cur.receita += n(r["faturamento_liquido"]);
    cur.pedidos += n(r["pedidos"]);
    m.set(k, cur);
  }
  const tot = [...m.values()].reduce((s, x) => s + x.receita, 0);
  return {
    total: tot,
    origens: [...m.values()]
      .map((x) => ({ ...x, sharePct: pct(x.receita, tot) }))
      .sort((a, b) => b.receita - a.receita),
  };
}

export type PlataformaVsUtm = {
  plataforma: string;
  informada: number;
  utm: number;
  razao: number | null;
};

/** O que a plataforma diz × o que o Shopify mostra com UTM dela. Hoje só o Meta tem as duas pontas no banco. */
export function plataformasVsUtm(reconMeta: Row[], de: string, ate: string): PlataformaVsUtm[] {
  const r = reconciliacaoMeta(reconMeta, de, ate);
  if (!r.gasto && !r.receitaInformada && !r.receitaUtm) return [];
  return [
    {
      plataforma: "Meta Ads",
      informada: r.receitaInformada,
      utm: r.receitaUtm,
      razao: r.receitaUtm ? r.receitaInformada / r.receitaUtm : null,
    },
  ];
}

export type Modelo = { chave: string; inicio: string; obs: string; vigente: boolean };

/** Modelos de atribuição registrados, com o vigente marcado (o de início mais recente até hoje, por chave). */
export function modelosRegistrados(rows: Row[], hoje: string): Modelo[] {
  const lista = rows
    .map((r) => ({ chave: txt(r["chave"]), inicio: dia(r["inicio"]), obs: txt(r["obs"]) }))
    .filter((x) => x.chave)
    .sort((a, b) => b.inicio.localeCompare(a.inicio));
  const vistos = new Set<string>();
  return lista.map((x) => {
    const vigente = x.inicio <= hoje && !vistos.has(x.chave);
    if (vigente) vistos.add(x.chave);
    return { ...x, vigente };
  });
}

export function resumoAtribuicao(canais: LinhaAtribuicao[]) {
  const s = (k: "realizada" | "reportadaAds" | "investAds" | "investAfiliados") =>
    canais.reduce((t, c) => t + c[k], 0);
  const afil = canais.reduce((t, c) => t + (c.afiliados ?? 0), 0);
  const realizada = s("realizada");
  return {
    realizada,
    reportadaAds: s("reportadaAds"),
    afiliados: afil,
    investAds: s("investAds"),
    investAfiliados: s("investAfiliados"),
    // MER: receita realizada ÷ todo o investimento de aquisição. Única razão que não depende de atribuição.
    mer:
      s("investAds") + s("investAfiliados")
        ? realizada / (s("investAds") + s("investAfiliados"))
        : null,
    canaisComSobreposicao: canais.filter((c) => c.sobreposicao).map((c) => c.canal),
  };
}

export type AlertaCanal = {
  tipo: "problema" | "oportunidade";
  tag: string;
  tom: "danger" | "warn" | "success" | "primary";
  texto: string;
};

export function alertasAtribuicao(i: {
  canais: LinhaAtribuicao[];
  plataformas: PlataformaVsUtm[];
  site: ReturnType<typeof siteUtm>;
  realizadaSite: number | null;
}): AlertaCanal[] {
  const out: AlertaCanal[] = [];
  for (const c of i.canais.filter((x) => x.sobreposicao))
    out.push({
      tipo: "problema",
      tag: "Atribuição",
      tom: "warn",
      texto: `No ${c.canal}, Ads e afiliados somados passam de 100% da venda real: as fontes contam a mesma venda.`,
    });
  for (const p of i.plataformas)
    if (p.razao != null && p.razao > 2)
      out.push({
        tipo: "problema",
        tag: "Atribuição",
        tom: "warn",
        texto: `${p.plataforma} informa ${p.razao.toFixed(1).replace(".", ",")}× a venda com UTM dele no Shopify.`,
      });
  const semOrigem = i.site.origens.find((o) =>
    /sem origem|direto|direct|\(none\)|none/i.test(o.origem),
  );
  if (semOrigem && (semOrigem.sharePct ?? 0) > 40)
    out.push({
      tipo: "problema",
      tag: "Atribuição",
      tom: "warn",
      texto: `${Math.round(semOrigem.sharePct ?? 0)}% da venda do site está sem origem (${semOrigem.origem}). Conferir UTMs.`,
    });
  if (i.realizadaSite && i.site.total) {
    const cob = (i.site.total / i.realizadaSite) * 100;
    if (cob < 90 || cob > 110)
      out.push({
        tipo: "problema",
        tag: "Atribuição",
        tom: "warn",
        texto: `A venda do site por origem soma ${Math.round(cob)}% da venda realizada do site. Conferir a carga de UTMs.`,
      });
  }
  return out;
}
