// Ambient Inks Product Catalog Importer
// Imports products, variants, pricing, and initial inventory from Ambient Inks CSV

import { supabase } from '@/integrations/supabase/client';
import { parseCSV, parseNumeric, parseInteger, parseBoolean, parseArray } from './csvParser';
import type { AmbientInksProductImport } from '@/types/merch';

export interface ImportResult {
  success: boolean;
  productsCreated: number;
  variantsCreated: number;
  errors: string[];
  warnings: string[];
}

export async function importAmbientInksProducts(
  csvContent: string
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    productsCreated: 0,
    variantsCreated: 0,
    errors: [],
    warnings: [],
  };

  try {
    // Parse CSV
    const rows = parseCSV<AmbientInksProductImport>(csvContent);

    if (rows.length === 0) {
      result.errors.push('No data found in CSV file');
      return result;
    }

    console.log(`Processing ${rows.length} rows from Ambient Inks CSV...`);

    // Group rows by product (same _id)
    const productGroups = new Map<string, AmbientInksProductImport[]>();

    rows.forEach(row => {
      const productId = row._id;
      if (!productGroups.has(productId)) {
        productGroups.set(productId, []);
      }
      productGroups.get(productId)!.push(row);
    });

    console.log(`Found ${productGroups.size} unique products`);

    // Process each product
    for (const [productId, variants] of productGroups) {
      try {
        await importProduct(productId, variants, result);
      } catch (error) {
        const errorMsg = `Error importing product ${productId}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    result.success = result.errors.length === 0;

    console.log('Import complete:', {
      productsCreated: result.productsCreated,
      variantsCreated: result.variantsCreated,
      errors: result.errors.length,
      warnings: result.warnings.length,
    });

    return result;
  } catch (error) {
    result.errors.push(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }
}

async function importProduct(
  productId: string,
  variantRows: AmbientInksProductImport[],
  result: ImportResult
): Promise<void> {
  // Use first row for product-level data
  const firstRow = variantRows[0];

  // Skip if title is missing or looks like HTML/CSS/garbage
  const title = firstRow.Title?.trim();
  if (!title || 
      title.includes('<') ||  // Any HTML tags
      title.includes('>') ||
      title.startsWith('--') ||
      title.startsWith('td {') ||
      title.includes('mso-data-placement') ||
      title.includes('{') ||  // JSON-like data
      title.match(/^(Created_\d{4}|MB-Invisible|bis-hidden|music)$/i) ||
      title.length < 3 ||
      title.length > 200) {
    console.log(`Skipping malformed product title: "${title?.substring(0, 100)}..."`);
    result.warnings.push(`Skipped malformed product: ${title?.substring(0, 50) || productId}`);
    return;
  }

  // Generate a clean handle from title if handle is missing or invalid
  let handle = firstRow.Handle?.trim();
  if (!handle || handle.startsWith('<') || handle.length < 2) {
    handle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }

  // Check if product already exists
  const { data: existingProduct } = await supabase
    .from('products')
    .select('id')
    .eq('ambient_inks_id', productId)
    .maybeSingle();

  let dbProductId: string;

  if (existingProduct) {
    dbProductId = existingProduct.id;
    console.log(`Product ${title} already exists, updating variants...`);
  } else {
    // Create product
    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .insert({
        handle,
        title,
        description: firstRow.Description || '',
        vendor: firstRow.Vendor || '',
        type: firstRow.Type || '',
        tags: parseArray(firstRow.Tags),
        image_urls: firstRow['Image Src'] ? parseArray(firstRow['Image Src']) : [],
        published: parseBoolean(firstRow.Published),
        ambient_inks_id: productId,
      })
      .select('id')
      .single();

    if (productError || !newProduct) {
      throw new Error(`Failed to create product: ${productError?.message}`);
    }

    dbProductId = newProduct.id;
    result.productsCreated++;
    console.log(`Created product: ${title}`);
  }

  // Process each variant
  for (const variantRow of variantRows) {
    try {
      await importVariant(dbProductId, variantRow, result);
    } catch (error) {
      const errorMsg = `Error importing variant ${variantRow['Variant SKU']}: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      result.warnings.push(errorMsg);
    }
  }
}

