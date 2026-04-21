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
  Apple,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

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
  leftVisible: {
    display: 'flex',
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
    maxWidth: '20rem',
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
  themeBtn: (dark) => ({
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
    background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    color: dark ? '#facc15' : '#475569',
    transition: 'background 0.2s',
  }),
  panel: {
    width: '100%',
    maxWidth: '22rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    paddingTop: '3rem',
    paddingBottom: '3rem',
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
    padding: '1rem 1.25rem',
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
  inputFocus: {
    borderColor: '#3b82f6',
  },
  passWrap: {
    position: 'relative',
  },
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
  /* row (remember + forgot) */
  rememberRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 0.25rem',
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 700,
    opacity: 0.5,
  },
  forgotLink: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#3b82f6',
    textDecoration: 'none',
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
  },
  /* divider */
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  divLine: (dark) => ({
    flex: 1,
    borderTop: `1px solid ${dark ? '#1e293b' : '#e2e8f0'}`,
  }),
  divText: (dark) => ({
    flexShrink: 0,
    fontSize: '0.625rem',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    color: dark ? '#475569' : '#94a3b8',
  }),
  /* social */
  socialGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  },
  socialBtn: (dark) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.875rem',
    borderRadius: '1rem',
    border: `2px solid ${dark ? '#1e293b' : '#cbd5e1'}`,
    background: 'transparent',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.875rem',
    color: 'inherit',
    fontFamily: 'inherit',
    transition: 'background 0.2s',
  }),
  socialRow: {
    display: 'flex',
    gap: '0.75rem',
  },
  socialIconBtn: (dark) => ({
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    padding: '0.75rem',
    borderRadius: '1rem',
    border: `2px solid ${dark ? '#1e293b' : '#cbd5e1'}`,
    background: 'transparent',
    cursor: 'pointer',
    transition: 'background 0.2s',
  }),
  /* error */
  errorMsg: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.30)',
    color: '#ef4444',
    fontSize: '0.875rem',
    fontWeight: 500,
  },
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
};

