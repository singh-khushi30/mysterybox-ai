import { supabase } from "../config/supabase.js";
import { ensureProfile } from "./profiles.js";
import { HttpError } from "../utils/http.js";

async function findUserByEmail(email: string) {
  const existing = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (existing.error) return null;
  return existing.data.users.find((user) => user.email?.toLowerCase() === email) ?? null;
}

async function finishRegistration(
  userId: string,
  email: string,
  displayName: string
) {
  try {
    await ensureProfile(userId, email, displayName);
  } catch {
    // Profile table may not be applied yet; the auth user still exists.
  }

  return { id: userId, email };
}

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

  if (!created.error && created.data.user) {
    return finishRegistration(created.data.user.id, input.email, input.displayName);
  }

  const message = created.error?.message ?? "";
  if (!/already registered|already exists|already been registered/i.test(message)) {
    throw new HttpError(400, "Sign up failed. Please try again.");
  }

  const leftover = await findUserByEmail(input.email);
  if (!leftover) {
    throw new HttpError(409, "This email is already registered. Try logging in.");
  }

  if (leftover.email_confirmed_at) {
    throw new HttpError(409, "This email is already registered. Try logging in.");
  }

  const confirmed = await supabase.auth.admin.updateUserById(leftover.id, {
    password: input.password,
    email_confirm: true,
    user_metadata: {
      ...leftover.user_metadata,
      display_name: input.displayName,
    },
  });
  if (confirmed.error || !confirmed.data.user) {
    throw new HttpError(409, "This email is already registered. Try logging in.");
  }

  return finishRegistration(leftover.id, input.email, input.displayName);
}
