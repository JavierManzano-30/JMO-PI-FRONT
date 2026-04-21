import React from 'react';
import { NavLink } from 'react-router-dom';

export function HeaderPublicActions({ actions = [] }) {
  return (
    <div className="top-actions">
      {actions.map((action) => (
        <NavLink
          key={action.to}
          className={action.variant === 'primary' ? 'btn' : 'btn btn-ghost'}
          to={action.to}
          end={Boolean(action.end)}
        >
          {action.label}
        </NavLink>
      ))}
    </div>
  );
}
