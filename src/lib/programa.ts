// Programa de afiliados (onda 2 do benchmark Cruva, benchmarks/cruva/ANALISE.md §10): faixas de comissão por
// contribuição e direitos de uso (Spark Ads / parceria no Meta). Só leitura e sugestão: mudar a comissão, pedir o
// código ou pagar o direito continua fora da plataforma até a Fase 3 (login + Policy + Approval + Audit).

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const txt = (v: unknown) => String(v ?? "").trim();
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const handle = (v: unknown) => txt(v).replace(/^@/, "").toLowerCase();
const somaDias = (iso: string, d: number) =>
  new Date(Date.parse(iso + "T00:00:00Z") + d * 86400000).toISOString().slice(0, 10);
const diasEntre = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

// ---------------------------------------------------------------------------------------------
// Faixas de comissão por contribuição

export type Faixa = { de: number; comissaoPct: number };
export type RegraComissao = {
  nome: string;
  versao: number;
  vigenteDesde: string;
  /** Medida que decide a faixa: contribuição (GMV × margem via afiliado) ou GMV. */
  base: "contribuicao" | "gmv";
  janelaDias: number;
  faixas: Faixa[];
  fonte: "cadastro" | "padrao";
};

/**
 * Regra padrão enquanto não houver regra cadastrada em affiliate_regra_comissao. [HIPÓTESE] de negócio, não
 * política aprovada: 5% de base, 7% a partir de R$ 1 mil de contribuição em 30 dias e 9% a partir de R$ 3 mil.
 */
export const REGRA_PADRAO: RegraComissao = {
  nome: "Faixas por contribuição (padrão)",
  versao: 0,
  vigenteDesde: "",
  base: "contribuicao",
  janelaDias: 30,
  faixas: [
    { de: 0, comissaoPct: 5 },
    { de: 1000, comissaoPct: 7 },
    { de: 3000, comissaoPct: 9 },
  ],
  fonte: "padrao",
};

/** Lê as faixas do jsonb e descarta o que não for válido (de ≥ 0, comissão entre 0 e 50%). */
export function faixasValidas(v: unknown): Faixa[] {
  let arr: unknown = v;
  if (typeof v === "string")
    try {
      arr = JSON.parse(v);
    } catch {
      return [];
    }
  if (!Array.isArray(arr)) return [];
  const out = arr
    .map((f) => ({
      de: Number((f as Row)?.["de"]),
      comissaoPct: Number((f as Row)?.["comissao_pct"]),
    }))
    .filter(
      (f) =>
        Number.isFinite(f.de) &&
        f.de >= 0 &&
        Number.isFinite(f.comissaoPct) &&
        f.comissaoPct >= 0 &&
        f.comissaoPct <= 50,
    )
    .sort((a, b) => a.de - b.de);
  // Uma faixa por limite; a primeira começa em zero.
  const unicas = out.filter((f, i) => i === 0 || f.de !== out[i - 1]!.de);
  return unicas.length && unicas[0]!.de === 0 ? unicas : [];
}

/** Regra vigente: a de maior vigência até hoje (empate: maior versão). Sem regra válida, usa a padrão. */
export function regraVigente(rows: Row[], hoje: string): RegraComissao {
  const validas = rows
    .map((r) => ({
      nome: txt(r["nome"]),
      versao: n(r["versao"]),
      vigenteDesde: dia(r["vigente_desde"]),
      base: (txt(r["base"]) === "gmv" ? "gmv" : "contribuicao") as RegraComissao["base"],
      janelaDias: Math.min(90, Math.max(7, n(r["janela_dias"]) || 30)),
      faixas: faixasValidas(r["faixas"]),
      fonte: "cadastro" as const,
    }))
    .filter((r) => r.nome && r.vigenteDesde && r.vigenteDesde <= hoje && r.faixas.length)
    .sort((a, b) => b.vigenteDesde.localeCompare(a.vigenteDesde) || b.versao - a.versao);
  return validas[0] ?? REGRA_PADRAO;
}

