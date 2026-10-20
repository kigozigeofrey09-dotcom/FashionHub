-- =====================================================================
-- FASHIONHUB ENHANCED ANALYTICS & MULTI-CURRENCY SQL MIGRATION
-- =====================================================================

-- 1. Add analytics engagement counters to listings table
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS wishlist_saves_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS whatsapp_clicks_count INTEGER DEFAULT 0;

-- 2. Create listing analytics event logs table
CREATE TABLE IF NOT EXISTS listing_analytics_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'view', 'wishlist', 'whatsapp_click'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for high performance reporting
CREATE INDEX IF NOT EXISTS idx_listing_analytics ON listing_analytics_logs(listing_id, event_type);
