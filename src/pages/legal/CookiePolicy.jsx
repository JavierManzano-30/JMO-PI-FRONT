import React from 'react';
import { Cookie, Info, Settings } from 'lucide-react';

export function CookiePolicy() {
  return (
    <div className="legal-page">
      <header className="legal-hero cookies">
        <div className="legal-hero-content">
          <span className="eyebrow">SnapNation Experience</span>
          <h1>Política de Cookies</h1>
          <p>Uso de cookies y tecnologías similares para mejorar tu experiencia de navegación.</p>
        </div>
      </header>

      <section className="legal-section">
        <div className="legal-card-glass">
          <div className="legal-block">
            <div className="legal-icon-wrap">
              <Cookie size={24} />
            </div>
            <h2>1. ¿Qué son las Cookies?</h2>
            <p>
              Una cookie es un fichero que se descarga en su ordenador al acceder a determinadas páginas web. 
              Las cookies permiten a una página web, entre otras cosas, almacenar y recuperar información 
              sobre los hábitos de navegación de un usuario o de su equipo.
            </p>
          </div>

          <div className="legal-block">
            <div className="legal-icon-wrap">
              <Info size={24} />
            </div>
            <h2>2. Tipos de Cookies utilizadas</h2>
            <p>SnapNation utiliza los siguientes tipos de cookies:</p>
            <ul>
              <li><strong>Cookies técnicas:</strong> Necesarias para el funcionamiento de la plataforma y el inicio de sesión.</li>
              <li><strong>Cookies de personalización:</strong> Permiten recordar preferencias de usuario como el idioma o la comunidad seleccionada.</li>
              <li><strong>Cookies de análisis:</strong> (Opcional) Para cuantificar el número de usuarios y realizar mediciones estadísticas.</li>
            </ul>
          </div>

          <div className="legal-block">
            <div className="legal-icon-wrap">
              <Settings size={24} />
            </div>
            <h2>3. Cómo gestionar las Cookies</h2>
            <p>
              Usted puede permitir, bloquear o eliminar las cookies instaladas en su equipo mediante la 
              configuración de las opciones del navegador instalado en su ordenador.
            </p>
            <p>
              Tenga en cuenta que si deshabilita las cookies técnicas, el funcionamiento de la sesión 
              puede verse afectado y no podrá participar activamente en los concursos.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
