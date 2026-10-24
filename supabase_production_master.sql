-- =====================================================================
-- FASHIONHUB PRODUCTION MASTER SQL SCRIPT
-- Includes Super Admin setup for kigozigeofrey09@gmail.com, RLS policies,
-- storage buckets, and all marketplace tables.
-- =====================================================================

-- 1. PROFILES & SUPER ADMIN
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'buyer',
    is_super_admin BOOLEAN DEFAULT FALSE,
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

INSERT INTO countries (code, name, currency, cities, payment_instructions, enabled)
VALUES ('UG', 'Uganda', 'UGX', ARRAY['Kampala', 'Entebbe', 'Jinja', 'Mbarara', 'Gulu', 'Fort Portal', 'Mbale'], 'Uganda Mobile Money payment: 0773927881. Receiver Name: Kabesha Bankenga. Payment remains unverified until admin review. Never share a PIN or OTP.', true)
ON CONFLICT (code) DO NOTHING;

-- 3. SHOPS & BOUTIQUES
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

-- 4. LISTINGS
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

-- 5. STORAGE BUCKET & POLICIES
INSERT INTO storage.buckets (id, name, public)
VALUES ('fashionhub-media', 'fashionhub-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Media" ON storage.objects;

CREATE POLICY "Public Read Media" ON storage.objects FOR SELECT USING (bucket_id = 'fashionhub-media');
CREATE POLICY "Authenticated Upload Media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'fashionhub-media');

-- 6. ROW LEVEL SECURITY & PERMISSIVE POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all countries" ON countries;
DROP POLICY IF EXISTS "Allow all shops" ON shops;
DROP POLICY IF EXISTS "Allow all listings" ON listings;

CREATE POLICY "Allow all profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all countries" ON countries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all shops" ON shops FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all listings" ON listings FOR ALL USING (true) WITH CHECK (true);

-- 7. AUTO-ADMIN PROMOTION TRIGGER FOR kigozigeofrey09@gmail.com
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, is_super_admin, country_code)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    CASE WHEN lower(new.email) = 'kigozigeofrey09@gmail.com' THEN 'admin' ELSE COALESCE(new.raw_user_meta_data->>'role', 'buyer') END,
    CASE WHEN lower(new.email) = 'kigozigeofrey09@gmail.com' THEN true ELSE false END,
    COALESCE(new.raw_user_meta_data->>'countryCode', 'UG')
  )
  ON CONFLICT (id) DO UPDATE
  SET role = CASE WHEN lower(EXCLUDED.email) = 'kigozigeofrey09@gmail.com' THEN 'admin' ELSE EXCLUDED.role END,
      is_super_admin = CASE WHEN lower(EXCLUDED.email) = 'kigozigeofrey09@gmail.com' THEN true ELSE EXCLUDED.is_super_admin END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
