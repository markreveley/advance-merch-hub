-- Add missing unique constraint for product_pricing
-- This is required for the upsert operation in the import edge function

ALTER TABLE public.product_pricing
ADD CONSTRAINT product_pricing_variant_type_source_date_key 
UNIQUE (product_variant_id, price_type, source, effective_from);