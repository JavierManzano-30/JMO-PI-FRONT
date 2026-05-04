import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { AppLayout } from './AppLayout.jsx';
import { createPrivateLayoutConfig, createPublicLayoutConfig } from './layoutConfig.js';

export function PublicLayout() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  if (isAuthenticated && user) {
    const handleLogout = () => {
      logout();
      navigate('/login', { replace: true });
    };
    return <AppLayout layout={createPrivateLayoutConfig({ user, onLogout: handleLogout })} />;
  }

  return <AppLayout layout={createPublicLayoutConfig()} />;
}
