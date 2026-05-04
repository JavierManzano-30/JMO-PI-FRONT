import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AppLayout } from './AppLayout.jsx';
import { createPrivateLayoutConfig } from './layoutConfig.js';

export function PrivateLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return <AppLayout layout={createPrivateLayoutConfig({ user, onLogout: handleLogout })} />;
}
