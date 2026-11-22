-- =====================================================================
-- FASHIONHUB ULTIMATE MASTER SUPABASE SQL SCRIPT (IDEMPOTENT)
-- Includes all tables, relations, indexes, storage buckets, and RLS policies
-- for Marketplace, Shops, Listings, Admin, Subscriptions, and Analytics.
-- =====================================================================

-- 1. PROFILES & USERS
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'buyer',
    country_code TEXT DEFAULT 'UG',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COUNTRIES & CURRENCIES
CREATE TABLE IF NOT EXISTS countries (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    currency TEXT NOT NULL,
    cities TEXT[] DEFAULT '{}',
    payment_instructions TEXT,
    enabled BOOLEAN DEFAULT TRUE
);

-- 3. SHOPS & BOUTIQUES (with Blue Tick & Trial support)
CREATE TABLE IF NOT EXISTS shops (
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
CREATE TABLE IF NOT EXISTS listings (
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
CREATE TABLE IF NOT EXISTS listing_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    position INTEGER DEFAULT 0
);

-- 6. SAVED ITEMS / WISHLIST (Drip)
CREATE TABLE IF NOT EXISTS saved (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORDERS & FULFILLMENT
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    total_amount NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ENQUIRIES & CHATS
CREATE TABLE IF NOT EXISTS enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TRUST & SAFETY REPORTS
CREATE TABLE IF NOT EXISTS reports (
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
CREATE TABLE IF NOT EXISTS subscriptions (
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
CREATE TABLE IF NOT EXISTS subscription_audit_logs (
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
CREATE TABLE IF NOT EXISTS marketplace_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    category TEXT,
    search_query TEXT,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listing_analytics_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. ADMIN SETTINGS
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB DEFAULT '{}'
);

-- =====================================================================
-- PERFORMANCE INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_listings_shop ON listings(shop_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_shops_verified ON shops(is_verified DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

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
-- ROW LEVEL SECURITY (RLS) & PERMISSIVE POLICIES
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

-- Drop existing policies first to prevent 42710 errors on re-runs
DROP POLICY IF EXISTS "Public profiles" ON profiles;
DROP POLICY IF EXISTS "Public countries" ON countries;
DROP POLICY IF EXISTS "Public shops" ON shops;
DROP POLICY IF EXISTS "Public listings" ON listings;
DROP POLICY IF EXISTS "Public listing_media" ON listing_media;
DROP POLICY IF EXISTS "Public saved" ON saved;
DROP POLICY IF EXISTS "Public orders" ON orders;
DROP POLICY IF EXISTS "Public enquiries" ON enquiries;
DROP POLICY IF EXISTS "Public notifications" ON notifications;
DROP POLICY IF EXISTS "Public reports" ON reports;
DROP POLICY IF EXISTS "Public subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Public audit" ON subscription_audit_logs;
DROP POLICY IF EXISTS "Public analytics" ON marketplace_analytics;
DROP POLICY IF EXISTS "Public listing_analytics" ON listing_analytics_logs;
DROP POLICY IF EXISTS "Public settings" ON settings;

CREATE POLICY "Public profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public countries" ON countries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public shops" ON shops FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public listings" ON listings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public listing_media" ON listing_media FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public saved" ON saved FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public enquiries" ON enquiries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public reports" ON reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public subscriptions" ON subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public audit" ON subscription_audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public analytics" ON marketplace_analytics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public listing_analytics" ON listing_analytics_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public settings" ON settings FOR ALL USING (true) WITH CHECK (true);
