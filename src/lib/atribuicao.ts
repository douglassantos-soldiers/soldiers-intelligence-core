// Attribution Engine v1 (Plano Mestre cap. 13.2): separa receita REALIZADA, REPORTADA pelas plataformas,
// ATRIBUÍDA por UTM (último clique do site) e de AFILIADOS, sem somar uma com a outra. A receita incremental
// não é medida (precisa de grupo de controle) e aparece como lacuna.
// Objetos que JÁ existem: vw_receita_consolidada, vw_site_origem_dia, vw_reconciliacao_shopify_meta_dia
// config_atribuicao_site (modelo registrado, com início de vigência), vw_ads_funil_canal_dia (receita que
// cada plataforma de Ads informa) e vw_site_pedido_origem_dia (pedidos do site por utm_source / utm_medium).

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

// ---------------------------------------------------------------------------------------------
// Plataforma × UTM (site) × venda do canal (marketplaces). Cap. 13.2: cada número na sua coluna.

/** Classifica utm_source / utm_medium do pedido do site. [HIPÓTESE] valores livres; regra por palavra. */
export function fonteUtm(source: unknown, medium: unknown): string {
  const s = txt(source).toLowerCase();
  const m = txt(medium).toLowerCase();
  if (!s && !m) return "Sem UTM";
  if (/facebook|^fb\b|instagram|^ig\b|^meta\b/.test(s)) return "Meta Ads";
  if (/google|youtube|gads|adwords/.test(s))
    return /organic/.test(m) ? "Google orgânico" : "Google Ads";
  if (/tiktok/.test(s)) return /organic/.test(m) ? "TikTok orgânico" : "TikTok Ads";
  if (/klaviyo|^rd\b|rdstation|e-?mail|newsletter|whatsapp/.test(s + " " + m)) return "CRM";
  if (/influ|afiliad|creator|parceir/.test(s + " " + m)) return "Influência / afiliados";
  if (/bing|microsoft/.test(s)) return "Bing";
  return "Outras";
}

/** Plataforma de Ads a partir do canal de vw_ads_funil_canal_dia. */
export function plataformaDe(canal: unknown): { chave: string; nome: string; destino: Destino } {
  const s = txt(canal)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/meta|facebook|instagram/.test(s))
    return { chave: "meta", nome: "Meta Ads", destino: "site" };
  if (/google|gads|youtube/.test(s))
    return { chave: "google", nome: "Google Ads", destino: "site" };
  if (/tiktok/.test(s))
    return { chave: "tiktok", nome: "TikTok Ads", destino: "site + TikTok Shop" };
  if (/mercado ?livre|meli|^ml\b/.test(s))
    return { chave: "mercado_livre", nome: "Mercado Livre Ads", destino: "marketplace" };
  if (/amazon/.test(s)) return { chave: "amazon", nome: "Amazon Ads", destino: "marketplace" };
  if (/shopee/.test(s)) return { chave: "shopee", nome: "Shopee Ads", destino: "marketplace" };
  return { chave: s || "outro", nome: txt(canal) || "Outro", destino: "marketplace" };
}

/** Canal de venda (vw_receita_consolidada.canal) → chave da plataforma que anuncia nele. */
const canalVenda = (canal: unknown) => {
  const s = txt(canal)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/mercado ?livre|meli|^ml\b/.test(s)) return "mercado_livre";
  if (/amazon/.test(s)) return "amazon";
  if (/shopee/.test(s)) return "shopee";
  if (/tiktok/.test(s)) return "tiktok";
  return "";
};

export type Destino = "site" | "marketplace" | "site + TikTok Shop";

export type PlataformaVsUtm = {
  chave: string;
  plataforma: string;
  destino: Destino;
  invest: number | null;
  /** Receita que a plataforma atribui a si (janela dela). */
  informada: number;
  /** Venda do site com UTM da plataforma (último clique). null quando a plataforma não vende no site. */
  utm: number | null;
  pedidosUtm: number | null;
  /** informada ÷ UTM. */
  razao: number | null;
  /** Venda realizada do marketplace onde a plataforma anuncia. null para site. */
  realizadaCanal: number | null;
  /** informada ÷ venda do canal: quanto da venda do marketplace a plataforma reivindica. */
  fatiaCanalPct: number | null;
  roasInformado: number | null;
  roasUtm: number | null;
  leitura: string;
  tom: "success" | "warn" | "danger" | "muted" | "primary";
};

