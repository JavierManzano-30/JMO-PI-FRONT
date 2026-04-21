import React from 'react';

export function AuthShowcase({ eyebrow, title, description, highlights = [] }) {
  return (
    <article className="auth-side" aria-label="Resumen de SnapNation">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>

      {highlights.length > 0 && (
        <ul className="auth-highlights" aria-label="Ventajas de la plataforma">
          {highlights.map((highlight) => (
            <li key={highlight.title}>
              <strong>{highlight.title}</strong>
              <span>{highlight.text}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
