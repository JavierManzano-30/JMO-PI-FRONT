import React from 'react';
import { ShieldAlert, FileText, Scale } from 'lucide-react';

export function LegalNotice() {
  return (
    <div className="legal-page">
      <header className="legal-hero">
        <div className="legal-hero-content">
          <span className="eyebrow">SnapNation Legal</span>
          <h1>Aviso Legal</h1>
          <p>Información detallada sobre la titularidad y condiciones de uso de la plataforma.</p>
        </div>
      </header>

      <section className="legal-section">
        <div className="legal-card-glass">
          <div className="legal-block">
            <div className="legal-icon-wrap">
              <ShieldAlert size={24} />
            </div>
            <h2>1. Información General</h2>
            <p>
              En cumplimiento con el deber de información recogido en el artículo 10 de la Ley 34/2002, 
              de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSICE), 
              se exponen los siguientes datos de SnapNation:
            </p>
            <ul>
              <li><strong>Titular:</strong> Javier Manzano Oliveros (SnapNation Project)</li>
              <li><strong>Contacto:</strong> snapnationinfo@gmail.com</li>
              <li><strong>Finalidad:</strong> Plataforma educativa y de demostración para concursos fotográficos.</li>
            </ul>
          </div>

          <div className="legal-block">
            <div className="legal-icon-wrap">
              <Scale size={24} />
            </div>
            <h2>2. Condiciones de Uso</h2>
            <p>
              El acceso y uso de este portal atribuye la condición de USUARIO, que acepta, desde dicho acceso 
              y/o uso, las Condiciones Generales de Uso aquí reflejadas.
            </p>
            <p>
              SnapNation proporciona el acceso a multitud de informaciones, servicios o datos en Internet 
              pertenecientes a SnapNation a los que el USUARIO pueda tener acceso. El USUARIO asume la 
              responsabilidad del uso del portal. Dicha responsabilidad se extiende al registro que fuese 
              necesario para acceder a determinados servicios o contenidos.
            </p>
          </div>

          <div className="legal-block">
            <div className="legal-icon-wrap">
              <FileText size={24} />
            </div>
            <h2>3. Propiedad Intelectual</h2>
            <p>
              SnapNation por sí o como cesionaria, es titular de todos los derechos de propiedad intelectual e 
              industrial de su página web, así como de los elementos contenidos en la misma (a título enunciativo, 
              imágenes, sonido, audio, vídeo, software o textos; marcas o logotipos, combinaciones de colores, 
              estructura y diseño, selección de materiales usados, programas de ordenador necesarios para su 
              funcionamiento, acceso y uso, etc.).
            </p>
            <p>
              Todos los derechos reservados. Cualquier uso no autorizado previamente por SnapNation será 
              considerado un incumplimiento grave de los derechos de propiedad intelectual o industrial del autor.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
