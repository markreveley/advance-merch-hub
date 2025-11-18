// Excel Parser Utility
// This is a placeholder for Excel parsing functionality
// In production, you would use a library like 'xlsx' or 'exceljs'

export interface ExcelParseOptions {
  sheetName?: string;
  skipEmptyRows?: boolean;
  trimFields?: boolean;
}

export interface ExcelSheet {
  name: string;
  data: Record<string, any>[];
}

/**
 * Parse Excel file content
 *
 * NOTE: This is a placeholder implementation.
 * To use in production, install a library:
 *
 * npm install xlsx
 *
 * Then import and use it:
 * import * as XLSX from 'xlsx';
 */
export async function parseExcel(
  fileContent: ArrayBuffer | Buffer,
  options: ExcelParseOptions = {}
): Promise<ExcelSheet[]> {
  throw new Error(
    'Excel parsing not yet implemented. Please install "xlsx" library and implement this function.'
  );
}

/**
 * Parse a specific sheet from Excel file
 */
export async function parseExcelSheet(
  fileContent: ArrayBuffer | Buffer,
  sheetName: string,
  options: ExcelParseOptions = {}
): Promise<Record<string, any>[]> {
  const sheets = await parseExcel(fileContent, { ...options, sheetName });
  const sheet = sheets.find(s => s.name === sheetName);

  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }

  return sheet.data;
}

/**
 * Helper function to clean Excel numeric values
 */
export function cleanExcelNumber(value: any): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;

  // If already a number
  if (typeof value === 'number') return value;

  // If string, clean and parse
  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? undefined : num;
  }

  return undefined;
}

/**
 * Helper function to clean Excel date values
 */
export function cleanExcelDate(value: any): Date | undefined {
  if (value === null || value === undefined || value === '') return undefined;

  // If already a Date
  if (value instanceof Date) return value;

  // If Excel serial date number
  if (typeof value === 'number') {
    // Excel dates are days since 1900-01-01
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000);
    return date;
  }

  // If string, try to parse
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }

  return undefined;
}

// Export a note about implementation
export const EXCEL_PARSER_NOTE = `
Excel parsing requires the 'xlsx' library.

To implement:
1. Install: npm install xlsx
2. Import: import * as XLSX from 'xlsx';
3. Use XLSX.read() to parse files
4. Use XLSX.utils.sheet_to_json() to convert to JSON

Example implementation:

import * as XLSX from 'xlsx';

export function parseExcel(fileContent: ArrayBuffer) {
  const workbook = XLSX.read(fileContent, { type: 'array' });
  const sheets: ExcelSheet[] = [];

  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    sheets.push({ name: sheetName, data });
  });

  return sheets;
}
`;
