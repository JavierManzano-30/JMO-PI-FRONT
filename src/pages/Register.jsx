import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.jsx';
import { getCommunities } from '../api/snapnation.js';

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [communities, setCommunities] = useState([]);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    community_id: '',
  });

  useEffect(() => {
    let isMounted = true;
    getCommunities()
      .then((response) => {
        if (!isMounted) return;
        setCommunities(response.data || []);
      })
      .catch(() => {
        if (!isMounted) return;
        setCommunities([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    if (!form.username || !form.email || !form.password) {
      setStatus('error');
      setErrorMessage('Completa los campos obligatorios.');
      return;
    }
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        community_id: form.community_id ? Number(form.community_id) : undefined,
      });
      navigate('/app/dashboard');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message || 'No se pudo registrar. Intenta de nuevo.');
    }
  };

  return (
    <div className="auth-layout">
      <div className="card auth-card">
        <h2 className="card-title">Registro</h2>
        <p className="card-subtle">Crea tu cuenta para participar en la galeria.</p>
        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="user">Usuario</label>
            <input
              id="user"
              name="username"
              type="text"
              placeholder="alicia88"
              value={form.username}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="alicia@mail.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="pass">Contrasena</label>
            <input
              id="pass"
              name="password"
              type="password"
              placeholder="********"
              value={form.password}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="community">Comunidad</label>
            <select id="community" name="community_id" value={form.community_id} onChange={handleChange}>
              <option value="">Selecciona comunidad</option>
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>
          <button className="btn" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
          <div className="helper">
            Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
          </div>
        </form>
        {status === 'error' && <div className="status error">{errorMessage}</div>}
      </div>
    </div>
  );
}
