import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { AppFooter } from '../components/layout/AppFooter.jsx';
import { AppHeader } from '../components/layout/AppHeader.jsx';

export function AppLayout({ layout }) {
  const location = useLocation();
  const isAppArea = location.pathname.startsWith('/app');
  const isUploadPage = location.pathname === '/app/photos/upload';

  return (
    <div className="site-shell">
      <AppHeader
        homeTo={layout.homeTo}
        navItems={layout.navItems}
        authActions={layout.authActions}
      />

      <main className="page">
        <Outlet />
      </main>

      {isAppArea && !isUploadPage && (
        <Link to="/app/photos/upload" className="global-fab" aria-label="Subir foto">
          <Plus size={32} strokeWidth={2.2} />
        </Link>
      )}

      <AppFooter sections={layout.footerSections} />
    </div>
  );
}