async function importVariant(
  productId: string,
  row: AmbientInksProductImport,
  result: ImportResult
): Promise<void> {
  const sku = row['Variant SKU'];

  if (!sku) {
    result.warnings.push(`Variant without SKU for product ${row.Title}`);
    return;
  }

  // Build variant name
  const variantParts = [
    row['Option1 Value'],
    row['Option2 Value'],
    row['Option3 Value'],
  ].filter(Boolean);
  const variantName = variantParts.join(' - ') || 'Default';

  // Check if variant exists
  const { data: existingVariant } = await supabase
    .from('product_variants')
    .select('id')
    .eq('sku', sku)
    .maybeSingle();

  let variantId: string;

  if (existingVariant) {
    variantId = existingVariant.id;
  } else {
    // Create variant
    const { data: newVariant, error: variantError } = await supabase
      .from('product_variants')
      .insert({
        product_id: productId,
        sku,
        variant_name: variantName,
        option1_name: row['Option1 Name'] || null,
        option1_value: row['Option1 Value'] || null,
        option2_name: row['Option2 Name'] || null,
        option2_value: row['Option2 Value'] || null,
        option3_name: row['Option3 Name'] || null,
        option3_value: row['Option3 Value'] || null,
        weight: parseNumeric(row['Variant Weight']),
        weight_unit: row['Variant Weight Unit'] || null,
        barcode: row['Variant Barcode'] || null,
      })
      .select('id')
      .single();

    if (variantError || !newVariant) {
      throw new Error(`Failed to create variant: ${variantError?.message}`);
    }

    variantId = newVariant.id;
    result.variantsCreated++;
  }

  // Create product identifier for Ambient Inks
  await supabase
    .from('product_identifiers')
    .upsert(
      {
        product_variant_id: variantId,
        identifier_type: 'ambient_inks_sku',
        identifier_value: sku,
        source: 'ambient_inks',
      },
      { onConflict: 'identifier_type,identifier_value' }
    );

  // Import pricing
  await importPricing(variantId, row);

  // Import initial inventory
  await importInitialInventory(variantId, row);
}

async function importPricing(
  variantId: string,
  row: AmbientInksProductImport
): Promise<void> {
  const retailPrice = parseNumeric(row['Variant Price']);
  const compareAtPrice = parseNumeric(row['Variant Compare At Price']);
  const effectiveDate = new Date().toISOString().split('T')[0];

  if (retailPrice) {
    // Check if pricing exists first
    const { data: existingPrice } = await supabase
      .from('product_pricing')
      .select('id')
      .eq('product_variant_id', variantId)
      .eq('price_type', 'retail')
      .eq('source', 'ambient_inks')
      .eq('effective_from', effectiveDate)
      .maybeSingle();

    if (existingPrice) {
      await supabase
        .from('product_pricing')
        .update({ amount: retailPrice })
        .eq('id', existingPrice.id);
    } else {
      await supabase
        .from('product_pricing')
        .insert({
          product_variant_id: variantId,
          price_type: 'retail',
          amount: retailPrice,
          source: 'ambient_inks',
          effective_from: effectiveDate,
        });
    }
  }

  if (compareAtPrice) {
    const { data: existingPrice } = await supabase
      .from('product_pricing')
      .select('id')
      .eq('product_variant_id', variantId)
      .eq('price_type', 'compare_at')
      .eq('source', 'ambient_inks')
       .eq('effective_from', effectiveDate)
       .maybeSingle();

    if (existingPrice) {
      await supabase
        .from('product_pricing')
        .update({ amount: compareAtPrice })
        .eq('id', existingPrice.id);
    } else {
      await supabase
        .from('product_pricing')
        .insert({
          product_variant_id: variantId,
          price_type: 'compare_at',
          amount: compareAtPrice,
          source: 'ambient_inks',
          effective_from: effectiveDate,
        });
    }
  }
}

async function importInitialInventory(
  variantId: string,
  row: AmbientInksProductImport
): Promise<void> {
  const warehouseQty = parseInteger(row['Inventory Location: eCommerce Inventory']) || 0;
  const tourQty = parseInteger(row['Inventory Location: Tour Inventory']) || 0;

  // Create or update warehouse inventory
  if (warehouseQty > 0) {
    // Check if state exists first
    const { data: existingState } = await supabase
      .from('inventory_states')
      .select('id, quantity')
      .eq('product_variant_id', variantId)
      .eq('state', 'warehouse')
      .is('tour_id', null)
      .maybeSingle();

    if (existingState) {
      await supabase
        .from('inventory_states')
        .update({
          quantity: warehouseQty,
          last_counted_at: new Date().toISOString(),
        })
        .eq('id', existingState.id);
    } else {
      await supabase
        .from('inventory_states')
        .insert({
          product_variant_id: variantId,
          state: 'warehouse',
          quantity: warehouseQty,
          tour_id: null,
          last_counted_at: new Date().toISOString(),
        });
    }
  }

  // Create or update tour inventory
  if (tourQty > 0) {
    const { data: existingState } = await supabase
      .from('inventory_states')
      .select('id, quantity')
      .eq('product_variant_id', variantId)
      .eq('state', 'tour')
       .is('tour_id', null)
       .maybeSingle();

    if (existingState) {
      await supabase
        .from('inventory_states')
        .update({
          quantity: tourQty,
          last_counted_at: new Date().toISOString(),
        })
        .eq('id', existingState.id);
    } else {
      await supabase
        .from('inventory_states')
        .insert({
          product_variant_id: variantId,
          state: 'tour',
          quantity: tourQty,
          tour_id: null,
          last_counted_at: new Date().toISOString(),
        });
    }
  }
}