export const rotuloFaixa = (f: Faixa, base: RegraComissao["base"]) =>
  `${f.comissaoPct.toLocaleString("pt-BR")}%` +
  (f.de
    ? ` (≥ R$ ${f.de.toLocaleString("pt-BR")} de ${base === "gmv" ? "GMV" : "contribuição"})`
    : " (base)");

export type FaixaCreator = {
  handle: string;
  nome: string;
  gmvJanela: number;
  contribuicao: number;
  contribuicaoAnterior: number;
  medida: number;
  medidaAnterior: number;
  faixaPelaMedida: Faixa;
  faixaSugerida: Faixa;
  deltaPp: number;
  custoExtra: number;
  contribuicaoDepois: number;
  /** Passou de faixa nesta janela em relação à janela anterior. */
  cruzou: boolean;
  limitadaPelaMargem: boolean;
  leitura: string;
};

/**
 * Faixa de cada creator na janela da regra (TikTok Shop, vídeos de afiliado).
 * Contribuição = GMV × margem via afiliado (que já desconta a comissão base). Custo extra = GMV × (faixa − base).
 * Nunca sugere faixa que deixe a contribuição depois do custo extra negativa: desce até a maior faixa que cabe.
 */
export function faixasPorContribuicao(
  videos: Row[],
  cadastro: Row[],
  regra: RegraComissao,
  margemPct: number,
  ref: string,
  excluir: Set<string> = new Set(),
): {
  regra: RegraComissao;
  creators: FaixaCreator[];
  custoExtraTotal: number;
  porFaixa: { faixa: string; creators: number; gmv: number; custoExtra: number }[];
} {
  const j = regra.janelaDias;
  const ini = somaDias(ref, -(j - 1));
  const iniAnt = somaDias(ref, -(2 * j - 1));
  const nomes = new Map(cadastro.map((c) => [handle(c["tiktok_username"]), txt(c["nome"])]));
  const g = new Map<string, { atual: number; ant: number }>();
  for (const v of videos) {
    const h = handle(v["criador"]);
    const d = dia(v["data"]);
    if (!h || excluir.has(h) || d > ref || d < iniAnt) continue;
    const cur = g.get(h) ?? { atual: 0, ant: 0 };
    if (d >= ini) cur.atual += n(v["gmv"]);
    else cur.ant += n(v["gmv"]);
    g.set(h, cur);
  }
  const base = regra.faixas[0]!;
  const faixaDe = (m: number) => [...regra.faixas].reverse().find((f) => m >= f.de) ?? base;
  const creators: FaixaCreator[] = [];
  for (const [h, x] of g) {
    if (x.atual <= 0) continue;
    const contribuicao = (x.atual * margemPct) / 100;
    const contribuicaoAnterior = (x.ant * margemPct) / 100;
    const medida = regra.base === "gmv" ? x.atual : contribuicao;
    const medidaAnterior = regra.base === "gmv" ? x.ant : contribuicaoAnterior;
    const pela = faixaDe(medida);
    const depois = (f: Faixa) =>
      contribuicao - (x.atual * (f.comissaoPct - base.comissaoPct)) / 100;
    const cabe = [...regra.faixas]
      .reverse()
      .find(
        (f) => f.comissaoPct <= pela.comissaoPct && f.de <= medida && (f === base || depois(f) > 0),
      );
    const sugerida = cabe ?? base;
    const deltaPp = sugerida.comissaoPct - base.comissaoPct;
    const custoExtra = (x.atual * deltaPp) / 100;
    const anterior = faixaDe(medidaAnterior);
    const cruzou = sugerida.comissaoPct > base.comissaoPct && pela.de > anterior.de;
    const limitada = sugerida.comissaoPct < pela.comissaoPct;
    const brl = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
    creators.push({
      handle: `@${h}`,
      nome: nomes.get(h) || `@${h}`,
      gmvJanela: x.atual,
      contribuicao,
      contribuicaoAnterior,
      medida,
      medidaAnterior,
      faixaPelaMedida: pela,
      faixaSugerida: sugerida,
      deltaPp,
      custoExtra,
      contribuicaoDepois: contribuicao - custoExtra,
      cruzou,
      limitadaPelaMargem: limitada,
      leitura: limitada
        ? `A faixa de ${pela.comissaoPct}% comeria toda a contribuição; o máximo que cabe é ${sugerida.comissaoPct}%.`
        : deltaPp > 0
          ? `${cruzou ? "Passou de faixa nesta janela. " : ""}+${deltaPp} p.p. custam ${brl(custoExtra)} e sobram ${brl(contribuicao - custoExtra)} de contribuição.`
          : "Fica na comissão base.",
    });
  }
  creators.sort((a, b) => b.medida - a.medida);
  const porFaixa = regra.faixas.map((f) => {
    const cs = creators.filter((c) => c.faixaSugerida.de === f.de);
    return {
      faixa: rotuloFaixa(f, regra.base),
      creators: cs.length,
      gmv: cs.reduce((s, c) => s + c.gmvJanela, 0),
      custoExtra: cs.reduce((s, c) => s + c.custoExtra, 0),
    };
  });
  return {
    regra,
    creators,
    custoExtraTotal: creators.reduce((s, c) => s + c.custoExtra, 0),
    porFaixa,
  };
}

