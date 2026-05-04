import React from 'react';
import { Brand } from './Brand.jsx';
import { MainNavigation } from './MainNavigation.jsx';
import { HeaderUserBlock } from './HeaderUserBlock.jsx';
import { HeaderPublicActions } from './HeaderPublicActions.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export function AppHeader({ homeTo, navItems, authActions }) {
  const { user, logout } = useAuth();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Brand to={homeTo} />
        <MainNavigation items={navItems} />
        {user ? (
          <HeaderUserBlock user={user} onLogout={logout} />
        ) : (
          <HeaderPublicActions actions={authActions} />
        )}
      </div>
    </header>
  );
}
