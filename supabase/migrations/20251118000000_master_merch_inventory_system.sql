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
  state text NOT NULL CHECK (state IN ('warehouse', 'transfer', 'tour_start', 'venue', 'tour')),
  quantity integer NOT NULL DEFAULT 0,
  tour_id uuid REFERENCES public.tours(id) ON DELETE SET NULL,
  location_details text, -- e.g., "Shipped to Denver 9/12"
  last_counted_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_variant_id, state, COALESCE(tour_id, '00000000-0000-0000-0000-000000000000'::uuid))
);

-- Inventory transaction log for complete audit trail
CREATE TABLE public.inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL, -- "sale", "transfer", "adjustment", "comp", "shipment"
  from_state text CHECK (from_state IN ('warehouse', 'transfer', 'tour_start', 'venue', 'tour', NULL)),
  to_state text CHECK (to_state IN ('warehouse', 'transfer', 'tour_start', 'venue', 'tour', NULL)),
  quantity integer NOT NULL,
  tour_id uuid REFERENCES public.tours(id) ON DELETE SET NULL,
  show_id uuid REFERENCES public.shows(id) ON DELETE SET NULL,
  transaction_date timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL, -- "ambient_inks", "atvenue", "manual"
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- TOUR SALES (ENHANCED)
-- ============================================================================

-- Replace tour_reports with detailed tour_sales
DROP TABLE IF EXISTS public.tour_reports CASCADE;
CREATE TABLE public.tour_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES public.shows(id) ON DELETE CASCADE NOT NULL,
  product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity_sold integer NOT NULL,
  is_comp boolean DEFAULT false, -- Tracks if complementary/free
  unit_price decimal(10,2),
  gross_revenue decimal(10,2),
  sale_date date NOT NULL,
  source text NOT NULL DEFAULT 'manual', -- "atvenue", "manual"
  source_data jsonb, -- Raw data from import
  created_at timestamptz DEFAULT now()
);

-- Venue night totals from Atvenue
CREATE TABLE public.venue_night_totals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES public.shows(id) ON DELETE CASCADE,
  total_receipts decimal(10,2) NOT NULL,
  total_fees decimal(10,2) DEFAULT 0,
  net_receipts decimal(10,2) NOT NULL,
  sale_date date NOT NULL,
  source text NOT NULL DEFAULT 'atvenue',
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- HISTORICAL SNAPSHOTS
-- ============================================================================

-- Tour blocks for grouping shows
CREATE TABLE public.tour_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
  block_name text NOT NULL, -- e.g., "East Coast Run"
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inventory snapshots for historical tracking
CREATE TABLE public.inventory_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL,
  snapshot_type text NOT NULL CHECK (snapshot_type IN ('daily', 'tour_block', 'monthly')),
  product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE NOT NULL,
  state text NOT NULL CHECK (state IN ('warehouse', 'transfer', 'tour_start', 'venue', 'tour')),
  quantity integer NOT NULL,
  tour_id uuid REFERENCES public.tours(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(snapshot_date, snapshot_type, product_variant_id, state, COALESCE(tour_id, '00000000-0000-0000-0000-000000000000'::uuid))
);

-- ============================================================================
-- SALES ORDERS (ENHANCED FOR AMBIENT INKS)
-- ============================================================================

-- Update sales_orders to reference product variants
DROP TABLE IF EXISTS public.sales_orders CASCADE;
CREATE TABLE public.sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number bigint NOT NULL,
  order_date timestamptz NOT NULL,
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
  source text NOT NULL DEFAULT 'ambient_inks',
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON public.product_variants(sku);
CREATE INDEX idx_product_identifiers_variant_id ON public.product_identifiers(product_variant_id);
CREATE INDEX idx_product_identifiers_value ON public.product_identifiers(identifier_value);
CREATE INDEX idx_product_pricing_variant_id ON public.product_pricing(product_variant_id);
CREATE INDEX idx_product_pricing_effective_dates ON public.product_pricing(effective_from, effective_to);
CREATE INDEX idx_inventory_states_variant_id ON public.inventory_states(product_variant_id);
CREATE INDEX idx_inventory_states_state ON public.inventory_states(state);
CREATE INDEX idx_inventory_states_tour_id ON public.inventory_states(tour_id);
CREATE INDEX idx_inventory_transactions_variant_id ON public.inventory_transactions(product_variant_id);
CREATE INDEX idx_inventory_transactions_date ON public.inventory_transactions(transaction_date);
CREATE INDEX idx_inventory_transactions_tour_id ON public.inventory_transactions(tour_id);
CREATE INDEX idx_inventory_transactions_show_id ON public.inventory_transactions(show_id);
CREATE INDEX idx_tour_sales_show_id ON public.tour_sales(show_id);
CREATE INDEX idx_tour_sales_variant_id ON public.tour_sales(product_variant_id);
CREATE INDEX idx_tour_sales_date ON public.tour_sales(sale_date);
CREATE INDEX idx_venue_night_totals_show_id ON public.venue_night_totals(show_id);
CREATE INDEX idx_inventory_snapshots_date_type ON public.inventory_snapshots(snapshot_date, snapshot_type);
CREATE INDEX idx_inventory_snapshots_variant_id ON public.inventory_snapshots(product_variant_id);
CREATE INDEX idx_sales_orders_variant_id ON public.sales_orders(product_variant_id);
CREATE INDEX idx_sales_orders_sku ON public.sales_orders(sku);
CREATE INDEX idx_sales_orders_date ON public.sales_orders(order_date);

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

