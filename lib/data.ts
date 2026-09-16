import { createClient } from "./supabase";
import { dateOfBirthError } from "./utils";
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

// ══════════════════════════════════════
//  PIN CODE / RTO LOOKUP
// ══════════════════════════════════════

export async function lookupPinCode(pinCode: string) {
  const { data, error } = await supabase
    .from("pin_rto_lookup")
    .select("city, state, rto_code")
    .eq("pin_code", pinCode)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function submitRegistration(regData: RegistrationData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Look up city/state/rto_code for the entered pin_code. Never hard-fail
  // registration over a bad/missing pin_code lookup — fall back to a
  // placeholder rto_code so referral_code generation can still proceed.
  const pinLookup = await lookupPinCode(regData.pin_code);
  if (!pinLookup) {
    console.warn(`submitRegistration: no pin_rto_lookup match for pin_code "${regData.pin_code}" — using fallback rto_code "XX"`);
  }
  const city = pinLookup?.city || regData.city;
  const state = pinLookup?.state || regData.state;
  const rtoCode = (pinLookup?.rto_code || "XX").toUpperCase();

  // Generate partner code and referral code
  const partnerCode = "VP-" + Math.floor(1000 + Math.random() * 9000);

  const firstNameInitials = (regData.full_name.split(" ")[0] || "").slice(0, 2).toUpperCase();

  // The form already blocks this; checked again here because a malformed date
  // would be stored on the partner and baked into their referral code.
  const dobProblem = regData.date_of_birth ? dateOfBirthError(regData.date_of_birth) : null;
  if (dobProblem) throw new Error(dobProblem);

  let dob = "0000";
  if (regData.date_of_birth) {
    const [, month, day] = regData.date_of_birth.split("-"); // YYYY-MM-DD from <input type="date">
    if (day && month) dob = day + month;
  } else {
    console.warn("submitRegistration: no date_of_birth provided — using fallback \"0000\" for referral_code");
  }

  const { data: serial, error: serialError } = await supabase.rpc("next_partner_serial");
  if (serialError) throw serialError;
  const serialNumber = String(serial).padStart(3, "0");

  const referralCode = firstNameInitials + dob + rtoCode + serialNumber;

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

  const hasBankDetails = !!((regData.bank_account_number && regData.bank_ifsc) || regData.upi_id);

  const { data: newPartner, error } = await supabase.from("partners").insert({
    auth_user_id: user.id,
    partner_code: partnerCode,
    name: regData.full_name,
    email: regData.email,
    phone: regData.mobile,
    whatsapp: regData.whatsapp,
    date_of_birth: regData.date_of_birth || null,
    pin_code: regData.pin_code,
    city,
    state,
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
  }).select("id").single();

  if (error) throw error;

  if (!hasBankDetails && newPartner) {
    const { error: notifError } = await supabase.from("notifications").insert({
      partner_id: newPartner.id,
      type: "account_setup",
      title: "Bank details pending",
      message: "Your bank account details are yet to be updated.",
    });
    if (notifError) console.error("Failed to create bank-details-pending notification:", notifError);
  }

  return { success: true };
}

// ══════════════════════════════════════
//  BANK DETAILS
// ══════════════════════════════════════

export async function getBankDetails(partnerId: string) {
  const { data, error } = await supabase
    .from("partners")
    .select("bank_account_name, bank_account_number, bank_ifsc, upi_id")
    .eq("id", partnerId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateBankDetails(partnerId: string, details: {
  bank_account_name?: string; bank_account_number?: string; bank_ifsc?: string; upi_id?: string;
}) {
  const { error } = await supabase
    .from("partners")
    .update({
      bank_account_name: details.bank_account_name || null,
      bank_account_number: details.bank_account_number || null,
      bank_ifsc: details.bank_ifsc || null,
      upi_id: details.upi_id || null,
    })
    .eq("id", partnerId);

  if (error) throw error;

  const hasBankDetails = !!((details.bank_account_number && details.bank_ifsc) || details.upi_id);
  if (hasBankDetails) {
    const { error: notifError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("partner_id", partnerId)
      .eq("type", "account_setup")
      .eq("is_read", false);
    if (notifError) console.error("Failed to clear bank-details-pending notification:", notifError);
  }
}

// ══════════════════════════════════════
//  PERSONAL DETAILS
// ══════════════════════════════════════
// Deliberately excludes email — changing it is tied to Supabase Auth identity
// and needs its own re-verification flow, not a plain profile field edit.

export async function updatePersonalDetails(partnerId: string, details: {
  phone?: string; whatsapp?: string; city?: string; instagram_id?: string;
}) {
  const { error } = await supabase
    .from("partners")
    .update({
      phone: details.phone || null,
      whatsapp: details.whatsapp || null,
      city: details.city || null,
      instagram_id: details.instagram_id || null,
    })
    .eq("id", partnerId);

  if (error) throw error;
}

// ══════════════════════════════════════
//  PROFILE PHOTO
// ══════════════════════════════════════

export async function uploadProfilePhoto(partnerId: string, file: File) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-photos")
    .upload(path, file, { upsert: true, cacheControl: "3600" });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from("profile-photos").getPublicUrl(path);
  // Cache-bust so a re-uploaded photo at the same path shows immediately, not a stale cached image.
  const photoUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("partners")
    .update({ profile_photo_url: photoUrl })
    .eq("id", partnerId);

  if (updateError) throw updateError;
  return photoUrl;
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

export async function markAllNotificationsRead(partnerId: string) {
  // 'account_setup' notifications are excluded on purpose — they should stay
  // unread until the underlying issue (e.g. missing bank details) is resolved,
  // not just because the notification panel was opened.
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("partner_id", partnerId)
    .eq("is_read", false)
    .neq("type", "account_setup");

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
