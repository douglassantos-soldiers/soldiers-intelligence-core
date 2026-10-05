// Intelligence (Plano Mestre caps. 14, 15, 16, 29 e 30). Só leitura e recomendação.
// - Channel Intelligence: receita, margem, novos, CAC, LTV, recompra e unit economics por canal numa tabela só.
// - Matriz Produto × Canal: papel econômico de cada SKU em cada canal (nota A–D pela contribuição estimada).
// - Previsão de demanda e estoque por local: média móvel com tendência, cobertura e reposição sugerida.
//   Estoques de locais diferentes NUNCA se somam (cap. 6.4).
// - Experimentos: controle × tratamento, lift, teste de duas proporções e decisão sugerida (cap. 16).

import { custoHistorico, custoNaData } from "@/lib/aggregate";
import { taxaPorCanal } from "@/lib/midiasku";

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const nn = (v: unknown) =>
  v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
const txt = (v: unknown) => String(v ?? "").trim();
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const div = (a: number, b: number) => (b ? a / b : null);
const pct = (a: number, b: number) => (b ? (a / b) * 100 : null);
const somaDias = (iso: string, d: number) =>
  new Date(Date.parse(iso + "T00:00:00Z") + d * 86400000).toISOString().slice(0, 10);

/** Chave comum de canal entre views que escrevem o nome de jeitos diferentes ("Shopify"/"Site", "ML"/"Mercado Livre"…). */
export function chaveCanal(nome: unknown): string {
  const s = txt(nome).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/shopify|^site|loja propria|ecommerce/.test(s)) return "site";
  if (/mercado ?livre|^ml\b|meli/.test(s)) return "mercado_livre";
  if (/amazon/.test(s)) return "amazon";
  if (/shopee/.test(s)) return "shopee";
  if (/tiktok/.test(s)) return "tiktok_shop";
  return s.replace(/\s+/g, "_");
}
export const NOME_CANAL: Record<string, string> = {
  site: "Site",
  mercado_livre: "Mercado Livre",
  amazon: "Amazon",
  shopee: "Shopee",
  tiktok_shop: "TikTok Shop",
};
const nomeCanal = (k: string, original: string) => NOME_CANAL[k] ?? original;

// ---------------------------------------------------------------------------------------------
// Channel Intelligence

export type LinhaCanal = {
  canal: string;
  receita: number;
  receitaAnterior: number;
  crescimentoPct: number | null;
  contribuicao: number;
  margemPct: number | null;
  ads: number;
  pedidos: number;
  receitaPorPedido: number | null;
  contribuicaoPorPedido: number | null;
  adsPorPedido: number | null;
  novos: number | null;
  cac: number | null;
  ltv: number | null;
  ltvCac: number | null;
  recompraPct: number | null;
  sharePct: number | null;
};

