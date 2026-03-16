import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPhotoById } from '../services/photosService.js';
import { ApiError } from '../lib/apiClient.js';

export function PhotoDetailClosed() {
  const { photoId } = useParams();
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getPhotoById(photoId)
      .then(setPhoto)
      .catch((requestError) => {
        if (requestError instanceof ApiError) {
          setError(requestError.message);
        } else {
          setError('No se pudo cargar la foto');
        }
      });
  }, [photoId]);

  if (error) {
    return <div className="status error">{error}</div>;
  }

  if (!photo) {
    return <div className="status loading">Cargando foto...</div>;
  }

  return (
    <div className="split">
      <div className="card">
        <h2 className="section-title">Votacion cerrada</h2>
        <p className="section-subtitle">La ronda termino. Datos disponibles desde backend.</p>
        <img className="hero-image" src={photo.image} alt={`Foto de ${photo.user?.displayName}`} />
        <div className="list">
          <div className="list-item">
            <span>Votos finales</span>
            <strong>{photo.votes}</strong>
          </div>
          <div className="list-item">
            <span>Tema</span>
            <strong>{photo.theme?.title}</strong>
          </div>
          <div className="list-item">
            <span>Autor</span>
            <strong>{photo.user?.displayName}</strong>
          </div>
        </div>
        <Link className="btn outline" to={`/app/photos/${photo.id}`} style={{ marginTop: 18 }}>
          Volver al detalle
        </Link>
      </div>
      <div className="card">
        <h3 className="card-title">Ganadores</h3>
        <p className="helper">
          El backend actual no expone ranking de ganadores en un endpoint consumible por esta vista.
        </p>
      </div>
    </div>
  );
}
