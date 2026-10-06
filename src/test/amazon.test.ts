import { describe, expect, it } from "vitest";
import {
  escalaPct,
  resumoAmazon,
  asin360,
  termosAds,
  shareDeBusca,
  reposicaoFba,
  recompraAsin,
  organicoVsAds,
  vendasPorHora,
  novosParaMarca,
  alvosKeywords,
  alvosSd,
  classificaLances,
  alertasAmazon,
  amazonDoSku,
} from "@/lib/amazon";

const DE = "2026-09-01";
const ATE = "2026-09-30";

describe("escalaPct", () => {
  it("fração vira 0–100; já em % fica", () => {
    expect(escalaPct([0.5, 0.92, null])).toBe(100);
    expect(escalaPct([50, 92])).toBe(1);
    expect(escalaPct([])).toBe(1);
  });
});

describe("resumoAmazon", () => {
  const r = resumoAmazon(
    [
      {
        data: "2026-09-02",
        vendas: 1000,
        unidades: 10,
        sessoes: 200,
        buybox_pct: 1,
        unidades_devolvidas: 1,
      },
      {
        data: "2026-09-03",
        vendas: 500,
        unidades: 5,
        sessoes: 100,
        buybox_pct: 0.7,
        em_consolidacao: true,
      },
      { data: "2026-08-03", vendas: 9999, unidades: 99, sessoes: 999 },
    ],
    [
      { data: "2026-09-02", ad_type: "SP", cost: 120, sales_14d: 600, clicks: 80 },
      { data: "2026-09-02", ad_type: "SB", cost: 30, sales_14d: 0, clicks: 10 },
    ],
    DE,
    ATE,
  );
  it("conta só o período e pondera Buy Box por sessão", () => {
    expect(r.vendas).toBe(1500);
    expect(r.conversaoPct).toBe(5);
    expect(r.buyboxPct).toBeCloseTo(90, 6); // (100*200 + 70*100) / 300
    expect(r.devolucaoPct).toBeCloseTo(100 / 15, 6);
    expect(r.diasEmConsolidacao).toBe(1);
  });
  it("ACoS sobre venda atribuída, TACoS sobre venda realizada", () => {
    expect(r.ads.acosPct).toBe(25);
    expect(r.ads.tacosPct).toBe(10);
    expect(r.ads.porTipo[0]!.tipo).toBe("SP");
    expect(r.ads.porTipo[1]!.acosPct).toBeNull();
  });
});

describe("asin360", () => {
  const vendas = [
    {
      data: "2026-09-02",
      child_asin: "B1",
      vendas: 3000,
      unidades: 30,
      sessoes: 300,
      buybox_pct: 100,
    },
    {
      data: "2026-09-02",
      child_asin: "B2",
      vendas: 800,
      unidades: 2,
      sessoes: 400,
      buybox_pct: 60,
    },
    {
      data: "2026-09-02",
      child_asin: "B3",
      vendas: 500,
      unidades: 10,
      sessoes: 120,
      buybox_pct: 100,
    },
  ];
  const r = asin360(
    vendas,
    [
      {
        asin: "B2",
        ganho_buybox: false,
        concorrente_no_bb: true,
        meu_preco: 99,
        menor_preco_concorrente: 89,
      },
      { asin: "B1", ganho_buybox: true, meu_preco: 100, menor_preco_concorrente: 110 },
    ],
    [
      { asin: "B1", seller_sku: "S1", fulfillable: 40 },
      { asin: "B3", seller_sku: "S3", fulfillable: 0 },
    ],
    [{ asin: "B1", em_fba: true, cobertura_dias: 9, titulo: "Creatina" }],
    [{ asin: "B2", titulo: "Whey", faltas: ["ingredientes"], tem_aplus: false, health: 60 }],
    DE,
    ATE,
  );
  it("ordena por venda e usa título do cadastro ou da reposição", () => {
    expect(r.map((x) => x.asin)).toEqual(["B1", "B2", "B3"]);
    expect(r[0]!.titulo).toBe("Creatina");
    expect(r[1]!.titulo).toBe("Whey");
  });
  it("lista problemas que explicam venda perdida", () => {
    expect(r[0]!.problemas).toEqual(["cobertura de 9 dias"]);
    expect(r[1]!.problemas).toEqual([
      "concorrente com a Buy Box",
      "preço acima do menor concorrente",
      "conversão abaixo da metade da mediana",
      "cadastro: falta ingredientes",
      "sem A+",
    ]);
    expect(r[2]!.problemas).toEqual(["sem estoque FBA"]);
  });
});

