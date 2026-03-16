import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.jsx';
import { ApiError } from '../lib/apiClient.js';
import { listCommunities } from '../services/communitiesService.js';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [communities, setCommunities] = useState([]);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    communityId: '',
  });

  useEffect(() => {
    listCommunities({ limit: 100 })
      .then((response) => setCommunities(response.data || []))
      .catch(() => setCommunities([]));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('loading');
    setError('');

    try {
      await register(form);
      navigate('/app/dashboard');
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('No se pudo registrar la cuenta');
      }
      setStatus('error');
    }
  };

  return (
    <div className="auth-layout">
      <div className="card auth-card">
        <h2 className="card-title">Registro</h2>
        <p className="card-subtle">Crea tu cuenta para participar en la galeria.</p>
        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              type="text"
              placeholder="alicia88"
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              required
              minLength={3}
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="alicia@mail.com"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="pass">Contrasena</label>
            <input
              id="pass"
              type="password"
              placeholder="********"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required
              minLength={8}
            />
          </div>
          <div className="field">
            <label htmlFor="community">Comunidad (opcional)</label>
            <select
              id="community"
              value={form.communityId}
              onChange={(event) => setForm((prev) => ({ ...prev, communityId: event.target.value }))}
            >
              <option value="">Sin comunidad</option>
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>
          <button className="btn" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Creando...' : 'Crear cuenta'}
          </button>
          <div className="helper">
            Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
          </div>
        </form>
        {status === 'error' && <div className="status error">{error}</div>}
      </div>
    </div>
  );
}
