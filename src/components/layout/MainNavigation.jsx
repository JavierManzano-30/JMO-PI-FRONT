import React from 'react';
import { NavLink } from 'react-router-dom';

function navClass({ isActive }) {
  return isActive ? 'top-nav-link is-active' : 'top-nav-link';
}

export function MainNavigation({ items = [] }) {
  return (
    <nav className="top-nav" aria-label="Navegación principal">
      {items.map((item) => (
        <NavLink key={item.to} className={navClass} to={item.to} end={Boolean(item.end)}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
