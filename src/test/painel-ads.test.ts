import { describe, expect, it } from "vitest";
import {
  statusCampanha,
  linhasMlProductAds,
  linhasMlBrand,
  linhasShopee,
  filtraLinhas,
  painelAds,
  logisticas,
  abasDe,
  linhasGoogle,
  linhasTikTokAds,
  itensTikTokAds,
  linhasMeliDsp,
  itensMeliDsp,
  rotuloObjetivoMeta,
  rotuloTipoGoogle,
  avisoDsp,
  dspPorDia,
  linhasMidiaGeral,
} from "@/lib/painel-ads";
import {
  mlPainelFixture,
  amazonPainelFixture,
  metaPainelFixture,
  googlePainelFixture,
  midiaPainelFixture,
  dspAmz,
} from "./painel-ads-fixture";

describe("status de campanha", () => {
  it("normaliza os nomes das plataformas", () => {
    expect(
      ["active", "ENABLED", "ongoing", "paused", "PAUSED", "archived", "ended", "draft", null].map(
        statusCampanha,
      ),
    ).toEqual([
      "ativo",
      "ativo",
      "ativo",
      "pausado",
      "pausado",
      "pausado",
      "pausado",
      "outro",
      "outro",
    ]);
  });
});

describe("painel de Ads", () => {
  const itens = linhasMlProductAds(
    [
      {
        date: "2026-09-01",
        campaign_id: 1,
        campaign_name: "C1",
        item_id: "A",
        title: "Item A",
        cost: 100,
        clicks: 50,
        prints: 10000,
        units_quantity: 5,
        organic_units_quantity: 3,
        direct_amount: 800,
        indirect_amount: 200,
        impression_share: 0.4,
        lost_impression_share_by_budget: 0.2,
        buy_box_winner: true,
        catalog_listing: false,
        logistic_type: "fulfillment",
      },
      {
        date: "2026-09-01",
        campaign_id: 1,
        campaign_name: "C1",
        item_id: "B",
        title: "Item B",
        cost: 300,
        clicks: 100,
        prints: 20000,
        units_quantity: 6,
        direct_amount: 900,
        indirect_amount: 0,
        impression_share: 0.8,
        buy_box_winner: false,
        catalog_listing: true,
        logistic_type: "cross_docking",
      },
      {
        date: "2026-09-02",
        campaign_id: 2,
        campaign_name: "C2",
        item_id: "C",
        title: "Item C",
        cost: 100,
        clicks: 50,
        prints: 5000,
        units_quantity: 1,
        direct_amount: 100,
        indirect_amount: 0,
      },
    ],
    [
      { campaign_id: 1, status: "active" },
      { campaign_id: 2, status: "paused" },
    ],
  );
  it("totais, ROAS, ACoS, CVR, série e campanhas com itens", () => {
    const p = painelAds(itens);
    expect([p.totais.investimento, p.totais.receita, p.totais.unidades, p.totais.cliques]).toEqual([
      500, 2000, 12, 200,
    ]);
    expect(p.totais.roas).toBe(4);
    expect(p.totais.acos).toBe(25);
    expect(p.totais.cvr).toBe(6);
    expect(p.totais.ctr).toBeCloseTo((200 / 35000) * 100);
    expect(p.totais.cpc).toBe(2.5);
    expect(p.serie.map((x) => [x.data, x.investimento])).toEqual([
      ["2026-09-01", 400],
      ["2026-09-02", 100],
    ]);
    expect(p.campanhas.map((c) => [c.nome, c.status, c.investimento, c.itens.length])).toEqual([
      ["C1", "ativo", 400, 2],
      ["C2", "pausado", 100, 1],
    ]);
    expect(p.campanhas[0]!.itens[0]!.nome).toBe("Item B"); // maior investimento primeiro
    // impression share ponderado pelo investimento: (40×100 + 80×300) / 400 = 70
    expect(p.competitividade!.impressionShare).toBeCloseTo(70);
    expect(p.competitividade!.perdidoOrcamento).toBeCloseTo(20);
    expect(p.composicao).toEqual({
      direta: 1800,
      indireta: 200,
      unidadesAds: 12,
      unidadesOrganicas: 3,
    });
  });
  it("filtros de status, busca, Buy Box, catálogo, logística e período", () => {
    const f = (x: Parameters<typeof filtraLinhas>[1], de = "2026-09-01", ate = "2026-09-30") =>
      filtraLinhas(itens, x, de, ate).map((l) => l.itemId);
    expect(f({ status: "ativo" })).toEqual(["A", "B"]);
    expect(f({ status: "pausado" })).toEqual(["C"]);
    expect(f({ busca: "item b" })).toEqual(["B"]);
    expect(f({ busca: "c2" })).toEqual(["C"]);
    expect(f({ buyBox: "ganhando" })).toEqual(["A"]);
    expect(f({ catalogo: "catalogo" })).toEqual(["B"]);
    expect(f({ logistica: "cross_docking" })).toEqual(["B"]);
    expect(f({}, "2026-09-02")).toEqual(["C"]);
    expect(logisticas(itens)).toEqual(["cross_docking", "fulfillment"]);
  });
  it("Brand do ML só com investimento e Shopee com direta/indireta", () => {
    const b = linhasMlBrand([
      { data: "2026-09-01", invest_brand: 50 },
      { data: "2026-09-02", invest_brand: 0 },
    ]);
    expect(b).toHaveLength(1);
    expect(painelAds(b).totais.roas).toBe(0);
    const s = linhasShopee(
      [
        {
          data: "2026-09-01",
          campaign_id: 1,
          ad_type: "product",
          expense: 10,
          broad_gmv: 100,
          direct_gmv: 60,
          broad_order: 2,
        },
      ],
      [{ campaign_id: 1, ad_name: "X", campaign_status: "ongoing" }],
    );
    expect([
      s[0]!.receita,
      s[0]!.receitaDireta,
      s[0]!.receitaIndireta,
      s[0]!.unidades,
      s[0]!.status,
    ]).toEqual([100, 60, 40, 2, "ativo"]);
  });
  it("Amazon: itens de outra tabela abrem a campanha sem entrar no total", () => {
    const sp = amazonPainelFixture.linhas.filter((l) => l.tipo === "SP");
    const p = painelAds(sp, amazonPainelFixture.itens);
    const total = sp.reduce((s, l) => s + l.investimento, 0);
    expect(p.totais.investimento).toBeCloseTo(total);
    const c = p.campanhas.find((x) => x.id === "sp1")!;
    expect(c.itens.map((i) => i.nome)).toEqual(["Creatina Amazon 300g", "Creatina Amazon 1kg"]);
    expect(p.campanhas.find((x) => x.id === "sp2")!.itens).toHaveLength(0);
    expect(mlPainelFixture.some((l) => l.tipo === "display")).toBe(true);
  });
});

