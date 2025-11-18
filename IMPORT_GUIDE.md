# Data Import Guide

This guide explains how to import merch data from the assets directory into the database.

## Import Order

**IMPORTANT**: Always import in this order:

1. **Ambient Inks Products** - Creates base products and variants
2. **Dirtwire Metadata** (when implemented) - Adds custom metadata
3. **Ambient Inks Sales** - Online sales
4. **Atvenue Totals** - Creates shows and venue night totals
5. **Atvenue Sales** - Tour sales by show

## Import Services

### 1. Ambient Inks Product Import

**File**: `assets/Ambient Inks/Master Product List/11-17-25 Products-Export.csv`

**What it creates**:
- Products (base products)
- Product Variants (sizes, colors)
- Product Identifiers (for SKU matching)
- Product Pricing (retail and compare-at prices)
- Initial Inventory States (warehouse and tour inventory)

**Usage**:
```typescript
import { importAmbientInksProducts } from '@/services/import/ambientInksProductImporter';

// Read the CSV file content
const csvContent = await fetch('/assets/Ambient Inks/Master Product List/11-17-25 Products-Export.csv').then(r => r.text());

// Import
const result = await importAmbientInksProducts(csvContent);

console.log(`Created ${result.productsCreated} products, ${result.variantsCreated} variants`);
console.log(`Errors: ${result.errors.length}, Warnings: ${result.warnings.length}`);
```

### 2. Ambient Inks Sales Import

**File**: `assets/Ambient Inks/Reports/Ambient Inks-Report-2025-11-18T01_48_02+00_00.csv`

**What it creates**:
- Sales Orders
- Inventory Transactions (sales from warehouse)
- Updates inventory states

**Usage**:
```typescript
import { importAmbientInksSales } from '@/services/import/ambientInksSalesImporter';

const csvContent = await fetch('/assets/Ambient Inks/Reports/Ambient Inks-Report-2025-11-18T01_48_02+00_00.csv').then(r => r.text());

const result = await importAmbientInksSales(csvContent);

console.log(`Created ${result.ordersCreated} orders, ${result.transactionsCreated} transactions`);
```

### 3. Atvenue Totals Import

**File**: `assets/Atvenu/Tour Totals/Register_Payments_dirtwire_floozwire-tour.csv`

**What it creates**:
- Shows (if not exist)
- Venue Night Totals

**Required**: You must first create a tour in the database

**Usage**:
```typescript
import { importAtvenueTotals } from '@/services/import/atvenueTotalsImporter';

// First, create or get a tour
const { data: tour } = await supabase
  .from('tours')
  .insert({
    name: 'Floozwire Tour',
    start_date: '2025-09-12',
    end_date: '2025-12-13',
    status: 'active'
  })
  .select('id')
  .single();

// Then import totals
const csvContent = await fetch('/assets/Atvenu/Tour Totals/Register_Payments_dirtwire_floozwire-tour.csv').then(r => r.text());

const result = await importAtvenueTotals(csvContent, {
  tourId: tour.id,
  tourName: 'Floozwire Tour'
});

console.log(`Created ${result.showsCreated} shows, ${result.totalsCreated} venue totals`);
```

### 4. Atvenue Sales Import

**File**: `assets/Atvenu/Sales Report/dirtwire_Sales-Report_floozwire-tour-for-10-04-2025.csv`

**What it creates**:
- Tour Sales (by show and product)
- Inventory Transactions (sales from tour)
- Updates tour inventory states

**Required**: Shows must exist (created by Atvenue Totals import)

**Usage**:
```typescript
import { importAtvenueSales } from '@/services/import/atvenueSalesImporter';

// Get the tour
const { data: tour } = await supabase
  .from('tours')
  .select('id')
  .eq('name', 'Floozwire Tour')
  .single();

// Get a show (or use specific show ID)
const { data: show } = await supabase
  .from('shows')
  .select('id')
  .eq('tour_id', tour.id)
  .eq('show_date', '2025-10-04')
  .single();

const csvContent = await fetch('/assets/Atvenu/Sales Report/dirtwire_Sales-Report_floozwire-tour-for-10-04-2025.csv').then(r => r.text());

const result = await importAtvenueSales(csvContent, {
  tourId: tour.id,
  showId: show.id,
  saleDate: '2025-10-04'
});

console.log(`Created ${result.salesCreated} sales, ${result.transactionsCreated} transactions`);
```

## Using the Browser Console

Since the assets are in the repository, you can import directly from the browser console:

1. Open the app in your browser
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Run the import commands above

Example full workflow:

```javascript
// 1. Import products first
const productsCsv = await fetch('/assets/Ambient Inks/Master Product List/11-17-25 Products-Export.csv').then(r => r.text());
const { importAmbientInksProducts } = await import('./src/services/import/ambientInksProductImporter.ts');
const productsResult = await importAmbientInksProducts(productsCsv);
console.log('Products:', productsResult);

// 2. Import sales
const salesCsv = await fetch('/assets/Ambient Inks/Reports/Ambient Inks-Report-2025-11-18T01_48_02+00_00.csv').then(r => r.text());
const { importAmbientInksSales } = await import('./src/services/import/ambientInksSalesImporter.ts');
const salesResult = await importAmbientInksSales(salesCsv);
console.log('Sales:', salesResult);

// ... etc
```

## Verification

After importing, verify your data:

### Check Products
```sql
SELECT COUNT(*) as product_count FROM products;
SELECT COUNT(*) as variant_count FROM product_variants;
```

### Check Inventory
```sql
SELECT * FROM master_inventory_view LIMIT 10;
```

### Check Sales
```sql
SELECT COUNT(*) as sales_count FROM sales_orders;
SELECT COUNT(*) as tour_sales_count FROM tour_sales;
```

### Check Inventory States
```sql
SELECT
  state,
  COUNT(*) as variant_count,
  SUM(quantity) as total_qty
FROM inventory_states
GROUP BY state;
```

## Troubleshooting

### SKU Mismatches

If you see warnings about SKUs not found:
1. Check the `product_identifiers` table
2. Manually create identifier mappings if needed

### Duplicate Records

The importers are designed to skip duplicates:
- Products: checked by `ambient_inks_id`
- Variants: checked by `sku`
- Sales orders: checked by `order_number` + `sku`

### Inventory States

If inventory counts seem wrong:
1. Check `inventory_transactions` for the audit trail
2. Verify the `from_state` and `to_state` in transactions
3. Recalculate states from transactions if needed

## Next Steps

After successful import:
1. Visit `/master-inventory` to see your inventory
2. Create inventory transfers as needed
3. Generate historical snapshots
4. Build reporting dashboards
