import type {
  TimeEntry,
  ProjectSummary,
  TagSummary,
  MemberSummary,
  DailySummary,
  PivotConfig,
  PivotResult,
  PivotCell,
  PivotField,
} from '../types';

/**
 * Calculate total minutes from entries
 */
export function getTotalMinutes(entries: TimeEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
}

/**
 * Get summary by project
 */
export function getProjectSummary(entries: TimeEntry[]): ProjectSummary[] {
  const totalMinutes = getTotalMinutes(entries);
  const projectMap = new Map<string, { minutes: number; count: number }>();

  entries.forEach(entry => {
    const existing = projectMap.get(entry.project) || { minutes: 0, count: 0 };
    projectMap.set(entry.project, {
      minutes: existing.minutes + entry.durationMinutes,
      count: existing.count + 1,
    });
  });

  return Array.from(projectMap.entries())
    .map(([project, data]) => ({
      project,
      totalMinutes: data.minutes,
      totalHours: data.minutes / 60,
      entryCount: data.count,
      percentage: totalMinutes > 0 ? (data.minutes / totalMinutes) * 100 : 0,
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);
}

/**
 * Get summary by tag
 */
export function getTagSummary(entries: TimeEntry[]): TagSummary[] {
  const totalMinutes = getTotalMinutes(entries);
  const tagMap = new Map<string, { minutes: number; count: number }>();

  entries.forEach(entry => {
    if (entry.tags.length === 0) {
      const existing = tagMap.get('(No Tag)') || { minutes: 0, count: 0 };
      tagMap.set('(No Tag)', {
        minutes: existing.minutes + entry.durationMinutes,
        count: existing.count + 1,
      });
    } else {
      entry.tags.forEach(tag => {
        const existing = tagMap.get(tag) || { minutes: 0, count: 0 };
        tagMap.set(tag, {
          minutes: existing.minutes + entry.durationMinutes,
          count: existing.count + 1,
        });
      });
    }
  });

  return Array.from(tagMap.entries())
    .map(([tag, data]) => ({
      tag,
      totalMinutes: data.minutes,
      totalHours: data.minutes / 60,
      entryCount: data.count,
      percentage: totalMinutes > 0 ? (data.minutes / totalMinutes) * 100 : 0,
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);
}

/**
 * Get summary by member
 */
export function getMemberSummary(entries: TimeEntry[]): MemberSummary[] {
  const totalMinutes = getTotalMinutes(entries);
  const memberMap = new Map<string, { minutes: number; count: number }>();

  entries.forEach(entry => {
    const existing = memberMap.get(entry.member) || { minutes: 0, count: 0 };
    memberMap.set(entry.member, {
      minutes: existing.minutes + entry.durationMinutes,
      count: existing.count + 1,
    });
  });

  return Array.from(memberMap.entries())
    .map(([member, data]) => ({
      member,
      totalMinutes: data.minutes,
      totalHours: data.minutes / 60,
      entryCount: data.count,
      percentage: totalMinutes > 0 ? (data.minutes / totalMinutes) * 100 : 0,
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);
}

/**
 * Get daily summary
 */
export function getDailySummary(entries: TimeEntry[]): DailySummary[] {
  const dailyMap = new Map<string, { minutes: number; count: number; projects: Record<string, number> }>();

  entries.forEach(entry => {
    const dateStr = entry.startDate.toISOString().split('T')[0];
    const existing = dailyMap.get(dateStr) || { minutes: 0, count: 0, projects: {} };
    
    existing.minutes += entry.durationMinutes;
    existing.count += 1;
    existing.projects[entry.project] = (existing.projects[entry.project] || 0) + entry.durationMinutes;
    
    dailyMap.set(dateStr, existing);
  });

  return Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      totalMinutes: data.minutes,
      totalHours: data.minutes / 60,
      entryCount: data.count,
      projects: data.projects,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Days of week in Monday-first order for proper sorting
const ORDERED_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * Get unique values for a field
 */
export function getUniqueValues(entries: TimeEntry[], field: PivotField): string[] {
  const values = new Set<string>();

  entries.forEach(entry => {
    if (field === 'tags') {
      if (entry.tags.length === 0) {
        values.add('(No Tag)');
      } else {
        entry.tags.forEach(tag => values.add(tag));
      }
    } else if (field === 'hour') {
      values.add(entry.hour.toString().padStart(2, '0') + ':00');
    } else if (field === 'weekNumber') {
      values.add(`Week ${entry.weekNumber}`);
    } else if (field === 'description') {
      values.add(entry.description);
    } else {
      values.add(String(entry[field]));
    }
  });

  const valuesArray = Array.from(values);
  
  // Custom sort for days of week (Monday first)
  if (field === 'dayName') {
    return valuesArray.sort((a, b) => ORDERED_DAYS.indexOf(a) - ORDERED_DAYS.indexOf(b));
  }
  
  // Numeric sort for week numbers
  if (field === 'weekNumber') {
    return valuesArray.sort((a, b) => {
      const numA = parseInt(a.replace('Week ', ''));
      const numB = parseInt(b.replace('Week ', ''));
      return numA - numB;
    });
  }
  
  return valuesArray.sort();
}

/**
 * Get field value(s) from entry
 */
function getFieldValues(entry: TimeEntry, field: PivotField): string[] {
  if (field === 'tags') {
    return entry.tags.length > 0 ? entry.tags : ['(No Tag)'];
  } else if (field === 'hour') {
    return [entry.hour.toString().padStart(2, '0') + ':00'];
  } else if (field === 'weekNumber') {
    return [`Week ${entry.weekNumber}`];
  } else if (field === 'description') {
    return [entry.description];
  }
  return [String(entry[field])];
}

/**
 * Build pivot table from entries
 */
export function buildPivotTable(entries: TimeEntry[], config: PivotConfig): PivotResult {
  const rows = getUniqueValues(entries, config.rowField);
  const columns = config.columnField ? getUniqueValues(entries, config.columnField) : ['Total'];
  
  const cells: Record<string, Record<string, PivotCell>> = {};
  const rowTotals: Record<string, number> = {};
  const columnTotals: Record<string, number> = {};
  let grandTotal = 0;

  // Initialize cells
  rows.forEach(row => {
    cells[row] = {};
    rowTotals[row] = 0;
    columns.forEach(col => {
      cells[row][col] = { rowKey: row, columnKey: col, value: 0, count: 0 };
    });
  });
  columns.forEach(col => {
    columnTotals[col] = 0;
  });

  // Populate cells
  entries.forEach(entry => {
    const rowValues = getFieldValues(entry, config.rowField);
    const colValues = config.columnField 
      ? getFieldValues(entry, config.columnField) 
      : ['Total'];

    rowValues.forEach(rowVal => {
      colValues.forEach(colVal => {
        if (cells[rowVal] && cells[rowVal][colVal]) {
          cells[rowVal][colVal].value += entry.durationMinutes;
          cells[rowVal][colVal].count += 1;
        }
      });
    });
  });

  // Calculate totals and apply aggregation
  rows.forEach(row => {
    columns.forEach(col => {
      const cell = cells[row][col];
      
      // Apply aggregation
      if (config.aggregation === 'average' && cell.count > 0) {
        cell.value = cell.value / cell.count;
      } else if (config.aggregation === 'count') {
        cell.value = cell.count;
      }
      // 'sum' keeps the value as-is

      rowTotals[row] += cell.value;
      columnTotals[col] += cell.value;
      grandTotal += cell.value;
    });
  });

  return {
    rows,
    columns,
    cells,
    rowTotals,
    columnTotals,
    grandTotal,
  };
}

/**
 * Get date range from entries
 */
export function getDateRange(entries: TimeEntry[]): { start: Date; end: Date } | null {
  if (entries.length === 0) return null;

  const dates = entries.map(e => e.startDate.getTime());
  return {
    start: new Date(Math.min(...dates)),
    end: new Date(Math.max(...dates)),
  };
}

/**
 * Filter entries by date range
 */
export function filterByDateRange(entries: TimeEntry[], start: Date, end: Date): TimeEntry[] {
  return entries.filter(entry => {
    const entryDate = entry.startDate.getTime();
    return entryDate >= start.getTime() && entryDate <= end.getTime();
  });
}

/**
 * Filter entries by projects
 */
export function filterByProjects(entries: TimeEntry[], projects: string[]): TimeEntry[] {
  if (projects.length === 0) return entries;
  return entries.filter(entry => projects.includes(entry.project));
}

/**
 * Filter entries by members
 */
export function filterByMembers(entries: TimeEntry[], members: string[]): TimeEntry[] {
  if (members.length === 0) return entries;
  return entries.filter(entry => members.includes(entry.member));
}

/**
 * Filter entries by tags
 */
export function filterByTags(entries: TimeEntry[], tags: string[]): TimeEntry[] {
  if (tags.length === 0) return entries;
  return entries.filter(entry =>
    entry.tags.some(tag => tags.includes(tag)) ||
    (tags.includes('(No Tag)') && entry.tags.length === 0)
  );
}

/**
 * Filter entries by descriptions
 */
export function filterByDescriptions(entries: TimeEntry[], descriptions: string[]): TimeEntry[] {
  if (descriptions.length === 0) return entries;
  return entries.filter(entry => descriptions.includes(entry.description));
}

/**
 * Get hourly distribution for a day or overall
 */
export function getHourlyDistribution(entries: TimeEntry[]): Record<number, number> {
  const hourlyMap: Record<number, number> = {};
  
  for (let i = 0; i < 24; i++) {
    hourlyMap[i] = 0;
  }

  entries.forEach(entry => {
    hourlyMap[entry.hour] += entry.durationMinutes;
  });

  return hourlyMap;
}

/**
 * Get day of week distribution
 */
export function getDayOfWeekDistribution(entries: TimeEntry[]): Record<string, number> {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayMap: Record<string, number> = {};
  
  dayNames.forEach(day => {
    dayMap[day] = 0;
  });

  entries.forEach(entry => {
    dayMap[entry.dayName] += entry.durationMinutes;
  });

  return dayMap;
}
