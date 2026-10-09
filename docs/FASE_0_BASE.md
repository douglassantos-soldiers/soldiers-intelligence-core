# Fase 0 — Base de entrega

Objetivo: um repositório que é a verdade, aplicado no banco, com a lógica que hoje mora só no Supabase versionada.
Plano completo: `claude/PLANO_IMPLEMENTACAO_SOLDIERS_PLATFORM.md` (projeto Commerce).

## O que mudou no código

| Item | Onde | Por quê |
|---|---|---|
| Main sincronizada | commit "Sincroniza a main com o branch fase-0-5-hardening" | A main do GitHub (c21fafa) recebeu as entregas por patch e ficou sem Cruva 1–3, filtro de período, Amazon SB/SD unificado e DSP. Mantém o que só existia na main (migrations já aplicadas no banco, `types.ts`, `package-lock.json`, ajustes de teste). |
| Leitura paginada com ordem estável | `src/lib/db-helpers.ts` (`fetchAll`) | Paginar sem ORDER BY pode repetir ou pular linhas. Agora toda leitura paginada ordena por todas as colunas selecionadas (depois da ordem já pedida). |
| Aviso de leitura cortada | `fetchAll` + Data Health › "Leituras cortadas pelo limite" | Quando a leitura chega no teto, fica registrado (antes era silencioso). |
| Leituras presas em 1.000 linhas | custos, ciclos, estoque do site, cohort do CRM, influenciadores, produtos e custos do TikTok | Passaram a ser paginadas. |
| "Hoje" em Brasília | `src/lib/datas.ts` (`hojeSP`, `diasAtrasSP`) | O servidor roda em UTC: depois das 21h, "hoje" virava o dia seguinte. |
| `data.functions.ts` dividido | `core360`, `media`, `marketplace`, `affiliate`, `crm`, `saude`, `alertas` (`.functions.ts`) | 967 linhas num arquivo só. As telas continuam importando de `data.functions.ts`, que reexporta tudo; nenhuma regra mudou. |
| Exportar o schema do banco | `scripts/exportar-schema.ps1` e `supabase/schema/exportar_definicoes.sql` | Views, views materializadas, funções, agendamentos e Edge Functions passam a ficar no repositório. |
| Conferência do banco | `supabase/verificacao/fase0.sql` | Migration aplicada ou pendente, objetos existentes, views materializadas preenchidas, agendamentos com falha. |

## Passo a passo no seu computador (PowerShell, na pasta do projeto)

### 1. Aplicar os commits

```powershell
git status                      # precisa estar limpo; se não, "git stash"
git checkout main
git pull                        # main local = origin/main (c21fafa)
git am fase-0-sync.patch        # commit 1: sincroniza a main
git am fase-0-base.patch        # commit 2: Fase 0
npx vitest run                  # 260 testes
git push origin main
```

Se preferir um arquivo só, `git am fase-0.patch` aplica os dois commits.

Depois de conferir, os branches `feature/cruva-ondas-1-2-3` e `feature/amazon-segunda-leva` já estão contidos na main e podem ser apagados. O stash antigo (`wip-cruva-antes-amazon-segunda-leva`) também ficou superado.

### 2. Conferir o banco (só leitura)

Rodar `supabase/verificacao/fase0.sql` no SQL editor, bloco por bloco. O bloco 1 mostra as migrations pendentes; o bloco 2 mostra se os objetos existem de verdade (uma migration marcada com `repair` pode não ter rodado).

### 3. Aplicar as migrations pendentes

Esperado como pendente: `20261006140000`, `20261006150000`, `20261006160000`, `20261007130000` e, se o bloco 1 indicar, `20261007120000`.

```powershell
supabase db push --dry-run --include-all   # mostra o que vai rodar, sem aplicar
supabase db push --include-all             # aplica em ordem
```

`--include-all` é necessário porque algumas pendentes têm data anterior à `20261006170000`, que já está aplicada.

A `20261007120000` recria `mv_criativo_cliente` e `mv_cupom_cliente_qualidade` com join rápido. A carga inicial é manual (instruções no fim do arquivo) e deve ser feita fora do horário de uso.

Depois, rodar de novo o bloco 1 e o 3 da verificação: tudo "aplicada" e as views materializadas preenchidas.

### 4. Versionar o que vive no banco

```powershell
.\scripts\exportar-schema.ps1
```

- Precisa do Supabase CLI logado e linkado e do Docker Desktop aberto.
- Sem Docker: rodar `supabase/schema/exportar_definicoes.sql` no SQL editor e salvar os quatro resultados em CSV em `supabase/schema/`.
- Os agendamentos do pg_cron saem sempre pelo SQL (consulta 4), com tokens trocados por `<REMOVIDO>`.
- Antes de commitar: `git diff` para conferir que nenhuma chave ficou no texto.

```powershell
git add supabase/schema supabase/functions
git commit -m "Schema do banco e Edge Functions versionados (Fase 0)"
git push origin main
```

## Pronto quando

- `main` local = `origin/main`, com os dois commits.
- Bloco 1 da verificação sem "PENDENTE"; views materializadas preenchidas.
- `supabase/schema/` com o dump (ou os CSVs) e as Edge Functions no repositório.
- Data Health mostra o painel "Leituras cortadas pelo limite".