export function channelIntelligence(
  i: { pl: Row[]; receita: Row[]; cac: Row[]; origem: Row[] },
  de: string,
  ate: string,
): LinhaCanal[] {
  const dias = Math.round((Date.parse(ate) - Date.parse(de)) / 86400000) + 1;
  const antDe = somaDias(de, -dias);
  const antAte = somaDias(de, -1);
  type Acc = {
    nome: string;
    rec: number;
    recAnt: number;
    contrib: number;
    ads: number;
    pedidos: number;
    novos: number;
    invest: number;
    temCac: boolean;
  };
  const m = new Map<string, Acc>();
  const get = (nome: unknown) => {
    const k = chaveCanal(nome);
    const cur = m.get(k) ?? {
      nome: nomeCanal(k, txt(nome)),
      rec: 0,
      recAnt: 0,
      contrib: 0,
      ads: 0,
      pedidos: 0,
      novos: 0,
      invest: 0,
      temCac: false,
    };
    m.set(k, cur);
    return cur;
  };
  for (const r of i.pl) {
    const d = dia(r["data"]);
    if (d >= de && d <= ate) {
      const a = get(r["canal"]);
      a.rec += n(r["receita_bruta"]);
      a.contrib += n(r["margem_contribuicao"]);
      a.ads += n(r["ads"]);
    } else if (d >= antDe && d <= antAte) get(r["canal"]).recAnt += n(r["receita_bruta"]);
  }
  for (const r of i.receita) {
    const d = dia(r["data"]);
    if (d >= de && d <= ate) get(r["canal_venda"] ?? r["canal"]).pedidos += n(r["pedidos"]);
  }
  // CAC é mensal: entram os meses que tocam o período.
  const mesDe = de.slice(0, 7);
  const mesAte = ate.slice(0, 7);
  for (const r of i.cac) {
    const mes = txt(r["mes"]).slice(0, 7);
    if (mes < mesDe || mes > mesAte) continue;
    const a = get(r["canal"]);
    a.novos += n(r["novos"]);
    a.invest += n(r["invest_aquisicao"]);
    a.temCac = true;
  }
  const origem = new Map(i.origem.map((o) => [chaveCanal(o["canal_entrada"]), o]));
  const totRec = [...m.values()].reduce((s, a) => s + a.rec, 0);
  return [...m.entries()]
    .map(([k, a]) => {
      const o = origem.get(k);
      const ltv = o ? nn(o["ltv_medio"]) : null;
      const cac = a.temCac ? div(a.invest, a.novos) : null;
      return {
        canal: a.nome,
        receita: a.rec,
        receitaAnterior: a.recAnt,
        crescimentoPct: a.recAnt ? ((a.rec - a.recAnt) / a.recAnt) * 100 : null,
        contribuicao: a.contrib,
        margemPct: pct(a.contrib, a.rec),
        ads: a.ads,
        pedidos: a.pedidos,
        receitaPorPedido: div(a.rec, a.pedidos),
        contribuicaoPorPedido: div(a.contrib, a.pedidos),
        adsPorPedido: div(a.ads, a.pedidos),
        novos: a.temCac ? a.novos : null,
        cac,
        ltv,
        ltvCac: ltv != null && cac ? ltv / cac : null,
        recompraPct: o ? nn(o["pct_recompra"]) : null,
        sharePct: pct(a.rec, totRec),
      };
    })
    .filter((l) => l.receita > 0 || l.receitaAnterior > 0)
    .sort((a, b) => b.receita - a.receita);
}

// ---------------------------------------------------------------------------------------------
// Matriz Produto × Canal

export type Nota = "A" | "B" | "C" | "D";
export const NOTA_REGRA: Record<Nota, string> = {
  A: "contribuição ≥ 25% da receita",
  B: "10% a 25%",
  C: "0% a 10%",
  D: "contribuição negativa",
};
const notaDe = (m: number | null): Nota | null =>
  m == null ? null : m >= 25 ? "A" : m >= 10 ? "B" : m >= 0 ? "C" : "D";

export type Celula = {
  receita: number;
  contribuicao: number | null;
  margemPct: number | null;
  nota: Nota | null;
  ads: number;
};
export type LinhaMatriz = {
  sku: string;
  produto: string;
  receita: number;
  celulas: Record<string, Celula>;
  papel: string;
};

