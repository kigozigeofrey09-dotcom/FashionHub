-- =====================================================================
-- DAYBOOK UG MASTER DATABASE SCHEMA & MIGRATION
-- =====================================================================

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type VARCHAR(10) CHECK (type IN ('income', 'expense')),
    amount NUMERIC(12, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    payment_method VARCHAR(20) CHECK (payment_method IN ('MTN_MoMo', 'Cash', 'Bank')),
    created_by VARCHAR(100) DEFAULT 'Agent'
);

CREATE TABLE IF NOT EXISTS monthly_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_month VARCHAR(7) UNIQUE NOT NULL, -- Format: YYYY-MM
    total_income NUMERIC(14, 2) DEFAULT 0,
    total_expense NUMERIC(14, 2) DEFAULT 0,
    net_profit NUMERIC(14, 2) DEFAULT 0,
    performance_label VARCHAR(20) CHECK (performance_label IN ('High Sales', 'Low Sales', 'Average')),
    ai_advice_summary TEXT
);

-- Enable RLS & Permissive Policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write analytics" ON monthly_analytics FOR ALL USING (true) WITH CHECK (true);
