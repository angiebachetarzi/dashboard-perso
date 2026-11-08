import ChartCard from './ChartCard';
import Activities from './Activities';
import Notes from './Notes';
import UsefulLinks from './UsefulLinks';
import type { ChartSeries } from './types';

const oneCat: ChartSeries[] = [{ key: 'value1', name: 'Weight', color: 'blue' }];
const twoCats: ChartSeries[] = [
  { key: 'value1', name: 'Cat 1', color: 'blue' },
  { key: 'value2', name: 'Cat 2', color: 'orange' },
];

interface AppProps {
  onLogout: () => void;
}

export default function App({ onLogout }: AppProps) {
  return <main className="dashboard">
    <header className="page-header">
      <div><p className="eyebrow">PERSONAL SPACE</p><h1>Dashboard</h1></div>
      <div className="header-actions">
        <p className="today">Your trackers, ideas, and reading in one place</p>
        <button type="button" className="secondary-button" onClick={onLogout}>Lock</button>
      </div>
    </header>
    <div className="layout">
      <div className="left-column">
        <ChartCard title="My weight" chartId="personal-weight" series={oneCat} unit="kg" />
        <Notes />
        <ChartCard title="Cats’ weight" chartId="cats-weight" series={twoCats} unit="kg" />
      </div>
      <div className="right-column">
        <UsefulLinks />
        <Activities />
        <ChartCard title="Cats’ heart rate" chartId="cats-bpm" series={twoCats} unit="bpm" />
      </div>
    </div>
    <footer>Your data is stored in a private Netlify Blobs store in Frankfurt, EU.</footer>
  </main>;
}
