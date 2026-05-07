import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import logoSrc from '../../assets/logo-propio-transparente.png';
import logoWhiteSrc from '../../assets/logo-propio-blanco.png';

export function Brand({ to }) {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'light');

  useEffect(() => {
    const onThemeChange = (event) => {
      const next = event?.detail || document.documentElement.getAttribute('data-theme') || 'light';
      setTheme(next);
    };
    window.addEventListener('snapnation:theme-change', onThemeChange);
    return () => window.removeEventListener('snapnation:theme-change', onThemeChange);
  }, []);

  const isDark = theme === 'dark';

  return (
    <Link to={to} className="brand" aria-label="SnapNation">
      <img src={isDark ? logoWhiteSrc : logoSrc} alt="SnapNation" className="brand-logo" />
    </Link>
  );
}
