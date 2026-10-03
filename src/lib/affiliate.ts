// Affiliate Copilot: "O que devo fazer hoje?" (plano AffiliateOS BR §17; Plano Mestre caps. 8 e 28).
// Funções puras sobre dados que já existem no Supabase (fact_tiktok_video_dia, dim_influenciador).
// Só leitura e recomendação: nenhuma ação é executada (IA lê → recomenda → executa, princípio 15).
//
// Valores em GMV aqui são VENDAS ATRIBUÍDAS ao vídeo/creator pelo TikTok, não receita realizada
// da Soldiers (cap. 13.2). Servem para priorizar, não para somar com a receita.

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const menosDias = (fim: string, d: number) =>
  new Date(new Date(fim.slice(0, 10) + "T00:00:00Z").getTime() - d * 86400000)
    .toISOString()
    .slice(0, 10);

/** "@Joao.Fit " → "joao.fit" (para casar o @ do TikTok entre tabelas). */
export function normalizaHandle(v: unknown): string {
  return String(v ?? "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
}

export type VideoEscala = {
  video_id: string;
  criador: string;
  titulo: string;
  produto: string;
  views: number;
  gmv: number;
  pedidos: number;
  gpm: number; // GMV por mil views
  vsMediana: number; // GPM do vídeo ÷ GPM mediano (ex.: 2.1 = 2,1×)
};

/**
 * Vídeos candidatos a virar anúncio (Spark Ads): nos últimos `janela` dias, com views mínimas,
 * GMV mínimo e GMV por mil views (GPM) acima de `fator` × a mediana dos vídeos do período.
 */
export function videosParaEscalar(
  rows: Row[],
  fim: string,
  { janela = 14, viewsMin = 5000, gmvMin = 500, fator = 1.5, top = 8 } = {},
): VideoEscala[] {
  const inicio = menosDias(fim, janela - 1);
  const m = new Map<string, VideoEscala>();
  for (const r of rows) {
    const d = dia(r["data"]);
    if (d < inicio || d > fim.slice(0, 10)) continue;
    const id = String(r["video_id"] ?? "");
    if (!id) continue;
    const cur = m.get(id) ?? {
      video_id: id,
      criador: normalizaHandle(r["criador"]),
      titulo: String(r["titulo"] ?? ""),
      produto: String(r["produto_nome"] ?? ""),
      views: 0,
      gmv: 0,
      pedidos: 0,
      gpm: 0,
      vsMediana: 0,
    };
    cur.views += n(r["views"]);
    cur.gmv += n(r["gmv"]);
    cur.pedidos += n(r["sku_orders"]);
    m.set(id, cur);
  }
  const elegiveis = [...m.values()].filter((v) => v.views >= viewsMin);
  for (const v of elegiveis) v.gpm = (v.gmv / v.views) * 1000;
  const gpms = elegiveis.map((v) => v.gpm).sort((a, b) => a - b);
  const mediana = gpms.length ? gpms[Math.floor((gpms.length - 1) / 2)]! : 0;
  return elegiveis
    .filter((v) => v.gmv >= gmvMin && mediana > 0 && v.gpm >= fator * mediana)
    .map((v) => ({ ...v, vsMediana: v.gpm / mediana }))
    .sort((a, b) => b.gmv - a.gmv)
    .slice(0, top);
}

export type CreatorPeriodo = {
  criador: string;
  atual: number;
  anterior: number;
  variacao: number | null;
  videos: number;
};

function gmvPorCriador(rows: Row[], de: string, ate: string) {
  const m = new Map<string, { gmv: number; videos: Set<string> }>();
  for (const r of rows) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    const c = normalizaHandle(r["criador"]);
    if (!c) continue;
    const cur = m.get(c) ?? { gmv: 0, videos: new Set<string>() };
    cur.gmv += n(r["gmv"]);
    cur.videos.add(String(r["video_id"] ?? ""));
    m.set(c, cur);
  }
  return m;
}