-- Create RLS policies (allowing all operations for authenticated users)
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

-- Add triggers for updated_at columns
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_pricing_updated_at BEFORE UPDATE ON public.product_pricing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_metadata_updated_at BEFORE UPDATE ON public.product_metadata FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_states_updated_at BEFORE UPDATE ON public.inventory_states FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tour_blocks_updated_at BEFORE UPDATE ON public.tour_blocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- Master inventory view showing all states in columns
CREATE OR REPLACE VIEW public.master_inventory_view AS
SELECT
  pv.id as variant_id,
  p.title as product_name,
  p.type as product_type,
  pv.sku,
  pv.variant_name,
  pv.option1_value as size,
  pv.option2_value as color,
  COALESCE(SUM(CASE WHEN ist.state = 'warehouse' THEN ist.quantity ELSE 0 END), 0) as warehouse_qty,
  COALESCE(SUM(CASE WHEN ist.state = 'transfer' THEN ist.quantity ELSE 0 END), 0) as transfer_qty,
  COALESCE(SUM(CASE WHEN ist.state = 'tour_start' THEN ist.quantity ELSE 0 END), 0) as tour_start_qty,
  COALESCE(SUM(CASE WHEN ist.state = 'venue' THEN ist.quantity ELSE 0 END), 0) as venue_qty,
  COALESCE(SUM(CASE WHEN ist.state = 'tour' THEN ist.quantity ELSE 0 END), 0) as tour_qty,
  COALESCE(SUM(ist.quantity), 0) as total_qty,
  MAX(ist.updated_at) as last_updated
FROM public.product_variants pv
JOIN public.products p ON p.id = pv.product_id
LEFT JOIN public.inventory_states ist ON ist.product_variant_id = pv.id
GROUP BY pv.id, p.title, p.type, pv.sku, pv.variant_name, pv.option1_value, pv.option2_value
ORDER BY p.title, pv.variant_name;

-- Product pricing view showing all price types with source
CREATE OR REPLACE VIEW public.product_pricing_view AS
SELECT
  pv.id as variant_id,
  p.title as product_name,
  pv.sku,
  pv.variant_name,
  pp.price_type,
  pp.amount,
  pp.source,
  pp.effective_from,
  pp.effective_to
FROM public.product_variants pv
JOIN public.products p ON p.id = pv.product_id
LEFT JOIN public.product_pricing pp ON pp.product_variant_id = pv.id
WHERE pp.effective_to IS NULL OR pp.effective_to >= CURRENT_DATE
ORDER BY p.title, pv.variant_name, pp.price_type;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.products IS 'Master product catalog without variants';
COMMENT ON TABLE public.product_variants IS 'Product variants (sizes, colors, etc.)';
COMMENT ON TABLE public.product_identifiers IS 'Maps multiple SKUs/IDs to product variants for cross-system matching';
COMMENT ON TABLE public.product_pricing IS 'Multi-source pricing with effective dates for historical tracking';
COMMENT ON TABLE public.product_metadata IS 'Custom metadata fields (PRIMARY value-add) including costs, suppliers, purchasing info';
COMMENT ON TABLE public.inventory_states IS 'Current inventory quantities by state (warehouse, transfer, tour_start, venue, tour)';
COMMENT ON TABLE public.inventory_transactions IS 'Complete audit trail of all inventory movements';
COMMENT ON TABLE public.tour_sales IS 'Detailed tour sales by show and product (from Atvenue)';
COMMENT ON TABLE public.venue_night_totals IS 'Nightly total receipts by venue (from Atvenue)';
COMMENT ON TABLE public.inventory_snapshots IS 'Historical snapshots for tracking inventory over time (daily, tour_block, monthly)';
COMMENT ON TABLE public.tour_blocks IS 'Tour date groupings (e.g., East Coast Run)';
