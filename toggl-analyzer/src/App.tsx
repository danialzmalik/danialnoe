import { useState, useCallback, useMemo, useEffect } from 'react';
import type { TimeEntry } from './types';
import { parseXlsxFile, validateTogglFormat, formatDuration } from './utils/parser';
import { getDateRange, filterByDateRange, filterByProjects, filterByDescriptions, getTotalMinutes } from './utils/analysis';
import { FileDropZone } from './components/FileDropZone';
import { SummaryDashboard } from './components/SummaryDashboard';
import { PivotTable } from './components/PivotTable';
import { TrendCharts } from './components/TrendCharts';
import './App.css';

type TabId = 'summary' | 'pivot' | 'trends';

function App() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('summary');
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string } | null>(null);
  const [projectFilter, setProjectFilter] = useState<string[]>([]);
  const [descriptionFilter, setDescriptionFilter] = useState<string[]>([]);

  const handleFileLoaded = useCallback((data: ArrayBuffer, name: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Validating file format...');
      const validation = validateTogglFormat(data);
      if (!validation.valid) {
        console.error('Validation failed:', validation.error);
        setError(validation.error || 'Invalid file format');
        setIsLoading(false);
        return;
      }
      console.log('Validation passed, parsing file...');

      const parsedEntries = parseXlsxFile(data);
      console.log('Parsed entries:', parsedEntries.length);
      
      if (parsedEntries.length === 0) {
        setError('No time entries found in the file.');
        setIsLoading(false);
        return;
      }

      setEntries(parsedEntries);
      setFileName(name);
      setDateFilter(null);
      setProjectFilter([]);
    } catch (err) {
      console.error('Parse error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to parse file: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  const handleReset = useCallback(() => {
    setEntries([]);
    setFileName(null);
    setError(null);
    setDateFilter(null);
    setProjectFilter([]);
    setDescriptionFilter([]);
    setActiveTab('summary');
  }, []);

  // Get date range from entries
  const dateRange = useMemo(() => getDateRange(entries), [entries]);

  // Get all unique projects
  const allProjects = useMemo(() => {
    const projects = new Set(entries.map(e => e.project));
    return Array.from(projects).sort();
  }, [entries]);

  // Get all unique descriptions (filtered by project selection if any)
  const allDescriptions = useMemo(() => {
    // Filter entries by project first, then get unique descriptions
    let sourceEntries = entries;
    if (projectFilter.length > 0) {
      sourceEntries = filterByProjects(entries, projectFilter);
    }
    const descriptions = new Set(sourceEntries.map(e => e.description));
    return Array.from(descriptions).sort();
  }, [entries, projectFilter]);

  // Clear description filter when project filter changes and descriptions no longer exist
  useEffect(() => {
    if (descriptionFilter.length > 0) {
      const validDescriptions = descriptionFilter.filter(d => allDescriptions.includes(d));
      if (validDescriptions.length !== descriptionFilter.length) {
        setDescriptionFilter(validDescriptions);
      }
    }
  }, [allDescriptions]);

  // Filter entries based on current filters
  const filteredEntries = useMemo(() => {
    let result = entries;

    if (dateFilter) {
      const start = new Date(dateFilter.start);
      const end = new Date(dateFilter.end);
      result = filterByDateRange(result, start, end);
    }

    if (projectFilter.length > 0) {
      result = filterByProjects(result, projectFilter);
    }

    if (descriptionFilter.length > 0) {
      result = filterByDescriptions(result, descriptionFilter);
    }

    return result;
  }, [entries, dateFilter, projectFilter, descriptionFilter]);

  const hasData = entries.length > 0;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <h1>Toggl Analyzer</h1>
          </div>
          {hasData && (
            <button className="reset-button" onClick={handleReset}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Load New File
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        {!hasData ? (
          <div className="upload-section">
            <div className="upload-container">
              <h2>Analyze Your Time Tracking Data</h2>
              <p className="subtitle">
                Upload your Toggl Track export file to get insights into how you spend your time
              </p>
              <FileDropZone
                onFileLoaded={handleFileLoaded}
                onError={handleError}
                isLoading={isLoading}
              />
              {error && (
                <div className="error-message">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}
              <div className="format-info">
                <h4>Expected Format</h4>
                <p>
                  Export your detailed report from Toggl Track as an Excel file (.xlsx).
                  The file should contain columns: Description, Duration, Member, Email, Project, Tags, Start date, Stop date, Start time, Stop time.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="analysis-section">
            {/* File info bar */}
            <div className="file-info-bar">
              <div className="file-info">
                <span className="file-icon">📊</span>
                <span className="file-name">{fileName}</span>
                <span className="entry-count">{entries.length} entries</span>
                <span className="total-time">{formatDuration(getTotalMinutes(entries))}</span>
              </div>
            </div>

            {/* Filters */}
            <div className="filters-bar">
              <div className="filter-group">
                <label>Date Range</label>
                <div className="date-inputs">
                  <input
                    type="date"
                    value={dateFilter?.start || (dateRange ? dateRange.start.toISOString().split('T')[0] : '')}
                    min={dateRange ? dateRange.start.toISOString().split('T')[0] : ''}
                    max={dateRange ? dateRange.end.toISOString().split('T')[0] : ''}
                    onChange={(e) => setDateFilter(prev => ({
                      start: e.target.value,
                      end: prev?.end || (dateRange ? dateRange.end.toISOString().split('T')[0] : e.target.value)
                    }))}
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={dateFilter?.end || (dateRange ? dateRange.end.toISOString().split('T')[0] : '')}
                    min={dateRange ? dateRange.start.toISOString().split('T')[0] : ''}
                    max={dateRange ? dateRange.end.toISOString().split('T')[0] : ''}
                    onChange={(e) => setDateFilter(prev => ({
                      start: prev?.start || (dateRange ? dateRange.start.toISOString().split('T')[0] : e.target.value),
                      end: e.target.value
                    }))}
                  />
                </div>
              </div>

              <div className="filter-group">
                <label>Projects</label>
                <select
                  multiple
                  value={projectFilter}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                    setProjectFilter(selected);
                  }}
                  className="project-select"
                >
                  {allProjects.map(project => (
                    <option key={project} value={project}>{project}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Descriptions</label>
                <select
                  multiple
                  value={descriptionFilter}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                    setDescriptionFilter(selected);
                  }}
                  className="description-select"
                >
                  {allDescriptions.map(desc => (
                    <option key={desc} value={desc}>{desc}</option>
                  ))}
                </select>
              </div>

              {(dateFilter || projectFilter.length > 0 || descriptionFilter.length > 0) && (
                <button
                  className="clear-filters"
                  onClick={() => {
                    setDateFilter(null);
                    setProjectFilter([]);
                    setDescriptionFilter([]);
                  }}
                >
                  Clear Filters
                </button>
              )}

              <div className="filter-summary">
                Showing <strong>{filteredEntries.length}</strong> of {entries.length} entries
                ({formatDuration(getTotalMinutes(filteredEntries))})
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveTab('summary')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                Summary
              </button>
              <button
                className={`tab ${activeTab === 'pivot' ? 'active' : ''}`}
                onClick={() => setActiveTab('pivot')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h18v18H3z" />
                  <path d="M3 9h18" />
                  <path d="M9 3v18" />
                </svg>
                Pivot Table
              </button>
              <button
                className={`tab ${activeTab === 'trends' ? 'active' : ''}`}
                onClick={() => setActiveTab('trends')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                Trends
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'summary' && <SummaryDashboard entries={filteredEntries} />}
              {activeTab === 'pivot' && <PivotTable entries={filteredEntries} />}
              {activeTab === 'trends' && <TrendCharts entries={filteredEntries} />}
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Toggl Track Time Analyzer • Client-side analysis – your data never leaves your browser</p>
      </footer>
    </div>
  );
}

export default App;
