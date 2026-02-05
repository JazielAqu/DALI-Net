import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthChange,
  loginAnonymous,
  loginGoogle,
  logoutFirebase,
  signUpEmail,
  signInEmail,
  linkPassword,
  changePassword,
} from '../services/firebaseClient';
import { authAPI, membersAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [personaMemberId, setPersonaMemberId] = useState(null);
  const [personaProfile, setPersonaProfile] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);

  // Restore from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const storedToken = localStorage.getItem('authToken');
    const storedPersona = localStorage.getItem('personaMemberId');
    const storedPersonaProfile = localStorage.getItem('personaProfile');
    const storedNeedsProfile = localStorage.getItem('needsProfile');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    if (storedToken) setAuthToken(storedToken);
    if (storedPersona) setPersonaMemberId(storedPersona);
    if (storedPersonaProfile) {
      try {
        setPersonaProfile(JSON.parse(storedPersonaProfile));
      } catch {
        localStorage.removeItem('personaProfile');
      }
    }
    if (storedNeedsProfile === 'true') setNeedsProfile(true);
  }, []);

  // Sync with Firebase auth state (anon or Google/email)
  useEffect(() => {
    const unsub = onAuthChange(async (fbUser) => {
      if (!fbUser) {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('currentUser');
        if (storedToken && storedUser) {
          try {
            setCurrentUser(JSON.parse(storedUser));
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
          setAuthToken(storedToken);
          return;
        }
        logout();
        return;
      }

      const token = await fbUser.getIdToken();
      const role = fbUser.isAnonymous ? 'guest' : 'user';
      const providerIds = (fbUser.providerData || []).map((p) => p.providerId);
      const hasPassword = providerIds.includes('password');
      const user = {
        id: fbUser.uid,
        uid: fbUser.uid,
        role,
        name: role === 'guest' ? 'Guest' : fbUser.displayName || fbUser.email || 'User',
        email: fbUser.email || null,
        profileImage: fbUser.photoURL || '',
        image: fbUser.photoURL || '',
        providers: providerIds,
        hasPassword,
      };
      setUser(user);
      setAuthToken(token);
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', JSON.stringify(user));

      try {
        const res = await membersAPI.getById(fbUser.uid);
        const profile = res?.data?.data || {};
        const requiredFields = ['major', 'home', 'favoriteThing1', 'favoriteThing2', 'favoriteThing3'];
        const incomplete = requiredFields.some((f) => !profile[f]);
        const needs = profile.completedProfile ? false : incomplete;
        setNeedsProfile(needs);
        localStorage.setItem('needsProfile', needs ? 'true' : 'false');
      } catch (err) {
        if (err?.response?.status === 404) {
          setNeedsProfile(true);
          localStorage.setItem('needsProfile', 'true');
        } else {
          console.warn('Profile lookup failed', err);
        }
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setUser = (user) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  };

  const login = (user, token) => {
    setUser(user);
    setAuthToken(token);
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    setPersonaMemberId(null);
    setPersonaProfile(null);
    setNeedsProfile(false);
    logoutFirebase().catch(() => {});
    localStorage.removeItem('authToken');
    localStorage.removeItem('personaMemberId');
    localStorage.removeItem('personaProfile');
    localStorage.removeItem('needsProfile');
  };

  const loginGuest = (token, user = { id: 'guest', role: 'guest', name: 'Guest' }) => {
    setUser(user);
    setAuthToken(token);
    setPersonaMemberId(null);
    setPersonaProfile(null);
    if (token) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.removeItem('personaMemberId');
      localStorage.removeItem('personaProfile');
      localStorage.removeItem('needsProfile');
    } else {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('personaMemberId');
      localStorage.removeItem('personaProfile');
      localStorage.removeItem('needsProfile');
    }
  };

  const signInGuest = () => loginAnonymous();
  const signInGoogle = () => loginGoogle();
  const signUpWithEmail = (name, email, password) => signUpEmail(name, email, password);
  const signInWithEmail = (email, password) => signInEmail(email, password);

  const continueAsGuest = async () => {
    try {
      await loginAnonymous();
    } catch (err) {
      try {
        const res = await authAPI.guestLogin();
        const token = res?.data?.data?.token;
        const user = res?.data?.data?.user || { id: 'guest', role: 'guest', name: 'Guest' };
        if (token) {
          loginGuest(token, user);
          return;
        }
      } catch (e) {
        console.error('Guest fallback failed', e);
        throw e;
      }
      throw err;
    }
  };

  const setPersona = (memberId) => {
    setPersonaMemberId(memberId);
    if (memberId) {
      localStorage.setItem('personaMemberId', memberId);
    } else {
      localStorage.removeItem('personaMemberId');
      localStorage.removeItem('personaProfile');
      setPersonaProfile(null);
    }
  };

  const setPersonaWithProfile = async (memberId) => {
    if (!memberId) {
      setPersona(null);
      return;
    }
    try {
      const res = await membersAPI.getById(memberId);
      const m = res?.data?.data;
      setPersona(memberId);
      if (m) {
        const profile = {
          id: memberId,
          name: m.name,
          image: m.profileImage || m.picture || m.image || '',
        };
        setPersonaProfile(profile);
        localStorage.setItem('personaProfile', JSON.stringify(profile));
      }
    } catch (err) {
      console.error('Could not load persona profile', err);
      setPersona(memberId);
    }
  };

  // Ensure member doc exists after email/Google signup
  useEffect(() => {
    const ensureProfile = async () => {
      if (!currentUser || currentUser.role === 'guest') return;
      if (!authToken) return;
      try {
        await membersAPI.createSelf();
      } catch (err) {
        // ignore if fails; feed is still accessible
      }
    };
    ensureProfile();
  }, [currentUser]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setUser,
        authToken,
        setAuthToken,
        login,
        logout,
        loginGuest,
        personaMemberId,
        personaProfile,
        setPersona,
        setPersonaWithProfile,
        needsProfile,
        setNeedsProfile,
        signInGuest,
        signInGoogle,
        signUpWithEmail,
        signInWithEmail,
        continueAsGuest,
        linkPassword,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  // Gracefully handle unexpected renders outside provider (e.g., during HMR)
  return context || {
    currentUser: null,
    needsProfile: false,
    personaProfile: null,
    personaMemberId: null,
    loginGuest: () => {},
    logout: () => {},
  };
};
