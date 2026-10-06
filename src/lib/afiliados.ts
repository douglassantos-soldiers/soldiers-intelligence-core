// Affiliate OS: visão por canal, Creator 360 e qualidade do cliente por creator (Plano Mestre cap. 8 e 8.14).
// Views que JÁ existem: vw_ml_afiliado_dia, vw_shopee_afiliado_dia, vw_tiktok_afiliado_dia,
// vw_ml_afiliado_creator_dia, vw_influenciador_360, vw_site_cupom_dia, vw_up_afiliado, vw_up_afiliado_mes
// e as views por produto (vw_ml_afiliado_produto_dia, vw_shopee_afiliado_produto_dia, vw_tiktok_afiliado_produto_dia).
//
// Regras: Affiliate é separado de Media (cap. 2.2). GMV de afiliado é parte da venda do canal, não venda extra:
// nunca somar ao GMV total. Sem cidade, estado, e-mail ou telefone de creator: só nome público e @.

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const nn = (v: unknown) =>
  v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
const txt = (v: unknown) => String(v ?? "").trim();
const dia = (v: unknown) => String(v ?? "").slice(0, 10);
const div = (a: number, b: number) => (b ? a / b : null);
const pct = (a: number, b: number) => (b ? (a / b) * 100 : null);
const noPeriodo = (rows: Row[], de: string, ate: string) =>
  rows.filter((r) => dia(r["data"]) >= de && dia(r["data"]) <= ate);
const diasEntre = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

// ---------------------------------------------------------------------------------------------
// Por canal

export type CanalAfiliado = {
  canal: string;
  gmvAfiliado: number;
  gmvTotal: number;
  custo: number;
  pedidosAfiliado: number;
  pedidosTotal: number;
  pctGmv: number | null;
  comissaoEfetivaPct: number | null;
  custoSobreTotalPct: number | null;
  ticketAfiliado: number | null;
  ticketSem: number | null;
  margemComPct: number | null;
  margemSemPct: number | null;
};

function canal(nome: string, rows: Row[], k: { custo: string; margem?: boolean }): CanalAfiliado {
  let gA = 0,
    gT = 0,
    c = 0,
    pA = 0,
    pT = 0,
    mCom = 0,
    mComPeso = 0,
    mSem = 0,
    mSemPeso = 0;
  for (const r of rows) {
    const ga = n(r["gmv_afiliado"]);
    const gt = n(r["gmv_total"]);
    gA += ga;
    gT += gt;
    c += n(r[k.custo]);
    pA += n(r["pedidos_afiliado"]);
    pT += n(r["pedidos_total"]);
    if (k.margem) {
      const mc = nn(r["margem_afiliado_pct"]);
      const ms = nn(r["margem_sem_afiliado_pct"]);
      if (mc != null && ga) {
        mCom += mc * ga;
        mComPeso += ga;
      }
      if (ms != null && gt - ga > 0) {
        mSem += ms * (gt - ga);
        mSemPeso += gt - ga;
      }
    }
  }
  return {
    canal: nome,
    gmvAfiliado: gA,
    gmvTotal: gT,
    custo: c,
    pedidosAfiliado: pA,
    pedidosTotal: pT,
    pctGmv: pct(gA, gT),
    comissaoEfetivaPct: pct(c, gA),
    custoSobreTotalPct: pct(c, gT),
    ticketAfiliado: div(gA, pA),
    ticketSem: div(gT - gA, pT - pA),
    margemComPct: mComPeso ? mCom / mComPeso : null,
    margemSemPct: mSemPeso ? mSem / mSemPeso : null,
  };
}

export function afiliadosPorCanal(
  i: { ml: Row[]; shopee: Row[]; tiktok: Row[] },
  de: string,
  ate: string,
): CanalAfiliado[] {
  return [
    canal("Mercado Livre", noPeriodo(i.ml, de, ate), { custo: "custo_afiliado" }),
    canal("Shopee", noPeriodo(i.shopee, de, ate), { custo: "custo_afiliado", margem: true }),
    canal("TikTok Shop", noPeriodo(i.tiktok, de, ate), { custo: "custo_total", margem: true }),
  ].filter((c) => c.gmvTotal > 0 || c.gmvAfiliado > 0);
}

