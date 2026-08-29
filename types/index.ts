// ╔══════════════════════════════════════════════════════════════╗
// ║  VADORA PARTNERS — TYPE DEFINITIONS                        ║
// ║  All data shapes in one place for easy maintenance          ║
// ╚══════════════════════════════════════════════════════════════╝

// ── Registration ──
export type RegistrationStatus = "pending" | "approved" | "rejected";

export type SellingMethod = "instagram" | "whatsapp" | "personal_contacts" | "offline" | "other";

export interface RegistrationData {
  // Step 1
  full_name: string;
  mobile: string;
  whatsapp: string;
  email: string;
  city: string;
  // Step 2
  instagram_id?: string;
  selling_method?: SellingMethod;
  profile_photo_url?: string;
  // Step 3
  bank_account_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  upi_id?: string;
}

// ── Partner ──
export interface Partner {
  id: string;
  partner_code: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
  referral_code: string;
  avatar_initials: string;
  instagram_id?: string;
  selling_method?: SellingMethod;
  profile_photo_url?: string;
  tier_id: string;
  is_active: boolean;
  status: RegistrationStatus;
  joined_at: string;
}

// ── Partner Stats (from view) ──
export interface PartnerStats {
  partner_id: string;
  name: string;
  partner_code: string;
  referral_code: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
  avatar_initials: string;
  instagram_id?: string;
  joined_at: string;
  is_active: boolean;
  tier_name: string;
  tier_rate: number;
  tier_color: string;
  total_sales: number;
  total_commission: number;
  pending_commission: number;
  confirmed_commission: number;
  paid_commission: number;
  processing_commission: number;
  available_commission: number;
  total_orders: number;
  this_month_sales: number;
  this_month_orders: number;
  total_customers: number;
  new_customers_this_month: number;
  repeat_customers: number;
  next_tier_name?: string;
  next_tier_min_sales?: number;
  sales_to_next_tier?: number;
}

// ── Commission Tier ──
export interface CommissionTier {
  id: string;
  name: string;
  min_sales: number;
  max_sales: number | null;
  rate_percent: number;
  color: string;
  sort_order: number;
}

// ── Order ──
export type OrderStatus = "confirmed" | "packed" | "shipped" | "delivered" | "commission_eligible" | "cancelled" | "returned";

export interface ReferralOrder {
  id: string;
  partner_id: string;
  order_ref: string;
  customer_name: string;
  order_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: OrderStatus;
  order_date: string;
}

// ── Customer ──
export interface PartnerCustomer {
  customer_name: string;
  total_orders: number;
  total_purchase: number;
  last_order_date: string;
  is_repeat: boolean;
}

// ── Payout ──
export type PayoutStatus = "pending" | "processing" | "completed" | "failed";

export interface Payout {
  id: string;
  partner_id: string;
  amount: number;
  status: PayoutStatus;
  notes?: string;
  paid_at?: string;
  created_at: string;
}

// ── Monthly Earnings ──
export interface MonthlyEarning {
  partner_id: string;
  month: string;
  month_label: string;
  earnings: number;
}

// ── Leaderboard Entry ──
export interface LeaderboardEntry {
  partner_id: string;
  name: string;
  avatar_initials: string;
  tier_name: string;
  tier_color: string;
  total_sales: number;
  rank: number;
}

// ── Notification ──
export type NotificationType = "order" | "commission" | "payout" | "announcement" | "tier_upgrade";

export interface Notification {
  id: string;
  partner_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ── Navigation ──
export type TabId = "home" | "orders" | "customers" | "earnings" | "share" | "ranks" | "profile";
