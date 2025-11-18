-- Master Merch Inventory System Migration
-- This migration creates the complete schema for managing merch inventory across warehouse and tour locations

-- ============================================================================
-- PRODUCT MANAGEMENT
-- ============================================================================

-- Drop and recreate products table with enhanced fields
DROP TABLE IF EXISTS public.products CASCADE;
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handle text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  vendor text,
  type text, -- "T-Shirt", "Poster", "Sweatshirt", etc.
  tags text[],
  image_urls text[],
  published boolean DEFAULT true,
  ambient_inks_id text UNIQUE, -- External ID from Ambient Inks
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product variants table (sizes, colors, etc.)
CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  sku text UNIQUE NOT NULL,
  variant_name text, -- e.g., "Small", "Medium - Black"
  option1_name text, -- e.g., "Size"
  option1_value text, -- e.g., "Small"
  option2_name text, -- e.g., "Color"
  option2_value text, -- e.g., "Black"
  option3_name text,
  option3_value text,
  weight decimal(10,2),
  weight_unit text,
  barcode text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product identifiers mapping (handles multiple SKUs/IDs per product)
CREATE TABLE public.product_identifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE NOT NULL,
  identifier_type text NOT NULL, -- "ambient_inks_sku", "atvenue_sku", "internal_sku"
  identifier_value text NOT NULL,
  source text NOT NULL, -- "ambient_inks", "atvenue", "internal"
  created_at timestamptz DEFAULT now(),
  UNIQUE(identifier_type, identifier_value)
);

-- ============================================================================
-- PRICING SYSTEM
-- ============================================================================

CREATE TABLE public.product_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE NOT NULL,
  price_type text NOT NULL, -- "retail", "wholesale", "tour", "compare_at"
  amount decimal(10,2) NOT NULL,
  source text NOT NULL, -- "ambient_inks", "atvenue", "internal"
  effective_from date DEFAULT CURRENT_DATE,
  effective_to date, -- nullable, for historical pricing
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- CUSTOM METADATA (PRIMARY VALUE-ADD FIELDS)
-- ============================================================================

CREATE TABLE public.product_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE NOT NULL,
  category text, -- Custom categorization
  supplier_manufacturer text,
  date_purchased date,
  units_purchased integer,
  printing_manufacturing_cost decimal(10,2),
  packaging_shipping_cost decimal(10,2),
  wholesale_cost_per_unit decimal(10,2),
  tax_paid decimal(10,2),
  -- Extensible JSON for additional custom fields
  additional_fields jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_variant_id)
);

-- ============================================================================
-- INVENTORY STATE MANAGEMENT (CORE FEATURE)
-- ============================================================================

-- Current inventory state per location/state
DROP TABLE IF EXISTS public.inventory CASCADE;
CREATE TABLE public.inventory_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE NOT NULL,
  state text NOT NULL, -- "warehouse", "transfer", "tour_start", "venue", "tour"
  quantity integer DEFAULT 0,
  tour_id uuid REFERENCES public.tours(id) ON DELETE SET NULL,
  location_details text, -- Additional location info
  last_counted_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_variant_id, state, tour_id)
);

-- Inventory transaction log (complete audit trail)
CREATE TABLE public.inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL, -- "sale", "transfer", "adjustment", "comp", "shipment"
  from_state text, -- nullable for initial stock
  to_state text, -- nullable for sales
  quantity integer NOT NULL,
  tour_id uuid REFERENCES public.tours(id) ON DELETE SET NULL,
  show_id uuid REFERENCES public.shows(id) ON DELETE SET NULL,
  transaction_date timestamptz DEFAULT now(),
  source text NOT NULL, -- "ambient_inks", "atvenue", "internal", "manual"
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- TOUR SALES TRACKING
-- ============================================================================

-- Detailed tour sales by show and product
CREATE TABLE public.tour_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES public.shows(id) ON DELETE SET NULL NOT NULL,
  product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity_sold integer NOT NULL,
  is_comp boolean DEFAULT false,
  unit_price decimal(10,2),
  gross_revenue decimal(10,2),
  sale_date date NOT NULL,
  source text NOT NULL, -- "atvenue", "manual"
  source_data jsonb, -- Store original CSV/import data
  created_at timestamptz DEFAULT now()
);

-- Venue night totals (from Atvenue register payments)
CREATE TABLE public.venue_night_totals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES public.shows(id) ON DELETE SET NULL,
  total_receipts decimal(10,2) NOT NULL,
  total_fees decimal(10,2) NOT NULL,
  net_receipts decimal(10,2) NOT NULL,
  sale_date date NOT NULL,
  source text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- HISTORICAL TRACKING
-- ============================================================================

-- Tour blocks for organizing snapshots
CREATE TABLE public.tour_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
  block_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inventory snapshots for historical tracking
