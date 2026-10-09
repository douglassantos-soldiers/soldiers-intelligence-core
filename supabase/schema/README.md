# supabase/schema

Cópia de leitura do que existe no banco e não foi criado pelas migrations deste repositório (views centrais,
views materializadas de growth, funções, agendamentos do pg_cron) e das Edge Functions publicadas.

- Gerar: `scripts/exportar-schema.ps1` (com Docker) ou `exportar_definicoes.sql` no SQL editor (sem Docker).
- Serve para ler e revisar a lógica (LTV, P&L, colunas `sugestao`, coletores). **Não** é aplicado no banco:
  mudanças continuam entrando por `supabase/migrations/`.
- Nada de dados de cliente aqui: só estrutura. Tokens são trocados por `<REMOVIDO>` na exportação.
