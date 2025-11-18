# Lovable Agent Instructions

This file contains instructions for the Lovable agent to execute deployment and integration tasks.

---

## 2025-11-18: Master Merch Inventory System - Data Import Setup

### Context
The master merch inventory system has been fully developed locally with:
- Complete database schema (12 tables, 2 views) ✅ Already migrated in Lovable
- Data import services for CSV files ✅ Already in codebase
- Master Inventory View UI ✅ Already in codebase
- Import Data page with one-click import ✅ Already in codebase

**Current Status**: The database schema is migrated, but the database is empty. Users need to import data from CSV files in the assets folder.

### What You Need to Do

#### 1. Verify the Import Data Page is Live

Navigate to `/import` in the Lovable preview and verify:
- The "Import Data" page loads correctly
- It shows the "Start Import" button
- It's accessible from the sidebar under "Merch Management"

#### 2. Test the Import Functionality

Click the "Start Import" button on the `/import` page. It should:
1. Fetch CSV files from `/assets/Ambient Inks/` directory
2. Import products and variants from the product catalog CSV
3. Import sales orders from the sales report CSV
4. Display progress messages and results
5. Show final data counts

**Expected Results**:
- Products created: ~50-100 (varies by catalog)
- Variants created: ~300-500 (varies by catalog)
- Sales orders created: ~50+ (varies by report)

#### 3. Verify Master Inventory View

After import completes, navigate to `/master-inventory` and verify:
- Products are displayed in the table
- Inventory quantities show in state columns (Warehouse, Transfer, Tour Start, Venue, Tour)
- Search and filtering work
- CSV export button works
- Summary cards show correct totals

#### 4. Troubleshooting

If import fails, check:

**Assets Files Accessible?**
- Verify files exist at these paths:
  - `/assets/Ambient Inks/Master Product List/11-17-25 Products-Export.csv`
  - `/assets/Ambient Inks/Reports/Ambient Inks-Report-2025-11-18T01_48_02+00_00.csv`

**Supabase Connection?**
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly in environment variables
- Verify the migration ran successfully (check Supabase dashboard for tables)

**Import Errors?**
- Check browser console for detailed error messages
- Check Supabase logs for database errors
- Verify RLS policies allow authenticated users to insert data

#### 5. Alternative: Manual SQL Import

If the UI import doesn't work, you can import manually via Supabase SQL editor:

```sql
-- This is a fallback option if the UI import fails
-- You would need to convert CSV data to SQL INSERT statements
-- Not recommended unless UI import is completely broken
```

#### 6. Verification Queries

After successful import, run these in Supabase SQL editor to verify:

```sql
-- Check products
SELECT COUNT(*) as product_count FROM products;

-- Check variants
SELECT COUNT(*) as variant_count FROM product_variants;

-- Check inventory view
SELECT * FROM master_inventory_view LIMIT 10;

-- Check inventory states
SELECT
  state,
  COUNT(*) as variant_count,
  SUM(quantity) as total_qty
FROM inventory_states
GROUP BY state;

-- Check sales orders
SELECT COUNT(*) as sales_count FROM sales_orders;
```

**Expected Results**:
- `products`: 50-100 rows
- `product_variants`: 300-500 rows
- `master_inventory_view`: Should show products with inventory quantities
- `inventory_states`: Should show quantities in 'warehouse' and possibly 'tour' states
- `sales_orders`: 50+ rows

#### 7. Success Criteria

✅ Import Data page is accessible at `/import`
✅ "Start Import" button successfully imports CSV data
✅ No errors in browser console or Supabase logs
✅ Master Inventory View at `/master-inventory` shows imported products
✅ Inventory quantities display correctly in state columns
✅ Search and filter functionality works
✅ Summary cards show correct totals

### Next Steps After Success

Once import is verified working:

1. **User can import data** by clicking "Start Import" on `/import` page
2. **User can view inventory** at `/master-inventory`
3. **User can search/filter** products by name, SKU, or variant
4. **User can export** inventory to CSV
5. **User can see** inventory split across states (warehouse, transfer, tour, etc.)

### Files Involved

- `src/pages/ImportData.tsx` - Import page with one-click import button
- `src/pages/MasterInventory.tsx` - Master inventory dashboard
- `src/services/import/ambientInksProductImporter.ts` - Product import logic
- `src/services/import/ambientInksSalesImporter.ts` - Sales import logic
- `src/services/import/csvParser.ts` - CSV parsing utilities
- `src/services/import/skuMatcher.ts` - SKU matching across sources
- `src/types/merch.ts` - TypeScript type definitions
- `assets/Ambient Inks/` - CSV data files to import

### Documentation References

For more details, see:
- `DEVELOPMENT_SUMMARY.md` - Complete system overview
- `IMPORT_GUIDE.md` - Detailed import instructions
- `MERCH_SYSTEM_README.md` - System architecture
- `MIGRATION_HANDOFF.md` - Database migration details

---

**Date Created**: 2025-11-18
**Created By**: Claude Code (Local Development)
**Status**: Pending Lovable Agent Execution
**Priority**: High - Needed to populate database with initial data

---

## Completion Checklist

When you've completed these tasks, update this section:

- [ ] Import Data page verified accessible at `/import`
- [ ] "Start Import" button tested and working
- [ ] Products successfully imported to database
- [ ] Sales orders successfully imported to database
- [ ] Master Inventory View displays data correctly
- [ ] Search and filter functionality verified
- [ ] CSV export tested
- [ ] No errors in browser console
- [ ] No errors in Supabase logs
- [ ] Verification queries run successfully

**Completed By**: _____________
**Date Completed**: _____________
**Notes**: _____________
