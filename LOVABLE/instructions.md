# Lovable Agent Instructions

**Date**: 2025-11-18
**Issue**: Master Inventory showing only 15 items instead of expected ~899 variants
**Status**: Requires diagnosis and fix by Lovable agent

---

## Current Situation

The master merch inventory system has been deployed with:
- ✅ Complete database schema (12 tables, 2 views) migrated
- ✅ Import services for CSV files in codebase
- ✅ UI pages (Products, Inventory, Master Inventory) updated for new schema
- ✅ Database Diagnostics page at `/diagnostics`
- ❌ **PROBLEM**: Master Inventory only shows 15 items instead of ~899 expected

**Your Mission**: Diagnose why only 15 items are showing and fix the issue.

---

## Step 1: Run Diagnostic Queries

Execute these SQL queries in Supabase SQL Editor to determine the actual state of the database:

```sql
-- Query 1: Count all tables
SELECT
  (SELECT COUNT(*) FROM products) as product_count,
  (SELECT COUNT(*) FROM product_variants) as variant_count,
  (SELECT COUNT(*) FROM inventory_states) as inventory_state_count,
  (SELECT COUNT(*) FROM product_pricing) as pricing_count,
  (SELECT COUNT(*) FROM sales_orders) as sales_count,
  (SELECT COUNT(*) FROM master_inventory_view) as master_view_count;

-- Query 2: Check CSV file line count (if accessible)
-- The CSV should have ~900 lines (899 variants + 1 header)

-- Query 3: Sample the data
SELECT * FROM products LIMIT 5;
SELECT * FROM product_variants LIMIT 10;
SELECT * FROM master_inventory_view LIMIT 20;
```

**Expected Results**:
- `products`: 50-150 rows
- `product_variants`: ~899 rows
- `inventory_states`: ~899+ rows (multiple states per variant)
- `master_inventory_view`: ~899 rows

---

## Step 2: Diagnose the Problem

Based on diagnostic query results, determine the issue:

### Scenario A: Only 15 variants exist in database
**Symptom**: `variant_count = 15` in Query 1
**Root Cause**: Import failed or timed out partway through
**Action**: Go to **Step 3A: Fix Import Process**

### Scenario B: All variants exist but Master Inventory shows 15
**Symptom**: `variant_count = 899` but UI shows only 15 items
**Root Cause**: Query has implicit LIMIT or view is broken
**Action**: Go to **Step 3B: Fix Query/View**

### Scenario C: View count doesn't match variant count
**Symptom**: `variant_count = 899` but `master_view_count = 15`
**Root Cause**: View definition issue or missing joins
**Action**: Go to **Step 3C: Fix View Definition**

---

## Step 3A: Fix Import Process (Import Failed Scenario)

If only 15 variants were imported, the import likely timed out. Fix by implementing batch processing:

### Option A1: Increase Timeout and Retry

1. Check browser console logs for timeout errors
2. Clear database and retry import with longer timeout
3. If timeout persists, proceed to Option A2

### Option A2: Manual SQL Import (Recommended)

Since the CSV import is timing out, import directly via SQL:

```sql
-- This approach bypasses the timeout issue by running server-side

-- Step 1: Clear existing data (if partial import exists)
TRUNCATE inventory_states, product_pricing, product_identifiers, product_variants, products CASCADE;

-- Step 2: You'll need to convert the CSV data to SQL INSERT statements
-- The CSV is at: /assets/Ambient Inks/Master Product List/11-17-25 Products-Export.csv
--
-- IMPORTANT: Since you can't directly parse CSV in SQL editor, you have two options:
--
-- Option 1: Use Supabase Dashboard CSV Import
--   - Go to Supabase Dashboard → Table Editor
--   - Select 'products' table → Import data → Upload CSV
--   - Repeat for product_variants, product_pricing, inventory_states
--
-- Option 2: Generate SQL via code
--   - Create a script that reads the CSV and outputs SQL INSERT statements
--   - Run the generated SQL in Supabase SQL Editor
```

### Option A3: Fix Import Code to Batch Process

Create a new file `src/services/import/batchImporter.ts`:

```typescript
// Batch CSV import to avoid timeouts
import { supabase } from '@/integrations/supabase/client';
import { parseCSV } from './csvParser';
import type { AmbientInksProductImport } from '@/types/merch';

const BATCH_SIZE = 50; // Process 50 rows at a time

export async function importAmbientInksProductsBatched(csvContent: string) {
  const rows = parseCSV<AmbientInksProductImport>(csvContent);
  const productGroups = new Map<string, AmbientInksProductImport[]>();

  // Group by product
  rows.forEach(row => {
    if (!productGroups.has(row._id)) {
      productGroups.set(row._id, []);
    }
    productGroups.get(row._id)!.push(row);
  });

  const productIds = Array.from(productGroups.keys());
  const batches = [];

  for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
    batches.push(productIds.slice(i, i + BATCH_SIZE));
  }

  console.log(`Processing ${productGroups.size} products in ${batches.length} batches`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`Processing batch ${i + 1}/${batches.length}...`);

    for (const productId of batch) {
      const variants = productGroups.get(productId)!;
      // Import logic here (copy from ambientInksProductImporter.ts)
    }

    // Small delay between batches to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

Then update `src/pages/ImportData.tsx` to use the batched importer.

---

## Step 3B: Fix Query/View (All Data Exists Scenario)

If all 899 variants exist but UI only shows 15, check for query limits:

### Check 1: Verify master_inventory_view returns all rows

```sql
-- This should return ~899
SELECT COUNT(*) FROM master_inventory_view;

