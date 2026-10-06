// Fechamento de comissões de influenciadores e afiliados — a mesma regra da planilha "Vendas gerais" do time:
//   Venda considerada = MAIOR entre a venda do cupom (Shopify) e a venda do UpPromote.
//     A Shopify não marca toda venda do afiliado no cupom e vice-versa, então somar contaria a mesma venda duas
//     vezes e escolher uma só perderia venda. O maior dos dois é o valor que a planilha paga. [FATO, informado pelo time]
//   Total = venda considerada + venda no TikTok Shop (pelo @ do creator).
//   Comissão a receber = venda considerada × % do cupom. A venda do TikTok NÃO entra na comissão.
// Um creator pode ter mais de um cupom (cadastro com e-mails diferentes no site e no UpPromote). Cada cupom é uma
// linha, como na planilha; a visão por creator agrupa pelo @.
// Fontes que JÁ existem: vw_site_cupom_dia, vw_up_afiliado, vw_up_afiliado_mes, dim_influenciador,
// fact_tiktok_video_dia. Conferência com a planilha: affiliate_fechamento_planilha (migração 20261006130000).

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const nn = (v: unknown) =>
  v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
const txt = (v: unknown) => String(v ?? "").trim();
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const chave = (cupom: unknown) => txt(cupom).toUpperCase();
const handle = (v: unknown) => {
  const h = txt(v).replace(/^@/, "").toLowerCase();
  return /^[a-z0-9._]+$/.test(h) && h !== "0" ? h : "";
};
const r2 = (v: number) => Math.round(v * 100) / 100;

/** % pode vir como 5 ou 0,05. [HIPÓTESE] valores abaixo de 1 são fração (1 = 1%). */
export const percentual = (v: unknown): number | null => {
  const x = nn(v);
  if (x == null) return null;
  return x > 0 && x < 1 ? Math.round(x * 100000) / 1000 : x;
};

/** Colunas de vw_site_cupom_dia que podem ser a "venda cupom" da planilha. A conferência mostra qual bate. */
export const BASES_CUPOM = ["faturamento_liquido", "faturamento_bruto", "total_pago"] as const;
export type BaseCupom = (typeof BASES_CUPOM)[number];
export const BASE_PADRAO: BaseCupom = "faturamento_liquido";

export const limitesDoMes = (mes: string) => {
  const [a, m] = mes.split("-").map(Number);
  const de = `${mes}-01`;
  const ate = new Date(Date.UTC(a!, m!, 0)).toISOString().slice(0, 10);
  return { de, ate };
};

export type LinhaFechamento = {
  cupom: string;
  nome: string;
  tiktok: string; // @ sem arroba, "" quando não tem
  comissaoPct: number;
  vendaCupom: number;
  vendaUp: number;
  vendaConsiderada: number;
  fonteConsiderada: "cupom" | "uppromote" | "iguais" | "sem venda";
  vendaTikTok: number;
  total: number;
  comissao: number;
  origem: ("influenciador" | "uppromote")[];
};

/**
 * Uma linha por cupom (dim_influenciador ∪ UpPromote), no mês.
 * O TikTok vem pelo @ e se repete em cada cupom do mesmo @, como na planilha.
 */
