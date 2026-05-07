import React, { useEffect, useState } from 'react';
import { Brand } from './Brand.jsx';
import { MainNavigation } from './MainNavigation.jsx';
import { HeaderUserBlock } from './HeaderUserBlock.jsx';
import { HeaderPublicActions } from './HeaderPublicActions.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { Menu, Moon, Sun, X } from 'lucide-react';

export function AppHeader({ homeTo, navItems, authActions }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('snapnation:theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const closeMobileMenu = () => setMobileOpen(false);
  const isDark = theme === 'dark';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('snapnation:theme', theme);
    window.dispatchEvent(new CustomEvent('snapnation:theme-change', { detail: theme }));
  }, [theme]);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Brand to={homeTo} />
        <div className={`mobile-menu ${mobileOpen ? 'is-open' : ''}`}>
          <MainNavigation items={navItems} mobileOpen={mobileOpen} onNavigate={closeMobileMenu} />
          {user ? (
            <HeaderUserBlock user={user} onLogout={logout} mobileOpen={mobileOpen} onNavigate={closeMobileMenu} />
          ) : (
            <HeaderPublicActions actions={authActions} mobileOpen={mobileOpen} onNavigate={closeMobileMenu} />
          )}
        </div>
        <div className="header-controls">
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
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
