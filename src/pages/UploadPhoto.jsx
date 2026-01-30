import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories, getThemes, uploadPhoto } from '../api/snapnation.js';
import { useAuth } from '../components/AuthContext.jsx';

export function UploadPhoto() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [categories, setCategories] = useState([]);
  const [themes, setThemes] = useState([]);
  const [preview, setPreview] = useState('/assets/photos/imagen1.jpg');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    theme_id: '',
    image: null,
  });

  useEffect(() => {
    let isMounted = true;
    Promise.all([getCategories(), getThemes({ is_active: true, limit: 10 })])
      .then(([categoriesResponse, themesResponse]) => {
        if (!isMounted) return;
        setCategories(categoriesResponse.data || []);
        setThemes(themesResponse.data || []);
        if (themesResponse.data?.length) {
          setForm((prev) => ({ ...prev, theme_id: String(themesResponse.data[0].id) }));
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setCategories([]);
        setThemes([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, image: file }));
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    if (!token) {
      setStatus('error');
      setErrorMessage('Necesitas iniciar sesión para subir una foto.');
      return;
    }
    if (!form.title || !form.theme_id || !form.image) {
      setStatus('error');
      setErrorMessage('Completa los campos obligatorios.');
      return;
    }
    try {
      await uploadPhoto({
        token,
        title: form.title,
        description: form.description,
        theme_id: Number(form.theme_id),
        category_id: form.category_id ? Number(form.category_id) : undefined,
        image: form.image,
      });
      navigate('/app/photos/upload/success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message || 'No se pudo subir la foto.');
    }
  };

  return (
    <div className="split">
      <div className="card">
        <h2 className="section-title">Subir foto</h2>
        <p className="section-subtitle">Completa la ficha para abrir votacion.</p>
        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="title">Titulo</label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="Atardecer urbano"
              value={form.title}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="description">Descripcion</label>
            <textarea
              id="description"
              name="description"
              rows="4"
              placeholder="Describe la historia de la foto..."
              value={form.description}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="theme">Tema</label>
            <select id="theme" name="theme_id" value={form.theme_id} onChange={handleChange}>
              <option value="">Selecciona tema</option>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.title}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="category">Categoria</label>
            <select
              id="category"
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
            >
              <option value="">Selecciona categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="file">Archivo</label>
            <input id="file" type="file" accept="image/*" onChange={handleFileChange} />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Subiendo...' : 'Subir'}
            </button>
            <Link className="btn outline" to="/app/dashboard">
              Cancelar
            </Link>
          </div>
        </form>
        {status === 'error' && <div className="status error">{errorMessage}</div>}
      </div>
      <div className="card">
        <h3 className="card-title">Vista previa</h3>
        <img className="hero-image" src={preview} alt="Vista previa" />
        <p className="helper" style={{ marginTop: 12 }}>
          Formatos admitidos: JPG, PNG. Max 8MB.
        </p>
      </div>
    </div>
  );
}
