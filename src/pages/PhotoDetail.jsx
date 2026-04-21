import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { getSubmissionById } from '../services/supabaseService';
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
  Bookmark
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
  },
  imageBox: {
    background: '#000',
    borderRadius: '2rem',
    overflow: 'hidden',
    boxShadow: '0 40px 100px -20px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: '2rem',
  },
  image: {
    width: '100%',
    height: 'auto',
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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSubmissionById(photoId);
      setPhoto(data);

      // Traemos el conteo REAL de votos desde la tabla 'votes'
      const { count: realVotes } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('submission_id', photoId);
      
      setVoteCount(realVotes || 0);

      if (user?.id) {
        const { count } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('submission_id', photoId)
          .eq('user_id', user.id);
        setHasVoted(count > 0);
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo encontrar la fotografía.');
    } finally {
      setLoading(false);
    }
  }, [photoId, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleVote = async () => {
    if (!user) return navigate('/login');
    
    try {
      if (hasVoted) {
        await supabase.from('votes').delete().eq('submission_id', photoId).eq('user_id', user.id);
        setVoteCount(prev => prev - 1);
        setHasVoted(false);
      } else {
        await supabase.from('votes').insert([{ submission_id: photoId, user_id: user.id }]);
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
      await supabase.from('submissions').delete().eq('id', photoId);
      navigate('/app/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: '10rem', textAlign: 'center' }}>Cargando obra...</div>;
  if (error || !photo) return <div style={{ padding: '10rem', textAlign: 'center' }}>{error || 'Obra no encontrada'}</div>;

  const isOwner = user?.id === photo.user_id;

  return (
    <div style={s.page}>
      <Link to="/app/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: tokens.colors.textMuted, textDecoration: 'none', fontWeight: 600 }}>
        <ArrowLeft size={18} /> Volver a la galería
      </Link>

      <main style={s.container}>
        {/* Lado Izquierdo: Imagen */}
        <div style={s.imageBox}>
          <img src={photo.image_url} alt={photo.title} style={s.image} />
        </div>

        {/* Lado Derecho: Info */}
        <div style={s.content}>
          <div style={s.badge}>
            <Trophy size={14} /> {photo.contests?.title || 'Concurso Finalizado'}
          </div>
          
          <h1 style={s.title}>{photo.title}</h1>
          <p style={{ fontSize: '1.25rem', color: tokens.colors.textMuted, lineHeight: 1.6 }}>{photo.description || 'Sin descripción disponible.'}</p>

          <div style={s.metaGrid}>
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
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: tokens.colors.textMuted, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Publicada el</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <Calendar size={16} /> {formatDate(photo.created_at)}
              </div>
            </div>
          </div>

          <div style={s.actionBox}>
            <button 
              onClick={handleToggleVote}
              style={{ ...s.btnMain, background: hasVoted ? tokens.colors.accent : '#000' }}
            >
              <Heart size={20} fill={hasVoted ? '#fff' : 'none'} />
              {hasVoted ? 'Voto Registrado' : 'Votar Fotografía'}
              <span style={{ marginLeft: '0.5rem', opacity: 0.6 }}>({voteCount})</span>
            </button>
            
            <button style={{ ...s.btnMain, background: 'transparent', border: `1px solid ${tokens.colors.border}`, color: '#000', flex: 0.2 }}>
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
              <MessageSquare size={24} /> Comentarios
            </h3>
            <p style={{ color: tokens.colors.textMuted, textAlign: 'center', padding: '3rem', background: tokens.colors.card, borderRadius: '1.5rem' }}>
              La sección de comentarios se está modernizando. Pronto podrás dejar tu feedback.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