describe("termosAds", () => {
  const rows = [
    {
      data: "2026-09-02",
      campaign_name: "C1",
      search_term: "Creatina",
      keyword_text: "creatina",
      match_type: "BROAD",
      cost: 50,
      clicks: 20,
      purchases_14d: 5,
      sales_14d: 500,
    },
    {
      data: "2026-09-03",
      campaign_name: "C2",
      search_term: "creatina ",
      keyword_text: "creatina pura",
      match_type: "PHRASE",
      cost: 10,
      clicks: 5,
      purchases_14d: 1,
      sales_14d: 100,
    },
    {
      data: "2026-09-02",
      campaign_name: "C1",
      search_term: "whey isolado",
      keyword_text: "whey isolado",
      match_type: "EXACT",
      cost: 40,
      clicks: 10,
      purchases_14d: 3,
      sales_14d: 400,
    },
    {
      data: "2026-09-02",
      campaign_name: "C1",
      search_term: "pre treino barato",
      keyword_text: "pre treino",
      match_type: "BROAD",
      cost: 45,
      clicks: 30,
      purchases_14d: 0,
      sales_14d: 0,
    },
    {
      data: "2026-09-02",
      campaign_name: "C1",
      search_term: "bcaa",
      keyword_text: "bcaa",
      match_type: "BROAD",
      cost: 120,
      clicks: 15,
      purchases_14d: 2,
      sales_14d: 150,
    },
  ];
  const r = termosAds(rows, DE, ATE);
  it("agrega o termo entre campanhas", () => {
    expect(r.promover[0]).toMatchObject({ termo: "creatina", campanhas: 2, compras: 6, custo: 60 });
  });
  it("negativar: gasto sem compra", () => {
    expect(r.negativar.map((t) => t.termo)).toEqual(["pre treino barato"]);
  });
  it("promover: converte, ACoS abaixo da referência e sem keyword exata", () => {
    // ref = (60+40+120)/(600+400+150) = 19,1%; whey já tem exata; bcaa tem ACoS 80%
    expect(r.acosReferenciaPct).toBeCloseTo((220 / 1150) * 100, 6);
    expect(r.promover.map((t) => t.termo)).toEqual(["creatina"]);
  });
});

describe("shareDeBusca", () => {
  const row = (semana: string, termo: string, nosso: boolean, click: number, rank = 10) => ({
    semana_ini: semana,
    semana_fim: semana,
    termo,
    nosso,
    click_share: click,
    conversion_share: click / 2,
    rank_busca: rank,
    asin: "X",
  });
  const r = shareDeBusca([
    row("2026-09-20", "creatina", true, 0.2, 5),
    row("2026-09-27", "creatina", true, 0.1, 5),
    row("2026-09-27", "creatina", false, 0.3, 5),
    row("2026-09-20", "whey", true, 0.05, 3),
    row("2026-09-27", "whey", false, 0.4, 3),
    row("2026-09-27", "bcaa", true, 0.08, 40),
    row("2026-09-27", "glutamina", false, 0.5, 1),
  ]);
  it("compara a semana mais recente com a anterior, em pontos percentuais", () => {
    expect(r.semana).toBe("2026-09-27");
    expect(r.lista.map((t) => [t.termo, t.status])).toEqual([
      ["whey", "saiu"],
      ["creatina", "perdeu"],
      ["bcaa", "novo"],
    ]);
    expect(r.lista[1]!.variacaoPp).toBeCloseTo(-10, 6);
    expect(r.perderam).toBe(2);
  });
});

describe("reposicaoFba e recompraAsin", () => {
  it("lista SKUs com alerta ou cobertura curta, mais urgentes primeiro", () => {
    const r = reposicaoFba(
      [
        { sku: "A", em_fba: true, cobertura_dias: 30, alerta: "" },
        { sku: "B", em_fba: true, cobertura_dias: 12, alerta: "" },
        { sku: "C", em_fba: true, cobertura_dias: 40, alerta: "ruptura prevista" },
        { sku: "D", em_fba: true, cobertura_dias: 4, alerta: null },
        { sku: "E", em_fba: false, cobertura_dias: 1 },
      ],
      [
        { seller_sku: "B", imprestavel_total: 3 },
        { seller_sku: "Z", imprestavel_total: 2 },
      ],
    );
    expect(r.lista.map((x) => x.sku)).toEqual(["D", "B", "C"]);
    expect(r.lista[1]!.imprestavel).toBe(3);
    expect(r.imprestavelTotal).toBe(5);
  });
  it("recompra usa só o mês mais recente", () => {
    const r = recompraAsin([
      { asin: "A", mes_fim: "2026-08-31", clientes_unicos: 100, pct_clientes_repetem: 0.3 },
      { asin: "A", mes_fim: "2026-09-30", clientes_unicos: 100, pct_clientes_repetem: 0.1 },
      { asin: "B", mes_fim: "2026-09-30", clientes_unicos: 50, pct_clientes_repetem: 0.2 },
    ]);
    expect(r.mes).toBe("2026-09-30");
    expect(r.lista.map((x) => [x.asin, x.pctRepetem])).toEqual([
      ["B", 20],
      ["A", 10],
    ]);
  });
});

