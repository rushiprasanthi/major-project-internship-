import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { user: userData } = response.data.data;
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    setUser(null);

    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout failed', error);
    }
  };

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await api.get('/auth/me');
        const restoredUser = response.data.data.user || response.data.data;
        setUser(restoredUser);
      } catch (error) {
        if (error.response?.status === 401) {
          await logout();
        }
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const hasRole = (roles) => {
    if (!user) return false;

    const normalizedRole = user.role?.toLowerCase();
    if (Array.isArray(roles)) {
      return roles.map((role) => role.toLowerCase()).includes(normalizedRole);
    }
    return normalizedRole === roles.toLowerCase();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: Boolean(user),
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
