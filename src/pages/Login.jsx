import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.jsx';
import { ApiError } from '../lib/apiClient.js';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const handleLogin = async (event) => {
    event.preventDefault();
    setStatus('loading');
    setError('');

    try {
      await login(credentials);
      navigate('/app/dashboard');
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('No se pudo iniciar sesion');
      }
      setStatus('error');
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
              placeholder="demo_user@snapnation.test"
              value={credentials.email}
              onChange={(event) => setCredentials((prev) => ({ ...prev, email: event.target.value }))}
              required
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
              required
            />
          </div>
          <button className="btn" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Cargando...' : 'Login'}
          </button>
          <div className="helper">
            No tienes cuenta? <Link className="text-link" to="/register">Registrate</Link>
          </div>
        </form>
        {status === 'error' && <div className="status error">{error}</div>}
      </div>
    </div>
  );
}
