import { createBrowserSupabase } from "@/lib/supabase/client";

export async function getAccessToken() {
  if (typeof window === "undefined") return null;
  try {
    const supabase = createBrowserSupabase();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}