/** Contribuição estimada por SKU e canal = receita − CMV na data − taxa média do canal − Ads do SKU no canal. */
export function matrizProdutoCanal(
  i: { produtos: Row[]; custos: Row[]; pl: Row[] },
  de: string,
  ate: string,
  top = 25,
) {
  const hist = custoHistorico(i.custos);
  const taxaOrig = taxaPorCanal(i.pl, de, ate);
  const taxa = new Map<string, number>();
  for (const [k, v] of taxaOrig) taxa.set(chaveCanal(k), v);
  const canais = new Set<string>();
  const m = new Map<
    string,
    {
      produto: string;
      cel: Map<string, { rec: number; cmv: number; semCusto: boolean; ads: number; taxa: number }>;
    }
  >();
  for (const r of i.produtos) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    const sku = txt(r["sku"]);
    if (!sku) continue;
    const k = chaveCanal(r["canal"]);
    canais.add(k);
    const lin = m.get(sku) ?? { produto: txt(r["produto"]), cel: new Map() };
    const c = lin.cel.get(k) ?? { rec: 0, cmv: 0, semCusto: false, ads: 0, taxa: 0 };
    const rec = n(r["receita"]);
    const un = n(r["unidades"]);
    c.rec += rec;
    c.ads += n(r["invest_ads"]);
    c.taxa += rec * (taxa.get(k) ?? 0);
    const custo = custoNaData(hist, sku, d);
    if (custo) c.cmv += custo.custo * un;
    else if (un > 0) c.semCusto = true;
    lin.cel.set(k, c);
    if (!lin.produto) lin.produto = txt(r["produto"]);
    m.set(sku, lin);
  }
  const ordemCanais = [...canais].sort(
    (a, b) => Object.keys(NOME_CANAL).indexOf(a) - Object.keys(NOME_CANAL).indexOf(b),
  );
  const linhas: LinhaMatriz[] = [...m.entries()]
    .map(([sku, l]) => {
      const celulas: Record<string, Celula> = {};
      let receita = 0;
      for (const [k, c] of l.cel) {
        const contribuicao = c.semCusto ? null : c.rec - c.cmv - c.taxa - c.ads;
        const margemPct = contribuicao == null ? null : pct(contribuicao, c.rec);
        celulas[k] = {
          receita: c.rec,
          contribuicao,
          margemPct,
          nota: c.rec > 0 ? notaDe(margemPct) : null,
          ads: c.ads,
        };
        receita += c.rec;
      }
      return { sku, produto: l.produto || sku, receita, celulas, papel: papelDoProduto(celulas) };
    })
    .sort((a, b) => b.receita - a.receita)
    .slice(0, top);
  return { canais: ordemCanais.map((k) => ({ chave: k, nome: NOME_CANAL[k] ?? k })), linhas };
}

/** Leitura curta do papel do SKU a partir das notas por canal. */
export function papelDoProduto(celulas: Record<string, Celula>): string {
  const c = Object.entries(celulas).filter(([, x]) => x.receita > 0);
  if (!c.length) return "—";
  const melhor = [...c].sort(
    (a, b) => (b[1].contribuicao ?? -1e12) - (a[1].contribuicao ?? -1e12),
  )[0]!;
  const negativos = c.filter(([, x]) => x.nota === "D").map(([k]) => NOME_CANAL[k] ?? k);
  const nome = NOME_CANAL[melhor[0]] ?? melhor[0];
  if (c.every(([, x]) => x.nota === "A")) return "rentável em todos os canais";
  if (negativos.length) return `dá prejuízo em ${negativos.join(", ")}; lucro vem de ${nome}`;
  if (c.length === 1) return `só vende em ${nome}`;
  return `lucro concentrado em ${nome}`;
}

// ---------------------------------------------------------------------------------------------
// Previsão de demanda e estoque por local

export type Local = { chave: string; nome: string; canal: string };
export const LOCAIS: Local[] = [
  { chave: "site", nome: "Estoque do site (Shopify)", canal: "site" },
  { chave: "fba", nome: "Amazon FBA", canal: "amazon" },
  { chave: "ml_full", nome: "Mercado Livre Full", canal: "mercado_livre" },
  { chave: "shopee", nome: "Shopee", canal: "shopee" },
  { chave: "tiktok", nome: "TikTok Shop", canal: "tiktok_shop" },
];

export const PREVISAO = {
  janelaLonga: 28,
  janelaCurta: 7,
  pesoCurta: 0.5,
  horizonte: 30,
  alvoCobertura: 45,
  coberturaCritica: 14,
} as const;

/** Unidades por dia previstas: mistura da média de 7 e de 28 dias (pesa o recente sem jogar fora a base). */
export function previsaoDiaria(unidadesPorDia: number[]): {
  previsao: number;
  m7: number;
  m28: number;
  tendenciaPct: number | null;
} {
  const ult = (k: number) => unidadesPorDia.slice(-k);
  const media = (xs: number[], k: number) => xs.reduce((s, x) => s + x, 0) / k;
  const m28 = media(ult(PREVISAO.janelaLonga), PREVISAO.janelaLonga);
  const m7 = media(ult(PREVISAO.janelaCurta), PREVISAO.janelaCurta);
  return {
    previsao: PREVISAO.pesoCurta * m7 + (1 - PREVISAO.pesoCurta) * m28,
    m7,
    m28,
    tendenciaPct: m28 ? (m7 / m28 - 1) * 100 : null,
  };
}

