-- =====================================================================
-- FASHIONHUB SELLER AD BOOKING & SUPER ADMIN RLS MIGRATION
-- =====================================================================

CREATE TABLE IF NOT EXISTS ad_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    package_name TEXT NOT NULL,
    banner_url TEXT NOT NULL,
    target_url TEXT NOT NULL,
    placement_slot TEXT DEFAULT 'homepage',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payment_status TEXT DEFAULT 'pending',
    approval_status TEXT DEFAULT 'pending',
    is_active BOOLEAN DEFAULT FALSE,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view active approved ads" ON ad_campaigns;
DROP POLICY IF EXISTS "Sellers manage own ads" ON ad_campaigns;
DROP POLICY IF EXISTS "Super Admin full control ads" ON ad_campaigns;

CREATE POLICY "Public view active approved ads" ON ad_campaigns
FOR SELECT USING (is_active = true AND approval_status = 'approved');

CREATE POLICY "Sellers manage own ads" ON ad_campaigns
FOR ALL TO authenticated
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Super Admin full control ads" ON ad_campaigns
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND lower(profiles.email) = 'kigozigeofrey09@gmail.com'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND lower(profiles.email) = 'kigozigeofrey09@gmail.com'
    )
);
