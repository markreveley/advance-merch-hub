import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { parse } from 'https://deno.land/std@0.208.0/csv/parse.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductRow {
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
  'Variant Barcode': string;
  Tags: string;
  'Image Src': string;
  'Cost Per Item': string;
  'Track Quantity': string;
  'Inventory Location: eCommerce Inventory': string;
  'Inventory Location: Tour Inventory': string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { csvData } = await req.json();
    
    if (!csvData) {
      throw new Error('CSV data is required');
    }

    // Parse CSV
    const records = parse(csvData, {
      skipFirstRow: true,
      columns: undefined,
    }) as any[];

    console.log(`Processing ${records.length} rows...`);

    const productMap = new Map<string, any>();
    let processedCount = 0;

    for (const row of records) {
      const productId = row._id;
      const sku = row['Variant SKU'];

      // Skip invalid rows
      if (!productId || !sku || !row.Title || row.Title.length < 3 || row.Title.length > 200) {
        continue;
      }

      // Skip malformed titles
      if (row.Title.includes('<') || row.Title.includes('>') || 
          row.Title.startsWith('--') || row.Title.includes('{') ||
          /^(Created_\d{4}|MB-Invisible|bis-hidden|music)$/i.test(row.Title)) {
        continue;
      }

      // Create or update product
      if (!productMap.has(productId)) {
        const { data: product, error } = await supabaseClient
          .from('products')
          .upsert({
            ambient_inks_id: productId,
            handle: row.Handle || '',
            title: row.Title,
            description: row.Description || null,
            vendor: row.Vendor || null,
            type: row.Type || null,
            published: row.Published === 'true',
            tags: row.Tags ? row.Tags.split(',').map((t: string) => t.trim()) : null,
            image_urls: row['Image Src'] ? row['Image Src'].split(',') : null,
          }, {
            onConflict: 'ambient_inks_id',
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating product:', error);
          continue;
        }

        productMap.set(productId, product);
      }

      const product = productMap.get(productId);

      // Create variant
      const { data: variant, error: variantError } = await supabaseClient
        .from('product_variants')
        .upsert({
          product_id: product.id,
          sku: sku,
          variant_name: `${row['Option1 Value'] || ''} ${row['Option2 Value'] || ''} ${row['Option3 Value'] || ''}`.trim() || null,
          option1_name: row['Option1 Name'] || null,
          option1_value: row['Option1 Value'] || null,
          option2_name: row['Option2 Name'] || null,
          option2_value: row['Option2 Value'] || null,
          option3_name: row['Option3 Name'] || null,
          option3_value: row['Option3 Value'] || null,
          weight: row['Variant Weight'] ? parseFloat(row['Variant Weight']) : null,
          weight_unit: row['Variant Weight Unit'] || null,
          barcode: row['Variant Barcode'] || null,
        }, {
          onConflict: 'sku',
        })
        .select()
        .single();

      if (variantError) {
        console.error('Error creating variant:', variantError);
        continue;
      }

      // Add retail price
      const retailPrice = parseFloat(row['Variant Price'] || '0');
      if (retailPrice > 0) {
        await supabaseClient
          .from('product_pricing')
          .upsert({
            product_variant_id: variant.id,
            price_type: 'retail',
            amount: retailPrice,
            source: 'ambient_inks',
            effective_from: new Date().toISOString().split('T')[0],
          }, {
            onConflict: 'product_variant_id,price_type,source,effective_from',
          });
      }

      // Add compare at price
      const comparePrice = parseFloat(row['Variant Compare At Price'] || '0');
      if (comparePrice > 0) {
        await supabaseClient
          .from('product_pricing')
          .upsert({
            product_variant_id: variant.id,
            price_type: 'compare_at',
            amount: comparePrice,
            source: 'ambient_inks',
            effective_from: new Date().toISOString().split('T')[0],
          }, {
            onConflict: 'product_variant_id,price_type,source,effective_from',
          });
      }

      // Add warehouse inventory
      const warehouseQty = parseInt(row['Inventory Location: eCommerce Inventory'] || '0');
      if (warehouseQty !== 0) {
        await supabaseClient
          .from('inventory_states')
          .upsert({
            product_variant_id: variant.id,
            state: 'warehouse',
            quantity: warehouseQty,
            tour_id: null,
          }, {
            onConflict: 'product_variant_id,state,tour_id',
          });
      }

      processedCount++;
      if (processedCount % 50 === 0) {
        console.log(`Processed ${processedCount} variants...`);
      }
    }

    console.log(`Import complete! Processed ${processedCount} variants from ${productMap.size} products.`);

    return new Response(
      JSON.stringify({
        success: true,
        productsImported: productMap.size,
        variantsImported: processedCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
