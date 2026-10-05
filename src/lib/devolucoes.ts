// Marketplace Health: cancelamentos, devoluções e ranking (Plano Mestre caps. 9.5, 9.7 e 9.8).
// Objetos que JÁ existem: vw_site_geral_dia, vw_amazon_geral_dia, vw_ml_frete_dia, fact_shopee_venda_dia,
// vw_tiktok_geral_dia, vw_tiktok_devolucao_dia, fact_tiktok_devolucao, vw_ttk_cancelamentos e vw_ml_ranking_atual.
//
// Cada canal mede de um jeito: Amazon e site medem devolução por unidade; ML, Shopee e TikTok medem cancelamento
// por pedido; TikTok também tem devolução por pedido. A tela mostra a base de cada número e não compara bases diferentes.
// Reviews e nota dos anúncios não existem no banco (lacuna).

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const nn = (v: unknown) =>
  v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
const txt = (v: unknown) => String(v ?? "").trim();
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const pct = (a: number, b: number) => (b ? (a / b) * 100 : null);

/** Período anterior de mesmo tamanho, terminando no dia antes de `de`. */
export function periodoAnterior(de: string, ate: string) {
  const dias = Math.round((Date.parse(ate) - Date.parse(de)) / 86400000) + 1;
  const fim = new Date(Date.parse(de) - 86400000);
  const ini = new Date(fim.getTime() - (dias - 1) * 86400000);
  return { de: ini.toISOString().slice(0, 10), ate: fim.toISOString().slice(0, 10) };
}

type Medida = {
  pedidos: number;
  unidades: number;
  cancelados: number | null;
  devolvidas: number | null;
  valorPerdido: number | null;
};

function mede(
  rows: Row[],
  de: string,
  ate: string,
  k: {
    pedidos: string;
    unidades?: string;
    cancelados?: string;
    devolvidas?: string;
    valor?: string[];
  },
): Medida {
  const r0 = rows.filter((r) => dia(r["data"]) >= de && dia(r["data"]) <= ate);
  const s = (c?: string) => (c ? r0.reduce((t, r) => t + n(r[c]), 0) : null);
  return {
    pedidos: s(k.pedidos) ?? 0,
    unidades: s(k.unidades) ?? 0,
    cancelados: s(k.cancelados),
    devolvidas: s(k.devolvidas),
    valorPerdido: k.valor ? k.valor.reduce((t, c) => t + (s(c) ?? 0), 0) : null,
  };
}

export type LinhaDevolucao = {
  canal: string;
  pedidos: number;
  cancelPct: number | null;
  cancelPctAnt: number | null;
  devolucaoPct: number | null;
  devolucaoPctAnt: number | null;
  baseDevolucao: "unidades" | "pedidos" | null;
  valorPerdido: number | null;
  deltaCancelPp: number | null;
  deltaDevolucaoPp: number | null;
};

