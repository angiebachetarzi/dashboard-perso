import { useEffect, useState, type FormEvent } from 'react';
import { api } from './api';
import type { UsefulLink } from './types';

export default function UsefulLinks() {
  const [links, setLinks] = useState<UsefulLink[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.getUsefulLinks().then(setLinks).catch(() => setError('Could not load links. Is the database server running?'));
  }, []);

  async function addLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setLinks(await api.addUsefulLink({ title: title.trim(), url: url.trim() }));
      setTitle('');
      setUrl('');
      setError('');
    } catch {
      setError('Could not add link. Use a valid http or https URL.');
    }
  }

  async function deleteLink(id: string) {
    try {
      setLinks(await api.deleteUsefulLink(id));
    } catch {
      setError('Could not delete link.');
    }
  }

  return <section className="card links-card">
    <div className="card-heading"><h2>Useful links</h2></div>
    <ul className="useful-link-list">
      {links.map((link) => <li key={link.id}>
        <a href={link.url} target="_blank" rel="noreferrer">{link.title} ↗</a>
        <button type="button" className="text-button" aria-label={`Delete ${link.title}`} onClick={() => deleteLink(link.id)}>×</button>
      </li>)}
    </ul>
    <form className="link-form" onSubmit={addLink}>
      <input aria-label="Link name" placeholder="Link name" value={title} onChange={(event) => setTitle(event.target.value)} required />
      <input aria-label="URL" type="url" placeholder="https://…" value={url} onChange={(event) => setUrl(event.target.value)} required />
      <button type="submit">Add link</button>
    </form>
    {error && <p className="error-message">{error}</p>}
  </section>;
}
