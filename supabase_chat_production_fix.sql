-- =====================================================================
-- FASHIONHUB PRODUCTION CHAT & NOTIFICATION RLS & REALTIME MIGRATION
-- =====================================================================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was already created previously
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime Publication
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enable Row-Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop old policies to prevent conflicts
DROP POLICY IF EXISTS "Conversations participant access" ON conversations;
DROP POLICY IF EXISTS "Messages participant access" ON messages;
DROP POLICY IF EXISTS "Notifications user access" ON notifications;

-- Strict RLS Policies
CREATE POLICY "Conversations participant access" ON conversations
FOR ALL USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Messages participant access" ON messages
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = messages.conversation_id
        AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = messages.conversation_id
        AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
);

CREATE POLICY "Notifications user access" ON notifications
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
