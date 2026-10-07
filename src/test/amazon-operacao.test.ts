import { describe, expect, it } from "vitest";
import {
  tendenciaSemanal,
  hojeAteAgora,
  buyBoxCompleto,
  qualidadeAnuncio,
  estoqueFba,
  sbParaTermos,
  sdPorProduto,
  campanhasNoLimite,
  pedidosAmazon,
} from "@/lib/amazon-operacao";
import {
  resumoAmazon,
  termosAds,
  alertasAmazon,
  adsUnificados,
  adsPorSemana,
  tipoAds,
} from "@/lib/amazon";
import { amazonFixture } from "./amazon-fixture";

const DE = "2026-09-01";
const ATE = "2026-09-30";

describe("tendência semanal", () => {
  it("ordena, converte fração e compara só semanas fechadas", () => {
    const t = tendenciaSemanal([
      { semana_ini: "2026-09-21", faturamento: 500, pedidos: 5, parcial: true, tacos_pct: 0.1 },
      { semana_ini: "2026-09-07", faturamento: 1000, pedidos: 10, invest_ads: 100, tacos_pct: 0.1 },
      {
        semana_ini: "2026-09-14",
        faturamento: 1200,
        pedidos: 12,
        invest_ads: 150,
        tacos_pct: 0.125,
        ads_maturando: true,
      },
    ]);
    expect(t.semanas.map((s) => s.semana)).toEqual(["2026-09-07", "2026-09-14", "2026-09-21"]);
    expect(t.ultima!.semana).toBe("2026-09-14");
    expect(t.variacao.faturamentoPct).toBeCloseTo(20);
    expect(t.variacao.investAdsPct).toBeCloseTo(50);
    expect(t.semanas[1]!.tacosPct).toBeCloseTo(12.5);
    expect(t.semanas[1]!.adsMaturando).toBe(true);
    expect(tendenciaSemanal([]).ultima).toBeNull();
  });
});

describe("hoje até agora", () => {
  it("compara só as faixas que já existem hoje", () => {
    const h = hojeAteAgora(
      [
        { data: "2026-10-06", faixa: "06h", venda_total: 100, pedidos: 1 },
        { data: "2026-09-29", faixa: "06h", venda_total: 80 },
        { data: "2026-09-29", faixa: "12h", venda_total: 500 },
      ],
      "2026-10-06",
    );
    expect([h.venda, h.vendaSemanaPassada, h.pedidos]).toEqual([100, 80, 1]);
    expect(h.variacaoPct).toBeCloseTo(25);
    expect(hojeAteAgora([], "").data).toBeNull();
  });
});

describe("Buy Box completo", () => {
  it("diferença para o preço da Buy Box e leitura", () => {
    const b = buyBoxCompleto(
      [
        {
          asin: "A",
          ganho_buybox: false,
          meu_preco: 110,
          buybox_preco: 100,
          n_ofertas: 3,
          buybox_fba: true,
        },
        { asin: "B", ganho_buybox: true, meu_preco: 50, buybox_preco: 50, n_ofertas: 7 },
        { asin: "C", ganho_buybox: false, meu_preco: 90, buybox_preco: 100 },
      ],
      new Map([
        ["A", 500],
        ["C", 900],
      ]),
      new Map([["A", "Produto A"]]),
    );
    expect(b.lista.map((x) => x.asin)).toEqual(["C", "A", "B"]);
    const a = b.lista.find((x) => x.asin === "A")!;
    expect(a.difBuyBoxPct).toBeCloseTo(10);
    expect(a.leitura).toMatch(/10,0% acima da Buy Box/);
    expect(b.lista.find((x) => x.asin === "C")!.leitura).toMatch(/abaixo da Buy Box e mesmo assim/);
    expect(b.lista.find((x) => x.asin === "B")!.leitura).toMatch(/5\+ ofertas/);
    expect([b.semBuyBox, b.vendaSemBuyBox, b.acimaDaBuyBox]).toEqual([2, 1400, 1]);
  });
});

describe("qualidade do anúncio", () => {
  it("nota por critério e lista do que melhorar", () => {
    const q = qualidadeAnuncio(
      [
        {
          asin: "OK",
          n_fotos: 9,
          n_bullets: 5,
          tem_aplus: true,
          tem_descricao: true,
          tem_ingredientes: true,
          comprimento_titulo: 100,
          faltas: [],
        },
        {
          asin: "MEIO",
          n_fotos: 7,
          n_bullets: 5,
          tem_aplus: false,
          tem_descricao: true,
          tem_ingredientes: false,
          comprimento_titulo: 250,
          faltas: [],
        },
        { asin: "NADA", titulo: "x" },
      ],
      new Map(),
    );
    const nota = (a: string) => q.lista.find((x) => x.asin === a)!;
    expect(nota("OK").nota).toBe(100);
    expect(nota("MEIO").nota).toBe(60);
    expect(nota("MEIO").melhorias).toEqual(["sem A+", "sem ingredientes", "título longo (250)"]);
    expect(nota("NADA").nota).toBe(10); // só "cadastro sem faltas"
    expect(q.lista[0]!.asin).toBe("NADA");
    expect([q.abaixoDe70, q.semIngredientes]).toEqual([2, 1]); // sem leitura (null) não conta como "não tem"
  });
});

