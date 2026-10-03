// Subida de criativos em massa para a biblioteca do Meta Ads: regras de validação.
// Usado no navegador (feedback imediato) e no servidor (validação que vale).
// Os limites abaixo são conservadores e configuráveis; os oficiais estão na documentação de
// especificações de anúncios do Meta e devem ser conferidos lá (benchmarks/meta-ads/ANALISE.md).

export const LIMITES = {
  maxItensPorLote: 300,
  imagem: {
    mimes: ["image/jpeg", "image/png"],
    maxBytes: 30 * 1024 * 1024,
    larguraMin: 600,
    larguraRecomendada: 1080,
  },
  // 200 MB por vídeo: limite do executor (Edge Function), não do Meta. Vídeos maiores: comprimir ou subir no Gerenciador.
  video: {
    mimes: ["video/mp4", "video/quicktime"],
    maxBytes: 200 * 1024 * 1024,
    larguraMin: 600,
    duracaoMaxSeg: 241 * 60,
  },
  texto: {
    principalRecomendado: 125,
    principalMax: 2200,
    tituloRecomendado: 40,
    tituloMax: 255,
    descricaoRecomendada: 30,
    descricaoMax: 255,
  },
  dominiosPermitidos: ["soldiersnutrition.com.br"],
} as const;

/** CTAs aceitos na subida (subconjunto dos tipos de call_to_action do Meta). */
export const CTAS = {
  SHOP_NOW: "Comprar agora",
  BUY_NOW: "Comprar",
  ORDER_NOW: "Pedir agora",
  LEARN_MORE: "Saiba mais",
  GET_OFFER: "Obter oferta",
  SIGN_UP: "Cadastre-se",
  SUBSCRIBE: "Assinar",
} as const;
export type Cta = keyof typeof CTAS;

/** Proporções aceitas sem aviso: 1:1, 4:5, 9:16 e 1,91:1 (tolerância de 2%). */
export const PROPORCOES = [
  { rotulo: "1x1", valor: 1 },
  { rotulo: "4x5", valor: 4 / 5 },
  { rotulo: "9x16", valor: 9 / 16 },
  { rotulo: "191x100", valor: 1.91 },
] as const;

export type ItemCriativo = {
  arquivoNome: string;
  tipo: "imagem" | "video";
  mime: string;
  bytes: number;
  sha256: string;
  largura?: number | null;
  altura?: number | null;
  duracaoSeg?: number | null;
  nomeCriativo: string;
  textoPrincipal?: string;
  titulo?: string;
  descricao?: string;
  cta: string;
  link: string;
  urlTags?: string;
};

export type Validacao = { erros: string[]; avisos: string[] };

export function tipoDoMime(mime: string): "imagem" | "video" | null {
  if ((LIMITES.imagem.mimes as readonly string[]).includes(mime)) return "imagem";
  if ((LIMITES.video.mimes as readonly string[]).includes(mime)) return "video";
  return null;
}

export function proporcao(largura?: number | null, altura?: number | null) {
  if (!largura || !altura) return null;
  const r = largura / altura;
  return PROPORCOES.find((p) => Math.abs(r - p.valor) / p.valor <= 0.02)?.rotulo ?? null;
}

export function dominioPermitido(
  link: string,
  dominios: readonly string[] = LIMITES.dominiosPermitidos,
) {
  try {
    const u = new URL(link);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    return dominios.some((d) => host === d || host.endsWith("." + d));
  } catch {
    return false;
  }
}

/** url_tags no formato do Meta: chave=valor&chave=valor (aceita macros como {{ad.name}}). */
export function urlTagsValidas(tags: string) {
  if (!tags) return true;
  return tags.split("&").every((p) => /^[a-z0-9_]+=[^&\s]+$/i.test(p));
}

const fmtMB = (b: number) => `${(b / 1024 / 1024).toFixed(0)} MB`;

