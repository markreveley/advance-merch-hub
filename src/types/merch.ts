// TypeScript types for the Master Merch Inventory System
// These types match the database schema defined in the migration

export type InventoryState = 'warehouse' | 'transfer' | 'tour_start' | 'venue' | 'tour';
export type TransactionType = 'sale' | 'transfer' | 'adjustment' | 'comp' | 'shipment';
export type PriceType = 'retail' | 'wholesale' | 'tour' | 'compare_at';
export type SnapshotType = 'daily' | 'tour_block' | 'monthly';
export type DataSource = 'ambient_inks' | 'atvenue' | 'internal' | 'manual';

// ============================================================================
// PRODUCT MANAGEMENT
// ============================================================================

export interface Product {
  id: string;
  handle: string;
  title: string;
  description?: string;
  vendor?: string;
  type?: string; // "T-Shirt", "Poster", "Sweatshirt", etc.
  tags?: string[];
  image_urls?: string[];
  published: boolean;
  ambient_inks_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  variant_name?: string;
  option1_name?: string;
  option1_value?: string;
  option2_name?: string;
  option2_value?: string;
  option3_name?: string;
  option3_value?: string;
  weight?: number;
  weight_unit?: string;
  barcode?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductIdentifier {
  id: string;
  product_variant_id: string;
  identifier_type: string; // "ambient_inks_sku", "atvenue_sku", "internal_sku"
  identifier_value: string;
  source: DataSource;
  created_at: string;
}

// ============================================================================
// PRICING
// ============================================================================

export interface ProductPricing {
  id: string;
  product_variant_id: string;
  price_type: PriceType;
  amount: number;
  source: DataSource;
  effective_from: string;
  effective_to?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CUSTOM METADATA (PRIMARY VALUE-ADD)
// ============================================================================

export interface ProductMetadata {
  id: string;
  product_variant_id: string;
  category?: string;
  supplier_manufacturer?: string;
  date_purchased?: string;
  units_purchased?: number;
  printing_manufacturing_cost?: number;
  packaging_shipping_cost?: number;
  wholesale_cost_per_unit?: number;
  tax_paid?: number;
  additional_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// INVENTORY STATE MANAGEMENT
// ============================================================================

export interface InventoryState {
  id: string;
  product_variant_id: string;
  state: InventoryState;
  quantity: number;
  tour_id?: string;
  location_details?: string;
  last_counted_at?: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  product_variant_id: string;
  transaction_type: TransactionType;
  from_state?: InventoryState;
  to_state?: InventoryState;
  quantity: number;
  tour_id?: string;
  show_id?: string;
  transaction_date: string;
  source: DataSource;
  notes?: string;
  created_at: string;
}

// ============================================================================
// TOUR SALES
// ============================================================================

export interface TourSale {
  id: string;
  show_id: string;
  product_variant_id?: string;
  quantity_sold: number;
  is_comp: boolean;
  unit_price?: number;
  gross_revenue?: number;
  sale_date: string;
  source: DataSource;
  source_data?: Record<string, any>;
  created_at: string;
}

export interface VenueNightTotal {
  id: string;
  show_id?: string;
  total_receipts: number;
  total_fees: number;
  net_receipts: number;
  sale_date: string;
  source: string;
  created_at: string;
}

// ============================================================================
// HISTORICAL TRACKING
// ============================================================================

export interface TourBlock {
  id: string;
  tour_id: string;
  block_name: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface InventorySnapshot {
  id: string;
  snapshot_date: string;
  snapshot_type: SnapshotType;
  product_variant_id: string;
  state: InventoryState;
  quantity: number;
  tour_id?: string;
  created_at: string;
}

// ============================================================================
// SALES ORDERS (AMBIENT INKS)
// ============================================================================

export interface SalesOrder {
  id: string;
  order_number: number;
  order_date: string;
  product_name: string;
  product_variant_id?: string;
  sku?: string;
  quantity: number;
  gross_sales: number;
  discounts: number;
  net_sales: number;
  commission: number;
  deduction: number;
  payout: number;
  source: string;
  created_at: string;
}

// ============================================================================
// VIEWS
// ============================================================================

export interface MasterInventoryView {
  variant_id: string;
  product_name: string;
  product_type?: string;
  sku: string;
  variant_name?: string;
  size?: string;
  color?: string;
  warehouse_qty: number;
  transfer_qty: number;
  tour_start_qty: number;
  venue_qty: number;
  tour_qty: number;
  total_qty: number;
  last_updated?: string;
}

export interface ProductPricingView {
  variant_id: string;
  product_name: string;
  sku: string;
  variant_name?: string;
  price_type: PriceType;
  amount: number;
  source: DataSource;
  effective_from: string;
  effective_to?: string;
}

// ============================================================================
// COMPOSITE TYPES FOR UI
// ============================================================================

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

export interface ProductVariantWithDetails extends ProductVariant {
  product: Product;
  identifiers: ProductIdentifier[];
  pricing: ProductPricing[];
  metadata?: ProductMetadata;
  inventory_states: InventoryState[];
}

export interface InventoryStateWithProduct extends InventoryState {
  product_variant: ProductVariant;
  product: Product;
}

// ============================================================================
// IMPORT DATA TYPES
// ============================================================================

export interface AmbientInksProductImport {
  _id: string;
  Handle: string;
  Title: string;
  Description: string;
  Vendor: string;
  Type: string;
  Published: string;
  'Option1 Name': string;
  'Option1 Value': string;
  'Option2 Name': string;
  'Option2 Value': string;
  'Option3 Name': string;
  'Option3 Value': string;
  'Variant SKU': string;
  'Variant Weight': string;
  'Variant Weight Unit': string;
  'Variant Price': string;
  'Variant Compare At Price': string;
  'Cost Per Item': string;
  'Track Quantity': string;
  'Inventory Location: eCommerce Inventory': string;
  'Inventory Location: Tour Inventory': string;
  Tags: string;
  'Image Src': string;
}

export interface AmbientInksSalesImport {
  'Order #': string;
  'Order Date': string;
  Name: string;
  'Product ID': string;
  SKU: string;
  QTY: string;
  'Gross Sales': string;
  Discounts: string;
  'Net sales': string;
  Commission: string;
  Deduction: string;
  Payout: string;
}

export interface AtvenueSalesImport {
  SKU: string;
  Name: string;
  Type: string;
  Sex: string;
  Size: string;
  Sold: string;
  'Unit % of Total': string;
  Comp: string;
  'Avg. Price': string;
  'Gross Rev': string;
  '% of Total': string;
}

export interface AtvenueNightTotalsImport {
  Date: string;
  Venue: string;
  'City, St': string;
  'Total Receipts': string;
  'Total Fees': string;
  'Net Receipts': string;
}

export interface DirtwireMerchMetadataImport {
  Item: string;
  Category: string;
  SKU: string;
  'Supplier/Manufacturer': string;
  'Date Purchased': string;
  'Units Purchased': string;
  'Printing/Manufacturing Cost': string;
  'Packaging/Shipping Cost': string;
  'Wholesale Cost per Unit (no tax)': string;
  'Tax Paid': string;
}
