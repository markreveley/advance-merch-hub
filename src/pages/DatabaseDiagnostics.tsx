import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

export default function DatabaseDiagnostics() {
  // Get database counts
  const { data: diagnostics, isLoading } = useQuery({
    queryKey: ['database-diagnostics'],
    queryFn: async () => {
      // Count products
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Count variants
      const { count: variantCount } = await supabase
        .from('product_variants')
        .select('*', { count: 'exact', head: true });

      // Count inventory states
      const { count: inventoryStateCount } = await supabase
        .from('inventory_states')
        .select('*', { count: 'exact', head: true });

      // Count pricing records
      const { count: pricingCount } = await supabase
        .from('product_pricing')
        .select('*', { count: 'exact', head: true });

      // Count sales orders
      const { count: salesCount } = await supabase
        .from('sales_orders')
        .select('*', { count: 'exact', head: true });

      // Get sample products
      const { data: sampleProducts } = await supabase
        .from('products')
        .select('id, title, handle, vendor, type')
        .limit(10);

      // Get sample variants
      const { data: sampleVariants } = await supabase
        .from('product_variants')
        .select('id, sku, variant_name, product_id')
        .limit(10);

      // Get master inventory view count
      const { count: masterViewCount } = await supabase
        .from('master_inventory_view')
        .select('*', { count: 'exact', head: true });

      // Get sample master inventory
      const { data: sampleMasterInventory } = await supabase
        .from('master_inventory_view')
        .select('*')
        .limit(20);

      return {
        productCount: productCount || 0,
        variantCount: variantCount || 0,
        inventoryStateCount: inventoryStateCount || 0,
        pricingCount: pricingCount || 0,
        salesCount: salesCount || 0,
        masterViewCount: masterViewCount || 0,
        sampleProducts: sampleProducts || [],
        sampleVariants: sampleVariants || [],
        sampleMasterInventory: sampleMasterInventory || [],
      };
    },
  });

  if (isLoading) {
    return <div className="container mx-auto py-6">Loading diagnostics...</div>;
  }

  const expectedVariants = 899; // ~900 lines in CSV minus header
  const isImportComplete = (diagnostics?.variantCount || 0) >= expectedVariants * 0.9; // Allow 10% margin

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Database Diagnostics</h1>
        <p className="text-muted-foreground mt-1">
          Check import status and database contents
        </p>
      </div>

      {!isImportComplete && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Import Incomplete!</strong> Expected ~{expectedVariants} variants from CSV,
            but only found {diagnostics?.variantCount || 0}. The import may have failed or timed out.
          </AlertDescription>
        </Alert>
      )}

      {/* Counts */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diagnostics?.productCount}</div>
            <p className="text-xs text-muted-foreground">Expected: ~150</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Variants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diagnostics?.variantCount}</div>
            <p className="text-xs text-muted-foreground">Expected: ~899</p>
            {(diagnostics?.variantCount || 0) < expectedVariants && (
              <Badge variant="destructive" className="mt-2 text-xs">Too Low!</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Inventory States</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diagnostics?.inventoryStateCount}</div>
            <p className="text-xs text-muted-foreground">Per variant states</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Pricing Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diagnostics?.pricingCount}</div>
            <p className="text-xs text-muted-foreground">Price entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Sales Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diagnostics?.salesCount}</div>
            <p className="text-xs text-muted-foreground">Online sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Master View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diagnostics?.masterViewCount}</div>
            <p className="text-xs text-muted-foreground">View records</p>
            {(diagnostics?.masterViewCount || 0) !== (diagnostics?.variantCount || 0) && (
              <Badge variant="secondary" className="mt-2 text-xs">Mismatch!</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sample Data */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Products (First 10)</CardTitle>
        </CardHeader>
        <CardContent>
          {diagnostics?.sampleProducts && diagnostics.sampleProducts.length > 0 ? (
            <div className="space-y-2">
              {diagnostics.sampleProducts.map((product: any) => (
                <div key={product.id} className="p-2 border rounded text-sm">
                  <div className="font-semibold">{product.title}</div>
                  <div className="text-muted-foreground text-xs">
                    Handle: {product.handle} | Vendor: {product.vendor} | Type: {product.type}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No products found</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sample Variants (First 10)</CardTitle>
        </CardHeader>
        <CardContent>
          {diagnostics?.sampleVariants && diagnostics.sampleVariants.length > 0 ? (
            <div className="space-y-2">
              {diagnostics.sampleVariants.map((variant: any) => (
                <div key={variant.id} className="p-2 border rounded text-sm font-mono">
                  SKU: {variant.sku} | Name: {variant.variant_name}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No variants found</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Master Inventory View (First 20)</CardTitle>
        </CardHeader>
        <CardContent>
          {diagnostics?.sampleMasterInventory && diagnostics.sampleMasterInventory.length > 0 ? (
            <div className="space-y-2">
              {diagnostics.sampleMasterInventory.map((item: any, idx: number) => (
                <div key={idx} className="p-2 border rounded text-sm">
                  <div className="font-semibold">{item.product_name}</div>
                  <div className="text-xs font-mono">SKU: {item.sku} | Size: {item.size}</div>
                  <div className="text-xs text-muted-foreground">
                    Warehouse: {item.warehouse_qty} | Tour: {item.tour_qty} | Total: {item.total_qty}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No inventory records found</p>
          )}
        </CardContent>
      </Card>

      <Alert>
        <AlertDescription>
          <strong>Diagnosis:</strong>
          {isImportComplete ? (
            <span className="text-green-600"> Import appears complete! All expected data is present.</span>
          ) : (
            <span className="text-red-600">
              {' '}Import is incomplete. Expected ~{expectedVariants} variants but only found {diagnostics?.variantCount}.
              This suggests the import process failed, timed out, or encountered errors partway through.
              Check browser console logs for errors during import.
            </span>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
