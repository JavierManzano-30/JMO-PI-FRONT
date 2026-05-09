import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AppLayout } from './AppLayout.jsx';
import { createPrivateLayoutConfig } from './layoutConfig.js';
import { useLocation } from 'react-router-dom';
import { getUnreadDirectMessagesCount, subscribeToIncomingDirectMessages } from '../services/supabaseService.js';

function parsePositiveInt(value) {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return null;
}

export function PrivateLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const backendUserId = useMemo(
    () => parsePositiveInt(user?.backendId ?? user?.id),
    [user?.backendId, user?.id]
  );

  const chatReadKey = backendUserId ? `chat:lastReadAt:${backendUserId}` : null;
  const isChatRoute = location.pathname.startsWith('/app/chat');

  useEffect(() => {
    if (!backendUserId || !chatReadKey) {
      setUnreadChatCount(0);
      return;
    }

    let cancelled = false;
    async function loadUnread() {
      try {
        const lastReadAt = localStorage.getItem(chatReadKey);
        const count = await getUnreadDirectMessagesCount(backendUserId, { since: lastReadAt || null });
        if (!cancelled) setUnreadChatCount(count);
      } catch (error) {
        console.error('No se pudo cargar contador de mensajes no leídos:', error);
        if (!cancelled) setUnreadChatCount(0);
      }
    }

    loadUnread();
    return () => {
      cancelled = true;
    };
  }, [backendUserId, chatReadKey]);

  useEffect(() => {
    if (!backendUserId || !chatReadKey || !isChatRoute) return;
    localStorage.setItem(chatReadKey, new Date().toISOString());
    setUnreadChatCount(0);
  }, [backendUserId, chatReadKey, isChatRoute]);

  useEffect(() => {
    if (!backendUserId || !chatReadKey) return () => {};

    const unsubscribe = subscribeToIncomingDirectMessages(backendUserId, (message) => {
      const messageCreatedAt = message?.created_at ? new Date(message.created_at).toISOString() : new Date().toISOString();
      if (isChatRoute) {
        localStorage.setItem(chatReadKey, messageCreatedAt);
        setUnreadChatCount(0);
        return;
      }
      setUnreadChatCount((prev) => prev + 1);
    });

    return () => {
      unsubscribe();
    };
  }, [backendUserId, chatReadKey, isChatRoute]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <AppLayout
      layout={createPrivateLayoutConfig({
        user: { ...user, unreadChatCount },
        onLogout: handleLogout,
      })}
    />
  );
}