export const LIMITES_PLATAFORMA = {
  razaoAlta: 2, // informa 2× o que o site vê com UTM
  razaoBaixa: 0.8, // UTM vê mais do que a plataforma (conversão perdida no pixel/CAPI)
  fatiaAlta: 60, // plataforma reivindica 60%+ da venda do marketplace
  investMinimo: 300,
} as const;

function leituraDe(
  p: Omit<PlataformaVsUtm, "leitura" | "tom">,
): Pick<PlataformaVsUtm, "leitura" | "tom"> {
  const L = LIMITES_PLATAFORMA;
  if (p.fatiaCanalPct != null && p.fatiaCanalPct > 100)
    return { leitura: "informa mais que a venda do canal", tom: "danger" };
  if (
    p.destino !== "marketplace" &&
    (p.invest ?? 0) >= L.investMinimo &&
    p.utm === 0 &&
    !p.realizadaCanal
  )
    return { leitura: "sem UTM no site", tom: "danger" };
  if (p.razao != null && p.razao > L.razaoAlta)
    return {
      leitura: `informa ${p.razao.toFixed(1).replace(".", ",")}× o que o site vê`,
      tom: "warn",
    };
  if (p.razao != null && p.razao < L.razaoBaixa)
    return { leitura: "site vê mais que a plataforma", tom: "warn" };
  if (p.fatiaCanalPct != null && p.fatiaCanalPct >= L.fatiaAlta)
    return { leitura: "reivindica quase toda a venda", tom: "warn" };
  if (p.razao == null && p.fatiaCanalPct == null)
    return { leitura: "sem contraparte", tom: "muted" };
  return { leitura: "dentro do esperado", tom: "success" };
}

/**
 * O que cada plataforma diz × o que a venda mostra.
 * - Site (Meta, Google, TikTok): venda do Shopify com utm_source da plataforma (vw_site_pedido_origem_dia).
 *   No Meta, a reconciliação pronta (vw_reconciliacao_shopify_meta_dia) tem prioridade.
 * - Marketplaces (ML, Amazon, Shopee) e TikTok Shop: não há UTM; a contraparte é a venda realizada do canal.
 * Sem `extra`, devolve só o Meta (compatível com a v1).
 */
export function plataformasVsUtm(
  reconMeta: Row[],
  de: string,
  ate: string,
  extra?: { funil: Row[]; utmSite: Row[]; consolidada: Row[] },
): PlataformaVsUtm[] {
  const r = reconciliacaoMeta(reconMeta, de, ate);
  const noPeriodo = (x: Row) => {
    const d = dia(x["data"]);
    return d >= de && d <= ate;
  };
  // Plataformas pelo funil de Ads
  const plat = new Map<
    string,
    { nome: string; destino: Destino; invest: number; informada: number }
  >();
  for (const x of (extra?.funil ?? []).filter(noPeriodo)) {
    const p = plataformaDe(x["canal"]);
    const cur = plat.get(p.chave) ?? { nome: p.nome, destino: p.destino, invest: 0, informada: 0 };
    cur.invest += n(x["invest"]);
    cur.informada += n(x["receita_ads"]);
    plat.set(p.chave, cur);
  }
  // UTM do site por plataforma
  const utm = new Map<string, { receita: number; pedidos: number }>();
  for (const x of (extra?.utmSite ?? []).filter(noPeriodo)) {
    const f = fonteUtm(x["utm_source"], x["utm_medium"]);
    const k =
      f === "Meta Ads"
        ? "meta"
        : f === "Google Ads"
          ? "google"
          : f === "TikTok Ads"
            ? "tiktok"
            : "";
    if (!k) continue;
    const cur = utm.get(k) ?? { receita: 0, pedidos: 0 };
    cur.receita += n(x["receita"]);
    cur.pedidos += n(x["pedidos"]);
    utm.set(k, cur);
  }
  const temUtmSite = (extra?.utmSite ?? []).some(noPeriodo);
  // Venda realizada dos canais de marketplace (e TikTok Shop)
  const venda = new Map<string, number>();
  for (const x of (extra?.consolidada ?? []).filter(noPeriodo)) {
    const k = canalVenda(x["canal"]);
    if (k) venda.set(k, (venda.get(k) ?? 0) + n(x["faturamento"]));
  }
  // Meta: a reconciliação pronta vence (mesma janela e mesma regra de UTM do pipeline)
  if (r.gasto || r.receitaInformada || r.receitaUtm)
    plat.set("meta", {
      nome: "Meta Ads",
      destino: "site",
      invest: r.gasto || plat.get("meta")?.invest || 0,
      informada: r.receitaInformada,
    });
  const out: PlataformaVsUtm[] = [];
  for (const [chave, x] of plat) {
    const usaRecon = chave === "meta" && (r.gasto || r.receitaInformada || r.receitaUtm);
    const u = usaRecon
      ? { receita: r.receitaUtm, pedidos: r.pedidosUtm }
      : x.destino === "marketplace"
        ? null
        : (utm.get(chave) ?? (temUtmSite ? { receita: 0, pedidos: 0 } : null));
    const realizadaCanal = x.destino === "site" ? null : (venda.get(chave) ?? null);
    const base = {
      chave,
      plataforma: x.nome,
      destino: x.destino,
      invest: x.invest || null,
      informada: x.informada,
      utm: u ? u.receita : null,
      pedidosUtm: u ? u.pedidos : null,
      razao: u && u.receita ? x.informada / u.receita : null,
      realizadaCanal,
      fatiaCanalPct: realizadaCanal ? (x.informada / realizadaCanal) * 100 : null,
      roasInformado: x.invest ? x.informada / x.invest : null,
      roasUtm: u && x.invest ? u.receita / x.invest : null,
    };
    out.push({ ...base, ...leituraDe(base) });
  }
  return out.sort((a, b) => (b.invest ?? 0) - (a.invest ?? 0));
}