/** Creators com GMV crescendo: últimos 7 dias vs 7 anteriores, crescimento ≥ `minCresc` %. */
export function creatorsEmAlta(
  rows: Row[],
  fim: string,
  { gmvMin = 1000, minCresc = 50, top = 8 } = {},
): CreatorPeriodo[] {
  const f = fim.slice(0, 10);
  const atual = gmvPorCriador(rows, menosDias(f, 6), f);
  const anterior = gmvPorCriador(rows, menosDias(f, 13), menosDias(f, 7));
  const out: CreatorPeriodo[] = [];
  for (const [criador, a] of atual) {
    const ant = anterior.get(criador)?.gmv ?? 0;
    if (a.gmv < gmvMin) continue;
    const variacao = ant > 0 ? ((a.gmv - ant) / ant) * 100 : null; // null = novo no período
    if (variacao != null && variacao < minCresc) continue;
    out.push({ criador, atual: a.gmv, anterior: ant, variacao, videos: a.videos.size });
  }
  return out.sort((x, y) => y.atual - y.anterior - (x.atual - x.anterior)).slice(0, top);
}

/**
 * Creators para reativar (cap. 8.15): venderam nos dias 31–90 antes de `fim` e não venderam nada
 * nos últimos 30 dias. Ordenados pelo GMV que já geraram.
 */
export function creatorsParaReativar(
  rows: Row[],
  fim: string,
  { gmvMin = 1000, top = 8 } = {},
): CreatorPeriodo[] {
  const f = fim.slice(0, 10);
  const recente = gmvPorCriador(rows, menosDias(f, 29), f);
  const antes = gmvPorCriador(rows, menosDias(f, 89), menosDias(f, 30));
  const out: CreatorPeriodo[] = [];
  for (const [criador, a] of antes) {
    if (a.gmv < gmvMin) continue;
    if ((recente.get(criador)?.gmv ?? 0) > 0) continue;
    out.push({ criador, atual: 0, anterior: a.gmv, variacao: -100, videos: a.videos.size });
  }
  return out.sort((x, y) => y.anterior - x.anterior).slice(0, top);
}

export type InfluenciadorSemVenda = {
  nome: string;
  tiktok: string;
  tier: string;
  custo: number; // cachê fixo ou custo total cadastrado
  desde: string | null;
};

/** Contrato ativo: sem data de fim (ou fim no futuro) e status que não indica encerramento. */
export function contratoAtivo(r: Row, hoje: string): boolean {
  const fimC = dia(r["data_fim"]);
  if (fimC && fimC < hoje.slice(0, 10)) return false;
  return !/encerr|inativ|cancel|paus|finaliz/i.test(String(r["status"] ?? ""));
}

/**
 * Influenciadores com contrato ativo e @ do TikTok cadastrado que não têm vídeo com venda
 * da Soldiers nos últimos 30 dias.
 */
export function influenciadoresSemVenda(
  infl: Row[],
  videos: Row[],
  fim: string,
  top = 10,
): InfluenciadorSemVenda[] {
  const f = fim.slice(0, 10);
  const comVenda = gmvPorCriador(videos, menosDias(f, 29), f);
  return infl
    .filter((i) => contratoAtivo(i, f))
    .map((i) => ({ i, handle: normalizaHandle(i["tiktok_username"]) }))
    .filter(({ handle }) => handle && !((comVenda.get(handle)?.gmv ?? 0) > 0))
    .map(({ i, handle }) => ({
      nome: String(i["nome"] ?? handle),
      tiktok: handle,
      tier: String(i["tier"] ?? "—"),
      custo: n(i["cache_fixo"]) || n(i["custo_total"]),
      desde: i["data_inicio"] ? dia(i["data_inicio"]) : null,
    }))
    .sort((a, b) => b.custo - a.custo)
    .slice(0, top);
}
