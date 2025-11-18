import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type StateFilter = 'all' | 'warehouse' | 'transfer' | 'tour_start' | 'venue' | 'tour';

interface InventoryStateWithProduct {
  id: string;
  state: string;
  quantity: number;
  location_details?: string;
  updated_at: string;
  product_variant: {
    sku: string;
    variant_name?: string;
    product: {
      title: string;
      type?: string;
    };
  };
}

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<StateFilter>('all');

  // Fetch inventory states with product info
  const { data: inventoryStates, isLoading, error } = useQuery({
    queryKey: ['inventory-states', stateFilter],
    queryFn: async () => {
      let query = supabase
        .from('inventory_states')
        .select(`
          id,
          state,
          quantity,
          location_details,
          updated_at,
          product_variant:product_variants (
            sku,
            variant_name,
            product:products (
              title,
              type
            )
          )
        `)
        .order('updated_at', { ascending: false });

      // Filter by state if not 'all'
      if (stateFilter !== 'all') {
        query = query.eq('state', stateFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as InventoryStateWithProduct[];
    },
  });

  // Filter by search term
  const filteredInventory = inventoryStates?.filter(item => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.product_variant?.sku.toLowerCase().includes(search) ||
      item.product_variant?.product?.title.toLowerCase().includes(search) ||
      item.state.toLowerCase().includes(search)
    );
  });

  const getStockLevel = (quantity: number, state: string) => {
    if (quantity === 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const, icon: AlertCircle };
    }
    if (quantity < 10) {
      return { label: 'Low Stock', variant: 'secondary' as const, icon: AlertCircle };
    }
    return { label: 'In Stock', variant: 'default' as const, icon: CheckCircle };
  };

  const getStateLabel = (state: string) => {
    const labels: Record<string, string> = {
      warehouse: 'Warehouse',
      transfer: 'In Transfer',
      tour_start: 'Tour Start',
      venue: 'At Venue',
      tour: 'On Tour',
    };
    return labels[state] || state;
  };

  const getStateColor = (state: string) => {
    const colors: Record<string, 'default' | 'secondary' | 'outline'> = {
      warehouse: 'default',
      transfer: 'secondary',
      tour_start: 'outline',
      venue: 'outline',
      tour: 'secondary',
    };
    return colors[state] || 'outline';
  };

  const getTotalQuantity = () => {
    return filteredInventory?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  };

  const getUniqueProducts = () => {
    const skus = new Set(filteredInventory?.map(item => item.product_variant?.sku));
    return skus.size;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Inventory States
          </h1>
          <p className="text-muted-foreground mt-1">
            View inventory across all locations and states
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertDescription>
          This page shows individual inventory states. For a consolidated view with all states in columns, visit{' '}
          <a href="/master-inventory" className="font-semibold underline">
            Master Inventory
          </a>
          .
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalQuantity()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {filteredInventory?.length || 0} inventory records
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Unique Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getUniqueProducts()}</div>
            <p className="text-xs text-muted-foreground mt-1">Different SKUs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Current Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{stateFilter}</div>
            <p className="text-xs text-muted-foreground mt-1">Location state</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter inventory states</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={stateFilter} onValueChange={(v) => setStateFilter(v as StateFilter)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              <SelectItem value="warehouse">Warehouse</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="tour_start">Tour Start</SelectItem>
              <SelectItem value="venue">Venue</SelectItem>
              <SelectItem value="tour">Tour</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">Loading inventory...</div>
          )}

          {error && (
            <div className="text-center py-8 text-destructive">
              Error loading inventory: {error.message}
            </div>
          )}

          {!isLoading && !error && filteredInventory && filteredInventory.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No inventory records found.{' '}
              {searchTerm
                ? 'Try a different search term.'
                : 'Import data using the Import Data page.'}
            </div>
          )}

          {!isLoading && !error && filteredInventory && filteredInventory.length > 0 && (
            <>
              <div className="text-sm text-muted-foreground mb-4">
                Showing {filteredInventory.length} inventory records
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Variant</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Location Details</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item) => {
                      const stockLevel = getStockLevel(item.quantity, item.state);
                      const StockIcon = stockLevel.icon;

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.product_variant?.product?.title || 'Unknown'}
                            {item.product_variant?.product?.type && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {item.product_variant.product.type}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {item.product_variant?.sku || 'N/A'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.product_variant?.variant_name || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStateColor(item.state)}>
                              {getStateLabel(item.state)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.location_details || '—'}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {item.quantity}
                          </TableCell>
                          <TableCell>
                            <Badge variant={stockLevel.variant} className="gap-1">
                              <StockIcon className="h-3 w-3" />
                              {stockLevel.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(item.updated_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
