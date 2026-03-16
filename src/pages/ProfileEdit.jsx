import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.jsx';
import { ApiError } from '../lib/apiClient.js';

export function ProfileEdit() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.avatarUrl);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('saving');
    setError('');

    try {
      await updateProfile({ displayName, avatarFile });
      navigate('/app/profile');
    } catch (requestError) {
      setStatus('error');
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('No se pudo actualizar el perfil');
      }
    }
  };

  return (
    <div className="split">
      <div className="card">
        <h2 className="section-title">Editar perfil</h2>
        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="displayName">Nombre visible</label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={100}
            />
          </div>
          {error && <div className="status error">{error}</div>}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn" type="submit" disabled={status === 'saving'}>
              {status === 'saving' ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <Link className="btn outline" to="/app/profile">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
      <div className="card">
        <h3 className="card-title">Foto de perfil</h3>
        <img className="avatar-large" src={photoPreview} alt="Foto de perfil" />
        <div className="field">
          <label htmlFor="photo">Cambiar foto</label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }

              setAvatarFile(file);
              setPhotoPreview(URL.createObjectURL(file));
            }}
          />
        </div>
      </div>
    </div>
  );
}
