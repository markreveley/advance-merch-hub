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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Package, Search } from 'lucide-react';

interface ProductWithVariants {
  id: string;
  handle: string;
  title: string;
  description?: string;
  vendor?: string;
  type?: string;
  tags?: string[];
  published: boolean;
  variants: {
    id: string;
    sku: string;
    variant_name?: string;
    option1_value?: string;
    option2_value?: string;
    option3_value?: string;
    pricing?: {
      price_type: string;
      amount: number;
      source: string;
    }[];
  }[];
}

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch products with variants and pricing
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products-with-variants'],
    queryFn: async () => {
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('title', { ascending: true });

      if (productsError) throw productsError;

      // Fetch variants for each product
      const productsWithVariants: ProductWithVariants[] = [];

      for (const product of productsData || []) {
        const { data: variants, error: variantsError } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', product.id)
          .order('variant_name', { ascending: true });

        if (variantsError) throw variantsError;

        // Fetch pricing for each variant
        const variantsWithPricing = [];
        for (const variant of variants || []) {
          const { data: pricing } = await supabase
            .from('product_pricing')
            .select('price_type, amount, source')
            .eq('product_variant_id', variant.id);

          variantsWithPricing.push({
            ...variant,
            pricing: pricing || [],
          });
        }

        productsWithVariants.push({
          ...product,
          variants: variantsWithPricing,
        });
      }

      return productsWithVariants;
    },
  });

  // Filter products based on search
  const filteredProducts = products?.filter(product => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      product.title.toLowerCase().includes(search) ||
      product.type?.toLowerCase().includes(search) ||
      product.vendor?.toLowerCase().includes(search) ||
      product.variants.some(v => v.sku.toLowerCase().includes(search))
    );
  });

  const getRetailPrice = (variant: ProductWithVariants['variants'][0]): string => {
    const retailPrice = variant.pricing?.find(p => p.price_type === 'retail');
    if (retailPrice) return `$${retailPrice.amount.toFixed(2)}`;
    return '—';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Product Catalog
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse all products and variants
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Variants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products?.reduce((sum, p) => sum + p.variants.length, 0) || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products?.filter(p => p.published).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Products</CardTitle>
          <CardDescription>Filter by product name, type, vendor, or SKU</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardContent className="pt-6">
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">Loading products...</div>
          )}

          {error && (
            <div className="text-center py-8 text-destructive">
              Error loading products: {error.message}
            </div>
          )}

          {!isLoading && !error && filteredProducts && filteredProducts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No products found. {searchTerm && 'Try a different search term.'}
            </div>
          )}

          {!isLoading && !error && filteredProducts && filteredProducts.length > 0 && (
            <>
              <div className="text-sm text-muted-foreground mb-4">
                Showing {filteredProducts.length} of {products.length} products
              </div>

              <Accordion type="single" collapsible className="w-full">
                {filteredProducts.map((product) => (
                  <AccordionItem key={product.id} value={product.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <div className="font-semibold">{product.title}</div>
                            <div className="flex gap-2 mt-1">
                              {product.type && (
                                <Badge variant="secondary" className="text-xs">
                                  {product.type}
                                </Badge>
                              )}
                              {product.vendor && (
                                <Badge variant="outline" className="text-xs">
                                  {product.vendor}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {product.variants.length} variants
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-4">
                        {product.description && (
                          <div className="mb-4 text-sm text-muted-foreground">
                            <div dangerouslySetInnerHTML={{ __html: product.description }} />
                          </div>
                        )}

                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>SKU</TableHead>
                              <TableHead>Variant</TableHead>
                              <TableHead>Size</TableHead>
                              <TableHead>Color</TableHead>
                              <TableHead className="text-right">Retail Price</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {product.variants.map((variant) => (
                              <TableRow key={variant.id}>
                                <TableCell className="font-mono text-sm">
                                  {variant.sku}
                                </TableCell>
                                <TableCell>{variant.variant_name || '—'}</TableCell>
                                <TableCell>{variant.option1_value || '—'}</TableCell>
                                <TableCell>{variant.option2_value || '—'}</TableCell>
                                <TableCell className="text-right font-semibold">
                                  {getRetailPrice(variant)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
