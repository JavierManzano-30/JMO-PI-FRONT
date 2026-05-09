import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Trophy,
  Award,
  Crown,
  Flame,
  ArrowRight,
  History,
  Users,
  Camera,
  CalendarDays,
  MapPin,
  Vote,
  Clock3,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { StatusMessage } from '../components/ui/StatusMessage.jsx';
import { ApiError } from '../lib/apiClient.js';
import { getRealtimeSocket, registerRealtimeHandlers, subscribeRealtimeRooms } from '../lib/realtime.js';
import { listCommunities } from '../services/communitiesService.js';
import { listWinners } from '../services/winnersService.js';

const HISTORY_PAGE_SIZE = 12; // Adjusted for the new layout
const ACTIVE_RANK_LIMIT = 5;
const ACTIVE_FETCH_LIMIT = 60;
const OFFICIAL_FETCH_LIMIT = 24;

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
});

function formatDate(value) {
  if (!value) return 'Fecha por confirmar';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha por confirmar';
  return dateFormatter.format(date);
}

function formatDateRange(startDate, endDate) {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function getTotalVotes(entries) {
  return entries.reduce((total, entry) => total + Number(entry.votes || 0), 0);
}

function getFeaturedEntry(group) {
  return group.rows.find((entry) => entry.rank === 1) || group.rows[0] || null;
}

function getThemeDateRange(group) {
  const featuredEntry = getFeaturedEntry(group);
  return formatDateRange(featuredEntry?.themeStartDate, featuredEntry?.themeEndDate);
}

function ContestStatusBadge({ active }) {
  return (
    <span className={`contest-status ${active ? 'is-live' : 'is-closed'}`}>
      {active ? <Flame size={14} /> : <History size={14} />}
      {active ? 'En votación' : 'Finalizado'}
    </span>
  );
}

function ContestMeta({ icon, label }) {
  return (
    <span className="contest-meta-item">
      {icon}
      {label}
    </span>
  );
}

function ContestCard({ group, isActive, contestsBasePath, isAuthenticated }) {
  const featuredEntry = getFeaturedEntry(group);
  const totalVotes = getTotalVotes(group.rows);
  const detailPath = `${contestsBasePath}/${group.themeId}`;
  const photoPathPrefix = isAuthenticated ? '../photos' : '/photos';
  const primaryCtaPath = isActive
    ? (isAuthenticated ? '/app/photos/upload' : '/login')
    : detailPath;
  const primaryCtaLabel = isActive ? 'Participar' : 'Ver resultados';

  return (
    <article className={`contest-card ${isActive ? 'contest-card-active' : 'contest-card-closed'}`}>
      <div className="contest-card-media">
        {featuredEntry?.image ? (
          <img src={featuredEntry.image} alt={featuredEntry.photoTitle || group.themeTitle} />
        ) : (
          <div className="contest-card-placeholder">
            <Camera size={28} />
          </div>
        )}
        <ContestStatusBadge active={isActive} />
      </div>

      <div className="contest-card-body">
        <div className="contest-card-heading">
          <div>
            <p className="contest-overline">{group.communityName || 'Comunidad general'}</p>
            <h3>{group.themeTitle}</h3>
          </div>
          <div className="contest-score">
            <strong>{totalVotes}</strong>
            <span>votos</span>
          </div>
        </div>

        <p className="contest-description">
          {isActive
            ? `Ranking provisional con ${group.rows.length} fotos destacadas. La clasificación se actualiza en tiempo real.`
            : `Top ${group.rows.length} del concurso cerrado con resultados ordenados por votos.`}
        </p>

        <div className="contest-meta">
          <ContestMeta icon={<CalendarDays size={15} />} label={getThemeDateRange(group)} />
          <ContestMeta icon={<Users size={15} />} label={`${group.rows.length} participantes visibles`} />
          <ContestMeta icon={<MapPin size={15} />} label={group.communityName || 'Todas las regiones'} />
        </div>

        <div className="contest-ranking-preview" aria-label={`Clasificación de ${group.themeTitle}`}>
          {group.rows.slice(0, 3).map((entry) => (
            <Link
              className="contest-ranking-row"
              key={`${group.themeId}-${entry.photoId}`}
              to={`${photoPathPrefix}/${entry.photoId}`}
              state={{ from: detailPath, fromLabel: 'Volver al concurso' }}
              aria-label={`Ver publicación ${entry.photoTitle}`}
            >
              <span className="contest-ranking-position">
                {entry.rank === 1 ? <Crown size={16} /> : `#${entry.rank}`}
              </span>
              {entry.thumb ? (
                <img src={entry.thumb} alt={entry.photoTitle} />
              ) : (
                <span className="contest-ranking-thumb-placeholder">
                  <Camera size={16} />
                </span>
              )}
              <span className="contest-ranking-title">{entry.photoTitle}</span>
              <strong>{entry.votes}</strong>
            </Link>
          ))}
        </div>

        <div className="contest-card-actions">
          <Link className="contest-primary-action" to={primaryCtaPath}>
            {primaryCtaLabel}
            <ArrowRight size={16} />
          </Link>
          {isActive && (
            <Link className="contest-secondary-action" to={detailPath}>
              Votar
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

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
  const featuredActive = activeByTheme[0] || null;
  const activeVotes = useMemo(() => getTotalVotes(activeEntries), [activeEntries]);
  const officialVotes = useMemo(() => getTotalVotes(officialEntries), [officialEntries]);

  const handleFilterChange = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.set('page', '1');
    setParams(next);
  };

  return (
    <div className="winners-page">
      <header className="winners-hero">
        <div className="winners-hero-content">
          <span className="eyebrow">
            <Trophy size={16} />
            SnapNation Concursos
          </span>
          <h1>Retos fotográficos, votaciones y ganadores en directo</h1>
          <p>
            Explora los concursos activos, participa en los retos de la comunidad y consulta
            resultados oficiales con una clasificación clara por temática.
          </p>
          <div className="winners-hero-actions">
            <Link className="contest-primary-action" to={isAuthenticated ? '/app/photos/upload' : '/login'}>
              Participar ahora
              <ArrowRight size={16} />
            </Link>
            <Link className="contest-secondary-action on-hero" to={featuredActive ? `${contestsBasePath}/${featuredActive.themeId}` : contestsBasePath}>
              Ver ranking activo
            </Link>
          </div>
        </div>

        <aside className="winners-hero-panel" aria-label="Resumen de concursos">
          <div className="hero-stat">
            <span><Flame size={16} /> Activos</span>
            <strong>{activeByTheme.length}</strong>
          </div>
          <div className="hero-stat">
            <span><Vote size={16} /> Votos visibles</span>
            <strong>{activeVotes}</strong>
          </div>
          <div className="hero-stat">
            <span><Award size={16} /> Ganadores</span>
            <strong>{officialEntries.length}</strong>
          </div>
        </aside>
      </header>

      <section className="winners-toolbar" aria-label="Filtros de concursos">
        <div>
          <p className="toolbar-kicker">Filtro de comunidad</p>
          <h2>Encuentra concursos por mundo o región</h2>
        </div>
        <label className="contest-filter" htmlFor="winnerCommunity">
          <span>
            <Users size={18} />
            Comunidad
          </span>
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
        </label>
      </section>

      <section className="winners-section">
        <div className="winners-section-head">
          <div>
            <span className="section-kicker section-kicker-live">
              <Flame size={14} /> CONCURSOS ACTIVOS
            </span>
            <h2>Ahora en votación</h2>
          </div>
          <p className="section-subtitle">Clasificación provisional en tiempo real</p>
        </div>

        {activeStatus === 'loading' && <StatusMessage tone="loading">Sincronizando rankings...</StatusMessage>}
        {activeStatus === 'error' && <StatusMessage tone="error">{activeError}</StatusMessage>}
        {activeStatus === 'empty' && (
          <div className="contest-empty-state">
            <Clock3 size={28} />
            <h3>No hay concursos activos ahora mismo</h3>
            <p>Cuando se abra una nueva ronda aparecerá aquí con su ranking y acceso directo para participar.</p>
          </div>
        )}

        {activeStatus === 'default' && (
          <div className="contest-grid contest-grid-featured">
            {activeByTheme.map((group) => (
              <ContestCard
                key={`active-${group.themeId}`}
                group={group}
                isActive
                contestsBasePath={contestsBasePath}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        )}
      </section>

      <section className="winners-section">
        <div className="winners-section-head">
          <div>
            <span className="section-kicker section-kicker-gold">
              <Trophy size={14} /> SALÓN DE LA FAMA
            </span>
            <h2>Ganadores oficiales</h2>
          </div>
          <p className="section-subtitle">{officialVotes} votos acumulados en concursos cerrados</p>
        </div>

        {officialStatus === 'loading' && <StatusMessage tone="loading">Abriendo el salón...</StatusMessage>}
        {officialStatus === 'error' && <StatusMessage tone="error">{officialError}</StatusMessage>}
        {officialStatus === 'empty' && (
          <div className="contest-empty-state compact">
            <Award size={26} />
            <h3>Aún no hay ganadores oficiales</h3>
            <p>Los ganadores aparecerán cuando se cierre el primer concurso con resultados.</p>
          </div>
        )}

        {officialStatus === 'default' && (
          <div className="hall-of-fame-grid">
            {officialEntries.map((entry) => (
              <article className="hall-card" key={`official-${entry.themeId}-${entry.photoId}`}>
                <img src={entry.image} alt={entry.photoTitle} className="hall-img" />
                <div className="hall-overlay">
                  <span className="badge">Ganador</span>
                  <p>{entry.themeTitle}</p>
                  <h3>{entry.photoTitle}</h3>
                  <div className="hall-footer">
                    <div className="hall-author">
                      <Award size={16} color="#f59e0b" /> {entry.authorDisplayName}
                    </div>
                    <div className="hall-votes">{entry.votes} pts</div>
                  </div>
                  <Link 
                    to={`${isAuthenticated ? '../photos' : '/photos'}/${entry.photoId}`} 
                    state={{ from: `${contestsBasePath}/${entry.themeId}`, fromLabel: 'Volver al concurso' }}
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
            <span className="section-kicker section-kicker-muted">
              <History size={14} /> ARCHIVO
            </span>
            <h2>Concursos Finalizados</h2>
          </div>
        </div>

        {historyStatus === 'loading' && <StatusMessage tone="loading">Cargando registros...</StatusMessage>}
        {historyStatus === 'error' && <StatusMessage tone="error">{historyError}</StatusMessage>}
        {historyStatus === 'empty' && (
          <div className="contest-empty-state compact">
            <History size={26} />
            <h3>No hay concursos finalizados</h3>
            <p>El archivo se completará automáticamente cuando existan rondas cerradas.</p>
          </div>
        )}

        {historyStatus === 'default' && (
          <div className="contest-grid">
            {closedByTheme.map((group) => (
              <ContestCard
                key={`closed-${group.themeId}`}
                group={group}
                isActive={false}
                contestsBasePath={contestsBasePath}
                isAuthenticated={isAuthenticated}
              />
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
