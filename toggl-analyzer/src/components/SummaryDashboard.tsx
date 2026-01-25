import { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import type { TimeEntry } from '../types';
import { getProjectSummary, getTagSummary, getMemberSummary, getTotalMinutes } from '../utils/analysis';
import { formatDuration, formatDecimalHours } from '../utils/parser';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SummaryDashboardProps {
  entries: TimeEntry[];
}

const CHART_COLORS = [
  '#667eea', '#f093fb', '#4fd1c5', '#f6ad55', '#fc8181',
  '#68d391', '#63b3ed', '#d69e2e', '#b794f4', '#f687b3',
  '#48bb78', '#ed8936', '#9f7aea', '#38b2ac', '#ed64a6',
];

export function SummaryDashboard({ entries }: SummaryDashboardProps) {
  const projectSummary = useMemo(() => getProjectSummary(entries), [entries]);
  const tagSummary = useMemo(() => getTagSummary(entries), [entries]);
  const memberSummary = useMemo(() => getMemberSummary(entries), [entries]);
  const totalMinutes = useMemo(() => getTotalMinutes(entries), [entries]);

  const projectChartData = useMemo(() => ({
    labels: projectSummary.map(p => p.project),
    datasets: [{
      data: projectSummary.map(p => p.totalMinutes),
      backgroundColor: CHART_COLORS.slice(0, projectSummary.length),
      borderColor: '#1a1a2e',
      borderWidth: 2,
    }],
  }), [projectSummary]);

  const tagChartData = useMemo(() => ({
    labels: tagSummary.slice(0, 10).map(t => t.tag),
    datasets: [{
      label: 'Minutes',
      data: tagSummary.slice(0, 10).map(t => t.totalMinutes),
      backgroundColor: '#667eea',
      borderRadius: 4,
    }],
  }), [tagSummary]);

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#e2e8f0',
          padding: 12,
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: unknown) => {
            const ctx = context as { label: string; raw: number };
            const minutes = ctx.raw;
            return `${ctx.label}: ${formatDuration(minutes)} (${((minutes / totalMinutes) * 100).toFixed(1)}%)`;
          },
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: unknown) => {
            const ctx = context as { raw: number };
            return formatDuration(ctx.raw);
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: '#2d3748' },
        ticks: { color: '#a0aec0' },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#e2e8f0' },
      },
    },
  };

  return (
    <div className="summary-dashboard">
      {/* Overview Cards */}
      <div className="overview-cards">
        <div className="card stat-card">
          <div className="stat-value">{formatDuration(totalMinutes)}</div>
          <div className="stat-label">Total Time Tracked</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{entries.length}</div>
          <div className="stat-label">Time Entries</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{projectSummary.length}</div>
          <div className="stat-label">Projects</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{memberSummary.length}</div>
          <div className="stat-label">Team Members</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="card chart-card">
          <h3>Time by Project</h3>
          <div className="chart-container">
            <Pie data={projectChartData} options={pieOptions} />
          </div>
        </div>

        <div className="card chart-card">
          <h3>Time by Tag (Top 10)</h3>
          <div className="chart-container bar-chart">
            <Bar data={tagChartData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="tables-row">
        <div className="card table-card">
          <h3>Project Breakdown</h3>
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Duration</th>
                <th>Hours</th>
                <th>Entries</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {projectSummary.map(p => (
                <tr key={p.project}>
                  <td className="project-name">{p.project}</td>
                  <td>{formatDuration(p.totalMinutes)}</td>
                  <td>{formatDecimalHours(p.totalMinutes)}</td>
                  <td>{p.entryCount}</td>
                  <td>{p.percentage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card table-card">
          <h3>Tag Breakdown</h3>
          <table>
            <thead>
              <tr>
                <th>Tag</th>
                <th>Duration</th>
                <th>Entries</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {tagSummary.map(t => (
                <tr key={t.tag}>
                  <td className="tag-name">{t.tag}</td>
                  <td>{formatDuration(t.totalMinutes)}</td>
                  <td>{t.entryCount}</td>
                  <td>{t.percentage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .summary-dashboard {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .overview-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }

        .card {
          background: #1a1a2e;
          border-radius: 12px;
          padding: 20px;
        }

        .stat-card {
          text-align: center;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #a0aec0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .charts-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
        }

        .chart-card h3 {
          margin: 0 0 16px;
          color: #e2e8f0;
          font-size: 1.125rem;
        }

        .chart-container {
          height: 300px;
          position: relative;
        }

        .chart-container.bar-chart {
          height: 320px;
        }

        .tables-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 24px;
        }

        .table-card h3 {
          margin: 0 0 16px;
          color: #e2e8f0;
          font-size: 1.125rem;
        }

        .table-card table {
          width: 100%;
          border-collapse: collapse;
        }

        .table-card th,
        .table-card td {
          padding: 10px 12px;
          text-align: left;
          border-bottom: 1px solid #2d3748;
        }

        .table-card th {
          color: #a0aec0;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .table-card td {
          color: #e2e8f0;
          font-size: 0.875rem;
        }

        .table-card tbody tr:hover {
          background: #252545;
        }

        .project-name,
        .tag-name {
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .charts-row,
          .tables-row {
            grid-template-columns: 1fr;
          }

          .chart-container {
            height: 250px;
          }
        }
      `}</style>
    </div>
  );
}
