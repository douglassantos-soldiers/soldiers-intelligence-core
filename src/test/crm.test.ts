import { describe, expect, it } from "vitest";
import {
  filaDeAcao,
  motivoFila,
  calibracao,
  reguaReposicao,
  emailRD,
  automacoesRD,
  utmEmail,
  funilLeads,
  acoesGrowth,
  saudeKlaviyo,
} from "@/lib/crm";
import { raw, DE, ATE, AGORA, crmFixture } from "./crm-fixture";

describe("CRM 2.0", () => {
  it("fila: só acionáveis, ordenada por valor esperado, sem campos pessoais", () => {
    const f = filaDeAcao(raw.perfis);
    expect(f.total).toBe(3);
    expect(f.itens.map((i) => i.cliente)).toEqual([
      "c_9f2a71b0e4d3",
      "c_1b7e55c09a12",
      "c_44d0a8f3b2c6",
    ]);
    expect(f.valor90).toBe(885);
    expect(f.porAcao[0]).toMatchObject({ acao: "recompra", clientes: 1 });
    expect(Object.keys(f.itens[0]!)).not.toContain("email");
    expect(f.itens[0]!.motivo).toBe("costuma voltar a cada 35 dias e está 6 dias atrasado");
    expect(f.itens[2]!.motivo).toBe("1 pedido só, 28 dias sem comprar");
  });

  it("fila: chance em fração vira %", () => {
    const f = filaDeAcao([
      { cliente_chave: "x", acao: "recompra", acionavel: true, chance_30: 0.4, chance_90: 0.7 },
    ]);
    expect(f.itens[0]!.chance30).toBeCloseTo(40);
    expect(
      motivoFila({
        acao: "recompra",
        diasAtraso: -3,
        ritmoDias: 30,
        diasSemComprar: 27,
        pedidos: 3,
      }),
    ).toContain("janela abre em 3 dias");
  });

  it("calibração: otimista quando previu mais do que voltou", () => {
    const c = calibracao(raw.acuracia);
    const alta = c.faixas.find((f) => f.faixa === "50-100%")!;
    expect(alta.desvioPp).toBe(-15);
    expect(alta.leitura).toBe("otimista");
    expect(c.faixas.find((f) => f.horizonte === 30 && f.faixa === "0-20%")!.leitura).toBe(
      "calibrada",
    );
    expect(c.faixas.find((f) => f.horizonte === 90)!.leitura).toBe("conservadora");
    const h30 = c.horizontes.find((h) => h.horizonte === 30)!;
    // (1*4200 + 7*1300 + 15*380) / 5880
    expect(h30.erroMedioPp).toBeCloseTo((4200 + 9100 + 5700) / 5880);
  });

  it("régua: lembrete antes do ciclo, recompra do mesmo e próximo produto diferente", () => {
    const r = reguaReposicao(raw.ciclos, raw.proximos);
    expect(r.map((x) => x.sku)).toEqual(["CREA300", "WHEY900"]); // RARO tem poucos clientes
    expect(r[0]!.lembreteDia).toBe(33);
    expect(r[0]!.repete?.ocorrencias).toBe(2100);
    expect(r[0]!.proximo?.sku).toBe("WHEY900");
    expect(r[1]!.proximo).toBeNull();
  });

  it("e-mail: receita por mil entregues e alertas de saúde", () => {
    const e = emailRD(raw.campanhas, raw.vendasCampanha, DE, ATE);
    const semana = e.campanhas.find((c) => c.id === "101")!;
    expect(semana.receita).toBe(14300);
    expect(semana.receitaPorMilEntregues).toBeCloseTo((14300 / 19700) * 1000);
    expect(semana.alertas).toEqual([]); // bounce 1,5%, spam 0,04%
    const whey = e.campanhas.find((c) => c.id === "102")!;
    expect(whey.alertas).toContain("bounce alto"); // 6,25%
    expect(whey.alertas).toContain("spam acima do limite"); // 0,4%
    expect(e.campanhas[0]!.id).toBe("102"); // mais recente primeiro
    expect(e.total.receita).toBe(16200);
  });

  it("automações agregam por fluxo; UTM separa ligada e solta", () => {
    const a = automacoesRD(raw.automacoes, DE, ATE);
    expect(a[0]).toMatchObject({ fluxo: "Pós-compra creatina", entregues: 1570, cliques: 165 });
    const u = utmEmail(raw.utm, DE, ATE);
    expect(u.ligada.receita).toBe(14300);
    expect(u.solta.receita).toBe(4600);
    expect(u.soltasTop.map((x) => x.utm)).toEqual(["pos-compra", "(vazio)"]);
  });

  it("leads: conversão por origem e contagem por estágio", () => {
    const l = funilLeads(raw.leadDia, raw.leads, DE, ATE);
    expect(l.leads).toBe(2700);
    expect(l.compraram).toBe(105);
    expect(l.porOrigem[0]!.origem).toBe("Landing sorteio");
    expect(l.porOrigem.find((o) => o.origem === "Pop-up site")!.conversaoPct).toBeCloseTo(7.5);
    expect(l.porConversao[0]).toMatchObject({ nome: "popup-10off", qtd: 2 });
  });

  it("ações: atrasadas, fechadas sem resultado e variação", () => {
    const a = acoesGrowth(raw.acoes, raw.resultados, "2026-09-30");
    expect(a.abertas).toBe(1);
    expect(a.atrasadas).toBe(1);
    expect(a.fechadasSemResultado).toBe(1);
    expect(a.itens[0]!.id).toBe("a1");
    expect(a.itens.find((i) => i.id === "a2")!.resultado?.variacaoPct).toBe(30);
  });

  it("Klaviyo: falhando, parado e sem dados", () => {
    const k = saudeKlaviyo(raw.klaviyo, AGORA);
    expect(k.status).toBe("falhando");
    expect(k.falhasSeguidas).toBe(2);
    expect(k.perfis).toBe(3120);
    expect(saudeKlaviyo([raw.klaviyo[2]!], "2026-10-02T12:00:00Z").status).toBe("parado");
    expect(saudeKlaviyo([], AGORA).status).toBe("sem dados");
  });

  it("alertas do CRM para o Command Center", () => {
    const tags = crmFixture().alertas.map((a) => `${a.tipo}:${a.tag}`);
    expect(tags).toContain("problema:Klaviyo");
    expect(tags).toContain("problema:Previsão");
    expect(tags).toContain("problema:Growth");
    expect(tags).toContain("oportunidade:Reposição");
    // No total: spam 38/27.200 = 0,14% (acima de 0,1%) e bounce 800/28.000 = 2,9%.
    expect(tags.filter((t) => t === "problema:E-mail").length).toBe(2);
  });
});
