import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Camera,
  Moon,
  Sun,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import logoSrc from '../assets/logo-propio-transparente.png';
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
    overflowY: 'auto',
  }),
  /* ── lado izquierdo ── */
  left: {
    position: 'relative',
    height: '100vh',
    width: '50%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '3rem',
    overflow: 'hidden',
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
      ? 'linear-gradient(to top right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)'
      : 'linear-gradient(to top right, rgba(255,255,255,0.45) 0%, transparent 60%)',
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
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(12px)',
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
    maxWidth: '24rem',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 1rem',
    background: '#2563eb',
    borderRadius: '999px',
    fontSize: '0.625rem',
    fontWeight: 800,
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    color: '#fff',
    marginBottom: '1.25rem',
    boxShadow: '0 8px 16px -4px rgba(37,99,235,0.5)',
  },
  photoTitle: {
    fontSize: '3.5rem',
    fontWeight: 800,
    lineHeight: 1.1,
    color: '#fff',
    margin: '0 0 1.25rem',
    letterSpacing: '-0.02em',
  },
  metaRow: {
    display: 'flex',
    gap: '1.5rem',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  /* ── lado derecho ── */
  right: {
    width: '50%',
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
    top: '2.5rem',
    right: '2.5rem',
    width: '3rem',
    height: '3rem',
    borderRadius: '1rem',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    transition: 'background 0.2s',
    background: dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)',
    color: dark ? '#fde047' : '#475569',
  }),
  panel: {
    width: '100%',
    maxWidth: '24rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingTop: '1rem',
    paddingBottom: '0.5rem',
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
    gap: '0.5rem',
  },
  input: (dark) => ({
    width: '100%',
    padding: '1rem 1.25rem',
    borderRadius: '1rem',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: dark ? '#1e293b' : '#cbd5e1',
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
    margin: '1.25rem 0',
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
  /* social btn */
  socialBtn: (dark) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '0.875rem 1.25rem',
    borderRadius: '1rem',
    border: `1px solid ${dark ? '#1e293b' : '#e2e8f0'}`,
    background: dark ? '#0f172a' : '#fff',
    color: dark ? '#fff' : '#0f172a',
    fontSize: '0.875rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  }),
  socialGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  socialRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
  },
  socialIconBtn: (dark) => ({
    width: '3.5rem',
    height: '3.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '1.25rem',
    border: `1px solid ${dark ? '#1e293b' : '#e2e8f0'}`,
    background: dark ? '#0f172a' : '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s',
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
    fontSize: '0.65rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    opacity: 0.6,
    marginTop: '0.75rem',
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

export function Login() {
  const { login, loginWithOAuth } = useAuth();
  const navigate = useNavigate();

  const [dark, setDark] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError('');

    try {
      await login({ email: formData.email, password: formData.password });
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Revisa tus credenciales.');
      setStatus('error');
    }
  };

  const handleOAuthLogin = async (provider) => {
    setStatus('loading');
    setError('');
    try {
      await loginWithOAuth(provider);
      // OAuth redirects, so no navigate is strictly needed here unless popup
    } catch (err) {
      setError(err.message || `Error al conectar con ${provider}.`);
      setStatus('error');
    }
  };

  const inputStyle = (field) => ({
    ...s.input(dark),
    ...(focusedField === field ? s.inputFocus : {}),
  });

  return (
    <div style={s.root(dark)}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .login-left { display: none !important; }
        @media (min-width: 1024px) {
          .login-left { display: flex !important; }
          .login-right { width: 50% !important; }
        }
        .login-theme-btn:hover { background: ${dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)'} !important; }
        .login-social-btn:hover { transform: translateY(-2px); border-color: #3b82f6 !important; }
        .social-btn-light:hover { background: #f8fafc !important; }
        .login-submit:hover { background: #1d4ed8 !important; transform: translateY(-1px); }
        .login-forgot:hover { text-decoration: underline !important; }
      `}</style>

      {/* Lado Izquierdo */}
      <section className="login-left" style={s.left}>
        <img
          src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=2069"
          alt="Ganador de la semana"
          style={s.bgImg}
        />
        <div style={s.overlay(dark)} />

        <div style={s.logo}>
          <img src={logoSrc} alt="SnapNation" height="140" style={{ display: 'block', objectFit: 'contain', filter: dark ? 'brightness(0) invert(1) drop-shadow(0px 2px 8px rgba(0,0,0,0.5))' : 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))', transition: 'filter 0.3s' }} />
        </div>

        <div style={s.leftBottom}>
          <div style={s.badge}>Ganador de la semana</div>
          <h2 style={s.photoTitle}>"Mi mejor amigo"</h2>
          <div style={s.metaRow}>
            <span style={s.metaItem}>Granada, ES</span>
            <span style={s.metaItem}>Tema: Mascotas</span>
          </div>
        </div>
      </section>

      {/* Lado Derecho */}
      <section className="login-right" style={s.right}>
        <button
          className="login-theme-btn"
          onClick={() => setDark(!dark)}
          style={s.themeBtn(dark)}
          aria-label="Cambiar tema"
        >
          {dark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          width: '100%',
          alignItems: 'center',
          paddingTop: '4vh'
        }}>
          <div style={s.panel}>

            {/* Encabezado */}
            <header>
              <h1 style={s.heading}>Iniciar sesión</h1>
              <p style={s.subheading(dark)}>
                Es bueno verte de nuevo. Tu próxima gran toma te espera.
              </p>
            </header>

            {status === 'error' && <p style={s.errorMsg} role="alert">{error}</p>}

            {/* Formulario */}
            <form onSubmit={handleSubmit} noValidate>
              <div style={s.inputWrap}>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  style={inputStyle('email')}
                  required
                />
                <div style={s.passWrap}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    name="password"
                    placeholder="Contraseña"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle('password')}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    style={s.eyeBtn}
                    aria-label={showPwd ? 'Ocultar clave' : 'Ver clave'}
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Recordarme + Olvidé clave */}
              <div style={{ ...s.rememberRow, marginTop: '0.75rem', marginBottom: '1rem' }}>
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
            <div style={{ ...s.divider, margin: '1.25rem 0' }}>
              <div style={s.divLine(dark)} />
              <span style={s.divText(dark)}>o accede con</span>
              <div style={s.divLine(dark)} />
            </div>

            {/* Proveedores sociales */}
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  className={`login-social-btn ${dark ? '' : 'social-btn-light'}`}
                  style={{ ...s.socialBtn(dark), width: '100%', justifyContent: 'center' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continuar con Google
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pie fijado al final */}
        <footer style={{
          paddingBottom: '2rem',
          width: '100%',
          maxWidth: '24rem',
          textAlign: 'center',
          flexShrink: 0
        }}>
          <p style={s.footerText}>
            ¿Eres nuevo?{' '}
            <Link to="/register" style={s.footerLink}>
              Únete a la nación
            </Link>
          </p>

          <div style={s.legalBar}>
            {['Privacidad', 'Términos', 'Soporte'].map((t) => (
              <a key={t} href="#" style={s.legalLink}>{t}</a>
            ))}
          </div>
        </footer>
      </section>
    </div>
  );
}
