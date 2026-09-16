-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  VADORA PARTNERS — DATABASE SCHEMA                             ║
-- ║  Run this in Supabase SQL Editor for EACH project               ║
-- ║  (dev and production)                                           ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ── 1. COMMISSION TIERS ──
CREATE TABLE commission_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,          -- Bronze, Silver, Gold
  min_sales NUMERIC DEFAULT 0,
  max_sales NUMERIC,                  -- NULL for top tier (no cap)
  rate_percent NUMERIC NOT NULL,      -- 8, 12, 15
  color TEXT DEFAULT '#C9A84C',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default tiers
INSERT INTO commission_tiers (name, min_sales, max_sales, rate_percent, color, sort_order) VALUES
  ('Bronze', 0,     19999,  8,  '#B87D5E', 1),
  ('Silver', 20000, 39999,  12, '#9EAAB0', 2),
  ('Gold',   40000, NULL,   15, '#C9A84C', 3);


-- ── 2. PARTNERS ──
CREATE TABLE partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id),  -- links to Supabase Auth
  partner_code TEXT NOT NULL UNIQUE,              -- VP-1234
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  city TEXT,
  referral_code TEXT NOT NULL UNIQUE,            -- discount code (= Shopify code)
  avatar_initials TEXT DEFAULT 'VP',
  instagram_id TEXT,
  selling_method TEXT,
  profile_photo_url TEXT,
  -- Bank / payout details
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  upi_id TEXT,
  -- Status & tier
  tier_id UUID REFERENCES commission_tiers(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_active BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_partners_auth ON partners(auth_user_id);
CREATE INDEX idx_partners_email ON partners(email);
CREATE INDEX idx_partners_code ON partners(referral_code);

-- Collected at registration alongside city (now auto-filled from pin_rto_lookup)
ALTER TABLE partners ADD COLUMN date_of_birth DATE;
ALTER TABLE partners ADD COLUMN pin_code TEXT;
ALTER TABLE partners ADD COLUMN state TEXT;

-- Global, atomic serial number for referral_code generation (e.g. SH1905UP001).
-- A plain "count(*) + 1" would race under concurrent registrations and collide
-- against referral_code's UNIQUE constraint — a sequence guarantees each call
-- gets a distinct, increasing value even with simultaneous sign-ups.
CREATE SEQUENCE partner_serial_seq START 1;

CREATE OR REPLACE FUNCTION next_partner_serial()
RETURNS INT
LANGUAGE sql
AS $$
  SELECT nextval('partner_serial_seq')::INT;
$$;


-- ── 3. REFERRAL ORDERS ──
CREATE TABLE referral_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES partners(id) NOT NULL,
  order_ref TEXT NOT NULL,                       -- Shopify order number
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  order_amount NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 0,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'confirmed'
    CHECK (status IN ('confirmed','packed','shipped','delivered','commission_eligible','cancelled','returned')),
  order_date TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_orders_partner ON referral_orders(partner_id);
CREATE INDEX idx_orders_status ON referral_orders(status);


-- ── 4. PAYOUTS ──
CREATE TABLE payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES partners(id) NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payouts_partner ON payouts(partner_id);

ALTER TABLE referral_orders ADD COLUMN payout_id UUID REFERENCES payouts(id);
CREATE INDEX idx_orders_payout ON referral_orders(payout_id);


-- ── Monthly Tier History ──
-- Written by app/api/cron/finalize-bucket/route.ts when a bucket freezes.
-- Was never added here even though it already existed directly in the dev
-- database (created manually, predating schema.sql tracking it) — prod is
-- missing it entirely.
CREATE TABLE monthly_tier_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES partners(id) NOT NULL,
  bucket_month DATE NOT NULL,
  bucket_sales_gst_exclusive NUMERIC NOT NULL DEFAULT 0,
  tier_id UUID REFERENCES commission_tiers(id) NOT NULL,
  tier_name TEXT NOT NULL,
  tier_rate_percent NUMERIC NOT NULL,
  is_frozen BOOLEAN DEFAULT FALSE,
  frozen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(partner_id, bucket_month)
);
CREATE INDEX idx_tier_history_partner ON monthly_tier_history(partner_id);
ALTER TABLE monthly_tier_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tier history: read own" ON monthly_tier_history
  FOR SELECT USING (partner_id IN (SELECT id FROM partners WHERE auth_user_id = auth.uid()));


-- ── 5. NOTIFICATIONS ──
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES partners(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('order','commission','payout','announcement','tier_upgrade')),
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notif_partner ON notifications(partner_id);
CREATE INDEX idx_notif_unread ON notifications(partner_id, is_read) WHERE is_read = FALSE;

-- 'account_setup' notifications (e.g. "bank details pending") are deliberately
-- excluded from the generic "mark all read on open" action — they only clear
-- when the underlying issue (missing bank details) is actually resolved.
ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('order','commission','payout','announcement','tier_upgrade','account_setup'));