export function validaItem(
  i: ItemCriativo,
  dominios: readonly string[] = LIMITES.dominiosPermitidos,
): Validacao {
  const erros: string[] = [];
  const avisos: string[] = [];
  const tipo = tipoDoMime(i.mime);
  if (!tipo)
    erros.push(`formato ${i.mime || "desconhecido"} não aceito (use JPG, PNG, MP4 ou MOV)`);
  else if (tipo !== i.tipo) erros.push("tipo do arquivo não confere com o formato");
  if (!/^[0-9a-f]{64}$/.test(i.sha256)) erros.push("arquivo sem impressão digital (sha256)");
  const lim = i.tipo === "video" ? LIMITES.video : LIMITES.imagem;
  if (!(i.bytes > 0)) erros.push("arquivo vazio");
  else if (i.bytes > lim.maxBytes)
    erros.push(`arquivo de ${fmtMB(i.bytes)} passa do limite de ${fmtMB(lim.maxBytes)}`);
  if (i.largura != null && i.largura < lim.larguraMin)
    erros.push(`largura ${i.largura}px abaixo do mínimo de ${lim.larguraMin}px`);
  else if (
    i.tipo === "imagem" &&
    i.largura != null &&
    i.largura < LIMITES.imagem.larguraRecomendada
  )
    avisos.push(
      `largura ${i.largura}px abaixo da recomendada (${LIMITES.imagem.larguraRecomendada}px)`,
    );
  if (i.largura && i.altura && !proporcao(i.largura, i.altura))
    avisos.push("proporção fora de 1:1, 4:5, 9:16 ou 1,91:1");
  if (i.tipo === "video") {
    if (i.duracaoSeg != null && i.duracaoSeg > LIMITES.video.duracaoMaxSeg)
      erros.push("vídeo longo demais");
    else if (i.duracaoSeg != null && i.duracaoSeg > 60)
      avisos.push("vídeo com mais de 60s (Reels e Stories cortam ou não entregam)");
  }

  const nome = i.nomeCriativo.trim();
  if (!nome) erros.push("sem nome de criativo");
  else if (nome.length > 255) erros.push("nome com mais de 255 caracteres");

  const t = LIMITES.texto;
  const principal = (i.textoPrincipal ?? "").trim();
  if (!principal) avisos.push("sem texto principal");
  else if (principal.length > t.principalMax)
    erros.push(`texto principal com mais de ${t.principalMax} caracteres`);
  else if (principal.length > t.principalRecomendado)
    avisos.push(
      `texto principal com ${principal.length} caracteres (recomendado até ${t.principalRecomendado})`,
    );
  const titulo = (i.titulo ?? "").trim();
  if (titulo.length > t.tituloMax) erros.push(`título com mais de ${t.tituloMax} caracteres`);
  else if (titulo.length > t.tituloRecomendado)
    avisos.push(`título com ${titulo.length} caracteres (recomendado até ${t.tituloRecomendado})`);
  const desc = (i.descricao ?? "").trim();
  if (desc.length > t.descricaoMax)
    erros.push(`descrição com mais de ${t.descricaoMax} caracteres`);
  else if (desc.length > t.descricaoRecomendada)
    avisos.push(
      `descrição com ${desc.length} caracteres (recomendado até ${t.descricaoRecomendada})`,
    );

  if (!(i.cta in CTAS)) erros.push(`botão ${i.cta || "vazio"} não está na lista permitida`);
  if (!i.link) erros.push("sem link de destino");
  else if (!dominioPermitido(i.link, dominios))
    erros.push("link precisa ser https e do domínio da Soldiers");
  const tags = (i.urlTags ?? "").trim();
  if (tags && !urlTagsValidas(tags))
    erros.push("parâmetros de URL fora do formato chave=valor&chave=valor");
  const temUtm = (k: string) =>
    new RegExp(`(^|&)${k}=`).test(tags) || new RegExp(`[?&]${k}=`).test(i.link);
  if (!temUtm("utm_source") || !temUtm("utm_medium") || !temUtm("utm_campaign"))
    avisos.push(
      "sem utm_source, utm_medium e utm_campaign (a venda não aparece na reconciliação Shopify × Meta)",
    );
  return { erros, avisos };
}

