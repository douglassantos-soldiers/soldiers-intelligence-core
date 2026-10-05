// Estado e saúde do cliente, afinidade por produto e próxima ação com canal (Plano Mestre caps. 11.3, 11.6–11.8).
// Usa mv_growth_cliente_perfil, os itens do cliente e mv_growth_produto_proximo. Só leitura.
// Envio de mensagem não acontece aqui: a próxima ação fica "aguardando aprovação" até a Fase 3
// (Policy + Approval + Audit). Consentimento vem do Shopify (accepts_marketing) e só cobre clientes do site.

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v) || 0;
const nn = (v: unknown) =>
  v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
const txt = (v: unknown) => String(v ?? "").trim();
const dia = (v: unknown) => String(v ?? "").slice(0, 10);

// ---------------------------------------------------------------------------------------------
// Estado do cliente

// Regras do estado, na ordem em que são testadas. As mesmas regras viram filtros de contagem no servidor.
export const REGRA_ESTADO = {
  adormecidoDias: 90,
  perdidoDias: 180,
  riscoRazao: 1.5,
  fielPedidos: 4,
} as const;

export type Estado =
  "novo" | "recorrente" | "fiel" | "em_risco" | "adormecido" | "perdido" | "sem_dado";
export const ESTADOS: Estado[] = [
  "novo",
  "recorrente",
  "fiel",
  "em_risco",
  "adormecido",
  "perdido",
];
export const ESTADO_LABEL: Record<Estado, string> = {
  novo: "Novo",
  recorrente: "Recorrente",
  fiel: "Fiel",
  em_risco: "Em risco",
  adormecido: "Adormecido",
  perdido: "Perdido",
  sem_dado: "Sem dado",
};
export const ESTADO_REGRA_TEXTO: Record<Estado, string> = {
  novo: `1 pedido, comprou nos últimos ${REGRA_ESTADO.adormecidoDias} dias`,
  recorrente: `2 a ${REGRA_ESTADO.fielPedidos - 1} pedidos, dentro do ritmo`,
  fiel: `${REGRA_ESTADO.fielPedidos}+ pedidos, dentro do ritmo`,
  em_risco: `2+ pedidos e ${REGRA_ESTADO.riscoRazao}× além do ritmo de compra`,
  adormecido: `${REGRA_ESTADO.adormecidoDias + 1} a ${REGRA_ESTADO.perdidoDias} dias sem comprar`,
  perdido: `mais de ${REGRA_ESTADO.perdidoDias} dias sem comprar`,
  sem_dado: "sem data da última compra",
};

export type Saude = "saudável" | "atenção" | "em risco" | "perdido" | "sem dado";
export const SAUDE_DO_ESTADO: Record<Estado, Saude> = {
  novo: "saudável",
  recorrente: "saudável",
  fiel: "saudável",
  em_risco: "atenção",
  adormecido: "em risco",
  perdido: "perdido",
  sem_dado: "sem dado",
};

/** Razão entre dias sem comprar e o ritmo do cliente (coluna razao_ritmo do banco; as contagens usam a mesma). */
export function razaoRitmo(p: Row): number | null {
  return nn(p["razao_ritmo"]);
}

export function estadoDoCliente(p: Row): Estado {
  const dias = nn(p["dias_ultima_compra"]);
  if (dias == null) return "sem_dado";
  const pedidos = n(p["pedidos"]);
  if (dias > REGRA_ESTADO.perdidoDias) return "perdido";
  if (dias > REGRA_ESTADO.adormecidoDias) return "adormecido";
  const razao = razaoRitmo(p);
  if (pedidos >= 2 && razao != null && razao > REGRA_ESTADO.riscoRazao) return "em_risco";
  if (pedidos <= 1) return "novo";
  if (pedidos >= REGRA_ESTADO.fielPedidos) return "fiel";
  return "recorrente";
}

/** Distribuição da base a partir das contagens por estado (feitas no banco). */
export function distribuicaoEstados(contagem: Partial<Record<Estado, number>>) {
  const total = ESTADOS.reduce((s, e) => s + (contagem[e] ?? 0), 0);
  const linhas = ESTADOS.map((e) => ({
    estado: e,
    label: ESTADO_LABEL[e],
    regra: ESTADO_REGRA_TEXTO[e],
    saude: SAUDE_DO_ESTADO[e],
    clientes: contagem[e] ?? 0,
    pct: total ? ((contagem[e] ?? 0) / total) * 100 : null,
  }));
  const saude = (["saudável", "atenção", "em risco", "perdido"] as Saude[]).map((s) => {
    const c = linhas.filter((l) => l.saude === s).reduce((t, l) => t + l.clientes, 0);
    return { saude: s, clientes: c, pct: total ? (c / total) * 100 : null };
  });
  return { total, linhas, saude };
}

