import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  getContests, 
  getCategories, 
  getSubmissions 
} from '../services/supabaseService';
import { 
  Heart,
  ArrowUp,
  MessageSquare,
  Search,
  Plus,
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
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
    transition: 'all 0.2s ease',
  },
  floatAction: {
    position: 'fixed',
    bottom: '2.5rem',
    right: '2.5rem',
    width: '4rem',
    height: '4rem',
    borderRadius: '50%',
    background: '#000',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
    zIndex: 200,
  }
};

export function Dashboard() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeFilters = {
    contestId: params.get('contest') || '',
    categoryId: params.get('category') || '',
  };

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSubmissions(activeFilters, user?.id);
      setSubmissions(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [params, user?.id]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleToggleVote = async (e, photoId, hasVoted) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate('/login');

    try {
      if (hasVoted) {
        await supabase.from('votes').delete().eq('submission_id', photoId).eq('user_id', user.id);
      } else {
        await supabase.from('votes').insert([{ submission_id: photoId, user_id: user.id }]);
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

  // Determinar si una tarjeta debe ser ancha (landscape)
  const isHorizontal = (index) => index % 5 === 0; 

  return (
    <div style={s.page}>
      <style>{`
        .action-icon:hover { background: #f1f5f9; color: #111827; }
        .heart-btn:hover { background: #fee2e2 !important; color: #ef4444 !important; }
        .comment-btn:hover { background: #dcfce7 !important; color: #059669 !important; }
        .vote-active { color: ${tokens.colors.accent} !important; background: #dbeafe !important; }
        .heart-active { color: #ef4444 !important; background: #fee2e2 !important; }
      `}</style>

      <main style={s.gallery}>
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
                <img src={item.image_url} style={s.image} alt={item.title} />
              </div>

              <div style={s.footer}>
                <div style={s.author}>
                  {item.profiles?.avatar_url ? (
                    <img src={item.profiles.avatar_url} style={s.avatar} alt="avatar" />
                  ) : (
                    <div style={s.avatar}>{getAuthorName(item).charAt(0).toUpperCase()}</div>
                  )}
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 800, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      @{getAuthorName(item)}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: tokens.colors.textMuted, margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={s.actionBtn} className="action-icon comment-btn">
                    <MessageSquare size={20} />
                  </button>
                  <button 
                    onClick={(e) => handleToggleVote(e, item.id, item.hasVoted)}
                    style={s.actionBtn} 
                    className={`action-icon heart-btn ${item.hasVoted ? 'heart-active' : ''}`}
                    title="Me gusta"
                  >
                    <Heart size={20} fill={item.hasVoted ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
            </Link>
          ))
        )}
      </main>

      <Link to="/app/photos/upload" style={s.floatAction}>
        <Plus size={32} />
      </Link>
    </div>
  );
}
