import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';

export function ForgotPassword() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: '#fafafa',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '24rem',
        background: '#fff',
        padding: '2.5rem',
        borderRadius: '1.5rem',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '4rem',
          height: '4rem',
          background: 'rgba(59, 130, 246, 0.1)',
          color: '#3b82f6',
          borderRadius: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <Mail size={32} />
        </div>
        
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.75rem' }}>Recuperar clave</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Introduce tu email y te enviaremos las instrucciones para restablecer tu contraseña.
        </p>

        <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} onSubmit={(e) => e.preventDefault()}>
          <input 
            type="email" 
            placeholder="Introduce tu email"
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '1rem',
              border: '2px solid #cbd5e1',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
          <button style={{
            background: '#2563eb',
            color: '#fff',
            padding: '1rem',
            borderRadius: '1rem',
            border: 'none',
            fontWeight: 700,
            cursor: 'not-allowed',
            opacity: 0.8
          }}>
            Enviar instrucciones
          </button>
        </form>

        <div style={{ marginTop: '2rem' }}>
          <Link to="/login" style={{
            color: '#64748b',
            fontSize: '0.875rem',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <ArrowLeft size={16} />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
