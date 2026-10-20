import { useState } from 'react';
import { addAccount, getAccounts } from '../lib/storage.js';

export default function AuthScreen({ onSignIn }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function changeMode(nextMode) {
    setMode(nextMode);
    setPassword('');
    setError('');
  }

  function submit(event) {
    event.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    const accounts = getAccounts();

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Enter your name.');
        return;
      }
      if (accounts.some((account) => account.email === cleanEmail)) {
        setError('That email already has a demo profile. Choose Log In.');
        return;
      }
      // The password field is cosmetic in this frontend-only exercise.
      // Never save or authenticate real passwords with localStorage.
      const account = { name: name.trim(), email: cleanEmail };
      addAccount(account);
      onSignIn(account);
    } else {
      const account = accounts.find((item) => item.email === cleanEmail);
      if (!account) {
        setError('No demo profile found. Choose Sign Up first.');
        return;
      }
      // In demo mode, the password is NOT verified.
      onSignIn(account);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-brand">StudyFlow</div>
        <h1 id="auth-title">{mode === 'login' ? 'Log In' : 'Create Account'}</h1>
        <p className="muted">Plan your courses. Keep track of your deadlines.</p>

        <form onSubmit={submit} className="stack-form">
          {mode === 'signup' && (
            <label>
              Full Name
              <input value={name} onChange={(e) => setName(e.target.value)}
                type="text" autoComplete="name" required placeholder="Jamie Doe" />
            </label>
          )}
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)}
              type="email" autoComplete="email" required placeholder="you@example.com" />
          </label>
          <label>
            Password <span className="muted small">(DEMO ONLY)</span>
            <input value={password} onChange={(e) => setPassword(e.target.value)}
              type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required placeholder="Enter a test password" />
          </label>
          {error && <p className="error-message" role="alert">{error}</p>}
          <button type="submit" className="primary full">
            {mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <p className="switch-auth">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button className="text-button" type="button"
            onClick={() => changeMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Sign Up' : 'Log In'}
          </button>
        </p>
        <p className="demo-notice">
          <strong>Classroom Demo:</strong> This is not real authentication. Profiles and
          schedules stay in this browser. Test passwords are neither stored nor checked.
          Do not enter a real password.
        </p>
      </section>
    </main>
  );
}