// ---------------------------------------------------------------------------------------------
// Afinidade por produto (nota 0–100 por cliente)

export type Afinidade = {
  sku: string;
  produto: string;
  nota: number;
  origem: "comprou" | "sugerido";
  motivo: string;
};

/**
 * Nota de afinidade. Para o que o cliente comprou: 60% participação nas unidades + 40% recência (meia-vida de 90 dias).
 * Para o que ele ainda não comprou: força do "quem compra X compra Y" ponderada pela afinidade com X.
 * É uma heurística explicável, não um modelo treinado.
 */
export function afinidadeCliente(
  itens: Row[],
  proximos: Row[],
  hoje: string,
  top = 8,
): Afinidade[] {
  const m = new Map<string, { produto: string; un: number; ultima: string }>();
  for (const i of itens) {
    const sku = txt(i["sku"]);
    if (!sku) continue;
    const cur = m.get(sku) ?? { produto: txt(i["produto"]), un: 0, ultima: "" };
    cur.un += n(i["quantidade"]) || 1;
    if (dia(i["data"]) > cur.ultima) cur.ultima = dia(i["data"]);
    m.set(sku, cur);
  }
  const totUn = [...m.values()].reduce((s, x) => s + x.un, 0);
  const hojeMs = Date.parse(hoje);
  const comprou = new Map<string, number>();
  const out: Afinidade[] = [];
  for (const [sku, x] of m) {
    const dias = x.ultima ? Math.max(0, (hojeMs - Date.parse(x.ultima)) / 86400000) : 365;
    const rec = Math.pow(0.5, dias / 90);
    const bruto = 0.6 * (totUn ? x.un / totUn : 0) + 0.4 * rec;
    comprou.set(sku, bruto);
    out.push({
      sku,
      produto: x.produto || sku,
      nota: bruto,
      origem: "comprou",
      motivo: `${x.un} un., última há ${Math.round(dias)} dias`,
    });
  }
  const fp = proximos.some((p) => Math.abs(n(p["forca_pct"])) > 1) ? 100 : 1;
  const sug = new Map<string, { produto: string; nota: number; de: string }>();
  for (const p of proximos) {
    const origem = txt(p["sku_origem"]);
    const seg = txt(p["sku_seguinte"]);
    if (!comprou.has(origem) || !seg || comprou.has(seg)) continue;
    const v = comprou.get(origem)! * (n(p["forca_pct"]) / fp);
    const cur = sug.get(seg);
    if (!cur || v > cur.nota)
      sug.set(seg, {
        produto: txt(p["produto_seguinte"]) || seg,
        nota: v,
        de: m.get(origem)?.produto || origem,
      });
  }
  for (const [sku, s] of sug)
    out.push({
      sku,
      produto: s.produto,
      nota: s.nota,
      origem: "sugerido",
      motivo: `quem compra ${s.de} costuma levar`,
    });
  const max = Math.max(0, ...out.map((o) => o.nota));
  return out
    .map((o) => ({ ...o, nota: max ? Math.round((o.nota / max) * 100) : 0 }))
    .sort((a, b) => b.nota - a.nota)
    .slice(0, top);
}

// ---------------------------------------------------------------------------------------------
// Próxima melhor ação com canal

export type Consentimento = {
  aceita: boolean | null; // e-mail
  desde: string;
  whatsapp?: boolean | null;
  fonte?: "registro" | "shopify";
};
export type ProximaAcao = {
  estado: Estado;
  saude: Saude;
  acao: string;
  quando: string;
  produto: string;
  canal: string;
  porqueCanal: string;
  aprovacao: "aguardando aprovação (Fase 3)";
};

const MARKETPLACE = /mercado|ml|shopee|amazon|tiktok/i;

