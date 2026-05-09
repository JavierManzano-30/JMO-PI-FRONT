import React, { useState } from 'react';
import { Brand } from './Brand.jsx';
import { MainNavigation } from './MainNavigation.jsx';
import { HeaderUserBlock } from './HeaderUserBlock.jsx';
import { HeaderPublicActions } from './HeaderPublicActions.jsx';
import { Menu, Moon, Sun, X } from 'lucide-react';

export function AppHeader({ homeTo, navItems, authActions, sidebarMode = false, theme = 'light', onToggleTheme, user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileMenu = () => setMobileOpen(false);
  const isDark = theme === 'dark';
  const visibleNavItems = user ? navItems.filter((item) => item.label !== 'Perfil') : navItems;

  return (
    <header className={`site-header ${sidebarMode ? 'site-header--with-sidebar' : ''}`}>
      <div className="site-header-inner">
        {!sidebarMode && <Brand to={homeTo} />}
        <div className={`mobile-menu ${mobileOpen ? 'is-open' : ''}`}>
          <MainNavigation items={visibleNavItems} mobileOpen={mobileOpen} onNavigate={closeMobileMenu} />
          {user ? (
            <HeaderUserBlock user={user} onLogout={onLogout} mobileOpen={mobileOpen} onNavigate={closeMobileMenu} />
          ) : (
            <HeaderPublicActions actions={authActions} mobileOpen={mobileOpen} onNavigate={closeMobileMenu} />
          )}
        </div>
        <div className="header-controls">
          <button
            type="button"
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        <button
          type="button"
          className="nav-toggle"
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        </div>
      </div>
    </header>
  );
}
