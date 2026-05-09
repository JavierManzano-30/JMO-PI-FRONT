import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { createVote, deleteVote } from '../services/votesService.js';
import {
  getSubmissionById,
  getComments,
  addComment,
  deleteComment,
  getChatContacts,
  searchUsers,
  sendDirectMessage,
} from '../services/supabaseService';
import {
  Heart, 
  MessageSquare, 
  Share2, 
  ArrowLeft, 
  MapPin, 
  Calendar,
  Trophy,
  Trash2,
  Bookmark,
  Tag,
  Send,
  MessageCircle,
  X
} from 'lucide-react';

const MAX_COMMENT_LENGTH = 280;

const tokens = {
  colors: {
    bg: 'var(--bg-page)',
    card: 'var(--surface-soft)',
    accent: 'var(--primary)',
    text: 'var(--text)',
    textMuted: 'var(--muted)',
    border: 'var(--border)',
    danger: '#ef4444'
  },
  fonts: {
    display: "'Outfit', sans-serif",
  }
};

function formatDate(dateValue) {
  if (!dateValue) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(dateValue));
}

const s = {
  page: {
    minHeight: '100vh',
    background: tokens.colors.bg,
    color: tokens.colors.text,
    fontFamily: tokens.fonts.display,
    padding: '2rem',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
    gap: '3rem',
    marginTop: '2rem',
    alignItems: 'start',
  },
  imageBox: {
    background: '#0a1020',
    borderRadius: '2rem',
    overflow: 'hidden',
    boxShadow: '0 40px 100px -20px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
  },
  content: {
    padding: '1rem 0',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.4rem 1rem',
    background: 'var(--primary-soft)',
    color: 'var(--primary)',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    margin: '0 0 1rem',
    lineHeight: 1.1,
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    margin: '2rem 0',
    padding: '1.5rem',
    background: tokens.colors.card,
    borderRadius: '1.5rem',
    border: `1px solid ${tokens.colors.border}`,
  },
  actionBox: {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem',
  },
  btnMain: {
    flex: 1,
    padding: '1.25rem',
    borderRadius: '1rem',
    background: '#111b2e',
    color: '#fff',
    border: 'none',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    transition: 'transform 0.2s',
  }
};

