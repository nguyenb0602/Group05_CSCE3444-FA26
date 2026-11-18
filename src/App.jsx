import { useEffect, useState } from 'react';
import { fetchUserAttributes, getCurrentUser, signOut } from 'aws-amplify/auth';
import AuthScreen from './components/AuthScreen.jsx';
import Dashboard from './components/Dashboard.jsx';

async function loadCognitoUser() {
  const currentUser = await getCurrentUser();
  const attributes = await fetchUserAttributes();
  const email = attributes.email || currentUser.signInDetails?.loginId || currentUser.username;
  return {
    id: currentUser.userId,
    email,
    name: attributes.name || email.split('@')[0],
  };
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cognito SDK restores the signed-in session across page refreshes.
  useEffect(() => {
    let cancelled = false;
    loadCognitoUser()
      .then((account) => { if (!cancelled) setUser(account); })
      .catch(() => { if (!cancelled) setUser(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function authenticated() {
    const account = await loadCognitoUser();
    setUser(account);
  }

  async function logout() {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      window.alert(error.message || 'Could not sign out. Please try again.');
    }
  }

  if (loading) return <main className="auth-page"><p>Checking your session…</p></main>;

  return user ? (
    <Dashboard key={user.id} user={user} onLogout={logout} />
  ) : (
    <AuthScreen onAuthenticated={authenticated} />
  );
}
