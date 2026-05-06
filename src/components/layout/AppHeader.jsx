import React, { useState } from 'react';
import { Brand } from './Brand.jsx';
import { MainNavigation } from './MainNavigation.jsx';
import { HeaderUserBlock } from './HeaderUserBlock.jsx';
import { HeaderPublicActions } from './HeaderPublicActions.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { Menu, X } from 'lucide-react';

export function AppHeader({ homeTo, navItems, authActions }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Brand to={homeTo} />
        <button
          type="button"
          className="nav-toggle"
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className={`mobile-menu ${mobileOpen ? 'is-open' : ''}`}>
          <MainNavigation items={navItems} mobileOpen={mobileOpen} onNavigate={closeMobileMenu} />
          {user ? (
            <HeaderUserBlock user={user} onLogout={logout} mobileOpen={mobileOpen} onNavigate={closeMobileMenu} />
          ) : (
            <HeaderPublicActions actions={authActions} mobileOpen={mobileOpen} onNavigate={closeMobileMenu} />
          )}
        </div>
      </div>
    </header>
  );
}
