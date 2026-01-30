import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.jsx';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const handleLogin = async (event) => {
    event.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    try {
      await login(credentials.email, credentials.password);
      navigate('/app/dashboard');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message || 'No se pudo iniciar sesión');
    }
  };

  return (
    <div className="auth-layout">
      <div className="card auth-card">
        <h2 className="card-title">Iniciar sesion</h2>
        <p className="card-subtle">Accede para ver las votaciones abiertas.</p>
        <form className="form" onSubmit={handleLogin}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="fotografo@example.com"
              value={credentials.email}
              onChange={(event) => setCredentials((prev) => ({ ...prev, email: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contrasena</label>
            <input
              id="password"
              type="password"
              placeholder="********"
              value={credentials.password}
              onChange={(event) =>
                setCredentials((prev) => ({ ...prev, password: event.target.value }))
              }
            />
          </div>
          <div className="field" style={{ flexDirection: 'row', gap: 8 }}>
            <input id="remember" type="checkbox" />
            <label htmlFor="remember">Recuerdame</label>
          </div>
          <button className="btn" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Cargando...' : 'Login'}
          </button>
          <div className="helper">
            No tienes cuenta? <Link className="text-link" to="/register">Registrate</Link>
          </div>
        </form>
        {status === 'error' && <div className="status error">{errorMessage}</div>}
      </div>
    </div>
  );
}
