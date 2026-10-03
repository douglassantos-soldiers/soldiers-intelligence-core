# Soldiers Intelligence Core

O objetivo do novo projeto é ser o sistema operacional de performance e crescimento da Soldiers.

Não é simplesmente um novo dashboard e nem uma cópia do projeto atual.

Em uma frase

A Soldiers Platform deve transformar os dados de todos os canais da Soldiers em uma camada única de inteligência, permitindo entender o negócio, encontrar oportunidades e, progressivamente, recomendar e executar ações.

                 SOLDIERS PLATFORM

                       │

       ┌───────────────┼────────────────┐

       │               │                │

     MEDIA          AFFILIATE        COMMERCE

       │               │                │

       └───────────────┼────────────────┘

                       │

                CUSTOMER / ORDER

                       │

          ┌────────────┼────────────┐

          │            │            │

       PRODUCT      MARKETPLACE    CRM

          │            │            │

          └────────────┼────────────┘

                       │

                  INTELLIGENCE

                       │

          ┌────────────┼────────────┐

          │            │            │

      ATTRIBUTION     PROFIT       GROWTH

          │            │            │

          └────────────┼────────────┘

                       │

                       AI

Os 6 grandes objetivos

1. Unificar os dados

Criar uma visão única de:

Cliente + Produto + Pedido + Canal + Custo + Margem + Atribuição.

2. Entender o cliente

Criar o Customer 360:

 quem comprou;

 como chegou;

 o que comprou;

 quanto gastou;

 quanto deixou de margem;

 quando deve recomprar;

 risco de churn;

 LTV;

 afinidade com produtos.

3. Entender o produto

Criar o Product 360:

 vendas;

 margem;

 estoque;

 mídia;

 afiliados;

 marketplaces;

 recompra;

 LTV;

 contribuição.

4. Entender os canais

Aqui entram os módulos separados:

Media

Affiliate

Commerce

Marketplace

CRM/Growth

Cada um com sua operação, mas todos alimentados pelo mesmo Data Core.

5. Transformar dados em decisões

Essa é provavelmente a parte mais importante.

A plataforma deve identificar:

 problemas;

 oportunidades;

 anomalias;

 crescimento;

 perda de margem;

 produtos com potencial;

 clientes em risco;

 creators com potencial;

 campanhas que merecem atenção.

Ou seja:

Dashboard → Intelligence.

Portanto, eu definiria o objetivo oficial assim:

Construir a plataforma central de inteligência e operação da Soldiers Nutrition, unificando Commerce, Media, Affiliate, Marketplaces, CRM e dados de clientes/produtos em uma arquitetura única, capaz de transformar dados em insights, recomendações e, progressivamente, ações automatizadas com controle, aprovação e auditoria.

E eu não tentaria fazer tudo de uma vez. O primeiro objetivo do novo projeto deveria ser construir corretamente a fundação de dados + Customer/Product/Order 360. Depois colocamos Intelligence e, por último, AI/automação.

Para a Soldiers Platform, eu não usaria uma única plataforma como benchmark. Eu montaria um “benchmark composto”, porque o que estamos criando mistura Commerce, Media, Affiliate, CRM, BI e AI.

Eu usaria estas como referências:

ÁreaPlataforma para estudarO que pegar como referênciaCommerce / OMSShopifyProduto, pedido, catálogo, extensibilidade, UXCRM / Customer 360SalesforceCustomer 360, objetos, journeys, automaçõesCRM / RetentionKlaviyoSegmentação, flows, eventos, lifecycle, LTVCDP / DataSegmentIdentity, eventos, tracking e unificaçãoMarketing IntelligenceTriple WhaleDashboard, atribuição, profit, análise de e-commerceMedia IntelligenceNorthbeamAttribution, CAC, LTV, incrementalityAffiliateImpactPartners, tracking, comissão, relacionamentoAffiliate / CreatorGRINCreator lifecycle, campaigns, samples, contentCreator/Affiliate DiscoveryAspireDiscovery, relacionamento e campanhasMarketplace IntelligenceJungle ScoutAmazon intelligence, produtos, concorrênciaAmazon Seller IntelligenceHelium 10SKU, keyword, marketplace analyticsBI / AnalyticsLookerData modeling e exploraçãoBI / Self-servicePower BIDashboards, métricas e análise empresarialAutomationZapierConceito de workflow e automaçãoAI AgentsSalesforce AgentforceAgentes integrados a dados e workflowsAI / DataDatabricksLakehouse, AI, data + intelligenceProduct IntelligenceAmplitudeEvents, cohorts, behavioral analytics

Mas eu faria uma distinção importante:

Não devemos copiar nenhuma delas

A pergunta não deveria ser:

"Qual plataforma vamos copiar?"

E sim:

"Qual é a melhor referência para cada parte da Soldiers Platform?"

Porque a nossa proposta é justamente juntar capacidades que normalmente estão espalhadas.

Para o CRM/Growth, eu estudaria muito a combinação:

Salesforce + Klaviyo + Segment

Porque cada uma resolve uma parte diferente:

Salesforce → modelo de cliente e processos

Klaviyo → comportamento + segmentação + lifecycle

Segment → eventos + identidade + dados

Na Soldiers, isso poderia virar:

Customer 360 + Event Engine + Lifecycle Engine + Next Best Action.

Para Affiliate

Aqui eu estudaria principalmente:

Impact + GRIN + Aspire

Porque nosso Affiliate OS não deve ser simplesmente:

"lista de afiliados + comissão".

Precisamos ter:

Discovery

↓

Qualification

↓

Outreach

↓

Sample

↓

Content

↓

Sales

↓

Commission

↓

ROI

↓

LTV

↓

Reactivation

Para Media

Eu estudaria:

Northbeam + Triple Whale

Mas acrescentaria algo que eles não necessariamente resolvem da mesma forma:
Media

   ↓

Customer

   ↓

First Purchase

   ↓

Repeat Purchase

   ↓

LTV

   ↓

Contribution

Para Marketplace

Aqui eu faria uma combinação:

Jungle Scout + Helium 10 + Seller Central

Mas o objetivo não seria copiar dashboards.

Seria entender:

 SKU intelligence

 pricing

 inventory

 ranking

 Buy Box

 reviews

 ads

 marketplace economics

E depois conectar isso ao nosso Product Intelligence + Profit Engine.

E eu acrescentaria uma referência diferente para a arquitetura

Para a parte de AI/Data, eu estudaria:

Databricks + Salesforce Agentforce + MCP

Porque nossa ambição não é somente colocar um chatbot.

Queremos chegar a:
Dados

 ↓

Contexto

 ↓

Raciocínio

 ↓

Recomendação

 ↓

Policy

 ↓

Approval

 ↓

Execution

 ↓

Feedback

 ↓

Learning

Se eu tivesse que escolher apenas 10 referências para estudar profundamente

Eu escolheria:

Shopify → Commerce

Salesforce → CRM / Customer 360

Klaviyo → CRM / Retention

Segment → Data / Identity

Northbeam → Attribution / Media

Triple Whale → Commerce Intelligence

Impact → Affiliate

GRIN → Creator/Affiliate

Amplitude → Behavioral Intelligence

Databricks → Data + AI

E depois adicionaria Amazon Seller Central / Jungle Scout / Helium 10 especificamente para a parte de Marketplace.

O mais interessante é que o plano da Soldiers que acabamos de montar pode ser desenhado como uma combinação dessas referências, mas com uma arquitetura única por baixo. Isso pode deixar o produto muito mais coerente do que tentar construir cada módulo como um SaaS isolado.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/78e764e8-bb43-46e8-b8df-9d32671aae7d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