export function devolucoesPorCanal(
  i: { site: Row[]; amazon: Row[]; ml: Row[]; shopee: Row[]; tiktok: Row[]; tiktokDev: Row[] },
  de: string,
  ate: string,
): LinhaDevolucao[] {
  const ant = periodoAnterior(de, ate);
  const defs: {
    canal: string;
    rows: Row[];
    k: Parameters<typeof mede>[3];
    base: "unidades" | "pedidos" | null;
    dev?: { rows: Row[]; k: Parameters<typeof mede>[3] };
  }[] = [
    {
      canal: "Site",
      rows: i.site,
      k: { pedidos: "pedidos", unidades: "unidades", devolvidas: "unidades_devolvidas" },
      base: "unidades",
    },
    {
      canal: "Amazon",
      rows: i.amazon,
      k: { pedidos: "pedidos", unidades: "unidades", devolvidas: "unidades_devolvidas" },
      base: "unidades",
    },
    {
      canal: "Mercado Livre",
      rows: i.ml,
      k: { pedidos: "pedidos", cancelados: "pedidos_cancelados", valor: ["faturamento_cancelado"] },
      base: null,
    },
    {
      canal: "Shopee",
      rows: i.shopee,
      k: {
        pedidos: "pedidos",
        cancelados: "pedidos_cancelados",
        valor: ["faturamento_cancelado", "frete_reverso"],
      },
      base: null,
    },
    {
      canal: "TikTok Shop",
      rows: i.tiktok,
      k: { pedidos: "pedidos", cancelados: "pedidos_cancelados" },
      base: "pedidos",
      dev: {
        rows: i.tiktokDev,
        k: { pedidos: "pedidos", devolvidas: "devolucoes", valor: ["valor_reembolso"] },
      },
    },
  ];
  return defs
    .map((d) => {
      const a = mede(d.rows, de, ate, d.k);
      const b = mede(d.rows, ant.de, ant.ate, d.k);
      const da = d.dev ? mede(d.dev.rows, de, ate, d.dev.k) : null;
      const db = d.dev ? mede(d.dev.rows, ant.de, ant.ate, d.dev.k) : null;
      const cancelPct = a.cancelados == null ? null : pct(a.cancelados, a.pedidos);
      const cancelPctAnt = b.cancelados == null ? null : pct(b.cancelados, b.pedidos);
      const devA =
        d.base === "unidades"
          ? pct(a.devolvidas ?? 0, a.unidades)
          : da
            ? pct(da.devolvidas ?? 0, a.pedidos)
            : null;
      const devB =
        d.base === "unidades"
          ? pct(b.devolvidas ?? 0, b.unidades)
          : db
            ? pct(db.devolvidas ?? 0, b.pedidos)
            : null;
      const valor = (a.valorPerdido ?? 0) + (da?.valorPerdido ?? 0);
      return {
        canal: d.canal,
        pedidos: a.pedidos,
        cancelPct,
        cancelPctAnt,
        devolucaoPct: devA,
        devolucaoPctAnt: devB,
        baseDevolucao: d.base,
        valorPerdido: a.valorPerdido == null && !da ? null : valor,
        deltaCancelPp: cancelPct != null && cancelPctAnt != null ? cancelPct - cancelPctAnt : null,
        deltaDevolucaoPp: devA != null && devB != null ? devA - devB : null,
      };
    })
    .filter((l) => l.pedidos > 0);
}

/** Motivos de devolução do TikTok Shop no período (sem order_id na saída). */
export function motivosDevolucao(rows: Row[], de: string, ate: string) {
  const m = new Map<string, { motivo: string; devolucoes: number; valor: number }>();
  for (const r of rows) {
    const d = dia(r["dia"] ?? r["data"]);
    if (d < de || d > ate) continue;
    const k = txt(r["motivo"]) || "(sem motivo)";
    const cur = m.get(k) ?? { motivo: k, devolucoes: 0, valor: 0 };
    cur.devolucoes++;
    cur.valor += n(r["valor_reembolso"]);
    m.set(k, cur);
  }
  const tot = [...m.values()].reduce((s, x) => s + x.devolucoes, 0);
  return [...m.values()]
    .map((x) => ({ ...x, sharePct: pct(x.devolucoes, tot) }))
    .sort((a, b) => b.devolucoes - a.devolucoes);
}

// ---------------------------------------------------------------------------------------------
// Ranking do Mercado Livre por categoria

// [HIPÓTESE] A linha da Soldiers é identificada pelo nome/apelido ou por um tipo como "propria".
const NOSSO = /soldiers/i;
const TIPO_NOSSO = /propri|nosso|marca_propria|soldiers/i;
export const ehNosso = (r: Row) =>
  NOSSO.test(txt(r["nome"])) || NOSSO.test(txt(r["alias"])) || TIPO_NOSSO.test(txt(r["tipo"]));

export type RankingCategoria = {
  categoria: string;
  mes: string;
  nossa: {
    posicao: number | null;
    sharePct: number | null;
    crescimento: number | null;
    receita: number;
  } | null;
  lider: { nome: string; sharePct: number | null; receita: number } | null;
  acima: { nome: string; sharePct: number | null; crescimento: number | null } | null;
  distanciaLiderPp: number | null;
  linhas: {
    posicao: number | null;
    nome: string;
    nosso: boolean;
    sharePct: number | null;
    crescimento: number | null;
    receita: number;
    unidades: number;
  }[];
};

