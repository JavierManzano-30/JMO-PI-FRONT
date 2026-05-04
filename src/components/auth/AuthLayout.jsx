import React from 'react';
import { Camera, MapPin, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AuthLayout({ children, visualImage, quote, quoteAuthor, badge }) {
  return (
    <div className="auth-page">
      {/* Visual Section (Desktop Only) */}
      <section className="auth-visual">
        <img src={visualImage} alt="Auth Visual" className="auth-visual-img" />
        <div className="auth-visual-overlay" />
        
        <div className="auth-visual-content">
          <Link to="/" className="auth-brand">
            <div className="auth-brand-icon">
              <Camera size={24} />
            </div>
            <span className="auth-brand-name">
              Snap<span>Nation</span>
            </span>
          </Link>
        </div>

        <div className="auth-quote">
          {badge && <div className="auth-quote-tag">{badge}</div>}
          <h2 className="auth-quote-text">"{quote}"</h2>
          <div className="auth-quote-meta">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={14} /> {quoteAuthor}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={14} /> Global Contest
            </span>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="auth-form-container">
        <div className="auth-form-card">
          {children}
        </div>
      </section>
    </div>
  );
}
