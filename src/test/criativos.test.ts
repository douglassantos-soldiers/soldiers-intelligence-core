import { describe, expect, it } from "vitest";
import {
  validaItem,
  validaLote,
  nomePadrao,
  lePlanilha,
  proporcao,
  dominioPermitido,
  urlTagsValidas,
  type ItemCriativo,
} from "@/domain/criativos";
import {
  montaCreative,
  classificaErro,
  esperaPorUso,
  contaAct,
} from "../../supabase/functions/_shared/meta-criativo";

const H = "a".repeat(64);
const base = (extra: Partial<ItemCriativo> = {}): ItemCriativo => ({
  arquivoNome: "creatina.jpg",
  tipo: "imagem",
  mime: "image/jpeg",
  bytes: 500_000,
  sha256: H,
  largura: 1080,
  altura: 1350,
  nomeCriativo: "LOTE_IMG_4x5_001",
  textoPrincipal: "Creatina pura, 300g.",
  titulo: "Creatina Soldiers",
  cta: "SHOP_NOW",
  link: "https://www.soldiersnutrition.com.br/products/creatina",
  urlTags: "utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}",
  ...extra,
});

describe("validaItem", () => {
  it("aceita um criativo completo sem erro nem aviso", () => {
    expect(validaItem(base())).toEqual({ erros: [], avisos: [] });
  });
  it("bloqueia formato, tamanho, link de fora e CTA fora da lista", () => {
    const v = validaItem(
      base({
        mime: "image/gif",
        bytes: 40 * 1024 * 1024,
        link: "http://outrosite.com",
        cta: "WATCH_MORE",
      }),
    );
    expect(v.erros).toEqual([
      "formato image/gif não aceito (use JPG, PNG, MP4 ou MOV)",
      "arquivo de 40 MB passa do limite de 30 MB",
      "botão WATCH_MORE não está na lista permitida",
      "link precisa ser https e do domínio da Soldiers",
    ]);
  });
  it("avisa sem bloquear: proporção, texto longo e falta de UTM", () => {
    const v = validaItem(
      base({ largura: 1000, altura: 700, textoPrincipal: "x".repeat(200), urlTags: "" }),
    );
    expect(v.erros).toEqual([]);
    expect(v.avisos).toEqual([
      "largura 1000px abaixo da recomendada (1080px)",
      "proporção fora de 1:1, 4:5, 9:16 ou 1,91:1",
      "texto principal com 200 caracteres (recomendado até 125)",
      "sem utm_source, utm_medium e utm_campaign (a venda não aparece na reconciliação Shopify × Meta)",
    ]);
  });
  it("vídeo: limite de 200 MB e aviso acima de 60s", () => {
    const v = validaItem(
      base({
        tipo: "video",
        mime: "video/mp4",
        bytes: 300 * 1024 * 1024,
        largura: 1080,
        altura: 1920,
        duracaoSeg: 90,
      }),
    );
    expect(v.erros).toEqual(["arquivo de 300 MB passa do limite de 200 MB"]);
    expect(v.avisos).toContain("vídeo com mais de 60s (Reels e Stories cortam ou não entregam)");
  });
});

describe("validaLote", () => {
  it("acha arquivo e nome repetidos e limita o tamanho do lote", () => {
    const r = validaLote([
      base(),
      base({ arquivoNome: "copia.jpg" }),
      base({ sha256: "b".repeat(64), nomeCriativo: "OUTRO" }),
    ]);
    expect(r.itens[0]!.erros).toEqual(["arquivo repetido no lote", "nome repetido no lote"]);
    expect(r.validos).toBe(1);
    expect(r.comErro).toBe(2);
    const grande = validaLote(
      Array.from({ length: 301 }, (_, k) =>
        base({ sha256: k.toString(16).padStart(64, "0"), nomeCriativo: `N${k}` }),
      ),
    );
    expect(grande.erroLote).toBe("lote com 301 criativos; o máximo é 300");
  });
});

