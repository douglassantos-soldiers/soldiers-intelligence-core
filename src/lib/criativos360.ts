// Central de criativos (Plano Mestre cap. 7.5): de "ROAS do criativo" para Criativo → Cliente → LTV → Contribuição.
// Fontes que JÁ existem: vw_meta_anuncio_dia_completo (desempenho por anúncio e dia), cria_criativo / cria_asset
// (biblioteca), meta_criativo_item (subida em massa), vw_tiktok_ads_criativo_dia, vw_google_pmax_asset,
// vw_ml_display_criativo_dia e mv_pl_canal_dia (margem). Nova: mv_criativo_cliente (pedido → anúncio → cliente → LTV).
// Receita do Meta é a informada pela plataforma; a receita "com cliente" vem do Shopify pelo utm_content. Nunca somar as duas.

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const nn = (v: unknown) =>
  v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
const txt = (v: unknown) => String(v ?? "").trim();
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const div = (a: number, b: number) => (b ? a / b : null);
const pct = (a: number, b: number) => (b ? (a / b) * 100 : null);

// ---------------------------------------------------------------------------------------------
// Etiquetas a partir do nome, texto e tipo do anúncio (padrão de nome da subida em massa: LOTE_TIPO_PROP_NNN)

export type Etiquetas = {
  formato: string;
  proporcao: string;
  produto: string;
  ugc: boolean;
  creator: string;
};

const PRODUTOS: [RegExp, string][] = [
  [/creatin/i, "Creatina"],
  [/whey|prote[ií]na/i, "Whey"],
  [/pr[eé][\s_-]?treino|pre[\s_-]?workout/i, "Pré-treino"],
  [/glutamin/i, "Glutamina"],
  [/bcaa/i, "BCAA"],
  [/col[aá]geno/i, "Colágeno"],
  [/multivit|vitamina/i, "Vitaminas"],
];

export function etiquetas(nome: unknown, texto: unknown, tipo: unknown): Etiquetas {
  const s = `${txt(nome)} ${txt(texto)}`;
  const t = txt(tipo).toUpperCase();
  const formato = /CARROSS|CAROUSEL|(?<![a-z])CARR(?![a-z])/i.test(s)
    ? "Carrossel"
    : /(?<![a-z])(VID|VIDEO|V[IÍ]DEO|REELS?)(?![a-z])/i.test(txt(nome)) || t === "VIDEO"
      ? "Vídeo"
      : /(?<![a-z])IMG(?![a-z])|IMAGEM|ESTATIC|STATIC|FOTO/i.test(txt(nome)) ||
          t === "PHOTO" ||
          t === "SHARE"
        ? "Imagem"
        : "Outro";
  const prop =
    txt(nome)
      .match(/(?<![0-9])(9x16|4x5|1x1|16x9)(?![0-9])/i)?.[1]
      ?.toLowerCase() ?? "";
  const produto = PRODUTOS.find(([re]) => re.test(s))?.[1] ?? "";
  const creator = s.match(/@([a-z0-9._]{3,30})/i)?.[1]?.toLowerCase() ?? "";
  return { formato, proporcao: prop, produto, ugc: /\bUGC\b/i.test(s) || !!creator, creator };
}

// ---------------------------------------------------------------------------------------------
// Placar por criativo (Meta): desempenho + cliente + LTV + contribuição

export type CriativoPlacar = {
  creativeId: string;
  nome: string;
  titulo: string;
  texto: string;
  thumbnail: string;
  link: string;
  anuncios: number;
  noAr: boolean;
  gasto: number;
  impressoes: number;
  cliques: number;
  ctrPct: number | null;
  hookPct: number | null;
  retencaoPct: number | null;
  frequencia: number | null;
  compras: number;
  receitaMeta: number;
  roasMeta: number | null;
  // Shopify (via utm_content)
  pedidos: number | null;
  receitaShopify: number | null;
  clientesNovos: number | null;
  recompraPct: number | null;
  ltvNovos: number | null;
  cac: number | null;
  ltvCac: number | null;
  contribuicao: number | null;
  contribuicaoLtv: number | null;
  etiquetas: Etiquetas;
  leitura: "escalar" | "manter" | "renovar" | "cortar" | "observar";
  motivo: string;
};

export const REGRAS = { gastoMinimo: 200, freqFadiga: 3, quedaCtr: 0.3, ltvCacBom: 3 } as const;

