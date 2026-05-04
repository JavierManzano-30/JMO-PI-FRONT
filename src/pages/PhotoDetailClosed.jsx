import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../lib/apiClient.js';
import { getRealtimeSocket, registerRealtimeHandlers, subscribeRealtimeRooms } from '../lib/realtime.js';
import { deletePhoto, getPhotoById, getPhotoRanking } from '../services/photosService.js';

function formatDate(dateValue) {
  if (!dateValue) {
    return 'Sin fecha';
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(date);
}

function getClosedContestStatus(theme) {
  if (!theme) {
    return { label: 'Ronda sin datos de estado', tone: 'muted' };
  }

  if (theme.is_active || theme.isActive) {
    return { label: 'Resultados provisionales', tone: 'pending' };
  }

  return { label: 'Resultados publicados', tone: 'closed' };
}

export function PhotoDetailClosed() {
  const { photoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [photo, setPhoto] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [rankingSummary, setRankingSummary] = useState(null);
  const [rankingTheme, setRankingTheme] = useState(null);
  const [status, setStatus] = useState('loading');
  const [rankingStatus, setRankingStatus] = useState('loading');
  const [error, setError] = useState('');
  const [rankingError, setRankingError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

  const loadPhoto = useCallback(async () => {
    try {
      const photoResponse = await getPhotoById(photoId);
      setPhoto(photoResponse);
      setStatus('default');
      setError('');
      return photoResponse;
    } catch (requestError) {
      setStatus('error');
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('No se pudo cargar el detalle de la fotografía.');
      }
      return null;
    }
  }, [photoId]);

  const loadRanking = useCallback(async () => {
    setRankingStatus('loading');
    setRankingError('');

    try {
      const response = await getPhotoRanking(photoId, { limit: 8 });
      setRanking(response.leaderboard || []);
      setRankingSummary(response.ranking || null);
      setRankingTheme(response.theme || null);
      setRankingStatus(response.leaderboard?.length ? 'default' : 'empty');
    } catch (requestError) {
      setRanking([]);
      setRankingSummary(null);
      setRankingStatus('error');
      if (requestError instanceof ApiError) {
        setRankingError(requestError.message);
      } else {
        setRankingError('La clasificación no está disponible por el momento.');
      }
    }
  }, [photoId]);

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      setStatus('loading');
      const photoResponse = await loadPhoto();
      if (!isMounted || !photoResponse) {
        return;
      }
      await loadRanking();
    }

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [loadPhoto, loadRanking]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!photo?.rawId && !rankingTheme?.communityId) {
      return undefined;
    }

    const socket = getRealtimeSocket();
    subscribeRealtimeRooms(socket, {
      photoId: photo?.rawId,
      communityId: rankingTheme?.communityId,
    });

    const handleVoteChanged = (payload) => {
      const samePhoto = payload.photo_id === photo?.rawId;
      const sameCommunity = rankingTheme?.communityId && payload.community_id === rankingTheme.communityId;

      if (!samePhoto && !sameCommunity) {
        return;
      }

      if (samePhoto) {
        setPhoto((prev) => (prev ? { ...prev, votes: payload.total_votes } : prev));
      }

      loadRanking();
    };

    const handlePhotoCreated = (payload) => {
      if (rankingTheme?.communityId && payload?.community_id === rankingTheme.communityId && rankingTheme?.isActive) {
        loadRanking();
      }
    };

    const cleanupRealtime = registerRealtimeHandlers(socket, [
      { event: 'vote:changed', handler: handleVoteChanged },
      { event: 'photo:created', handler: handlePhotoCreated },
    ]);

    return () => {
      cleanupRealtime();
    };
  }, [photo?.rawId, rankingTheme?.communityId, rankingTheme?.isActive, loadRanking]);

  const currentPosition = rankingSummary?.rank || null;

  const enrichedRanking = useMemo(() => {
    if (!rankingSummary || !photo) {
      return ranking;
    }

    const containsCurrent = ranking.some((entry) => entry.photoId === photo.rawId);
    if (containsCurrent || !rankingSummary.rank) {
      return ranking;
    }

    return [
      ...ranking,
      {
        photoId: photo.rawId,
        photoTitle: photo.title,
        thumb: photo.thumb,
        authorDisplayName: photo.user?.displayName,
        votes: rankingSummary.votes,
        rank: rankingSummary.rank,
        isOfficialWinner: rankingSummary.isOfficialWinner,
      },
    ];
  }, [ranking, rankingSummary, photo]);

  const podium = useMemo(() => ranking.slice(0, 3), [ranking]);

  const contestStatus = useMemo(() => getClosedContestStatus(photo?.theme), [photo?.theme]);

  const canDeletePhoto = Boolean(user?.id && photo?.user?.id && user.id === photo.user.id);

  const handleDeletePhoto = async () => {
    if (!photo || !canDeletePhoto || isDeletingPhoto) {
      return;
    }

    const confirmed = window.confirm('Esta acción eliminará la fotografía de forma permanente. ¿Deseas continuar?');
    if (!confirmed) {
      return;
    }

    setIsDeletingPhoto(true);
    setError('');

    try {
      await deletePhoto(photo.rawId);
      navigate('/app/dashboard');
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('No se pudo eliminar la fotografía.');
      }
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  if (status === 'loading') {
    return <div className="status loading">Cargando resultado de la fotografía...</div>;
  }

  if (status === 'error') {
    return (
      <article className="card">
        <h2 className="section-title">Resultado de fotografía</h2>
        <div className="status error">{error}</div>
        <Link className="btn btn-ghost" to="/app/dashboard">
          Volver a la galería
        </Link>
      </article>
    );
  }

  return (
<<<<<<< Updated upstream
    <section className="photo-detail-page photo-detail-page-closed">
      <article className="card photo-detail-main">
        <header className="photo-detail-head">
          <div>
            <p className="eyebrow">Resultado del concurso</p>
            <h1 className="section-title">{photo.title || 'Fotografía sin título'}</h1>
            <p className="section-subtitle">
              Resumen de desempeño y posición de esta obra en la clasificación del tema semanal.
            </p>
          </div>
          <div className="photo-detail-head-meta">
            <span className={`contest-pill contest-pill-${contestStatus.tone}`}>{contestStatus.label}</span>
            <strong className="vote-counter">{photo.votes} votos finales</strong>
=======
    <div className="split">
      <div className="card">
        <h2 className="section-title">Votacion cerrada</h2>
        <p className="section-subtitle">
          La ronda termino. Ganadores por comunidad listos para la final del pais.
        </p>
        <img className="hero-image" src={photo.image} alt={`Foto de ${photo.user}`} />
        <div className="list">
          <div className="list-item">
            <span>Puntaje final</span>
            <strong>9.4</strong>
          </div>
          <div className="list-item">
            <span>Comunidad</span>
            <strong>{photo.city}</strong>
          </div>
          <div className="list-item">
            <span>Posicion</span>
            <strong>3 de 48</strong>
>>>>>>> Stashed changes
          </div>
        </header>

        <div className="photo-detail-grid">
          <section className="photo-visual-block">
            <button
              className="image-button photo-hero-button"
              type="button"
              onClick={() => setIsOpen(true)}
              aria-label="Ampliar fotografía"
            >
              <img className="hero-image photo-hero-image" src={photo.image} alt={`Foto de ${photo.user?.displayName || 'autor'}`} />
              <span className="photo-zoom-hint">Ver en grande</span>
            </button>

            <div className="result-highlight-strip">
              <div>
                <span>Posición</span>
                <strong>{currentPosition ? `#${currentPosition}` : 'Pendiente'}</strong>
              </div>
              <div>
                <span>Tema</span>
                <strong>{photo.theme?.title || 'Sin tema'}</strong>
              </div>
              <div>
                <span>Votos</span>
                <strong>{photo.votes}</strong>
              </div>
            </div>
          </section>

          <aside className="photo-meta-panel" aria-label="Resumen del resultado">
            <h2>Resumen de participación</h2>
            <dl className="photo-meta-list">
              <div>
                <dt>Autor</dt>
                <dd>{photo.user?.displayName || 'Autor no disponible'}</dd>
              </div>
              <div>
                <dt>Categoría</dt>
                <dd>{photo.category?.name || 'Sin categoría'}</dd>
              </div>
              <div>
                <dt>Tema</dt>
                <dd>{photo.theme?.title || 'Sin tema asignado'}</dd>
              </div>
              <div>
                <dt>Periodo</dt>
                <dd>
                  {formatDate(photo.theme?.start_date || photo.theme?.startDate)} - {formatDate(photo.theme?.end_date || photo.theme?.endDate)}
                </dd>
              </div>
              <div>
                <dt>Participantes</dt>
                <dd>{rankingSummary?.totalEntries || 0}</dd>
              </div>
              <div>
                <dt>Publicado</dt>
                <dd>{formatDate(photo.createdAt)}</dd>
              </div>
            </dl>

            {error && <div className="status error">{error}</div>}

            {photo.description ? (
              <div className="photo-description-note">
                <strong>Descripción del autor</strong>
                <p>{photo.description}</p>
              </div>
            ) : (
              <div className="photo-description-note muted">
                <strong>Descripción del autor</strong>
                <p>Esta publicación no incluye descripción adicional.</p>
              </div>
            )}

            <div className="inline-actions photo-secondary-actions">
              <Link className="btn btn-ghost" to={`/app/photos/${photo.id}`}>Volver al detalle activo</Link>
              <Link className="btn" to="/app/contests">Ver concursos</Link>
              {canDeletePhoto && (
                <button className="btn btn-ghost" type="button" onClick={handleDeletePhoto} disabled={isDeletingPhoto}>
                  {isDeletingPhoto ? 'Eliminando...' : 'Eliminar foto'}
                </button>
              )}
            </div>
          </aside>
        </div>
      </article>

      <aside className="card ranking-panel" aria-label="Clasificación del tema">
        <header className="ranking-panel-head">
          <h2 className="section-title">Clasificación del tema</h2>
          <p className="section-subtitle">
            {photo.theme?.title
              ? `Ronda: ${photo.theme.title}`
              : 'La clasificación se mostrará cuando la ronda esté asociada a un tema.'}
          </p>
        </header>

        {rankingStatus === 'loading' && (
          <div className="ranking-skeleton-list" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="ranking-skeleton-item" key={`ranking-skeleton-${index}`} />
            ))}
          </div>
        )}

        {rankingStatus === 'error' && (
          <div className="comments-state-block">
            <div className="status error">{rankingError || 'No se pudo cargar la clasificación del tema.'}</div>
            <button className="btn btn-ghost" type="button" onClick={loadRanking}>Reintentar</button>
          </div>
        )}

        {rankingStatus === 'empty' && (
          <div className="status empty">
            La clasificación de esta ronda se publicará cuando el comité cierre y consolide los resultados.
          </div>
        )}

        {rankingStatus === 'default' && podium.length > 0 && (
          <div className="podium-strip" aria-label="Podio de la ronda">
            {podium.map((entry) => (
              <article
                key={entry.photoId}
                className={`podium-item podium-${entry.rank} ${entry.photoId === Number(photoId) ? 'is-current' : ''}`}
              >
                <span className="podium-rank">#{entry.rank}</span>
                <strong>{entry.authorDisplayName}</strong>
                <small>{entry.votes} votos</small>
              </article>
            ))}
          </div>
        )}

        {rankingStatus === 'default' && (
          <div className="winner-list compact ranking-list">
            {enrichedRanking.map((entry) => (
              <div
                className={`winner-item ${entry.rank <= 3 ? 'top' : ''} ${entry.photoId === Number(photoId) ? 'highlighted' : ''}`}
                key={entry.photoId}
              >
                <div className="rank-badge">#{entry.rank}</div>
                <img src={entry.thumb} alt={entry.photoTitle} />
                <div className="winner-item-meta">
                  <strong>{entry.photoTitle}</strong>
                  <span>{entry.authorDisplayName}</span>
                  <small>{entry.votes} votos</small>
                </div>
                {entry.photoId === Number(photoId) && <span className="winner-tag">Esta foto</span>}
              </div>
            ))}
          </div>
        )}
      </aside>

      {isOpen && (
        <div
          className="lightbox photo-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Visualización ampliada de fotografía"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div className="photo-lightbox-frame">
            <button className="lightbox-close" type="button" onClick={() => setIsOpen(false)}>
              Cerrar
            </button>
            <img className="lightbox-image photo-lightbox-image" src={photo.image} alt={`Foto de ${photo.user?.displayName || 'autor'} ampliada`} />
            <p className="photo-lightbox-caption">
              {photo.title || 'Fotografía'} · {photo.user?.displayName || 'Autor'}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