describe("painel nas telas de mídia", () => {
  it("aba Todas soma todos os tipos e só aparece com mais de um tipo", () => {
    const abas = abasDe(metaPainelFixture.linhas, [], [], rotuloObjetivoMeta, "Todas");
    expect(abas.map((a) => a.label)).toEqual(["Todas", "Vendas", "Tráfego"]);
    const todas = painelAds(
      filtraLinhas(metaPainelFixture.linhas, { tipo: "*" }, "0000", "9999"),
      [],
    );
    const vendas = painelAds(
      filtraLinhas(metaPainelFixture.linhas, { tipo: "OUTCOME_SALES" }, "0000", "9999"),
      [],
    );
    const trafego = painelAds(
      filtraLinhas(metaPainelFixture.linhas, { tipo: "OUTCOME_TRAFFIC" }, "0000", "9999"),
      [],
    );
    expect(todas.totais.investimento).toBeCloseTo(
      vendas.totais.investimento + trafego.totais.investimento,
      6,
    );
    expect(abasDe(midiaPainelFixture, [], [], undefined, "Todas")).toHaveLength(1);
  });

  it("Meta: anúncios abrem dentro da campanha certa", () => {
    const p = painelAds(metaPainelFixture.linhas, metaPainelFixture.itens);
    const asc = p.campanhas.find((c) => c.id === "m1")!;
    expect(asc.itens.map((i) => i.nome)).toEqual([
      "UGC Creatina 15s · ASC aberto",
      "Carrossel Creatina · ASC aberto",
    ]);
    expect(p.campanhas.find((c) => c.id === "m3")!.status).toBe("pausado");
  });

  it("Google: tipo em português e parcela de impressão em % (aceita fração ou %)", () => {
    expect(rotuloTipoGoogle("PERFORMANCE_MAX")).toBe("Performance Max");
    expect(rotuloTipoGoogle("search")).toBe("Pesquisa");
    const fracao = linhasGoogle(
      [{ data: "2026-09-01", campaign_id: "x", fatia_impressao: 0.4 }],
      [],
    );
    const pct = linhasGoogle([{ data: "2026-09-01", campaign_id: "x", fatia_impressao: 40 }], []);
    expect(fracao[0]!.impressionShare).toBeCloseTo(pct[0]!.impressionShare!, 6);
    expect(painelAds(googlePainelFixture.linhas, []).competitividade).not.toBeNull();
  });

  it("TikTok: campanha GMV Max não entra duas vezes e itens herdam o tipo", () => {
    const dia = { data: "2026-09-01", campaign_id: "c1", invest: 100, receita: 400, pedidos: 4 };
    const l = linhasTikTokAds([{ ...dia, tipo: "Vídeo" }], [{ ...dia, tipo: "GMV Max" }]);
    expect(l).toHaveLength(1);
    expect(l[0]!.tipo).toBe("GMV Max");
    const it = itensTikTokAds(
      [
        { ...dia, produto: "Creatina", item_id: "v1" },
        { data: "2026-09-01", produto: "Sem campanha", invest: 10 },
      ],
      l,
    );
    expect(it).toHaveLength(1);
    expect(it[0]!.tipo).toBe("GMV Max");
  });

  it("Meli DSP: aba = etapa do funil, e line item herda a etapa da campanha", () => {
    const l = linhasMeliDsp([
      {
        data: "2026-09-01",
        campaign_id: "a",
        campaign_name: "CONVERSAO | CREATINA",
        investimento: 10,
      },
      { data: "2026-09-01", campaign_id: "b", campaign_name: "VIDEO_INSTITU", investimento: 10 },
    ]);
    expect(l[0]!.tipo).not.toBe(l[1]!.tipo);
    const it = itensMeliDsp([{ data: "2026-09-01", campaign_id: "a", line_item_id: "li" }], l);
    expect(it[0]!.tipo).toBe(l[0]!.tipo);
  });
});

