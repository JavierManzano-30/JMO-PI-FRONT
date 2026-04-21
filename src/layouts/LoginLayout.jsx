import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Layout minimalista para la pantalla de login.
 * Sin header ni footer — el diseño de login es completamente autónomo.
 */
export function LoginLayout() {
  return <Outlet />;
}