-- ── 6. PIN CODE / RTO LOOKUP ──
-- Reference data imported from data/PIN_Code_updated.csv via scripts/import-pin-rto.js.
-- The source CSV has duplicate pin_code rows (multiple city/RTO entries per pin code
-- area) — the import script dedupes those client-side (last row wins) before loading,
-- so pin_code is unique once imported and is used directly as the primary key.
CREATE TABLE pin_rto_lookup (
  pin_code TEXT PRIMARY KEY,
  city TEXT,
  state TEXT,
  rto_code TEXT
);

-- Read-only reference data — no partner-specific info, safe for public/anon
-- read access (needed since PIN lookup on RegisterPage Step 1 runs before
-- the partner has an authenticated session).
ALTER TABLE pin_rto_lookup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pin lookup: public read" ON pin_rto_lookup
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Public read access (anon)" ON pin_rto_lookup
  FOR SELECT TO anon
  USING (true);


-- ── 7. PROFILE PHOTOS (Storage) ──
-- The 'profile-photos' bucket itself is created via the Supabase Storage API
-- (public, 1MB limit, image/png|jpeg|webp only) — not here, since buckets
-- aren't managed through plain SQL. These RLS policies on storage.objects are,
-- though, and are required before uploads will work. Files are stored at
-- <auth.uid()>/avatar.<ext>, so a partner can only write inside their own folder.
CREATE POLICY "Profile photos: public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Profile photos: owner upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Profile photos: owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Profile photos: owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);


-- ══════════════════════════════════════════════════════════════════
--  VIEWS
-- ══════════════════════════════════════════════════════════════════

-- ── Partner Customers (aggregated from orders) ──
CREATE OR REPLACE VIEW partner_customers AS
SELECT
  ro.partner_id,
  ro.customer_name,
  COUNT(*)::INT AS total_orders,
  SUM(ro.order_amount)::NUMERIC AS total_purchase,
  MAX(ro.order_date) AS last_order_date,
  CASE WHEN COUNT(*) > 1 THEN TRUE ELSE FALSE END AS is_repeat
FROM referral_orders ro
WHERE ro.status NOT IN ('cancelled', 'returned')
GROUP BY ro.partner_id, ro.customer_name;


-- ── Monthly Earnings ──
CREATE OR REPLACE VIEW monthly_earnings AS
SELECT
  ro.partner_id,
  date_trunc('month', ro.order_date)::DATE AS month,
  to_char(ro.order_date, 'Mon') AS month_label,
  SUM(ro.commission_amount)::NUMERIC AS earnings
FROM referral_orders ro
WHERE ro.status NOT IN ('cancelled', 'returned')
GROUP BY ro.partner_id, date_trunc('month', ro.order_date), to_char(ro.order_date, 'Mon')
ORDER BY month;


-- ── Leaderboard (sales-based, no personal details) ──
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id AS partner_id,
  p.name,
  p.avatar_initials,
  ct.name AS tier_name,
  ct.color AS tier_color,
  COALESCE(SUM(ro.order_amount), 0)::NUMERIC AS total_sales,
  ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(ro.order_amount), 0) DESC)::INT AS rank
FROM partners p
JOIN commission_tiers ct ON p.tier_id = ct.id
LEFT JOIN referral_orders ro ON ro.partner_id = p.id AND ro.status NOT IN ('cancelled', 'returned')
WHERE p.is_active = TRUE AND p.status = 'approved'
GROUP BY p.id, p.name, p.avatar_initials, ct.name, ct.color;


