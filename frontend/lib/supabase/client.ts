import { createBrowserClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";

export function createBrowserSupabase() {
  return createBrowserClient(supabaseUrl(), supabasePublishableKey());
}
