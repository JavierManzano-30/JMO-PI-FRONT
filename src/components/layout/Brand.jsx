import React from 'react';
import { Link } from 'react-router-dom';

export function Brand({ to }) {
  return (
    <Link to={to} className="brand" aria-label="SnapNation">
      <span className="brand-mark" aria-hidden="true">SN</span>
      <span className="brand-copy">
        <strong className="brand-title">SnapNation</strong>
        <small className="brand-subtitle">Concursos semanales de fotografía</small>
      </span>
    </Link>
  );
}
