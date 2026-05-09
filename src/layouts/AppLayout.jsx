import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LogOut, Plus, X } from 'lucide-react';
import { AppFooter } from '../components/layout/AppFooter.jsx';
import { AppHeader } from '../components/layout/AppHeader.jsx';
import { AppSidebar } from '../components/layout/AppSidebar.jsx';

export function AppLayout({ layout }) {
  const location = useLocation();
  const isAppArea = location.pathname.startsWith('/app');
  const hasSidebar = Boolean(layout.useSidebar);
  const isUploadPage = location.pathname === '/app/photos/upload';
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('snapnation:theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('snapnation:theme', theme);
    window.dispatchEvent(new CustomEvent('snapnation:theme-change', { detail: theme }));
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  const requestLogout = () => setLogoutDialogOpen(true);
  const cancelLogout = () => setLogoutDialogOpen(false);
  const confirmLogout = async () => {
    setLogoutDialogOpen(false);
    await layout.onLogout?.();
  };

  return (
    <div className={`site-shell ${isAppArea ? 'site-shell--app' : ''} ${hasSidebar ? 'site-shell--sidebar' : ''}`}>
      {hasSidebar && (
        <AppSidebar
          homeTo={layout.homeTo}
          items={layout.navItems}
          user={layout.user}
          authActions={layout.authActions}
          onLogout={requestLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      <AppHeader
        homeTo={layout.homeTo}
        navItems={layout.navItems}
        authActions={layout.authActions}
        sidebarMode={hasSidebar}
        theme={theme}
        onToggleTheme={toggleTheme}
        user={layout.user}
        onLogout={requestLogout}
      />

      <main className="page page--plain">
        <Outlet />
      </main>

      {isAppArea && !isUploadPage && (
        <Link to="/app/photos/upload" className="global-fab" aria-label="Subir foto">
          <Plus size={32} strokeWidth={2.2} />
        </Link>
      )}

      <AppFooter sections={layout.footerSections} />

      {logoutDialogOpen && (
        <div className="confirm-dialog-backdrop" role="presentation" onMouseDown={cancelLogout}>
          <section
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button type="button" className="confirm-dialog-close" onClick={cancelLogout} aria-label="Cancelar cierre de sesión">
              <X size={18} />
            </button>
            <div className="confirm-dialog-icon" aria-hidden="true">
              <span className="confirm-dialog-icon-ring" />
              <LogOut size={24} strokeWidth={2.4} />
            </div>
            <h2 id="logout-dialog-title">Cerrar sesión</h2>
            <p id="logout-dialog-description">
              ¿Seguro que quieres salir de SnapNation?
            </p>
            <div className="confirm-dialog-actions">
              <button type="button" className="btn btn-ghost" onClick={cancelLogout}>
                Cancelar
              </button>
              <button type="button" className="btn confirm-dialog-primary" onClick={confirmLogout}>
                Cerrar sesión
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
