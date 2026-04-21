import React from 'react';
import { cx } from './utils.js';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className = '',
  contentClassName = '',
  actionsClassName = '',
}) {
  return (
    <header className={cx('page-header', className)}>
      <div className={cx('page-header-content', contentClassName)}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        {title && <h1 className="section-title">{title}</h1>}
        {description && <p className="section-subtitle">{description}</p>}
      </div>
      {actions && <div className={cx('page-header-actions', actionsClassName)}>{actions}</div>}
    </header>
  );
}