// ---------------------------------------------------------------------------------------------
// Creator 360 (todas as fontes numa lista só, no mesmo período)

export type Creator = {
  chave: string;
  fonte: "Influenciador" | "Mercado Livre" | "UpPromote";
  nome: string;
  handle: string;
  tier: string;
  cupom: string;
  gmv: number;
  gmvSite: number;
  gmvTikTok: number;
  custo: number;
  roi: number | null;
  pedidos: number;
  ticket: number | null;
  pctNovos: number | null;
  devolucaoPct: number | null;
  descontoPct: number | null;
  ultimaVenda: string;
  diasSemVenda: number | null;
  estado: "ativo" | "esfriando" | "parado" | "sem venda";
  pagoSemVenda: boolean;
};

export const DIAS_ESTADO = { ativo: 14, esfriando: 45 } as const;

function estadoDe(
  ultima: string,
  ref: string,
  gmv: number,
): Pick<Creator, "estado" | "diasSemVenda"> {
  if (!ultima || gmv <= 0) return { estado: "sem venda", diasSemVenda: null };
  const d = diasEntre(ultima, ref);
  return {
    diasSemVenda: d,
    estado: d <= DIAS_ESTADO.ativo ? "ativo" : d <= DIAS_ESTADO.esfriando ? "esfriando" : "parado",
  };
}

/** Qualidade do cliente pelo cupom no site: % de pedidos de cliente novo, devolução e desconto. */
export function qualidadePorCupom(cupons: Row[], de: string, ate: string) {
  const m = new Map<
    string,
    {
      pedidos: number;
      novos: number;
      unidades: number;
      devolvidas: number;
      desconto: number;
      bruto: number;
      liquido: number;
    }
  >();
  for (const r of noPeriodo(cupons, de, ate)) {
    const k = txt(r["cupom"]).toUpperCase();
    if (!k) continue;
    const cur = m.get(k) ?? {
      pedidos: 0,
      novos: 0,
      unidades: 0,
      devolvidas: 0,
      desconto: 0,
      bruto: 0,
      liquido: 0,
    };
    cur.pedidos += n(r["pedidos"]);
    cur.novos += n(r["pedidos_cliente_novo"]);
    cur.unidades += n(r["unidades"]);
    cur.devolvidas += n(r["unidades_devolvidas"]);
    cur.desconto += n(r["desconto"]);
    cur.bruto += n(r["faturamento_bruto"]);
    cur.liquido += n(r["faturamento_liquido"]);
    m.set(k, cur);
  }
  return new Map(
    [...m.entries()].map(([k, x]) => [
      k,
      {
        ...x,
        pctNovos: pct(x.novos, x.pedidos),
        devolucaoPct: pct(x.devolvidas, x.unidades),
        descontoPct: pct(x.desconto, x.bruto),
      },
    ]),
  );
}

