import { useEffect, useState, type FormEvent } from 'react';
import { api } from './api';
import Chart from './Chart';
import type { ChartEntry, ChartId, ChartSeries } from './types';

interface ChartCardProps {
  title: string;
  chartId: ChartId;
  series: ChartSeries[];
  unit: string;
}

export default function ChartCard({ title, chartId, series, unit }: ChartCardProps) {
  const [entries, setEntries] = useState<ChartEntry[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [values, setValues] = useState<Record<string, string>>({ value1: '', value2: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    api.getChart(chartId).then(setEntries).catch(() => setError('Could not load chart data. Is the database server running?'));
  }, [chartId]);

  async function addEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const entry: ChartEntry = {
      date,
      value1: Number(values.value1),
      value2: series.length > 1 ? Number(values.value2) : null,
    };
    try {
      setEntries(await api.saveChartEntry(chartId, entry));
      setValues({ value1: '', value2: '' });
      setError('');
    } catch {
      setError('Could not save entry. Check that the database server is running.');
    }
  }

  return <section className="card tracker-card">
    <div className="card-heading"><h2>{title}</h2><span>{unit} · {entries.length} entries</span></div>
    <Chart entries={entries} series={series} unit={unit} title={title} />
    <div className="legend">{series.map((item) => <span key={item.key}><i className={item.color} />{item.name}</span>)}</div>
    <form className="entry-form" onSubmit={addEntry}>
      <label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
      {series.map((item) => <label key={item.key}>{item.name}<input type="number" step="0.1" value={values[item.key]} onChange={(event) => setValues({ ...values, [item.key]: event.target.value })} placeholder={unit} required /></label>)}
      <button type="submit">Add entry</button>
    </form>
    {error && <p className="error-message">{error}</p>}
  </section>;
}
