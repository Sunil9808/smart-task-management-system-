import { createContext, useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from '../services/api';
export const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setUser((await api.get('/auth/me')).data.data.user);
    } catch (err) {
      if (err.response?.status !== 401) setError(errorMessage(err));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
    const expire = () => setUser(null);
    window.addEventListener('session-expired', expire);
    return () => window.removeEventListener('session-expired', expire);
  }, [refresh]);
  async function authenticate(mode, values) {
    const response = await api.post(`/auth/${mode}`, values);
    setError('');
    setUser(response.data.data.user);
  }
  async function logout() {
    await api.post('/auth/logout');
    setError('');
    setUser(null);
  }
  return (
    <AuthContext.Provider value={{ user, loading, error, refresh, authenticate, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