export function creators360(
  i: {
    influenciadores: Row[];
    cuponsSite: Row[];
    mlCreators: Row[];
    upAfiliados: Row[];
    upMes: Row[];
  },
  de: string,
  ate: string,
  ref: string,
): Creator[] {
  const qual = qualidadePorCupom(i.cuponsSite, de, ate);
  const out: Creator[] = [];

  // Influenciadores (contrato + cupom no site + vendas no TikTok), por dia.
  const inf = new Map<
    string,
    {
      nome: string;
      handle: string;
      tier: string;
      cupom: string;
      site: number;
      tt: number;
      custo: number;
      pedidos: number;
      ultima: string;
    }
  >();
  for (const r of noPeriodo(i.influenciadores, de, ate)) {
    const k = txt(r["creator_id"]) || txt(r["cupom"]) || txt(r["nome"]);
    if (!k) continue;
    const cur = inf.get(k) ?? {
      nome: txt(r["nome"]),
      handle: txt(r["tiktok_username"]),
      tier: txt(r["tier"]),
      cupom: txt(r["cupom"]),
      site: 0,
      tt: 0,
      custo: 0,
      pedidos: 0,
      ultima: "",
    };
    const rs = n(r["receita_site"]);
    const rt = n(r["receita_tiktok"]);
    cur.site += rs;
    cur.tt += rt;
    cur.custo += n(r["custo_dia"]) + n(r["comissao_dia"]);
    cur.pedidos += n(r["pedidos_total"]);
    if (rs + rt > 0 && dia(r["data"]) > cur.ultima) cur.ultima = dia(r["data"]);
    inf.set(k, cur);
  }
  // Receita do UpPromote por cupom no período: entra no influenciador do mesmo cupom pela regra da planilha de
  // fechamento (venda considerada = maior entre cupom e UpPromote), para a mesma venda não contar duas vezes.
  const upPorCupom = new Map<string, number>();
  {
    const cadUp = new Map(
      i.upAfiliados.map((a) => [txt(a["uppromote_id"]), txt(a["cupom"]).toUpperCase()]),
    );
    for (const r of i.upMes) {
      const mes = txt(r["mes"]).slice(0, 7);
      if (mes < de.slice(0, 7) || mes > ate.slice(0, 7)) continue;
      const cupom = cadUp.get(txt(r["uppromote_id"]));
      if (cupom) upPorCupom.set(cupom, (upPorCupom.get(cupom) ?? 0) + n(r["receita"]));
    }
  }
  const cuponsInfluenciador = new Set<string>();
  for (const [k, x] of inf) {
    const q = qual.get(x.cupom.toUpperCase());
    if (x.cupom) cuponsInfluenciador.add(x.cupom.toUpperCase());
    x.site = Math.max(x.site, upPorCupom.get(x.cupom.toUpperCase()) ?? 0);
    const gmv = x.site + x.tt;
    out.push({
      chave: `inf:${k}`,
      fonte: "Influenciador",
      nome: x.nome || x.handle || k,
      handle: x.handle ? `@${x.handle.replace(/^@/, "")}` : "",
      tier: x.tier,
      cupom: x.cupom,
      gmv,
      gmvSite: x.site,
      gmvTikTok: x.tt,
      custo: x.custo,
      roi: div(gmv, x.custo),
      pedidos: x.pedidos,
      ticket: div(gmv, x.pedidos),
      pctNovos: q?.pctNovos ?? null,
      devolucaoPct: q?.devolucaoPct ?? null,
      descontoPct: q?.descontoPct ?? null,
      ultimaVenda: x.ultima,
      ...estadoDe(x.ultima, ref, gmv),
      pagoSemVenda: x.custo > 0 && gmv <= 0,
    });
  }

  // Afiliados do Mercado Livre, por dia.
  const ml = new Map<
    string,
    { nome: string; gmv: number; custo: number; pedidos: number; ultima: string }
  >();
  for (const r of noPeriodo(i.mlCreators, de, ate)) {
    const k = txt(r["afiliado_username"]) || txt(r["afiliado_nome"]);
    if (!k) continue;
    const cur = ml.get(k) ?? {
      nome: txt(r["afiliado_nome"]),
      gmv: 0,
      custo: 0,
      pedidos: 0,
      ultima: "",
    };
    cur.gmv += n(r["gmv"]);
    cur.custo += n(r["custo"]);
    cur.pedidos += n(r["pedidos"]);
    if (n(r["gmv"]) > 0 && dia(r["data"]) > cur.ultima) cur.ultima = dia(r["data"]);
    ml.set(k, cur);
  }
  for (const [k, x] of ml)
    out.push({
      chave: `ml:${k}`,
      fonte: "Mercado Livre",
      nome: x.nome || k,
      handle: txt(k).startsWith("@") ? k : `@${k}`,
      tier: "",
      cupom: "",
      gmv: x.gmv,
      gmvSite: 0,
      gmvTikTok: 0,
      custo: x.custo,
      roi: div(x.gmv, x.custo),
      pedidos: x.pedidos,
      ticket: div(x.gmv, x.pedidos),
      pctNovos: null,
      devolucaoPct: null,
      descontoPct: null,
      ultimaVenda: x.ultima,
      ...estadoDe(x.ultima, ref, x.gmv),
      pagoSemVenda: false,
    });

  // UpPromote (afiliados do site), por mês. Custo estimado = receita × comissão cadastrada.
  const mesDe = de.slice(0, 7);
  const mesAte = ate.slice(0, 7);
  const cad = new Map(i.upAfiliados.map((a) => [txt(a["uppromote_id"]), a]));
  const up = new Map<
    string,
    { receita: number; pedidos: number; novos: number; ultimoMes: string }
  >();
  for (const r of i.upMes) {
    const mes = txt(r["mes"]).slice(0, 7);
    if (mes < mesDe || mes > mesAte) continue;
    const k = txt(r["uppromote_id"]);
    const cur = up.get(k) ?? { receita: 0, pedidos: 0, novos: 0, ultimoMes: "" };
    cur.receita += n(r["receita"]);
    cur.pedidos += n(r["pedidos"]);
    cur.novos += n(r["pedidos_cliente_novo"]);
    if (n(r["receita"]) > 0 && mes > cur.ultimoMes) cur.ultimoMes = mes;
    up.set(k, cur);
  }
  for (const [k, x] of up) {
    const a = cad.get(k) ?? {};
    // Mesmo cupom de um influenciador: já entrou nele pela venda considerada.
    if (cuponsInfluenciador.has(txt((a as Row)["cupom"]).toUpperCase())) continue;
    const com = nn((a as Row)["comissao_pct"]);
    const cupom = txt((a as Row)["cupom"]);
    const q = qual.get(cupom.toUpperCase());
    // Último mês com venda vira o último dia daquele mês (ou a referência, se for o mês corrente).
    const fimMes = x.ultimoMes
      ? new Date(Date.UTC(+x.ultimoMes.slice(0, 4), +x.ultimoMes.slice(5, 7), 0))
          .toISOString()
          .slice(0, 10)
      : "";
    const ultima = fimMes && fimMes > ref ? ref : fimMes;
    out.push({
      chave: `up:${k}`,
      fonte: "UpPromote",
      nome: txt((a as Row)["nome"]) || `Afiliado ${k}`,
      handle: "",
      tier: txt((a as Row)["programa"]),
      cupom,
      gmv: x.receita,
      gmvSite: x.receita,
      gmvTikTok: 0,
      custo: com != null ? (x.receita * com) / 100 : 0,
      roi: com ? 100 / com : null,
      pedidos: x.pedidos,
      ticket: div(x.receita, x.pedidos),
      pctNovos: pct(x.novos, x.pedidos),
      devolucaoPct: q?.devolucaoPct ?? null,
      descontoPct: q?.descontoPct ?? null,
      ultimaVenda: ultima,
      ...estadoDe(ultima, ref, x.receita),
      pagoSemVenda: false,
    });
  }
  return out.sort((a, b) => b.gmv - a.gmv);
}

