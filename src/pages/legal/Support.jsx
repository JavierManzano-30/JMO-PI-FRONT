import React from 'react';
import { LifeBuoy, Mail, MessageCircle } from 'lucide-react';

export function Support() {
  return (
    <div className="legal-page">
      <header className="legal-hero">
        <div className="legal-hero-content">
          <span className="eyebrow">SnapNation Support</span>
          <h1>Soporte</h1>
          <p>Canales de ayuda para incidencias de acceso, cuenta y uso de la plataforma.</p>
        </div>
      </header>

      <section className="legal-section">
        <div className="legal-card-glass">
          <div className="legal-block">
            <div className="legal-icon-wrap">
              <LifeBuoy size={24} />
            </div>
            <h2>1. Ayuda general</h2>
            <p>
              Si tienes problemas para iniciar sesión, registrarte o subir fotos, abre una incidencia
              indicando el error exacto y el navegador que estás utilizando.
            </p>
          </div>

          <div className="legal-block">
            <div className="legal-icon-wrap">
              <Mail size={24} />
            </div>
            <h2>2. Contacto</h2>
            <p>
              Correo de soporte: <strong>snapnationinfo@gmail.com</strong>
            </p>
            <p>
              Incluye capturas y la hora aproximada del fallo para poder rastrearlo mejor.
            </p>
          </div>

          <div className="legal-block">
            <div className="legal-icon-wrap">
              <MessageCircle size={24} />
            </div>
            <h2>3. Tiempo de respuesta</h2>
            <p>
              Entorno de proyecto: respuesta orientativa en 24-72 horas lectivas.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
