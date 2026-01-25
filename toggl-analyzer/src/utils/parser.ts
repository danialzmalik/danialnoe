import * as XLSX from 'xlsx';
import type { RawTimeEntry, TimeEntry } from '../types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Parse duration string "H:MM:SS" to total minutes
 */
export function parseDuration(durationStr: string): number {
  if (!durationStr || durationStr === '-') return 0;
  
  const parts = durationStr.split(':').map(Number);
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 60 + minutes + seconds / 60;
  } else if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes + seconds / 60;
  }
  return 0;
}

/**
 * Format minutes to "Xh Ym" display string
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

/**
 * Format minutes to decimal hours (e.g., 1.5)
 */
export function formatDecimalHours(minutes: number): string {
  return (minutes / 60).toFixed(2);
}

/**
 * Get ISO week number for a date
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Parse date value to Date object
 * Handles YYYY-MM-DD strings, Date objects, or Excel serial numbers
 */
export function parseDate(dateValue: string | number | Date): Date {
  // Already a Date object
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  // Excel serial number (days since 1900-01-01, with Excel's leap year bug)
  if (typeof dateValue === 'number') {
    // Excel's epoch is 1900-01-01, but Excel thinks 1900 was a leap year
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
  }
  
  // String format YYYY-MM-DD
  if (typeof dateValue === 'string') {
    const [year, month, day] = dateValue.split('-').map(Number);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month - 1, day);
    }
    // Try parsing as ISO string
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  // Fallback to current date
  console.warn('Could not parse date:', dateValue);
  return new Date();
}

/**
 * Parse time string to hour number (0-23)
 */
export function parseHour(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours] = timeStr.split(':').map(Number);
  return hours;
}

/**
 * Parse tags string to array
 */
export function parseTags(tagsStr: string): string[] {
  if (!tagsStr || tagsStr === '-') return [];
  return tagsStr.split(',').map(tag => tag.trim()).filter(Boolean);
}

/**
 * Generate unique ID for an entry
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Transform raw entry to processed TimeEntry
 */
export function transformEntry(raw: RawTimeEntry): TimeEntry {
  const startDate = parseDate(raw['Start date'] ?? new Date());
  const stopDate = parseDate(raw['Stop date'] ?? new Date());
  
  return {
    id: generateId(),
    description: raw.Description || '-',
    durationMinutes: parseDuration(raw.Duration || '0:00:00'),
    durationRaw: raw.Duration || '0:00:00',
    member: raw.Member || 'Unknown',
    email: raw.Email || '',
    project: raw.Project || 'No Project',
    tags: parseTags(raw.Tags || ''),
    startDate,
    stopDate,
    startTime: raw['Start time'] || '00:00:00',
    stopTime: raw['Stop time'] || '00:00:00',
    dayOfWeek: startDate.getDay(),
    dayName: DAY_NAMES[startDate.getDay()],
    weekNumber: getWeekNumber(startDate),
    month: startDate.getMonth(),
    monthName: MONTH_NAMES[startDate.getMonth()],
    year: startDate.getFullYear(),
    hour: parseHour(raw['Start time'] || '00:00:00'),
  };
}

/**
 * Clean raw entry keys to handle BOM and whitespace issues
 */
function cleanRawEntry(raw: Record<string, unknown>): RawTimeEntry {
  const cleaned: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(raw)) {
    // Remove BOM and trim whitespace from keys
    const cleanKey = key.replace(/^\uFEFF/, '').trim();
    cleaned[cleanKey] = value;
  }
  
  return cleaned as unknown as RawTimeEntry;
}

/**
 * Parse xlsx file buffer to TimeEntry array
 */
export function parseXlsxFile(data: ArrayBuffer): TimeEntry[] {
  const workbook = XLSX.read(data, { type: 'array', codepage: 65001 });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const rawEntries = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
  
  // Clean entries to handle BOM in headers
  const cleanedEntries = rawEntries.map(cleanRawEntry);
  
  return cleanedEntries.map(transformEntry);
}

/**
 * Parse CSV file to TimeEntry array
 */
export function parseCsvFile(csvText: string): TimeEntry[] {
  const workbook = XLSX.read(csvText, { type: 'string' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const rawEntries: RawTimeEntry[] = XLSX.utils.sheet_to_json(worksheet);
  
  return rawEntries.map(transformEntry);
}

/**
 * Remove BOM, non-printable chars, and clean header string
 */
function cleanHeader(header: string): string {
  if (!header) return '';
  // Remove BOM, zero-width chars, and other invisible characters, then trim
  return header
    .replace(/[\uFEFF\u200B\u200C\u200D\u00A0]/g, '')
    .replace(/[^\x20-\x7E]/g, (char) => {
      // Keep letters, numbers, spaces, and common punctuation
      if (/[\w\s\-_]/.test(char)) return char;
      return '';
    })
    .trim();
}

/**
 * Normalize header for comparison
 */
function normalizeHeader(header: string): string {
  return cleanHeader(header).toLowerCase().replace(/[\s_-]+/g, ' ');
}

/**
 * Validate that the file has the expected Toggl Track format
 */
export function validateTogglFormat(data: ArrayBuffer): { valid: boolean; error?: string; headers?: string[] } {
  try {
    const workbook = XLSX.read(data, { type: 'array', codepage: 65001 });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const rawHeaders = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
    
    if (!rawHeaders || rawHeaders.length === 0) {
      return {
        valid: false,
        error: 'No headers found in file.',
      };
    }
    
    // Clean and normalize headers for comparison
    const headers = rawHeaders.map(h => cleanHeader(String(h || '')));
    const normalizedHeaders = headers.map(h => normalizeHeader(h));
    
    console.log('Raw headers:', rawHeaders);
    console.log('Cleaned headers:', headers);
    console.log('Normalized headers:', normalizedHeaders);
    
    const requiredHeaders = [
      { name: 'Description', normalized: 'description' },
      { name: 'Duration', normalized: 'duration' },
      { name: 'Project', normalized: 'project' },
      { name: 'Start date', normalized: 'start date' },
      { name: 'Stop date', normalized: 'stop date' },
    ];
    
    const missingHeaders = requiredHeaders.filter(
      req => !normalizedHeaders.some(h => h === req.normalized || h.includes(req.normalized))
    );
    
    if (missingHeaders.length > 0) {
      return {
        valid: false,
        error: `Missing required columns: ${missingHeaders.map(h => h.name).join(', ')}. Found: ${headers.join(', ')}`,
      };
    }
    
    return { valid: true, headers };
  } catch (err) {
    console.error('Validation error:', err);
    return {
      valid: false,
      error: `Unable to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}