/** Concentração: quantos creators fazem 80% do GMV e quanto os 3 maiores representam. */
export function concentracao(creators: Creator[]) {
  const vend = creators.filter((c) => c.gmv > 0).sort((a, b) => b.gmv - a.gmv);
  const tot = vend.reduce((s, c) => s + c.gmv, 0);
  let acum = 0;
  let n80 = 0;
  for (const c of vend) {
    acum += c.gmv;
    n80++;
    if (tot && acum / tot >= 0.8) break;
  }
  return {
    comVenda: vend.length,
    total: creators.length,
    fazem80: tot ? n80 : 0,
    top3Pct: tot ? (vend.slice(0, 3).reduce((s, c) => s + c.gmv, 0) / tot) * 100 : null,
  };
}

// ---------------------------------------------------------------------------------------------
// Produtos que dependem de afiliado

export type ProdutoAfiliado = {
  canal: string;
  sku: string;
  produto: string;
  gmvAfiliado: number;
  gmvTotal: number;
  custo: number;
  pctViaAfiliado: number | null;
  comissaoEfetivaPct: number | null;
};

export function produtosAfiliado(
  i: { ml: Row[]; shopee: Row[]; tiktok: Row[] },
  de: string,
  ate: string,
): ProdutoAfiliado[] {
  const out: ProdutoAfiliado[] = [];
  const agrega = (canalNome: string, rows: Row[], skuCol: string) => {
    const m = new Map<string, { produto: string; ga: number; gt: number; c: number }>();
    for (const r of noPeriodo(rows, de, ate)) {
      const k = txt(r[skuCol]) || txt(r["item_id"]) || txt(r["produto"]);
      if (!k) continue;
      const cur = m.get(k) ?? { produto: txt(r["produto"]), ga: 0, gt: 0, c: 0 };
      cur.ga += n(r["gmv_afiliado"]);
      cur.gt += n(r["gmv_total"]);
      cur.c += n(r["custo_afiliado"]);
      m.set(k, cur);
    }
    for (const [sku, x] of m)
      if (x.ga > 0)
        out.push({
          canal: canalNome,
          sku,
          produto: x.produto || sku,
          gmvAfiliado: x.ga,
          gmvTotal: x.gt,
          custo: x.c,
          pctViaAfiliado: pct(x.ga, x.gt),
          comissaoEfetivaPct: pct(x.c, x.ga),
        });
  };
  agrega("Mercado Livre", i.ml, "seller_sku");
  agrega("Shopee", i.shopee, "item_sku");
  agrega("TikTok Shop", i.tiktok, "seller_sku");
  return out.sort((a, b) => b.gmvAfiliado - a.gmvAfiliado);
}

