# Master Merch Inventory System

## Overview

This system provides comprehensive tracking of merchandise inventory across multiple locations and states, integrating data from Ambient Inks (fulfillment partner) and Atvenue (tour sales platform).

## Key Features

1. **Multi-State Inventory Tracking**: Track inventory across 5 states:
   - `warehouse` - Items in Ambient Inks warehouse
   - `transfer` - Items shipped but not yet received
   - `tour_start` - Items at staging point for tour start
   - `venue` - Items shipped mid-tour to specific venues
   - `tour` - Items in possession of touring party

2. **Multi-Source Data Integration**:
   - Ambient Inks Product Catalog
   - Ambient Inks Sales Reports
   - Atvenue Tour Sales
   - Atvenue Venue Night Totals
   - Custom Dirtwire Metadata (PRIMARY value-add fields)

3. **Historical Tracking**:
   - Daily snapshots
   - Tour block snapshots
   - Monthly snapshots
   - Complete transaction audit trail

4. **Custom Metadata**: Purchasing costs, suppliers, manufacturing details, tax information

## Database Schema

### Core Tables

#### Product Management
- `products` - Master product catalog (without variants)
- `product_variants` - Product variants (sizes, colors, etc.)
- `product_identifiers` - Maps multiple SKUs/IDs across systems
- `product_pricing` - Multi-source pricing with effective dates
- `product_metadata` - Custom metadata (PRIMARY value-add)

#### Inventory Management
- `inventory_states` - Current inventory by state and location
- `inventory_transactions` - Complete audit trail of movements
- `inventory_snapshots` - Historical snapshots

#### Sales & Tours
- `tour_sales` - Detailed tour sales by show and product
- `venue_night_totals` - Nightly total receipts
- `sales_orders` - Online sales from Ambient Inks
- `tour_blocks` - Tour date groupings

### Views

#### `master_inventory_view`
Shows all products with inventory quantities in separate columns for each state:
```sql
SELECT * FROM master_inventory_view;
```

Returns:
- product_name, sku, variant_name, size, color
- warehouse_qty, transfer_qty, tour_start_qty, venue_qty, tour_qty
- total_qty, last_updated

#### `product_pricing_view`
Shows all current pricing with source attribution:
```sql
SELECT * FROM product_pricing_view WHERE sku = 'DIRT001-L';
```

## Migration Instructions

### Step 1: Run Migration in Lovable

1. Go to Lovable dashboard
2. Navigate to Database section
3. Run the migration file: `supabase/migrations/20251118000000_master_merch_inventory_system.sql`
4. Verify all tables are created successfully

### Step 2: Verify Schema

Check that these tables exist:
```sql
-- Products
SELECT * FROM products LIMIT 1;
SELECT * FROM product_variants LIMIT 1;
SELECT * FROM product_identifiers LIMIT 1;
SELECT * FROM product_pricing LIMIT 1;
SELECT * FROM product_metadata LIMIT 1;

-- Inventory
SELECT * FROM inventory_states LIMIT 1;
SELECT * FROM inventory_transactions LIMIT 1;
SELECT * FROM inventory_snapshots LIMIT 1;

-- Sales & Tours
SELECT * FROM tour_sales LIMIT 1;
SELECT * FROM venue_night_totals LIMIT 1;
SELECT * FROM sales_orders LIMIT 1;
SELECT * FROM tour_blocks LIMIT 1;

-- Views
SELECT * FROM master_inventory_view LIMIT 1;
SELECT * FROM product_pricing_view LIMIT 1;
```

### Step 3: Return to Development

After the migration is complete, return to this session to continue with:
1. Data import scripts
2. Master inventory UI
3. Transfer management system
4. Historical reporting

## Data Import Order

When implementing import scripts, process files in this order:

1. **Ambient Inks Master Product List** → `products`, `product_variants`, `product_identifiers`, `product_pricing`, `inventory_states`
2. **Dirtwire Merch Report** → `product_metadata` (PRIMARY custom fields)
3. **Ambient Inks Reports** → `sales_orders`, `inventory_transactions`
4. **Atvenue Sales Report** → `tour_sales`, `inventory_transactions`
5. **Atvenue Tour Totals** → `venue_night_totals`

## Key Design Decisions

1. **Multi-State Columns**: Each product variant shows quantities across all states in the master view
2. **Custom Fields as Primary**: Dirtwire Merch Report fields are the PRIMARY metadata, not secondary
3. **Historical Integrity**: Snapshots + transactions provide complete audit trail
4. **Flexible Identifiers**: Multiple SKUs per product handled via `product_identifiers` table
5. **Source Attribution**: Every price, sale, and transaction tracks its source system
6. **Comp Tracking**: Complementary items tracked same as sales (they reduce inventory)

## Next Steps After Migration

1. Create data import utilities in `src/services/import/`
2. Build master inventory view component in `src/pages/MasterInventory.tsx`
3. Implement state transfer system
4. Create historical snapshot generation
5. Build reporting dashboards

## TypeScript Types

All TypeScript types are defined in `src/types/merch.ts` and match the database schema exactly.

## Questions?

If you encounter any issues with the migration or need clarification on the schema design, please ask.
