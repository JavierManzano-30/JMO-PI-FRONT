import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPhoto, votePhoto } from '../api/snapnation.js';
import { useAuth } from '../components/AuthContext.jsx';

export function PhotoDetail() {
  const { photoId } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const { token } = useAuth();
  const [photo, setPhoto] = useState(null);
  const [status, setStatus] = useState('loading');
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setStatus('loading');
    getPhoto(photoId, token)
      .then((response) => {
        if (!isMounted) return;
        setPhoto(response);
        setStatus('default');
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus('error');
      });
    return () => {
      isMounted = false;
    };
  }, [photoId, token]);

  const handleVote = async () => {
    if (!token || !photo) return;
    setIsVoting(true);
    try {
      await votePhoto(token, photo.id);
      const updated = await getPhoto(photo.id, token);
      setPhoto(updated);
    } catch (error) {
      setStatus('error');
    } finally {
      setIsVoting(false);
    }
  };

  if (status === 'loading') {
    return <div className="status loading">Cargando foto...</div>;
  }

  if (status === 'error' || !photo) {
    return <div className="status error">No se pudo cargar la foto.</div>;
  }

  return (
    <div className="split">
      <div className="card">
        <h2 className="section-title">Detalle de la foto</h2>
        <p className="section-subtitle">Foto #{photoId} en votacion abierta.</p>
        <button className="image-button" type="button" onClick={() => setIsOpen(true)}>
          <img className="hero-image" src={photo.image_url || photo.thumb_url} alt={`Foto de ${photo.user?.username || 'usuario'}`} />
        </button>
        <div className="list photo-details">
          <div className="list-item">
            <strong>Autor</strong>
            <span>{photo.user?.display_name || photo.user?.username || `Usuario #${photo.user_id}`}</span>
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
            <span>{photo.votes_count ?? 0}</span>
          </div>
        </div>
        <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn" type="button" onClick={handleVote} disabled={!token || isVoting || photo.has_user_voted}>
            {photo.has_user_voted ? 'Ya votaste' : isVoting ? 'Votando...' : 'Votar'}
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
        <div className="comment-list">
          <div className="comment-item">
            <div className="comment-meta">
              <strong>Lucia R.</strong>
              <span>hace 1h</span>
            </div>
            <p>Gran luz en el retrato.</p>
          </div>
          <div className="comment-item">
            <div className="comment-meta">
              <strong>Marcos P.</strong>
              <span>hace 3h</span>
            </div>
            <p>Composicion impecable.</p>
          </div>
          <div className="comment-item">
            <div className="comment-meta">
              <strong>Ana G.</strong>
              <span>ayer</span>
            </div>
            <p>Me encanta la paleta.</p>
          </div>
        </div>
        <form className="comment-form">
          <textarea rows="2" placeholder="Escribe tu comentario..." />
          <button className="btn" type="button">
            Publicar
          </button>
        </form>
      </div>
      {isOpen && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setIsOpen(false)}>
          <button className="lightbox-close" type="button" onClick={() => setIsOpen(false)}>
            Cerrar
          </button>
          <img
            className="lightbox-image"
            src={photo.image}
            alt={`Foto de ${photo.user} ampliada`}
          />
        </div>
      )}
    </div>
  );
}
