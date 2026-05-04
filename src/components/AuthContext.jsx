import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../context/AuthContext';
import { resolveBackendUser } from '../services/supabaseService';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // 1. Función para hidratar el usuario con su perfil
  const hydrateUser = async (authUser) => {
    console.log("🛠️ Hidratando usuario...");
    if (!authUser) {
      setUser(null);
      return;
    }

    try {
      console.log("✅ Usando metadata de autenticación");
      const metadata = authUser.user_metadata || {};
      const backendUser = await resolveBackendUser(authUser);
      
      setUser({
        ...authUser,
        authId: authUser.id,
        backendId: backendUser?.id || null,
        username: backendUser?.username || metadata.username || authUser.email?.split('@')[0],
        full_name: backendUser?.display_name || metadata.full_name || metadata.name || authUser.email?.split('@')[0],
        avatar_url: backendUser?.avatar_url || metadata.avatar_url || metadata.picture || null,
        community_id: backendUser?.community_id ?? null,
        community_name: backendUser?.community_name || metadata.region_name || metadata.community_name || null,
        regionName: backendUser?.community_name || metadata.region_name || metadata.community_name || null,
        displayName: backendUser?.display_name || metadata.full_name || metadata.name || authUser.email?.split('@')[0],
        avatarUrl: backendUser?.avatar_url || metadata.avatar_url || metadata.picture || null
      });
    } catch (err) {
      console.error("❌ Fallo en hidratación:", err);
      setUser(authUser);
    }
  };

  useEffect(() => {
    // 2. Escuchar cambios de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {

      console.log(`🔔 Evento Auth: ${event}`);
      setSession(currentSession);
      
      if (currentSession?.user) {
        setIsBootstrapping(false);
        hydrateUser(currentSession.user); // Lanzamos en paralelo
      } else {
        setUser(null);
        setIsBootstrapping(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    
    if (data.session) {
      setSession(data.session);
      // ¡CLAVE! Lanzamos la hidratación pero NO la esperamos
      hydrateUser(data.session.user);
    }
    
    return data;
  };

  const loginWithOAuth = async (provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/app/dashboard'
      }
    });
    if (error) throw error;
    return data;
  };

  const register = async ({ username, email, password, regionId }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: username,
          region_id: regionId
        }
      }
    });

    if (error) throw error;

    if (data?.session) {
      setSession(data.session);
      await hydrateUser(data.session.user);
    }

    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  // Mantenemos estas funciones como placeholders para compatibilidad si se usan en otros sitios
  const refreshMe = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);
    return currentUser;
  };

  const updateProfile = async (payload) => {
    const { data, error } = await supabase.auth.updateUser({
      data: payload
    });
    if (error) throw error;
    setUser(data.user);
    return data.user;
  };

  const value = useMemo(
    () => ({
      session,
      user,
      isAuthenticated: Boolean(session), // Permitimos entrar si hay sesión, aunque el perfil esté cargando
      isBootstrapping,
      login,
      loginWithOAuth,
      register,
      refreshMe,
      updateProfile,
      logout,
    }),
    [session, user, isBootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
