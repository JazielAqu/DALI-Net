import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const { signInGoogle, continueAsGuest, signUpWithEmail, signInWithEmail } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setPending(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(name, email, password);
      } else {
        await signInWithEmail(email, password);
      }
      navigate('/');
    } catch (err) {
      const msg = err?.message || 'Authentication failed';
      setError(msg);
    } finally {
      setPending(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInGoogle();
      navigate('/');
    } catch (err) {
      setError(err?.message || 'Google sign-in failed');
    }
  };

  const handleGuest = async () => {
    try {
      await continueAsGuest();
      navigate('/');
    } catch (err) {
      setError(err?.message || 'Guest sign-in failed');
    }
  };

  return (
    <div className="login-container">
      <div className="card login-card">
        <h1>{mode === 'signup' ? 'Create account' : 'Sign in'}</h1>
        <p className="muted">Use email/password or jump in with Google or Guest.</p>

        <div className="auth-buttons">
          <button className="btn guest-btn" onClick={handleGuest}>Continue as Guest</button>
          <button className="btn btn-secondary" onClick={handleGoogle}>Sign in with Google</button>
        </div>

        <div className="divider">or with email</div>

        <form className="login-form" onSubmit={handleEmailAuth}>
          {mode === 'signup' && (
            <label>
              Name
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
          )}
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <div className="error-message">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div className="toggle-mode">
          {mode === 'signup' ? (
            <span>Already have an account? <button className="link-btn" onClick={() => setMode('login')}>Sign in</button></span>
          ) : (
            <span>No account? <button className="link-btn" onClick={() => setMode('signup')}>Create one</button></span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
