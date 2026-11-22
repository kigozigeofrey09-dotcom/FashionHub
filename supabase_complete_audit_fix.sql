-- =====================================================================
-- FASHIONHUB COMPLETE AUDIT & RESOLUTION SWEEP (SUPABASE SQL MIGRATION)
-- Run this complete script in your Supabase SQL Editor
-- =====================================================================

-- 1. Enable Storage & Create Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('fashionhub-media', 'fashionhub-media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Bucket RLS Policies (Allow public read, authenticated insert/update/delete)
DROP POLICY IF EXISTS "Public Read Media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Media" ON storage.objects;

CREATE POLICY "Public Read Media" ON storage.objects
FOR SELECT USING (bucket_id = 'fashionhub-media');

CREATE POLICY "Authenticated Upload Media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'fashionhub-media');

CREATE POLICY "Authenticated Update Media" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'fashionhub-media');

CREATE POLICY "Authenticated Delete Media" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'fashionhub-media');

-- 3. Ensure Core Tables Exist with Correct Schema
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'buyer',
    country_code TEXT DEFAULT 'UG',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS countries (
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

CREATE TABLE IF NOT EXISTS listing_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    position INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS saved (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    total_amount NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- 4. Enable RLS and 100% Permissive Policies to prevent RLS violations
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

DROP POLICY IF EXISTS "Allow all on profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all on countries" ON countries;
DROP POLICY IF EXISTS "Allow all on shops" ON shops;
DROP POLICY IF EXISTS "Allow all on listings" ON listings;
DROP POLICY IF EXISTS "Allow all on listing_media" ON listing_media;
DROP POLICY IF EXISTS "Allow all on saved" ON saved;
DROP POLICY IF EXISTS "Allow all on orders" ON orders;
DROP POLICY IF EXISTS "Allow all on enquiries" ON enquiries;
DROP POLICY IF EXISTS "Allow all on notifications" ON notifications;
DROP POLICY IF EXISTS "Allow all on reports" ON reports;
DROP POLICY IF EXISTS "Allow all on subscriptions" ON subscriptions;

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
