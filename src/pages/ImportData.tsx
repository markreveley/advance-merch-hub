import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { importAmbientInksProducts } from '@/services/import/ambientInksProductImporter';
import { importAmbientInksSales } from '@/services/import/ambientInksSalesImporter';

interface ImportResult {
  success: boolean;
  message: string;
  details?: any;
}

export default function ImportData() {
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);

  const fetchAssetFile = async (path: string): Promise<string> => {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
    }
    return await response.text();
  };

  const importProducts = async () => {
    try {
      const csvContent = await fetchAssetFile('/assets/Ambient Inks/Master Product List/11-17-25 Products-Export.csv');
      const result = await importAmbientInksProducts(csvContent);

      return {
        success: result.success,
        message: `Products: ${result.productsCreated} created, ${result.variantsCreated} variants`,
        details: result,
      };
    } catch (error) {
      return {
        success: false,
        message: `Products import failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  };

  const importSales = async () => {
    try {
      const csvContent = await fetchAssetFile('/assets/Ambient Inks/Reports/Ambient Inks-Report-2025-11-18T01_48_02+00_00.csv');
      const result = await importAmbientInksSales(csvContent);

      return {
        success: result.success,
        message: `Sales: ${result.ordersCreated} orders, ${result.transactionsCreated} transactions`,
        details: result,
      };
    } catch (error) {
      return {
        success: false,
        message: `Sales import failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  };

  const checkCurrentData = async () => {
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    const { count: variantCount } = await supabase
      .from('product_variants')
      .select('*', { count: 'exact', head: true });

    const { count: salesCount } = await supabase
      .from('sales_orders')
      .select('*', { count: 'exact', head: true });

    return {
      products: productCount || 0,
      variants: variantCount || 0,
      sales: salesCount || 0,
    };
  };

  const runImport = async () => {
    setImporting(true);
    setResults([]);

    const importResults: ImportResult[] = [];

    try {
      // Check existing data
      const beforeData = await checkCurrentData();
      importResults.push({
        success: true,
        message: `Current data: ${beforeData.products} products, ${beforeData.variants} variants, ${beforeData.sales} sales`,
      });

      // Import products first
      importResults.push({
        success: true,
        message: 'Starting product import...',
      });

      const productResult = await importProducts();
      importResults.push(productResult);

      if (productResult.success) {
        // Import sales
        importResults.push({
          success: true,
          message: 'Starting sales import...',
        });

        const salesResult = await importSales();
        importResults.push(salesResult);
      }

      // Check final data
      const afterData = await checkCurrentData();
      importResults.push({
        success: true,
        message: `✅ Final data: ${afterData.products} products, ${afterData.variants} variants, ${afterData.sales} sales`,
      });

    } catch (error) {
      importResults.push({
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    setResults(importResults);
    setImporting(false);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Upload className="h-8 w-8" />
          Import Data
        </h1>
        <p className="text-muted-foreground mt-1">
          Import product catalog and sales data from assets folder
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Import</CardTitle>
          <CardDescription>
            This will import data from your assets folder:
            <ul className="mt-2 space-y-1">
              <li>• Ambient Inks Product Catalog (products, variants, pricing, inventory)</li>
              <li>• Ambient Inks Sales Report (online sales orders)</li>
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={runImport}
            disabled={importing}
            size="lg"
            className="w-full"
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Start Import
              </>
            )}
          </Button>

          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Import Log:</h3>
              {results.map((result, index) => (
                <Alert
                  key={index}
                  variant={result.success ? 'default' : 'destructive'}
                >
                  {result.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{result.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>After importing data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>1. Visit <a href="/master-inventory" className="text-primary underline">/master-inventory</a> to see your imported products</p>
          <p>2. Check inventory states across warehouse and tour locations</p>
          <p>3. Import additional data sources (Atvenue tours, custom metadata)</p>
        </CardContent>
      </Card>
    </div>
  );
}