/**
 * Agrega por creative_id (vários anúncios podem usar o mesmo criativo).
 * Contribuição = receita no Shopify × margem do site − gasto. Contribuição LTV = clientes novos × LTV × margem − gasto.
 */
export function placarMeta(
  anuncios: Row[],
  clientePorAnuncio: Row[],
  margemSitePct: number,
  de: string,
  ate: string,
): CriativoPlacar[] {
  const fim = Date.parse(ate + "T00:00:00Z");
  const d7 = new Date(fim - 6 * 86400000).toISOString().slice(0, 10);
  const d14 = new Date(fim - 13 * 86400000).toISOString().slice(0, 10);
  const cli = new Map(clientePorAnuncio.map((c) => [txt(c["ad_id"]), c]));
  type Acc = {
    nome: string;
    titulo: string;
    texto: string;
    tipo: string;
    thumb: string;
    link: string;
    ads: Set<string>;
    noAr: boolean;
    gasto: number;
    imp: number;
    alc: number;
    cli: number;
    v25: number;
    v100: number;
    compras: number;
    rec: number;
    imp7: number;
    cli7: number;
    impAnt: number;
    cliAnt: number;
    freq7: number[];
  };
  const m = new Map<string, Acc>();
  for (const r of anuncios) {
    const d = dia(r["data"]);
    if (d < de || d > ate) continue;
    const id = txt(r["creative_id"]) || `ad:${txt(r["ad_id"])}`;
    const a =
      m.get(id) ??
      ({
        nome: txt(r["ad_name"]),
        titulo: txt(r["ad_title"]),
        texto: txt(r["ad_body"]),
        tipo: txt(r["object_type"]),
        thumb: txt(r["thumbnail_url"]),
        link: txt(r["instagram_permalink_url"]) || txt(r["facebook_permalink_url"]),
        ads: new Set(),
        noAr: false,
        gasto: 0,
        imp: 0,
        alc: 0,
        cli: 0,
        v25: 0,
        v100: 0,
        compras: 0,
        rec: 0,
        imp7: 0,
        cli7: 0,
        impAnt: 0,
        cliAnt: 0,
        freq7: [],
      } as Acc);
    a.ads.add(txt(r["ad_id"]));
    if (txt(r["effective_status"]).toUpperCase() === "ACTIVE") a.noAr = true;
    a.gasto += n(r["gasto"]);
    a.imp += n(r["impressoes"]);
    a.alc += n(r["alcance"]);
    a.cli += n(r["cliques"]);
    a.v25 += n(r["video_25"]);
    a.v100 += n(r["video_100"]);
    a.compras += n(r["compras"]);
    a.rec += n(r["receita"]);
    if (d >= d7) {
      a.imp7 += n(r["impressoes"]);
      a.cli7 += n(r["cliques"]);
      if (nn(r["frequencia"]) != null) a.freq7.push(n(r["frequencia"]));
    } else if (d >= d14) {
      a.impAnt += n(r["impressoes"]);
      a.cliAnt += n(r["cliques"]);
    }
    m.set(id, a);
  }
  return [...m.entries()]
    .map(([creativeId, a]) => {
      const cs = [...a.ads].map((ad) => cli.get(ad)).filter((x): x is Row => !!x);
      const temCli = cs.length > 0;
      const s = (k: string) => cs.reduce((t, c) => t + n(c[k]), 0);
      const novos = temCli ? s("clientes_novos") : null;
      const ltvNovos =
        temCli && novos
          ? cs.reduce((t, c) => t + n(c["ltv_medio_novos"]) * n(c["clientes_novos"]), 0) / novos
          : null;
      const receitaShopify = temCli ? s("receita") : null;
      const cac = novos ? a.gasto / novos : null;
      const ctr = pct(a.cli, a.imp);
      const ctr7 = pct(a.cli7, a.imp7);
      const ctrAnt = pct(a.cliAnt, a.impAnt);
      const freq = a.freq7.length
        ? a.freq7.reduce((x, y) => x + y, 0) / a.freq7.length
        : div(a.imp, a.alc);
      const contribuicao =
        receitaShopify == null ? null : (receitaShopify * margemSitePct) / 100 - a.gasto;
      const contribuicaoLtv =
        novos == null || ltvNovos == null
          ? null
          : (novos * ltvNovos * margemSitePct) / 100 - a.gasto;
      const ltvCac = ltvNovos != null && cac ? ltvNovos / cac : null;
      // Leitura
      let leitura: CriativoPlacar["leitura"] = "manter";
      let motivo = "";
      const caiu =
        ctr7 != null && ctrAnt != null && ctrAnt > 0 && ctr7 < ctrAnt * (1 - REGRAS.quedaCtr);
      if (a.gasto < REGRAS.gastoMinimo) {
        leitura = "observar";
        motivo = "gastou pouco para julgar";
      } else if (
        (contribuicaoLtv ?? contribuicao ?? 0) < 0 &&
        (a.compras === 0 || (contribuicao ?? 0) < 0)
      ) {
        leitura = "cortar";
        motivo =
          contribuicaoLtv != null
            ? "nem o LTV dos clientes novos paga o gasto"
            : "contribuição negativa";
      } else if (
        contribuicao == null &&
        contribuicaoLtv == null &&
        a.compras === 0 &&
        a.gasto >= 2 * REGRAS.gastoMinimo
      ) {
        leitura = "cortar";
        motivo = "gastou sem nenhuma compra";
      } else if (caiu && (freq ?? 0) >= REGRAS.freqFadiga) {
        leitura = "renovar";
        motivo = `CTR caiu ${Math.round((1 - (ctr7 ?? 0) / (ctrAnt ?? 1)) * 100)}% com frequência ${(freq ?? 0).toFixed(1).replace(".", ",")}`;
      } else if (ltvCac != null && ltvCac >= REGRAS.ltvCacBom) {
        leitura = "escalar";
        motivo = `LTV ${ltvCac.toFixed(1).replace(".", ",")}× o custo de cada cliente novo`;
      } else if (ltvCac == null && (contribuicao ?? 0) > 0) {
        leitura = "escalar";
        motivo = "contribuição positiva (sem LTV ainda)";
      }
      return {
        creativeId,
        nome: a.nome || creativeId,
        titulo: a.titulo,
        texto: a.texto,
        thumbnail: a.thumb,
        link: a.link,
        anuncios: a.ads.size,
        noAr: a.noAr,
        gasto: a.gasto,
        impressoes: a.imp,
        cliques: a.cli,
        ctrPct: ctr,
        hookPct: a.v25 ? pct(a.v25, a.imp) : null,
        retencaoPct: a.v25 ? pct(a.v100, a.v25) : null,
        frequencia: freq,
        compras: a.compras,
        receitaMeta: a.rec,
        roasMeta: div(a.rec, a.gasto),
        pedidos: temCli ? s("pedidos") : null,
        receitaShopify,
        clientesNovos: novos,
        recompraPct: novos ? pct(s("novos_que_recompraram"), novos) : null,
        ltvNovos,
        cac,
        ltvCac,
        contribuicao,
        contribuicaoLtv,
        etiquetas: etiquetas(a.nome, `${a.titulo} ${a.texto}`, a.tipo),
        leitura,
        motivo,
      };
    })
    .sort((a, b) => b.gasto - a.gasto);
}