describe("organicoVsAds", () => {
  const brand = [
    { semana_fim: "2026-09-20", termo: "creatina", nosso: true, click_share: 0.4, rank_busca: 2 },
    { semana_fim: "2026-09-27", termo: "creatina", nosso: true, click_share: 0.45, rank_busca: 2 },
    { semana_fim: "2026-09-20", termo: "whey", nosso: true, click_share: 0.2, rank_busca: 1 },
    { semana_fim: "2026-09-27", termo: "whey", nosso: true, click_share: 0.05, rank_busca: 1 },
    { semana_fim: "2026-09-20", termo: "bcaa", nosso: true, click_share: 0.2, rank_busca: 9 },
    { semana_fim: "2026-09-27", termo: "bcaa", nosso: true, click_share: 0.1, rank_busca: 9 },
  ];
  const termos = [
    { data: "2026-09-10", search_term: "Creatina", cost: 300, sales_14d: 3000 },
    { data: "2026-09-10", search_term: "bcaa", cost: 20, sales_14d: 0 },
  ];
  const r = organicoVsAds(brand, termos, DE, ATE);
  it("anunciar: perdeu espaço e não tem Ads", () => {
    expect(r.anunciar.map((t) => t.termo)).toEqual(["whey"]);
  });
  it("reduzir lance: domina a busca e ainda paga", () => {
    expect(r.reduzirLance).toHaveLength(1);
    expect(r.reduzirLance[0]).toMatchObject({ termo: "creatina", custoAds: 300, acosPct: 10 });
  });
});

describe("vendasPorHora", () => {
  // 2026-09-06 e 2026-09-13 são domingos; 2026-09-07 é segunda.
  const r = vendasPorHora(
    [
      { data: "2026-09-06", hora: 20, venda: 300, pedidos: 3 },
      { data: "2026-09-13", hora: 20, venda: 100, pedidos: 1 },
      { data: "2026-09-07", hora: 9, venda: 50, pedidos: 1 },
      { data: "2026-09-07", hora: 25, venda: 999 },
    ],
    "2026-09-06",
    "2026-09-13",
  );
  it("média por dia da semana divide pelo número de domingos do período", () => {
    const dom20 = r.celulas.find((c) => c.dow === 0 && c.hora === 20)!;
    expect(dom20.vendaMedia).toBe(200);
    expect(r.melhores[0]).toMatchObject({ dow: 0, hora: 20 });
    expect(r.total).toBe(450);
    expect(r.porHora[20]!.pct).toBeCloseTo((400 / 450) * 100, 6);
  });
});

describe("novosParaMarca", () => {
  const r = novosParaMarca(
    [
      {
        data: "2026-09-02",
        campaign_id: "1",
        campaign_name: "SB Marca",
        cost: 200,
        sales: 1000,
        ntb_sales: 600,
        ntb_purchases: 8,
      },
    ],
    [
      {
        data: "2026-09-02",
        campaign_id: "9",
        campaign_name: "SD Retarget",
        cost: 100,
        sales: 500,
        ntb_sales_clicks: 50,
        ntb_purchases_clicks: 1,
      },
    ],
    DE,
    ATE,
  );
  it("calcula % de venda de cliente novo e custo por cliente novo", () => {
    expect(r.sb).toMatchObject({ pctNtb: 60, custoPorNovo: 25 });
    expect(r.sd).toMatchObject({ pctNtb: 10, custoPorNovo: 100 });
    expect(r.campanhas[0]!.campanha).toBe("SB Marca");
  });
});

