import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AppLayout } from './AppLayout.jsx';
import { createPrivateLayoutConfig } from './layoutConfig.js';

export function PrivateLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

<<<<<<< Updated upstream
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return <AppLayout layout={createPrivateLayoutConfig({ user, onLogout: handleLogout })} />;
=======
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner header-order">
          <span className="brand-logo-wrap">
            <img className="brand-logo" src="/favicon.svg" alt="SnapNation" />
          </span>
          <NavLink className={navClass} to="/app/dashboard">
            Inicio
          </NavLink>
          <NavLink className={navClass} to="/app/photos/01">
            Galeria
          </NavLink>
          <div className="brand-text header-brand">
            <span className="brand-snap">Snap</span>
            <span className="brand-nation">Nation</span>
          </div>
          <NavLink className={navClass} to="/unauthorized">
            Ganadores
          </NavLink>
          <NavLink className={navClass} to="/app/profile">
            Perfil
          </NavLink>
          <div className="header-user-block">
            <div className="header-user">
              <span className="helper">Hola, {user?.name}</span>
              <img className="avatar" src={profile.avatar} alt="Perfil" />
            </div>
            <button className="btn ghost" type="button" onClick={logout}>
              Cerrar sesion
            </button>
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