// ---------------------------------------------------------------------------------------------
// Direitos de uso (Spark Ads no TikTok, anúncio de parceria no Meta)

export const STATUS_DIREITO = [
  "solicitado",
  "ativo",
  "pagamento_pendente",
  "expirado",
  "rejeitado",
  "cancelado",
] as const;
export const STATUS_DIREITO_LABEL: Record<string, string> = {
  solicitado: "Solicitado",
  ativo: "Ativo",
  pagamento_pendente: "Pagamento pendente",
  expirado: "Expirado",
  rejeitado: "Rejeitado",
  cancelado: "Cancelado",
};
export const PLATAFORMA_DIREITO_LABEL: Record<string, string> = {
  tiktok_spark: "TikTok Spark Ads",
  meta_partnership: "Meta (parceria)",
};
/** Estados em que o vídeo já tem (ou está pedindo) direito: não entra como candidato. */
const EM_ANDAMENTO = new Set(["solicitado", "ativo", "pagamento_pendente"]);
export const DIREITO_VENCENDO_DIAS = 7;

export type DireitoUso = {
  id: string;
  creator: string;
  handle: string;
  videoId: string;
  plataforma: string;
  status: string;
  valor: number;
  inicio: string;
  fim: string;
  diasParaVencer: number | null;
  vencendo: boolean;
  /** Ativo no cadastro, mas a data de fim já passou: atualizar o status. */
  vencido: boolean;
  temCodigo: boolean;
};

export type CandidatoSpark = {
  videoId: string;
  titulo: string;
  creator: string;
  produto: string;
  views: number;
  gmv: number;
  gmvMilViews: number;
  indice: number | null;
  vidaUtilDias: number | null;
  motivo: string;
};

type PecaVideo = {
  id: string;
  titulo: string;
  creator: string;
  produtoNome: string;
  views: number;
  gmv: number;
  gmvMilViews: number | null;
  vidaUtilDias: number | null;
  dna?: { produto: string };
};

/** Mínimo de views para um vídeo virar candidato (abaixo disso, GMV por mil views é ruído). [HIPÓTESE] */
export const SPARK_MIN_VIEWS = 5000;

