import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  getContests, 
  getCategories, 
  getSubmissions,
  getFollowing
} from '../services/supabaseService';
import { 
  Heart,
  ArrowUp,
  MessageSquare,
  Search,
  Compass,
  MessageCircle
} from 'lucide-react';

const tokens = {
  colors: {
    bg: '#f3f4f6',
    white: '#ffffff',
    text: '#111827',
    textMuted: '#6b7280',
    accent: '#2563eb',
    accentHover: '#1d4ed8',
    border: '#e5e7eb',
  },
  shadows: {
    sm: '0 4px 20px rgba(0,0,0,0.05)',
    lg: '0 12px 30px rgba(0,0,0,0.1)',
  }
};

const s = {
  page: {
    minHeight: '100vh',
    background: tokens.colors.bg,
    fontFamily: "'Inter', sans-serif",
    color: tokens.colors.text,
  },
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(12px)',
    borderBottom: `1px solid ${tokens.colors.border}`,
    padding: '1rem 2rem',
  },
  navContent: {
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 900,
    background: 'linear-gradient(to right, #2563eb, #4f46e5)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.05em',
    textDecoration: 'none',
  },
  gallery: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gridAutoRows: '480px',
    gridAutoFlow: 'dense',
    gap: '1.5rem',
    padding: '2rem',
    maxWidth: '1280px',
    margin: '0 auto',
  },
  postCard: {
    background: tokens.colors.white,
    borderRadius: '24px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: tokens.shadows.sm,
    transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
    textDecoration: 'none',
    color: 'inherit',
  },
  imageWrapper: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.6s ease',
  },
  footer: {
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: tokens.colors.white,
    borderTop: `1px solid #f9fafb`,
  },
  author: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    overflow: 'hidden',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #eff6ff',
    flexShrink: 0,
    background: tokens.colors.accent,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    fontWeight: 800,
  },
  actionBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    color: tokens.colors.textMuted,
    cursor: 'pointer',
  },
};

