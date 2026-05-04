import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Flame,
  ArrowRight,
  TrendingUp,
  History,
  Users,
  Search,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button.jsx';
import { StatusMessage } from '../components/ui/StatusMessage.jsx';
import { ApiError } from '../lib/apiClient.js';
import { getRealtimeSocket, registerRealtimeHandlers, subscribeRealtimeRooms } from '../lib/realtime.js';
import { listCommunities } from '../services/communitiesService.js';
import { listWinners } from '../services/winnersService.js';

const HISTORY_PAGE_SIZE = 12; // Adjusted for the new layout
const ACTIVE_RANK_LIMIT = 5;
const ACTIVE_FETCH_LIMIT = 60;
const OFFICIAL_FETCH_LIMIT = 24;

function groupEntriesByTheme(entries) {
  const groups = new Map();

  entries.forEach((entry) => {
    if (!groups.has(entry.themeId)) {
      groups.set(entry.themeId, {
        themeId: entry.themeId,
        themeTitle: entry.themeTitle,
        communityName: entry.communityName,
        themeIsActive: entry.themeIsActive,
        rows: [],
      });
    }

    groups.get(entry.themeId).rows.push(entry);
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    rows: group.rows.sort((a, b) => a.rank - b.rank),
  }));
}

export function Winners() {
  const { isAuthenticated } = useAuth();
  const [params, setParams] = useSearchParams();

  const [communities, setCommunities] = useState([]);

  const [activeStatus, setActiveStatus] = useState('loading');
  const [activeError, setActiveError] = useState('');
  const [activeEntries, setActiveEntries] = useState([]);

  const [officialStatus, setOfficialStatus] = useState('loading');
  const [officialError, setOfficialError] = useState('');
  const [officialEntries, setOfficialEntries] = useState([]);

  const [historyStatus, setHistoryStatus] = useState('loading');
  const [historyError, setHistoryError] = useState('');
  const [historyEntries, setHistoryEntries] = useState([]);
  const [historyMeta, setHistoryMeta] = useState({ page: 1, total_pages: 0 });

  const filters = useMemo(
    () => ({
      page: Number(params.get('page') || '1'),
      communityId: params.get('community_id') || '',
    }),
    [params]
  );

  useEffect(() => {
    listCommunities({ limit: 100 })
      .then((response) => setCommunities(response.data || []))
      .catch(() => setCommunities([]));
  }, []);

  const loadActiveRanking = useCallback(async () => {
    setActiveStatus('loading');
    setActiveError('');

    try {
      const response = await listWinners({
        page: 1,
        limit: ACTIVE_FETCH_LIMIT,
        communityId: filters.communityId || undefined,
        themeState: 'active',
        rankLimit: ACTIVE_RANK_LIMIT,
      });

      const rows = response.data || [];
      setActiveEntries(rows);
      setActiveStatus(rows.length ? 'default' : 'empty');
    } catch (requestError) {
      setActiveStatus('error');
      setActiveError(requestError instanceof ApiError ? requestError.message : 'No se pudo cargar el ranking actual.');
    }
  }, [filters.communityId]);

  const loadOfficialWinners = useCallback(async () => {
    setOfficialStatus('loading');
    setOfficialError('');

    try {
      const response = await listWinners({
        page: 1,
        limit: OFFICIAL_FETCH_LIMIT,
        communityId: filters.communityId || undefined,
        themeState: 'closed',
        officialOnly: true,
        rankLimit: 1,
      });

      const rows = response.data || [];
      setOfficialEntries(rows);
      setOfficialStatus(rows.length ? 'default' : 'empty');
    } catch (requestError) {
      setOfficialStatus('error');
      setOfficialError(requestError instanceof ApiError ? requestError.message : 'No se pudo cargar el resumen.');
    }
  }, [filters.communityId]);

  const loadClosedHistory = useCallback(async () => {
    setHistoryStatus('loading');
    setHistoryError('');

    try {
      const response = await listWinners({
        page: filters.page,
        limit: HISTORY_PAGE_SIZE,
        communityId: filters.communityId || undefined,
        themeState: 'closed',
        rankLimit: 3,
      });

      const rows = response.data || [];
      setHistoryEntries(rows);
      setHistoryMeta(response.meta || { page: 1, total_pages: 0 });
      setHistoryStatus(rows.length ? 'default' : 'empty');
    } catch (requestError) {
      setHistoryStatus('error');
      setHistoryError(requestError instanceof ApiError ? requestError.message : 'No se pudo cargar el historial.');
    }
  }, [filters.page, filters.communityId]);

  useEffect(() => {
    loadActiveRanking();
    loadOfficialWinners();
  }, [loadActiveRanking, loadOfficialWinners]);

  useEffect(() => {
    loadClosedHistory();
  }, [loadClosedHistory]);

  useEffect(() => {
    const socket = getRealtimeSocket();
    subscribeRealtimeRooms(socket, { communityId: filters.communityId || null });

    const handleVoteChanged = (payload) => {
      if (filters.communityId && String(payload?.community_id) !== filters.communityId) return;
      loadActiveRanking();
    };

    const handlePhotoCreated = (payload) => {
      if (filters.communityId && String(payload?.community_id) !== filters.communityId) return;
      loadActiveRanking();
    };

    const cleanupRealtime = registerRealtimeHandlers(socket, [
      { event: 'vote:changed', handler: handleVoteChanged },
      { event: 'photo:created', handler: handlePhotoCreated },
    ]);

    return () => cleanupRealtime();
  }, [filters.communityId, loadActiveRanking]);

  const activeByTheme = useMemo(() => groupEntriesByTheme(activeEntries), [activeEntries]);
  const closedByTheme = useMemo(() => groupEntriesByTheme(historyEntries), [historyEntries]);
  const contestsBasePath = isAuthenticated ? '/app/contests' : '/contests';

  const handleFilterChange = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.set('page', '1');
    setParams(next);
  };

  return (
    <div className="winners-page">
      {/* --- HERO AREA --- */}
      <header className="winners-hero">
        <div className="winners-hero-content">
          <span className="eyebrow">SnapNation Concursos</span>
          <h1>Concursos <br /> Activos e Históricos</h1>
          <p>
            Consulta los concursos activos y los ya finalizados, con sus clasificaciones
            y resultados oficiales por comunidad.
          </p>
        </div>
      </header>

      {/* --- FLOATING FILTERS --- */}
      <div className="winners-filters">
        <div className="filter-glass">
          <label htmlFor="winnerCommunity">
            <Users size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            Comunidad
          </label>
          <select
            id="winnerCommunity"
            value={filters.communityId}
            onChange={(event) => handleFilterChange('community_id', event.target.value)}
          >
            <option value="">Todos los mundos</option>
            {communities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* --- ACTIVE RANKING SECTION --- */}
      <section className="winners-section">
        <div className="winners-section-head">
          <div>
            <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Flame size={14} /> CONCURSOS ACTIVOS
            </span>
            <h2>Concursos en Curso</h2>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Clasificación provisional en tiempo real</p>
        </div>

        {activeStatus === 'loading' && <StatusMessage tone="loading">Sincronizando rankings...</StatusMessage>}
        {activeStatus === 'error' && <StatusMessage tone="error">{activeError}</StatusMessage>}
        {activeStatus === 'empty' && <StatusMessage tone="empty">No hay rondas activas ahora mismo.</StatusMessage>}

        {activeStatus === 'default' && (
          <div className="active-ranking-grid">
            {activeByTheme.map((group) => (
              <div className="theme-bracket" key={`active-${group.themeId}`}>
                <div className="theme-bracket-header">
                  <h3>{group.themeTitle}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div className="status-pulse">
                      <span className="pulse-dot" /> Live
                    </div>
                    <Link className="btn btn-link" to={`${contestsBasePath}/${group.themeId}`}>Ver concurso</Link>
                  </div>
                </div>

                <div className="ranking-stack">
                  {group.rows.map((entry) => (
                    <div 
                      className={`rank-item ${entry.rank === 1 ? 'top-1' : ''}`} 
                      key={`active-${entry.themeId}-${entry.photoId}`}
                    >
                      <div className="rank-number">
                        {entry.rank === 1 ? <Crown size={24} /> : `#${entry.rank}`}
                      </div>
                      <img src={entry.thumb} alt={entry.photoTitle} className="rank-thumb" />
                      <div className="rank-info">
                        <b>{entry.photoTitle}</b>
                        <span>{entry.authorDisplayName}</span>
                      </div>
                      <div className="rank-score">
                        <b>{entry.votes}</b>
                        <small style={{ display: 'block', fontSize: '0.625rem', opacity: 0.5 }}>VOTOS</small>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <Link to={`/photos/${group.rows[0].photoId}`} className="btn btn-ghost btn-sm">
                    Ir a la batalla <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- HALL OF FAME SECTION --- */}
      <section className="winners-section">
        <div className="winners-section-head">
          <div>
            <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Trophy size={14} /> ELITE SELECTION
            </span>
            <h2>Salón de la Fama</h2>
          </div>
          <Link to="/app/contests" className="btn btn-link">Ver concursos</Link>
        </div>

        {officialStatus === 'loading' && <StatusMessage tone="loading">Abriendo el salón...</StatusMessage>}
        {officialStatus === 'error' && <StatusMessage tone="error">{officialError}</StatusMessage>}
        {officialStatus === 'empty' && <StatusMessage tone="empty">Aún no hay leyendas registradas.</StatusMessage>}

        {officialStatus === 'default' && (
          <div className="hall-of-fame-grid">
            {officialEntries.map((entry) => (
              <article className="hall-card" key={`official-${entry.themeId}-${entry.photoId}`}>
                <img src={entry.image} alt={entry.photoTitle} className="hall-img" />
                <div className="hall-overlay">
                  <span className="badge">Winner Original</span>
                  <p>{entry.themeTitle}</p>
                  <h3>{entry.photoTitle}</h3>
                  <div className="hall-footer">
                    <div className="hall-author">
                      <Award size={16} color="#f59e0b" /> {entry.authorDisplayName}
                    </div>
                    <div className="hall-votes">{entry.votes} pts</div>
                  </div>
                  <Link 
                    to={`/photos/${entry.photoId}`} 
                    style={{ position: 'absolute', inset: 0, zIndex: 2 }}
                    aria-label="Ver detalle"
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* --- HISTORY SECTION --- */}
      <section className="winners-section">
        <div className="winners-section-head">
          <div>
            <span style={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <History size={14} /> ARCHIVE
            </span>
            <h2>Concursos Finalizados</h2>
          </div>
        </div>

        {historyStatus === 'loading' && <StatusMessage tone="loading">Cargando registros...</StatusMessage>}
        {historyStatus === 'error' && <StatusMessage tone="error">{historyError}</StatusMessage>}
        {historyStatus === 'empty' && <StatusMessage tone="empty">No hay temas cerrados todavía.</StatusMessage>}

        {historyStatus === 'default' && (
          <div className="active-ranking-grid">
            {closedByTheme.map((group) => (
              <div className="theme-bracket" key={`closed-${group.themeId}`} style={{ opacity: 0.85 }}>
                <div className="theme-bracket-header">
                  <h3>{group.themeTitle}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>FINALIZADO</span>
                    <Link className="btn btn-link" to={`${contestsBasePath}/${group.themeId}`}>Ver concurso</Link>
                  </div>
                </div>

                <div className="ranking-stack">
                  {group.rows.map((entry) => (
                    <div className="rank-item" key={`closed-${entry.themeId}-${entry.photoId}`}>
                      <div className="rank-number" style={{ color: entry.rank === 1 ? '#f59e0b' : '#94a3b8' }}>
                        {entry.rank === 1 ? <Medal size={20} /> : `#${entry.rank}`}
                      </div>
                      <img src={entry.thumb} alt={entry.photoTitle} className="rank-thumb" />
                      <div className="rank-info">
                        <b>{entry.photoTitle}</b>
                        <span>{entry.authorDisplayName}</span>
                      </div>
                      <div className="rank-score">
                        <b>{entry.votes}</b>
                      </div>
                      <Link 
                        className="btn btn-icon btn-sm" 
                        to={`/photos/${entry.photoId}`}
                      >
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- CUSTOM PAGINATION --- */}
        <div className="premium-pagination">
          <button
            className="pg-btn"
            disabled={filters.page <= 1}
            onClick={() => handleFilterChange('page', String(filters.page - 1))}
          >
            Anterior
          </button>
          <span className="pg-info">Ronda {historyMeta.page} / {historyMeta.total_pages}</span>
          <button
            className="pg-btn"
            disabled={historyMeta.total_pages <= historyMeta.page}
            onClick={() => handleFilterChange('page', String(historyMeta.page + 1))}
          >
            Siguiente
          </button>
        </div>
      </section>
    </div>
  );
}
