import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import type { TimeEntry } from '../types';
import { getDailySummary, getHourlyDistribution, getDayOfWeekDistribution } from '../utils/analysis';
import { formatDuration } from '../utils/parser';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrendChartsProps {
  entries: TimeEntry[];
}

export function TrendCharts({ entries }: TrendChartsProps) {
  const dailySummary = useMemo(() => getDailySummary(entries), [entries]);
  const hourlyDistribution = useMemo(() => getHourlyDistribution(entries), [entries]);
  const dayOfWeekDistribution = useMemo(() => getDayOfWeekDistribution(entries), [entries]);

  // Daily trend data
  const dailyTrendData = useMemo(() => ({
    labels: dailySummary.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [{
      label: 'Hours Tracked',
      data: dailySummary.map(d => d.totalHours),
      borderColor: '#667eea',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  }), [dailySummary]);

  // Hourly distribution data
  const hourlyData = useMemo(() => ({
    labels: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`),
    datasets: [{
      label: 'Total Minutes',
      data: Array.from({ length: 24 }, (_, i) => hourlyDistribution[i]),
      backgroundColor: '#4fd1c5',
      borderRadius: 4,
    }],
  }), [hourlyDistribution]);

  // Day of week data
  const dayOfWeekData = useMemo(() => {
    const orderedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return {
      labels: orderedDays.map(d => d.slice(0, 3)),
      datasets: [{
        label: 'Hours',
        data: orderedDays.map(d => (dayOfWeekDistribution[d] || 0) / 60),
        backgroundColor: [
          '#667eea', '#667eea', '#667eea', '#667eea', '#667eea',
          '#f093fb', '#f093fb',
        ],
        borderRadius: 4,
      }],
    };
  }, [dayOfWeekDistribution]);

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: unknown) => {
            const ctx = context as { raw: number };
            return `${ctx.raw.toFixed(2)} hours`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: '#2d3748' },
        ticks: { 
          color: '#a0aec0',
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        grid: { color: '#2d3748' },
        ticks: { color: '#a0aec0' },
        beginAtZero: true,
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
        grid: { display: false },
        ticks: { color: '#a0aec0' },
      },
      y: {
        grid: { color: '#2d3748' },
        ticks: { color: '#a0aec0' },
        beginAtZero: true,
      },
    },
  };

  const dayBarOptions = {
    ...barOptions,
    plugins: {
      ...barOptions.plugins,
      tooltip: {
        callbacks: {
          label: (context: unknown) => {
            const ctx = context as { raw: number };
            return `${ctx.raw.toFixed(2)} hours`;
          },
        },
      },
    },
  };

  // Calculate trend insights
  const insights = useMemo(() => {
    // Most productive hour
    const maxHour = Object.entries(hourlyDistribution).reduce(
      (max, [hour, minutes]) => minutes > max.minutes ? { hour: parseInt(hour), minutes } : max,
      { hour: 0, minutes: 0 }
    );

    // Most productive day
    const maxDay = Object.entries(dayOfWeekDistribution).reduce(
      (max, [day, minutes]) => minutes > max.minutes ? { day, minutes } : max,
      { day: '', minutes: 0 }
    );

    // Average daily hours
    const avgDaily = dailySummary.length > 0
      ? dailySummary.reduce((sum, d) => sum + d.totalHours, 0) / dailySummary.length
      : 0;

    // Peak and low days
    const sortedDays = [...dailySummary].sort((a, b) => b.totalHours - a.totalHours);
    const peakDay = sortedDays[0];
    const lowDay = sortedDays[sortedDays.length - 1];

    return {
      mostProductiveHour: `${maxHour.hour.toString().padStart(2, '0')}:00`,
      mostProductiveDay: maxDay.day,
      averageDailyHours: avgDaily.toFixed(2),
      peakDay: peakDay ? {
        date: new Date(peakDay.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        hours: peakDay.totalHours.toFixed(2),
      } : null,
      lowDay: lowDay ? {
        date: new Date(lowDay.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        hours: lowDay.totalHours.toFixed(2),
      } : null,
    };
  }, [hourlyDistribution, dayOfWeekDistribution, dailySummary]);

  return (
    <div className="trend-charts">
      {/* Insights Cards */}
      <div className="insights-row">
        <div className="insight-card">
          <div className="insight-icon">🕐</div>
          <div className="insight-content">
            <div className="insight-label">Peak Hour</div>
            <div className="insight-value">{insights.mostProductiveHour}</div>
          </div>
        </div>
        <div className="insight-card">
          <div className="insight-icon">📅</div>
          <div className="insight-content">
            <div className="insight-label">Most Active Day</div>
            <div className="insight-value">{insights.mostProductiveDay}</div>
          </div>
        </div>
        <div className="insight-card">
          <div className="insight-icon">📊</div>
          <div className="insight-content">
            <div className="insight-label">Daily Average</div>
            <div className="insight-value">{insights.averageDailyHours}h</div>
          </div>
        </div>
        {insights.peakDay && (
          <div className="insight-card highlight">
            <div className="insight-icon">🔥</div>
            <div className="insight-content">
              <div className="insight-label">Peak Day</div>
              <div className="insight-value">{insights.peakDay.date}</div>
              <div className="insight-sub">{insights.peakDay.hours}h tracked</div>
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card chart-card wide">
          <h3>Daily Time Tracked</h3>
          <p className="chart-description">
            Time tracked over the selected period
          </p>
          <div className="chart-container">
            <Line data={dailyTrendData} options={lineOptions} />
          </div>
        </div>

        <div className="card chart-card">
          <h3>Activity by Hour of Day</h3>
          <p className="chart-description">
            When you typically start tracking time
          </p>
          <div className="chart-container">
            <Bar data={hourlyData} options={barOptions} />
          </div>
        </div>

        <div className="card chart-card">
          <h3>Activity by Day of Week</h3>
          <p className="chart-description">
            Total hours per weekday (weekends highlighted)
          </p>
          <div className="chart-container">
            <Bar data={dayOfWeekData} options={dayBarOptions} />
          </div>
        </div>
      </div>

      <style>{`
        .trend-charts {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .insights-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .insight-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: #1a1a2e;
          border-radius: 12px;
          padding: 20px;
        }

        .insight-card.highlight {
          background: linear-gradient(135deg, #1a1a2e 0%, #2d2d50 100%);
          border: 1px solid #667eea;
        }

        .insight-icon {
          font-size: 2rem;
        }

        .insight-content {
          display: flex;
          flex-direction: column;
        }

        .insight-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #a0aec0;
          margin-bottom: 4px;
        }

        .insight-value {
          font-size: 1.25rem;
          font-weight: 600;
          color: #e2e8f0;
        }

        .insight-sub {
          font-size: 0.875rem;
          color: #667eea;
          margin-top: 2px;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .card {
          background: #1a1a2e;
          border-radius: 12px;
          padding: 20px;
        }

        .chart-card h3 {
          margin: 0 0 4px;
          color: #e2e8f0;
          font-size: 1.125rem;
        }

        .chart-description {
          margin: 0 0 16px;
          color: #718096;
          font-size: 0.875rem;
        }

        .chart-card.wide {
          grid-column: 1 / -1;
        }

        .chart-container {
          height: 280px;
          position: relative;
        }

        .chart-card.wide .chart-container {
          height: 320px;
        }

        @media (max-width: 900px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }

          .chart-card.wide {
            grid-column: 1;
          }
        }

        @media (max-width: 600px) {
          .insights-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