export function Dashboard() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);
  const [feedMode, setFeedMode] = useState(() => (params.get('feed') === 'following' ? 'following' : 'all'));
  const rawBackendUserId = user?.backendId ?? user?.id;
  const backendUserId = typeof rawBackendUserId === 'number'
    ? (Number.isInteger(rawBackendUserId) && rawBackendUserId > 0 ? rawBackendUserId : null)
    : (typeof rawBackendUserId === 'string' && /^\d+$/.test(rawBackendUserId) ? Number(rawBackendUserId) : null);
  const canWriteData = Number.isInteger(backendUserId) && backendUserId > 0;

  const handleRequireLogin = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setToastMsg('Debes iniciar sesión para interactuar.');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const activeFilters = {
    contestId: params.get('contest') || '',
    categoryId: params.get('category') || '',
  };

  const updateFeedMode = (nextMode) => {
    const normalized = nextMode === 'following' ? 'following' : 'all';
    if (normalized === 'following' && !user) {
      setToastMsg('Inicia sesión para ver las fotos de usuarios seguidos.');
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }

    setFeedMode(normalized);
    const nextParams = new URLSearchParams(params);
    if (normalized === 'following') nextParams.set('feed', 'following');
    else nextParams.delete('feed');
    setParams(nextParams, { replace: true });
  };

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSubmissions(activeFilters, backendUserId);
      let nextSubmissions = data || [];

      if (feedMode === 'following' && backendUserId) {
        const following = await getFollowing(backendUserId, { limit: 250 });
        const followingIds = new Set((following || []).map((profile) => profile.id).filter(Boolean));
        nextSubmissions = nextSubmissions.filter((item) => followingIds.has(item.user_id));
      }

      setSubmissions(nextSubmissions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [backendUserId, feedMode, params]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleToggleVote = async (e, photoId, hasVoted) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate('/login');
    if (!canWriteData) {
      setToastMsg('Tu cuenta actual no está enlazada para votar en esta base de datos.');
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }
    const target = submissions.find((s) => s.id === photoId);
    const contestClosed = target?.contests?.is_active === false;
    if (contestClosed) {
      setToastMsg('Este torneo ya ha finalizado. No se pueden cambiar votos.');
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }

    try {
      if (hasVoted) {
        await supabase.from('votes').delete().eq('photo_id', photoId).eq('user_id', backendUserId);
      } else {
        await supabase.from('votes').insert([{ photo_id: photoId, user_id: backendUserId }]);
      }
      
      setSubmissions(prev => prev.map(s => {
        if (s.id === photoId) {
          return {
            ...s,
            hasVoted: !hasVoted,
            voteCount: hasVoted ? s.voteCount - 1 : s.voteCount + 1
          };
        }
        return s;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const getAuthorName = (item) => {
    if (!item?.profiles) return 'Participante';
    return item.profiles.username || item.profiles.full_name || 'Participante';
  };

  const getOptimizedUrl = (url) => {
    if (!url) return '';
    // Transformaciones ultra rápidas para Cloudinary (baja calidad, autoformato, ancho max 800px)
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
      if (!url.includes('/upload/c_')) {
        return url.replace('/upload/', '/upload/c_scale,w_800,q_auto,f_auto/');
      }
    }
    // Optimización para Unsplash
    if (url.includes('unsplash.com') && !url.includes('w=')) {
      return url + (url.includes('?') ? '&' : '?') + 'auto=format&fit=crop&q=75&w=800';
    }
    return url;
  };

  const getOptimizedAvatar = (url) => {
    if (!url) return '';
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
      if (!url.includes('/upload/c_')) {
        return url.replace('/upload/', '/upload/c_fill,w_100,h_100,g_face,q_auto,f_auto/');
      }
    }
    if (url.includes('unsplash.com') && !url.includes('w=')) {
      return url + (url.includes('?') ? '&' : '?') + 'auto=format&fit=crop&q=80&w=100&h=100';
    }
    return url;
  };

  // Determinar si una tarjeta debe ser ancha (landscape)
  const isHorizontal = (index) => index % 5 === 0; 

  return (
    <div style={s.page}>
      <style>{`
        .action-icon { transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1); }
        .action-icon:hover { transform: scale(1.1); }
        .action-icon:active { transform: scale(0.9); }
        .action-icon:hover { background: #f1f5f9; color: #111827; }
        .heart-btn:hover { background: #fee2e2 !important; color: #ef4444 !important; }
        .comment-btn:hover { background: #dcfce7 !important; color: #059669 !important; }
        .vote-active { color: ${tokens.colors.accent} !important; background: #dbeafe !important; }
        .heart-active { color: #ef4444 !important; background: #fee2e2 !important; }
      `}</style>

      <div
        style={{
          maxWidth: '1280px',
          margin: '1rem auto 0',
          padding: '0 2rem',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 'fit-content',
            zIndex: 50,
            background: 'rgba(255,255,255,0.94)',
            backdropFilter: 'blur(12px)',
            border: '1px solid #dbe4f0',
            borderRadius: '999px',
            padding: '0.35rem',
            display: 'flex',
            gap: '0.35rem',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
          }}
        >
          <button
            type="button"
            onClick={() => updateFeedMode('following')}
            style={{
              border: 'none',
              borderRadius: '999px',
              padding: '0.55rem 1rem',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              background: feedMode === 'following' ? '#2563eb' : 'transparent',
              color: feedMode === 'following' ? '#fff' : '#334155',
            }}
          >
            Seguidos
          </button>
          <button
            type="button"
            onClick={() => updateFeedMode('all')}
            style={{
              border: 'none',
              borderRadius: '999px',
              padding: '0.55rem 1rem',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              background: feedMode === 'all' ? '#2563eb' : 'transparent',
              color: feedMode === 'all' ? '#fff' : '#334155',
            }}
          >
            Todos
          </button>
        </div>
      </div>

      <main style={{ ...s.gallery, paddingTop: '1.25rem' }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '10rem', color: tokens.colors.textMuted, fontWeight: 600 }}>Cargando Feed...</div>
        ) : submissions.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '10rem' }}>
            <p style={{ color: tokens.colors.textMuted }}>No hay publicaciones todavía.</p>
          </div>
        ) : (
          submissions.map((item, index) => (
            <Link 
              to={`/app/photos/${item.id}`} 
              key={item.id} 
              style={{ ...s.postCard, gridColumn: isHorizontal(index) ? 'span 2' : 'span 1' }} 
              className="vibe-card"
            >
              <div style={s.imageWrapper}>
                <img src={getOptimizedUrl(item.image_url)} style={s.image} alt={item.title} loading="lazy" decoding="async" />
              </div>

              <div style={s.footer}>
                <div style={s.author}>
                  {item.profiles?.avatar_url ? (
                    <img src={getOptimizedAvatar(item.profiles.avatar_url)} style={s.avatar} alt="avatar" loading="lazy" decoding="async" />
                  ) : (
                    <div style={s.avatar}>{getAuthorName(item).charAt(0).toUpperCase()}</div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const profilePath = user ? `/app/users/${item.user_id}` : `/users/${item.user_id}`;
                      navigate(profilePath);
                    }}
                    style={{ overflow: 'hidden', border: 'none', background: 'transparent', padding: 0, textAlign: 'left', cursor: 'pointer' }}
                  >
                    <p style={{ fontSize: '0.875rem', fontWeight: 800, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      @{getAuthorName(item)}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: tokens.colors.textMuted, margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </p>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px', fontSize: '0.65rem', fontWeight: 600, color: tokens.colors.accent, textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                      <span>{item.contests?.title || 'Gral.'}</span>
                      <span style={{ opacity: 0.3 }}>•</span>
                      <span style={{ color: tokens.colors.textMuted }}>{item.categories?.name || 'Sin Cat.'}</span>
                    </div>
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* Botón Comentarios */}
                  <div style={{ position: 'relative' }}>
                    <button 
                      onClick={(e) => {
                        if (!user) {
                          handleRequireLogin(e);
                        } else {
                          // El Link envolvente ya maneja la navegación,
                          // pero si necesitas lógica adicional, aquí va.
                        }
                      }}
                      style={{ 
                        ...s.actionBtn, 
                        opacity: user ? 1 : 0.4, 
                        filter: user ? 'none' : 'grayscale(1)',
                        cursor: 'pointer'
                      }} 
                      className="action-icon comment-btn"
                    >
                      <MessageSquare size={20} />
                    </button>
                    {!user && <div style={{ position: 'absolute', top: '50%', left: '15%', right: '15%', height: '2px', background: '#94a3b8', transform: 'rotate(-45deg)', pointerEvents: 'none' }} />}
                  </div>

                  {/* Botón Like */}
                  <div style={{ position: 'relative' }}>
                    {(() => {
                      const contestClosed = item?.contests?.is_active === false;
                      return (
                    <button 
                      onClick={(e) => {
                        if (!user) {
                          handleRequireLogin(e);
                        } else if (contestClosed) {
                          e.preventDefault();
                          e.stopPropagation();
                          setToastMsg('Este torneo ya ha finalizado. No se pueden cambiar votos.');
                          setTimeout(() => setToastMsg(null), 3000);
                        } else {
                          handleToggleVote(e, item.id, item.hasVoted);
                        }
                      }}
                      disabled={contestClosed}
                      style={{ 
                        ...s.actionBtn, 
                        opacity: (!user || contestClosed) ? 0.4 : 1, 
                        filter: (!user || contestClosed) ? 'grayscale(1)' : 'none',
                        cursor: contestClosed ? 'not-allowed' : 'pointer'
                      }} 
                      className={`action-icon heart-btn ${(user && item.hasVoted) ? 'heart-active' : ''}`}
                    >
                      <Heart size={20} fill={(user && item.hasVoted) ? 'currentColor' : 'none'} />
                    </button>
                      );
                    })()}
                    {!user && <div style={{ position: 'absolute', top: '50%', left: '15%', right: '15%', height: '2px', background: '#94a3b8', transform: 'rotate(-45deg)', pointerEvents: 'none' }} />}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </main>

      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(15, 23, 42, 0.95)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          zIndex: 9999,
          backdropFilter: 'blur(8px)',
          animation: 'toastIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>🔐</span> {toastMsg}
        </div>
      )}

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translate(-50%, 20px) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
      `}</style>
    </div>
  );
}
