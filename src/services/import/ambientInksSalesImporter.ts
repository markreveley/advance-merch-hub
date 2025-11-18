// Ambient Inks Sales Importer
// Imports online sales data and creates inventory transactions

import { supabase } from '@/integrations/supabase/client';
import { parseCSV, parseNumeric, parseInteger, parseDate } from './csvParser';
import { findVariantBySku } from './skuMatcher';
import type { AmbientInksSalesImport } from '@/types/merch';

export interface ImportResult {
  success: boolean;
  ordersCreated: number;
  transactionsCreated: number;
  errors: string[];
  warnings: string[];
}

export async function importAmbientInksSales(
  csvContent: string
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    ordersCreated: 0,
    transactionsCreated: 0,
    errors: [],
    warnings: [],
  };

  try {
    // Parse CSV
    const rows = parseCSV<AmbientInksSalesImport>(csvContent);

    if (rows.length === 0) {
      result.errors.push('No data found in CSV file');
      return result;
    }

    console.log(`Processing ${rows.length} sales orders from Ambient Inks...`);

    // Process each order
    for (const row of rows) {
      try {
        await importSalesOrder(row, result);
      } catch (error) {
        const errorMsg = `Error importing order ${row['Order #']}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    result.success = result.errors.length === 0;

    console.log('Sales import complete:', {
      ordersCreated: result.ordersCreated,
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

async function importSalesOrder(
  row: AmbientInksSalesImport,
  result: ImportResult
): Promise<void> {
  const orderNumber = parseInteger(row['Order #']);
  const sku = row.SKU;

  if (!orderNumber) {
    result.warnings.push(`Order without order number: ${JSON.stringify(row)}`);
    return;
  }

  // Parse order date
  const orderDate = parseDate(row['Order Date']);
  if (!orderDate) {
    result.warnings.push(`Order ${orderNumber} has invalid date: ${row['Order Date']}`);
    return;
  }

  // Find product variant by SKU
  let variantId: string | null = null;

  if (sku) {
    const match = await findVariantBySku(sku, 'ambient_inks');
    variantId = match.variantId;

    if (!variantId) {
      result.warnings.push(`SKU not found for order ${orderNumber}: ${sku}`);
    }
  }

  // Check if order already exists
  const { data: existingOrder } = await supabase
    .from('sales_orders')
    .select('id')
    .eq('order_number', orderNumber)
    .eq('sku', sku || '')
    .maybeSingle();

  if (existingOrder) {
    console.log(`Order ${orderNumber} already exists, skipping...`);
    return;
  }

  // Create sales order
  const { data: newOrder, error: orderError } = await supabase
    .from('sales_orders')
    .insert({
      order_number: orderNumber,
      order_date: orderDate.toISOString(),
      product_name: row.Name,
      product_variant_id: variantId,
      sku: sku || null,
      quantity: parseInteger(row.QTY) || 0,
      gross_sales: parseNumeric(row['Gross Sales']) || 0,
      discounts: parseNumeric(row.Discounts) || 0,
      net_sales: parseNumeric(row['Net sales']) || 0,
      commission: parseNumeric(row.Commission) || 0,
      deduction: parseNumeric(row.Deduction) || 0,
      payout: parseNumeric(row.Payout) || 0,
      source: 'ambient_inks',
    })
    .select('id')
    .single();

  if (orderError || !newOrder) {
    throw new Error(`Failed to create sales order: ${orderError?.message}`);
  }

  result.ordersCreated++;

  // Create inventory transaction (sale from warehouse)
  if (variantId) {
    const quantity = parseInteger(row.QTY) || 0;

    const { error: transactionError } = await supabase
      .from('inventory_transactions')
      .insert({
        product_variant_id: variantId,
        transaction_type: 'sale',
        from_state: 'warehouse',
        to_state: null,
        quantity: -quantity, // Negative because it's a sale (inventory reduction)
        transaction_date: orderDate.toISOString(),
        source: 'ambient_inks',
        notes: `Online sale - Order #${orderNumber}`,
      });

    if (transactionError) {
      result.warnings.push(
        `Failed to create transaction for order ${orderNumber}: ${transactionError.message}`
      );
    } else {
      result.transactionsCreated++;

      // Update inventory state
      await updateInventoryState(variantId, 'warehouse', -quantity);
    }
  }
}

async function updateInventoryState(
  variantId: string,
  state: string,
  quantityChange: number
): Promise<void> {
  // Get current inventory state
  const { data: currentState } = await supabase
    .from('inventory_states')
    .select('id, quantity')
    .eq('product_variant_id', variantId)
    .eq('state', state)
    .is('tour_id', null)
    .maybeSingle();

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
        state,
        quantity: quantityChange,
        tour_id: null,
      });
  }
}