// ---------------------------------------------------------------------------------------------
// O que funciona: desempenho agregado por etiqueta

export type GrupoEtiqueta = {
  dimensao: string;
  valor: string;
  criativos: number;
  gasto: number;
  roasMeta: number | null;
  ctrPct: number | null;
  clientesNovos: number;
  cac: number | null;
  ltvCac: number | null;
  contribuicaoLtv: number | null;
};

export function oQueFunciona(placar: CriativoPlacar[]): GrupoEtiqueta[] {
  const dims: [string, (c: CriativoPlacar) => string][] = [
    ["Formato", (c) => c.etiquetas.formato],
    ["Proporção", (c) => c.etiquetas.proporcao || "(sem)"],
    ["Produto", (c) => c.etiquetas.produto || "(sem)"],
    ["Tipo", (c) => (c.etiquetas.ugc ? "UGC / creator" : "Marca")],
  ];
  const out: GrupoEtiqueta[] = [];
  for (const [dim, f] of dims) {
    const m = new Map<string, CriativoPlacar[]>();
    for (const c of placar) m.set(f(c), [...(m.get(f(c)) ?? []), c]);
    for (const [valor, cs] of m) {
      const gasto = cs.reduce((s, c) => s + c.gasto, 0);
      const rec = cs.reduce((s, c) => s + c.receitaMeta, 0);
      const imp = cs.reduce((s, c) => s + c.impressoes, 0);
      const cli = cs.reduce((s, c) => s + c.cliques, 0);
      const comCli = cs.filter((c) => c.clientesNovos != null);
      const novos = comCli.reduce((s, c) => s + (c.clientesNovos ?? 0), 0);
      const gastoCli = comCli.reduce((s, c) => s + c.gasto, 0);
      const ltvSoma = comCli.reduce((s, c) => s + (c.ltvNovos ?? 0) * (c.clientesNovos ?? 0), 0);
      const cac = novos ? gastoCli / novos : null;
      const ltv = novos ? ltvSoma / novos : null;
      out.push({
        dimensao: dim,
        valor,
        criativos: cs.length,
        gasto,
        roasMeta: div(rec, gasto),
        ctrPct: pct(cli, imp),
        clientesNovos: novos,
        cac,
        ltvCac: ltv != null && cac ? ltv / cac : null,
        contribuicaoLtv: comCli.length
          ? comCli.reduce((s, c) => s + (c.contribuicaoLtv ?? 0), 0)
          : null,
      });
    }
  }
  return out.sort((a, b) => a.dimensao.localeCompare(b.dimensao) || b.gasto - a.gasto);
}

