import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { AppLayout } from './AppLayout.jsx';
import { createPrivateLayoutConfig, createPublicLayoutConfig } from './layoutConfig.js';

export function PublicLayout() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

<<<<<<< Updated upstream
  if (isAuthenticated && user) {
    const handleLogout = () => {
      logout();
      navigate('/login', { replace: true });
    };
    return <AppLayout layout={createPrivateLayoutConfig({ user, onLogout: handleLogout })} />;
  }

  return <AppLayout layout={createPublicLayoutConfig()} />;
=======
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner header-social">
          <Link to="/login" className="brand header-brand">
            <span className="brand-logo-wrap">
              <img className="brand-logo" src="/favicon.svg" alt="SnapNation" />
            </span>
            <span className="brand-text">
              <span className="brand-snap">Snap</span>
              <span className="brand-nation">Nation</span>
            </span>
          </Link>
          <div className="header-search">
            <span className="search-icon">⌕</span>
            <input type="search" placeholder="Buscar fotos, comunidades, autores..." />
          </div>
          <nav className="header-nav">
            <Link to="/login" className="header-link">
              Explorar
            </Link>
            <Link to="/login" className="header-link">
              Comunidades
            </Link>
            <Link to="/login" className="header-link">
              Ganadores
            </Link>
          </nav>
          <div className="header-auth">
            <NavLink className={navClass} to="/login" end>
              Login
            </NavLink>
            <NavLink className="btn accent" to="/register" end>
              Crear cuenta
            </NavLink>
          </div>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-brand-top">
              <img className="footer-logo" src="/favicon.svg" alt="SnapNation" />
              <div className="brand-text">
                <span className="brand-snap">Snap</span>
                <span className="brand-nation">Nation</span>
              </div>
            </div>
            <div className="footer-brand-text">
              <div className="footer-note">
                La comunidad de fotografia donde el tema cambia cada semana. Una foto por persona,
                votaciones hasta el viernes y final nacional con los ganadores de cada comunidad.
              </div>
            </div>
            <div className="footer-social">
              <span className="social-icon">
                <img src="/assets/icons/instagram.svg" alt="Instagram" />
              </span>
              <span className="social-icon">
                <img src="/assets/icons/x.jpg" alt="X" />
              </span>
              <span className="social-icon">
                <img src="/assets/icons/facebook.png" alt="Facebook" />
              </span>
            </div>
          </div>
          <div className="footer-column">
            <strong>Comunidad</strong>
            <div className="footer-link">Explorar fotos</div>
            <div className="footer-link">Ganadores</div>
            <div className="footer-link">Temas semanales</div>
            <div className="footer-link">Reglas</div>
          </div>
          <div className="footer-column">
            <strong>Soporte</strong>
            <div className="footer-link">Centro de ayuda</div>
            <div className="footer-link">Terminos y condiciones</div>
            <div className="footer-link">Privacidad</div>
            <div className="footer-link">Contacto</div>
          </div>
        </div>
        <div className="footer-bottom">© 2026 SnapNation. Todos los derechos reservados.</div>
      </footer>
    </div>
  );
>>>>>>> Stashed changes
}
