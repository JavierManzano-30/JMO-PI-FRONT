import React from 'react';
import { StateScreen } from '../components/public/StateScreen.jsx';

export function NoSession() {
  return (
    <StateScreen
      code="Sesión expirada"
      title="Tu sesión ha caducado"
      description="Por seguridad cerramos el acceso tras un periodo de inactividad. Inicia sesión de nuevo para continuar."
      primaryAction={{ to: '/login', label: 'Iniciar sesión' }}
      secondaryAction={{ to: '/winners', label: 'Ver ganadores' }}
    />
  );
}
