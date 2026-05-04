import React from 'react';
import { Link } from 'react-router-dom';
import logoSrc from '../../assets/logo-propio-transparente.png';

function FooterSection({ section }) {
  return (
    <section className="footer-block">
      <strong>{section.title}</strong>
      {section.description && <p>{section.description}</p>}
      {Array.isArray(section.links) && section.links.length > 0 && (
        <div className="footer-links">
          {section.links.map((link) => (
            <Link key={`${section.title}-${link.to}-${link.label}`} to={link.to}>
              {link.label}
            </Link>
          ))}
        </div>
      )}
      {Array.isArray(section.bullets) && section.bullets.length > 0 && (
        <ul className="footer-metrics">
          {section.bullets.map((bullet) => (
            <li key={`${section.title}-${bullet}`}>{bullet}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function AppFooter({ sections = [] }) {
  const mainSections = sections.filter(s => s.title !== 'Legal');
  const legalSection = sections.find(s => s.title === 'Legal');

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-block" style={{ gap: '1.25rem' }}>
          <div className="brand" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '1rem',
            borderRadius: '16px',
            display: 'inline-block',
            width: 'fit-content'
          }}>
            <img src={logoSrc} alt="SnapNation" height="85" style={{ display: 'block', objectFit: 'contain' }} />
          </div>
          <p style={{ maxWidth: '280px', fontSize: '0.875rem' }}>
            La plataforma definitiva para fotógrafos competitivos.
          </p>
        </div>

        {mainSections.map((section) => (
          <FooterSection key={section.title} section={section} />
        ))}
      </div>

      <div className="site-footer-bottom">
        <div>© 2026 SnapNation · Plataforma de fotografía competitiva</div>
        
        {legalSection && (
          <div className="footer-bottom-links">
            {legalSection.links.map(link => (
              <Link key={link.to} to={link.to}>{link.label}</Link>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}
