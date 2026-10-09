# Exporta para o repositório o que hoje só existe no Supabase: o schema do banco (tabelas, views, views
# materializadas, funções, gatilhos) e o código das Edge Functions publicadas.
#
# Somente leitura no Supabase: nada é criado, alterado ou apagado no banco nem nas funções.
# Sem dados: o dump é só de estrutura (sem linhas de tabela, sem dados de cliente).
#
# Como rodar (PowerShell, na raiz do repositório):
#   1. Supabase CLI instalado e logado (supabase login) e projeto linkado (supabase link --project-ref <ref>).
#   2. Docker Desktop aberto: o "supabase db dump" usa o pg_dump de um container.
#      Sem Docker, use o plano B: supabase/schema/exportar_definicoes.sql no SQL editor.
#   3. .\scripts\exportar-schema.ps1
#   4. Confira o resultado com "git diff" ANTES de commitar (o script já tira tokens JWT e "Bearer ...", mas
#      revise se alguma função tem chave escrita no código).

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz

$destino = "supabase/schema"
New-Item -ItemType Directory -Force $destino | Out-Null

function Remove-Segredos([string]$arquivo) {
  if (-not (Test-Path $arquivo)) { return }
  $texto = Get-Content $arquivo -Raw
  # Tokens JWT (service role, anon), cabeçalhos Bearer e apikey com valor literal.
  $texto = $texto -replace 'eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+', '<JWT_REMOVIDO>'
  $texto = $texto -replace '(Bearer\s+)[A-Za-z0-9_\-\.]{16,}', '$1<TOKEN_REMOVIDO>'
  $texto = $texto -replace '("apikey"\s*[:,]\s*")[^"]{16,}', '$1<TOKEN_REMOVIDO>'
  Set-Content -Path $arquivo -Value $texto -NoNewline -Encoding utf8
}

Write-Host "1/3 Schema public (estrutura, sem dados)..."
supabase db dump --linked --schema public -f "$destino/public.sql"
Remove-Segredos "$destino/public.sql"

Write-Host "2/3 Agendamentos (pg_cron) e definições: rode supabase/schema/exportar_definicoes.sql no SQL editor"
Write-Host "    e salve o resultado em $destino/cron_jobs.csv (a consulta já tira tokens do comando)."

Write-Host "3/3 Edge Functions publicadas..."
$lista = $null
try {
  $lista = supabase functions list --output json | ConvertFrom-Json
} catch {
  Write-Warning "Não deu para listar as funções em JSON. Rode 'supabase functions list' e baixe cada uma com 'supabase functions download <nome>'."
}
if ($lista) {
  foreach ($f in $lista) {
    $nome = $f.slug
    if (-not $nome) { $nome = $f.name }
    if (-not $nome) { continue }
    if (Test-Path "supabase/functions/$nome") {
      Write-Host "    $nome já está no repositório: mantido (compare com 'supabase functions download $nome' se precisar)."
      continue
    }
    Write-Host "    baixando $nome"
    supabase functions download $nome
    Get-ChildItem "supabase/functions/$nome" -Recurse -File | ForEach-Object { Remove-Segredos $_.FullName }
  }
}

Write-Host ""
Write-Host "Pronto. Revise com 'git status' e 'git diff' antes de commitar."