describe("auxiliares", () => {
  it("proporção, domínio, url_tags e nome padrão", () => {
    expect(proporcao(1080, 1920)).toBe("9x16");
    expect(proporcao(1200, 628)).toBe("191x100");
    expect(dominioPermitido("https://loja.soldiersnutrition.com.br/x")).toBe(true);
    expect(dominioPermitido("https://soldiersnutrition.com.br.golpe.com")).toBe(false);
    expect(urlTagsValidas("utm_source=meta&utm_content={{ad.name}}")).toBe(true);
    expect(urlTagsValidas("utm source=meta")).toBe(false);
    expect(nomePadrao("Black Friday Creatina", "video", 1080, 1920, 7)).toBe(
      "BLACK-FRIDAY-CREATINA_VID_9x16_007",
    );
  });
  it("lê planilha com ; e campo com aspas e quebra de linha", () => {
    const csv =
      'arquivo;nome;texto;Título;botão\ncreatina.jpg;C1;"Linha 1\nLinha 2; com ponto e vírgula";Creatina;SHOP_NOW\n\nwhey.png;W1;Whey;;LEARN_MORE\n';
    expect(lePlanilha(csv)).toEqual([
      {
        arquivo: "creatina.jpg",
        nome: "C1",
        texto: "Linha 1\nLinha 2; com ponto e vírgula",
        titulo: "Creatina",
        cta: "SHOP_NOW",
      },
      { arquivo: "whey.png", nome: "W1", texto: "Whey", titulo: "", cta: "LEARN_MORE" },
    ]);
  });
});

describe("Meta: montagem do criativo e erros", () => {
  const lote = { ad_account_id: "123", page_id: "999", instagram_user_id: "777" };
  it("imagem usa link_data com image_hash, CTA e url_tags", () => {
    const c = montaCreative(
      {
        tipo: "imagem",
        nome_criativo: "C1",
        texto_principal: "Texto",
        titulo: "Título",
        descricao: "",
        cta: "SHOP_NOW",
        link: "https://soldiersnutrition.com.br",
        url_tags: "utm_source=meta",
        meta_image_hash: "abc",
      },
      lote,
    );
    expect(c["name"]).toBe("C1");
    expect(c["url_tags"]).toBe("utm_source=meta");
    expect(JSON.parse(c["object_story_spec"]!)).toEqual({
      page_id: "999",
      instagram_user_id: "777",
      link_data: {
        image_hash: "abc",
        link: "https://soldiersnutrition.com.br",
        message: "Texto",
        name: "Título",
        call_to_action: { type: "SHOP_NOW", value: { link: "https://soldiersnutrition.com.br" } },
      },
    });
  });
  it("vídeo exige video_id e capa", () => {
    const v = {
      tipo: "video" as const,
      nome_criativo: "V1",
      cta: "SHOP_NOW",
      link: "https://soldiersnutrition.com.br",
      meta_video_id: "555",
    };
    expect(() => montaCreative(v, lote)).toThrow("vídeo sem capa");
    const spec = JSON.parse(
      montaCreative(v, lote, { image_url: "https://x/capa.jpg" })["object_story_spec"]!,
    );
    expect(spec.video_data).toMatchObject({ video_id: "555", image_url: "https://x/capa.jpg" });
  });
  it("classifica erros: limite espera, token para, parâmetro é permanente", () => {
    expect(classificaErro(400, { error: { code: 17, message: "limit" } }, 3)).toMatchObject({
      tipo: "limite",
      esperarSeg: 240,
    });
    expect(classificaErro(400, { error: { code: 80004 } }, 20).esperarSeg).toBe(1800);
    expect(classificaErro(401, { error: { code: 190 } }).tipo).toBe("token");
    expect(classificaErro(500, {}).tipo).toBe("temporario");
    expect(
      classificaErro(400, { error: { code: 100, error_user_msg: "Imagem muito pequena" } }),
    ).toMatchObject({ tipo: "permanente", mensagem: "Imagem muito pequena" });
  });
  it("lê o cabeçalho de uso da conta", () => {
    expect(
      esperaPorUso(
        JSON.stringify({ "123": [{ call_count: 95, estimated_time_to_regain_access: 0 }] }),
      ),
    ).toBe(120);
    expect(
      esperaPorUso(
        JSON.stringify({ "123": [{ call_count: 10, estimated_time_to_regain_access: 5 }] }),
      ),
    ).toBe(300);
    expect(esperaPorUso(null)).toBe(0);
    expect(contaAct("123")).toBe("act_123");
  });
});