export function fechamentoMes(
  i: {
    influenciadores: Row[];
    upAfiliados: Row[];
    upMes: Row[];
    cuponsSite: Row[];
    videos: Row[];
  },
  mes: string,
  base: BaseCupom = BASE_PADRAO,
): LinhaFechamento[] {
  const { de, ate } = limitesDoMes(mes);
  const noMes = (r: Row) => {
    const d = dia(r["data"]);
    return d >= de && d <= ate;
  };
  // Venda do cupom no site
  const site = new Map<string, number>();
  for (const r of i.cuponsSite.filter(noMes)) {
    const k = chave(r["cupom"]);
    if (k) site.set(k, (site.get(k) ?? 0) + n(r[base]));
  }
  // Venda do UpPromote no mês, por afiliado → cupom
  const upReceita = new Map<string, number>();
  for (const r of i.upMes)
    if (txt(r["mes"]).slice(0, 7) === mes)
      upReceita.set(
        txt(r["uppromote_id"]),
        (upReceita.get(txt(r["uppromote_id"])) ?? 0) + n(r["receita"]),
      );
  // TikTok por @
  const tt = new Map<string, number>();
  for (const r of i.videos.filter(noMes)) {
    const h = handle(r["criador"]);
    if (h) tt.set(h, (tt.get(h) ?? 0) + n(r["gmv"]));
  }
  // Cadastro: influenciador primeiro (tem @ e %), UpPromote completa
  const linhas = new Map<
    string,
    {
      nome: string;
      tiktok: string;
      pct: number | null;
      up: number;
      origem: Set<"influenciador" | "uppromote">;
    }
  >();
  for (const r of i.influenciadores) {
    const k = chave(r["cupom"]);
    if (!k) continue;
    const cur = linhas.get(k) ?? { nome: "", tiktok: "", pct: null, up: 0, origem: new Set() };
    cur.nome ||= txt(r["nome"]);
    cur.tiktok ||= handle(r["tiktok_username"]);
    cur.pct ??= percentual(r["comissao_pct"]);
    cur.origem.add("influenciador");
    linhas.set(k, cur);
  }
  for (const r of i.upAfiliados) {
    const k = chave(r["cupom"]);
    if (!k) continue;
    const cur = linhas.get(k) ?? { nome: "", tiktok: "", pct: null, up: 0, origem: new Set() };
    cur.nome ||= txt(r["nome"]);
    cur.pct ??= percentual(r["comissao_pct"]);
    cur.up += upReceita.get(txt(r["uppromote_id"])) ?? 0;
    cur.origem.add("uppromote");
    linhas.set(k, cur);
  }
  return [...linhas.entries()]
    .map(([cupom, x]) => {
      const vendaCupom = r2(site.get(cupom) ?? 0);
      const vendaUp = r2(x.up);
      const vendaConsiderada = Math.max(vendaCupom, vendaUp);
      const vendaTikTok = r2(x.tiktok ? (tt.get(x.tiktok) ?? 0) : 0);
      const pct = x.pct ?? 0;
      return {
        cupom,
        nome: x.nome,
        tiktok: x.tiktok,
        comissaoPct: pct,
        vendaCupom,
        vendaUp,
        vendaConsiderada,
        fonteConsiderada: (!vendaConsiderada
          ? "sem venda"
          : Math.abs(vendaCupom - vendaUp) < 0.005
            ? "iguais"
            : vendaCupom > vendaUp
              ? "cupom"
              : "uppromote") as LinhaFechamento["fonteConsiderada"],
        vendaTikTok,
        total: r2(vendaConsiderada + vendaTikTok),
        comissao: r2((vendaConsiderada * pct) / 100),
        origem: [...x.origem],
      };
    })
    .sort((a, b) => b.total - a.total || a.cupom.localeCompare(b.cupom));
}

/** Totais do mês. "TikTok repetido" = TikTok que aparece em mais de um cupom do mesmo @ (a planilha soma igual). */
export function resumoFechamento(linhas: LinhaFechamento[]) {
  const s = (
    k: "vendaCupom" | "vendaUp" | "vendaConsiderada" | "vendaTikTok" | "total" | "comissao",
  ) => r2(linhas.reduce((t, l) => t + l[k], 0));
  const porArroba = new Map<string, { n: number; v: number }>();
  for (const l of linhas)
    if (l.tiktok && l.vendaTikTok) {
      const c = porArroba.get(l.tiktok) ?? { n: 0, v: l.vendaTikTok };
      c.n += 1;
      porArroba.set(l.tiktok, c);
    }
  const repetido = r2([...porArroba.values()].reduce((t, c) => t + (c.n - 1) * c.v, 0));
  const comVenda = linhas.filter((l) => l.total > 0);
  const considerada = s("vendaConsiderada");
  return {
    cupons: linhas.length,
    cuponsComVenda: comVenda.length,
    vendaCupom: s("vendaCupom"),
    vendaUp: s("vendaUp"),
    vendaConsiderada: considerada,
    vendaTikTok: s("vendaTikTok"),
    total: s("total"),
    comissao: s("comissao"),
    comissaoEfetivaPct: considerada ? (s("comissao") / considerada) * 100 : null,
    tiktokRepetido: repetido,
    vendaSemComissao: r2(
      linhas.filter((l) => !l.comissaoPct).reduce((t, l) => t + l.vendaConsiderada, 0),
    ),
    pelaFonte: {
      cupom: linhas.filter((l) => l.fonteConsiderada === "cupom").length,
      uppromote: linhas.filter((l) => l.fonteConsiderada === "uppromote").length,
      iguais: linhas.filter((l) => l.fonteConsiderada === "iguais").length,
    },
  };
}

