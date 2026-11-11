-- Supabase backend catalog. Local development uses SQLite when Supabase is not configured.
CREATE TABLE IF NOT EXISTS public.device_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'techspecs' CHECK (provider='techspecs'), provider_id TEXT NOT NULL,
  brand TEXT NOT NULL, category TEXT NOT NULL, name TEXT NOT NULL, model TEXT, version TEXT, region TEXT,
  release_date TEXT, release_start DATE, release_end DATE, release_precision TEXT,
  image_url TEXT, specs JSONB NOT NULL, domestic_availability TEXT NOT NULL DEFAULT 'unverified'
    CHECK (domestic_availability IN ('unverified','verified','not_sold')),
  domestic_source_url TEXT, domestic_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, provider_id), CHECK(release_start <= release_end)
);
-- Migrate the earlier un-deployed draft as well, without deleting any product data.
ALTER TABLE public.device_products DROP CONSTRAINT IF EXISTS device_products_brand_check;
ALTER TABLE public.device_products DROP CONSTRAINT IF EXISTS device_products_category_check;
ALTER TABLE public.device_products ADD CONSTRAINT device_products_category_check
  CHECK(category IN ('Smartphones','Tablets','Smartwatches','Laptops','Desktops','Displays','GPUs'));
ALTER TABLE public.device_products ALTER COLUMN release_date DROP NOT NULL;
ALTER TABLE public.device_products ALTER COLUMN release_start DROP NOT NULL;
ALTER TABLE public.device_products ALTER COLUMN release_end DROP NOT NULL;
ALTER TABLE public.device_products ALTER COLUMN release_precision DROP NOT NULL;
ALTER TABLE public.device_products ADD COLUMN IF NOT EXISTS domestic_checked_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS device_products_search_idx ON public.device_products(category, brand, release_start DESC, provider_id);
ALTER TABLE public.device_products ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.device_products FROM anon, authenticated;
GRANT ALL ON public.device_products TO service_role;

CREATE OR REPLACE FUNCTION public.device_catalog_brands(p_category TEXT, p_from DATE, p_to DATE, p_domestic_only BOOLEAN)
RETURNS TABLE(brand TEXT) LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
  SELECT DISTINCT p.brand FROM public.device_products p WHERE p.provider='techspecs' AND p.category=p_category
    AND (p_from IS NULL OR (p.release_start >= p_from AND p.release_end <= p_to))
    AND (p.release_start IS NULL OR p.release_start <= p_to)
    AND (NOT p_domestic_only OR (p.domestic_availability='verified' AND p.domestic_source_url IS NOT NULL)) ORDER BY p.brand;
$$;
REVOKE ALL ON FUNCTION public.device_catalog_brands(TEXT,DATE,DATE,BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.device_catalog_brands(TEXT,DATE,DATE,BOOLEAN) TO service_role;