CREATE TABLE public.inventory_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL,
  snapshot_type text NOT NULL, -- "daily", "tour_block", "monthly"
  product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE NOT NULL,
  state text NOT NULL,
  quantity integer NOT NULL,
  tour_id uuid REFERENCES public.tours(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SALES ORDERS (AMBIENT INKS)
-- ============================================================================

-- Enhanced sales orders table
DROP TABLE IF EXISTS public.sales_orders CASCADE;
CREATE TABLE public.sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number bigint NOT NULL,
  order_date date NOT NULL,
  product_name text NOT NULL,
  product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  sku text,
  quantity integer NOT NULL,
  gross_sales decimal(10,2) NOT NULL,
  discounts decimal(10,2) DEFAULT 0,
  net_sales decimal(10,2) NOT NULL,
  commission decimal(10,2) DEFAULT 0,
  deduction decimal(10,2) DEFAULT 0,
  payout decimal(10,2) NOT NULL,
  source text DEFAULT 'ambient_inks',
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON public.product_variants(sku);
CREATE INDEX idx_product_identifiers_variant_id ON public.product_identifiers(product_variant_id);
CREATE INDEX idx_product_pricing_variant_id ON public.product_pricing(product_variant_id);
CREATE INDEX idx_inventory_states_variant_id ON public.inventory_states(product_variant_id);
CREATE INDEX idx_inventory_states_state ON public.inventory_states(state);
CREATE INDEX idx_inventory_transactions_variant_id ON public.inventory_transactions(product_variant_id);
CREATE INDEX idx_inventory_transactions_date ON public.inventory_transactions(transaction_date);
CREATE INDEX idx_tour_sales_show_id ON public.tour_sales(show_id);
CREATE INDEX idx_tour_sales_variant_id ON public.tour_sales(product_variant_id);
CREATE INDEX idx_sales_orders_variant_id ON public.sales_orders(product_variant_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_night_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to access all merch data
CREATE POLICY "Allow all for authenticated users" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.product_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.product_identifiers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.product_pricing FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.product_metadata FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.inventory_states FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.inventory_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.tour_sales FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.venue_night_totals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.tour_blocks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.inventory_snapshots FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.sales_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for updating updated_at timestamps
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_pricing_updated_at BEFORE UPDATE ON public.product_pricing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_metadata_updated_at BEFORE UPDATE ON public.product_metadata
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_states_updated_at BEFORE UPDATE ON public.inventory_states
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tour_blocks_updated_at BEFORE UPDATE ON public.tour_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- HELPFUL VIEWS
-- ============================================================================

-- Master inventory view with all state columns
CREATE OR REPLACE VIEW public.master_inventory_view AS
SELECT 
  pv.id AS variant_id,
  p.title AS product_name,
  p.type AS product_type,
  pv.sku,
  pv.variant_name,
  pv.option1_value AS size,
  pv.option2_value AS color,
  COALESCE((SELECT quantity FROM public.inventory_states WHERE product_variant_id = pv.id AND state = 'warehouse'), 0) AS warehouse_qty,
  COALESCE((SELECT quantity FROM public.inventory_states WHERE product_variant_id = pv.id AND state = 'transfer'), 0) AS transfer_qty,
  COALESCE((SELECT quantity FROM public.inventory_states WHERE product_variant_id = pv.id AND state = 'tour_start'), 0) AS tour_start_qty,
  COALESCE((SELECT quantity FROM public.inventory_states WHERE product_variant_id = pv.id AND state = 'venue'), 0) AS venue_qty,
  COALESCE((SELECT quantity FROM public.inventory_states WHERE product_variant_id = pv.id AND state = 'tour'), 0) AS tour_qty,
  COALESCE((SELECT SUM(quantity) FROM public.inventory_states WHERE product_variant_id = pv.id), 0) AS total_qty,
  (SELECT MAX(updated_at) FROM public.inventory_states WHERE product_variant_id = pv.id) AS last_updated
FROM public.product_variants pv
JOIN public.products p ON p.id = pv.product_id
ORDER BY p.title, pv.variant_name;

-- Product pricing view
CREATE OR REPLACE VIEW public.product_pricing_view AS
SELECT 
  pv.id AS variant_id,
  p.title AS product_name,
  pv.sku,
  pv.variant_name,
  pp.price_type,
  pp.amount,
  pp.source,
  pp.effective_from,
  pp.effective_to
FROM public.product_pricing pp
JOIN public.product_variants pv ON pv.id = pp.product_variant_id
JOIN public.products p ON p.id = pv.product_id
WHERE pp.effective_to IS NULL OR pp.effective_to > CURRENT_DATE
ORDER BY p.title, pv.variant_name, pp.price_type;