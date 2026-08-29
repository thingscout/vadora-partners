import { createClient } from "./supabase";
import type { RegistrationData } from "@/types";

const supabase = createClient();

// ══════════════════════════════════════
//  PARTNER PROFILE
// ══════════════════════════════════════

export async function getPartnerProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Try by auth_user_id first
  const { data } = await supabase
    .from("partner_stats")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (data) return data;

  // Fallback: find by email and link
  const { data: partnerByEmail } = await supabase
    .from("partners")
    .select("id")
    .eq("email", user.email)
    .single();

  if (partnerByEmail) {
    await supabase
      .from("partners")
      .update({ auth_user_id: user.id })
      .eq("id", partnerByEmail.id);

    const { data: retryData } = await supabase
      .from("partner_stats")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    return retryData;
  }

  return null;
}

// Check partner registration status
export async function getPartnerStatus() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("partners")
    .select("id, status, is_active, name")
    .eq("auth_user_id", user.id)
    .single();

  if (data) return data;

  // Fallback by email
  const { data: byEmail } = await supabase
    .from("partners")
    .select("id, status, is_active, name")
    .eq("email", user.email)
    .single();

  return byEmail;
}

// ══════════════════════════════════════
//  REGISTRATION
// ══════════════════════════════════════

export async function submitRegistration(regData: RegistrationData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Generate partner code and referral code
  const partnerCode = "VP-" + Math.floor(1000 + Math.random() * 9000);
  const referralCode = regData.full_name
    .split(" ")[0]
    .toUpperCase()
    .slice(0, 8) + Math.floor(10 + Math.random() * 90);

  const initials = regData.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Get Bronze tier as default
  const { data: bronzeTier } = await supabase
    .from("commission_tiers")
    .select("id")
    .eq("name", "Bronze")
    .single();

  const { error } = await supabase.from("partners").insert({
    auth_user_id: user.id,
    partner_code: partnerCode,
    name: regData.full_name,
    email: regData.email,
    phone: regData.mobile,
    whatsapp: regData.whatsapp,
    city: regData.city,
    referral_code: referralCode,
    avatar_initials: initials,
    instagram_id: regData.instagram_id || null,
    selling_method: regData.selling_method || null,
    profile_photo_url: regData.profile_photo_url || null,
    bank_account_name: regData.bank_account_name || null,
    bank_account_number: regData.bank_account_number || null,
    bank_ifsc: regData.bank_ifsc || null,
    upi_id: regData.upi_id || null,
    tier_id: bronzeTier?.id || null,
    status: "pending",
    is_active: false,
  });

  if (error) throw error;
  return { success: true };
}

// ══════════════════════════════════════
//  ORDERS
// ══════════════════════════════════════

export async function getPartnerOrders(partnerId: string, status?: string) {
  let query = supabase
    .from("referral_orders")
    .select("*")
    .eq("partner_id", partnerId)
    .order("order_date", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ══════════════════════════════════════
//  CUSTOMERS
// ══════════════════════════════════════

export async function getPartnerCustomers(partnerId: string) {
  const { data, error } = await supabase
    .from("partner_customers")
    .select("*")
    .eq("partner_id", partnerId)
    .order("last_order_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

// ══════════════════════════════════════
//  EARNINGS & PAYOUTS
// ══════════════════════════════════════

export async function getMonthlyEarnings(partnerId: string) {
  const { data, error } = await supabase
    .from("monthly_earnings")
    .select("*")
    .eq("partner_id", partnerId)
    .order("month", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getPayoutHistory(partnerId: string) {
  const { data, error } = await supabase
    .from("payouts")
    .select("*")
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// ══════════════════════════════════════
//  LEADERBOARD
// ══════════════════════════════════════

export async function getLeaderboard() {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("rank", { ascending: true })
    .limit(20);

  if (error) throw error;
  return data || [];
}

// ══════════════════════════════════════
//  TIERS
// ══════════════════════════════════════

export async function getTiers() {
  const { data, error } = await supabase
    .from("commission_tiers")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data || [];
}

// ══════════════════════════════════════
//  NOTIFICATIONS
// ══════════════════════════════════════

export async function getNotifications(partnerId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return data || [];
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) throw error;
}

export async function getUnreadCount(partnerId: string) {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("partner_id", partnerId)
    .eq("is_read", false);

  if (error) return 0;
  return count || 0;
}
