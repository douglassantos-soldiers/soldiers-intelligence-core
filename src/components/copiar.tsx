import { useState } from "react";

/** Copia um texto para a área de transferência (mensagem sugerida, brief). Não envia nada a ninguém. */
export function CopiarTexto({ texto, rotulo = "Copiar" }: { texto: string; rotulo?: string }) {
  const [ok, setOk] = useState<boolean | null>(null);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setOk(true);
    } catch {
      setOk(false);
    }
    setTimeout(() => setOk(null), 2000);
  };
  return (
    <button
      type="button"
      onClick={copiar}
      title={texto}
      className="whitespace-nowrap rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted"
    >
      {ok === true ? "Copiado" : ok === false ? "Não copiou" : rotulo}
    </button>
  );
}
