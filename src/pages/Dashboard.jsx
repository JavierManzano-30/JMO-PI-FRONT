import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { StatusBlock } from '../components/StatusBlock.jsx';
import { listPhotos } from '../services/photosService.js';
import { listThemes } from '../services/themesService.js';
import { listCategories } from '../services/categoriesService.js';
import { listCommunities } from '../services/communitiesService.js';
import { createVote } from '../services/votesService.js';
import { ApiError } from '../lib/apiClient.js';

const PAGE_SIZE = 9;

export function Dashboard() {
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total_pages: 0 });
  const [weeklyTheme, setWeeklyTheme] = useState(null);
  const [categories, setCategories] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [votingPhotoId, setVotingPhotoId] = useState(null);

  const filters = useMemo(
    () => ({
      page: Number(params.get('page') || '1'),
      communityId: params.get('community_id') || '',
      categoryId: params.get('category_id') || '',
      sort: params.get('sort') || 'created_at:desc',
    }),
    [params]
  );

  useEffect(() => {
    listCategories()
      .then((response) => setCategories(response.data || []))
      .catch(() => setCategories([]));

    listCommunities({ limit: 100 })
      .then((response) => setCommunities(response.data || []))
      .catch(() => setCommunities([]));

    listThemes({ isActive: true, limit: 1 })
      .then((response) => setWeeklyTheme(response.data?.[0] || null))
      .catch(() => setWeeklyTheme(null));
  }, []);

  const loadPhotos = () => {
    setStatus('loading');
    setError('');

    listPhotos({
      page: filters.page,
      limit: PAGE_SIZE,
      communityId: filters.communityId || undefined,
      categoryId: filters.categoryId || undefined,
      sort: filters.sort,
    })
      .then((response) => {
        setPhotos(response.data || []);
        setMeta(response.meta || { page: 1, total_pages: 0 });
        setStatus(response.data?.length ? 'default' : 'empty');
      })
      .catch((requestError) => {
        setStatus('error');
        if (requestError instanceof ApiError) {
          setError(requestError.message);
        } else {
          setError('No se pudo cargar la galeria');
        }
      });
  };

  useEffect(() => {
    loadPhotos();
  }, [filters.page, filters.communityId, filters.categoryId, filters.sort]);

  const handleFilterChange = (key, value) => {
    const next = new URLSearchParams(params);

    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }

    next.set('page', '1');
    setParams(next);
  };

  const handleVote = async (photoId) => {
    setVotingPhotoId(photoId);
    setError('');

    try {
      await createVote(photoId);
      loadPhotos();
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('No se pudo registrar el voto');
      }
    } finally {
      setVotingPhotoId(null);
    }
  };

  return (
    <div className="dashboard">
      <div className="filters">
        <div className="filters-left">
          <select
            aria-label="Comunidad"
            value={filters.communityId}
            onChange={(event) => handleFilterChange('community_id', event.target.value)}
          >
            <option value="">Comunidad</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Categoria"
            value={filters.categoryId}
            onChange={(event) => handleFilterChange('category_id', event.target.value)}
          >
            <option value="">Categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Ordenar"
            value={filters.sort}
            onChange={(event) => handleFilterChange('sort', event.target.value)}
          >
            <option value="created_at:desc">Mas recientes</option>
            <option value="votes:desc">Mas votadas</option>
            <option value="votes:asc">Menos votadas</option>
          </select>
        </div>
        <div className="filters-center pagination">
          {filters.page <= 1 ? (
            <span className="pagination-arrow disabled">&lt;</span>
          ) : (
            <Link className="pagination-arrow" to={`?${new URLSearchParams({ ...Object.fromEntries(params), page: String(filters.page - 1) })}`}>
              &lt;
            </Link>
          )}
          <span className="page-link active">{meta.page || filters.page}</span>
          {meta.total_pages > (meta.page || filters.page) && (
            <Link
              className="pagination-arrow"
              to={`?${new URLSearchParams({ ...Object.fromEntries(params), page: String((meta.page || filters.page) + 1) })}`}
            >
              &gt;
            </Link>
          )}
        </div>
        <div className="filters-right">
          <strong>Tema semanal:</strong> {weeklyTheme?.title || 'Sin tema activo'}
        </div>
      </div>
      <StatusBlock state={status} />
      {error && <div className="status error">{error}</div>}
      {status === 'empty' && (
        <Link className="btn outline" to="/app/photos/upload" style={{ marginTop: 16 }}>
          Subir primera foto
        </Link>
      )}
      {status === 'default' && (
        <section className="gallery-card">
          <h3 className="gallery-title">GALERIA DE FOTOS</h3>
          <div className="gallery-cards">
            {photos.map((photo) => (
              <article className="photo-card" key={photo.id}>
                <Link className="photo-link" to={`/app/photos/${photo.id}`}>
                  <img src={photo.image} alt={photo.categoryName || photo.title} />
                </Link>
                <div className="photo-info">
                  <div className="photo-meta">
                    <div>{photo.displayName}</div>
                    <div>{photo.communityName || 'Sin comunidad'}</div>
                    <div>{photo.categoryName || 'Sin categoria'}</div>
                  </div>
                  <div className="photo-actions">
                    <div className="votes">❤ {photo.votes} votos</div>
                    <button
                      className="btn"
                      type="button"
                      onClick={() => handleVote(photo.rawId)}
                      disabled={votingPhotoId === photo.rawId}
                    >
                      {votingPhotoId === photo.rawId ? 'Votando...' : 'Votar'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
