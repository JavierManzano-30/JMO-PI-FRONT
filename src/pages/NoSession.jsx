import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Camera, LockKeyhole, MessageCircle, ShieldCheck, Trophy, Vote } from 'lucide-react';

export function NoSession() {
  const location = useLocation();
  const redirectedFrom = location.state?.from?.pathname || '/app/dashboard';

  return (
    <section className="no-session-page">
      <div className="no-session-shell">
        <article className="no-session-card">
          <div className="no-session-content">
            <div className="no-session-status">
              <span className="no-session-icon">
                <LockKeyhole size={24} />
              </span>
              <span>Acceso protegido</span>
            </div>

            <h1>Necesitas iniciar sesión</h1>
            <p className="no-session-lead">
              Tu sesión no está activa. Entra de nuevo para seguir participando en concursos, votar fotografías y comentar en SnapNation.
            </p>

            <div className="no-session-actions">
              <Link to="/login" state={{ from: redirectedFrom }} className="btn no-session-primary">
                Iniciar sesión
                <ArrowRight size={17} />
              </Link>
              <Link to="/register" className="btn btn-ghost">
                Crear cuenta
              </Link>
            </div>

            <div className="no-session-note">
              <ShieldCheck size={17} />
              <span>Cuando vuelvas a autenticarte, podrás continuar usando las funciones privadas.</span>
            </div>
          </div>

          <aside className="no-session-panel" aria-label="Funciones protegidas">
            <div className="no-session-panel-header">
              <Trophy size={20} />
              <span>Zona SnapNation</span>
            </div>
            <ul className="no-session-feature-list">
              <li>
                <Camera size={18} />
                <div>
                  <strong>Subir fotos</strong>
                  <span>Publica tus mejores capturas.</span>
                </div>
              </li>
              <li>
                <Vote size={18} />
                <div>
                  <strong>Votar concursos</strong>
                  <span>Participa en rankings activos.</span>
                </div>
              </li>
              <li>
                <MessageCircle size={18} />
                <div>
                  <strong>Comentar y chatear</strong>
                  <span>Conecta con otros usuarios.</span>
                </div>
              </li>
            </ul>
            <Link to="/contests" className="no-session-secondary-link">
              Ver concursos públicos
              <ArrowRight size={15} />
            </Link>
          </aside>
        </article>
      </div>
    </section>
  );
}
