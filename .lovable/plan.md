# Soldiers Platform — Fase 1: Fundação (Shell + Customer/Product/Order 360)

Objetivo desta fase: construir a casca da plataforma, com os módulos separados e as visões 360 sobre um modelo de dados único. Intelligence e AI ficam para depois, como você propôs.

## Aviso importante
O Lovable Cloud está desativado para sua conta. Sem ele não dá para guardar dados de verdade, ter login nem ligar Shopify, Amazon e outros canais. Nesta fase, as telas usam **dados de exemplo realistas** (pedidos, clientes e SKUs da Soldiers), organizados exatamente no modelo final. Para ligar os dados reais: Connectors -> Lovable Cloud -> Tool Permissions -> "Enable Lovable Cloud" em "Always allow" ou "Ask each time".

## O que será construído

```text
Barra lateral
  Visão Geral (Command Center)
  Customer 360   Product 360   Orders
  ── Canais ──
  Media | Affiliate | Commerce | Marketplace | CRM/Growth
  ── Em breve ──
  Intelligence | Attribution | Profit | AI
```

1. **Command Center**: receita, margem de contribuição, pedidos, novos clientes vs. recompra, divisão por canal (Shopify, Amazon, Mercado Livre, Shopee, TikTok Shop).
2. **Customer 360**: lista com filtros (canal de aquisição, LTV, risco de churn). Ficha do cliente: como chegou, o que comprou, gasto, margem deixada, próxima recompra prevista, risco de churn, afinidade de produtos e linha do tempo de pedidos.
3. **Product 360**: lista de SKUs. Ficha do produto: vendas, margem, estoque, vendas por canal, peso de mídia vs. afiliado, taxa de recompra, LTV dos compradores, contribuição.
4. **Orders**: pedidos unificados de todos os canais, com origem (Ads, afiliado, orgânico), custo e margem por pedido.
5. **Módulos de canal** (Media, Affiliate, Commerce, Marketplace, CRM): cada um com página própria e indicadores principais do canal, todos lendo o mesmo modelo de dados. Affiliate já mostra o funil Discovery -> Sample -> Content -> Sales -> Commission -> ROI.
6. **Intelligence / Attribution / Profit / AI**: páginas de "em breve" descrevendo o roadmap.

## Direção visual
Painel operacional escuro e sóbrio (estilo militar/tático para combinar com "Soldiers"): fundo grafite, destaque verde-oliva/âmbar, títulos em fonte condensada forte, números em fonte mono. Denso em dados, sem gradientes roxos.

## Detalhes técnicos
- Rotas TanStack separadas para cada área (`/customers`, `/customers/$id`, `/products`, `/products/$id`, `/orders`, `/media`, `/affiliate`, `/commerce`, `/marketplace`, `/crm`, + placeholders), layout com sidebar em `__root`.
- Modelo canônico tipado em `src/domain/` (Customer, Product/SKU, Order, OrderLine, Channel, Attribution, Cost), com geradores de dados de exemplo determinísticos e funções de métricas derivadas (LTV, margem, recompra, churn) separadas da UI. Assim a troca pelo backend real afeta só a camada de dados.
- Gráficos com Recharts; tokens de cor em `styles.css`.
- Registrar no `AGENTS.md` a regra: módulos de canal só leem o modelo canônico, nunca dados brutos de canal.

## Próximas fases (fora deste plano)
2. Data Core real (Cloud + adapters Shopify/marketplaces/ads). 3. Intelligence (anomalias, oportunidades). 4. AI com aprovação e auditoria.
