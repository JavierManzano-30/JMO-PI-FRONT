import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppFooter } from '../components/layout/AppFooter.jsx';
import { AppHeader } from '../components/layout/AppHeader.jsx';

export function AppLayout({ layout }) {
  return (
    <div className="site-shell">
      <AppHeader
        homeTo={layout.homeTo}
        navItems={layout.navItems}
        user={layout.user}
        onLogout={layout.onLogout}
        authActions={layout.authActions}
      />

      <main className="page">
        <Outlet />
      </main>

      <AppFooter sections={layout.footerSections} />
    </div>
  );
}
