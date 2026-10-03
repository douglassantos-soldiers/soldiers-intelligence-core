// Middleware de cliente: manda o token da sessão do Supabase no cabeçalho Authorization das server functions
// que exigem login (requireSupabaseAuth). Sem sessão, não manda nada e o servidor recusa.
import { createMiddleware } from "@tanstack/react-start";

export const enviaToken = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return next(token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
});
