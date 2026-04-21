import React from 'react';
import { Brand } from './Brand.jsx';
import { MainNavigation } from './MainNavigation.jsx';
import { HeaderUserBlock } from './HeaderUserBlock.jsx';
import { HeaderPublicActions } from './HeaderPublicActions.jsx';

export function AppHeader({ homeTo, navItems, user, onLogout, authActions }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Brand to={homeTo} />
        <MainNavigation items={navItems} />
        {user ? (
          <HeaderUserBlock user={user} onLogout={onLogout} />
        ) : (
          <HeaderPublicActions actions={authActions} />
        )}
      </div>
    </header>
  );
}
