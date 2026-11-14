import { useEffect, useState, type FormEvent } from 'react';
import { api } from './api';
import type { Todo, TodoPriority } from './types';

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [error, setError] = useState('');

  useEffect(() => {
    api.getTodos().then(setTodos).catch(() => setError('Could not load to-dos.'));
  }, []);

  async function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) return;
    try {
      setTodos(await api.addTodo(text.trim(), priority));
      setText('');
      setError('');
    } catch {
      setError('Could not add to-do.');
    }
  }

  async function toggleTodo(todo: Todo) {
    try {
      setTodos(await api.updateTodo(todo.id, !todo.done));
    } catch {
      setError('Could not update to-do.');
    }
  }

  async function deleteTodo(id: string) {
    try {
      setTodos(await api.deleteTodo(id));
    } catch {
      setError('Could not delete to-do.');
    }
  }

  return <section className="card activities-card">
    <div className="card-heading"><h2>To-do</h2><span>{todos.filter((item) => item.done).length}/{todos.length} done</span></div>
    {todos.length === 0 && <p className="empty-list">No to-dos yet.</p>}
    <ul className="activity-list todo-list">
      {todos.map((todo) => <li key={todo.id}>
        <label className={`activity-label ${todo.done ? 'done' : ''}`}>
          <input type="checkbox" checked={todo.done} onChange={() => toggleTodo(todo)} />
          <span>{todo.text}</span>
        </label>
        <span className={`todo-priority ${todo.priority}`}>{todo.priority}</span>
        <button type="button" className="text-button" aria-label={`Delete ${todo.text}`} onClick={() => deleteTodo(todo.id)}>×</button>
      </li>)}
    </ul>
    <form className="todo-form" onSubmit={addTodo}>
      <input aria-label="New to-do" placeholder="Add a to-do…" value={text} onChange={(event) => setText(event.target.value)} required />
      <select aria-label="Priority" value={priority} onChange={(event) => setPriority(event.target.value as TodoPriority)}>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <button type="submit">Add</button>
    </form>
    {error && <p className="error-message">{error}</p>}
  </section>;
}
