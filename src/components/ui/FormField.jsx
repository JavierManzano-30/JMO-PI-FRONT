import React from 'react';
import { StatusMessage } from './StatusMessage.jsx';
import { cx } from './utils.js';

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  className = '',
  children,
  afterControl,
}) {
  return (
    <div className={cx('field', className)}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {afterControl}
      {hint && <p className="field-hint">{hint}</p>}
      {error && <StatusMessage tone="error" className="field-status">{error}</StatusMessage>}
    </div>
  );
}
