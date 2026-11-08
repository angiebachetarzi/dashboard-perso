import { useEffect, useState, type FormEvent } from 'react';
import { api } from './api';
import type { Activity } from './types';

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.getActivities().then(setActivities).catch(() => setError('Could not load activities.'));
  }, []);

  async function addActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) return;
    try {
      setActivities(await api.addActivity(text.trim()));
      setText('');
      setError('');
    } catch {
      setError('Could not add activity.');
    }
  }

  async function toggleActivity(activity: Activity) {
    try {
      setActivities(await api.updateActivity(activity.id, !activity.done));
    } catch {
      setError('Could not update activity.');
    }
  }

  async function deleteActivity(id: string) {
    try {
      setActivities(await api.deleteActivity(id));
    } catch {
      setError('Could not delete activity.');
    }
  }

  return <section className="card activities-card">
    <div className="card-heading"><h2>Activities</h2><span>{activities.filter((item) => item.done).length}/{activities.length} done</span></div>
    {activities.length === 0 && <p className="empty-list">No activities yet.</p>}
    <ul className="activity-list">
      {activities.map((activity) => <li key={activity.id}>
        <label className={`activity-label ${activity.done ? 'done' : ''}`}>
          <input type="checkbox" checked={activity.done} onChange={() => toggleActivity(activity)} />
          <span>{activity.text}</span>
        </label>
        <button type="button" className="text-button" aria-label={`Delete ${activity.text}`} onClick={() => deleteActivity(activity.id)}>×</button>
      </li>)}
    </ul>
    <form className="activity-form" onSubmit={addActivity}>
      <input aria-label="New activity" placeholder="Add an activity…" value={text} onChange={(event) => setText(event.target.value)} required />
      <button type="submit">Add</button>
    </form>
    {error && <p className="error-message">{error}</p>}
  </section>;
}
