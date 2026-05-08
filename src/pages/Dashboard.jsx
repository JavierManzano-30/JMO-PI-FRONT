import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { createVote, deleteVote } from '../services/votesService.js';
import { 
  getContests, 
  getCategories, 
  getSubmissions,
  getFollowing,
  getChatContacts,
  searchUsers,
  sendDirectMessage,
} from '../services/supabaseService';
import { 
  Heart,
  ArrowUp,
  MessageSquare,
  Send,
  X,
  Search,
  Compass,
  MessageCircle
} from 'lucide-react';

const tokens = {
  colors: {
    bg: 'var(--bg-page)',
    white: 'var(--surface)',
    text: 'var(--text)',
    textMuted: 'var(--muted)',
    accent: 'var(--primary)',
    accentHover: 'var(--primary-hover)',
    border: 'var(--border)',
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
    background: 'var(--header-surface)',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
    gridAutoRows: '480px',
    gridAutoFlow: 'dense',
    gap: '1.5rem',
    padding: '2rem',
    width: '100%',
    maxWidth: 'none',
    margin: 0,
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
    borderTop: `1px solid ${tokens.colors.border}`,
  },
  author: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    overflow: 'hidden',
    flex: 1,
    minWidth: 0,
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

const preloadedFullImages = new Set();
let detailRoutePrefetched = false;

function preloadFullImage(url) {
  if (!url || preloadedFullImages.has(url)) return;
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  preloadedFullImages.add(url);
}

export function Dashboard() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);
  const [feedMode, setFeedMode] = useState(() => (params.get('feed') === 'following' ? 'following' : 'all'));
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [shareSubmission, setShareSubmission] = useState(null);
  const [shareContacts, setShareContacts] = useState([]);
  const [shareSearch, setShareSearch] = useState('');
  const [shareResults, setShareResults] = useState([]);
  const [sendingToUserId, setSendingToUserId] = useState(null);
  const [shareAnchorRect, setShareAnchorRect] = useState(null);
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'light');
  const isDark = theme === 'dark';
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

  useEffect(() => {
    const onThemeChange = (event) => {
      const next = event?.detail || document.documentElement.getAttribute('data-theme') || 'light';
      setTheme(next);
    };
    window.addEventListener('snapnation:theme-change', onThemeChange);
    return () => window.removeEventListener('snapnation:theme-change', onThemeChange);
  }, []);

  const getProfileName = (profile) => {
    if (!profile) return 'Participante';
    return profile.username || profile.display_name || `usuario_${profile.id}`;
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

  useEffect(() => {
    if (detailRoutePrefetched) return;
    detailRoutePrefetched = true;
    import('./PhotoDetail.jsx').catch(() => {});
  }, []);

  useEffect(() => {
    if (!Array.isArray(submissions) || submissions.length === 0) return;
    submissions.slice(0, 16).forEach((item) => preloadFullImage(item?.image_url));
  }, [submissions]);

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
        await deleteVote(photoId);
      } else {
        await createVote(photoId);
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

  const goToAuthorProfile = (event, userId) => {
    event.preventDefault();
    event.stopPropagation();
    const profilePath = user ? `/app/users/${userId}` : `/users/${userId}`;
    navigate(profilePath);
  };

  const handleShareToChat = async (event, submission) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      setToastMsg('Debes iniciar sesión para compartir en el chat.');
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }
    if (!canWriteData) {
      setToastMsg('Tu cuenta actual no está enlazada para usar el chat.');
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }
    if (!submission?.id) return;

    if (event?.currentTarget?.getBoundingClientRect) {
      const rect = event.currentTarget.getBoundingClientRect();
      setShareAnchorRect({
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      });
    } else {
      setShareAnchorRect(null);
    }
    setShareSubmission(submission);
    setShareSheetOpen(true);
    setShareSearch('');
    setShareResults([]);

    try {
      const contacts = await getChatContacts(backendUserId);
      setShareContacts(contacts || []);
    } catch (error) {
      console.error('No se pudieron cargar contactos para compartir:', error);
      setShareContacts([]);
    }
  };

  useEffect(() => {
    if (!shareSheetOpen || !backendUserId) return;
    const normalized = shareSearch.trim();
    if (normalized.length < 2) {
      setShareResults([]);
      return;
    }

    let cancelled = false;
    async function runSearch() {
      try {
        const results = await searchUsers(normalized, { excludeUserId: backendUserId, limit: 12 });
        if (!cancelled) setShareResults(results || []);
      } catch (error) {
        console.error('No se pudo buscar usuarios para compartir:', error);
        if (!cancelled) setShareResults([]);
      }
    }

    runSearch();
    return () => {
      cancelled = true;
    };
  }, [shareSheetOpen, shareSearch, backendUserId]);

  const closeShareSheet = () => {
    setShareSheetOpen(false);
    setShareSubmission(null);
    setShareSearch('');
    setShareResults([]);
    setSendingToUserId(null);
    setShareAnchorRect(null);
  };

  const handleSendSharedPost = async (targetUser) => {
    if (!targetUser?.id || !shareSubmission?.id || !backendUserId || sendingToUserId) return;
    const sharedLink = `${window.location.origin}/photos/${shareSubmission.id}`;
    const message = `📸 ${shareSubmission.title || 'Mira esta publicación'}\n${sharedLink}`;
    setSendingToUserId(targetUser.id);
    try {
      await sendDirectMessage(backendUserId, targetUser.id, message);
      setToastMsg(`Publicación enviada a @${getProfileName(targetUser)}`);
      setTimeout(() => setToastMsg(null), 2500);
      closeShareSheet();
    } catch (error) {
      console.error('No se pudo compartir en chat:', error);
      setToastMsg('No se pudo compartir la publicación.');
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setSendingToUserId(null);
    }
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

  const warmPhotoDetail = (item) => {
    if (!item) return;
    preloadFullImage(item.image_url);
    if (!detailRoutePrefetched) {
      detailRoutePrefetched = true;
      import('./PhotoDetail.jsx').catch(() => {});
    }
  };

  return (
    <div style={s.page}>
      <style>{`
        .action-icon { transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1); }
        .action-icon:hover { transform: scale(1.1); }
        .action-icon:active { transform: scale(0.9); }
        .action-icon:hover { background: #f1f5f9; color: #111827; }
        .heart-btn:hover { background: #fee2e2 !important; color: #ef4444 !important; }
        .comment-btn:hover { background: #dcfce7 !important; color: #059669 !important; }
        .share-btn:hover { background: #dbeafe !important; color: #2563eb !important; }
        .vote-active { color: ${tokens.colors.accent} !important; background: #dbeafe !important; }
        .heart-active { color: #ef4444 !important; background: #fee2e2 !important; }
        @media (max-width: 1100px) {
          .gallery-feed {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            grid-auto-rows: 420px !important;
            gap: 1rem !important;
            padding: 1.2rem !important;
          }
          .gallery-feed .vibe-card {
            grid-column: span 1 !important;
          }
        }
        @media (max-width: 760px) {
          .gallery-feed-toggle-wrap {
            padding: 0 1rem !important;
            margin-top: 0.8rem !important;
          }
          .gallery-feed {
            grid-template-columns: 1fr !important;
            grid-auto-rows: 360px !important;
            gap: 0.9rem !important;
            padding: 1rem !important;
          }
          .gallery-feed .vibe-card {
            border-radius: 18px !important;
            grid-column: span 1 !important;
          }
        }
      `}</style>

      <div
        className="gallery-feed-toggle-wrap"
        style={{
          width: '100%',
          maxWidth: 'none',
          margin: 0,
          padding: '0.75rem 2rem 0',
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

      <main className="gallery-feed" style={{ ...s.gallery, paddingTop: '0.75rem', margin: 0 }}>
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
              onMouseEnter={() => warmPhotoDetail(item)}
              onFocus={() => warmPhotoDetail(item)}
              onTouchStart={() => warmPhotoDetail(item)}
            >
              <div style={s.imageWrapper}>
                <img src={getOptimizedUrl(item.image_url)} style={s.image} alt={item.title} loading="lazy" decoding="async" />
              </div>

              <div style={s.footer}>
                <div style={s.author}>
                  <button
                    type="button"
                    onClick={(e) => goToAuthorProfile(e, item.user_id)}
                    style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', flexShrink: 0 }}
                    aria-label={`Ver perfil de @${getAuthorName(item)}`}
                  >
                    {item.profiles?.avatar_url ? (
                      <img src={getOptimizedAvatar(item.profiles.avatar_url)} style={s.avatar} alt="avatar" loading="lazy" decoding="async" />
                    ) : (
                      <div style={s.avatar}>{getAuthorName(item).charAt(0).toUpperCase()}</div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => goToAuthorProfile(e, item.user_id)}
                    style={{
                      overflow: 'hidden',
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      textAlign: 'left',
                      cursor: 'pointer',
                      flex: 1,
                      minWidth: 0,
                      maxWidth: '100%',
                    }}
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
                  <button
                    type="button"
                    onClick={(e) => handleShareToChat(e, item)}
                    style={{ ...s.actionBtn }}
                    className="action-icon share-btn"
                    aria-label="Compartir en chat"
                  >
                    <Send size={18} />
                  </button>
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

      {shareSheetOpen && (
        (() => {
          const viewportH = typeof window !== 'undefined' ? window.innerHeight : 900;
          const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1400;
          const mobile = typeof window !== 'undefined' ? window.matchMedia('(max-width: 760px)').matches : false;
          const modalWidth = Math.min(520, viewportW - 24);
          const modalHeightEstimate = 520;
          const defaultLeft = Math.max(12, (viewportW - modalWidth) / 2);
          const defaultTop = Math.max(76, Math.min(120, viewportH - modalHeightEstimate - 12));
          let modalLeft = defaultLeft;
          let modalTop = defaultTop;

          if (!mobile && shareAnchorRect) {
            const anchorCenterX = (shareAnchorRect.left + shareAnchorRect.right) / 2;
            modalLeft = anchorCenterX - (modalWidth / 2);
            modalLeft = Math.max(12, Math.min(modalLeft, viewportW - modalWidth - 12));

            // Prefer opening above the share icon to keep the panel near the trigger.
            modalTop = shareAnchorRect.top - modalHeightEstimate - 8;
            if (modalTop < 76) {
              modalTop = shareAnchorRect.bottom + 8;
            }
            modalTop = Math.max(76, Math.min(modalTop, viewportH - modalHeightEstimate - 12));
          }

          if (mobile && shareAnchorRect) {
            modalTop = Math.max(76, Math.min(shareAnchorRect.bottom + 8, viewportH - modalHeightEstimate - 12));
          }
          return (
        <div
          onClick={closeShareSheet}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            zIndex: 10000,
            display: 'block',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: mobile ? 'calc(100% - 1.5rem)' : `${modalWidth}px`,
              maxHeight: mobile ? 'calc(100vh - 1.5rem)' : '80vh',
              position: 'fixed',
              left: mobile ? '0.75rem' : `${modalLeft}px`,
              top: mobile ? `${modalTop}px` : `${modalTop}px`,
              overflow: 'hidden',
              background: isDark ? '#111b2e' : '#fff',
              borderRadius: '1rem',
              border: `1px solid ${isDark ? '#2a3a56' : '#dbe4f0'}`,
              boxShadow: '0 20px 45px rgba(15, 23, 42, 0.25)',
              display: 'grid',
              gridTemplateRows: 'auto auto minmax(0, 1fr)',
            }}
          >
            <header style={{ padding: '0.9rem 1rem', borderBottom: `1px solid ${isDark ? '#22314a' : '#eef2f7'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <strong style={{ color: isDark ? '#e6eefb' : '#0f172a' }}>Compartir en chat</strong>
              <button type="button" onClick={closeShareSheet} style={{ border: 'none', background: 'transparent', color: isDark ? '#9db0cf' : '#64748b', cursor: 'pointer', padding: 0 }}>
                <X size={18} />
              </button>
            </header>
            <div style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${isDark ? '#22314a' : '#eef2f7'}` }}>
              <input
                type="text"
                value={shareSearch}
                onChange={(e) => setShareSearch(e.target.value)}
                placeholder="Buscar usuario..."
                style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${isDark ? '#2a3a56' : '#cbd5e1'}`, borderRadius: '0.65rem', padding: '0.55rem 0.7rem', outline: 'none', background: isDark ? '#0f182a' : '#fff', color: isDark ? '#e6eefb' : '#0f172a' }}
              />
            </div>
            <div style={{ overflowY: 'auto', padding: '0.5rem' }}>
              {(shareSearch.trim().length >= 2 ? shareResults : shareContacts).length === 0 ? (
                <p style={{ margin: 0, padding: '0.8rem', color: isDark ? '#9db0cf' : '#64748b', fontSize: '0.86rem' }}>
                  {shareSearch.trim().length >= 2 ? 'No se encontraron usuarios.' : 'No hay conversaciones recientes.'}
                </p>
              ) : (
                (shareSearch.trim().length >= 2 ? shareResults : shareContacts).map((profile) => (
                  <div key={`share-user-${profile.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.65rem', padding: '0.55rem', borderRadius: '0.7rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {profile.avatar_url ? <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontWeight: 700, color: '#475569' }}>{getProfileName(profile).charAt(0).toUpperCase()}</span>}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.84rem', color: isDark ? '#e6eefb' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{getProfileName(profile)}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: isDark ? '#9db0cf' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.display_name || 'Participante'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSendSharedPost(profile)}
                      disabled={sendingToUserId === profile.id}
                      style={{ border: 'none', borderRadius: '999px', background: '#2563eb', color: '#fff', padding: '0.45rem 0.8rem', fontWeight: 700, cursor: sendingToUserId === profile.id ? 'not-allowed' : 'pointer', opacity: sendingToUserId === profile.id ? 0.65 : 1 }}
                    >
                      {sendingToUserId === profile.id ? 'Enviando...' : 'Enviar'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
          );
        })()
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
