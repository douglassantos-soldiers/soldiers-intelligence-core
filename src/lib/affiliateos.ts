// Affiliate OS (Plano Mestre cap. 8): três notas por creator, ciclo de vida e funil, amostras com alertas e ROI,
// outreach por critérios, elasticidade da comissão, sinais de risco, concorrentes e qualidade do cliente por cupom.
// Só leitura e recomendação. Notas e sinais são regras explicáveis, não modelos treinados.

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const nn = (v: unknown) =>
  v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
const txt = (v: unknown) => String(v ?? "").trim();
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const div = (a: number, b: number) => (b ? a / b : null);
const pct = (a: number, b: number) => (b ? (a / b) * 100 : null);
const diasEntre = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const somaDias = (iso: string, d: number) =>
  new Date(Date.parse(iso + "T00:00:00Z") + d * 86400000).toISOString().slice(0, 10);
const handle = (v: unknown) => txt(v).replace(/^@/, "").toLowerCase();
/** Categoria do produto = primeira palavra do nome ("Creatina 300g" → "creatina"). */
export const categoria = (produto: unknown) =>
  txt(produto)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[\s\-–]+/)[0] ?? "";

// ---------------------------------------------------------------------------------------------
// Ciclo de vida (cap. 8.5)

export const ESTAGIOS = [
  "encontrado",
  "qualificado",
  "convidado",
  "aceitou",
  "amostra",
  "conteudo",
  "primeira_venda",
  "vendas_recorrentes",
  "escala",
  "embaixador",
  "reativacao",
] as const;
export type Estagio = (typeof ESTAGIOS)[number] | "descartado";
export const ESTAGIO_LABEL: Record<string, string> = {
  encontrado: "Encontrado",
  qualificado: "Qualificado",
  convidado: "Convidado",
  aceitou: "Aceitou",
  amostra: "Amostra",
  conteudo: "Conteúdo",
  primeira_venda: "Primeira venda",
  vendas_recorrentes: "Vendas recorrentes",
  escala: "Escala",
  embaixador: "Embaixador",
  reativacao: "Reativação",
  descartado: "Descartado",
};

// ---------------------------------------------------------------------------------------------
// Creators do TikTok pelos vídeos (fact_tiktok_video_dia)

export type CreatorTT = {
  handle: string;
  gmv: number;
  gmv28: number;
  gmvAnt28: number;
  views: number;
  videos: number;
  diasComVenda: number;
  semanasComVenda: number;
  primeiraVenda: string;
  ultimaVenda: string;
  produtos: Map<string, number>; // categoria → GMV
  maiorDia: number;
};