describe("Amazon DSP", () => {
  it("order vira campanha e line item abre dentro dela", () => {
    const dsp = amazonPainelFixture.linhas.filter((l) => l.tipo === "DSP");
    const p = painelAds(
      dsp,
      amazonPainelFixture.itens.filter((l) => l.tipo === "DSP"),
    );
    expect(p.campanhas).toHaveLength(1);
    expect(p.campanhas[0]!.nome).toBe("DSP | Remarketing Creatina");
    expect(p.campanhas[0]!.itens.map((i) => i.nome).sort()).toEqual([
      "Compradores da categoria",
      "Visitantes 30d",
    ]);
    const soma = dspAmz.reduce((s, r) => s + r.investimento, 0);
    expect(p.totais.investimento).toBeCloseTo(soma, 6);
  });

  it("aviso diz o que falta: tabela, carga ou nada", () => {
    expect(avisoDsp(undefined)).toMatch(/migration 20261007130000/);
    expect(avisoDsp({ tabela: false, linhas: 0 })).toMatch(/migration/);
    expect(avisoDsp({ tabela: true, linhas: 0 })).toMatch(/falta ligar a carga/);
    expect(avisoDsp({ tabela: true, linhas: 3 })).toBeNull();
  });

  it("entra na visão geral de Media como um canal, somado por dia", () => {
    const dias = dspPorDia(dspAmz);
    expect(dias).toHaveLength(new Set(dspAmz.map((r) => r.data)).size);
    const linhas = linhasMidiaGeral(dias);
    expect(new Set(linhas.map((l) => l.campanha))).toEqual(new Set(["Amazon DSP"]));
    expect(linhas.reduce((s, l) => s + l.investimento, 0)).toBeCloseTo(
      dspAmz.reduce((s, r) => s + r.investimento, 0),
      6,
    );
  });
});