/** Série diária de unidades (dias sem venda = 0) por SKU e canal, de `de` até `ate`. */
function series(produtos: Row[], de: string, ate: string) {
  const nDias = Math.round((Date.parse(ate) - Date.parse(de)) / 86400000) + 1;
  const m = new Map<string, { sku: string; canal: string; produto: string; un: number[] }>();
  for (const r of produtos) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    const sku = txt(r["sku"]);
    const canal = chaveCanal(r["canal"]);
    const k = `${sku}|${canal}`;
    const cur = m.get(k) ?? {
      sku,
      canal,
      produto: txt(r["produto"]),
      un: Array(nDias).fill(0) as number[],
    };
    const idx = Math.round((Date.parse(d) - Date.parse(de)) / 86400000);
    cur.un[idx] = (cur.un[idx] ?? 0) + n(r["unidades"]);
    m.set(k, cur);
  }
  return m;
}

export type LinhaEstoque = {
  sku: string;
  produto: string;
  local: string;
  estoque: number;
  previsaoDia: number;
  tendenciaPct: number | null;
  coberturaDias: number | null;
  ruptura: string | null;
  repor: number;
  situacao: "ruptura" | "crítico" | "atenção" | "ok" | "parado";
};

export function previsaoEstoque(
  i: { produtos: Row[]; site: Row[]; fba: Row[]; mlFull: Row[]; shopee: Row[]; tiktok: Row[] },
  hoje: string,
) {
  const ate = somaDias(hoje, -1);
  const de = somaDias(ate, -(2 * PREVISAO.janelaLonga - 1));
  const ser = series(i.produtos, de, ate);
  // Estoque por local e SKU (cada local separado; nunca somados)
  const est = new Map<string, Map<string, number>>();
  const add = (local: string, sku: unknown, q: unknown) => {
    const s = txt(sku);
    if (!s) return;
    const mm = est.get(local) ?? new Map<string, number>();
    mm.set(s, (mm.get(s) ?? 0) + n(q));
    est.set(local, mm);
  };
  for (const r of i.site) add("site", r["sku"], r["estoque"]);
  for (const r of i.fba) add("fba", r["seller_sku"], r["fulfillable"]);
  for (const r of i.mlFull) add("ml_full", r["seller_sku"], r["disponivel"]);
  for (const r of i.shopee) add("shopee", r["model_sku"] || r["item_sku"], r["estoque_normal"]);
  for (const r of i.tiktok) add("tiktok", r["seller_sku"], r["quantidade"]);

  const linhas: LinhaEstoque[] = [];
  const nomes = new Map<string, string>();
  for (const s of ser.values()) if (s.produto) nomes.set(s.sku, s.produto);
  for (const local of LOCAIS) {
    const mm = est.get(local.chave);
    if (!mm) continue;
    for (const [sku, estoque] of mm) {
      const s = ser.get(`${sku}|${local.canal}`);
      const p = s ? previsaoDiaria(s.un) : { previsao: 0, m7: 0, m28: 0, tendenciaPct: null };
      const cobertura = p.previsao > 0 ? estoque / p.previsao : null;
      const ruptura = cobertura == null ? null : somaDias(hoje, Math.floor(cobertura));
      const repor = Math.max(0, Math.ceil(p.previsao * PREVISAO.alvoCobertura - estoque));
      const situacao: LinhaEstoque["situacao"] =
        p.previsao <= 0
          ? estoque > 0
            ? "parado"
            : "ok"
          : estoque <= 0
            ? "ruptura"
            : (cobertura ?? 0) < PREVISAO.coberturaCritica
              ? "crítico"
              : (cobertura ?? 0) < PREVISAO.alvoCobertura
                ? "atenção"
                : "ok";
      linhas.push({
        sku,
        produto: nomes.get(sku) || sku,
        local: local.nome,
        estoque,
        previsaoDia: p.previsao,
        tendenciaPct: p.tendenciaPct,
        coberturaDias: cobertura,
        ruptura,
        repor,
        situacao,
      });
    }
  }
  const peso = { ruptura: 0, crítico: 1, atenção: 2, parado: 3, ok: 4 } as const;
  linhas.sort(
    (a, b) =>
      peso[a.situacao] - peso[b.situacao] || (a.coberturaDias ?? 1e9) - (b.coberturaDias ?? 1e9),
  );
  return { linhas, backtest: backtest(ser) };
}

