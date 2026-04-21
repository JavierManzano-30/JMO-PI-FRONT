import React from 'react';
import { cx } from './utils.js';

export function Button({
  variant = 'primary',
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cx(
        'btn',
        variant === 'ghost' && 'btn-ghost',
        fullWidth && 'btn-wide',
        className
      )}
      {...props}
    />
  );
}
