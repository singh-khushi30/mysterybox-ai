import { supabase } from "../config/supabase.js";
import { ensureProfile } from "./profiles.js";
import { HttpError } from "../utils/http.js";

export async function registerAccount(input: {
  email: string;
  password: string;
  displayName: string;
}) {
  const created = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { display_name: input.displayName },
  });

  if (created.error || !created.data.user) {
    const message = created.error?.message ?? "";
    if (/already registered|already exists|already been registered/i.test(message)) {
      throw new HttpError(409, "This email is already registered. Try logging in.");
    }
    throw new HttpError(400, "Sign up failed. Please try again.");
  }

  try {
    await ensureProfile(created.data.user.id, input.email, input.displayName);
  } catch {
    // Profile table may not be applied yet; the auth user still exists.
  }

  return {
    id: created.data.user.id,
    email: created.data.user.email ?? input.email,
  };
}