/**
 * Quanto a previsão erraria: prevê os últimos 28 dias só com os 28 anteriores e compara com o que vendeu.
 * Erro = |previsto − vendido| ÷ vendido, somado por canal (WAPE).
 */
export function backtest(ser: Map<string, { sku: string; canal: string; un: number[] }>) {
  const porCanal = new Map<
    string,
    { previsto: number; vendido: number; erro: number; skus: number }
  >();
  for (const s of ser.values()) {
    if (s.un.length < 2 * PREVISAO.janelaLonga) continue;
    const base = s.un.slice(0, PREVISAO.janelaLonga);
    const real = s.un.slice(PREVISAO.janelaLonga).reduce((t, x) => t + x, 0);
    const prev = previsaoDiaria(base).previsao * PREVISAO.janelaLonga;
    const cur = porCanal.get(s.canal) ?? { previsto: 0, vendido: 0, erro: 0, skus: 0 };
    cur.previsto += prev;
    cur.vendido += real;
    cur.erro += Math.abs(prev - real);
    cur.skus++;
    porCanal.set(s.canal, cur);
  }
  return [...porCanal.entries()]
    .map(([k, x]) => ({
      canal: NOME_CANAL[k] ?? k,
      skus: x.skus,
      previsto: x.previsto,
      vendido: x.vendido,
      erroPct: pct(x.erro, x.vendido),
      viesPct: x.vendido ? ((x.previsto - x.vendido) / x.vendido) * 100 : null,
    }))
    .sort((a, b) => b.vendido - a.vendido);
}

// ---------------------------------------------------------------------------------------------
// Experimentos (cap. 16)

