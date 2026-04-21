import React from 'react';
import { cx } from './utils.js';

export function EmptyState({
  title,
  description,
  actions,
  className = '',
  as: Component = 'section',
}) {
  return (
    <Component className={cx('panel empty-panel empty-state', className)}>
      {title && <h2>{title}</h2>}
      {description && <p>{description}</p>}
      {actions && <div className="inline-actions">{actions}</div>}
    </Component>
  );
}
