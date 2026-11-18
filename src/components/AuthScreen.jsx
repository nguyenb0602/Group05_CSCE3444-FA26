import { useState } from 'react';
import {
  confirmResetPassword,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  signIn,
  signUp,
} from 'aws-amplify/auth';
import { analyzeEmail } from '../lib/email.js';
import { passwordChecks, validatePassword } from '../lib/password.js';

const TITLES = {
  login: 'Log In', signup: 'Create Account', confirm: 'Confirm Your Email',
  reset: 'Reset Password', 'reset-confirm': 'Create New Password',
};

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const emailCheck = analyzeEmail(email);
  const isNewPassword = mode === 'signup' || mode === 'reset-confirm';
  const needsCode = mode === 'confirm' || mode === 'reset-confirm';

  function changeMode(nextMode, successMessage = '') {
    setMode(nextMode);
    setPassword('');
    setConfirmPassword('');
    setCode('');
    setError('');
    setMessage(successMessage);
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setError('');
    setMessage('');
    const cleanEmail = emailCheck.email;
    if (!emailCheck.valid) {
      setError(emailCheck.suggestion
        ? `That email address appears incomplete. Did you mean ${emailCheck.suggestion}?`
        : 'Enter a valid email address, including its domain.');
      return;
    }
    if (mode === 'signup' && !name.trim()) return setError('Enter your name.');
    if (isNewPassword) {
      const problem = validatePassword(password);
      if (problem) return setError(problem);
      if (password !== confirmPassword) return setError('Passwords do not match.');
    }
    if (needsCode && !code.trim()) return setError('Enter the verification code from your email.');

    setBusy(true);
    try {
      if (mode === 'signup') {
        const result = await signUp({
          username: cleanEmail,
          password,
          options: { userAttributes: { email: cleanEmail, name: name.trim() } },
        });
        if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
          changeMode('confirm', `A confirmation code was sent to ${cleanEmail}.`);
        } else if (result.isSignUpComplete) {
          changeMode('login', 'Account created. Please sign in.');
        } else {
          setError('This sign-up needs an additional step. Check your Cognito configuration.');
        }
      } else if (mode === 'confirm') {
        const result = await confirmSignUp({ username: cleanEmail, confirmationCode: code.trim() });
        if (result.isSignUpComplete) changeMode('login', 'Email verified. You can now log in.');
        else setError('Account confirmation was not completed.');
      } else if (mode === 'reset') {
        const result = await resetPassword({ username: cleanEmail });
        if (result.nextStep?.resetPasswordStep === 'DONE') {
          changeMode('login', 'Your password has been reset.');
        } else {
          changeMode('reset-confirm', `A password reset code was sent to ${cleanEmail}.`);
        }
      } else if (mode === 'reset-confirm') {
        await confirmResetPassword({ username: cleanEmail, confirmationCode: code.trim(), newPassword: password });
        changeMode('login', 'Password updated. Sign in with your new password.');
      } else {
        const result = await signIn({ username: cleanEmail, password });
        if (result.isSignedIn) {
          setPassword('');
          await onAuthenticated();
        } else if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
          changeMode('confirm', 'Please verify your email to finish signing up.');
        } else if (result.nextStep?.signInStep === 'RESET_PASSWORD') {
          changeMode('reset', 'You need to reset your password before signing in.');
        } else {
          setError('Additional authentication is required. Check your Cognito sign-in settings.');
        }
      }
    } catch (caught) {
      if (caught.name === 'UserNotConfirmedException') {
        changeMode('confirm', 'Confirm your email to finish registering.');
      } else {
        setError(caught.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (mode === 'confirm') await resendSignUpCode({ username: emailCheck.email });
      else await resetPassword({ username: emailCheck.email });
      setMessage('Another verification code has been sent.');
    } catch (caught) {
      setError(caught.message || 'Could not resend the code.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-brand">▣ StudyFlow</div>
        <h1 id="auth-title">{TITLES[mode]}</h1>
        <p className="muted">Plan your courses. Keep track of your deadlines.</p>
        <form onSubmit={submit} className="stack-form">
          {mode === 'signup' && (
            <label>Full name
              <input value={name} onChange={(e) => setName(e.target.value)}
                type="text" autoComplete="name" required placeholder="Jamie Doe" />
            </label>
          )}
          {needsCode ? (
            <p className="muted small">Email: <strong>{emailCheck.email}</strong></p>
          ) : (
            <label>Email
              <input value={email} onChange={(e) => setEmail(e.target.value)}
                type="email" autoComplete="email" required placeholder="you@example.com" />
            </label>
          )}
          {mode === 'signup' && emailCheck.suggestion && (
            <div className="email-suggestion" role="status">
              Did you mean <button type="button" className="text-button" onClick={() => setEmail(emailCheck.suggestion)}>{emailCheck.suggestion}</button>?
              <div className="muted small">Other legitimate domains are allowed. Cognito verifies the actual email address.</div>
            </div>
          )}
          {(mode === 'login' || isNewPassword) && (
            <label>{isNewPassword ? 'New password' : 'Password'}
              <input value={password} onChange={(e) => setPassword(e.target.value)}
                type="password" autoComplete={isNewPassword ? 'new-password' : 'current-password'}
                required placeholder={isNewPassword ? 'At least 10 characters' : 'Your password'} />
            </label>
          )}
          {isNewPassword && (
            <>
              <div className="password-requirements" aria-label="Password requirements">
                {passwordChecks(password).map(check => (
                  <div key={check.label} className={check.passed ? 'check-pass' : 'check-pending'}>
                    <span aria-hidden="true">{check.passed ? '✓' : '○'}</span> {check.label}
                  </div>
                ))}
              </div>
              <label>Confirm password
                <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password" autoComplete="new-password" required placeholder="Re-enter your password" />
              </label>
            </>
          )}
          {needsCode && (
            <label>Verification code
              <input value={code} onChange={(e) => setCode(e.target.value)} required
                type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="Enter the code" />
            </label>
          )}
          {error && <p className="error-message" role="alert">{error}</p>}
          {message && <p className="success-message" role="status">{message}</p>}
          <button disabled={busy} type="submit" className="primary full">
            {busy ? 'Please wait…' : {
              login: 'Log In', signup: 'Sign Up', confirm: 'Verify Email',
              reset: 'Email Reset Code', 'reset-confirm': 'Change Password',
            }[mode]}
          </button>
        </form>
        {needsCode ? (
          <p className="switch-auth">
            <button type="button" className="text-button" disabled={busy} onClick={resendCode}>Resend code</button>{' · '}
            <button type="button" className="text-button" disabled={busy} onClick={() => changeMode('login')}>Back to Login</button>
          </p>
        ) : (
          <p className="switch-auth">
            {mode === 'login' && (
              <>
                <button type="button" className="text-button" disabled={busy} onClick={() => changeMode('signup')}>Create an account</button>{' · '}
                <button type="button" className="text-button" disabled={busy} onClick={() => changeMode('reset')}>Forgot password?</button>
              </>
            )}
            {mode !== 'login' && (
              <button type="button" className="text-button" disabled={busy} onClick={() => changeMode('login')}>Back to Login</button>
            )}
          </p>
        )}
        <p className="demo-notice"><strong>Cloud-connected StudyFlow:</strong> Cognito handles account passwords and confirmation. Your courses and events sync through AWS after sign-in.</p>
      </section>
    </main>
  );
}
