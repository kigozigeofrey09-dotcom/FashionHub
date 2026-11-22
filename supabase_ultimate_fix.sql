-- =====================================================================
-- FASHIONHUB ULTIMATE PRODUCTION SQL MIGRATION (FIXED RLS & COLUMNS)
-- Run this entire script in your Supabase SQL Editor
-- =====================================================================

DROP TABLE IF EXISTS listing_analytics_logs CASCADE;
DROP TABLE IF EXISTS marketplace_analytics CASCADE;
DROP TABLE IF EXISTS subscription_audit_logs CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS enquiries CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS saved CASCADE;
DROP TABLE IF EXISTS listing_media CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
DROP TABLE IF EXISTS countries CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- 1. PROFILES & USERS
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'buyer',
    country_code TEXT DEFAULT 'UG',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COUNTRIES & CURRENCIES
CREATE TABLE countries (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    currency TEXT NOT NULL,
    cities TEXT[] DEFAULT '{}',
    payment_instructions TEXT,
    enabled BOOLEAN DEFAULT TRUE
);

INSERT INTO countries (code, name, currency, cities, payment_instructions, enabled)
VALUES ('UG', 'Uganda', 'UGX', ARRAY['Kampala', 'Entebbe', 'Jinja', 'Mbarara', 'Gulu', 'Fort Portal', 'Mbale'], 'Uganda Mobile Money payment: 0773927881. Receiver Name: Kabesha Bankenga. Payment remains unverified until admin review. Never share a PIN or OTP.', true)
ON CONFLICT (code) DO NOTHING;

-- 3. SHOPS & BOUTIQUES (with Blue Tick & Trial support)
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    story TEXT NOT NULL,
    tagline TEXT,
    categories TEXT[] DEFAULT '{}',
    sell_type TEXT DEFAULT 'products',
    country_code TEXT NOT NULL,
    country_name TEXT,
    city TEXT NOT NULL,
    accent TEXT DEFAULT '#496a4d',
    whatsapp_number TEXT,
    logo_url TEXT,
    cover_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    subscription_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    subscription_status TEXT DEFAULT 'trial',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LISTINGS (Products & Services with analytics counters)
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    shop_name TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    type TEXT DEFAULT 'product',
    description TEXT NOT NULL,
    price NUMERIC NOT NULL,
    currency TEXT DEFAULT 'UGX',
    country_code TEXT NOT NULL,
    country_name TEXT,
    city TEXT NOT NULL,
    image TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    sizes TEXT,
    colour TEXT,
    service_details TEXT,
    enquiry_label TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    promotion TEXT,
    is_seed BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    wishlist_saves_count INTEGER DEFAULT 0,
    whatsapp_clicks_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LISTING MEDIA GALLERY
CREATE TABLE listing_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    position INTEGER DEFAULT 0
);

-- 6. SAVED ITEMS / WISHLIST (Drip)
CREATE TABLE saved (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORDERS & FULFILLMENT
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    total_amount NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ENQUIRIES & CHATS
CREATE TABLE enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TRUST & SAFETY REPORTS
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    reported_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SUBSCRIPTIONS & MANUAL MTN MOMO (0773927881 / Kabesha Bankenga)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,
    plan_name TEXT,
    payer_type TEXT DEFAULT 'seller',
    country_code TEXT DEFAULT 'UG',
    transaction_reference TEXT NOT NULL,
    receipt_url TEXT,
    status TEXT DEFAULT 'pending_verification',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

-- 12. SUBSCRIPTION AUDIT LOGS
CREATE TABLE subscription_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    transaction_ref TEXT NOT NULL,
    amount_ugx NUMERIC DEFAULT 10000,
    status TEXT DEFAULT 'pending',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    admin_notes TEXT
);

-- 13. PLATFORM & MARKETPLACE ANALYTICS
CREATE TABLE marketplace_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    category TEXT,
    search_query TEXT,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE listing_analytics_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. ADMIN SETTINGS
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB DEFAULT '{}'
);

-- =====================================================================
-- PERFORMANCE INDEXES
-- =====================================================================
CREATE INDEX idx_listings_shop ON listings(shop_id);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_shops_verified ON shops(is_verified DESC);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- =====================================================================
-- REALTIME PUBLICATIONS
-- =====================================================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE listings;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE shops;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE enquiries;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================
-- STORAGE BUCKET FOR MEDIA UPLOADS
-- =====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('fashionhub-media', 'fashionhub-media', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) & 100% PERMISSIVE POLICIES (No RLS Blocks)
-- =====================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_analytics_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on countries" ON countries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on shops" ON shops FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on listings" ON listings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on listing_media" ON listing_media FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on saved" ON saved FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on enquiries" ON enquiries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on reports" ON reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on subscriptions" ON subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on audit" ON subscription_audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on analytics" ON marketplace_analytics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on listing_analytics" ON listing_analytics_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on settings" ON settings FOR ALL USING (true) WITH CHECK (true);