-- ── Partner Stats (main dashboard view) ──
CREATE OR REPLACE VIEW partner_stats AS
SELECT
  p.id AS partner_id,
  p.auth_user_id,
  p.partner_code,
  p.name,
  p.email,
  p.phone,
  p.whatsapp,
  p.city,
  p.referral_code,
  p.avatar_initials,
  p.instagram_id,
  p.joined_at,
  p.is_active,
  ct.name AS tier_name,
  ct.rate_percent AS tier_rate,
  ct.color AS tier_color,
  -- Sales totals
  COALESCE((SELECT SUM(order_amount) FROM referral_orders WHERE partner_id = p.id AND status NOT IN ('cancelled','returned')), 0) AS total_sales,
  COALESCE((SELECT COUNT(*) FROM referral_orders WHERE partner_id = p.id AND status NOT IN ('cancelled','returned')), 0)::INT AS total_orders,
  -- Commission breakdown
  COALESCE((SELECT SUM(commission_amount) FROM referral_orders WHERE partner_id = p.id AND status NOT IN ('cancelled','returned')), 0) AS total_commission,
  COALESCE((SELECT SUM(commission_amount) FROM referral_orders WHERE partner_id = p.id AND status IN ('confirmed','packed','shipped')), 0) AS pending_commission,
  COALESCE((SELECT SUM(commission_amount) FROM referral_orders WHERE partner_id = p.id AND status IN ('delivered','commission_eligible')), 0) AS confirmed_commission,
  COALESCE((SELECT SUM(amount) FROM payouts WHERE partner_id = p.id AND status = 'completed'), 0) AS paid_commission,
  COALESCE((SELECT SUM(amount) FROM payouts WHERE partner_id = p.id AND status = 'processing'), 0) AS processing_commission,
  -- Available = confirmed - paid - processing
  GREATEST(
    COALESCE((SELECT SUM(commission_amount) FROM referral_orders WHERE partner_id = p.id AND status IN ('delivered','commission_eligible')), 0)
    - COALESCE((SELECT SUM(amount) FROM payouts WHERE partner_id = p.id AND status IN ('completed','processing')), 0),
    0
  ) AS available_commission,
  -- This month
  COALESCE((SELECT SUM(order_amount) FROM referral_orders WHERE partner_id = p.id AND status NOT IN ('cancelled','returned') AND date_trunc('month', order_date) = date_trunc('month', now())), 0) AS this_month_sales,
  COALESCE((SELECT COUNT(*) FROM referral_orders WHERE partner_id = p.id AND status NOT IN ('cancelled','returned') AND date_trunc('month', order_date) = date_trunc('month', now())), 0)::INT AS this_month_orders,
  -- Customers
  COALESCE((SELECT COUNT(DISTINCT customer_name) FROM referral_orders WHERE partner_id = p.id AND status NOT IN ('cancelled','returned')), 0)::INT AS total_customers,
  COALESCE((SELECT COUNT(DISTINCT customer_name) FROM referral_orders WHERE partner_id = p.id AND status NOT IN ('cancelled','returned') AND date_trunc('month', order_date) = date_trunc('month', now())), 0)::INT AS new_customers_this_month,
  COALESCE((SELECT COUNT(*) FROM (SELECT customer_name FROM referral_orders WHERE partner_id = p.id AND status NOT IN ('cancelled','returned') GROUP BY customer_name HAVING COUNT(*) > 1) x), 0)::INT AS repeat_customers,
  -- Next tier
  (SELECT name FROM commission_tiers WHERE sort_order = ct.sort_order + 1) AS next_tier_name,
  (SELECT min_sales FROM commission_tiers WHERE sort_order = ct.sort_order + 1) AS next_tier_min_sales,
  GREATEST(
    COALESCE((SELECT min_sales FROM commission_tiers WHERE sort_order = ct.sort_order + 1), 0)
    - COALESCE((SELECT SUM(order_amount) FROM referral_orders WHERE partner_id = p.id AND status NOT IN ('cancelled','returned')), 0),
    0
  ) AS sales_to_next_tier,
  -- True until either bank account + IFSC, or a UPI ID, has been provided.
  -- Deliberately exposes only a boolean here, not the raw bank fields.
  NOT (
    (p.bank_account_number IS NOT NULL AND p.bank_ifsc IS NOT NULL)
    OR p.upi_id IS NOT NULL
  ) AS bank_details_pending,
  p.profile_photo_url
FROM partners p
LEFT JOIN commission_tiers ct ON p.tier_id = ct.id;


-- ══════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_tiers ENABLE ROW LEVEL SECURITY;

-- Partners: read own, insert own (registration)
-- Uses auth.email() (reads the JWT directly) rather than subquerying partners
-- itself — a self-referencing subquery inside a policy on the same table
-- causes Postgres to recurse the policy indefinitely ("infinite recursion
-- detected in policy for relation 'partners'"). The email fallback exists
-- for getPartnerProfile()'s "find by email and link auth_user_id" path.
CREATE POLICY "Partners: read own" ON partners
  FOR SELECT USING (auth.uid() = auth_user_id OR email = auth.email());
CREATE POLICY "Partners: insert self" ON partners
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);
CREATE POLICY "Partners: update own" ON partners
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Orders: read own
CREATE POLICY "Orders: read own" ON referral_orders
  FOR SELECT USING (partner_id IN (SELECT id FROM partners WHERE auth_user_id = auth.uid()));

-- Payouts: read own
CREATE POLICY "Payouts: read own" ON payouts
  FOR SELECT USING (partner_id IN (SELECT id FROM partners WHERE auth_user_id = auth.uid()));

-- Notifications: read, insert & update own
-- INSERT is required because submitRegistration() and updateBankDetails()
-- write the 'account_setup' notification from the browser client (partner's
-- own session), not a server-side admin client — without this policy those
-- inserts are silently denied by RLS's default-deny (no error surfaced,
-- since the calling code didn't check that particular insert's result).
CREATE POLICY "Notifications: read own" ON notifications
  FOR SELECT USING (partner_id IN (SELECT id FROM partners WHERE auth_user_id = auth.uid()));
CREATE POLICY "Notifications: insert own" ON notifications
  FOR INSERT WITH CHECK (partner_id IN (SELECT id FROM partners WHERE auth_user_id = auth.uid()));
CREATE POLICY "Notifications: update own" ON notifications
  FOR UPDATE USING (partner_id IN (SELECT id FROM partners WHERE auth_user_id = auth.uid()));

-- Tiers: anyone can read
CREATE POLICY "Tiers: public read" ON commission_tiers
  FOR SELECT USING (true);


-- ══════════════════════════════════════════════════════════════════
--  DONE — Your database is ready!
-- ══════════════════════════════════════════════════════════════════
