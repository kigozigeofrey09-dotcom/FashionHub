-- FashionHub / TerraBok Uganda Product Discovery Engine (1,000,000+ Scale)
-- Run in Supabase SQL Editor. Preserves existing tables and omits payment processing.

CREATE TABLE IF NOT EXISTS public.product_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  website text,
  contact_name text,
  contact_phone text,
  contact_email text,
  country text NOT NULL DEFAULT 'Uganda',
  integration_method text NOT NULL DEFAULT 'csv_import'
    CHECK (integration_method IN ('csv_import', 'api_feed', 'manual_submission')),
  permission_status text NOT NULL DEFAULT 'pending'
    CHECK (permission_status IN ('authorised', 'pending', 'revoked')),
  import_frequency text NOT NULL DEFAULT 'daily'
    CHECK (import_frequency IN ('hourly', 'daily', 'weekly', 'manual')),
  last_synced_at timestamptz,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended')),
  api_endpoint text,
  api_key_secret_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.discovery_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_product_key text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  brand text NOT NULL DEFAULT 'Unbranded',
  category text NOT NULL,
  subcategory text NOT NULL DEFAULT 'General',
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  price_ugx bigint NOT NULL CHECK (price_ugx >= 0),
  currency text NOT NULL DEFAULT 'UGX',
  product_condition text NOT NULL DEFAULT 'new'
    CHECK (product_condition IN ('new', 'used', 'refurbished')),
  seller_name text NOT NULL,
  seller_location text NOT NULL DEFAULT 'Kampala',
  seller_whatsapp text,
  external_url text,
  original_source text NOT NULL DEFAULT 'Direct Seller',
  source_type text NOT NULL DEFAULT 'manual_submission'
    CHECK (source_type IN ('csv_import', 'api_feed', 'manual_submission')),
  source_id uuid REFERENCES public.product_sources(id) ON DELETE SET NULL,
  availability_status text NOT NULL DEFAULT 'in_stock'
    CHECK (availability_status IN ('in_stock', 'limited_stock', 'out_of_stock')),
  verification_status text NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('verified', 'pending', 'unverified')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  search_tsv tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(brand, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(category, '') || ' ' || coalesce(subcategory, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'D')
  ) STORED
);

CREATE TABLE IF NOT EXISTS public.product_import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.product_sources(id) ON DELETE SET NULL,
  source_name text NOT NULL,
  import_method text NOT NULL CHECK (import_method IN ('csv_import', 'api_feed', 'manual_submission')),
  total_rows integer NOT NULL DEFAULT 0,
  imported_count integer NOT NULL DEFAULT 0,
  duplicate_count integer NOT NULL DEFAULT 0,
  invalid_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'partial', 'failed')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Scale indexes for 1,000,000+ products
CREATE INDEX IF NOT EXISTS idx_discovery_products_search_tsv
  ON public.discovery_products USING GIN (search_tsv);

CREATE INDEX IF NOT EXISTS idx_discovery_products_canonical_key
  ON public.discovery_products (canonical_product_key, price_ugx ASC);

CREATE INDEX IF NOT EXISTS idx_discovery_products_browse
  ON public.discovery_products (category, subcategory, product_condition, price_ugx, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_discovery_products_location_updated
  ON public.discovery_products (seller_location, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_discovery_products_source_id
  ON public.discovery_products (source_id, updated_at DESC);

ALTER TABLE public.product_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_import_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'discovery_products' AND policyname = 'Public read discovery products'
  ) THEN
    CREATE POLICY "Public read discovery products"
      ON public.discovery_products FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'discovery_products' AND policyname = 'Authenticated manage discovery products'
  ) THEN
    CREATE POLICY "Authenticated manage discovery products"
      ON public.discovery_products FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'product_sources' AND policyname = 'Authenticated read product sources'
  ) THEN
    CREATE POLICY "Authenticated read product sources"
      ON public.product_sources FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'product_sources' AND policyname = 'Authenticated write product sources'
  ) THEN
    CREATE POLICY "Authenticated write product sources"
      ON public.product_sources FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'product_import_logs' AND policyname = 'Authenticated access import logs'
  ) THEN
    CREATE POLICY "Authenticated access import logs"
      ON public.product_import_logs FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END$$;