export function creatorsTikTok(videos: Row[], ref: string): Map<string, CreatorTT> {
  const d28 = somaDias(ref, -27);
  const d56 = somaDias(ref, -55);
  const m = new Map<string, CreatorTT & { _dias: Map<string, number>; _videos: Set<string> }>();
  for (const v of videos) {
    const h = handle(v["criador"]);
    if (!h) continue;
    const d = dia(v["data"]);
    if (d > ref) continue;
    const cur =
      m.get(h) ??
      ({
        handle: h,
        gmv: 0,
        gmv28: 0,
        gmvAnt28: 0,
        views: 0,
        videos: 0,
        diasComVenda: 0,
        semanasComVenda: 0,
        primeiraVenda: "",
        ultimaVenda: "",
        produtos: new Map(),
        maiorDia: 0,
        _dias: new Map(),
        _videos: new Set(),
      } as CreatorTT & {
        _dias: Map<string, number>;
        _videos: Set<string>;
      });
    const g = n(v["gmv"]);
    cur.gmv += g;
    cur.views += n(v["views"]);
    if (txt(v["video_id"])) cur._videos.add(txt(v["video_id"]));
    if (d >= d28) cur.gmv28 += g;
    else if (d >= d56) cur.gmvAnt28 += g;
    if (g > 0) {
      cur._dias.set(d, (cur._dias.get(d) ?? 0) + g);
      if (!cur.primeiraVenda || d < cur.primeiraVenda) cur.primeiraVenda = d;
      if (d > cur.ultimaVenda) cur.ultimaVenda = d;
      const cat = categoria(v["produto_nome"]);
      if (cat) cur.produtos.set(cat, (cur.produtos.get(cat) ?? 0) + g);
    }
    m.set(h, cur);
  }
  const out = new Map<string, CreatorTT>();
  for (const [h, c] of m) {
    const semanas = new Set(
      [...c._dias.keys()].map((d) => Math.floor(Date.parse(d) / (7 * 86400000))),
    );
    const { _dias, _videos, ...rest } = c;
    out.set(h, {
      ...rest,
      videos: _videos.size,
      diasComVenda: _dias.size,
      semanasComVenda: semanas.size,
      maiorDia: Math.max(0, ..._dias.values()),
    });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// As três notas (cap. 8.4)

/** Posição de x entre os valores (0 = menor, 1 = maior). */
const percentil = (x: number, todos: number[]) =>
  todos.length > 1 ? todos.filter((v) => v < x).length / (todos.length - 1) : 1;

/**
 * Creator Score (0–100): qualidade histórica.
 * 40% GMV (percentil) + 20% consistência (dias com venda ÷ dias desde a 1ª venda) + 20% recência (meia-vida de 30 dias)
 * + 20% eficiência (GMV por mil views, percentil).
 */
export function creatorScore(c: CreatorTT, todos: CreatorTT[], ref: string) {
  if (c.gmv <= 0) return 0;
  const gmvP = percentil(
    c.gmv,
    todos.map((x) => x.gmv),
  );
  const vida = c.primeiraVenda ? Math.max(1, diasEntre(c.primeiraVenda, ref) + 1) : 1;
  const consist = Math.min(1, c.diasComVenda / vida);
  const rec = c.ultimaVenda ? Math.pow(0.5, diasEntre(c.ultimaVenda, ref) / 30) : 0;
  const ef = (x: CreatorTT) => (x.views ? (x.gmv / x.views) * 1000 : 0);
  const efP = percentil(ef(c), todos.map(ef));
  return Math.round(100 * (0.4 * gmvP + 0.2 * consist + 0.2 * rec + 0.2 * efP));
}

/** Product Fit (0–100): fatia do GMV do creator que vem da categoria do produto. */
export function productFit(c: CreatorTT, produto: string) {
  const cat = categoria(produto);
  if (!cat || c.gmv <= 0) return 0;
  return Math.round(((c.produtos.get(cat) ?? 0) / c.gmv) * 100);
}

/** Quantos creators já vendem a categoria (competição interna pelo mesmo público). */
export function competicao(todos: CreatorTT[], produto: string) {
  const cat = categoria(produto);
  return todos.filter((c) => (c.produtos.get(cat) ?? 0) > 0).length;
}

/**
 * Opportunity (0–100): vale agir agora? Creator Score × Product Fit × crescimento × disponibilidade ÷ competição,
 * normalizado pelo maior da lista.
 */
export function opportunityBruta(
  score: number,
  fit: number,
  c: CreatorTT,
  disponivel: number,
  competidores: number,
) {
  const cresc = c.gmvAnt28
    ? Math.min(2, Math.max(0.5, c.gmv28 / c.gmvAnt28))
    : c.gmv28 > 0
      ? 1.5
      : 0.5;
  return ((score / 100) * (Math.max(fit, 5) / 100) * cresc * disponivel) / (1 + competidores / 10);
}

// ---------------------------------------------------------------------------------------------
// Lista de creators (TikTok pelos vídeos + cadastro do Affiliate OS)

export type CreatorOS = {
  chave: string;
  nome: string;
  handle: string;
  tier: string;
  estagio: string;
  estagioFonte: "cadastro" | "dados";
  cadastrado: boolean;
  gmv: number;
  gmv28: number;
  crescimentoPct: number | null;
  views: number;
  videos: number;
  ultimaVenda: string;
  creatorScore: number;
  productFit: number;
  opportunity: number;
  categoriaPrincipal: string;
  concorrencia: "Soldiers" | "híbrido" | "exclusivo concorrente" | "migrável" | "—";
  risco: boolean;
  tipoConta: "creator" | "loja" | "agencia";
  tipoFonte: "cadastro" | "regra";
  tipoMotivo: string;
};

/**
 * Conta de loja × creator (benchmark Cruva §10.2: o ranking de "top afiliados" deles mistura contas com 2 a 42
 * seguidores e milhões em GMV). [HIPÓTESE] Vender muito sem audiência própria indica conta de loja/operação
 * (LIVE da própria marca, anúncio, link direto), não creator. O cadastro (affiliate_creator.tipo_conta) vence a regra.
 */
export const REGRA_CONTA_LOJA = { gmvMin: 2000, seguidoresMax: 1000, viewsMax: 2000 } as const;

export function tipoDeConta(
  c: { gmv: number; views: number },
  cad?: Row,
): Pick<CreatorOS, "tipoConta" | "tipoFonte" | "tipoMotivo"> {
  const manual = txt(cad?.["tipo_conta"]);
  if (manual === "creator" || manual === "loja" || manual === "agencia")
    return { tipoConta: manual, tipoFonte: "cadastro", tipoMotivo: "informado no cadastro" };
  const R = REGRA_CONTA_LOJA;
  const seg = cad?.["seguidores"] == null || cad["seguidores"] === "" ? null : n(cad["seguidores"]);
  if (c.gmv >= R.gmvMin && seg != null && seg < R.seguidoresMax)
    return {
      tipoConta: "loja",
      tipoFonte: "regra",
      tipoMotivo: `vende R$ ${Math.round(c.gmv).toLocaleString("pt-BR")} com ${seg} seguidores`,
    };
  if (c.gmv >= R.gmvMin && seg == null && c.views < R.viewsMax)
    return {
      tipoConta: "loja",
      tipoFonte: "regra",
      tipoMotivo: `vende R$ ${Math.round(c.gmv).toLocaleString("pt-BR")} com ${c.views.toLocaleString("pt-BR")} views em 90 dias`,
    };
  return { tipoConta: "creator", tipoFonte: "regra", tipoMotivo: "" };
}

const NICHO_COMPATIVEL =
  /suplement|fitness|academia|treino|nutri|muscula|crossfit|corrida|saude|saúde|esporte/i;

export function estagioPelosDados(c: CreatorTT, score: number): Estagio {
  if (c.gmv <= 0) return "conteudo";
  if (score >= 75 && c.semanasComVenda >= 4) return "escala";
  if (c.semanasComVenda >= 2) return "vendas_recorrentes";
  return "primeira_venda";
}

export function classificaConcorrencia(
  concorrentes: string[],
  gmvSoldiers: number,
  nicho: string,
): CreatorOS["concorrencia"] {
  if (!concorrentes.length) return gmvSoldiers > 0 ? "Soldiers" : "—";
  if (gmvSoldiers > 0) return "híbrido";
  return NICHO_COMPATIVEL.test(nicho) ? "migrável" : "exclusivo concorrente";
}

export function listaCreatorsOS(
  videos: Row[],
  cadastro: Row[],
  ref: string,
  produtoFoco: string,
  emRisco: Set<string> = new Set(),
): CreatorOS[] {
  const tt = creatorsTikTok(videos, ref);
  const todos = [...tt.values()];
  const comp = competicao(todos, produtoFoco);
  const porHandle = new Map(
    cadastro.filter((c) => txt(c["tiktok_username"])).map((c) => [handle(c["tiktok_username"]), c]),
  );
  const chaves = new Set([...tt.keys(), ...porHandle.keys()]);
  const vazio: CreatorTT = {
    handle: "",
    gmv: 0,
    gmv28: 0,
    gmvAnt28: 0,
    views: 0,
    videos: 0,
    diasComVenda: 0,
    semanasComVenda: 0,
    primeiraVenda: "",
    ultimaVenda: "",
    produtos: new Map(),
    maiorDia: 0,
  };
  const lista = [...chaves].map((h) => {
    const c = tt.get(h) ?? { ...vazio, handle: h };
    const cad = porHandle.get(h);
    const score = creatorScore(c, todos, ref);
    const fit = productFit(c, produtoFoco);
    const estagioCad = cad ? txt(cad["estagio"]) : "";
    const estagio = estagioCad || estagioPelosDados(c, score);
    // Parado há mais de 45 dias ou com sinal de risco: metade da disponibilidade. Descartado: zero.
    const risco = emRisco.has(`@${h}`);
    const disponivel =
      (estagio === "descartado"
        ? 0
        : c.ultimaVenda && diasEntre(c.ultimaVenda, ref) > 45
          ? 0.5
          : 1) * (risco ? 0.5 : 1);
    const catTop = [...c.produtos.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    const tipo = tipoDeConta(c, cad);
    const concorrentes = Array.isArray(cad?.["concorrentes"])
      ? (cad!["concorrentes"] as unknown[]).map(txt).filter(Boolean)
      : [];
    return {
      chave: cad ? `cad:${txt(cad["id"])}` : `tt:${h}`,
      nome: cad ? txt(cad["nome"]) : `@${h}`,
      handle: `@${h}`,
      tier: cad ? txt(cad["tier"]) : "",
      estagio,
      estagioFonte: (estagioCad ? "cadastro" : "dados") as CreatorOS["estagioFonte"],
      cadastrado: !!cad,
      gmv: c.gmv,
      gmv28: c.gmv28,
      crescimentoPct: c.gmvAnt28 ? ((c.gmv28 - c.gmvAnt28) / c.gmvAnt28) * 100 : null,
      views: c.views,
      videos: c.videos,
      ultimaVenda: c.ultimaVenda,
      creatorScore: score,
      productFit: fit,
      // Conta de loja não entra no ranking de quem convidar (fica visível, marcada).
      opportunity:
        tipo.tipoConta === "loja" ? 0 : opportunityBruta(score, fit, c, disponivel, comp),
      categoriaPrincipal: catTop,
      concorrencia: classificaConcorrencia(concorrentes, c.gmv, cad ? txt(cad["nicho"]) : ""),
      risco,
      ...tipo,
    };
  });
  const max = Math.max(0, ...lista.map((l) => l.opportunity));
  return lista
    .map((l) => ({ ...l, opportunity: max ? Math.round((l.opportunity / max) * 100) : 0 }))
    .sort((a, b) => b.opportunity - a.opportunity || b.gmv - a.gmv);
}

/** Funil do creator (cap. 8.6): quantos passaram por cada etapa (cumulativo a partir do estágio atual). */
export function funilCreators(creators: CreatorOS[]) {
  const ordem = ESTAGIOS.filter((e) => e !== "reativacao");
  const idx = (e: string) => ordem.indexOf(e as (typeof ordem)[number]);
  return ordem.map((e, i) => {
    const chegaram = creators.filter((c) => idx(c.estagio) >= i).length;
    const anterior = i ? creators.filter((c) => idx(c.estagio) >= i - 1).length : null;
    return {
      estagio: e,
      label: ESTAGIO_LABEL[e]!,
      agora: creators.filter((c) => c.estagio === e).length,
      chegaram,
      passagemPct: anterior ? pct(chegaram, anterior) : null,
    };
  });
}

// ---------------------------------------------------------------------------------------------
// Amostras (cap. 8.9 e 8.10)

export const STATUS_AMOSTRA = [
  "solicitou",
  "aprovado",
  "aguardando_envio",
  "enviado",
  "recebido",
  "conteudo_pendente",
  "publicado",
  "vendeu",
] as const;
/** Saíram do fluxo (migração 20261006140000). "Atrasado" não é estado: é calculado pelos prazos. */
export const STATUS_ENCERRADOS = ["rejeitado", "expirado", "ignorado", "cancelado"] as const;
export const STATUS_AMOSTRA_LABEL: Record<string, string> = {
  solicitou: "Para revisar",
  aprovado: "Aprovado",
  aguardando_envio: "Pronto para enviar",
  enviado: "Em transporte",
  recebido: "Recebido",
  conteudo_pendente: "Conteúdo pendente",
  publicado: "Publicado",
  vendeu: "Vendeu",
  rejeitado: "Rejeitado",
  expirado: "Expirado",
  ignorado: "Ignorado",
  cancelado: "Cancelado",
};
/** Prazos que marcam a amostra como atrasada (alertas do cap. 8.9). */
export const PRAZOS_AMOSTRA = { revisar: 3, envio: 5, recebimento: 14, publicar: 7 } as const;

export type Amostra = {
  id: string;
  creator: string;
  handle: string;
  sku: string;
  produto: string;
  status: string;
  diasNaEtapa: number | null;
  investimento: number;
  gmvDepois: number;
  contribuicao: number;
  roi: number | null;
  alertas: string[];
  atrasada: boolean;
  encerrada: boolean;
  recebidoEm: string;
  publicadoEm: string;
};

/**
 * ROI da amostra: (GMV do creator no TikTok depois do envio × margem da venda via afiliado) ÷ (produto + frete + desconto + outros).
 * A margem via afiliado já desconta a comissão (vw_tiktok_afiliado_dia.margem_afiliado_pct).
 */
export function amostrasOS(
  amostras: Row[],
  cadastro: Row[],
  videos: Row[],
  margemAfiliadoPct: number,
  hoje: string,
): Amostra[] {
  const creators = new Map(cadastro.map((c) => [txt(c["id"]), c]));
  return amostras
    .map((a) => {
      const c = creators.get(txt(a["creator_id"])) ?? {};
      const h = handle((c as Row)["tiktok_username"]);
      const status = txt(a["status"]);
      const enviado = dia(a["enviado_em"]);
      const recebido = dia(a["recebido_em"]);
      const publicado = dia(a["publicado_em"]);
      const dataEtapa: Record<string, string> = {
        solicitou: dia(a["solicitado_em"]),
        aprovado: dia(a["aprovado_em"]),
        aguardando_envio: dia(a["aprovado_em"]),
        enviado,
        recebido,
        conteudo_pendente: recebido,
        publicado,
        vendeu: dia(a["primeira_venda_em"]),
      };
      const encerrada = (STATUS_ENCERRADOS as readonly string[]).includes(status);
      if (encerrada) dataEtapa[status] = dia(a["encerrado_em"]);
      const desde = dataEtapa[status] || dia(a["solicitado_em"]);
      const diasNaEtapa = desde ? diasEntre(desde, hoje) : null;
      const gmvDepois =
        h && enviado
          ? videos
              .filter((v) => handle(v["criador"]) === h && dia(v["data"]) >= enviado)
              .reduce((s, v) => s + n(v["gmv"]), 0)
          : 0;
      const investimento =
        n(a["custo_produto"]) + n(a["frete"]) + n(a["desconto"]) + n(a["outros_custos"]);
      const contribuicao = (gmvDepois * margemAfiliadoPct) / 100;
      const roi = div(contribuicao, investimento);
      const alertas: string[] = [];
      const P = PRAZOS_AMOSTRA;
      if (status === "solicitou" && diasNaEtapa != null && diasNaEtapa >= P.revisar)
        alertas.push(`${P.revisar}+ dias para revisar`);
      if (
        (status === "aprovado" || status === "aguardando_envio") &&
        diasNaEtapa != null &&
        diasNaEtapa >= P.envio
      )
        alertas.push(`${P.envio}+ dias sem envio`);
      if (
        (status === "recebido" || status === "conteudo_pendente") &&
        recebido &&
        diasEntre(recebido, hoje) >= 7
      )
        alertas.push("7 dias sem publicar");
      if (status === "enviado" && enviado && diasEntre(enviado, hoje) >= 14)
        alertas.push("14 dias sem confirmar recebimento");
      if (status === "publicado" && publicado && diasEntre(publicado, hoje) >= 14 && gmvDepois <= 0)
        alertas.push("publicou sem venda");
      if (publicado && diasEntre(publicado, hoje) >= 30 && roi != null && roi < 1)
        alertas.push("ROI baixo");
      return {
        id: txt(a["id"]),
        creator: txt((c as Row)["nome"]) || (h ? `@${h}` : "—"),
        handle: h ? `@${h}` : "",
        sku: txt(a["sku"]),
        produto: txt(a["produto"]) || txt(a["sku"]),
        status,
        diasNaEtapa,
        investimento,
        gmvDepois,
        contribuicao,
        roi,
        alertas: encerrada ? [] : alertas,
        atrasada: !encerrada && alertas.some((t) => /dias/.test(t)),
        encerrada,
        recebidoEm: recebido,
        publicadoEm: publicado,
      };
    })
    .sort(
      (a, b) =>
        Number(a.encerrada) - Number(b.encerrada) ||
        b.alertas.length - a.alertas.length ||
        STATUS_AMOSTRA.indexOf(a.status as never) - STATUS_AMOSTRA.indexOf(b.status as never),
    );
}

/** Semana (segunda-feira) de uma data AAAA-MM-DD. */
const semanaDe = (d: string) => {
  const t = new Date(d + "T00:00:00Z");
  const dow = (t.getUTCDay() + 6) % 7;
  return new Date(t.getTime() - dow * 86400000).toISOString().slice(0, 10);
};

/**
 * Funil de amostras por semana de entrega (benchmark Cruva §10.2): entregues, quantas já viraram post e a taxa de
 * cumprimento. Mediana de dias entre receber e postar. Semanas recentes ainda podem subir (creator tem prazo).
 */
export function funilAmostrasSemanal(amostras: Amostra[], hoje: string, semanas = 8) {
  const limite = semanaDe(
    new Date(Date.parse(hoje + "T00:00:00Z") - (semanas - 1) * 7 * 86400000)
      .toISOString()
      .slice(0, 10),
  );
  const m = new Map<string, { entregues: number; publicadas: number; dias: number[] }>();
  for (const a of amostras) {
    if (!a.recebidoEm) continue;
    const w = semanaDe(a.recebidoEm);
    if (w < limite) continue;
    const cur = m.get(w) ?? { entregues: 0, publicadas: 0, dias: [] };
    cur.entregues += 1;
    if (a.publicadoEm) {
      cur.publicadas += 1;
      cur.dias.push(diasEntre(a.recebidoEm, a.publicadoEm));
    }
    m.set(w, cur);
  }
  const mediana = (xs: number[]) => {
    if (!xs.length) return null;
    const o = [...xs].sort((x, y) => x - y);
    const k = Math.floor(o.length / 2);
    return o.length % 2 ? o[k]! : (o[k - 1]! + o[k]!) / 2;
  };
  return [...m.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([semana, x]) => ({
      semana,
      entregues: x.entregues,
      publicadas: x.publicadas,
      cumprimentoPct: pct(x.publicadas, x.entregues),
      diasAtePostar: mediana(x.dias),
      emAberto: diasEntre(semana, hoje) < PRAZOS_AMOSTRA.publicar + 7,
    }));
}

/**
 * Retenção por coorte (benchmark Cruva §10.2): coorte = mês do primeiro vídeo do creator; ativo no mês N = publicou
 * vídeo novo naquele mês. Usa publicado_em do vídeo (ou o primeiro dia em que ele aparece).
 */
export function retencaoCoortes(videos: Row[], hoje: string, meses = 6) {
  const primeiro = new Map<string, string>(); // vídeo → data de publicação
  const dono = new Map<string, string>();
  for (const v of videos) {
    const id = txt(v["video_id"]);
    const h = handle(v["criador"]);
    if (!id || !h) continue;
    const d = dia(v["publicado_em"]) || dia(v["data"]);
    if (!d) continue;
    if (!primeiro.has(id) || d < primeiro.get(id)!) primeiro.set(id, d);
    dono.set(id, h);
  }
  const mesesPorCreator = new Map<string, Set<string>>();
  for (const [id, d] of primeiro) {
    const h = dono.get(id)!;
    const s = mesesPorCreator.get(h) ?? new Set<string>();
    s.add(d.slice(0, 7));
    mesesPorCreator.set(h, s);
  }
  const mesAtual = hoje.slice(0, 7);
  const soma = (mes: string, k: number) => {
    const [a, m] = mes.split("-").map(Number);
    return new Date(Date.UTC(a!, m! - 1 + k, 1)).toISOString().slice(0, 7);
  };
  const inicio = soma(mesAtual, -(meses - 1));
  const coortes = new Map<string, string[]>();
  for (const [h, ms] of mesesPorCreator) {
    const c = [...ms].sort()[0]!;
    if (c < inicio) continue;
    coortes.set(c, [...(coortes.get(c) ?? []), h]);
  }
  return [...coortes.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([coorte, hs]) => ({
      coorte,
      creators: hs.length,
      meses: Array.from({ length: meses }, (_, k) => {
        const mes = soma(coorte, k);
        if (mes > mesAtual) return null;
        const ativos = hs.filter((h) => mesesPorCreator.get(h)!.has(mes)).length;
        return pct(ativos, hs.length);
      }),
    }));
}

// ---------------------------------------------------------------------------------------------
// Outreach (cap. 8.8)

export type Campanha = {
  id: string;
  nome: string;
  sku: string;
  produto: string;
  comissaoPct: number | null;
  status: string;
  convites: Record<string, number>;
  sugeridos: {
    nome: string;
    handle: string;
    creatorScore: number;
    productFit: number;
    opportunity: number;
    gmv: number;
  }[];
};

export function outreachOS(
  campanhas: Row[],
  convites: Row[],
  cadastro: Row[],
  videos: Row[],
  skuNome: Map<string, string>,
  ref: string,
): Campanha[] {
  const tt = creatorsTikTok(videos, ref);
  const todos = [...tt.values()];
  const porId = new Map(cadastro.map((c) => [txt(c["id"]), c]));
  return campanhas.map((cp) => {
    const id = txt(cp["id"]);
    const sku = txt(cp["sku"]);
    const produto = skuNome.get(sku) ?? sku;
    const meus = convites.filter((v) => txt(v["campanha_id"]) === id);
    const conv: Record<string, number> = {};
    for (const v of meus) conv[txt(v["status"])] = (conv[txt(v["status"])] ?? 0) + 1;
    const jaConvidados = new Set(
      meus.map((v) => handle(porId.get(txt(v["creator_id"]))?.["tiktok_username"])).filter(Boolean),
    );
    const scoreMin = n(cp["creator_score_min"]);
    const fitMin = n(cp["product_fit_min"]);
    const gmvMin = n(cp["gmv_min"]);
    const comp = competicao(todos, produto);
    const sugeridos = todos
      .filter((c) => !jaConvidados.has(c.handle))
      .map((c) => {
        const s = creatorScore(c, todos, ref);
        const f = productFit(c, produto);
        return {
          nome: `@${c.handle}`,
          handle: `@${c.handle}`,
          creatorScore: s,
          productFit: f,
          opportunity: opportunityBruta(s, f, c, 1, comp),
          gmv: c.gmv,
        };
      })
      .filter((c) => c.creatorScore >= scoreMin && c.productFit >= fitMin && c.gmv >= gmvMin)
      .sort((a, b) => b.opportunity - a.opportunity)
      .slice(0, 15);
    const max = Math.max(0, ...sugeridos.map((s) => s.opportunity));
    return {
      id,
      nome: txt(cp["nome"]),
      sku,
      produto,
      comissaoPct: nn(cp["comissao_pct"]),
      status: txt(cp["status"]),
      convites: conv,
      sugeridos: sugeridos.map((s) => ({
        ...s,
        opportunity: max ? Math.round((s.opportunity / max) * 100) : 0,
      })),
    };
  });
}

// ---------------------------------------------------------------------------------------------
// Elasticidade da comissão (cap. 8.13)

export type FaixaComissao = {
  faixa: string;
  de: number;
  dias: number;
  gmvDia: number;
  custoPct: number | null;
  liquidoDia: number;
};
export type Elasticidade = {
  canal: string;
  faixas: FaixaComissao[];
  inclinacao: number | null;
  gmvMedioDia: number;
  compensa: boolean | null;
  leitura: string;
};

/** Regressão linear simples (mínimos quadrados) de y em x. */
export function inclinacao(pts: { x: number; y: number }[]) {
  if (pts.length < 5) return null;
  const mx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const my = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const sxx = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  if (!sxx) return null;
  return pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / sxx;
}

/**
 * Agrupa dias por faixa de comissão efetiva (5 p.p.) e estima quanto o GMV/dia muda a cada +1 p.p.
 * "Compensa" quando o GMV extra × margem cobre o custo extra de 1 p.p. sobre o GMV médio. É correlação, não causa.
 */
export function elasticidade(
  canal: string,
  rows: Row[],
  k: { taxa: string; gmv: string },
  margemPct: number,
): Elasticidade {
  const pts = rows
    .map((r) => ({ x: nn(r[k.taxa]), y: n(r[k.gmv]) }))
    .filter((p): p is { x: number; y: number } => p.x != null && p.y > 0);
  const fx = pts.some((p) => p.x > 1) ? 1 : 100; // aceita fração ou %
  const p2 = pts.map((p) => ({ x: p.x * fx, y: p.y }));
  const faixas = new Map<number, { dias: number; gmv: number; custo: number }>();
  for (const p of p2) {
    const f = Math.floor(p.x / 5) * 5;
    const cur = faixas.get(f) ?? { dias: 0, gmv: 0, custo: 0 };
    cur.dias++;
    cur.gmv += p.y;
    cur.custo += (p.y * p.x) / 100;
    faixas.set(f, cur);
  }
  const lista = [...faixas.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([f, x]) => ({
      faixa: `${f}–${f + 5}%`,
      de: f,
      dias: x.dias,
      gmvDia: x.gmv / x.dias,
      custoPct: pct(x.custo, x.gmv),
      liquidoDia: (x.gmv - x.custo) / x.dias,
    }));
  const incl = inclinacao(p2);
  const gmvMedio = p2.length ? p2.reduce((s, p) => s + p.y, 0) / p2.length : 0;
  const compensa = incl == null ? null : (incl * margemPct) / 100 > gmvMedio * 0.01;
  const brl = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
  const leitura =
    incl == null
      ? "Pouca variação de comissão para medir."
      : `Cada +1 p.p. de comissão veio junto de ${incl >= 0 ? "+" : ""}${brl(incl)}/dia de GMV. ${compensa ? "Com a margem atual, o ganho cobre o custo extra." : "O ganho não cobre o custo extra da comissão."}`;
  return { canal, faixas: lista, inclinacao: incl, gmvMedioDia: gmvMedio, compensa, leitura };
}

// ---------------------------------------------------------------------------------------------
// Sinais de risco / fraude (cap. 8.2 "Fraud Detection"). Sinais para revisar, não acusação.

export type Sinal = { tipo: "cupom" | "creator"; quem: string; sinal: string; detalhe: string };

export function sinaisDeRisco(cupons: Row[], videos: Row[], ref: string): Sinal[] {
  const out: Sinal[] = [];
  // Cupons do site
  const m = new Map<
    string,
    { pedidos: number; un: number; dev: number; desc: number; bruto: number }
  >();
  for (const r of cupons) {
    const k = txt(r["cupom"]).toUpperCase();
    if (!k) continue;
    const cur = m.get(k) ?? { pedidos: 0, un: 0, dev: 0, desc: 0, bruto: 0 };
    cur.pedidos += n(r["pedidos"]);
    cur.un += n(r["unidades"]);
    cur.dev += n(r["unidades_devolvidas"]);
    cur.desc += n(r["desconto"]);
    cur.bruto += n(r["faturamento_bruto"]);
    m.set(k, cur);
  }
  const tot = [...m.values()].reduce((s, x) => ({ un: s.un + x.un, dev: s.dev + x.dev }), {
    un: 0,
    dev: 0,
  });
  const devMedia = tot.un ? tot.dev / tot.un : 0;
  for (const [k, x] of m) {
    if (x.pedidos < 5) continue;
    const dev = x.un ? x.dev / x.un : 0;
    if (devMedia > 0 && dev > 2 * devMedia && x.dev >= 2)
      out.push({
        tipo: "cupom",
        quem: k,
        sinal: "devolução alta",
        detalhe: `${(dev * 100).toFixed(1).replace(".", ",")}% das unidades, média dos cupons ${(devMedia * 100).toFixed(1).replace(".", ",")}%`,
      });
    const desc = x.bruto ? (x.desc / x.bruto) * 100 : 0;
    if (desc > 30)
      out.push({
        tipo: "cupom",
        quem: k,
        sinal: "desconto alto",
        detalhe: `${Math.round(desc)}% de desconto médio: cupom pode ter vazado para site de cupons`,
      });
  }
  // Creators do TikTok
  const tt = [...creatorsTikTok(videos, ref).values()].filter((c) => c.gmv > 0);
  const ef = tt.filter((c) => c.views > 0).map((c) => (c.gmv / c.views) * 1000);
  const med = ef.length ? [...ef].sort((a, b) => a - b)[Math.floor(ef.length / 2)]! : 0;
  for (const c of tt) {
    const e = c.views ? (c.gmv / c.views) * 1000 : null;
    if (e != null && med > 0 && e > 5 * med && c.gmv >= 1000)
      out.push({
        tipo: "creator",
        quem: `@${c.handle}`,
        sinal: "conversão fora do padrão",
        detalhe: `R$ ${Math.round(e)} por mil views, mediana R$ ${Math.round(med)}`,
      });
    if (c.gmv >= 2000 && c.maiorDia > 0.7 * c.gmv)
      out.push({
        tipo: "creator",
        quem: `@${c.handle}`,
        sinal: "venda concentrada em 1 dia",
        detalhe: `${Math.round((c.maiorDia / c.gmv) * 100)}% do GMV num único dia`,
      });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Qualidade do cliente por creator (cap. 8.14) a partir de mv_cupom_cliente_qualidade

export function qualidadePorCreator(qual: Row[], nomes: Map<string, string>) {
  return qual
    .map((q) => {
      const cupom = txt(q["cupom"]).toUpperCase();
      const clientes = n(q["clientes"]);
      return {
        cupom,
        creator: nomes.get(cupom) ?? "",
        clientes,
        novosPct: pct(n(q["clientes_novos"]), clientes),
        recompraPct: pct(n(q["recompraram"]), clientes),
        ltvMedio: nn(q["ltv_medio"]),
        pedidosMedio: nn(q["pedidos_medio"]),
      };
    })
    .filter((x) => x.clientes > 0)
    .sort((a, b) => b.clientes - a.clientes);
}

// ---------------------------------------------------------------------------------------------
// Alertas para o Command Center

export type AlertaCanal = {
  tipo: "problema" | "oportunidade";
  tag: string;
  tom: "danger" | "warn" | "success" | "primary";
  texto: string;
};

export function alertasAffiliateOS(i: {
  amostras: Amostra[];
  creators: CreatorOS[];
  sinais: Sinal[];
}): AlertaCanal[] {
  const out: AlertaCanal[] = [];
  const atras = i.amostras.filter((a) => a.alertas.length);
  if (atras.length)
    out.push({
      tipo: "problema",
      tag: "Amostras",
      tom: "warn",
      texto: `${atras.length} amostra(s) com alerta, como ${atras[0]!.creator}: ${atras[0]!.alertas[0]}.`,
    });
  if (i.sinais.length)
    out.push({
      tipo: "problema",
      tag: "Risco afiliado",
      tom: "warn",
      texto: `${i.sinais.length} sinal(is) para revisar, como ${i.sinais[0]!.quem}: ${i.sinais[0]!.sinal}.`,
    });
  const top = i.creators.find((c) => !c.cadastrado && c.opportunity >= 80);
  if (top)
    out.push({
      tipo: "oportunidade",
      tag: "Creator",
      tom: "success",
      texto: `${top.handle} tem Opportunity ${top.opportunity} e ainda não está no Affiliate OS. Avaliar convite.`,
    });
  return out;
}