describe("estoque FBA detalhado", () => {
  it("soma por SKU e sinaliza vencido, recebimento e reservado", () => {
    const e = estoqueFba(
      [
        { seller_sku: "A", fulfillable: 10, imprestavel_vencido: 3, imprestavel_total: 3 },
        { seller_sku: "A", fulfillable: 5, inbound_receiving: 20 },
        {
          seller_sku: "B",
          fulfillable: 0,
          reservado_total: 4,
          reservado_pedido: 4,
          inbound_working: 1,
          inbound_shipped: 9,
        },
      ],
      [{ sku: "A", cobertura_dias: 5, titulo: "Creatina" }],
    );
    const a = e.lista.find((x) => x.sku === "A")!;
    expect([a.disponivel, a.vencido, a.emRecebimento, a.titulo]).toEqual([15, 3, 20, "Creatina"]);
    expect(a.sinais).toEqual(["3 vencida(s)", "recebendo, cobertura curta"]);
    expect(e.lista.find((x) => x.sku === "B")!.sinais).toEqual(["tudo reservado"]);
    expect(e.totais.aCaminho).toBe(10);
    expect(e.skusComVencido).toBe(1);
  });
});

describe("Ads: SB, SD, orçamento e janela de 7 dias", () => {
  it("termos de SB passam pela mesma regra de SP", () => {
    const t = termosAds(
      sbParaTermos([
        {
          data: "2026-09-02",
          search_term: "pre treino",
          keyword: "pre",
          match_type: "BROAD",
          cost: 40,
          clicks: 12,
          purchases: 0,
          sales: 0,
        },
      ]),
      DE,
      ATE,
    );
    expect(t.negativar.map((x) => x.termo)).toEqual(["pre treino"]);
  });
  it("SD por produto", () => {
    const l = sdPorProduto(
      [
        { data: "2026-09-02", asin: "A", cost: 10, sales: 100 },
        { data: "2026-09-03", asin: "A", cost: 10, sales: 0 },
        { data: "2026-08-01", asin: "A", cost: 999 },
      ],
      DE,
      ATE,
      new Map(),
    );
    expect([l[0]!.custo, l[0]!.acosPct]).toEqual([20, 20]);
  });
  it("campanha no limite só se ativa e com 30%+ dos dias a 95%+ do orçamento", () => {
    const dias = (id: string, custos: number[], venda = 0) =>
      custos.map((c, i) => ({
        data: `2026-09-0${i + 1}`,
        campaign_id: id,
        cost: c,
        sales_14d: venda,
      }));
    const o = campanhasNoLimite(
      [
        ...dias("a", [96, 99, 10, 10], 200),
        ...dias("b", [100, 100, 100], 0),
        ...dias("c", [100, 100]),
        ...dias("d", [10, 10, 10, 96]),
      ],
      [
        { campaign_id: "a", campaign_name: "A", budget: 100, status: "ENABLED" },
        { campaign_id: "b", campaign_name: "B", budget: 100, status: "ENABLED" },
        { campaign_id: "c", campaign_name: "C", budget: 100, status: "PAUSED" },
        { campaign_id: "d", campaign_name: "D", budget: 100, status: "ENABLED" },
      ],
      DE,
      ATE,
    );
    expect(o.lista.map((c) => [c.campanha, c.diasNoLimite])).toEqual([
      ["B", 3],
      ["A", 2],
    ]);
    expect(o.lista[0]!.leitura).toMatch(/sem venda/);
  });
  it("SP + SB + SD juntos, cada um na janela do Console, sem contar duas vezes", () => {
    const ads = adsUnificados(
      [
        {
          data: "2026-09-10",
          ad_type: "SP",
          campaign_id: "p1",
          cost: 100,
          sales_14d: 500,
          sales_7d: 400,
        },
        {
          data: "2026-09-28",
          ad_type: "sponsoredProducts",
          campaign_id: "p1",
          cost: 100,
          sales_14d: 100,
          sales_7d: 50,
        },
        // SB também em campanha_dia: ignorado porque a tabela própria de SB tem linhas
        { data: "2026-09-10", ad_type: "SB", campaign_id: "b1", cost: 999, sales_14d: 999 },
        // SD só em campanha_dia: entra (a tabela própria está vazia)
        {
          data: "2026-09-11",
          ad_type: "SPONSORED_DISPLAY",
          campaign_id: "d1",
          cost: 50,
          sales_14d: 200,
        },
      ],
      [
        {
          data: "2026-09-12",
          campaign_id: "b1",
          campaign_name: "SB Marca",
          cost: 300,
          sales: 900,
          clicks: 40,
        },
      ],
      [],
    );
    const r = resumoAmazon([], ads, DE, ATE, "2026-10-01");
    expect(r.ads.custo).toBe(550);
    expect(r.ads.vendasAtribuidas).toBe(400 + 50 + 900 + 200); // SP 7d; SB e SD 14d
    expect(r.ads.acos14dPct).toBeCloseTo((550 / (500 + 100 + 900 + 200)) * 100);
    expect(r.ads.janelas).toEqual(["SB 14d", "SD 14d", "SP 7d"]);
    expect(r.ads.porTipo.map((t) => [t.tipo, t.custo, t.janela])).toEqual([
      ["SB", 300, "14d"],
      ["SP", 200, "7d"],
      ["SD", 50, "14d"],
    ]);
    expect(r.ads.diasMaturando).toBe(1);
    // linha antiga, sem sales_padrao: usa sales_14d
    expect(
      resumoAmazon([], [{ data: "2026-09-10", cost: 1, sales_14d: 2 }], DE, ATE).ads.acosPct,
    ).toBe(50);
  });
  it("tipo de anúncio e tendência semanal com os três tipos", () => {
    expect(["SP", "sponsoredBrands", "SPONSORED_DISPLAY", "sb", "x"].map(tipoAds)).toEqual([
      "SP",
      "SB",
      "SD",
      "SB",
      "",
    ]);
    const sem = adsPorSemana(
      adsUnificados(
        [{ data: "2026-09-16", ad_type: "SP", cost: 100, sales_7d: 300, sales_14d: 400 }],
        [{ data: "2026-09-20", cost: 50, sales: 100 }],
        [],
      ),
    );
    expect(sem.get("2026-09-14")).toEqual({ custo: 150, vendas: 400 });
    const t = tendenciaSemanal(
      [{ semana_ini: "2026-09-14", faturamento: 3000, invest_ads: 100, tacos_pct: 0.0333 }],
      12,
      sem,
    );
    expect(t.semanas[0]!.investAds).toBe(150);
    expect(t.semanas[0]!.tacosPct).toBeCloseTo(5);
    expect(t.semanas[0]!.roasAds).toBeCloseTo(400 / 150);
  });
});