// ---------------------------------------------------------------------------------------------
// Multicanal: criativos de TikTok, Google (PMax) e Meli DSP no mesmo formato

export type CriativoCanal = {
  canal: string;
  id: string;
  nome: string;
  gasto: number | null;
  receita: number | null;
  roas: number | null;
  leitura: string;
};

export function multicanal(
  i: { tiktok: Row[]; pmax: Row[]; dsp: Row[] },
  de: string,
  ate: string,
): CriativoCanal[] {
  const out: CriativoCanal[] = [];
  const agrega = (rows: Row[], id: string, nome: string, g: string, r: string) => {
    const m = new Map<string, { nome: string; g: number; r: number }>();
    for (const x of rows) {
      const d = dia(x["data"]);
      if (d && (d < de || d > ate)) continue;
      const k = txt(x[id]);
      if (!k) continue;
      const cur = m.get(k) ?? { nome: txt(x[nome]) || k, g: 0, r: 0 };
      cur.g += n(x[g]);
      cur.r += n(x[r]);
      m.set(k, cur);
    }
    return m;
  };
  for (const [k, x] of agrega(
    i.tiktok.filter((r) => r["agregado"] !== true),
    "item_id",
    "produto",
    "invest",
    "receita",
  ))
    out.push({
      canal: "TikTok Ads",
      id: k,
      nome: x.nome,
      gasto: x.g,
      receita: x.r,
      roas: div(x.r, x.g),
      leitura: "",
    });
  for (const [k, x] of agrega(i.dsp, "creative_id", "creative_name", "investimento", "receita"))
    out.push({
      canal: "Meli DSP",
      id: k,
      nome: x.nome,
      gasto: x.g,
      receita: x.r,
      roas: div(x.r, x.g),
      leitura: "",
    });
  for (const a of i.pmax) {
    const tipo = txt(a["asset_type"]) || txt(a["field_type"]);
    if (!/IMAGE|VIDEO|YOUTUBE/i.test(tipo)) continue;
    out.push({
      canal: "Google PMax",
      id: txt(a["asset_id"]),
      nome: txt(a["texto"]) || txt(a["youtube_video_id"]) || `${tipo} ${txt(a["asset_id"])}`,
      gasto: null,
      receita: null,
      roas: null,
      leitura: txt(a["performance_label"]),
    });
  }
  const roasMed = (canal: string) => {
    const cs = out.filter((c) => c.canal === canal && c.gasto);
    const g = cs.reduce((s, c) => s + (c.gasto ?? 0), 0);
    return g ? cs.reduce((s, c) => s + (c.receita ?? 0), 0) / g : null;
  };
  for (const c of out)
    if (c.gasto != null && !c.leitura) {
      const med = roasMed(c.canal);
      c.leitura =
        c.gasto < 100
          ? "observar"
          : med && c.roas != null && c.roas >= 1.3 * med
            ? "escalar"
            : (c.receita ?? 0) === 0
              ? "cortar"
              : "manter";
    }
  return out.sort((a, b) => (b.gasto ?? -1) - (a.gasto ?? -1));
}

// ---------------------------------------------------------------------------------------------
// Biblioteca (cria_criativo + cria_asset + subida em massa) e onde cada arquivo está em uso

export type ItemBiblioteca = {
  id: string;
  nome: string;
  tipo: string;
  dimensoes: string;
  duracaoSeg: number | null;
  origem: string;
  criadoEm: string;
  plataformas: { plataforma: string; estado: string; erro: string }[];
  emUso: number;
  gasto: number;
};

