import { createClient } from "./supabase";

const supabase = createClient();

// ── Send OTP to email ──
export async function sendEmailOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw error;
  return { success: true };
}

// ── Verify OTP ──
export async function verifyEmailOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) throw error;
  return data;
}

// ── Sign in with password ──
export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

// ── Register new user (for partner registration) ──
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

// ── Get current session ──
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ── Get current user ──
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ── Sign out ──
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ── Listen for auth state changes ──
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
