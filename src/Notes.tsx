import { useEffect, useState, type FormEvent } from 'react';
import { api, isNoteCategory } from './api';
import type { Note, NoteCategory } from './types';

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [category, setCategory] = useState<NoteCategory>('App ideas');
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.getNotes().then(setNotes).catch(() => setError('Could not load notes. Is the database server running?'));
  }, []);

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) return;
    try {
      setNotes(await api.addNote({ category, text: text.trim() }));
      setText('');
      setError('');
    } catch {
      setError('Could not save note. Check that the database server is running.');
    }
  }

  async function deleteNote(id: string) {
    try {
      setNotes(await api.deleteNote(id));
    } catch {
      setError('Could not delete note.');
    }
  }

  return <section className="card notes-card">
    <div className="card-heading"><h2>Notes</h2></div>
    <form className="note-form" onSubmit={addNote}>
      <select value={category} onChange={(event) => isNoteCategory(event.target.value) && setCategory(event.target.value)}>
        <option>App ideas</option><option>Story ideas</option>
      </select>
      <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Write a note…" rows={2} />
      <button type="submit">Add note</button>
    </form>
    <div className="note-columns">
      {(['Story ideas', 'App ideas'] as NoteCategory[]).map((group) => <div className="note-group" key={group}>
        <h3>{group}</h3>
        {notes.filter((note) => note.category === group).map((note) => <article key={note.id} className="note-item">
          <p>{note.text}</p><button type="button" className="text-button" aria-label="Delete note" onClick={() => deleteNote(note.id)}>×</button>
        </article>)}
      </div>)}
    </div>
    {error && <p className="error-message">{error}</p>}
  </section>;
}
