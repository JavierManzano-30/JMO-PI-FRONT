import React from 'react';
import { Eye, Lock, Database } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <header className="legal-hero privacy">
        <div className="legal-hero-content">
          <span className="eyebrow">SnapNation Security</span>
          <h1>Política de Privacidad</h1>
          <p>Tu privacidad es nuestra prioridad. Descubre cómo protegemos y tratamos tus datos.</p>
        </div>
      </header>

      <section className="legal-section">
        <div className="legal-card-glass">
          <div className="legal-block">
            <div className="legal-icon-wrap">
              <Eye size={24} />
            </div>
            <h2>1. Responsable del Tratamiento</h2>
            <p>
              El responsable del tratamiento de sus datos personales es Javier Manzano Oliveros. 
              Los datos se recogen exclusivamente para la gestión de la participación en concursos 
              fotográficos dentro de la plataforma SnapNation.
            </p>
          </div>

          <div className="legal-block">
            <div className="legal-icon-wrap">
              <Database size={24} />
            </div>
            <h2>2. Finalidad y Conservación</h2>
            <p>
              Los datos personales proporcionados se conservarán mientras se mantenga la relación 
              con la entidad y no se solicite su supresión por el interesado, o durante los años 
              necesarios para cumplir con las obligaciones legales.
            </p>
            <ul>
              <li>Gestión de la cuenta de usuario.</li>
              <li>Publicación de obras fotográficas y autoría.</li>
              <li>Notificaciones sobre el estado de concursos y votos.</li>
            </ul>
          </div>

          <div className="legal-block">
            <div className="legal-icon-wrap">
              <Lock size={24} />
            </div>
            <h2>3. Derechos del Usuario</h2>
            <p>
              Cualquier persona tiene derecho a obtener confirmación sobre si en SnapNation estamos 
              tratando datos personales que les conciernan, o no. Las personas interesadas tienen derecho a:
            </p>
            <ul>
              <li>Acceder a sus datos personales.</li>
              <li>Solicitar la rectificación de los datos inexactos.</li>
              <li>Solicitar su supresión cuando, entre otros motivos, los datos ya no sean necesarios para los fines que fueron recogidos.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
