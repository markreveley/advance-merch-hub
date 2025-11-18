import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Package, Search, Download } from 'lucide-react';
import type { MasterInventoryView } from '@/types/merch';

type StateFilter = 'all' | 'warehouse' | 'transfer' | 'tour_start' | 'venue' | 'tour';

export default function MasterInventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<StateFilter>('all');

  // Fetch master inventory view
  const { data: inventory, isLoading, error } = useQuery({
    queryKey: ['master-inventory', stateFilter],
    queryFn: async () => {
      let query = supabase
        .from('master_inventory_view')
        .select('*')
        .order('product_name', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      return data as MasterInventoryView[];
    },
  });

  // Filter inventory based on search and state
  const filteredInventory = inventory?.filter(item => {
    // Search filter
    const matchesSearch =
      !searchTerm ||
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.variant_name?.toLowerCase().includes(searchTerm.toLowerCase());

    // State filter
    const matchesState =
      stateFilter === 'all' ||
      (stateFilter === 'warehouse' && item.warehouse_qty > 0) ||
      (stateFilter === 'transfer' && item.transfer_qty > 0) ||
      (stateFilter === 'tour_start' && item.tour_start_qty > 0) ||
      (stateFilter === 'venue' && item.venue_qty > 0) ||
      (stateFilter === 'tour' && item.tour_qty > 0);

    return matchesSearch && matchesState;
  });

  const handleExport = () => {
    if (!filteredInventory) return;

    // Create CSV
    const headers = [
      'Product',
      'SKU',
      'Variant',
      'Size',
      'Color',
      'Warehouse',
      'Transfer',
      'Tour Start',
      'Venue',
      'Tour',
      'Total',
    ];

    const rows = filteredInventory.map(item => [
      item.product_name,
      item.sku,
      item.variant_name || '',
      item.size || '',
      item.color || '',
      item.warehouse_qty,
      item.transfer_qty,
      item.tour_start_qty,
      item.venue_qty,
      item.tour_qty,
      item.total_qty,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTotalsByState = () => {
    if (!filteredInventory) return {
      warehouse: 0,
      transfer: 0,
      tour_start: 0,
      venue: 0,
      tour: 0,
      total: 0,
    };

    return filteredInventory.reduce(
      (acc, item) => ({
        warehouse: acc.warehouse + item.warehouse_qty,
        transfer: acc.transfer + item.transfer_qty,
        tour_start: acc.tour_start + item.tour_start_qty,
        venue: acc.venue + item.venue_qty,
        tour: acc.tour + item.tour_qty,
        total: acc.total + item.total_qty,
      }),
      {
        warehouse: 0,
        transfer: 0,
        tour_start: 0,
        venue: 0,
        tour: 0,
        total: 0,
      }
    );
  };

  const totals = getTotalsByState();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Master Inventory
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time inventory tracking across all locations
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Warehouse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.warehouse}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.transfer}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tour Start</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.tour_start}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Venue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.venue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.tour}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter inventory</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product name, SKU, or variant..."
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

          {!isLoading && !error && filteredInventory && (
            <>
              <div className="text-sm text-muted-foreground mb-4">
                Showing {filteredInventory.length} of {inventory.length} items
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Variant</TableHead>
                      <TableHead className="text-right">Warehouse</TableHead>
                      <TableHead className="text-right">Transfer</TableHead>
                      <TableHead className="text-right">Tour Start</TableHead>
                      <TableHead className="text-right">Venue</TableHead>
                      <TableHead className="text-right">Tour</TableHead>
                      <TableHead className="text-right font-bold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No inventory items found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInventory.map((item) => (
                        <TableRow key={item.variant_id}>
                          <TableCell className="font-medium">
                            <div>{item.product_name}</div>
                            {item.product_type && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {item.product_type}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                          <TableCell>
                            {item.size || item.color ? (
                              <div className="flex flex-col gap-1">
                                {item.size && <span className="text-sm">{item.size}</span>}
                                {item.color && (
                                  <span className="text-xs text-muted-foreground">{item.color}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.warehouse_qty > 0 ? item.warehouse_qty : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.transfer_qty > 0 ? item.transfer_qty : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.tour_start_qty > 0 ? item.tour_start_qty : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.venue_qty > 0 ? item.venue_qty : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.tour_qty > 0 ? item.tour_qty : '—'}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {item.total_qty}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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
