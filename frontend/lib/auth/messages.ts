export function authErrorMessage(error: { message?: string } | null | undefined, fallback: string) {
  const message = error?.message ?? "";
  if (/already registered|already been registered|User already/i.test(message)) {
    return "This email is already registered. Try logging in.";
  }
  if (/invalid login credentials|invalid email or password/i.test(message)) {
    return "Wrong email or password.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Please confirm your email, then log in.";
  }
  if (/password/i.test(message) && /least|short|weak/i.test(message)) {
    return "Password must be at least 6 characters.";
  }
  if (/invalid.*email/i.test(message)) {
    return "Please enter a valid email address.";
  }
  if (/rate limit|over_email_send_rate_limit/i.test(message)) {
    return "Too many signup attempts. Wait a minute, then try again.";
  }
  if (!message) return fallback;
  return fallback;
}
