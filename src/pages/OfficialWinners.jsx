import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Award, History, Trophy } from 'lucide-react';
import { StatusMessage } from '../components/ui/StatusMessage.jsx';
import { ApiError } from '../lib/apiClient.js';
import { useAuth } from '../hooks/useAuth.js';
import { listWinners } from '../services/winnersService.js';

const WINNERS_PAGE_SIZE = 12;

function getTotalVotes(entries) {
  return entries.reduce((total, entry) => total + Number(entry.votes || 0), 0);
}

function WinnerCard({ entry, isAuthenticated, contestsBasePath }) {
  return (
    <article className="hall-card" key={`winner-${entry.themeId}-${entry.photoId}`}>
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
          aria-label={`Ver foto ganadora ${entry.photoTitle}`}
        />
      </div>
    </article>
  );
}

export function OfficialWinners() {
  const { isAuthenticated } = useAuth();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [entries, setEntries] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total_pages: 0, total: 0 });

  const page = useMemo(() => Number(params.get('page') || '1'), [params]);
  const contestsBasePath = isAuthenticated ? '/app/contests' : '/contests';
  const backPath = contestsBasePath;
  const totalVotes = useMemo(() => getTotalVotes(entries), [entries]);

  const loadWinners = useCallback(async () => {
    setStatus('loading');
    setError('');

    try {
      const response = await listWinners({
        page,
        limit: WINNERS_PAGE_SIZE,
        themeState: 'closed',
        rankLimit: 1,
      });

      const rows = response.data || [];
      setEntries(rows);
      setMeta(response.meta || { page: 1, total_pages: 0, total: rows.length });
      setStatus(rows.length ? 'default' : 'empty');
    } catch (requestError) {
      setStatus('error');
      setError(requestError instanceof ApiError ? requestError.message : 'No se pudieron cargar los ganadores.');
    }
  }, [page]);

  useEffect(() => {
    loadWinners();
  }, [loadWinners]);

  const handlePageChange = (nextPage) => {
    const next = new URLSearchParams(params);
    next.set('page', String(nextPage));
    setParams(next);
  };

  return (
    <div className="winners-page">
      <div className="contest-detail-back-row">
        <Link to={backPath} className="back-link">
          <ArrowLeft size={18} /> Volver a concursos
        </Link>
      </div>

      <header className="winners-hero winners-hero-compact">
        <div className="winners-hero-content">
          <span className="eyebrow">
            <Trophy size={16} />
            Salón de la fama
          </span>
          <h1>Todos los ganadores oficiales</h1>
          <p>Consulta las fotos vencedoras de los últimos concursos cerrados.</p>
        </div>

        <aside className="winners-hero-panel" aria-label="Resumen de ganadores">
          <div className="hero-stat">
            <span><Award size={16} /> Ganadores</span>
            <strong>{meta.total || entries.length}</strong>
          </div>
          <div className="hero-stat">
            <span><History size={16} /> Página</span>
            <strong>{meta.page || page}</strong>
          </div>
          <div className="hero-stat">
            <span><Trophy size={16} /> Votos en página</span>
            <strong>{totalVotes}</strong>
          </div>
        </aside>
      </header>

      <section className="winners-section">
        {status === 'loading' && <StatusMessage tone="loading">Cargando ganadores...</StatusMessage>}
        {status === 'error' && <StatusMessage tone="error">{error}</StatusMessage>}
        {status === 'empty' && (
          <div className="contest-empty-state compact">
            <Award size={26} />
            <h3>Aún no hay ganadores oficiales</h3>
            <p>Los ganadores aparecerán cuando se cierre el primer concurso con resultados.</p>
          </div>
        )}

        {status === 'default' && (
          <div className="hall-of-fame-grid">
            {entries.map((entry) => (
              <WinnerCard
                key={`${entry.themeId}-${entry.photoId}`}
                entry={entry}
                isAuthenticated={isAuthenticated}
                contestsBasePath={contestsBasePath}
              />
            ))}
          </div>
        )}

        <div className="premium-pagination">
          <button
            className="pg-btn"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Anterior
          </button>
          <span className="pg-info">Página {meta.page || page} / {meta.total_pages || 0}</span>
          <button
            className="pg-btn"
            disabled={(meta.total_pages || 0) <= page}
            onClick={() => handlePageChange(page + 1)}
          >
            Siguiente
          </button>
        </div>
      </section>
    </div>
  );
}