export function direitosDeUso(rows: Row[], cadastro: Row[], pecas: PecaVideo[], hoje: string) {
  const cad = new Map(cadastro.map((c) => [txt(c["id"]), c]));
  const lista: DireitoUso[] = rows
    .map((r) => {
      const c = cad.get(txt(r["creator_id"])) ?? {};
      const h = handle((c as Row)["tiktok_username"]);
      const status = txt(r["status"]);
      const fim = dia(r["fim"]);
      const dpv = fim ? diasEntre(hoje, fim) : null;
      const ativo = status === "ativo";
      return {
        id: txt(r["id"]),
        creator: txt((c as Row)["nome"]) || (h ? `@${h}` : "—"),
        handle: h ? `@${h}` : "",
        videoId: txt(r["video_id"]),
        plataforma: txt(r["plataforma"]),
        status,
        valor: n(r["valor"]),
        inicio: dia(r["inicio"]),
        fim,
        diasParaVencer: dpv,
        vencendo: ativo && dpv != null && dpv >= 0 && dpv <= DIREITO_VENCENDO_DIAS,
        vencido: ativo && dpv != null && dpv < 0,
        temCodigo: r["tem_codigo"] === true || r["tem_codigo"] === "true",
      };
    })
    .sort(
      (a, b) =>
        Number(b.vencido) - Number(a.vencido) ||
        Number(b.vencendo) - Number(a.vencendo) ||
        STATUS_DIREITO.indexOf(a.status as never) - STATUS_DIREITO.indexOf(b.status as never) ||
        (a.fim || "9").localeCompare(b.fim || "9"),
    );
  const contagem = Object.fromEntries(
    STATUS_DIREITO.map((s) => [s, lista.filter((d) => d.status === s).length]),
  ) as Record<(typeof STATUS_DIREITO)[number], number>;
  const comDireito = new Set(lista.filter((d) => EM_ANDAMENTO.has(d.status)).map((d) => d.videoId));
  // Só vídeos acima da média de GMV por mil views dos vídeos de creators no período.
  const deCreator = pecas.filter((p) => p.creator && p.views > 0);
  const viewsT = deCreator.reduce((s, p) => s + p.views, 0);
  const media = viewsT ? (deCreator.reduce((s, p) => s + p.gmv, 0) / viewsT) * 1000 : 0;
  const candidatos: CandidatoSpark[] = deCreator
    .filter(
      (p) =>
        p.gmv > 0 &&
        p.views >= SPARK_MIN_VIEWS &&
        p.gmvMilViews != null &&
        p.gmvMilViews >= media &&
        !comDireito.has(p.id),
    )
    .sort((a, b) => (b.gmvMilViews ?? 0) - (a.gmvMilViews ?? 0))
    .slice(0, 20)
    .map((p) => ({
      videoId: p.id,
      titulo: p.titulo,
      creator: p.creator,
      produto:
        p.produtoNome || (p.dna?.produto !== "(não identificado)" ? (p.dna?.produto ?? "") : ""),
      views: p.views,
      gmv: p.gmv,
      gmvMilViews: p.gmvMilViews ?? 0,
      vidaUtilDias: p.vidaUtilDias,
      indice: media ? (p.gmvMilViews ?? 0) / media : null,
      motivo:
        (media
          ? `${((p.gmvMilViews ?? 0) / media).toFixed(1).replace(".", ",")}× a média`
          : "converte bem") +
        (p.vidaUtilDias == null
          ? "; ainda não perdeu força"
          : `; perdeu força em ${p.vidaUtilDias} dias (impulsionar renova o alcance)`),
    }));
  return {
    lista,
    contagem,
    vencendo: lista.filter((d) => d.vencendo),
    vencidos: lista.filter((d) => d.vencido).length,
    valorAtivo: lista.filter((d) => d.status === "ativo").reduce((s, d) => s + d.valor, 0),
    pagamentoPendente: lista
      .filter((d) => d.status === "pagamento_pendente")
      .reduce((s, d) => s + d.valor, 0),
    candidatos,
    mediaGmvMilViews: media,
  };
}
