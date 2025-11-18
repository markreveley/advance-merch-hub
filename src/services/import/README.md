# Data Import Services

This directory contains utilities for importing merch data from various sources.

## Import Scripts

### 1. `ambientInksProductImporter.ts`
Imports product catalog from Ambient Inks Master Product List CSV.

**Source File**: `assets/Ambient Inks/Master Product List/11-17-25 Products-Export.csv`

**Creates**:
- Products
- Product Variants
- Product Identifiers
- Product Pricing (retail, compare_at prices)
- Initial Inventory States (warehouse, tour inventory)

### 2. `dirtwireMerchMetadataImporter.ts`
Imports custom metadata from Dirtwire Merch Report Excel.

**Source File**: `assets/Overview/Dirtwire Merch Report (Laura numbers export).xlsx`

**Creates**:
- Product Metadata (PRIMARY value-add fields)
  - Purchasing costs
  - Supplier information
  - Manufacturing costs
  - Tax paid
  - Custom categorization

### 3. `ambientInksSalesImporter.ts`
Imports online sales data from Ambient Inks Reports.

**Source File**: `assets/Ambient Inks/Reports/Ambient Inks-Report-*.csv`

**Creates**:
- Sales Orders
- Inventory Transactions (sales from warehouse)

### 4. `atvenueSalesImporter.ts`
Imports tour sales data from Atvenue Sales Report.

**Source File**: `assets/Atvenu/Sales Report/dirtwire_Sales-Report_*.csv`

**Creates**:
- Tour Sales
- Inventory Transactions (sales from tour)

### 5. `atvenueTotalsImporter.ts`
Imports venue night totals from Atvenue Tour Totals.

**Source File**: `assets/Atvenu/Tour Totals/Register_Payments_*.csv`

**Creates**:
- Venue Night Totals

## Usage

```typescript
import { importAmbientInksProducts } from './services/import/ambientInksProductImporter';
import { importDirtwireMerchMetadata } from './services/import/dirtwireMerchMetadataImporter';

// Run imports in order
await importAmbientInksProducts('assets/Ambient Inks/Master Product List/11-17-25 Products-Export.csv');
await importDirtwireMerchMetadata('assets/Overview/Dirtwire Merch Report (Laura numbers export).xlsx');
// ... etc
```

## Import Order

IMPORTANT: Always run imports in this order:

1. Ambient Inks Products (creates base products and variants)
2. Dirtwire Merch Metadata (adds custom fields)
3. Ambient Inks Sales (online sales)
4. Atvenue Sales (tour sales)
5. Atvenue Totals (venue night totals)

## SKU Matching Strategy

When importing, match products across systems using this hierarchy:

1. Exact SKU match in `product_variants.sku`
2. SKU match in `product_identifiers.identifier_value`
3. Create new identifier mapping if product exists but SKU is different
4. Create new product variant if no match found

## Common Utilities

### `csvParser.ts`
Utility functions for parsing CSV files.

### `excelParser.ts`
Utility functions for parsing Excel files using openpyxl.

### `skuMatcher.ts`
Intelligent SKU matching across different data sources.

### `transactionLogger.ts`
Creates inventory transactions from sales data.
