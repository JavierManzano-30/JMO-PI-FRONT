import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { listWinners } from '../services/winnersService.js';
import { useAuth } from '../hooks/useAuth.js';

const MAX_ROWS = 200;

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return 'Fechas no disponibles';
  const fmt = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' });
  const s = startDate ? fmt.format(new Date(startDate)) : '—';
  const e = endDate ? fmt.format(new Date(endDate)) : '—';
  return `${s} - ${e}`;
}

export function ContestDetail() {
  const { themeId } = useParams();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let ignore = false;

    async function loadContest() {
      setStatus('loading');
      setError('');
      try {
        const response = await listWinners({
          page: 1,
          limit: MAX_ROWS,
          themeId,
          themeState: 'all',
        });

        if (ignore) return;
        const data = response.data || [];
        setRows(data);
        setStatus(data.length ? 'default' : 'empty');
      } catch (err) {
        if (ignore) return;
        setError(err?.message || 'No se pudo cargar el concurso.');
        setStatus('error');
      }
    }

    loadContest();
    return () => {
      ignore = true;
    };
  }, [themeId]);

  const contest = rows[0] || null;
  const backTo = isAuthenticated ? '/app/contests' : '/contests';

  const subtitle = useMemo(() => {
    if (!contest) return '';
    return `${contest.communityName || 'Comunidad'} · ${formatDateRange(contest.themeStartDate, contest.themeEndDate)}`;
  }, [contest]);

  const isWide = (index) => index % 5 === 0;

  return (
    <section className="winners-page" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to={backTo} className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> Volver a concursos
        </Link>
      </div>

      {status === 'loading' && <p className="status loading">Cargando concurso...</p>}
      {status === 'error' && <p className="status error">{error}</p>}
      {status === 'empty' && <p className="status empty">No hay publicaciones en este concurso.</p>}

      {status === 'default' && contest && (
        <>
          <header className="winners-hero" style={{ marginBottom: '1.25rem' }}>
            <div className="winners-hero-content">
              <span className="eyebrow">CONCURSO</span>
              <h1>{contest.themeTitle}</h1>
              <p>{subtitle}</p>
              <div style={{ marginTop: '0.5rem', fontWeight: 700, color: contest.themeIsActive ? '#ef4444' : '#64748b' }}>
                {contest.themeIsActive ? 'Activo' : 'Finalizado'}
              </div>
            </div>
          </header>

          <div className="theme-bracket" style={{ marginBottom: '2rem' }}>
            <div className="theme-bracket-header">
              <h3>Todas las publicaciones ({rows.length})</h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Orden por clasificación</span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gridAutoRows: '360px',
                gridAutoFlow: 'dense',
                gap: '1rem',
              }}
            >
              {rows.map((entry, index) => (
                <Link
                  key={`${entry.themeId}-${entry.photoId}`}
                  to={isAuthenticated ? `/app/photos/${entry.photoId}` : `/photos/${entry.photoId}`}
                  style={{
                    position: 'relative',
                    display: 'block',
                    overflow: 'hidden',
                    borderRadius: '1.25rem',
                    textDecoration: 'none',
                    color: '#fff',
                    gridColumn: isWide(index) ? 'span 2' : 'span 1',
                    boxShadow: entry.rank === 1 ? '0 20px 45px -20px rgba(245, 158, 11, 0.55)' : '0 16px 34px -22px rgba(15, 23, 42, 0.55)',
                  }}
                >
                  <img
                    src={entry.image || entry.thumb}
                    alt={entry.photoTitle || 'Foto del concurso'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />

                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(to top, rgba(15, 23, 42, 0.88) 0%, rgba(15, 23, 42, 0.18) 52%, rgba(15, 23, 42, 0) 100%)',
                    }}
                  />

                  <div
                    style={{
                      position: 'absolute',
                      top: '0.8rem',
                      left: '0.8rem',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '999px',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      background: entry.rank === 1 ? 'rgba(245, 158, 11, 0.95)' : 'rgba(30, 64, 175, 0.9)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    {entry.rank === 1 && <Trophy size={14} />}
                    #{entry.rank}
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      right: '0.8rem',
                      top: '0.8rem',
                      padding: '0.35rem 0.6rem',
                      borderRadius: '0.7rem',
                      background: 'rgba(15, 23, 42, 0.66)',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                    }}
                  >
                    {entry.votes} votos
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      left: '0.9rem',
                      right: '0.9rem',
                      bottom: '0.9rem',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        lineHeight: 1.2,
                        textShadow: '0 3px 18px rgba(15,23,42,0.65)',
                      }}
                    >
                      {entry.photoTitle || 'Sin título'}
                    </p>
                    <p
                      style={{
                        margin: '0.25rem 0 0',
                        opacity: 0.92,
                        fontSize: '0.9rem',
                        textShadow: '0 2px 14px rgba(15,23,42,0.6)',
                      }}
                    >
                      {entry.authorDisplayName || 'Autor'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
