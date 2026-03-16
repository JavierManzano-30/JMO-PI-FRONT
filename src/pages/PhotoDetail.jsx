import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPhotoById } from '../services/photosService.js';
import { createVote, deleteVote } from '../services/votesService.js';
import { ApiError } from '../lib/apiClient.js';

export function PhotoDetail() {
  const { photoId } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [isVoting, setIsVoting] = useState(false);

  const loadPhoto = async () => {
    setStatus('loading');
    setError('');

    try {
      const response = await getPhotoById(photoId);
      setPhoto(response);
      setStatus('default');
    } catch (requestError) {
      setStatus('error');
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('No se pudo cargar el detalle de la foto');
      }
    }
  };

  useEffect(() => {
    loadPhoto();
  }, [photoId]);

  const handleToggleVote = async () => {
    if (!photo) {
      return;
    }

    setIsVoting(true);
    setError('');

    try {
      if (photo.hasUserVoted) {
        await deleteVote(photo.rawId);
      } else {
        await createVote(photo.rawId);
      }

      await loadPhoto();
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('No se pudo actualizar el voto');
      }
    } finally {
      setIsVoting(false);
    }
  };

  if (status === 'loading') {
    return <div className="status loading">Cargando detalle...</div>;
  }

  if (status === 'error') {
    return (
      <div className="card">
        <h2 className="section-title">Detalle de la foto</h2>
        <div className="status error">{error}</div>
        <Link className="btn outline" to="/app/dashboard">
          Volver a galeria
        </Link>
      </div>
    );
  }

  return (
    <div className="split">
      <div className="card">
        <h2 className="section-title">Detalle de la foto</h2>
        <p className="section-subtitle">Foto #{photo.id} en votacion abierta.</p>
        <button className="image-button" type="button" onClick={() => setIsOpen(true)}>
          <img className="hero-image" src={photo.image} alt={`Foto de ${photo.user?.displayName}`} />
        </button>
        <div className="list photo-details">
          <div className="list-item">
            <strong>Titulo</strong>
            <span>{photo.title}</span>
          </div>
          <div className="list-item">
            <strong>Autor</strong>
            <span>{photo.user?.displayName}</span>
          </div>
          <div className="list-item">
            <strong>Categoria</strong>
            <span>{photo.category?.name || 'Sin categoria'}</span>
          </div>
          <div className="list-item description-item">
            <strong>Descripcion</strong>
            <span>{photo.description || 'Sin descripcion'}</span>
          </div>
          <div className="list-item">
            <strong>Votos</strong>
            <span>{photo.votes}</span>
          </div>
        </div>
        {error && <div className="status error">{error}</div>}
        <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn" type="button" onClick={handleToggleVote} disabled={isVoting}>
            {isVoting ? 'Procesando...' : photo.hasUserVoted ? 'Quitar voto' : 'Votar'}
          </button>
          <Link className="btn outline" to="/app/dashboard">
            Volver a galeria
          </Link>
          <Link className="btn outline" to={`/app/photos/${photo.id}/closed`}>
            Ver votacion cerrada
          </Link>
        </div>
      </div>
      <div className="card comments-card">
        <h3 className="card-title">Comentarios</h3>
        <p className="helper">
          El backend actual no expone endpoints de comentarios; se deja este bloque preparado para integrarlo.
        </p>
      </div>
      {isOpen && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setIsOpen(false)}>
          <button className="lightbox-close" type="button" onClick={() => setIsOpen(false)}>
            Cerrar
          </button>
          <img
            className="lightbox-image"
            src={photo.image}
            alt={`Foto de ${photo.user?.displayName} ampliada`}
          />
        </div>
      )}
    </div>
  );
}