-- If it returns 15, the view is broken
-- If it returns 899, the problem is in the UI query
```

### Check 2: Inspect MasterInventory.tsx query

The file `src/pages/MasterInventory.tsx` should have NO LIMIT clause. Check line 38:

```typescript
// CORRECT (no limit):
let query = supabase
  .from('master_inventory_view')
  .select('*')
  .order('product_name', { ascending: true });

// WRONG (has limit):
let query = supabase
  .from('master_inventory_view')
  .select('*')
  .limit(15)  // ❌ REMOVE THIS
  .order('product_name', { ascending: true });
```

If a LIMIT exists, remove it and redeploy.

### Check 3: Verify no pagination is cutting off results

Check if TanStack Query has a default limit. In `MasterInventory.tsx`, ensure the query has no hidden limits.

---

## Step 3C: Fix View Definition (View Broken Scenario)

If `master_inventory_view` returns fewer rows than `product_variants`, the view definition is broken.

### Rebuild the view:

```sql
-- Drop and recreate the view
DROP VIEW IF EXISTS public.master_inventory_view;

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

-- Verify it returns all variants
SELECT COUNT(*) FROM master_inventory_view;
-- Should return ~899
```

---

## Step 4: Verify the Fix

After implementing the fix, run these verification queries:

```sql
-- Verify counts match
SELECT
  (SELECT COUNT(*) FROM product_variants) as variant_count,
  (SELECT COUNT(*) FROM master_inventory_view) as view_count;
-- Both should be ~899

-- Sample the data
SELECT * FROM master_inventory_view LIMIT 20;

-- Check state distribution
SELECT
  state,
  COUNT(DISTINCT product_variant_id) as variant_count,
  SUM(quantity) as total_qty
FROM inventory_states
GROUP BY state;
```

**Expected Results**:
- variant_count = view_count = ~899
- master_inventory_view returns diverse products with inventory quantities
- inventory_states shows variants across warehouse and tour states

---

## Step 5: Test in UI

After fixing, verify in the Lovable preview:

1. Navigate to `/diagnostics` - should show ~899 variants, no alerts
2. Navigate to `/master-inventory` - should show all ~899 items
3. Navigate to `/products` - should show all products with variants
4. Search and filter should work correctly

---

## Common Issues and Solutions

### Issue: "Failed to fetch CSV file"
**Solution**: Verify assets folder is deployed with the app. Files should be in `public/assets/` or accessible via `/assets/` URL.

### Issue: "RLS policy violation"
**Solution**: Ensure RLS policies allow INSERT/SELECT on all tables. Run:
```sql
-- Temporarily disable RLS for import (re-enable after)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_pricing DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_states DISABLE ROW LEVEL SECURITY;

-- Re-enable after import
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_states ENABLE ROW LEVEL SECURITY;
```

### Issue: "Import succeeds but data doesn't appear"
**Solution**: Check for duplicate key conflicts. Run:
```sql
-- Check for duplicate SKUs
SELECT sku, COUNT(*)
FROM product_variants
GROUP BY sku
HAVING COUNT(*) > 1;

-- If duplicates exist, clear and re-import
TRUNCATE product_variants CASCADE;
```

---

## Success Criteria

✅ Diagnostic queries show ~899 variants in `product_variants` table
✅ `master_inventory_view` returns ~899 rows
✅ `/diagnostics` page shows no alerts about incomplete import
✅ `/master-inventory` displays all ~899 items in table
✅ `/products` shows all products with variants and pricing
✅ Search and filter work correctly
✅ No errors in browser console or Supabase logs

---

## Completion Report

After completing the fix, document what you did:

**Issue Diagnosed**: [Scenario A/B/C]
**Root Cause**: [Brief description]
**Fix Applied**: [What you changed]
**Verification**: [Results of verification queries]
**Final Counts**:
  - Products: ___
  - Variants: ___
  - Master Inventory View: ___

**Status**: ✅ Fixed / ❌ Still needs work
**Date**: _______
**Notes**: _______

---

## Reference Files

Key files for this task:
- `src/pages/MasterInventory.tsx` - Main inventory view UI
- `src/pages/DatabaseDiagnostics.tsx` - Diagnostic page
- `src/services/import/ambientInksProductImporter.ts` - Import logic
- `supabase/migrations/20251118000000_master_merch_inventory_system.sql` - View definitions
- `/assets/Ambient Inks/Master Product List/11-17-25 Products-Export.csv` - Source data (~900 lines)
