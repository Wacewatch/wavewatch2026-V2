import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('ww_token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const { data } = await API.get('/api/auth/me', config);
      setUser(data.user);
    } catch (err) {
      if (!err.response) {
        return;
      }
      setUser(null);
      localStorage.removeItem('ww_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  useEffect(() => {
    const handleLogout = () => setUser(null);
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  useEffect(() => {
    if (!user) return;
    const sendHeartbeat = () => API.post('/api/user/heartbeat').catch(() => {});
    sendHeartbeat();
    const iv = setInterval(sendHeartbeat, 60000);
    return () => clearInterval(iv);
  }, [user]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const token = localStorage.getItem('ww_token');
        if (token && !user) checkAuth();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user, checkAuth]);

  const signIn = async (email, password) => {
    const { data } = await API.post('/api/auth/login', { email, password });
    if (data.token) localStorage.setItem('ww_token', data.token);
    setUser(data.user);
    return data;
  };

  const signUp = async (username, email, password) => {
    const { data } = await API.post('/api/auth/register', { username, email, password });
    if (data.token) localStorage.setItem('ww_token', data.token);
    setUser(data.user);
    return data;
  };

  const signOut = async () => {
    try { await API.post('/api/auth/logout'); } catch {}
    localStorage.removeItem('ww_token');
    setUser(null);
  };

  const refreshUser = async () => { await checkAuth(); };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
