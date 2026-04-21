import React from 'react';
import { cx } from './utils.js';

export function SectionHeader({
  title,
  description,
  actions,
  className = '',
}) {
  return (
    <header className={cx('section-header', className)}>
      <div className="section-header-copy">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="section-header-actions">{actions}</div>}
    </header>
  );
}