// ---------------------------------------------------------------------------------------------
// Alertas

export type AlertaCanal = {
  tipo: "problema" | "oportunidade";
  tag: string;
  tom: "danger" | "warn" | "success" | "primary";
  texto: string;
};

export function alertasAfiliados(i: {
  canais: CanalAfiliado[];
  creators: Creator[];
  concentracao: ReturnType<typeof concentracao>;
}): AlertaCanal[] {
  const out: AlertaCanal[] = [];
  const brl = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
  const pagos = i.creators.filter((c) => c.pagoSemVenda);
  if (pagos.length)
    out.push({
      tipo: "problema",
      tag: "Influenciadores",
      tom: "warn",
      texto: `${pagos.length} influenciador(es) com custo de ${brl(pagos.reduce((s, c) => s + c.custo, 0))} e nenhuma venda no período.`,
    });
  for (const c of i.canais)
    if (c.margemComPct != null && c.margemSemPct != null && c.margemSemPct - c.margemComPct > 15)
      out.push({
        tipo: "problema",
        tag: `Afiliados ${c.canal}`,
        tom: "warn",
        texto: `Venda via afiliado no ${c.canal} tem margem de ${Math.round(c.margemComPct)}%, contra ${Math.round(c.margemSemPct)}% sem afiliado. Revisar comissão por produto.`,
      });
  if (i.concentracao.top3Pct != null && i.concentracao.top3Pct > 60)
    out.push({
      tipo: "problema",
      tag: "Afiliados",
      tom: "warn",
      texto: `3 creators fazem ${Math.round(i.concentracao.top3Pct)}% do GMV de afiliados. Dependência alta.`,
    });
  const reativar = i.creators
    .filter((c) => c.estado === "esfriando" && c.gmv > 0)
    .sort((a, b) => b.gmv - a.gmv);
  if (reativar.length)
    out.push({
      tipo: "oportunidade",
      tag: "Reativar creator",
      tom: "success",
      texto: `${reativar.length} creator(s) venderam no período e estão há mais de ${DIAS_ESTADO.ativo} dias sem venda, como ${reativar[0]!.nome} (${brl(reativar[0]!.gmv)}).`,
    });
  return out;
}