/** Visão por creator: soma os cupons do mesmo @ e conta o TikTok uma vez só. */
export function porCreator(linhas: LinhaFechamento[]) {
  const m = new Map<
    string,
    { creator: string; cupons: string[]; considerada: number; tiktok: number; comissao: number }
  >();
  for (const l of linhas) {
    const k = l.tiktok ? `@${l.tiktok}` : l.cupom;
    const cur = m.get(k) ?? { creator: k, cupons: [], considerada: 0, tiktok: 0, comissao: 0 };
    cur.cupons.push(l.cupom);
    cur.considerada += l.vendaConsiderada;
    cur.tiktok = Math.max(cur.tiktok, l.vendaTikTok);
    cur.comissao += l.comissao;
    m.set(k, cur);
  }
  return [...m.values()]
    .map((c) => ({
      ...c,
      considerada: r2(c.considerada),
      comissao: r2(c.comissao),
      total: r2(c.considerada + c.tiktok),
    }))
    .sort((a, b) => b.total - a.total);
}

// ---------------------------------------------------------------------------------------------
// Conferência com a planilha (affiliate_fechamento_planilha)

export const TOLERANCIA = 0.05; // R$ 0,05 por linha (arredondamento)

export type Campo =
  "vendaCupom" | "vendaUp" | "vendaConsiderada" | "vendaTikTok" | "total" | "comissao";
export const CAMPOS: { id: Campo; nome: string; col: string }[] = [
  { id: "vendaCupom", nome: "Venda cupom", col: "venda_cupom" },
  { id: "vendaUp", nome: "Venda UP Promote", col: "venda_up" },
  { id: "vendaConsiderada", nome: "Venda considerada", col: "venda_considerada" },
  { id: "vendaTikTok", nome: "Vendas TikTok", col: "venda_tiktok" },
  { id: "total", nome: "Total", col: "total" },
  { id: "comissao", nome: "Comissão a receber", col: "comissao" },
];

export type LinhaConferencia = {
  cupom: string;
  situacao: "bate" | "diferente" | "só na planilha" | "só na plataforma";
  plataforma: Partial<Record<Campo, number>> & { comissaoPct?: number };
  planilha: Partial<Record<Campo, number>> & { comissaoPct?: number };
  diferencas: Campo[];
  pctDiferente: boolean;
};

/**
 * Linhas da planilha (só a carga mais recente do mês: até 15 min antes da última linha importada),
 * sem modelo vazio, #N/D e linhas sem cupom.
 */
export function linhasPlanilha(rows: Row[], mes: string) {
  const doMes = rows.filter((r) => txt(r["competencia"]).slice(0, 7) === mes);
  const t = (r: Row) => Date.parse(txt(r["carregado_em"])) || 0;
  const ultima = doMes.reduce((m, r) => Math.max(m, t(r)), 0);
  return doMes.filter(
    (r) =>
      t(r) >= ultima - 15 * 60000 &&
      chave(r["cupom"]) &&
      !["0", "#N/D"].includes(chave(r["cupom"])),
  );
}

