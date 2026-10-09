// Ponto único de importação das leituras do app (as telas importam daqui).
// O código fica dividido por módulo: core360, media, marketplace, affiliate, crm, saude e alertas (.functions.ts).
export {
  getOverview,
  getClientes,
  getClienteResumo,
  getCliente,
  getProdutos,
  getProduto,
  getPedidos,
  getPedido,
  getMetasMes,
} from "@/lib/core360.functions";
export { getMedia, getGoogle, getMeta } from "@/lib/media.functions";
export { getAffiliate, getAffiliateHoje } from "@/lib/affiliate.functions";
export { getCrm, getCrmAcao } from "@/lib/crm.functions";
export {
  getMarketplaceSaude,
  getTikTokEconomia,
  getAmazon,
  getMercadoLivre,
  getShopee,
} from "@/lib/marketplace.functions";
export { getDataHealth } from "@/lib/saude.functions";
export { getAlertas } from "@/lib/alertas.functions";
