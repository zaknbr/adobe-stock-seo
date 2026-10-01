import Papa from 'papaparse';
import { ImageMetadataItem, CSVExportRow } from '../types';

export function generateAdobeStockCSV(items: ImageMetadataItem[]): string {
  // Filter items that have at least title or keywords
  const validItems = items.filter(item => item.title || item.keywords.length > 0);

  const rows: CSVExportRow[] = validItems.map(item => {
    // Keywords formatted with comma separation
    const keywordsFormatted = item.keywords.join(', ');

    return {
      Filename: item.fileName,
      Title: item.title,
      Keywords: keywordsFormatted,
      Category: item.category || 8,
      Releases: ''
    };
  });

  const csvString = Papa.unparse(rows, {
    quotes: true, // Always quote fields to avoid comma splitting issues with keywords
    header: true,
    newline: '\r\n' // Standard Windows/Adobe Stock friendly CRLF line break
  });

  return csvString;
}

export function downloadCSV(csvContent: string, fileName: string = 'adobe_stock_bulk_metadata.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
