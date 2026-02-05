import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';
import { auth } from '../services/firebaseClient';
import { fetchSignInMethodsForEmail } from 'firebase/auth';

const LoginPage = () => {
  const { signInGoogle, continueAsGuest, signUpWithEmail, signInWithEmail } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setPending(true);
    const emailInput = email.trim();
    const formatProvider = (method) => {
      if (!method) return 'that provider';
      const id = method.split('.')[0] || '';
      if (id.toLowerCase() === 'google') return 'Google';
      return id.charAt(0).toUpperCase() + id.slice(1);
    };
    try {
      if (mode === 'signup') {
        await signUpWithEmail(name, emailInput, password);
      } else {
        await signInWithEmail(emailInput, password);
      }
      navigate('/');
    } catch (err) {
      const raw = err?.code;
      let msg;

      // 1. Direct checks (Now possible because protection is OFF)
      if (raw === 'auth/user-not-found') {
        msg = 'No account found with this email. Please sign up first.';
      } 
      else if (raw === 'auth/wrong-password') {
        // Wrong password may also mean the account has no password linked
        try {
          const methods = await fetchSignInMethodsForEmail(auth, emailInput);
          if (methods.length === 0) {
            msg = 'No account found with this email. Please sign up first.';
          } else if (!methods.includes('password')) {
            const provider = formatProvider(methods[0]);
            msg = `This account was created with ${provider}. Please sign in using that method.`;
          } else {
            msg = 'Incorrect password. Please try again.';
          }
        } catch {
          msg = 'Incorrect password. Please try again.';
        }
      } 
      // 2. Handle modern SDK generic codes or Social-only accounts
      else if (raw === 'auth/invalid-credential' || raw === 'auth/invalid-login-credentials') {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, emailInput);
          
          if (methods.length === 0) {
            msg = 'No account found with this email. Please sign up first.';
          } else if (!methods.includes('password')) {
            const provider = formatProvider(methods[0]);
            msg = `This account was created with ${provider}. Please sign in using that method.`;
          } else {
            msg = 'Incorrect password. Please try again.';
          }
        } catch {
          msg = 'Invalid email or password.';
        }
      } 
      else if (raw === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } 
      else {
        msg = err?.message || 'Authentication failed';
      }

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
            <div className="input-with-icon">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowPw((prev) => !prev)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                <img
                  src={`${import.meta.env.BASE_URL || '/'}${showPw ? 'eye.svg' : 'eye-off.svg'}`}
                  alt=""
                  className="eye-icon"
                />
              </button>
            </div>
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