export function PhotoDetail() {
  const { photoId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [shareContacts, setShareContacts] = useState([]);
  const [shareSearch, setShareSearch] = useState('');
  const [shareResults, setShareResults] = useState([]);
  const [sendingToUserId, setSendingToUserId] = useState(null);
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'light');
  const rawBackendUserId = user?.backendId ?? user?.id;
  const backendUserId = typeof rawBackendUserId === 'number'
    ? (Number.isInteger(rawBackendUserId) && rawBackendUserId > 0 ? rawBackendUserId : null)
    : (typeof rawBackendUserId === 'string' && /^\d+$/.test(rawBackendUserId) ? Number(rawBackendUserId) : null);
  const canWriteData = Number.isInteger(backendUserId) && backendUserId > 0;
  const isDark = theme === 'dark';

  useEffect(() => {
    const onThemeChange = (event) => {
      const next = event?.detail || document.documentElement.getAttribute('data-theme') || 'light';
      setTheme(next);
    };
    window.addEventListener('snapnation:theme-change', onThemeChange);
    return () => window.removeEventListener('snapnation:theme-change', onThemeChange);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSubmissionById(photoId);
      setPhoto(data);

      // Traemos el conteo REAL de votos desde la tabla 'votes'
      const { count: realVotes } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('photo_id', photoId);
      
      setVoteCount(realVotes || 0);

      if (canWriteData) {
        const { count } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('photo_id', photoId)
          .eq('user_id', backendUserId);
        setHasVoted(count > 0);
      }

      // Traemos los comentarios (desde Supabase)
      try {
        const commentData = await getComments(photoId);
        setComments(commentData);
      } catch (cErr) {
        console.error("Error al cargar comentarios:", cErr);
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo encontrar la fotografía.');
    } finally {
      setLoading(false);
    }
  }, [photoId, canWriteData, backendUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleVote = async () => {
    if (!user) return navigate('/login');
    if (photo?.contests?.is_active === false) {
      alert('Este torneo ya ha finalizado. No se pueden cambiar votos.');
      return;
    }
    if (!canWriteData) {
      alert('Tu cuenta actual no está enlazada para votar en esta base de datos.');
      return;
    }
    
    try {
      if (hasVoted) {
        await deleteVote(photoId);
        setVoteCount(prev => prev - 1);
        setHasVoted(false);
      } else {
        await createVote(photoId);
        setVoteCount(prev => prev + 1);
        setHasVoted(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar esta fotografía permanentemente?')) return;
    try {
      await supabase.from('photos').delete().eq('id', photoId);
      navigate('/app/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/photos/${photoId}`;
    const shareData = {
      title: photo?.title || 'Fotografía en SnapNation',
      text: photo?.description || `Mira esta foto: ${photo?.title || 'SnapNation'}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        alert('Enlace copiado al portapapeles.');
        return;
      }

      window.prompt('Copia este enlace:', shareUrl);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      console.error(err);
      alert('No se pudo compartir esta publicación.');
    }
  };

  const getProfileName = (profile) => {
    if (!profile) return 'Participante';
    return profile.username || profile.display_name || `usuario_${profile.id}`;
  };

  const handleShareToChat = async () => {
    if (!user) return navigate('/login');
    if (!canWriteData) {
      alert('Tu cuenta actual no está enlazada para usar el chat.');
      return;
    }

    setShareSheetOpen(true);
    setShareSearch('');
    setShareResults([]);
    try {
      const contacts = await getChatContacts(backendUserId);
      setShareContacts(contacts || []);
    } catch (error) {
      console.error('No se pudieron cargar contactos:', error);
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
    setShareSearch('');
    setShareResults([]);
    setSendingToUserId(null);
  };

  const handleSendSharedPost = async (targetUser) => {
    if (!targetUser?.id || !backendUserId || sendingToUserId) return;
    const sharedLink = `${window.location.origin}/photos/${photoId}`;
    const message = `📸 ${photo?.title || 'Mira esta publicación'}\n${sharedLink}`;
    setSendingToUserId(targetUser.id);
    try {
      await sendDirectMessage(backendUserId, targetUser.id, message);
      closeShareSheet();
    } catch (error) {
      console.error('No se pudo compartir en chat:', error);
      alert('No se pudo compartir la publicación en el chat.');
    } finally {
      setSendingToUserId(null);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!canWriteData) {
      alert('Tu cuenta actual no está enlazada para comentar en esta base de datos.');
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const added = await addComment(photoId, backendUserId, newComment);
      setComments(prev => [...prev, added]);
      setNewComment('');
    } catch (err) {
      console.error(err);
      alert('Error al publicar comentario');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('¿Eliminar este comentario?')) return;
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: '10rem', textAlign: 'center' }}>Cargando obra...</div>;
  if (error || !photo) return <div style={{ padding: '10rem', textAlign: 'center' }}>{error || 'Obra no encontrada'}</div>;

  const isOwner = backendUserId === photo.user_id;
  const isContestClosed = photo?.contests?.is_active === false;
  const backTo = location.state?.from || (user ? '/app/dashboard' : '/gallery');
  const backLabel = location.state?.fromLabel || 'Volver a la galería';
  const authorProfilePath = photo?.user_id ? (user ? `/app/users/${photo.user_id}` : `/users/${photo.user_id}`) : null;

  return (
    <div style={s.page}>
      <style>{`
        .photo-detail-shell {
          padding: 0.75rem 0 1.5rem;
        }
        .photo-detail-main-grid {
          max-width: 1200px;
          margin: 2rem auto 0;
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
          gap: 3rem;
          align-items: start;
        }
        .photo-detail-image-box {
          position: sticky;
          top: 8rem;
          max-height: calc(100vh - 12rem);
        }
        .photo-detail-image-btn {
          width: 100%;
          height: 100%;
          padding: 0;
          border: none;
          background: transparent;
          cursor: zoom-in;
          display: block;
        }
        .photo-detail-lightbox {
          position: fixed;
          inset: 0;
          z-index: 2147483647;
          background: rgba(2, 6, 23, 0.88);
          display: grid;
          place-items: center;
          padding: 1.25rem;
        }
        .photo-detail-lightbox img {
          max-width: min(96vw, 1600px);
          max-height: 92vh;
          width: auto;
          height: auto;
          object-fit: contain;
          border-radius: 0.9rem;
          box-shadow: 0 28px 70px rgba(0, 0, 0, 0.45);
        }
        .photo-detail-lightbox-close {
          position: fixed;
          top: 0.95rem;
          right: 0.95rem;
          width: 40px;
          height: 40px;
          border-radius: 999px;
          border: 1px solid rgba(203, 213, 225, 0.5);
          background: rgba(15, 23, 42, 0.7);
          color: #fff;
          font-size: 1.45rem;
          line-height: 1;
          cursor: pointer;
        }
        .author-link {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          font-weight: 700;
          color: ${tokens.colors.accent};
        }
        .author-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          overflow: hidden;
          border: 1px solid ${tokens.colors.border};
          background: ${tokens.colors.card};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 0.78rem;
          font-weight: 800;
          color: ${tokens.colors.textMuted};
        }
        .author-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .photo-detail-title {
          word-break: break-word;
          overflow-wrap: anywhere;
        }
        .photo-detail-description {
          font-size: 1.25rem;
          color: ${tokens.colors.textMuted};
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        @media (max-width: 1024px) {
          .photo-detail-main-grid {
            gap: 1.4rem;
            grid-template-columns: 1fr;
            margin-top: 1rem;
          }
          .photo-detail-image-box {
            position: static;
            top: auto;
            max-height: none;
            max-width: 760px;
            margin: 0 auto;
            width: 100%;
          }
          .photo-detail-content {
            padding: 0 !important;
          }
        }

        @media (max-width: 760px) {
          .photo-detail-shell {
            padding: 0.25rem 0 1rem;
          }
          .photo-detail-main-grid {
            gap: 1rem;
          }
          .photo-detail-title {
            font-size: 2rem !important;
            line-height: 1.12 !important;
          }
          .photo-detail-description {
            font-size: 1.02rem !important;
            line-height: 1.5 !important;
          }
          .photo-detail-meta-grid {
            grid-template-columns: 1fr !important;
            gap: 0.85rem !important;
            padding: 1rem !important;
          }
          .photo-detail-action-box {
            flex-direction: column;
            gap: 0.7rem;
          }
          .photo-detail-action-box > * {
            width: 100%;
          }
        }
      `}</style>
      <div className="photo-detail-shell">
      <Link to={backTo} className="back-link photo-detail-back">
        <ArrowLeft size={18} /> {backLabel}
      </Link>

      <main className="photo-detail-main-grid">
        {/* Lado Izquierdo: Imagen */}
        <div className="photo-detail-image-box" style={s.imageBox}>
          <button
            type="button"
            className="photo-detail-image-btn"
            onClick={() => setLightboxOpen(true)}
            aria-label="Ver imagen ampliada"
            title="Click para ampliar"
          >
            <img
              src={photo.image_url}
              alt={photo.title}
              style={s.image}
              loading="eager"
              fetchpriority="high"
              decoding="async"
            />
          </button>
        </div>

        {/* Lado Derecho: Info */}
        <div className="photo-detail-content" style={s.content}>
          <div style={s.badge}>
            <Trophy size={14} /> {photo.contests?.title || 'Concurso Finalizado'}
          </div>
          
          <h1 className="photo-detail-title" style={s.title}>{photo.title}</h1>
          <p className="photo-detail-description">{photo.description || 'Sin descripción disponible.'}</p>

          <div className="photo-detail-meta-grid" style={s.metaGrid}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: tokens.colors.textMuted, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Autor</p>
              {authorProfilePath ? (
                <Link
                  to={authorProfilePath}
                  className="author-link"
                >
                  <span className="author-avatar">
                    {photo.profiles?.avatar_url ? (
                      <img src={photo.profiles.avatar_url} alt={`Avatar de ${photo.profiles?.username || 'usuario'}`} />
                    ) : (
                      (photo.profiles?.username || photo.profiles?.full_name || 'U').charAt(0).toUpperCase()
                    )}
                  </span>
                  @{photo.profiles?.username || photo.profiles?.full_name || 'Participante'}
                </Link>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                  @{photo.profiles?.username || photo.profiles?.full_name || 'Participante'}
                </div>
              )}
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: tokens.colors.textMuted, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Comunidad</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <MapPin size={16} color={tokens.colors.accent} /> {photo.regions?.name || 'Comunidad desconocida'}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: tokens.colors.textMuted, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Categoría</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <Tag size={16} color={tokens.colors.accent} /> {photo.categories?.name || 'Varios / General'}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: tokens.colors.textMuted, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Publicada el</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <Calendar size={16} /> {formatDate(photo.created_at)}
              </div>
            </div>
          </div>

          <div className="photo-detail-action-box" style={s.actionBox}>
            <div style={{ position: 'relative', flex: 1 }}>
              <button 
                onClick={handleToggleVote}
                disabled={!user || isContestClosed}
                style={{ 
                  ...s.btnMain, 
                  width: '100%',
                  background: (user && hasVoted) ? tokens.colors.accent : '#000',
                  opacity: (user && !isContestClosed) ? 1 : 0.3,
                  filter: (user && !isContestClosed) ? 'none' : 'grayscale(1)',
                  cursor: (user && !isContestClosed) ? 'pointer' : 'not-allowed'
                }}
              >
                <Heart size={20} fill={(user && hasVoted) ? '#fff' : 'none'} />
                {isContestClosed ? 'Votación cerrada' : (user ? (hasVoted ? 'Voto Registrado' : 'Votar Fotografía') : 'Inicia sesión para votar')}
                <span style={{ marginLeft: '0.5rem', opacity: 0.6 }}>({voteCount})</span>
              </button>
              {!user && <div style={{ position: 'absolute', top: '50%', left: '20%', right: '20%', height: '3px', background: '#94a3b8', transform: 'rotate(-10deg)', pointerEvents: 'none', opacity: 0.8 }} />}
            </div>
            
            <button
              type="button"
              onClick={handleShareToChat}
              style={{ ...s.btnMain, background: 'transparent', border: `1px solid ${tokens.colors.border}`, color: isDark ? '#fff' : '#000', flex: 0.35 }}
              title="Compartir en chat"
            >
              <MessageCircle size={20} />
            </button>

            <button
              type="button"
              onClick={handleShare}
              style={{ ...s.btnMain, background: 'transparent', border: `1px solid ${tokens.colors.border}`, color: isDark ? '#fff' : '#000', flex: 0.2 }}
            >
              <Share2 size={20} />
            </button>
          </div>

          {isOwner && (
            <button 
              onClick={handleDelete}
              style={{ marginTop: '2rem', background: 'none', border: 'none', color: tokens.colors.danger, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, cursor: 'pointer', padding: '1rem' }}
            >
              <Trash2 size={18} /> Eliminar mi publicación
            </button>
          )}

          <section style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: `1px solid ${tokens.colors.border}` }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MessageSquare size={24} /> Comentarios ({comments.length})
            </h3>
            
            {/* Formulario de comentario */}
            <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  type="text" 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
                  maxLength={MAX_COMMENT_LENGTH}
                  placeholder={user ? "Escribe algo sobre esta obra..." : "Inicia sesión para comentar..."}
                  style={{ 
                    flex: 1, padding: '1rem 1.5rem', borderRadius: '1rem', 
                    border: `1px solid ${tokens.colors.border}`, 
                    fontSize: '1rem', outline: 'none',
                    opacity: user ? 1 : 0.2,
                    filter: user ? 'none' : 'grayscale(1)',
                    cursor: user ? 'text' : 'not-allowed'
                  }}
                  disabled={submittingComment || !user}
                />
                <button 
                  type="submit" 
                  disabled={submittingComment || !newComment.trim() || !user}
                  style={{ 
                    padding: '1rem', borderRadius: '1rem', 
                    background: tokens.colors.accent, color: '#fff', 
                    border: 'none', 
                    cursor: (user && !submittingComment) ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: user ? 1 : 0.2,
                    filter: user ? 'none' : 'grayscale(1)'
                  }}
                >
                  <Send size={20} />
                </button>
              </form>
              <div style={{ marginTop: '0.45rem', textAlign: 'right', fontSize: '0.72rem', color: tokens.colors.textMuted }}>
                {newComment.length}/{MAX_COMMENT_LENGTH}
              </div>
              {!user && <div style={{ position: 'absolute', top: '50%', left: '5%', right: '5%', height: '2px', background: '#94a3b8', transform: 'rotate(-2deg)', pointerEvents: 'none', opacity: 0.6 }} />}
            </div>
            
            {!user && (
              <div style={{ padding: '1rem', textAlign: 'center', marginTop: '-2rem', marginBottom: '2rem' }}>
                <p style={{ fontSize: '0.85rem', color: tokens.colors.textMuted }}>
                  Debes <Link to="/login" style={{ color: tokens.colors.accent, fontWeight: 700 }}>iniciar sesión</Link> para participar en la conversación.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {comments.length === 0 ? (
                <p style={{ color: tokens.colors.textMuted, textAlign: 'center', padding: '3rem', background: tokens.colors.card, borderRadius: '1.5rem' }}>
                  Aún no hay comentarios. ¡Sé el primero en decir algo!
                </p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: '50%', background: tokens.colors.accent, 
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem',
                      overflow: 'hidden', flexShrink: 0
                    }}>
                      {comment.profiles?.avatar_url ? (
                        <img src={comment.profiles.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (comment.profiles?.username || comment.profiles?.full_name || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>@{comment.profiles?.username || 'Participante'}</span>
                        <span style={{ fontSize: '0.7rem', color: tokens.colors.textMuted }}>• {new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5, color: '#334155' }}>{comment.content}</p>
                    </div>
                    {(backendUserId === comment.user_id || backendUserId === photo.user_id) && (
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        style={{ background: 'none', border: 'none', color: tokens.colors.danger, cursor: 'pointer', padding: '0.5rem', opacity: 0.6 }}
                        title="Eliminar comentario"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
      </div>
      {lightboxOpen && createPortal(
        <div
          className="photo-detail-lightbox"
          onClick={() => setLightboxOpen(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
              setLightboxOpen(false);
            }
          }}
        >
          <button
            type="button"
            className="photo-detail-lightbox-close"
            aria-label="Cerrar imagen ampliada"
            onClick={(event) => {
              event.stopPropagation();
              setLightboxOpen(false);
            }}
          >
            ×
          </button>
          <img
            src={photo.image_url}
            alt={photo.title}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      , document.body)}
      {shareSheetOpen && createPortal(
        <div
          onClick={closeShareSheet}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            zIndex: 10000,
            display: 'grid',
            placeItems: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(520px, 100%)',
              maxHeight: '80vh',
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
      , document.body)}
    </div>
  );
}
