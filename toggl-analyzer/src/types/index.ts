// Raw data from Toggl Track export
// Values can be strings, numbers, or Date objects depending on how xlsx parses them
export interface RawTimeEntry {
  Description: string | undefined;
  Duration: string | undefined;
  Member: string | undefined;
  Email: string | undefined;
  Project: string | undefined;
  Tags: string | undefined;
  'Start date': string | number | Date | undefined;
  'Stop date': string | number | Date | undefined;
  'Start time': string | undefined;
  'Stop time': string | undefined;
}

// Processed time entry with computed fields
export interface TimeEntry {
  id: string;
  description: string;
  durationMinutes: number;
  durationRaw: string;
  member: string;
  email: string;
  project: string;
  tags: string[];
  startDate: Date;
  stopDate: Date;
  startTime: string;
  stopTime: string;
  // Computed fields for analysis
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  dayName: string;
  weekNumber: number;
  month: number;
  monthName: string;
  year: number;
  hour: number; // Start hour for time-of-day analysis
}

// Summary statistics
export interface ProjectSummary {
  project: string;
  totalMinutes: number;
  totalHours: number;
  entryCount: number;
  percentage: number;
}

export interface TagSummary {
  tag: string;
  totalMinutes: number;
  totalHours: number;
  entryCount: number;
  percentage: number;
}

export interface MemberSummary {
  member: string;
  totalMinutes: number;
  totalHours: number;
  entryCount: number;
  percentage: number;
}

export interface DailySummary {
  date: string;
  totalMinutes: number;
  totalHours: number;
  entryCount: number;
  projects: Record<string, number>;
}

// Pivot table configuration
export type PivotField = 'description' | 'project' | 'member' | 'tags' | 'dayName' | 'monthName' | 'weekNumber' | 'hour';
export type AggregationType = 'sum' | 'average' | 'count';

export interface PivotConfig {
  rowField: PivotField;
  columnField: PivotField | null;
  valueField: 'durationMinutes';
  aggregation: AggregationType;
}

export interface PivotCell {
  rowKey: string;
  columnKey: string | null;
  value: number;
  count: number;
}

export interface PivotResult {
  rows: string[];
  columns: string[];
  cells: Record<string, Record<string, PivotCell>>;
  rowTotals: Record<string, number>;
  columnTotals: Record<string, number>;
  grandTotal: number;
}

// Chart data types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TrendDataPoint {
  date: string;
  value: number;
  project?: string;
}

// App state
export interface AnalysisState {
  entries: TimeEntry[];
  isLoading: boolean;
  error: string | null;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  filters: {
    projects: string[];
    members: string[];
    tags: string[];
  };
}
