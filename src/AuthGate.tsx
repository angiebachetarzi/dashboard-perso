import { useState, type FormEvent } from 'react';
import { api, clearDashboardPassword } from './api';
import App from './App';

export default function AuthGate() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await api.authenticate(password);
      setAuthenticated(true);
      setError('');
      setPassword('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Login failed');
      clearDashboardPassword();
    }
  }

  function logout() {
    clearDashboardPassword();
    setAuthenticated(false);
  }

  if (authenticated) return <App onLogout={logout} />;

  return <main className="login-page">
    <form className="login-card" onSubmit={login}>
      <p className="eyebrow">PRIVATE DASHBOARD</p>
      <h1>Welcome back</h1>
      <p>Enter your dashboard password to continue.</p>
      <input
        autoFocus
        type="password"
        autoComplete="current-password"
        aria-label="Dashboard password"
        placeholder="Dashboard password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      <button type="submit">Unlock dashboard</button>
      {error && <p className="error-message">{error}</p>}
    </form>
  </main>;
}
