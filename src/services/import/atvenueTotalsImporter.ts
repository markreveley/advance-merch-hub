// Atvenue Venue Night Totals Importer
// Imports nightly total receipts from Atvenue Tour Totals

import { supabase } from '@/integrations/supabase/client';
import { parseCSV, parseNumeric, parseDate } from './csvParser';
import type { AtvenueNightTotalsImport } from '@/types/merch';

export interface ImportResult {
  success: boolean;
  totalsCreated: number;
  showsCreated: number;
  errors: string[];
  warnings: string[];
}

export interface ImportOptions {
  tourId: string; // Required: which tour these totals belong to
  tourName?: string; // Optional: for creating tour if needed
}

export async function importAtvenueTotals(
  csvContent: string,
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    totalsCreated: 0,
    showsCreated: 0,
    errors: [],
    warnings: [],
  };

  try {
    // Parse CSV - skip header rows
    const rows = parseCSV<AtvenueNightTotalsImport>(csvContent);

    if (rows.length === 0) {
      result.errors.push('No data found in CSV file');
      return result;
    }

    // Filter out header and total rows
    const dataRows = rows.filter(
      row =>
        row.Date &&
        row.Venue &&
        !row.Venue.toLowerCase().includes('total') &&
        !row.Date.toLowerCase().includes('date')
    );

    console.log(`Processing ${dataRows.length} venue night totals from Atvenue...`);

    // Get or verify tour
    const { data: tour } = await supabase
      .from('tours')
      .select('id, name')
      .eq('id', options.tourId)
      .maybeSingle();

    if (!tour) {
      result.errors.push(`Tour not found: ${options.tourId}`);
      return result;
    }

    // Process each venue night
    for (const row of dataRows) {
      try {
        await importVenueNight(options.tourId, row, result);
      } catch (error) {
        const errorMsg = `Error importing venue night ${row.Venue}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    result.success = result.errors.length === 0;

    console.log('Atvenue totals import complete:', {
      totalsCreated: result.totalsCreated,
      showsCreated: result.showsCreated,
      errors: result.errors.length,
      warnings: result.warnings.length,
    });

    return result;
  } catch (error) {
    result.errors.push(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }
}

async function importVenueNight(
  tourId: string,
  row: AtvenueNightTotalsImport,
  result: ImportResult
): Promise<void> {
  // Parse date
  const showDate = parseDate(row.Date);

  if (!showDate) {
    result.warnings.push(`Invalid date for venue ${row.Venue}: ${row.Date}`);
    return;
  }

  // Parse location (format: "City, ST")
  const location = row['City, St'] || '';
  const locationParts = location.split(',').map(s => s.trim());
  const city = locationParts[0] || '';
  const state = locationParts[1] || '';

  // Parse financial data
  const totalReceipts = parseNumeric(row['Total Receipts']) || 0;
  const totalFees = parseNumeric(row['Total Fees']) || 0;
  const netReceipts = parseNumeric(row['Net Receipts']) || 0;

  // Skip rows with $0.00 (future dates or cancelled shows)
  if (totalReceipts === 0 && netReceipts === 0) {
    console.log(`Skipping zero-revenue show: ${row.Venue} on ${showDate.toISOString().split('T')[0]}`);
    return;
  }

  // Find or create show
  let showId: string;

  const { data: existingShow } = await supabase
    .from('shows')
    .select('id')
    .eq('tour_id', tourId)
    .eq('venue', row.Venue)
    .eq('show_date', showDate.toISOString().split('T')[0])
    .maybeSingle();

  if (existingShow) {
    showId = existingShow.id;
  } else {
    // Create show
    const { data: newShow, error: showError } = await supabase
      .from('shows')
      .insert({
        tour_id: tourId,
        show_date: showDate.toISOString().split('T')[0],
        venue: row.Venue,
        city: city || null,
        state: state || null,
      })
      .select('id')
      .single();

    if (showError || !newShow) {
      throw new Error(`Failed to create show: ${showError?.message}`);
    }

    showId = newShow.id;
    result.showsCreated++;
    console.log(`Created show: ${row.Venue} on ${showDate.toISOString().split('T')[0]}`);
  }

  // Check if venue night total already exists
  const { data: existingTotal } = await supabase
    .from('venue_night_totals')
    .select('id')
    .eq('show_id', showId)
    .eq('sale_date', showDate.toISOString().split('T')[0])
    .maybeSingle();

  if (existingTotal) {
    console.log(`Venue night total already exists for show ${showId}, skipping...`);
    return;
  }

  // Create venue night total
  const { error: totalError } = await supabase
    .from('venue_night_totals')
    .insert({
      show_id: showId,
      total_receipts: totalReceipts,
      total_fees: totalFees,
      net_receipts: netReceipts,
      sale_date: showDate.toISOString().split('T')[0],
      source: 'atvenue',
    });

  if (totalError) {
    throw new Error(`Failed to create venue night total: ${totalError.message}`);
  }

  result.totalsCreated++;
}
