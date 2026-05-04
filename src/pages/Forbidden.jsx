import React from 'react';
import { StateScreen } from '../components/public/StateScreen.jsx';

export function Forbidden() {
  return (
    <StateScreen
      code="403"
      title="Acceso denegado"
      description="No tienes permisos para acceder a esta sección. Si crees que es un error, contacta con administración."
      primaryAction={{ to: '/app/dashboard', label: 'Volver al panel' }}
      secondaryAction={{ to: '/app/contests', label: 'Ver concursos' }}
    />
  );
}
