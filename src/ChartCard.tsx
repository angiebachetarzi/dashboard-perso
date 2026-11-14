import { useEffect, useState, type FormEvent } from 'react';
import { api } from './api';
import Chart from './Chart';
import { formatDate, parseDisplayDate, todayDisplayDate } from './date';
import type { ChartEntry, ChartId, ChartSeries } from './types';

type ChartView = 'chart' | 'list';

interface ChartCardProps {
  title: string;
  chartId: ChartId;
  series: ChartSeries[];
  unit: string;
}

export default function ChartCard({ title, chartId, series, unit }: ChartCardProps) {
  const [entries, setEntries] = useState<ChartEntry[]>([]);
  const [date, setDate] = useState(todayDisplayDate());
  const [values, setValues] = useState<Record<string, string>>({ value1: '', value2: '' });
  const [error, setError] = useState('');
  const [view, setView] = useState<ChartView>('chart');

  useEffect(() => {
    api.getChart(chartId).then(setEntries).catch(() => setError('Could not load chart data. Try reloading the dashboard.'));
  }, [chartId]);

  async function addEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isoDate = parseDisplayDate(date);
    if (!isoDate) {
      setError('Enter a valid date as dd-mm-yyyy.');
      return;
    }
    if (series.length > 1 && !values.value1 && !values.value2) {
      setError('Enter a value for at least one cat.');
      return;
    }
    const entry: ChartEntry = {
      date: isoDate,
      value1: values.value1 ? Number(values.value1) : null,
      value2: series.length > 1 && values.value2 ? Number(values.value2) : null,
    };
    try {
      setEntries(await api.saveChartEntry(chartId, entry));
      setValues({ value1: '', value2: '' });
      setError('');
    } catch {
      setError('Could not save entry. Try again.');
    }
  }

  async function deleteValue(entry: ChartEntry, item: ChartSeries) {
    if (!window.confirm(`Delete ${item.name}'s value for ${formatDate(entry.date)}?`)) return;
    try {
      setEntries(await api.deleteChartValue(chartId, entry.date, item.key));
      setError('');
    } catch {
      setError('Could not delete value. Try again.');
    }
  }

  return <section className="card tracker-card">
    <div className="card-heading">
      <div><h2>{title}</h2><span className="chart-count">{unit} · {entries.length} entries</span></div>
      <div className="chart-controls" role="group" aria-label={`${title} display options`}>
        <button type="button" className={view === 'chart' ? 'selected' : ''} aria-pressed={view === 'chart'} onClick={() => setView('chart')}>Chart</button>
        <button type="button" className={view === 'list' ? 'selected' : ''} aria-pressed={view === 'list'} onClick={() => setView('list')}>List</button>
      </div>
    </div>
    {view === 'chart' ? <>
      <Chart entries={entries} series={series} unit={unit} title={title} />
      <div className="legend">{series.map((item) => <span key={item.key}><i className={item.color} />{item.name}</span>)}</div>
    </> : <div className="chart-table-wrap">
      <table className="chart-table">
        <thead><tr><th scope="col">Date</th>{series.map((item) => <th scope="col" key={item.key}>{item.name} ({unit})</th>)}</tr></thead>
        <tbody>
          {entries.map((entry) => <tr key={entry.date}>
            <td>{formatDate(entry.date)}</td>
            {series.map((item) => <td key={item.key}>
              {entry[item.key] === null ? <span>—</span> : <span className="chart-value-cell">
                {entry[item.key]}
                <button type="button" className="delete-entry" aria-label={`Delete ${item.name} value for ${formatDate(entry.date)}`} onClick={() => deleteValue(entry, item)}>×</button>
              </span>}
            </td>)}
          </tr>)}
          {entries.length === 0 && <tr><td colSpan={series.length + 1} className="empty-table">No entries yet.</td></tr>}
        </tbody>
      </table>
    </div>}
    <form className="entry-form" onSubmit={addEntry}>
      <label>Date<input type="text" inputMode="text" placeholder="dd-mm-yyyy" pattern="\d{2}-\d{2}-\d{4}" maxLength={10} value={date} onChange={(event) => setDate(event.target.value)} aria-label="Date in dd-mm-yyyy format" required /></label>
      {series.map((item) => <label key={item.key}>{item.name}<input type="number" step="0.1" value={values[item.key]} onChange={(event) => setValues({ ...values, [item.key]: event.target.value })} placeholder={unit} required={series.length === 1} /></label>)}
      <button type="submit">Add entry</button>
    </form>
    {error && <p className="error-message">{error}</p>}
  </section>;
}
