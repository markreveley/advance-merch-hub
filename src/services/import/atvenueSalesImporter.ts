// Atvenue Sales Importer
// Imports tour sales data from Atvenue Sales Report

import { supabase } from '@/integrations/supabase/client';
import { parseCSV, parseNumeric, parseInteger } from './csvParser';
import { findVariantBySku } from './skuMatcher';
import type { AtvenueSalesImport } from '@/types/merch';

export interface ImportResult {
  success: boolean;
  salesCreated: number;
  transactionsCreated: number;
  errors: string[];
  warnings: string[];
  tourId?: string;
}

export interface ImportOptions {
  tourId: string; // Required: which tour these sales belong to
  showId?: string; // Optional: specific show (if not provided, will try to match or create)
  tourName?: string; // Optional: for creating tour if needed
  saleDate?: string; // Optional: date of sales (for matching/creating show)
}

export async function importAtvenueSales(
  csvContent: string,
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    salesCreated: 0,
    transactionsCreated: 0,
    errors: [],
    warnings: [],
    tourId: options.tourId,
  };

  try {
    // Parse CSV - skip header rows
    const rows = parseCSV<AtvenueSalesImport>(csvContent);

    if (rows.length === 0) {
      result.errors.push('No data found in CSV file');
      return result;
    }

    // Filter out summary rows (SUBTOTAL, etc.)
    const dataRows = rows.filter(
      row => row.Name && !row.Name.includes('SUBTOTAL') && !row.Name.includes('TOTAL')
    );

    console.log(`Processing ${dataRows.length} sales items from Atvenue...`);

    // Get or create tour
    const { data: tour } = await supabase
      .from('tours')
      .select('id')
      .eq('id', options.tourId)
      .single();

    if (!tour) {
      result.errors.push(`Tour not found: ${options.tourId}`);
      return result;
    }

    // Get show ID (use provided or try to find one for the tour)
    let showId = options.showId;

    if (!showId) {
      // Try to find the first show for this tour
      const { data: shows } = await supabase
        .from('shows')
        .select('id')
        .eq('tour_id', options.tourId)
        .order('show_date', { ascending: true })
        .limit(1);

      if (shows && shows.length > 0) {
        showId = shows[0].id;
        result.warnings.push(`No show ID provided, using first show of tour: ${showId}`);
      } else {
        result.errors.push('No show ID provided and no shows found for tour');
        return result;
      }
    }

    // Process each sales item
    for (const row of dataRows) {
      try {
        await importSalesItem(showId, row, result);
      } catch (error) {
        const errorMsg = `Error importing sales item ${row.Name}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    result.success = result.errors.length === 0;

    console.log('Atvenue sales import complete:', {
      salesCreated: result.salesCreated,
      transactionsCreated: result.transactionsCreated,
      errors: result.errors.length,
      warnings: result.warnings.length,
    });

    return result;
  } catch (error) {
    result.errors.push(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }
}

async function importSalesItem(
  showId: string,
  row: AtvenueSalesImport,
  result: ImportResult
): Promise<void> {
  const sku = row.SKU;
  const quantitySold = parseInteger(row.Sold) || 0;
  const compQty = parseInteger(row.Comp) || 0;
  const totalQty = quantitySold + compQty;

  if (totalQty === 0) {
    // Skip items with no sales
    return;
  }

  // Find product variant
  let variantId: string | null = null;

  if (sku) {
    const match = await findVariantBySku(sku, 'atvenue');
    variantId = match.variantId;

    if (!variantId) {
      result.warnings.push(`SKU not found: ${sku} (${row.Name})`);
    }
  } else {
    result.warnings.push(`No SKU for item: ${row.Name}`);
  }

  // Get show date for transaction
  const { data: show } = await supabase
    .from('shows')
    .select('show_date')
    .eq('id', showId)
    .single();

  const saleDate = show?.show_date || new Date().toISOString().split('T')[0];

  // Parse pricing
  const avgPrice = parseNumeric(row['Avg. Price']) || 0;
  const grossRevenue = parseNumeric(row['Gross Rev']) || 0;

  // Create paid sales record
  if (quantitySold > 0) {
    const { error: saleError } = await supabase
      .from('tour_sales')
      .insert({
        show_id: showId,
        product_variant_id: variantId,
        quantity_sold: quantitySold,
        is_comp: false,
        unit_price: avgPrice,
        gross_revenue: grossRevenue,
        sale_date: saleDate,
        source: 'atvenue',
        source_data: {
          name: row.Name,
          type: row.Type,
          size: row.Size,
          sex: row.Sex,
          unit_percent_of_total: row['Unit % of Total'],
          percent_of_total: row['% of Total'],
        },
      });

    if (saleError) {
      throw new Error(`Failed to create tour sale: ${saleError.message}`);
    }

    result.salesCreated++;

    // Create inventory transaction for paid sales
    if (variantId) {
      await createInventoryTransaction(
        variantId,
        quantitySold,
        showId,
        saleDate,
        false,
        result
      );
    }
  }

  // Create comp sales record
  if (compQty > 0) {
    const { error: compError } = await supabase
      .from('tour_sales')
      .insert({
        show_id: showId,
        product_variant_id: variantId,
        quantity_sold: compQty,
        is_comp: true,
        unit_price: avgPrice,
        gross_revenue: 0,
        sale_date: saleDate,
        source: 'atvenue',
        source_data: {
          name: row.Name,
          type: row.Type,
          size: row.Size,
          sex: row.Sex,
        },
      });

    if (compError) {
      throw new Error(`Failed to create comp sale: ${compError.message}`);
    }

    result.salesCreated++;

    // Create inventory transaction for comps (they still reduce inventory)
    if (variantId) {
      await createInventoryTransaction(
        variantId,
        compQty,
        showId,
        saleDate,
        true,
        result
      );
    }
  }
}

async function createInventoryTransaction(
  variantId: string,
  quantity: number,
  showId: string,
  saleDate: string,
  isComp: boolean,
  result: ImportResult
): Promise<void> {
  const { error: transactionError } = await supabase
    .from('inventory_transactions')
    .insert({
      product_variant_id: variantId,
      transaction_type: isComp ? 'comp' : 'sale',
      from_state: 'tour',
      to_state: null,
      quantity: -quantity, // Negative because it reduces inventory
      show_id: showId,
      transaction_date: new Date(saleDate).toISOString(),
      source: 'atvenue',
      notes: isComp ? 'Complementary item' : 'Tour sale',
    });

  if (transactionError) {
    result.warnings.push(
      `Failed to create transaction for variant ${variantId}: ${transactionError.message}`
    );
  } else {
    result.transactionsCreated++;

    // Update inventory state (reduce tour inventory)
    await updateTourInventory(variantId, showId, -quantity);
  }
}

async function updateTourInventory(
  variantId: string,
  showId: string,
  quantityChange: number
): Promise<void> {
  // Get tour ID from show
  const { data: show } = await supabase
    .from('shows')
    .select('tour_id')
    .eq('id', showId)
    .single();

  if (!show) return;

  // Get current tour inventory state
  const { data: currentState } = await supabase
    .from('inventory_states')
    .select('id, quantity')
    .eq('product_variant_id', variantId)
    .eq('state', 'tour')
    .eq('tour_id', show.tour_id)
    .single();

  if (currentState) {
    // Update existing state
    const newQuantity = Math.max(0, currentState.quantity + quantityChange);

    await supabase
      .from('inventory_states')
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentState.id);
  } else if (quantityChange > 0) {
    // Create new state if adding inventory
    await supabase
      .from('inventory_states')
      .insert({
        product_variant_id: variantId,
        state: 'tour',
        quantity: quantityChange,
        tour_id: show.tour_id,
      });
  }
}
