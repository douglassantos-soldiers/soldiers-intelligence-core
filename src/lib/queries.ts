import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getOverview, getProdutos } from "@/lib/data.functions";
import { periodo } from "@/lib/format";

export function useOverview(dias: string) {
  const fn = useServerFn(getOverview);
  const p = periodo(dias);
  return useQuery({ queryKey: ["overview", p], queryFn: () => fn({ data: p }) });
}

export function useProdutos(dias: string, canal?: string) {
  const fn = useServerFn(getProdutos);
  const p = periodo(dias);
  return useQuery({ queryKey: ["produtos", p, canal ?? ""], queryFn: () => fn({ data: { ...p, canal } }) });
}
