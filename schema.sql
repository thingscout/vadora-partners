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
  rate_percent NUMERIC NOT NULL,      -- 8, 10, 12
  color TEXT DEFAULT '#C9A84C',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default tiers
INSERT INTO commission_tiers (name, min_sales, max_sales, rate_percent, color, sort_order) VALUES
  ('Bronze', 0,     24999,  8,  '#B87D5E', 1),
  ('Silver', 25000, 99999,  10, '#9EAAB0', 2),
  ('Gold',   100000, NULL,  12, '#C9A84C', 3);


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
  ) AS sales_to_next_tier
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
CREATE POLICY "Partners: read own" ON partners
  FOR SELECT USING (auth.uid() = auth_user_id OR auth.uid() IN (SELECT auth_user_id FROM partners WHERE email = email));
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

-- Notifications: read & update own
CREATE POLICY "Notifications: read own" ON notifications
  FOR SELECT USING (partner_id IN (SELECT id FROM partners WHERE auth_user_id = auth.uid()));
CREATE POLICY "Notifications: update own" ON notifications
  FOR UPDATE USING (partner_id IN (SELECT id FROM partners WHERE auth_user_id = auth.uid()));

-- Tiers: anyone can read
CREATE POLICY "Tiers: public read" ON commission_tiers
  FOR SELECT USING (true);


-- ══════════════════════════════════════════════════════════════════
--  DONE — Your database is ready!
-- ══════════════════════════════════════════════════════════════════
