import type { ChartEntry, ChartSeries } from './types';

interface ChartProps {
  entries: ChartEntry[];
  series: ChartSeries[];
  unit: string;
  title: string;
}

export default function Chart({ entries, series, unit, title }: ChartProps) {
  const width = 560;
  const height = 205;
  const pad = { top: 14, right: 18, bottom: 34, left: 42 };
  const values = entries.flatMap((entry) => series
    .map((item) => entry[item.key])
    .filter((value): value is number => value !== null));

  if (values.length === 0) return <div className="chart-empty">Add an entry to see chart.</div>;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  const point = (value: number, index: number) => ({
    x: pad.left + (entries.length < 2 ? 0 : index * (width - pad.left - pad.right) / (entries.length - 1)),
    y: height - pad.bottom - ((value - (min - spread * 0.12)) / (spread * 1.24)) * (height - pad.top - pad.bottom),
  });

  return <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title} line chart`}>
    {[0, 1, 2, 3].map((line) => {
      const y = pad.top + line * (height - pad.top - pad.bottom) / 3;
      return <line key={line} x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="grid-line" />;
    })}
    {series.map((item) => {
      const measured = entries.flatMap((entry, index) => {
        const value = entry[item.key];
        return value === null ? [] : [{ entry, point: point(value, index) }];
      });
      return <g key={item.key}>
        <polyline className={`series-line ${item.color}`} points={measured.map(({ point: p }) => `${p.x},${p.y}`).join(' ')} />
        {measured.map(({ entry, point: p }) => <circle key={`${item.key}-${entry.date}`} cx={p.x} cy={p.y} r="3" className={`dot ${item.color}`} />)}
      </g>;
    })}
    {entries.map((entry, index) => <text key={entry.date} x={point(entries.length === 1 ? values[0] : min, index).x} y={height - 9} className="axis-label" textAnchor="middle">{entry.date.slice(5)}</text>)}
    <text x="8" y={pad.top + 6} className="axis-label">{max}{unit}</text>
    <text x="8" y={height - pad.bottom} className="axis-label">{min}{unit}</text>
  </svg>;
}
