// Placar do creator (onda 3 do benchmark Cruva; roadmap v3 "portal do creator"). Prévia interna do que o creator
// veria no portal: posição no ranking, faixa de comissão e quanto falta para a próxima, amostras, direitos de uso e
// o brief do produto principal. Só leitura; nada é publicado para o creator. Sem dado pessoal: nome público e @.

import { categoria, STATUS_AMOSTRA_LABEL, type Amostra, type CreatorOS } from "@/lib/affiliateos";
import type { DireitoUso, FaixaCreator, RegraComissao } from "@/lib/programa";

export type Placar = {
  handle: string;
  nome: string;
  posicao: number;
  de: number;
  gmv: number;
  gmv28: number;
  videos: number;
  ultimaVenda: string;
  categoriaPrincipal: string;
  faixaPct: number;
  proximaFaixa: { comissaoPct: number; faltaVendas: number } | null;
  amostras: { produto: string; status: string; dias: number | null; alerta: string }[];
  direitosAtivos: number;
  briefProduto: string;
};

export function placares(i: {
  creators: CreatorOS[];
  faixas: FaixaCreator[];
  regra: RegraComissao;
  margemPct: number;
  amostras: Amostra[];
  direitos: DireitoUso[];
  briefs: { produto: string }[];
}): Placar[] {
  const ranking = i.creators
    .filter((c) => c.tipoConta === "creator" && c.gmv > 0)
    .sort((a, b) => b.gmv - a.gmv);
  const faixa = new Map(i.faixas.map((f) => [f.handle, f]));
  const base = i.regra.faixas[0]!;
  return ranking.map((c, idx) => {
    const f = faixa.get(c.handle);
    const atual = f?.faixaSugerida ?? base;
    const medida = f?.medida ?? 0;
    const prox = i.regra.faixas.find((x) => x.de > medida && x.comissaoPct > atual.comissaoPct);
    // Falta em vendas (GMV): na regra por contribuição, converte pela margem via afiliado.
    const falta = prox
      ? i.regra.base === "gmv"
        ? prox.de - medida
        : i.margemPct > 0
          ? ((prox.de - medida) * 100) / i.margemPct
          : null
      : null;
    const brief = i.briefs.find((b) => categoria(b.produto) === c.categoriaPrincipal);
    return {
      handle: c.handle,
      nome: c.nome,
      posicao: idx + 1,
      de: ranking.length,
      gmv: c.gmv,
      gmv28: c.gmv28,
      videos: c.videos,
      ultimaVenda: c.ultimaVenda,
      categoriaPrincipal: c.categoriaPrincipal,
      faixaPct: atual.comissaoPct,
      proximaFaixa:
        prox && falta != null ? { comissaoPct: prox.comissaoPct, faltaVendas: falta } : null,
      amostras: i.amostras
        .filter((a) => a.handle === c.handle && !a.encerrada)
        .map((a) => ({
          produto: a.produto,
          status: STATUS_AMOSTRA_LABEL[a.status] ?? a.status,
          dias: a.diasNaEtapa,
          alerta: a.alertas[0] ?? "",
        })),
      direitosAtivos: i.direitos.filter((d) => d.handle === c.handle && d.status === "ativo")
        .length,
      briefProduto: brief?.produto ?? "",
    };
  });
}