describe("pedidos", () => {
  it("cancelamento por pedido, FBA × envio próprio e sem dado do comprador", () => {
    const p = pedidosAmazon(
      [
        {
          amazon_order_id: "1",
          purchase_dia: "2026-09-02",
          order_status: "Shipped",
          fulfillment_channel: "AFN",
          sku: "A",
          quantity: 1,
          item_price: 100,
        },
        {
          amazon_order_id: "1",
          purchase_dia: "2026-09-02",
          order_status: "Shipped",
          fulfillment_channel: "AFN",
          sku: "B",
          quantity: 2,
          item_price: 50,
        },
        {
          amazon_order_id: "2",
          purchase_dia: "2026-09-03",
          order_status: "Canceled",
          fulfillment_channel: "MFN",
          sku: "A",
          quantity: 1,
          item_price: 100,
        },
        {
          amazon_order_id: "3",
          purchase_dia: "2026-08-03",
          order_status: "Shipped",
          fulfillment_channel: "MFN",
          sku: "A",
        },
      ],
      DE,
      ATE,
      new Map(),
    );
    expect([p.pedidos, p.cancelados, p.valor]).toEqual([2, 1, 150]);
    expect(p.cancelamentoPct).toBe(50);
    expect(p.porCanal.map((c) => [c.canal, c.pedidos, c.valor])).toEqual([
      ["FBA", 1, 150],
      ["Envio próprio", 1, 0],
    ]);
    expect(p.skusComCancelamento).toEqual([
      { sku: "A", titulo: "A", pedidos: 2, cancelados: 1, cancelamentoPct: 50 },
    ]);
  });
});

describe("alerta de vencido no FBA", () => {
  it("entra no Command Center como problema", () => {
    const a = alertasAmazon({
      asins: [],
      termos: amazonFixture.termos,
      share: { semana: null, semanaAnterior: null, termos: 0, perderam: 0, lista: [] },
      organico: { anunciar: [], reduzirLance: [] },
      vencidoFba: 12,
    });
    expect(a[0]).toMatchObject({ tag: "Amazon FBA", tom: "danger" });
    expect(a[0]!.texto).toMatch(/^12 unidade\(s\) vencida/);
  });
});
