import React from 'react';
import { StateScreen } from '../components/public/StateScreen.jsx';

export function NotFound() {
  return (
    <StateScreen
      code="404"
      title="Página no encontrada"
      description="La ruta que intentas abrir no está disponible o ha cambiado dentro de SnapNation."
      primaryAction={{ to: '/contests', label: 'Ir a concursos' }}
      secondaryAction={{ to: '/login', label: 'Ir a acceso' }}
    />
  );
}