export function rankingML(rows: Row[], top = 10): RankingCategoria[] {
  const por = new Map<string, Row[]>();
  for (const r of rows) {
    const k = txt(r["categoria"]) || "(sem categoria)";
    por.set(k, [...(por.get(k) ?? []), r]);
  }
  return [...por.entries()]
    .map(([categoria, rs]) => {
      const pos = (r: Row) => nn(r["posicao_consolidada"]) ?? nn(r["posicao"]);
      const ord = [...rs].sort((a, b) => (pos(a) ?? 1e9) - (pos(b) ?? 1e9));
      const linhas = ord.map((r) => ({
        posicao: pos(r),
        nome: txt(r["alias"]) || txt(r["nome"]),
        nosso: ehNosso(r),
        sharePct: nn(r["share_pct"]),
        crescimento: nn(r["crescimento"]),
        receita: n(r["receita_periodo"]) || n(r["receita_acum"]),
        unidades: n(r["unidades_periodo"]) || n(r["unidades_acum"]),
      }));
      const iN = linhas.findIndex((l) => l.nosso);
      const nossa = iN >= 0 ? linhas[iN]! : null;
      const lider =
        linhas[0] && !linhas[0].nosso ? linhas[0] : (linhas.find((l) => !l.nosso) ?? null);
      const acima = iN > 0 ? linhas[iN - 1]! : null;
      return {
        categoria,
        mes: txt(ord[0]?.["mes"]),
        nossa: nossa
          ? {
              posicao: nossa.posicao,
              sharePct: nossa.sharePct,
              crescimento: nossa.crescimento,
              receita: nossa.receita,
            }
          : null,
        lider: lider
          ? { nome: lider.nome, sharePct: lider.sharePct, receita: lider.receita }
          : null,
        acima: acima
          ? { nome: acima.nome, sharePct: acima.sharePct, crescimento: acima.crescimento }
          : null,
        distanciaLiderPp:
          nossa?.sharePct != null && lider?.sharePct != null && nossa.posicao !== 1
            ? lider.sharePct - nossa.sharePct
            : null,
        // Mostra o topo e, se a Soldiers estiver fora dele, a linha dela também.
        linhas: linhas.filter((l, i) => i < top || l.nosso),
      };
    })
    .sort((a, b) => (a.nossa?.posicao ?? 1e9) - (b.nossa?.posicao ?? 1e9));
}

export type AlertaCanal = {
  tipo: "problema" | "oportunidade";
  tag: string;
  tom: "danger" | "warn" | "success" | "primary";
  texto: string;
};

export function alertasDevolucoes(i: {
  canais: LinhaDevolucao[];
  ranking: RankingCategoria[];
}): AlertaCanal[] {
  const out: AlertaCanal[] = [];
  const f1 = (v: number) => v.toFixed(1).replace(".", ",");
  for (const c of i.canais) {
    if (c.deltaDevolucaoPp != null && c.deltaDevolucaoPp >= 1)
      out.push({
        tipo: "problema",
        tag: `Devolução ${c.canal}`,
        tom: "warn",
        texto: `Devolução no ${c.canal} subiu para ${f1(c.devolucaoPct ?? 0)}% (+${f1(c.deltaDevolucaoPp)} p.p. sobre o período anterior).`,
      });
    if (c.deltaCancelPp != null && c.deltaCancelPp >= 2)
      out.push({
        tipo: "problema",
        tag: `Cancelamento ${c.canal}`,
        tom: "warn",
        texto: `Cancelamento no ${c.canal} subiu para ${f1(c.cancelPct ?? 0)}% (+${f1(c.deltaCancelPp)} p.p.).`,
      });
  }
  for (const r of i.ranking) {
    if (
      r.nossa?.crescimento != null &&
      r.nossa.crescimento < 0 &&
      r.acima?.crescimento != null &&
      r.acima.crescimento > 0
    )
      out.push({
        tipo: "problema",
        tag: "Ranking ML",
        tom: "warn",
        texto: `Em ${r.categoria}, a Soldiers (${r.nossa.posicao}º) está caindo enquanto ${r.acima.nome}, logo acima, cresce.`,
      });
    if (
      r.nossa?.posicao != null &&
      r.nossa.posicao > 1 &&
      r.distanciaLiderPp != null &&
      r.distanciaLiderPp <= 2
    )
      out.push({
        tipo: "oportunidade",
        tag: "Ranking ML",
        tom: "success",
        texto: `Em ${r.categoria}, a Soldiers está a ${f1(r.distanciaLiderPp)} p.p. de share do líder.`,
      });
  }
  return out;
}