describe("classificaLances", () => {
  const kw = alvosKeywords(
    [
      {
        data: "2026-09-02",
        campaign_name: "C",
        keyword: "creatina",
        match_type: "EXACT",
        cost: 100,
        clicks: 100,
        purchases_14d: 10,
        sales_14d: 1000,
        top_search_is: 0.2,
      },
      {
        data: "2026-09-02",
        campaign_name: "C",
        keyword: "whey",
        match_type: "BROAD",
        cost: 300,
        clicks: 150,
        purchases_14d: 2,
        sales_14d: 600,
      },
      {
        data: "2026-09-02",
        campaign_name: "C",
        keyword: "pre treino",
        match_type: "PHRASE",
        cost: 80,
        clicks: 40,
        purchases_14d: 0,
        sales_14d: 0,
      },
      {
        data: "2026-09-02",
        campaign_name: "C",
        keyword: "glutamina",
        match_type: "EXACT",
        cost: 100,
        clicks: 50,
        purchases_14d: 4,
        sales_14d: 400,
        top_search_is: 0.9,
      },
    ],
    DE,
    ATE,
  );
  const r = classificaLances(kw);
  it("referência = custo ÷ venda dos alvos com venda", () => {
    expect(r.acosReferenciaPct).toBe(25); // 500 / 2000
  });
  it("subir só quem tem ACoS baixo e pouca presença no topo; lance limitado a +30%", () => {
    expect(r.subir.map((a) => a.alvo)).toEqual(["creatina"]);
    expect(r.subir[0]!.topoBuscaPct).toBe(20);
    expect(r.subir[0]!.lanceSugerido).toBeCloseTo(1.3, 6); // cpc 1 × min(1,3; 25/10)
  });
  it("baixar ACoS alto e pausar gasto sem venda", () => {
    expect(r.baixar.map((a) => a.alvo)).toEqual(["whey"]);
    expect(r.baixar[0]!.lanceSugerido).toBeCloseTo(2 * 0.7, 6); // cpc 2 × max(0,7; 25/50)
    expect(r.pausar.map((a) => a.alvo)).toEqual(["pre treino"]);
  });
  it("alvos de SD usam o texto do alvo", () => {
    const sd = alvosSd(
      [
        {
          data: "2026-09-02",
          campaign_id: "1",
          targeting: "asin=B0X",
          targeting_text: "Concorrente X",
          cost: 10,
          clicks: 5,
          purchases: 1,
          sales: 100,
        },
      ],
      DE,
      ATE,
    );
    expect(sd[0]).toMatchObject({ alvo: "Concorrente X", acosPct: 10 });
  });
});

describe("alertasAmazon", () => {
  it("transforma os sinais em problemas e oportunidades", () => {
    const asins = asin360(
      [
        {
          data: "2026-09-02",
          child_asin: "B1",
          vendas: 1000,
          unidades: 10,
          sessoes: 100,
          buybox_pct: 50,
        },
      ],
      [{ asin: "B1", ganho_buybox: false }],
      [{ asin: "B1", fulfillable: 0 }],
      [],
      [{ asin: "B1", titulo: "Creatina" }],
      DE,
      ATE,
    );
    const vazio = { acosReferenciaPct: null, custoTotal: 0, negativar: [], promover: [] };
    const a = alertasAmazon({
      asins,
      termos: vazio,
      share: { semana: null, semanaAnterior: null, termos: 0, perderam: 0, lista: [] },
      organico: { anunciar: [], reduzirLance: [] },
    });
    expect(a.map((x) => [x.tipo, x.tag])).toEqual([
      ["problema", "Amazon Buy Box"],
      ["problema", "Amazon FBA"],
    ]);
    expect(a[0]!.texto).toContain("Creatina");
  });
});

describe("amazonDoSku", () => {
  it("acha os ASINs do SKU e calcula ACoS/TACoS só deles", () => {
    const r = amazonDoSku(
      "CREA300",
      [
        { sku: "CREA300", asin: "B1" },
        { seller_sku: "OUTRO", asin: "B9" },
      ],
      [
        { data: "2026-09-02", child_asin: "B1", vendas: 1000, unidades: 10, sessoes: 100 },
        { data: "2026-09-02", child_asin: "B9", vendas: 5000, unidades: 50, sessoes: 500 },
      ],
      [],
      [],
      [],
      [],
      [
        { data: "2026-09-02", asin: "B1", sku: "CREA300", cost: 100, sales_14d: 400 },
        { data: "2026-09-02", asin: "B9", sku: "OUTRO", cost: 999, sales_14d: 999 },
      ],
      DE,
      ATE,
    )!;
    expect(r.asins).toEqual(["B1"]);
    expect(r.vendas).toBe(1000);
    expect(r.ads).toMatchObject({ custo: 100, acosPct: 25, tacosPct: 10 });
    expect(amazonDoSku("NADA", [], [], [], [], [], [], [], DE, ATE)).toBeNull();
  });
});
