import React from 'react';
import { NavLink } from 'react-router-dom';

function navClass({ isActive }) {
  return isActive ? 'top-nav-link is-active' : 'top-nav-link';
}

export function MainNavigation({ items = [], mobileOpen = false, onNavigate = null }) {
  return (
    <nav className={`top-nav ${mobileOpen ? 'is-open' : ''}`} aria-label="Navegación principal">
      {items.map((item) => (
        <NavLink
          key={item.to}
          className={navClass}
          to={item.to}
          end={Boolean(item.end)}
          onClick={onNavigate || undefined}
        >
          <span className="top-nav-label">{item.label}</span>
          {item.badgeCount > 0 && <span className="top-nav-badge" aria-label={`${item.badgeCount} mensajes no leídos`} />}
        </NavLink>
      ))}
    </nav>
  );
}
