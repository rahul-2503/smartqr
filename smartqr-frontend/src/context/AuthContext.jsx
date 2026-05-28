import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext(null);

const API_BASE = 'https://smartqr-api-rahul-f8hpaqeudbdeesa5.centralindia-01.azurewebsites.net/api';

const PERSONAL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
  'aol.com', 'protonmail.com', 'zoho.com', 'yandex.com', 'mail.com',
  'gmx.com', 'live.com', 'msn.com', 'me.com', 'inbox.com',
  'yahoo.co.in', 'rediffmail.com', 'yahoo.in'
];

function extractDomain(email) {
  if (!email || !email.includes('@')) return null;
  return email.split('@')[1].toLowerCase();
}

function isBusinessEmail(email) {
  const domain = extractDomain(email);
  if (!domain) return false;
  return !PERSONAL_DOMAINS.includes(domain);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Fetch organization profile when user is authenticated
  const fetchOrganization = async (firebaseUser) => {
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`${API_BASE}/getOrganization`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrganization(data.organization);
      } else {
        setOrganization(null);
      }
    } catch (err) {
      console.error('Failed to fetch organization:', err);
      setOrganization(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchOrganization(firebaseUser);
      } else {
        setOrganization(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    if (!isBusinessEmail(email)) {
      const err = 'Enterprise login requires a company email. Personal emails (Gmail, Yahoo, etc.) are not permitted.';
      setAuthError(err);
      throw new Error(err);
    }
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await fetchOrganization(cred.user);
      return cred.user;
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' 
        ? 'Invalid credentials. Please check your email and password.'
        : err.code === 'auth/user-not-found'
        ? 'No account found with this email. Please register first.'
        : err.code === 'auth/too-many-requests'
        ? 'Too many failed attempts. Please try again later.'
        : 'Authentication failed. Please try again.';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const register = async (email, password, orgDetails) => {
    setAuthError(null);
    if (!isBusinessEmail(email)) {
      const err = 'Registration requires a verified organization email. Personal emails are not permitted.';
      setAuthError(err);
      throw new Error(err);
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      
      // Register organization
      const token = await cred.user.getIdToken();
      const res = await fetch(`${API_BASE}/registerOrganization`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(orgDetails)
      });
      
      if (!res.ok) {
        let errMessage = 'Organization registration failed';
        try {
          const errData = await res.json();
          errMessage = errData.error || errMessage;
        } catch (e) {
          errMessage = `Server error (${res.status}). The system might be updating. Please try again in a minute.`;
        }
        throw new Error(errMessage);
      }
      
      const data = await res.json();
      setOrganization(data.organization);
      return cred.user;
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        const msg = 'An account with this email already exists. Please sign in instead.';
        setAuthError(msg);
        throw new Error(msg);
      }
      setAuthError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setOrganization(null);
  };

  const refreshOrg = async () => {
    if (user) await fetchOrganization(user);
  };

  return (
    <AuthContext.Provider value={{
      user,
      organization,
      loading,
      authError,
      login,
      register,
      logout,
      refreshOrg,
      isBusinessEmail,
      setAuthError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