/** Função de distribuição da normal padrão (aproximação de Abramowitz-Stegun 7.1.26). */
export function normalCdf(z: number) {
  const t = 1 / (1 + 0.3275911 * (Math.abs(z) / Math.SQRT2));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

export type ResultadoExperimento = {
  id: string;
  titulo: string;
  hipotese: string;
  area: string;
  metrica: string;
  status: string;
  inicio: string;
  fim: string;
  controle: {
    participantes: number;
    convertidos: number;
    taxaPct: number | null;
    receitaPorParticipante: number | null;
  } | null;
  tratamentos: {
    grupo: string;
    descricao: string;
    participantes: number;
    convertidos: number;
    taxaPct: number | null;
    receitaPorParticipante: number | null;
    liftPct: number | null;
    pValor: number | null;
    amostraNecessaria: number | null;
  }[];
  leitura: "vencedor" | "perdedor" | "inconclusivo" | "sem grupo de controle" | "sem dados";
  decisao: string;
  aprendizado: string;
};

/** Teste de duas proporções (bicaudal). Devolve p-valor e a amostra por grupo para 80% de poder no lift observado. */
export function duasProporcoes(c: { n: number; x: number }, t: { n: number; x: number }) {
  if (!c.n || !t.n) return { pValor: null, amostra: null };
  const p1 = c.x / c.n;
  const p2 = t.x / t.n;
  const p = (c.x + t.x) / (c.n + t.n);
  const se = Math.sqrt(p * (1 - p) * (1 / c.n + 1 / t.n));
  const z = se ? (p2 - p1) / se : 0;
  const pValor = se ? 2 * (1 - normalCdf(Math.abs(z))) : null;
  const delta = Math.abs(p2 - p1);
  const amostra = delta
    ? Math.ceil(((1.96 + 0.8416) ** 2 * (p1 * (1 - p1) + p2 * (1 - p2))) / delta ** 2)
    : null;
  return { pValor, amostra };
}

export function resultadosExperimentos(exps: Row[], grupos: Row[]): ResultadoExperimento[] {
  const porExp = new Map<string, Row[]>();
  for (const g of grupos) {
    const k = txt(g["experimento_id"]);
    porExp.set(k, [...(porExp.get(k) ?? []), g]);
  }
  return exps
    .map((e) => {
      const id = txt(e["id"]);
      const gs = porExp.get(id) ?? [];
      const conv = (g: Row) => {
        const pn = n(g["participantes"]);
        return {
          participantes: pn,
          convertidos: n(g["convertidos"]),
          taxaPct: pct(n(g["convertidos"]), pn),
          receitaPorParticipante: div(n(g["receita"]), pn),
        };
      };
      const ctl = gs.find((g) => txt(g["grupo"]) === "controle");
      const controle = ctl ? conv(ctl) : null;
      const tratamentos = gs
        .filter((g) => txt(g["grupo"]) !== "controle")
        .map((g) => {
          const t = conv(g);
          const st = controle
            ? duasProporcoes(
                { n: controle.participantes, x: controle.convertidos },
                { n: t.participantes, x: t.convertidos },
              )
            : { pValor: null, amostra: null };
          return {
            grupo: txt(g["grupo"]),
            descricao: txt(g["descricao"]),
            ...t,
            liftPct:
              controle?.taxaPct && t.taxaPct != null
                ? ((t.taxaPct - controle.taxaPct) / controle.taxaPct) * 100
                : null,
            pValor: st.pValor,
            // Já significativo: não falta amostra.
            amostraNecessaria: st.pValor != null && st.pValor < 0.05 ? null : st.amostra,
          };
        });
      let leitura: ResultadoExperimento["leitura"] = "inconclusivo";
      if (!gs.length || gs.every((g) => !n(g["participantes"]))) leitura = "sem dados";
      else if (!controle) leitura = "sem grupo de controle";
      else {
        const sig = tratamentos.filter((t) => t.pValor != null && t.pValor < 0.05);
        if (sig.some((t) => (t.liftPct ?? 0) > 0)) leitura = "vencedor";
        else if (sig.length && sig.every((t) => (t.liftPct ?? 0) < 0)) leitura = "perdedor";
      }
      return {
        id,
        titulo: txt(e["titulo"]),
        hipotese: txt(e["hipotese"]),
        area: txt(e["area"]),
        metrica: txt(e["metrica_principal"]),
        status: txt(e["status"]),
        inicio: dia(e["inicio"]),
        fim: dia(e["fim"]),
        controle,
        tratamentos,
        leitura,
        decisao: txt(e["decisao"]),
        aprendizado: txt(e["aprendizado"]),
      };
    })
    .sort((a, b) => b.inicio.localeCompare(a.inicio));
}

// ---------------------------------------------------------------------------------------------
// Alertas

export type AlertaCanal = {
  tipo: "problema" | "oportunidade";
  tag: string;
  tom: "danger" | "warn" | "success" | "primary";
  texto: string;
};

export function alertasInteligencia(i: {
  canais: LinhaCanal[];
  estoque: LinhaEstoque[];
  experimentos: ResultadoExperimento[];
}): AlertaCanal[] {
  const out: AlertaCanal[] = [];
  const rupt = i.estoque.filter((l) => l.situacao === "ruptura" || l.situacao === "crítico");
  if (rupt.length)
    out.push({
      tipo: "problema",
      tag: "Estoque previsto",
      tom: "danger",
      texto: `${rupt.length} SKU(s) por local acabam em menos de ${PREVISAO.coberturaCritica} dias pela previsão, como ${rupt[0]!.produto} em ${rupt[0]!.local}.`,
    });
  for (const c of i.canais)
    if (c.ltvCac != null && c.ltvCac < 1)
      out.push({
        tipo: "problema",
        tag: "Unit economics",
        tom: "warn",
        texto: `${c.canal}: LTV menor que o CAC (${c.ltvCac.toFixed(1).replace(".", ",")}×). Cliente novo neste canal não se paga.`,
      });
  const venc = i.experimentos.filter((e) => e.leitura === "vencedor" && !e.decisao);
  if (venc.length)
    out.push({
      tipo: "oportunidade",
      tag: "Experimento",
      tom: "success",
      texto: `${venc.length} experimento(s) com vencedor e sem decisão registrada, como "${venc[0]!.titulo}".`,
    });
  return out;
}