/** Venda do site por fonte de UTM agrupada (Meta, Google, TikTok, CRM, sem UTM…). Soma = venda do site. */
export function siteUtmPorFonte(rows: Row[], de: string, ate: string) {
  const m = new Map<
    string,
    { fonte: string; receita: number; pedidos: number; sources: Set<string> }
  >();
  for (const r of rows) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    const f = fonteUtm(r["utm_source"], r["utm_medium"]);
    const cur = m.get(f) ?? { fonte: f, receita: 0, pedidos: 0, sources: new Set<string>() };
    cur.receita += n(r["receita"]);
    cur.pedidos += n(r["pedidos"]);
    const src = [txt(r["utm_source"]), txt(r["utm_medium"])].filter(Boolean).join(" / ");
    if (src && cur.sources.size < 6) cur.sources.add(src);
    m.set(f, cur);
  }
  const tot = [...m.values()].reduce((s, x) => s + x.receita, 0);
  return [...m.values()]
    .map((x) => ({
      fonte: x.fonte,
      receita: x.receita,
      pedidos: x.pedidos,
      sharePct: pct(x.receita, tot),
      exemplos: [...x.sources].join(", "),
    }))
    .sort((a, b) => b.receita - a.receita);
}

export type Modelo = {
  chave: string;
  inicio: string;
  obs: string;
  vigente: boolean;
  futuro: boolean;
};

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
    return { ...x, vigente, futuro: x.inicio > hoje };
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
  const f1 = (v: number) => v.toFixed(1).replace(".", ",");
  for (const p of i.plataformas) {
    if (p.razao != null && p.razao > LIMITES_PLATAFORMA.razaoAlta)
      out.push({
        tipo: "problema",
        tag: "Atribuição",
        tom: "warn",
        texto: `${p.plataforma} informa ${f1(p.razao)}× a venda com UTM dele no Shopify.`,
      });
    else if (p.leitura === "sem UTM no site")
      out.push({
        tipo: "problema",
        tag: "Atribuição",
        tom: "warn",
        texto: `${p.plataforma} investiu ${Math.round(p.invest ?? 0).toLocaleString("pt-BR")} reais e nenhum pedido do site chegou com UTM dele. Conferir o modelo de URL (utm_source) da conta.`,
      });
    else if (p.razao != null && p.razao < LIMITES_PLATAFORMA.razaoBaixa)
      out.push({
        tipo: "problema",
        tag: "Atribuição",
        tom: "warn",
        texto: `O site vê mais venda com UTM do ${p.plataforma} do que a plataforma informa: conversões podem não estar chegando a ela.`,
      });
    if (p.fatiaCanalPct != null && p.fatiaCanalPct > 100)
      out.push({
        tipo: "problema",
        tag: "Atribuição",
        tom: "danger",
        texto: `${p.plataforma} informa ${Math.round(p.fatiaCanalPct)}% da venda do canal: janela de atribuição ou dado duplicado.`,
      });
  }
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