/** Valida o lote inteiro: cada item + duplicados de arquivo e de nome + tamanho do lote. */
export function validaLote(itens: ItemCriativo[], dominios?: readonly string[]) {
  const porHash = new Map<string, number>();
  const porNome = new Map<string, number>();
  for (const i of itens) {
    porHash.set(i.sha256, (porHash.get(i.sha256) ?? 0) + 1);
    const k = i.nomeCriativo.trim().toLowerCase();
    porNome.set(k, (porNome.get(k) ?? 0) + 1);
  }
  const resultado = itens.map((i) => {
    const v = validaItem(i, dominios);
    if ((porHash.get(i.sha256) ?? 0) > 1) v.erros.push("arquivo repetido no lote");
    if ((porNome.get(i.nomeCriativo.trim().toLowerCase()) ?? 0) > 1)
      v.erros.push("nome repetido no lote");
    return v;
  });
  const erroLote =
    itens.length > LIMITES.maxItensPorLote
      ? `lote com ${itens.length} criativos; o máximo é ${LIMITES.maxItensPorLote}`
      : null;
  return {
    itens: resultado,
    erroLote,
    validos: resultado.filter((v) => !v.erros.length).length,
    comErro: resultado.filter((v) => v.erros.length).length,
    comAviso: resultado.filter((v) => !v.erros.length && v.avisos.length).length,
  };
}

/** Nome padrão: LOTE_FORMATO_PROPORCAO_NNN (sem acento, sem espaço). */
export function nomePadrao(
  prefixo: string,
  tipo: "imagem" | "video",
  largura: number | null | undefined,
  altura: number | null | undefined,
  seq: number,
) {
  const limpa = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toUpperCase();
  return [
    limpa(prefixo) || "LOTE",
    tipo === "video" ? "VID" : "IMG",
    proporcao(largura, altura) ?? "LIVRE",
    String(seq).padStart(3, "0"),
  ].join("_");
}

// ---------------------------------------------------------------------------------------------
// Planilha (CSV) com a copy por arquivo

export type LinhaPlanilha = {
  arquivo: string;
  nome?: string;
  texto?: string;
  titulo?: string;
  descricao?: string;
  cta?: string;
  link?: string;
  url_tags?: string;
};

/** Lê CSV com cabeçalho (separador , ou ;), aceitando campos entre aspas com quebra de linha. */
export function lePlanilha(csv: string): LinhaPlanilha[] {
  const texto = csv.replace(/^\uFEFF/, "");
  const primeira = texto.split(/\r?\n/, 1)[0] ?? "";
  const sep = (primeira.match(/;/g)?.length ?? 0) > (primeira.match(/,/g)?.length ?? 0) ? ";" : ",";
  const linhas: string[][] = [];
  let campo = "";
  let linha: string[] = [];
  let aspas = false;
  for (let k = 0; k < texto.length; k++) {
    const c = texto[k]!;
    if (aspas) {
      if (c === '"' && texto[k + 1] === '"') {
        campo += '"';
        k++;
      } else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) {
      linha.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[k + 1] === "\n") k++;
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = "";
    } else campo += c;
  }
  if (campo || linha.length) {
    linha.push(campo);
    linhas.push(linha);
  }
  const [cab, ...resto] = linhas.filter((l) => l.some((x) => x.trim()));
  if (!cab) return [];
  const chaves = cab.map((h) =>
    h.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "_"),
  );
  const mapa: Record<string, keyof LinhaPlanilha> = {
    arquivo: "arquivo",
    nome: "nome",
    nome_criativo: "nome",
    texto: "texto",
    texto_principal: "texto",
    titulo: "titulo",
    descricao: "descricao",
    cta: "cta",
    botao: "cta",
    link: "link",
    url_tags: "url_tags",
    utm: "url_tags",
  };
  return resto
    .map((l) => {
      const o: LinhaPlanilha = { arquivo: "" };
      chaves.forEach((k, idx) => {
        const alvo = mapa[k];
        if (alvo) o[alvo] = (l[idx] ?? "").trim();
      });
      return o;
    })
    .filter((o) => o.arquivo);
}
