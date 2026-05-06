import React from 'react';
import { NavLink } from 'react-router-dom';

export function HeaderPublicActions({ actions = [], mobileOpen = false, onNavigate = null }) {
  return (
    <div className={`top-actions ${mobileOpen ? 'is-open' : ''}`}>
      {actions.map((action) => (
        <NavLink
          key={action.to}
          className={action.variant === 'primary' ? 'btn' : 'btn btn-ghost'}
          to={action.to}
          end={Boolean(action.end)}
          onClick={onNavigate || undefined}
        >
          {action.label}
        </NavLink>
      ))}
    </div>
  );
}
