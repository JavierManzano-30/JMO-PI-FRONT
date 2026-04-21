import React from 'react';
import { Link } from 'react-router-dom';

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
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        {sections.map((section) => (
          <FooterSection key={section.title} section={section} />
        ))}
      </div>
      <div className="site-footer-bottom">
        © 2026 SnapNation · Plataforma de fotografía competitiva
      </div>
    </footer>
  );
}
