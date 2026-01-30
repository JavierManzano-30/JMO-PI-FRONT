import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, login as apiLogin, register as apiRegister } from '../api/snapnation.js';

const AuthContext = createContext(null);

const TOKEN_KEY = 'sn-token';
const USER_KEY = 'sn-user';
const PROFILE_KEY = 'sn-profile';
const DEFAULT_AVATAR = '/assets/photos/foto-perfil.jpg';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(TOKEN_KEY);
  });
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    const stored = window.localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [profile, setProfile] = useState(() => {
    if (typeof window === 'undefined') return null;
    const stored = window.localStorage.getItem(PROFILE_KEY);
    return stored
      ? JSON.parse(stored)
      : {
          name: '',
          bio: '',
          city: '',
          category: '',
          avatar: DEFAULT_AVATAR,
        };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (user) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (profile) {
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    setProfile((prev) => ({
      ...prev,
      name: user.display_name || user.username || prev.name || '',
      avatar: user.avatar_url || prev.avatar || DEFAULT_AVATAR,
    }));
  }, [user]);

  useEffect(() => {
    if (!token || user) return;
    getMe(token)
      .then((me) => setUser(me))
      .catch(() => {
        setToken(null);
        setUser(null);
      });
  }, [token, user]);

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      user: token ? user : null,
      profile,
      setProfile,
      login: async (email, password) => {
        const data = await apiLogin(email, password);
        setToken(data.token);
        setUser(data.user);
        return data.user;
      },
      register: async ({ username, email, password, community_id }) => {
        const data = await apiRegister({ username, email, password, community_id });
        setToken(data.token);
        setUser(data.user);
        return data.user;
      },
      refreshUser: async () => {
        if (!token) return null;
        const me = await getMe(token);
        setUser(me);
        return me;
      },
      logout: () => {
        setToken(null);
        setUser(null);
        setProfile({
          name: '',
          bio: '',
          city: '',
          category: '',
          avatar: DEFAULT_AVATAR,
        });
      },
    }),
    [profile, token, user]
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
