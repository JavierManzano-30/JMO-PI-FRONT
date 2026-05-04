import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Clock3, ArrowRight } from 'lucide-react';

export function NoSession() {
  return (
    <section style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <div style={{ width: 'min(860px, 100%)', borderRadius: '2rem', background: 'linear-gradient(155deg, #0f172a 0%, #1e3a8a 55%, #0ea5a5 120%)', padding: '1px' }}>
        <div style={{ borderRadius: 'calc(2rem - 1px)', background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(8px)', padding: '2.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#dbeafe', color: '#1d4ed8', display: 'grid', placeItems: 'center' }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, color: '#1d4ed8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Acceso protegido</p>
              <h2 style={{ margin: '0.15rem 0 0', fontSize: '2rem', color: '#0f172a' }}>Necesitas iniciar sesión</h2>
            </div>
          </div>

          <p style={{ margin: 0, color: '#475569', fontSize: '1.1rem', lineHeight: 1.55 }}>
            Tu sesión no está activa en este momento. Inicia sesión para continuar subiendo fotos, votar y comentar.
          </p>

          <div style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.8rem', borderRadius: '999px', background: '#eff6ff', color: '#1e40af', fontWeight: 700, fontSize: '0.85rem' }}>
            <Clock3 size={16} /> Si vuelves a esta pantalla, solo necesitas volver a autenticarte.
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/login" className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              Iniciar sesión <ArrowRight size={16} />
            </Link>
            <Link to="/contests" className="btn btn-ghost">Ver concursos</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
