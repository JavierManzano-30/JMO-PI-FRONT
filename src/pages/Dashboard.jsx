import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { StatusBlock } from '../components/StatusBlock.jsx';
import { getCategories, getCommunities, getPhotos, getThemes, votePhoto } from '../api/snapnation.js';
import { useAuth } from '../components/AuthContext.jsx';

export function Dashboard() {
  const { token } = useAuth();
  const [params] = useSearchParams();
  const page = params.get('page') || '1';
  const pageNumber = Number(page) || 1;
  const [status, setStatus] = useState('loading');
  const [photos, setPhotos] = useState([]);
  const [meta, setMeta] = useState({ total_pages: 1, page: 1, limit: 9 });
  const [categories, setCategories] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [themes, setThemes] = useState([]);
  const [filters, setFilters] = useState({
    community_id: '',
    category_id: '',
  });
  const [votingId, setVotingId] = useState(null);

  const totalPages = meta.total_pages || 1;
  const prevPage = Math.max(1, pageNumber - 1);
  const nextPage = Math.min(totalPages, pageNumber + 1);
  const windowPages = [
    Math.max(1, pageNumber - 1),
    pageNumber,
    Math.min(totalPages, pageNumber + 1),
  ].filter((value, index, self) => self.indexOf(value) === index);

  const activeTheme = useMemo(() => themes.find((theme) => theme.is_active) || themes[0], [themes]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getCategories(), getCommunities(), getThemes({ is_active: true, limit: 10 })])
      .then(([categoriesResponse, communitiesResponse, themesResponse]) => {
        if (!isMounted) return;
        setCategories(categoriesResponse.data || []);
        setCommunities(communitiesResponse.data || []);
        setThemes(themesResponse.data || []);
      })
      .catch(() => {
        if (!isMounted) return;
        setCategories([]);
        setCommunities([]);
        setThemes([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setStatus('loading');
    getPhotos({
      page: pageNumber,
      limit: 9,
      community_id: filters.community_id || undefined,
      category_id: filters.category_id || undefined,
    })
      .then((response) => {
        if (!isMounted) return;
        const items = response.data || [];
        setPhotos(items);
        setMeta(response.meta || { total_pages: 1, page: pageNumber, limit: 9 });
        setStatus(items.length === 0 ? 'empty' : 'default');
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus('error');
      });
    return () => {
      isMounted = false;
    };
  }, [pageNumber, filters]);

  const handleVote = async (photoId) => {
    if (!token) return;
    setVotingId(photoId);
    try {
      await votePhoto(token, photoId);
      const response = await getPhotos({
        page: pageNumber,
        limit: 9,
        community_id: filters.community_id || undefined,
        category_id: filters.category_id || undefined,
      });
      setPhotos(response.data || []);
      setMeta(response.meta || { total_pages: 1, page: pageNumber, limit: 9 });
      setStatus((response.data || []).length === 0 ? 'empty' : 'default');
    } catch (error) {
      setStatus('error');
    } finally {
      setVotingId(null);
    }
  };

  const communityMap = useMemo(() => {
    const map = new Map();
    communities.forEach((community) => map.set(community.id, community.name));
    return map;
  }, [communities]);

  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => map.set(category.id, category.name));
    return map;
  }, [categories]);

  return (
    <div className="dashboard">
      <div className="filters">
        <div className="filters-left">
          <select
            aria-label="Comunidad"
            value={filters.community_id}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, community_id: event.target.value }))
            }
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
            value={filters.category_id}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, category_id: event.target.value }))
            }
          >
            <option value="">Categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filters-center pagination">
          {pageNumber === 1 ? (
            <span className="pagination-arrow disabled">&lt;</span>
          ) : (
            <Link className="pagination-arrow" to={`?page=${prevPage}`}>
              &lt;
            </Link>
          )}
          {pageNumber > 2 && (
            <>
              <Link className="page-link" to="?page=1">
                1
              </Link>
              <span className="pagination-ellipsis">...</span>
            </>
          )}
          {windowPages.map((value) => (
            <Link
              key={value}
              className={`page-link ${pageNumber === value ? 'active' : ''}`}
              to={`?page=${value}`}
            >
              {value}
            </Link>
          ))}
          {pageNumber < totalPages - 1 && (
            <>
              <span className="pagination-ellipsis">...</span>
              <Link className="page-link" to={`?page=${totalPages}`}>
                {totalPages}
              </Link>
            </>
          )}
          {pageNumber === totalPages ? (
            <span className="pagination-arrow disabled">&gt;</span>
          ) : (
            <Link className="pagination-arrow" to={`?page=${nextPage}`}>
              &gt;
            </Link>
          )}
        </div>
        <div className="filters-right">
          <strong>Tema semanal:</strong> {activeTheme ? activeTheme.title : 'Sin tema activo'}
        </div>
      </div>
      <StatusBlock state={status} />
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
                  <img src={photo.image_url || photo.thumb_url} alt={photo.title || 'Foto'} />
                </Link>
                <div className="photo-info">
                  <div className="photo-meta">
                    <div>{photo.user_display_name || photo.username || `Usuario #${photo.user_id}`}</div>
                    <div>{photo.community_name || communityMap.get(photo.community_id) || 'Sin comunidad'}</div>
                    <div>{photo.category_name || categoryMap.get(photo.category_id) || 'Sin categoria'}</div>
                  </div>
                  <div className="photo-actions">
                    <div className="votes">❤ {photo.votes_count ?? 0} votos</div>
                    <button
                      className="btn"
                      type="button"
                      onClick={() => handleVote(photo.id)}
                      disabled={!token || votingId === photo.id}
                    >
                      {votingId === photo.id ? 'Votando...' : 'Votar'}
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