/**
 * Liga arquivo da biblioteca a criativo em uso: (1) creative_id gravado na subida em massa (exato);
 * (2) nome do arquivo contido no nome do anúncio [HIPÓTESE: padrão de nome].
 */
export function biblioteca(
  criativos: Row[],
  assets: Row[],
  itensLote: Row[],
  placar: CriativoPlacar[],
): ItemBiblioteca[] {
  const porCriativo = new Map<string, Row[]>();
  for (const a of assets) {
    const k = txt(a["criativo_id"]);
    porCriativo.set(k, [...(porCriativo.get(k) ?? []), a]);
  }
  const loteNome = new Map<string, string>(); // nome do criativo no lote → creative_id
  for (const i of itensLote)
    if (txt(i["meta_creative_id"]))
      loteNome.set(txt(i["nome_criativo"]).toLowerCase(), txt(i["meta_creative_id"]));
  const porId = new Map(placar.map((p) => [p.creativeId, p]));
  return criativos
    .map((c) => {
      const nome = txt(c["nome"]);
      const base = nome.replace(/\.[a-z0-9]+$/i, "").toLowerCase();
      const usados = placar.filter(
        (p) =>
          (loteNome.get(base) && p.creativeId === loteNome.get(base)) ||
          (base.length >= 6 && p.nome.toLowerCase().includes(base)),
      );
      const exato = loteNome.get(base) ? porId.get(loteNome.get(base)!) : undefined;
      const lista = exato && !usados.includes(exato) ? [exato, ...usados] : usados;
      return {
        id: txt(c["id"]),
        nome,
        tipo: txt(c["tipo"]),
        dimensoes:
          nn(c["largura"]) && nn(c["altura"]) ? `${n(c["largura"])}×${n(c["altura"])}` : "",
        duracaoSeg: nn(c["duracao_seg"]),
        origem: txt(c["origem"]),
        criadoEm: dia(c["criado_em"]),
        plataformas: (porCriativo.get(txt(c["id"])) ?? []).map((a) => ({
          plataforma: txt(a["plataforma"]),
          estado: txt(a["estado"]),
          erro: txt(a["erro_msg"]),
        })),
        emUso: lista.length,
        gasto: lista.reduce((s, p) => s + p.gasto, 0),
      };
    })
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

// ---------------------------------------------------------------------------------------------
// Alertas

export type AlertaCanal = {
  tipo: "problema" | "oportunidade";
  tag: string;
  tom: "danger" | "warn" | "success" | "primary";
  texto: string;
};

export function alertasCriativos(
  placar: CriativoPlacar[],
  biblio: ItemBiblioteca[],
): AlertaCanal[] {
  const out: AlertaCanal[] = [];
  const brl = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
  const cortar = placar.filter((c) => c.leitura === "cortar" && c.noAr);
  if (cortar.length)
    out.push({
      tipo: "problema",
      tag: "Criativos",
      tom: "warn",
      texto: `${cortar.length} criativo(s) no ar com contribuição negativa, ${brl(cortar.reduce((s, c) => s + c.gasto, 0))} de gasto.`,
    });
  const renovar = placar.filter((c) => c.leitura === "renovar");
  if (renovar.length)
    out.push({
      tipo: "problema",
      tag: "Criativos",
      tom: "warn",
      texto: `${renovar.length} criativo(s) cansando (CTR caindo com frequência alta), como "${renovar[0]!.nome}".`,
    });
  const erros = biblio.filter((b) => b.plataformas.some((p) => /erro|falh/i.test(p.estado)));
  if (erros.length)
    out.push({
      tipo: "problema",
      tag: "Biblioteca",
      tom: "warn",
      texto: `${erros.length} arquivo(s) da biblioteca com erro de envio para alguma plataforma.`,
    });
  const escalar = placar
    .filter((c) => c.leitura === "escalar" && c.ltvCac != null)
    .sort((a, b) => (b.ltvCac ?? 0) - (a.ltvCac ?? 0));
  if (escalar.length)
    out.push({
      tipo: "oportunidade",
      tag: "Criativos",
      tom: "success",
      texto: `"${escalar[0]!.nome}" traz cliente com LTV ${(escalar[0]!.ltvCac ?? 0).toFixed(1).replace(".", ",")}× o custo. Candidato a mais verba.`,
    });
  return out;
}
