import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import {
  getUserById,
  getFollowStats,
  isFollowingUser,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from '../services/supabaseService';
import {
  User,
  MapPin,
  Shield,
  Calendar,
  Image as ImageIcon,
  TrendingUp,
  Settings,
  ArrowLeft,
  UserPlus,
  UserMinus,
  MessageCircle,
} from 'lucide-react';

function formatDate(value) {
  if (!value) return 'Sin datos';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin datos';
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(date);
}

function parsePositiveInt(value) {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return null;
}

export function Profile() {
  const { user } = useAuth();
  const { userId } = useParams();
  const location = useLocation();

  const ownBackendId = useMemo(() => parsePositiveInt(user?.backendId ?? user?.id), [user?.backendId, user?.id]);
  const routeUserId = useMemo(() => parsePositiveInt(userId), [userId]);
  const viewedUserId = routeUserId || ownBackendId;
  const isOwnProfile = Boolean(viewedUserId && ownBackendId && viewedUserId === ownBackendId);
  const isPublicRoute = location.pathname.startsWith('/users/');

  const [profile, setProfile] = useState(null);
  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [userPhotos, setUserPhotos] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowBusy, setIsFollowBusy] = useState(false);

  useEffect(() => {
    async function loadProfileData() {
      if (!viewedUserId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [profileData, statsData, followersData, followingData] = await Promise.all([
          getUserById(viewedUserId),
          getFollowStats(viewedUserId),
          getFollowers(viewedUserId, { limit: 10 }),
          getFollowing(viewedUserId, { limit: 10 }),
        ]);

        setProfile(profileData);
        setFollowStats(statsData);
        setFollowers(followersData);
        setFollowing(followingData);

        if (ownBackendId && !isOwnProfile) {
          const followingState = await isFollowingUser(ownBackendId, viewedUserId);
          setIsFollowing(followingState);
        } else {
          setIsFollowing(false);
        }

        const { data, error } = await supabase
          .from('photos')
          .select('id, title, image_url, created_at, is_deleted')
          .eq('user_id', viewedUserId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUserPhotos(data || []);
      } catch (err) {
        console.error('Error cargando perfil:', err);
        setProfile(null);
        setUserPhotos([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfileData();
  }, [viewedUserId, ownBackendId, isOwnProfile]);

  const activity = useMemo(() => ({
    uploaded: userPhotos.length,
    lastPublishedAt: userPhotos[0]?.created_at || null,
  }), [userPhotos]);

  const handleToggleFollow = async () => {
    if (!ownBackendId || !viewedUserId || isOwnProfile || isFollowBusy) return;

    setIsFollowBusy(true);
    try {
      if (isFollowing) {
        await unfollowUser(ownBackendId, viewedUserId);
        setIsFollowing(false);
        setFollowStats((prev) => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
      } else {
        await followUser(ownBackendId, viewedUserId);
        setIsFollowing(true);
        setFollowStats((prev) => ({ ...prev, followers: prev.followers + 1 }));
      }
    } catch (err) {
      console.error('No se pudo actualizar seguimiento:', err);
    } finally {
      setIsFollowBusy(false);
    }
  };

  const backTo = user ? '/app/dashboard' : '/gallery';
  const profileUsername = profile?.username || 'usuario';
  const profileDisplayName = profile?.display_name || profile?.username || 'Usuario';
  const profileEmail = profile?.email || 'Sin correo';
  const profileCommunity = profile?.community_name || 'Sin comunidad asignada';

  if (!viewedUserId) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: '2rem' }}>
        <p style={{ maxWidth: '960px', margin: '0 auto', color: 'var(--muted)' }}>
          No se pudo resolver el usuario del perfil.
        </p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: '2rem', fontFamily: "'Inter', sans-serif", color: 'var(--text)' }}>
      <header style={{ maxWidth: '1000px', margin: '0 auto 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to={backTo} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', textDecoration: 'none', fontWeight: 600 }}>
          <ArrowLeft size={18} /> Volver
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {isOwnProfile && !isPublicRoute && (
            <Link to="/app/profile/edit" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface)', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', border: '1px solid var(--border)', color: 'var(--text)', textDecoration: 'none', fontWeight: 600 }}>
              <Settings size={18} /> Editar Perfil
            </Link>
          )}

          {!isOwnProfile && user && (
            <>
              <button
                type="button"
                onClick={handleToggleFollow}
                disabled={isFollowBusy}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: isFollowing ? 'var(--surface-soft)' : '#2563eb',
                  border: isFollowing ? '1px solid var(--border)' : '1px solid #2563eb',
                  color: isFollowing ? 'var(--text)' : '#fff',
                  borderRadius: '0.75rem',
                  padding: '0.62rem 1rem',
                  fontWeight: 700,
                  cursor: isFollowBusy ? 'wait' : 'pointer',
                }}
              >
                {isFollowing ? <UserMinus size={16} /> : <UserPlus size={16} />}
                {isFollowing ? 'Siguiendo' : 'Seguir'}
              </button>

              <Link
                to={`/app/chat?user=${viewedUserId}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border)',
                  padding: '0.62rem 1rem',
                  background: 'var(--surface)',
                  textDecoration: 'none',
                  color: 'var(--text)',
                  fontWeight: 700,
                }}
              >
                <MessageCircle size={16} /> Mensaje
              </Link>
            </>
          )}
        </div>
      </header>

      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gap: '2rem' }}>
        <article style={{ background: 'var(--surface)', borderRadius: '2rem', padding: '2.2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', border: '1px solid var(--border)', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '132px', height: '132px', borderRadius: '50%', background: 'var(--surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid var(--surface)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="Avatar" />
            ) : (
              <User size={64} color="#cbd5e1" />
            )}
          </div>

          <div style={{ flex: 1, minWidth: '260px' }}>
            <p style={{ color: '#3b82f6', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              {isOwnProfile ? 'Tu perfil' : 'Perfil público'}
            </p>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text)', margin: '0 0 0.45rem', letterSpacing: '-0.02em' }}>{profileDisplayName}</h1>
            <p style={{ color: 'var(--muted)', fontSize: '1rem', margin: '0 0 1rem' }}>@{profileUsername} · {profileEmail}</p>

            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem', background: '#eff6ff', color: '#2563eb', borderRadius: '999px', fontSize: '0.84rem', fontWeight: 600 }}>
                <MapPin size={14} /> {profileCommunity}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem', background: 'var(--surface-soft)', color: 'var(--muted)', borderRadius: '999px', fontSize: '0.84rem', fontWeight: 600 }}>
                <Shield size={14} /> {profile?.role === 'admin' ? 'Administrador' : 'Miembro'}
              </div>
            </div>
          </div>
        </article>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <section style={{ background: 'var(--surface)', borderRadius: '1.25rem', padding: '1.3rem', border: '1px solid var(--border)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1rem', color: 'var(--text)' }}>
              <TrendingUp size={16} color="#3b82f6" /> Actividad
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.6rem' }}>
              <div style={{ background: 'var(--surface-soft)', borderRadius: '0.8rem', padding: '0.8rem' }}>
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700 }}>FOTOS</span>
                <strong style={{ fontSize: '1.3rem', color: 'var(--text)' }}>{activity.uploaded}</strong>
              </div>
              <div style={{ background: 'var(--surface-soft)', borderRadius: '0.8rem', padding: '0.8rem' }}>
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700 }}>SIGUIENDO</span>
                <strong style={{ fontSize: '1.3rem', color: 'var(--text)' }}>{followStats.following}</strong>
              </div>
              <div style={{ background: 'var(--surface-soft)', borderRadius: '0.8rem', padding: '0.8rem' }}>
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700 }}>SEGUIDORES</span>
                <strong style={{ fontSize: '1.3rem', color: 'var(--text)' }}>{followStats.followers}</strong>
              </div>
              <div style={{ background: 'var(--surface-soft)', borderRadius: '0.8rem', padding: '0.8rem' }}>
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700 }}>ALTA</span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{formatDate(profile?.created_at)}</strong>
              </div>
            </div>
          </section>

          <section style={{ background: 'var(--surface)', borderRadius: '1.25rem', padding: '1.3rem', border: '1px solid var(--border)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1rem', color: 'var(--text)' }}>
              <Calendar size={16} color="#3b82f6" /> Detalles
            </h3>
            <p style={{ margin: '0 0 0.45rem', color: 'var(--muted)', fontSize: '0.9rem' }}><strong style={{ color: 'var(--text)' }}>Usuario:</strong> @{profileUsername}</p>
            <p style={{ margin: '0 0 0.45rem', color: 'var(--muted)', fontSize: '0.9rem' }}><strong style={{ color: 'var(--text)' }}>Comunidad:</strong> {profileCommunity}</p>
            <p style={{ margin: '0 0 0.45rem', color: 'var(--muted)', fontSize: '0.9rem' }}><strong style={{ color: 'var(--text)' }}>Registrado:</strong> {formatDate(profile?.created_at)}</p>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}><strong style={{ color: 'var(--text)' }}>Última foto:</strong> {formatDate(activity.lastPublishedAt)}</p>
          </section>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          <section style={{ background: 'var(--surface)', borderRadius: '1.25rem', padding: '1.3rem', border: '1px solid var(--border)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: 0, marginBottom: '1rem', fontSize: '1rem', color: 'var(--text)' }}>Seguidores</h3>
            {followers.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>Sin seguidores todavía.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.6rem' }}>
                {followers.map((item) => (
                  <Link key={`follower-${item.id}`} to={user ? `/app/users/${item.id}` : `/users/${item.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.avatar_url ? <img src={item.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontWeight: 700, color: '#475569' }}>{(item.username || 'u').charAt(0).toUpperCase()}</span>}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>@{item.username}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.display_name || 'Participante'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section style={{ background: 'var(--surface)', borderRadius: '1.25rem', padding: '1.3rem', border: '1px solid var(--border)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: 0, marginBottom: '1rem', fontSize: '1rem', color: 'var(--text)' }}>Siguiendo</h3>
            {following.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>No sigue a nadie todavía.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.6rem' }}>
                {following.map((item) => (
                  <Link key={`following-${item.id}`} to={user ? `/app/users/${item.id}` : `/users/${item.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.avatar_url ? <img src={item.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontWeight: 700, color: '#475569' }}>{(item.username || 'u').charAt(0).toUpperCase()}</span>}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>@{item.username}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.display_name || 'Participante'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <section style={{ background: 'var(--surface)', borderRadius: '1.25rem', padding: '1.3rem', border: '1px solid var(--border)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <ImageIcon size={18} color="#3b82f6" /> Fotos
          </h3>

          {isLoading ? (
            <p style={{ color: 'var(--muted)', margin: 0 }}>Cargando perfil...</p>
          ) : userPhotos.length === 0 ? (
            <p style={{ color: 'var(--muted)', margin: 0 }}>Este usuario aún no ha subido fotografías.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.85rem' }}>
              {userPhotos.map((photo) => {
                const photoPath = user ? `/app/photos/${photo.id}` : `/photos/${photo.id}`;
                return (
                  <Link key={photo.id} to={photoPath} style={{ textDecoration: 'none', color: 'inherit', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface-soft)' }}>
                    <img src={photo.image_url} alt={photo.title || 'Fotografía'} style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} />
                    <div style={{ padding: '0.75rem' }}>
                      <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {photo.title || 'Sin título'}
                      </p>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.74rem', color: 'var(--muted)' }}>
                        {formatDate(photo.created_at)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
