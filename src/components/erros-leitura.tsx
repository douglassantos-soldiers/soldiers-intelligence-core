// Aviso padrão quando parte das leituras de uma tela falhou (o resto da tela usa o que carregou).
export function ErrosLeitura({
  erros,
  nomes = {},
}: {
  erros: Record<string, string>;
  nomes?: Record<string, string>;
}) {
  const k = Object.keys(erros);
  if (!k.length) return null;
  return (
    <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
      Não foi possível ler: {k.map((x) => nomes[x] ?? x).join(", ")}. O resto da tela usa o que
      carregou. Ver Data Health.
    </div>
  );
}
