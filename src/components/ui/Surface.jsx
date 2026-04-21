import React from 'react';
import { cx } from './utils.js';

export function Card({
  as: Component = 'article',
  className = '',
  children,
  ...props
}) {
  return (
    <Component className={cx('card', className)} {...props}>
      {children}
    </Component>
  );
}

export function Panel({
  as: Component = 'section',
  className = '',
  children,
  ...props
}) {
  return (
    <Component className={cx('panel', className)} {...props}>
      {children}
    </Component>
  );
}