/* ─────────────────────── componente ─────────────────────── */
export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [dark, setDark] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      await login(credentials);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
      setStatus('error');
    }
  };

  /* helpers de hover/focus en inputs */
  const inputStyle = (field) => ({
    ...s.input(dark),
    borderColor:
      focusedField === field ? '#3b82f6' : dark ? '#1e293b' : '#e2e8f0',
  });

  const isLg =
    typeof window !== 'undefined' && window.innerWidth >= 1024;

  return (
    <div style={{ ...s.root(dark), position: 'relative' }}>

      {/* ── LADO IZQUIERDO (visible en pantallas ≥ 1024 px vía CSS media) ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
        .login-left { display: none !important; }
        @media (min-width: 1024px) {
          .login-left { display: flex !important; }
          .login-right { width: 50% !important; }
        }
        .login-input:focus { border-color: #3b82f6 !important; }
        .login-submit:hover { background: #1d4ed8 !important; }
        .login-social-btn:hover { background: rgba(255,255,255,0.06) !important; }
        .social-btn-light:hover { background: rgba(0,0,0,0.05) !important; }
        .login-forgot:hover { color: #93c5fd !important; }
        .login-theme-btn:hover { opacity: 0.8; }
        .login-register-link:hover { text-decoration: underline !important; filter: brightness(1.2); }
      `}</style>

      <section
        className="login-left"
        style={{ ...s.left }}
      >
        {/* Imagen de fondo */}
        <img
          src="/login.jpg"
          alt="Mascota"
          style={s.bgImg}
        />
        <div style={s.overlay(dark)} />

        {/* Logo */}
        <div style={s.logo}>
          <div style={s.logoBox}>
            <Camera color="#fff" size={24} />
          </div>
          <span style={s.logoText}>
            Snap<span style={s.logoAccent}>Nation</span>
          </span>
        </div>

        {/* Texto inferior */}
        <div style={s.leftBottom}>
          <div style={s.badge}>Ganador de la Semana</div>
          <h2 style={s.photoTitle}>"Mi mejor amigo"</h2>
          <div style={s.metaRow}>
            <span style={s.metaItem}><MapPin size={14} style={{ marginRight: 4 }} /> Granada, ES</span>
            <span style={s.metaItem}><Calendar size={14} style={{ marginRight: 4 }} /> Tema: Mascotas</span>
          </div>
        </div>
      </section>

      {/* ── LADO DERECHO: FORMULARIO ── */}
      <section className="login-right" style={s.right}>

        {/* Toggle dark/light */}
        <button
          className="login-theme-btn"
          onClick={() => setDark(!dark)}
          style={s.themeBtn(dark)}
          aria-label="Cambiar tema"
        >
          {dark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div style={s.panel}>

          {/* Encabezado */}
          <header>
            <h1 style={s.heading}>Iniciar sesión</h1>
            <p style={s.subheading(dark)}>
              Es bueno verte de nuevo. Tu próxima gran toma te espera.
            </p>
          </header>

          {/* Error */}
          {status === 'error' && (
            <p style={s.errorMsg} role="alert" aria-live="polite">
              {error}
            </p>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} noValidate aria-busy={status === 'loading'}>
            <div style={s.inputWrap}>
              <input
                id="login-email"
                type="email"
                name="email"
                placeholder="Email"
                autoComplete="email"
                value={credentials.email}
                onChange={handleChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                className="login-input"
                style={inputStyle('email')}
                required
              />

              <div style={s.passWrap}>
                <input
                  id="login-password"
                  type={showPwd ? 'text' : 'password'}
                  name="password"
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  value={credentials.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="login-input"
                  style={{ ...inputStyle('password'), paddingRight: '3rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={s.eyeBtn}
                  aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Recordarme + Olvidé clave */}
            <div style={{ ...s.rememberRow, marginTop: '1rem', marginBottom: '1.5rem' }}>
              <label style={s.checkLabel}>
                <input type="checkbox" style={{ accentColor: '#3b82f6' }} />
                Recordarme
              </label>
              <Link to="/forgot-password" style={s.forgotLink} className="login-forgot">
                ¿Olvidaste la clave?
              </Link>
            </div>

            <button
              type="submit"
              className="login-submit"
              style={{
                ...s.submitBtn,
                opacity: status === 'loading' ? 0.7 : 1,
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              }}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Validando...' : 'Entrar ahora'}
              {status !== 'loading' && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Divisor */}
          <div style={s.divider}>
            <div style={s.divLine(dark)} />
            <span style={s.divText(dark)}>o accede con</span>
            <div style={s.divLine(dark)} />
          </div>

          {/* Proveedores sociales */}
          <div>
            <div style={s.socialGrid}>
              {[
                {
                  label: 'Google',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  ),
                },
                {
                  label: 'Apple',
                  icon: <Apple size={18} style={{ color: dark ? '#fff' : '#000' }} />,
                },
              ].map(({ icon, label }) => (
                <button
                  key={label}
                  type="button"
                  className={`login-social-btn ${dark ? '' : 'social-btn-light'}`}
                  style={s.socialBtn(dark)}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            <div style={s.socialRow}>
              {[
                {
                  label: 'Facebook',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  ),
                },
                {
                  label: 'Github',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={dark ? '#fff' : '#000'}>
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                    </svg>
                  ),
                },
                {
                  label: 'Twitter',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1DA1F2">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  ),
                },
              ].map(({ icon, label }) => (
                <button
                  key={label}
                  type="button"
                  title={label}
                  className={`login-social-btn ${dark ? '' : 'social-btn-light'}`}
                  style={s.socialIconBtn(dark)}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Pie */}
          <footer>
            <p style={s.footerText}>
              ¿Eres nuevo?{' '}
              <Link to="/register" style={s.footerLink} className="login-register-link">
                Únete a la nación
              </Link>
            </p>

            {/* Barra legal dentro del footer */}
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
