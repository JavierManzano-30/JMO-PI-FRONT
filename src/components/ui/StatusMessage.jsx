import React from 'react';
import { cx } from './utils.js';

const ALLOWED_TONES = new Set(['loading', 'error', 'empty', 'success']);

export function StatusMessage({
  tone = 'empty',
  className = '',
  children,
  ...props
}) {
  if (!children) {
    return null;
  }

  const safeTone = ALLOWED_TONES.has(tone) ? tone : 'empty';

  return (
    <div className={cx('status', safeTone, className)} {...props}>
      {children}
    </div>
  );
}
