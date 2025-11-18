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

  // Check if product already exists
  const { data: existingProduct } = await supabase
    .from('products')
    .select('id')
    .eq('ambient_inks_id', productId)
    .single();

  let dbProductId: string;

  if (existingProduct) {
    dbProductId = existingProduct.id;
    console.log(`Product ${firstRow.Title} already exists, updating variants...`);
  } else {
    // Create product
    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .insert({
        handle: firstRow.Handle,
        title: firstRow.Title,
        description: firstRow.Description,
        vendor: firstRow.Vendor,
        type: firstRow.Type,
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
    console.log(`Created product: ${firstRow.Title}`);
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
    .single();

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

  if (retailPrice) {
    await supabase
      .from('product_pricing')
      .upsert(
        {
          product_variant_id: variantId,
          price_type: 'retail',
          amount: retailPrice,
          source: 'ambient_inks',
          effective_from: new Date().toISOString().split('T')[0],
        },
        { onConflict: 'product_variant_id,price_type,source,effective_from' }
      );
  }

  if (compareAtPrice) {
    await supabase
      .from('product_pricing')
      .upsert(
        {
          product_variant_id: variantId,
          price_type: 'compare_at',
          amount: compareAtPrice,
          source: 'ambient_inks',
          effective_from: new Date().toISOString().split('T')[0],
        },
        { onConflict: 'product_variant_id,price_type,source,effective_from' }
      );
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
    await supabase
      .from('inventory_states')
      .upsert(
        {
          product_variant_id: variantId,
          state: 'warehouse',
          quantity: warehouseQty,
          tour_id: null,
          last_counted_at: new Date().toISOString(),
        },
        { onConflict: 'product_variant_id,state,coalesce(tour_id,\'00000000-0000-0000-0000-000000000000\'::uuid)' }
      );
  }

  // Create or update tour inventory
  if (tourQty > 0) {
    await supabase
      .from('inventory_states')
      .upsert(
        {
          product_variant_id: variantId,
          state: 'tour',
          quantity: tourQty,
          tour_id: null,
          last_counted_at: new Date().toISOString(),
        },
        { onConflict: 'product_variant_id,state,coalesce(tour_id,\'00000000-0000-0000-0000-000000000000\'::uuid)' }
      );
  }
}