export function conferencia(plataforma: LinhaFechamento[], planilhaRows: Row[]) {
  const pl = new Map(plataforma.map((l) => [l.cupom, l]));
  const vistos = new Set<string>();
  const out: LinhaConferencia[] = [];
  for (const r of planilhaRows) {
    const k = chave(r["cupom"]);
    if (vistos.has(k)) continue; // a planilha tem cupons repetidos ("DUPLICADO"); compara a primeira linha
    vistos.add(k);
    const planilha = {
      ...Object.fromEntries(CAMPOS.map((c) => [c.id, n(r[c.col])])),
      comissaoPct: percentual(r["comissao_pct"]) ?? 0,
    } as LinhaConferencia["planilha"];
    const p = pl.get(k);
    if (!p) {
      const temValor = CAMPOS.some((c) => (planilha[c.id] ?? 0) !== 0);
      out.push({
        cupom: k,
        situacao: temValor ? "só na planilha" : "bate",
        plataforma: {},
        planilha,
        diferencas: temValor
          ? CAMPOS.filter((c) => (planilha[c.id] ?? 0) !== 0).map((c) => c.id)
          : [],
        pctDiferente: false,
      });
      continue;
    }
    const plat = {
      ...Object.fromEntries(CAMPOS.map((c) => [c.id, p[c.id]])),
      comissaoPct: p.comissaoPct,
    };
    const diferencas = CAMPOS.filter(
      (c) => Math.abs((plat as Record<string, number>)[c.id]! - (planilha[c.id] ?? 0)) > TOLERANCIA,
    ).map((c) => c.id);
    out.push({
      cupom: k,
      situacao: diferencas.length ? "diferente" : "bate",
      plataforma: plat,
      planilha,
      diferencas,
      pctDiferente: Math.abs((p.comissaoPct ?? 0) - (planilha.comissaoPct ?? 0)) > 0.001,
    });
  }
  for (const p of plataforma)
    if (!vistos.has(p.cupom) && p.total > 0)
      out.push({
        cupom: p.cupom,
        situacao: "só na plataforma",
        plataforma: {
          ...Object.fromEntries(CAMPOS.map((c) => [c.id, p[c.id]])),
          comissaoPct: p.comissaoPct,
        },
        planilha: {},
        diferencas: CAMPOS.filter((c) => p[c.id] !== 0).map((c) => c.id),
        pctDiferente: false,
      });
  const ordem = { diferente: 0, "só na planilha": 1, "só na plataforma": 2, bate: 3 };
  out.sort(
    (a, b) =>
      ordem[a.situacao] - ordem[b.situacao] ||
      Math.abs((b.planilha.total ?? 0) - (b.plataforma.total ?? 0)) -
        Math.abs((a.planilha.total ?? 0) - (a.plataforma.total ?? 0)),
  );
  // Por coluna: totais e % de linhas que batem
  const porCampo = CAMPOS.map((c) => {
    const comp = out.filter((l) => l.situacao === "bate" || l.situacao === "diferente");
    return {
      campo: c.id,
      nome: c.nome,
      plataforma: r2(plataforma.reduce((t, l) => t + l[c.id], 0)),
      planilha: r2(
        planilhaRows
          .filter(
            (r, idx, arr) => arr.findIndex((x) => chave(x["cupom"]) === chave(r["cupom"])) === idx,
          )
          .reduce((t, r) => t + n(r[c.col]), 0),
      ),
      linhasBatem: comp.filter((l) => !l.diferencas.includes(c.id)).length,
      linhasComparadas: comp.length,
    };
  });
  return {
    linhas: out,
    porCampo,
    batem: out.filter((l) => l.situacao === "bate").length,
    diferentes: out.filter((l) => l.situacao === "diferente").length,
    soPlanilha: out.filter((l) => l.situacao === "só na planilha").length,
    soPlataforma: out.filter((l) => l.situacao === "só na plataforma").length,
    pctDiferente: out.filter((l) => l.pctDiferente).length,
  };
}

/** Qual coluna do site bate com a "venda cupom" da planilha (% de cupons iguais, dentro da tolerância). */
export function melhorBaseCupom(cuponsSite: Row[], planilhaRows: Row[], mes: string) {
  const { de, ate } = limitesDoMes(mes);
  const plan = new Map<string, number>();
  for (const r of planilhaRows) {
    const k = chave(r["cupom"]);
    if (k && !plan.has(k)) plan.set(k, n(r["venda_cupom"]));
  }
  return BASES_CUPOM.map((base) => {
    const m = new Map<string, number>();
    for (const r of cuponsSite) {
      const d = dia(r["data"]);
      if (d < de || d > ate) continue;
      const k = chave(r["cupom"]);
      m.set(k, (m.get(k) ?? 0) + n(r[base]));
    }
    const comVenda = [...plan.entries()].filter(([, v]) => v > 0);
    const batem = comVenda.filter(([k, v]) => Math.abs((m.get(k) ?? 0) - v) <= TOLERANCIA).length;
    return {
      base,
      batem,
      comparados: comVenda.length,
      pct: comVenda.length ? (batem / comVenda.length) * 100 : null,
    };
  }).sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
}

// ---------------------------------------------------------------------------------------------
// Alertas

export type AlertaFechamento = {
  tipo: "problema" | "oportunidade";
  tag: string;
  tom: "danger" | "warn" | "success" | "primary";
  texto: string;
};

export function alertasFechamento(
  linhas: LinhaFechamento[],
  conf: ReturnType<typeof conferencia> | null,
): AlertaFechamento[] {
  const out: AlertaFechamento[] = [];
  const brl = (v: number) => "R$ " + v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  const semPct = linhas.filter((l) => !l.comissaoPct && l.vendaConsiderada > 0);
  if (semPct.length)
    out.push({
      tipo: "problema",
      tag: "Fechamento",
      tom: "primary",
      texto: `${semPct.length} cupom(ns) venderam ${brl(semPct.reduce((t, l) => t + l.vendaConsiderada, 0))} com comissão 0%. Confirmar se é permuta ou contrato fixo.`,
    });
  if (conf && conf.diferentes + conf.soPlanilha)
    out.push({
      tipo: "problema",
      tag: "Fechamento",
      tom: "warn",
      texto: `${conf.diferentes + conf.soPlanilha} cupom(ns) com valor diferente da planilha do mês. Ver a conferência antes de pagar.`,
    });
  return out;
}
