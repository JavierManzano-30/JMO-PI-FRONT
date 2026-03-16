import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPhoto } from '../services/photosService.js';
import { listThemes } from '../services/themesService.js';
import { listCategories } from '../services/categoriesService.js';
import { ApiError } from '../lib/apiClient.js';

export function UploadPhoto() {
  const navigate = useNavigate();
  const [themes, setThemes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [preview, setPreview] = useState('/assets/photos/imagen1.jpg');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    themeId: '',
    categoryId: '',
    imageFile: null,
  });

  useEffect(() => {
    listThemes({ isActive: true, limit: 100 })
      .then((response) => {
        const activeThemes = response.data || [];
        setThemes(activeThemes);
        if (activeThemes.length > 0) {
          setForm((prev) => ({ ...prev, themeId: String(activeThemes[0].id) }));
        }
      })
      .catch(() => setThemes([]));

    listCategories()
      .then((response) => setCategories(response.data || []))
      .catch(() => setCategories([]));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('loading');
    setError('');

    if (!form.imageFile) {
      setStatus('error');
      setError('Debes seleccionar una imagen');
      return;
    }

    try {
      await createPhoto({
        title: form.title,
        description: form.description,
        themeId: form.themeId,
        categoryId: form.categoryId || undefined,
        imageFile: form.imageFile,
      });

      navigate('/app/photos/upload/success');
    } catch (requestError) {
      setStatus('error');
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('No se pudo subir la foto');
      }
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
              type="text"
              placeholder="Atardecer urbano"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              required
              maxLength={150}
            />
          </div>
          <div className="field">
            <label htmlFor="description">Descripcion</label>
            <textarea
              id="description"
              rows="4"
              placeholder="Describe la historia de la foto..."
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="theme">Tema semanal</label>
            <select
              id="theme"
              value={form.themeId}
              onChange={(event) => setForm((prev) => ({ ...prev, themeId: event.target.value }))}
              required
            >
              <option value="">Selecciona un tema</option>
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
              value={form.categoryId}
              onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
            >
              <option value="">Sin categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="file">Archivo</label>
            <input
              id="file"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }

                setForm((prev) => ({ ...prev, imageFile: file }));
                setPreview(URL.createObjectURL(file));
              }}
              required
            />
          </div>
          {status === 'error' && <div className="status error">{error}</div>}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Subiendo...' : 'Subir'}
            </button>
            <Link className="btn outline" to="/app/dashboard">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
      <div className="card">
        <h3 className="card-title">Vista previa</h3>
        <img className="hero-image" src={preview} alt="Vista previa" />
        <p className="helper" style={{ marginTop: 12 }}>
          Formatos admitidos: JPG, PNG. Max 5MB.
        </p>
      </div>
    </div>
  );
}
