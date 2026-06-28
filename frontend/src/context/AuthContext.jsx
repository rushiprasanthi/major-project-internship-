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

  const logout = async (localOnly = false) => {
    // Clear user immediately for instant UI reaction
    setUser(null);
    
    // SECURE: Prevent infinite loop if interceptor triggered this logout
    if (localOnly) return;

    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API failed, continuing local clear', error);
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
          // Clear locally on initialization without hitting the logout endpoint again
          await logout(true);
        }
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      // Pass `true` to avoid triggering an API call that could return 401 and loop infinitely
      logout(true).finally(() => {
        window.location.href = '/login'; 
      });
    };

    const handleForbidden = () => {
      // Force redirect to a safe zone if an action is strictly forbidden (403)
      window.location.href = '/dashboard';
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('auth:forbidden', handleForbidden);
    
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('auth:forbidden', handleForbidden);
    };
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