import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export function UploadSuccess() {
  const { state } = useLocation();

  return (
    <section className="upload-success-page">
      <article className="card upload-success-card">
        <div className="upload-success-mark" aria-hidden="true">
          <span>✓</span>
        </div>

        <p className="eyebrow">Publicación completada</p>
        <h1 className="section-title">Tu fotografía ya está en SnapNation</h1>
        <p className="section-subtitle">
          La comunidad puede verla y votar en la ronda correspondiente.
        </p>

        <dl className="upload-success-summary">
          <div>
            <dt>Título</dt>
            <dd>{state?.title || 'Fotografía publicada'}</dd>
          </div>
          <div>
            <dt>Tema</dt>
            <dd>{state?.themeTitle || 'Tema de la ronda activa'}</dd>
          </div>
          <div>
            <dt>Categoría</dt>
            <dd>{state?.categoryName || 'Sin categoría'}</dd>
          </div>
        </dl>

        <div className="inline-actions upload-success-actions">
          <Link className="btn" to="/app/dashboard">
            Ver galería
          </Link>
          <Link className="btn btn-ghost" to="/app/photos/upload">
            Publicar otra foto
          </Link>
        </div>
      </article>
    </section>
  );
}
