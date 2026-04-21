import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Surface.jsx';

export function StateScreen({
  code,
  title,
  description,
  primaryAction,
  secondaryAction,
}) {
  return (
    <section className="auth-layout state-layout">
      <Card className="auth-message-card state-card">
        <div className="state-badge">{code}</div>
        <h2 className="card-title">{title}</h2>
        <p className="card-subtle">{description}</p>
        <div className="inline-actions state-actions">
          {primaryAction && (
            <Link className="btn" to={primaryAction.to}>
              {primaryAction.label}
            </Link>
          )}
          {secondaryAction && (
            <Link className="btn btn-ghost" to={secondaryAction.to}>
              {secondaryAction.label}
            </Link>
          )}
        </div>
      </Card>
    </section>
  );
}
