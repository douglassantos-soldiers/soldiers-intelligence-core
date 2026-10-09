// Datas no fuso da operação (Brasília). O servidor roda em UTC: "hoje" calculado com toISOString() vira o dia
// seguinte depois das 21h. Toda janela relativa a "agora" no servidor usa estas funções.

export const FUSO = "America/Sao_Paulo";

const FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Data de hoje em Brasília, AAAA-MM-DD. */
export function hojeSP(agora: Date = new Date()): string {
  return FMT.format(agora);
}

/** Soma (ou subtrai) dias de uma data AAAA-MM-DD, sem depender de fuso. */
export function somaDias(iso: string, dias: number): string {
  return new Date(Date.parse(iso + "T00:00:00Z") + dias * 86400000).toISOString().slice(0, 10);
}

/** Data de N dias atrás em Brasília (0 = hoje). */
export function diasAtrasSP(n: number, agora: Date = new Date()): string {
  return somaDias(hojeSP(agora), -n);
}
