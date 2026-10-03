# Fase 1 — Revisão: usar só o que já existe no Supabase

O plano da Fase 1 continua igual (telas, módulos, identidade visual, sem login). Muda só a parte de dados. Verifiquei o banco "Ads Soldiers" e ele já tem uma camada pronta de views e resumos para clientes, produtos, margem, afiliados e CRM. Por isso a Fase 1 **não cria nada no Supabase**: nenhuma tabela, view, função ou índice novo. O app só lê o que já existe. A proposta anterior de criar funções `sp_*` foi descartada.

## O que cada tela vai ler (tudo já existe)

| Tela | Fonte existente |
|---|---|
| Command Center: receita, pedidos, ROAS, TACoS, investimento | `vw_receita_consolidada`, `vw_receita_consolidada_dia` |
| Command Center: margem de contribuição (CMV, taxas, frete, imposto, ads) | `vw_pl_canal_dia`, `vw_pl_canal_mes` |
| Command Center: novos vs. recorrentes | `growth_novos_recorrentes(de, até)`, `mv_growth_mes` |
| Customer 360: lista, LTV, ritmo, risco, próxima recompra, ação sugerida | `mv_growth_cliente_perfil` |
| Customer 360: origem do cliente (canal, campanha, mídia de entrada) | `mv_growth_origem_cliente` |
| Customer 360: pedidos, itens e produtos do cliente | `vw_cliente_pedidos`, `vw_cliente_pedido_itens`, `vw_cliente_produtos` |
| Customer 360: indicadores gerais, multicanal, UF, frequência | `vw_cliente_kpis`, `vw_cliente_cruzamento`, `vw_cliente_uf`, `vw_cliente_frequencia` |
| Product 360: vendas, receita, ads, ROAS e TACoS por SKU, canal e dia | `mv_produto_dia` |
| Product 360: recompra, ciclo, retorno em 30/60/90 dias | `mv_growth_produto_ciclo` |
| Product 360: próximo produto comprado | `mv_growth_produto_proximo` |
| Product 360: custo e estoque | `dim_custo_sku`, `dim_shopify_produto`, estoques Amazon/ML/Shopee/TikTok |
| Orders | `fact_pedido_cliente` + `fact_pedido_item_cliente` (filtro por canal + data, usando o índice que já existe) |
| Media | `vw_receita_consolidada`, `vw_ads_funil_canal_dia`, `vw_ads_por_tipo_dia` |
| Affiliate | `vw_awin_dia`, `vw_awin_publisher_dia`, `mv_afiliado_canal_dia` |
| Commerce (Site/Shopify) | `vw_receita_consolidada` (canal Site), `mv_produto_dia`, `dim_shopify_produto` |
| Marketplace | `vw_receita_consolidada`, `vw_pl_canal_dia`, `mv_produto_dia` por canal; views `vw_aanun_*` e `vw_abb_resumo` da Amazon |
| CRM / Growth | `mv_growth_mes`, `mv_growth_rfm_segmento`, `mv_growth_acao_resumo`, `mv_growth_cohort_mes`, `mv_growth_ltv_canal`, `mv_growth_origem_canal`, `vw_cliente_recompra_canal` |

## Regras
- O app **só lê**: nada é gravado, alterado ou apagado.
- As views e os resumos continuam sendo atualizados pelas rotinas que já existem, como `atualiza_growth_mv` e `atualiza_materializados`. O app mostra a hora do último "gerado em".
- Se depois faltar alguma informação que nenhuma fonte cobre, eu aviso antes e mostro o que já existe de parecido. Só então proponho algo novo, sempre com a sua aprovação.

## Detalhes técnicos
- As leituras passam por funções no servidor com o cliente de servidor do Supabase, usando filtros, ordenação e paginação nas views. Muitas dessas tabelas não têm regras de leitura, e a chave nunca vai para o navegador.
- Listas grandes sempre usam paginação e filtros que aproveitam índices que já existem: `cliente_chave`, `(canal, data)`, `sku`. A busca de cliente por e-mail ou CPF usa as funções `email_hash` e `cpf_hash`, que já existem.
- O mapa "tela → fonte" fica registrado em `src/domain/sources.ts`, e a regra "reusar antes de criar" vai para o `AGENTS.md`.
