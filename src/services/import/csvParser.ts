// CSV Parser Utility
// Parses CSV files and returns typed data

export interface CSVParseOptions {
  delimiter?: string;
  skipEmptyLines?: boolean;
  trimFields?: boolean;
}

export function parseCSV<T = Record<string, string>>(
  csvContent: string,
  options: CSVParseOptions = {}
): T[] {
  const {
    delimiter = ',',
    skipEmptyLines = true,
    trimFields = true,
  } = options;

  const lines = csvContent.split('\n');
  if (lines.length === 0) return [];

  // Remove BOM if present
  const firstLine = lines[0].replace(/^\uFEFF/, '');
  const headers = parseCSVLine(firstLine, delimiter, trimFields);

  const results: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    if (skipEmptyLines && !line.trim()) continue;

    const values = parseCSVLine(line, delimiter, trimFields);

    if (values.length === 0 || (values.length === 1 && values[0] === '')) {
      continue;
    }

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    results.push(row as T);
  }

  return results;
}

function parseCSVLine(line: string, delimiter: string, trim: boolean): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 2;
        continue;
      } else {
        // Toggle quotes
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }

    if (char === delimiter && !inQuotes) {
      // End of field
      result.push(trim ? current.trim() : current);
      current = '';
      i++;
      continue;
    }

    current += char;
    i++;
  }

  // Push the last field
  result.push(trim ? current.trim() : current);

  return result;
}

// Helper to convert string values to appropriate types
export function parseNumeric(value: string | undefined): number | undefined {
  if (!value || value === '') return undefined;
  const cleaned = value.replace(/[$,]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

export function parseInteger(value: string | undefined): number | undefined {
  if (!value || value === '') return undefined;
  const cleaned = value.replace(/[,]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? undefined : num;
}

export function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const lower = value.toLowerCase().trim();
  return lower === 'true' || lower === 'yes' || lower === '1';
}

export function parseDate(value: string | undefined): Date | undefined {
  if (!value || value === '') return undefined;
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
}

export function parseArray(value: string | undefined, delimiter = ','): string[] {
  if (!value || value === '') return [];
  return value.split(delimiter).map(item => item.trim()).filter(item => item !== '');
}
