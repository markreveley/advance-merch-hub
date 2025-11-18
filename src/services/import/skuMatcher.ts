// SKU Matching Utility
// Intelligently matches SKUs across different data sources

import { supabase } from '@/integrations/supabase/client';

export interface SkuMatchResult {
  variantId: string | null;
  sku: string;
  confidence: 'exact' | 'identifier' | 'fuzzy' | 'none';
  source: string;
}

/**
 * Find a product variant by SKU across multiple sources
 */
export async function findVariantBySku(
  sku: string,
  source?: string
): Promise<SkuMatchResult> {
  if (!sku) {
    return {
      variantId: null,
      sku: '',
      confidence: 'none',
      source: source || 'unknown',
    };
  }

  // 1. Try exact match in product_variants.sku
  const { data: exactMatch } = await supabase
    .from('product_variants')
    .select('id, sku')
    .eq('sku', sku)
    .maybeSingle();

  if (exactMatch) {
    return {
      variantId: exactMatch.id,
      sku: exactMatch.sku,
      confidence: 'exact',
      source: source || 'unknown',
    };
  }

  // 2. Try match in product_identifiers
  const { data: identifierMatch } = await supabase
    .from('product_identifiers')
    .select('product_variant_id, identifier_value')
    .eq('identifier_value', sku)
    .maybeSingle();

  if (identifierMatch) {
    return {
      variantId: identifierMatch.product_variant_id,
      sku,
      confidence: 'identifier',
      source: source || 'unknown',
    };
  }

  // 3. Try fuzzy match (case-insensitive, trim whitespace)
  const normalizedSku = sku.trim().toUpperCase();

  const { data: fuzzyMatches } = await supabase
    .from('product_variants')
    .select('id, sku');

  if (fuzzyMatches) {
    const fuzzyMatch = fuzzyMatches.find(
      v => v.sku.trim().toUpperCase() === normalizedSku
    );

    if (fuzzyMatch) {
      return {
        variantId: fuzzyMatch.id,
        sku: fuzzyMatch.sku,
        confidence: 'fuzzy',
        source: source || 'unknown',
      };
    }
  }

  // No match found
  return {
    variantId: null,
    sku,
    confidence: 'none',
    source: source || 'unknown',
  };
}

/**
 * Create or update a product identifier mapping
 */
export async function upsertProductIdentifier(
  variantId: string,
  identifierType: string,
  identifierValue: string,
  source: string
): Promise<void> {
  const { error } = await supabase
    .from('product_identifiers')
    .upsert(
      {
        product_variant_id: variantId,
        identifier_type: identifierType,
        identifier_value: identifierValue,
        source,
      },
      {
        onConflict: 'identifier_type,identifier_value',
      }
    );

  if (error) {
    console.error('Error upserting product identifier:', error);
    throw error;
  }
}

/**
 * Match multiple SKUs in batch
 */
export async function batchFindVariantsBySku(
  skus: string[],
  source?: string
): Promise<Map<string, SkuMatchResult>> {
  const results = new Map<string, SkuMatchResult>();

  // Deduplicate SKUs
  const uniqueSkus = [...new Set(skus.filter(sku => sku && sku.trim()))];

  for (const sku of uniqueSkus) {
    const result = await findVariantBySku(sku, source);
    results.set(sku, result);
  }

  return results;
}

/**
 * Get match statistics for reporting
 */
export function getMatchStatistics(
  matches: Map<string, SkuMatchResult>
): {
  total: number;
  exact: number;
  identifier: number;
  fuzzy: number;
  none: number;
  matchRate: number;
} {
  const stats = {
    total: matches.size,
    exact: 0,
    identifier: 0,
    fuzzy: 0,
    none: 0,
    matchRate: 0,
  };

  matches.forEach(match => {
    stats[match.confidence]++;
  });

  stats.matchRate = stats.total > 0
    ? ((stats.exact + stats.identifier + stats.fuzzy) / stats.total) * 100
    : 0;

  return stats;
}
