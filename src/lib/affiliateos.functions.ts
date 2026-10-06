// Leituras do Affiliate OS: creators e notas, funil, amostras, outreach, comissão, risco e qualidade do cliente.
// Só leitura. As tabelas affiliate_* vêm da migração 20261005140000; sem ela, a tela usa só os dados existentes.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, fetchAll } from "@/lib/db-helpers";
import {
  listaCreatorsOS,
  funilCreators,
  funilAmostrasSemanal,
  retencaoCoortes,
  amostrasOS,
  outreachOS,
  elasticidade,
  sinaisDeRisco,
  qualidadePorCreator,
  alertasAffiliateOS,
} from "@/lib/affiliateos";
import {
  mapaManual,
  dnaTikTok,
  dnaPorCreator,
  padroesVencedores,
  MEDIDA_TIKTOK,
  NAO_IDENTIFICADO,
} from "@/lib/dna";
import { produtoDoTexto } from "@/lib/criativos360";

type Rows = Record<string, unknown>[];
const LIMITE_COORTE = 300000;
const menos = (iso: string, d: number) =>
  new Date(Date.parse(iso + "T00:00:00Z") - d * 86400000).toISOString().slice(0, 10);

/** `coortes: false` pula a leitura de 12 meses de vídeos (usado pelos alertas do Command Center). */
export async function dadosAffiliateOS(p: { foco: string }, opcoes: { coortes?: boolean } = {}) {
  const c = await db();
  const erros: Record<string, string> = {};
  let migracaoPendente = false;
  const safe = async (nome: string, pr: Promise<Rows>, opcional = false) => {
    try {
      return await pr;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (opcional && /does not exist|não existe|schema cache|Could not find/i.test(msg))
        migracaoPendente = true;
      else erros[nome] = msg;
      return [] as Rows;
    }
  };
  const hoje = new Date().toISOString().slice(0, 10);
  const de90 = menos(hoje, 89);
  const de180 = menos(hoje, 179);
  const [
    videos,
    cadastro,
    amostras,
    campanhas,
    convites,
    produtos,
    ttDia,
    mlCamp,
    ttProd,
    cupons,
    qual,
    influ,
    etiq,
    videosAno,
  ] = await Promise.all([
    safe(
      "videos",
      fetchAll(
        () =>
          c
            .from("fact_tiktok_video_dia")
            .select("data,criador,produto_nome,gmv,views,video_id,titulo,unidades,publicado_em")
            .gte("data", de90)
            .lte("data", hoje),
        "tiktok videos",
        150000,
      ),
    ),
    safe(
      "creators",
      fetchAll(
        () =>
          c
            .from("affiliate_creator")
            .select(
              "id,nome,tiktok_username,cupom,nicho,tier,estagio,concorrentes,seguidores,tipo_conta",
            ),
        "affiliate_creator",
      ).catch((e) =>
        // tipo_conta vem da migração 20261006140000; sem ela, lê sem a coluna.
        /tipo_conta/.test(String(e?.message ?? e))
          ? fetchAll(
              () =>
                c
                  .from("affiliate_creator")
                  .select(
                    "id,nome,tiktok_username,cupom,nicho,tier,estagio,concorrentes,seguidores",
                  ),
              "affiliate_creator",
            )
          : Promise.reject(e),
      ),
      true,
    ),
    safe(
      "amostras",
      fetchAll(
        () =>
          c
            .from("affiliate_amostra")
            .select(
              "id,creator_id,sku,produto,status,solicitado_em,aprovado_em,enviado_em,recebido_em,publicado_em,primeira_venda_em,encerrado_em,custo_produto,frete,desconto,outros_custos",
            ),
        "affiliate_amostra",
      ).catch((e) =>
        /encerrado_em/.test(String(e?.message ?? e))
          ? fetchAll(
              () =>
                c
                  .from("affiliate_amostra")
                  .select(
                    "id,creator_id,sku,produto,status,solicitado_em,aprovado_em,enviado_em,recebido_em,publicado_em,primeira_venda_em,custo_produto,frete,desconto,outros_custos",
                  ),
              "affiliate_amostra",
            )
          : Promise.reject(e),
      ),
      true,
    ),
    safe(
      "campanhas",
      fetchAll(
        () =>
          c
            .from("affiliate_outreach_campanha")
            .select("id,nome,sku,comissao_pct,creator_score_min,product_fit_min,gmv_min,status"),
        "affiliate_outreach_campanha",
      ),
      true,
    ),
    safe(
      "convites",
      fetchAll(
        () => c.from("affiliate_convite").select("campanha_id,creator_id,status"),
        "affiliate_convite",
      ),
      true,
    ),
    safe(
      "produtos",
      fetchAll(() => c.from("dim_shopify_produto").select("sku,title"), "produtos"),
    ),
    safe(
      "tiktokAfiliado",
      fetchAll(
        () =>
          c
            .from("vw_tiktok_afiliado_dia")
            .select("data,gmv_afiliado,margem_afiliado_pct,margem_sem_afiliado_pct")
            .gte("data", de90),
        "tiktok afiliado",
      ),
    ),
    safe(
      "mlCampanhas",
      fetchAll(
        () =>
          c
            .from("vw_ml_afiliado_campanha_dia")
            .select("data,taxa_efetiva_pct,gmv")
            .gte("data", de180),
        "ml campanhas",
        60000,
      ),
    ),
    safe(
      "tiktokProdutos",
      fetchAll(
        () =>
          c
            .from("vw_tiktok_afiliado_produto_dia")
            .select("data,comissao_efetiva_pct,gmv_afiliado")
            .gte("data", de180),
        "tiktok produtos",
        60000,
      ),
    ),
    safe(
      "cupons",
      fetchAll(
        () =>
          c
            .from("vw_site_cupom_dia")
            .select("data,cupom,pedidos,unidades,unidades_devolvidas,desconto,faturamento_bruto")
            .gte("data", de90),
        "cupons",
        90000,
      ),
    ),
    safe(
      "qualidade",
      fetchAll(
        () =>
          c
            .from("mv_cupom_cliente_qualidade")
            .select("cupom,clientes,clientes_novos,recompraram,ltv_medio,pedidos_medio"),
        "qualidade cupom",
      ),
      true,
    ),
    // Só nome público e cupom (sem cidade/estado).
    safe(
      "influenciadores",
      fetchAll(() => c.from("dim_influenciador").select("nome,cupom"), "influenciadores"),
    ),
    // DNA do conteúdo (cap. 8.11): etiquetas manuais, se a migração 20261005160000 foi aplicada.
    // Opcional e sem aviso próprio: sem a tabela, vale só a regra automática.
    fetchAll(
      () => c.from("vw_conteudo_etiqueta_atual").select("canal,conteudo_id,dimensao,valor"),
      "conteudo etiqueta",
    ).catch(() => [] as Rows),
    // Retenção por coorte: 12 meses de vídeos, só o necessário (vídeo, creator, publicação).
    opcoes.coortes === false
      ? Promise.resolve([] as Rows)
      : safe(
          "videosCoorte",
          fetchAll(
            () =>
              c
                .from("fact_tiktok_video_dia")
                .select("data,criador,video_id,publicado_em")
                .gte("data", menos(hoje, 364))
                .lte("data", hoje),
            "tiktok videos 12m",
            LIMITE_COORTE,
          ),
        ),
  ]);
  const ref =
    videos.reduce(
      (m, v) => (String(v["data"] ?? "") > m ? String(v["data"]).slice(0, 10) : m),
      "",
    ) || hoje;
  const pond = (k: string) => {
    const g = ttDia.reduce((s, r) => s + (Number(r["gmv_afiliado"]) || 0), 0);
    return g
      ? ttDia.reduce((s, r) => s + (Number(r[k]) || 0) * (Number(r["gmv_afiliado"]) || 0), 0) / g
      : null;
  };
  const margemAfiliado = pond("margem_afiliado_pct") ?? 15;
  const margemSem = pond("margem_sem_afiliado_pct") ?? 30;

  const skuNome = new Map(produtos.map((r) => [String(r["sku"] ?? ""), String(r["title"] ?? "")]));
  const am = amostrasOS(amostras, cadastro, videos, margemAfiliado, hoje);
  const sinais = sinaisDeRisco(cupons, videos, ref);
  const creators = listaCreatorsOS(
    videos,
    cadastro,
    ref,
    p.foco,
    new Set(sinais.filter((s) => s.tipo === "creator").map((s) => s.quem)),
  );
  const nomes = new Map<string, string>();
  for (const r of [...influ, ...cadastro])
    if (r["cupom"]) nomes.set(String(r["cupom"]).toUpperCase(), String(r["nome"] ?? ""));
  // Content DNA (8.11) e padrões vencedores (8.12) dos vídeos de creators nos últimos 90 dias.
  const pecas = dnaTikTok(videos, mapaManual(etiq), de90, ref);
  const focoNome = produtoDoTexto(p.foco) || p.foco;
  const pecasFoco = pecas.filter((x) => x.dna.produto === focoNome);
  const conteudo = {
    padroes: padroesVencedores(pecas, MEDIDA_TIKTOK),
    creators: dnaPorCreator(pecasFoco).slice(0, 60),
    videos: pecasFoco.slice(0, 80),
    videosFoco: pecasFoco.length,
    semProduto: pecas.filter((x) => x.dna.produto === NAO_IDENTIFICADO).length,
  };
  return {
    ref,
    foco: p.foco,
    conteudo,
    margemAfiliadoPct: margemAfiliado,
    creators: creators.slice(0, 300),
    totalCreators: creators.length,
    funil: funilCreators(creators),
    amostras: am,
    funilAmostras: funilAmostrasSemanal(am, hoje),
    coortes:
      opcoes.coortes === false ? [] : retencaoCoortes(videosAno.length ? videosAno : videos, hoje),
    coorteIncompleta: videosAno.length >= LIMITE_COORTE,
    contasLoja: creators.filter((x) => x.tipoConta === "loja").length,
    outreach: outreachOS(campanhas, convites, cadastro, videos, skuNome, ref),
    elasticidade: [
      elasticidade("Mercado Livre", mlCamp, { taxa: "taxa_efetiva_pct", gmv: "gmv" }, margemSem),
      elasticidade(
        "TikTok Shop",
        ttProd,
        { taxa: "comissao_efetiva_pct", gmv: "gmv_afiliado" },
        margemSem,
      ),
    ],
    sinais,
    qualidade: qualidadePorCreator(qual, nomes).slice(0, 200),
    migracaoPendente,
    alertas: alertasAffiliateOS({ amostras: am, creators, sinais }),
    erros,
  };
}

export const getAffiliateOS = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ foco: z.string().max(80).default("Creatina") }).parse(d ?? {}))
  .handler(async ({ data }) => dadosAffiliateOS(data));
