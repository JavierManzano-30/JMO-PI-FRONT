import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { getSubmissionById, getComments, addComment, deleteComment } from '../services/supabaseService';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  ArrowLeft, 
  MapPin, 
  Calendar,
  Trophy,
  User,
  Trash2,
  Bookmark,
  Tag,
  Send
} from 'lucide-react';

const tokens = {
  colors: {
    bg: '#ffffff',
    card: '#f8fafc',
    accent: '#2563eb',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
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
    background: '#000',
    borderRadius: '2rem',
    overflow: 'hidden',
    boxShadow: '0 40px 100px -20px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: '8rem',
    maxHeight: 'calc(100vh - 12rem)',
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
    background: '#eff6ff',
    color: '#2563eb',
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
    background: '#000',
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
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const rawBackendUserId = user?.backendId ?? user?.id;
  const backendUserId = typeof rawBackendUserId === 'number'
    ? (Number.isInteger(rawBackendUserId) && rawBackendUserId > 0 ? rawBackendUserId : null)
    : (typeof rawBackendUserId === 'string' && /^\d+$/.test(rawBackendUserId) ? Number(rawBackendUserId) : null);
  const canWriteData = Number.isInteger(backendUserId) && backendUserId > 0;

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
        await supabase.from('votes').delete().eq('photo_id', photoId).eq('user_id', backendUserId);
        setVoteCount(prev => prev - 1);
        setHasVoted(false);
      } else {
        await supabase.from('votes').insert([{ photo_id: photoId, user_id: backendUserId }]);
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
  const backTo = user ? '/app/dashboard' : '/gallery';

  return (
    <div style={s.page}>
      <style>{`
        .photo-detail-shell {
          padding: 0.75rem 0 1.5rem;
        }
        .photo-detail-back {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: ${tokens.colors.textMuted};
          text-decoration: none;
          font-weight: 600;
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
      <Link to={backTo} className="photo-detail-back">
        <ArrowLeft size={18} /> Volver a la galería
      </Link>

      <main className="photo-detail-main-grid">
        {/* Lado Izquierdo: Imagen */}
        <div className="photo-detail-image-box" style={s.imageBox}>
          <img src={photo.image_url} alt={photo.title} style={s.image} />
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <User size={16} /> @{photo.profiles?.username || photo.profiles?.full_name || 'Participante'}
              </div>
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
              onClick={handleShare}
              style={{ ...s.btnMain, background: 'transparent', border: `1px solid ${tokens.colors.border}`, color: '#000', flex: 0.2 }}
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
                  onChange={(e) => setNewComment(e.target.value)}
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
    </div>
  );
}
