import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Camera,
  Moon,
  Sun,
  ArrowRight,
  Eye,
  EyeOff,
  MapPin,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getRegions } from '../services/supabaseService.js';

/* ─────────────────────── estilos en línea ─────────────────────── */
const s = {
  root: (dark) => ({
    minHeight: '100vh',
    display: 'flex',
    transition: 'background 0.7s, color 0.7s',
    background: dark ? '#050505' : '#fafafa',
    color: dark ? '#fff' : '#000',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    height: '100vh',
    overflow: 'hidden',
  }),
  /* ── lado izquierdo ── */
  left: {
    display: 'none',
    position: 'relative',
    overflow: 'hidden',
    padding: '3rem',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '50%',
  },
  bgImg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 0,
  },
  overlay: (dark) => ({
    position: 'absolute',
    inset: 0,
    background: dark
      ? 'linear-gradient(to top right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.18) 60%, transparent 100%)'
      : 'linear-gradient(to top right, rgba(255,255,255,0.42) 0%, transparent 60%)',
    zIndex: 1,
  }),
  logo: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  logoBox: {
    background: 'rgba(255,255,255,0.10)',
    backdropFilter: 'blur(8px)',
    padding: '0.5rem',
    borderRadius: '1rem',
    border: '1px solid rgba(255,255,255,0.20)',
    display: 'flex',
    alignItems: 'center',
  },
  logoText: {
    fontSize: '1.5rem',
    fontWeight: 900,
    letterSpacing: '-0.04em',
    color: '#fff',
  },
  logoAccent: {
    color: '#3b82f6',
  },
  leftBottom: {
    position: 'relative',
    zIndex: 10,
    maxWidth: '22rem',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.25rem 0.75rem',
    background: '#2563eb',
    borderRadius: '999px',
    fontSize: '0.625rem',
    fontWeight: 700,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: '#fff',
    marginBottom: '1rem',
  },
  photoTitle: {
    fontSize: '3rem',
    fontWeight: 700,
    lineHeight: 1.15,
    color: '#fff',
    margin: '0 0 1rem',
  },
  metaRow: {
    display: 'flex',
    gap: '1.5rem',
    color: 'rgba(255,255,255,0.70)',
    fontSize: '0.875rem',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  /* ── lado derecho ── */
  right: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1rem 2rem',
    position: 'relative',
    overflow: 'hidden',
  },
  rightLg: {
    width: '50%',
  },
  themeBtn: {
    position: 'absolute',
    top: '2rem',
    right: '2rem',
    width: '3rem',
    height: '3rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    borderRadius: '1rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  panel: {
    width: '100%',
    maxWidth: '24rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    paddingTop: '2rem',
    paddingBottom: '2rem',
  },
  heading: {
    margin: 0,
    fontSize: '2.25rem',
    fontWeight: 700,
    letterSpacing: '-0.03em',
  },
  subheading: (dark) => ({
    margin: '0.5rem 0 0',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: dark ? '#94a3b8' : '#64748b',
  }),
  /* inputs */
  inputWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  input: (dark) => ({
    width: '100%',
    padding: '0.875rem 1.25rem',
    borderRadius: '1rem',
    border: `2px solid ${dark ? '#1e293b' : '#cbd5e1'}`,
    background: 'transparent',
    outline: 'none',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: dark ? '#fff' : '#000',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
  }),
  eyeBtn: {
    position: 'absolute',
    right: '1.25rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
  },
  /* submit */
  submitBtn: {
    width: '100%',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 700,
    padding: '1rem',
    borderRadius: '1rem',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontSize: '1rem',
    boxShadow: '0 20px 40px -12px rgba(37,99,235,0.4)',
    transition: 'background 0.2s',
    fontFamily: 'inherit',
    marginTop: '0.5rem',
  },
  /* divider */
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  divLine: (dark) => ({
    flex: 1,
    borderTop: `1px solid ${dark ? '#1e293b' : '#cbd5e1'}`,
  }),
  divText: (dark) => ({
    flexShrink: 0,
    fontSize: '0.625rem',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    color: dark ? '#475569' : '#94a3b8',
  }),
  /* footer */
  footerText: {
    textAlign: 'center',
    fontSize: '0.875rem',
    fontWeight: 500,
    opacity: 0.6,
  },
  footerLink: {
    color: '#3b82f6',
    fontWeight: 700,
    textDecoration: 'none',
  },
  legalBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1.5rem',
    fontSize: '0.5625rem',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.3em',
    opacity: 0.3,
    marginTop: '1.5rem',
  },
  legalLink: {
    textDecoration: 'none',
    color: 'inherit',
  },
  errorMsg: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.30)',
    color: '#ef4444',
    fontSize: '0.875rem',
    fontWeight: 500,
    margin: 0,
  },
};

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [dark, setDark] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [regions, setRegions] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    regionId: '',
    password: '',
    confirmPassword: '',
  });

  React.useEffect(() => {
    async function loadRegions() {
      try {
        const data = await getRegions();
        setRegions(data);
      } catch (err) {
        console.error('No se pudieron cargar las regiones');
      }
    }
    loadRegions();
  }, []);
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setStatus('error');
      return;
    }

    if (!formData.regionId) {
      setError('Por favor, selecciona tu comunidad autónoma');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError('');
    
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        regionId: formData.regionId
      });
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta. Inténtalo de nuevo.');
      setStatus('error');
    }
  };

  const inputStyle = (field) => ({
    ...s.input(dark),
    borderColor: focusedField === field ? '#3b82f6' : dark ? '#1e293b' : '#cbd5e1',
  });

  return (
    <div style={s.root(dark)}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
        .register-left { display: none !important; }
        @media (min-width: 1024px) {
          .register-left { display: flex !important; }
          .register-right { width: 50% !important; }
        }
        .register-input:focus { border-color: #3b82f6 !important; }
        .register-submit:hover { background: #1d4ed8 !important; }
        .register-theme-btn:hover { opacity: 0.8; }
        .register-footer-link:hover { text-decoration: underline !important; filter: brightness(1.2); }
      `}</style>

      {/* Lado Izquierdo */}
      <section className="register-left" style={s.left}>
        <img
          src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=2070"
          alt="Alta de usuario"
          style={s.bgImg}
        />
        <div style={s.overlay(dark)} />

        <div style={s.logo}>
          <div style={s.logoBox}>
            <Camera color="#fff" size={24} />
          </div>
          <span style={s.logoText}>
            Snap<span style={s.logoAccent}>Nation</span>
          </span>
        </div>

        <div style={s.leftBottom}>
          <div style={s.badge}>Nueva Comunidad</div>
          <h2 style={s.photoTitle}>"Captura la esencia de tu ciudad"</h2>
          <div style={s.metaRow}>
            <span style={s.metaItem}><MapPin size={14} style={{ marginRight: 4 }} /> Madrid, ES</span>
            <span style={s.metaItem}><Calendar size={14} style={{ marginRight: 4 }} /> Tema: Urbano</span>
          </div>
        </div>
      </section>

      {/* Lado Derecho */}
      <section className="register-right" style={s.right}>
        <button
          className="register-theme-btn"
          onClick={() => setDark(!dark)}
          style={{
            ...s.themeBtn,
            background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            color: dark ? '#facc15' : '#475569',
          }}
          aria-label="Cambiar tema"
        >
          {dark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div style={s.panel}>
          <header>
            <h1 style={s.heading}>Crear cuenta</h1>
            <p style={s.subheading(dark)}>
              Únete a la nación fotográfica. Tu viaje comienza aquí.
            </p>
          </header>

          {status === 'error' && <p style={s.errorMsg} role="alert">{error}</p>}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={s.inputWrap}>
              <input
                type="email"
                name="email"
                placeholder="Email"
                autoComplete="username"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle('email')}
                required
              />
              <input
                type="text"
                name="username"
                placeholder="Nombre de usuario"
                autoComplete="nickname"
                value={formData.username}
                onChange={handleChange}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle('username')}
                required
              />
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  name="password"
                  placeholder="Contraseña"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  style={{ ...inputStyle('password'), paddingRight: '3.5rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={s.eyeBtn}
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPwd ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirmar contraseña"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  style={{ ...inputStyle('confirmPassword'), paddingRight: '3.5rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                  style={s.eyeBtn}
                >
                  {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Selector de Comunidad Autónoma (Ahora debajo de confirmar contraseña) */}
              <div style={{ position: 'relative' }}>
                <select
                  name="regionId"
                  value={formData.regionId}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('regionId')}
                  onBlur={() => setFocusedField(null)}
                  style={inputStyle('regionId')}
                  required
                >
                  <option value="">Selecciona tu Comunidad</option>
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="register-submit"
              style={{
                ...s.submitBtn,
                opacity: status === 'loading' ? 0.7 : 1,
                cursor: status === 'loading' ? 'wait' : 'pointer',
              }}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Creando cuenta...' : 'Registrarse ahora'}
              {status !== 'loading' && <ArrowRight size={18} />}
            </button>
          </form>

          <footer style={{ marginTop: '0.5rem' }}>
            <p style={s.footerText}>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" style={s.footerLink} className="register-footer-link">
                Inicia sesión
              </Link>
            </p>

            <div style={s.legalBar}>
              {['Privacidad', 'Términos', 'Soporte'].map((t) => (
                <a key={t} href="#" style={s.legalLink}>{t}</a>
              ))}
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