export function proximaAcao(p: Row, afinidade: Afinidade[], consent: Consentimento): ProximaAcao {
  const estado = estadoDoCliente(p);
  const atraso = nn(p["dias_atraso"]);
  const canalUltimo = txt(p["canal_ultimo"]);
  const produto = txt(p["produto_provavel"]) || afinidade[0]?.produto || "";
  let canal: string;
  let porqueCanal: string;
  const deOnde = consent.fonte === "registro" ? "registro de consentimento" : "pedido do site";
  if (consent.whatsapp === true) {
    canal = "WhatsApp";
    porqueCanal = `opt-in de WhatsApp registrado (${deOnde}).${consent.aceita === true ? " E-mail também liberado." : ""}`;
  } else if (consent.aceita === true) {
    canal = "E-mail (RD / Klaviyo)";
    porqueCanal =
      consent.fonte === "registro"
        ? "e-mail liberado no registro de consentimento; WhatsApp sem opt-in."
        : "aceitou marketing no site. WhatsApp só com opt-in próprio, que o banco não registra.";
  } else if (consent.aceita === false) {
    canal = "Remarketing em mídia paga";
    porqueCanal = "não aceitou marketing: sem e-mail nem WhatsApp.";
  } else if (MARKETPLACE.test(canalUltimo) && !/site|shopify/i.test(canalUltimo)) {
    canal = `Remarketing no ${canalUltimo}`;
    porqueCanal = "cliente de marketplace: o canal não libera contato direto.";
  } else {
    canal = "Conferir consentimento antes";
    porqueCanal = "sem registro de consentimento para este cliente.";
  }
  const acao =
    estado === "perdido"
      ? "Reativação com oferta"
      : estado === "adormecido"
        ? "Resgate"
        : estado === "em_risco"
          ? "Recompra urgente"
          : estado === "novo"
            ? "Incentivar a 2ª compra"
            : "Lembrete de recompra";
  const quando = atraso == null ? "—" : atraso < 0 ? `em ${Math.round(-atraso)} dias` : "agora";
  return {
    estado,
    saude: SAUDE_DO_ESTADO[estado],
    acao,
    quando,
    produto,
    canal,
    porqueCanal,
    aprovacao: "aguardando aprovação (Fase 3)",
  };
}

/** Consentimento mais recente do cliente nos pedidos do Shopify (linhas com order_customer_accepts_marketing). */
export function consentimentoDe(linhas: Row[]): Consentimento {
  let melhor: Row | null = null;
  for (const l of linhas)
    if (!melhor || txt(l["order_created_at"]) > txt(melhor["order_created_at"])) melhor = l;
  if (!melhor) return { aceita: null, desde: "", fonte: "shopify" };
  const v = melhor["order_customer_accepts_marketing"];
  const aceita = v === true || v === "true" ? true : v === false || v === "false" ? false : null;
  return { aceita, desde: dia(melhor["order_created_at"]), fonte: "shopify" };
}

/** Consentimento vigente pelo registro (vw_cliente_consentimento_atual). null quando o cliente não tem registro. */
export function consentimentoRegistrado(linhas: Row[]): Consentimento | null {
  if (!linhas.length) return null;
  const por = (c: string) => linhas.find((l) => txt(l["canal"]) === c);
  const st = (l?: Row) => (!l ? null : txt(l["status"]) === "concedido");
  const email = por("email");
  const datas = linhas.map((l) => dia(l["ocorrido_em"])).sort();
  return {
    aceita: st(email),
    whatsapp: st(por("whatsapp")),
    desde: datas.at(-1) ?? "",
    fonte: "registro",
  };
}

// ---------------------------------------------------------------------------------------------
// Linha do tempo do estado (crm_estado_dia) e transições (crm_estado_historico)

/** Uma linha por dia com a contagem de cada estado (estado ausente no dia = 0). */
export function linhaDoTempo(rows: Row[]) {
  const m = new Map<string, Record<string, number | string>>();
  for (const r of rows) {
    const d = dia(r["data"]);
    const e = txt(r["estado"]) as Estado;
    if (!d || !ESTADOS.includes(e)) continue;
    const cur =
      m.get(d) ?? Object.fromEntries([["data", d], ...ESTADOS.map((x) => [ESTADO_LABEL[x], 0])]);
    cur[ESTADO_LABEL[e]] = n(r["clientes"]);
    m.set(d, cur);
  }
  return [...m.values()].sort((a, b) => String(a["data"]).localeCompare(String(b["data"])));
}

/** Quantos clientes mudaram de um estado para outro (linhas do histórico com estado anterior). */
export function transicoes(rows: Row[]) {
  const m = new Map<string, { de: Estado; para: Estado; clientes: number }>();
  for (const r of rows) {
    const de = txt(r["estado_anterior"]) as Estado;
    const para = txt(r["estado"]) as Estado;
    if (!de || !para) continue;
    const k = `${de}>${para}`;
    const cur = m.get(k) ?? { de, para, clientes: 0 };
    cur.clientes++;
    m.set(k, cur);
  }
  const ordem = (e: Estado) => ESTADOS.indexOf(e);
  return [...m.values()]
    .map((t) => ({
      ...t,
      piora: ordem(t.para) > ordem(t.de) && ordem(t.para) >= ESTADOS.indexOf("em_risco"),
    }))
    .sort((a, b) => b.clientes - a.clientes);
}
