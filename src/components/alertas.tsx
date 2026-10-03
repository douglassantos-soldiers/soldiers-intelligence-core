import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Panel, StatusTag, Empty } from "@/components/kit";
import { getAlertas } from "@/lib/data.functions";
import { ACAO_LABEL } from "@/domain/sources";
import { fmtBRL, fmtNum, fmtPct } from "@/lib/format";

// Command Center: "Problemas" e "Oportunidades" (Plano Mestre cap. 28).
// Só sinais que já existem no banco; nada é inventado nem estimado aqui.
const ACOES_OPORTUNIDADE = ["recompra", "segunda_compra", "valioso_em_risco"];

export function Alertas() {
  const fn = useServerFn(getAlertas);
  const q = useQuery({ queryKey: ["alertas"], queryFn: () => fn() });
  const d = q.data;
  if (!d) return null;

  const estoque = d.estoque.filter((e) => Number(e["cobertura_dias"]) <= 21);
  const bb = d.buybox;
  // Alertas dos marketplaces (Amazon e Mercado Livre), cada um com o link da sua tela.
  const canais = [
    ...(d.amazon ?? []).map((a) => ({ ...a, to: "/marketplace/amazon" as const, nome: "Amazon" })),
    ...(d.google ?? []).map((a) => ({ ...a, to: "/media/google" as const, nome: "Google" })),
    ...(d.shopee ?? []).map((a) => ({ ...a, to: "/marketplace/shopee" as const, nome: "Shopee" })),
    ...(d.mercadoLivre ?? []).map((a) => ({
      ...a,
      to: "/marketplace/mercado-livre" as const,
      nome: "Mercado Livre",
    })),
  ];
  const amazonProblemas = canais.filter((a) => a.tipo === "problema").length;
  const amazonOportunidades = canais.filter((a) => a.tipo === "oportunidade").length;
  const acoes = d.acoes
    .filter((a) => ACOES_OPORTUNIDADE.includes(String(a["acao"])))
    .reduce<Record<string, { clientes: number; valor: number }>>((m, a) => {
      const k = String(a["acao"]);
      const cur = m[k] ?? { clientes: 0, valor: 0 };
      cur.clientes += Number(a["clientes"]) || 0;
      cur.valor += Number(a["valor_esperado"]) || 0;
      m[k] = cur;
      return m;
    }, {});

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Problemas">
        <ul className="space-y-3 text-sm">
          {estoque.map((e) => (
            <li key={String(e["sku"])} className="flex items-start gap-2">
              <StatusTag tone={Number(e["cobertura_dias"]) <= 7 ? "danger" : "warn"}>
                Estoque site
              </StatusTag>
              <span>
                <Link
                  to="/produtos/$sku"
                  params={{ sku: String(e["sku"]) }}
                  className="font-medium hover:text-primary"
                >
                  {String(e["title"] ?? e["sku"])}
                </Link>{" "}
                cobre {fmtNum(e["cobertura_dias"])} dias ({fmtNum(e["estoque"])} un.). Evite escalar
                mídia e afiliados para este SKU no site.
              </span>
            </li>
          ))}
          {bb && Number(bb["perdendo_concorrente"]) + Number(bb["suprimida"]) > 0 && (
            <li className="flex items-start gap-2">
              <StatusTag tone="warn">Amazon</StatusTag>
              <span>
                {fmtNum(bb["perdendo_concorrente"])} ASINs perdendo Buy Box para concorrente e{" "}
                {fmtNum(bb["suprimida"])} suprimidos.{" "}
                <Link to="/marketplace" className="text-primary hover:underline">
                  Ver Marketplace
                </Link>
              </span>
            </li>
          )}
          {canais
            .filter((a) => a.tipo === "problema")
            .map((a) => (
              <li key={a.texto} className="flex items-start gap-2">
                <StatusTag tone={a.tom}>{a.tag}</StatusTag>
                <span>
                  {a.texto}{" "}
                  <Link to={a.to} className="text-primary hover:underline">
                    Ver {a.nome}
                  </Link>
                </span>
              </li>
            ))}
          {d.problemasDados > 0 && (
            <li className="flex items-start gap-2">
              <StatusTag tone="warn">Dados</StatusTag>
              <span>
                {fmtNum(d.problemasDados)} problemas de dados abertos.{" "}
                <Link to="/data-health" className="text-primary hover:underline">
                  Ver Data Health
                </Link>
              </span>
            </li>
          )}
          {!estoque.length &&
            !(bb && Number(bb["perdendo_concorrente"]) + Number(bb["suprimida"]) > 0) &&
            !d.problemasDados &&
            !amazonProblemas && <Empty>Nenhum problema detectado.</Empty>}
        </ul>
      </Panel>

      <Panel title="Oportunidades">
        <ul className="space-y-3 text-sm">
          {Object.entries(acoes).map(([acao, v]) => (
            <li key={acao} className="flex items-start gap-2">
              <StatusTag tone={acao === "valioso_em_risco" ? "danger" : "success"}>
                {ACAO_LABEL[acao] ?? acao}
              </StatusTag>
              <span>
                {fmtNum(v.clientes)} clientes, valor esperado de {fmtBRL(v.valor)} em 90 dias.{" "}
                <Link to="/clientes" className="text-primary hover:underline">
                  Ver clientes
                </Link>
              </span>
            </li>
          ))}
          {d.skusEmAlta.map((s) => (
            <li key={s.sku} className="flex items-start gap-2">
              <StatusTag tone="primary">Produto em alta</StatusTag>
              <span>
                <Link
                  to="/produtos/$sku"
                  params={{ sku: s.sku }}
                  className="font-medium hover:text-primary"
                >
                  {s.produto || s.sku}
                </Link>
                : {fmtBRL(s.atual)} nos últimos 14 dias, {fmtPct(s.variacao, 0)} acima dos 14
                anteriores.
              </span>
            </li>
          ))}
          {canais
            .filter((a) => a.tipo === "oportunidade")
            .map((a) => (
              <li key={a.texto} className="flex items-start gap-2">
                <StatusTag tone={a.tom}>{a.tag}</StatusTag>
                <span>
                  {a.texto}{" "}
                  <Link to={a.to} className="text-primary hover:underline">
                    Ver {a.nome}
                  </Link>
                </span>
              </li>
            ))}
          {!Object.keys(acoes).length && !d.skusEmAlta.length && !amazonOportunidades && (
            <Empty>Nenhuma oportunidade destacada.</Empty>
          )}
        </ul>
      </Panel>
    </div>
  );
}
