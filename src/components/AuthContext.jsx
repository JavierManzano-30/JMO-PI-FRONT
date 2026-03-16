import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService.js';
import * as usersService from '../services/usersService.js';
import { ApiError } from '../lib/apiClient.js';
import { clearStoredSession, getStoredSession, persistSession } from '../lib/session.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredSession()?.token || null);
  const [user, setUser] = useState(() => getStoredSession()?.user || null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsBootstrapping(false);
      return;
    }

    usersService
      .getMe()
      .then((me) => {
        setUser(me);
        persistSession({ token, user: me });
      })
      .catch(() => {
        setToken(null);
        setUser(null);
        clearStoredSession();
      })
      .finally(() => setIsBootstrapping(false));
  }, [token]);

  const setSession = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    persistSession({ token: nextToken, user: nextUser });
  };

  const login = async ({ email, password }) => {
    const session = await authService.login({ email, password });
    setSession(session.token, session.user);
    return session;
  };

  const register = async ({ username, email, password, communityId }) => {
    const session = await authService.register({
      username,
      email,
      password,
      community_id: communityId ? Number(communityId) : undefined,
    });

    setSession(session.token, session.user);
    return session;
  };

  const refreshMe = async () => {
    if (!token) {
      return null;
    }

    try {
      const me = await usersService.getMe();
      setUser(me);
      persistSession({ token, user: me });
      return me;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearStoredSession();
        setToken(null);
        setUser(null);
      }
      throw error;
    }
  };

  const updateProfile = async (payload) => {
    const updated = await usersService.updateMe(payload);
    setUser(updated);
    persistSession({ token, user: updated });
    return updated;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearStoredSession();
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isBootstrapping,
      login,
      register,
      refreshMe,
      updateProfile,
      logout,
    }),
    [token, user, isBootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
