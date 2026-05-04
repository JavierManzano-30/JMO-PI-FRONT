import React from 'react';
import { Link } from 'react-router-dom';
import logoSrc from '../../assets/logo-propio-transparente.png';

export function Brand({ to }) {
  return (
    <Link to={to} className="brand" aria-label="SnapNation">
      <img src={logoSrc} alt="SnapNation" height="85" style={{ display: 'block', objectFit: 'contain' }} />
    </Link>
  );
}
