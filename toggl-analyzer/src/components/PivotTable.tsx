import { useState, useMemo } from 'react';
import type { TimeEntry, PivotConfig, PivotField, AggregationType } from '../types';
import { buildPivotTable } from '../utils/analysis';
import { formatDuration } from '../utils/parser';

interface PivotTableProps {
  entries: TimeEntry[];
}

const FIELD_OPTIONS: { value: PivotField; label: string }[] = [
  { value: 'description', label: 'Description' },
  { value: 'project', label: 'Project' },
  { value: 'member', label: 'Member' },
  { value: 'tags', label: 'Tags' },
  { value: 'dayName', label: 'Day of Week' },
  { value: 'monthName', label: 'Month' },
  { value: 'weekNumber', label: 'Week Number' },
  { value: 'hour', label: 'Hour of Day' },
];

const AGGREGATION_OPTIONS: { value: AggregationType; label: string }[] = [
  { value: 'sum', label: 'Sum (Total)' },
  { value: 'average', label: 'Average' },
  { value: 'count', label: 'Count' },
];

export function PivotTable({ entries }: PivotTableProps) {
  const [config, setConfig] = useState<PivotConfig>({
    rowField: 'project',
    columnField: 'dayName',
    valueField: 'durationMinutes',
    aggregation: 'sum',
  });

  const pivotResult = useMemo(() => buildPivotTable(entries, config), [entries, config]);

  const formatValue = (value: number): string => {
    if (config.aggregation === 'count') {
      return value.toString();
    }
    return formatDuration(value);
  };

  return (
    <div className="pivot-table-container">
      <div className="pivot-controls">
        <div className="control-group">
          <label htmlFor="rowField">Rows</label>
          <select
            id="rowField"
            value={config.rowField}
            onChange={(e) => setConfig({ ...config, rowField: e.target.value as PivotField })}
          >
            {FIELD_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="columnField">Columns</label>
          <select
            id="columnField"
            value={config.columnField || ''}
            onChange={(e) => setConfig({ 
              ...config, 
              columnField: e.target.value ? e.target.value as PivotField : null 
            })}
          >
            <option value="">None (Total Only)</option>
            {FIELD_OPTIONS.filter(opt => opt.value !== config.rowField).map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="aggregation">Aggregation</label>
          <select
            id="aggregation"
            value={config.aggregation}
            onChange={(e) => setConfig({ ...config, aggregation: e.target.value as AggregationType })}
          >
            {AGGREGATION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="pivot-table-wrapper">
        <table className="pivot-table">
          <thead>
            <tr>
              <th className="row-header">
                {FIELD_OPTIONS.find(f => f.value === config.rowField)?.label}
              </th>
              {pivotResult.columns.map(col => (
                <th key={col} className="col-header">{col}</th>
              ))}
              <th className="total-header">Total</th>
            </tr>
          </thead>
          <tbody>
            {pivotResult.rows.map(row => (
              <tr key={row}>
                <td className="row-label">{row}</td>
                {pivotResult.columns.map(col => {
                  const cell = pivotResult.cells[row]?.[col];
                  return (
                    <td key={col} className="cell-value">
                      {cell && cell.value > 0 ? formatValue(cell.value) : '-'}
                    </td>
                  );
                })}
                <td className="row-total">
                  {formatValue(pivotResult.rowTotals[row])}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="footer-label">Total</td>
              {pivotResult.columns.map(col => (
                <td key={col} className="col-total">
                  {formatValue(pivotResult.columnTotals[col])}
                </td>
              ))}
              <td className="grand-total">
                {formatValue(pivotResult.grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <style>{`
        .pivot-table-container {
          background: #1a1a2e;
          border-radius: 12px;
          padding: 20px;
        }

        .pivot-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid #2d3748;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 150px;
        }

        .control-group label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #a0aec0;
        }

        .control-group select {
          padding: 8px 12px;
          border: 1px solid #4a5568;
          border-radius: 6px;
          background: #2d3748;
          color: #e2e8f0;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .control-group select:hover {
          border-color: #667eea;
        }

        .control-group select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
        }

        .pivot-table-wrapper {
          overflow-x: auto;
        }

        .pivot-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .pivot-table th,
        .pivot-table td {
          padding: 10px 12px;
          text-align: right;
          border: 1px solid #2d3748;
        }

        .pivot-table th {
          background: #252545;
          color: #a0aec0;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .pivot-table .row-header {
          text-align: left;
        }

        .pivot-table .row-label {
          text-align: left;
          font-weight: 500;
          color: #e2e8f0;
          background: #1e1e36;
        }

        .pivot-table .cell-value {
          color: #e2e8f0;
        }

        .pivot-table .row-total,
        .pivot-table .col-total {
          background: #252545;
          color: #667eea;
          font-weight: 600;
        }

        .pivot-table .grand-total {
          background: #667eea;
          color: #fff;
          font-weight: 700;
        }

        .pivot-table .footer-label {
          text-align: left;
          font-weight: 600;
          color: #a0aec0;
          background: #252545;
        }

        .pivot-table tbody tr:hover td {
          background: #252545;
        }

        .pivot-table tbody tr:hover td.row-label {
          background: #2d2d50;
        }

        @media (max-width: 768px) {
          .pivot-controls {
            flex-direction: column;
          }

          .control-group {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
