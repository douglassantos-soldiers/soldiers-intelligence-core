# Soldiers Platform — Fase 1: Fundação (Shell + Customer/Product/Order 360)

Objetivo: construir a casca da plataforma, com módulos separados e visões 360, lendo os **dados reais** que já existem no Supabase "Ads Soldiers". Nada de dados de exemplo e nenhuma tabela existente é alterada. Intelligence e AI ficam para as próximas fases.

## Dados que serão usados (confirmados no banco)
- Pedidos de todos os canais: `fact_pedido_cliente` (canal, cliente, valor, desconto, frete, status, UF/cidade).
- Itens dos pedidos: `fact_pedido_item_cliente` (SKU, produto, categoria, quantidade, preço, taxa do canal).
- Custo por SKU: `dim_custo_sku`, usado para calcular a margem.
- Resumo diário por canal: `fact_receita_diaria` (receita, pedidos, investimento em Ads e em afiliados).
- Identidade do cliente: `cliente_chave` (une e-mail e documento entre os canais).
- Para os módulos: tabelas de Meta, Google, Amazon, Shopee, TikTok, Mercado Livre e Awin que já existem.

## O que será construído

```text
Barra lateral
  Command Center
  Customer 360   Product 360   Orders
  ── Canais ──
  Media | Affiliate | Commerce | Marketplace | CRM/Growth
  ── Em breve ──
  Intelligence | Attribution | Profit | AI
```

1. **Login**: entrar com e-mail/senha do Supabase. Os dados de clientes têm nome, CPF e endereço, então só usuários com papel em `app_papel` terão acesso.
2. **Command Center**: receita, pedidos, ticket médio, margem de contribuição, investimento (Ads + afiliados), ROAS, clientes novos vs. recorrentes e divisão por canal, com filtro de período.
3. **Customer 360**: lista com busca e filtros (canal, LTV, dias desde a última compra). Ficha do cliente: canais onde compra, linha do tempo de pedidos, total gasto, margem gerada, intervalo médio entre compras, próxima recompra estimada, risco de churn (pelo atraso em relação ao próprio ritmo) e produtos favoritos. CPF e telefone aparecem mascarados.
4. **Product 360**: ranking de SKUs. Ficha do produto: vendas, receita e margem por canal ao longo do tempo, recompra e LTV de quem comprou.
5. **Orders**: pedidos de todos os canais, com filtros e detalhe dos itens, custo e margem.
6. **Módulos de canal**: uma página para cada módulo com os indicadores principais, lendo as tabelas que já existem.
   - Media: investimento, ROAS e evolução por plataforma.
   - Affiliate: Awin e investimento em afiliados.
   - Commerce: Shopify/site.
   - Marketplace: Amazon, Mercado Livre, Shopee e TikTok Shop.
   - CRM: novos vs. recorrentes e base de clientes.
7. **Em breve**: páginas curtas explicando o roadmap das próximas fases.

## Direção visual (referências: soldiersnutrition.com.br + tela do Growth OS enviada)
A identidade segue o site da Soldiers e a tela "Soldiers Growth OS" que você mandou:
- **Cores**: fundo preto e quase preto (#000 / #121212), painéis em grafite (#202223), textos em branco e cinza. O destaque é o **amarelo Soldiers (#F6C800)**: aba ativa, item ativo do menu, status e botões principais. Verde (#00A650) indica alta e coisas positivas, laranja (#E69138) indica alertas.
- **Logo**: quadrado amarelo com "S" + "SOLDIERS" em caixa alta, com o subtítulo "PLATFORM" em amarelo, no mesmo estilo do "GROWTH OS".
- **Tipografia**: títulos de página em fonte condensada, grossa e em caixa alta (como "META ADS"). Textos em Poppins, a fonte do site. IDs e números em fonte mono.
- **Layout**: o mesmo da sua tela.
  - Menu lateral escuro com grupos em caixa alta (Aquisição, Clientes…) e um ponto amarelo nos canais.
  - Abas em formato de pílula, com a ativa em amarelo.
  - Barra de busca e filtros acima de tabelas densas.
  - Etiquetas de status com contorno amarelo e botões de exportar CSV.
- Botão para alternar entre tema escuro e claro, como o ícone de sol da sua tela. Escuro é o padrão.
- Fotos de produto aparecem nas listas quando a tabela de produtos tiver imagem.

## Detalhes técnicos
- Todas as leituras passam por funções no servidor que exigem login e conferem o papel em `app_papel`. Depois disso, elas consultam com acesso de servidor, porque várias tabelas não têm regras de leitura. O navegador nunca acessa essas tabelas direto.
- As agregações (LTV, recompra, margem) rodam em SQL no servidor, com limites e paginação. Assim não esbarramos no limite de 1000 linhas.
- As agregações pesadas usam views novas, criadas com prefixo `sp_`. Isso é só adição: nada do que existe é apagado ou alterado.
- Rotas separadas para cada área, protegidas por login, com uma barra lateral comum.
- Uma camada de modelo canônico em `src/domain/` (Customer, Product, Order, Channel) isola as telas das tabelas brutas de cada canal. A regra vai para o `AGENTS.md`.
- Gráficos com Recharts. Cores definidas como tokens do tema.

## Próximas fases (fora deste plano)
2. Data Core: tabelas canônicas, identidade e atribuição. 3. Intelligence: anomalias e oportunidades. 4. AI com aprovação e auditoria.
