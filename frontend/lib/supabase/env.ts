export function supabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!value) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }
  return value;
}

export function supabasePublishableKey() {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!value) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }
  return value;
}
