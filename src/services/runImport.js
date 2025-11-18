// Quick Data Import Script
// Run this in Node.js to import your CSV data

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// TODO: Add your Supabase credentials from .env or hardcode for testing
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function importProducts() {
  console.log('Reading Ambient Inks products CSV...');

  const csvPath = join(__dirname, '../assets/Ambient Inks/Master Product List/11-17-25 Products-Export.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');

  // Import the importer
  const { importAmbientInksProducts } = await import('./import/ambientInksProductImporter.js');

  console.log('Importing products...');
  const result = await importAmbientInksProducts(csvContent);

  console.log('\n=== IMPORT RESULTS ===');
  console.log(`Products created: ${result.productsCreated}`);
  console.log(`Variants created: ${result.variantsCreated}`);
  console.log(`Errors: ${result.errors.length}`);
  console.log(`Warnings: ${result.warnings.length}`);

  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach(err => console.log(`  - ${err}`));
  }

  if (result.warnings.length > 0) {
    console.log('\nWarnings:');
    result.warnings.slice(0, 5).forEach(warn => console.log(`  - ${warn}`));
    if (result.warnings.length > 5) {
      console.log(`  ... and ${result.warnings.length - 5} more warnings`);
    }
  }

  return result;
}

async function checkData() {
  console.log('\nChecking database...');

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id')
    .limit(1);

  const { data: inventory, error: invError } = await supabase
    .from('master_inventory_view')
    .select('*')
    .limit(5);

  if (productsError) {
    console.log('Error querying products:', productsError.message);
  } else {
    console.log(`Products in database: ${products?.length || 0}`);
  }

  if (invError) {
    console.log('Error querying inventory:', invError.message);
  } else {
    console.log(`Inventory items: ${inventory?.length || 0}`);
    if (inventory && inventory.length > 0) {
      console.log('\nSample inventory:');
      inventory.forEach(item => {
        console.log(`  ${item.product_name} (${item.sku}): ${item.total_qty} total`);
      });
    }
  }
}

// Run the import
console.log('Starting data import...\n');
checkData()
  .then(() => importProducts())
  .then(() => checkData())
  .then(() => {
    console.log('\n✅ Import complete! Check /master-inventory in your browser.');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Import failed:', err.message);
    console.error(err);
    process.exit(1);
  });
