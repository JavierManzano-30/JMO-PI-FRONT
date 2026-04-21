import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { 
  User, 
  MapPin, 
  Shield, 
  Calendar, 
  Image as ImageIcon, 
  Heart, 
  TrendingUp,
  Settings,
  ArrowLeft
} from 'lucide-react';

function formatDate(value) {
  if (!value) return 'Sin datos';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin datos';
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(date);
}

function formatVotesAverage(value) {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

export function Profile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [activity, setActivity] = useState({
    status: 'loading',
    uploaded: 0,
    votesReceived: 0,
    averageVotes: 0,
    bestPhoto: null,
    lastPublishedAt: null,
  });

  // 1. Cargar datos del perfil de forma "robusta" (sin depender de Joins si fallan)
  useEffect(() => {
    async function fetchFullProfile() {
      if (!user?.id) return;
      
      try {
        // Primero intentamos la consulta básica del perfil
        const { data: profile, error: pError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (pError) throw pError;

        let regionInfo = null;
        if (profile?.region_id) {
          // Consultamos la región por separado para evitar errores 400 de Joins mal configurados
          const { data: region } = await supabase
            .from('regions')
            .select('name')
            .eq('id', profile.region_id)
            .single();
          regionInfo = region;
        }

        setProfileData({ ...profile, regions: regionInfo });
      } catch (err) {
        console.error('Error cargando perfil robusto:', err);
      }
    }
    fetchFullProfile();
  }, [user?.id]);

  // 2. Cargar actividad (evita error 500 del antiguo backend)
  useEffect(() => {
    if (!user?.id) {
      setActivity(p => ({ ...p, status: 'empty' }));
      return;
    }

    setActivity((prev) => ({ ...prev, status: 'loading' }));

    supabase
      .from('submissions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data: items, error }) => {
        if (error) throw error;
        
        const safeItems = items || [];
        const votes = safeItems.reduce((total, photo) => total + (photo.votes || 0), 0);
        const uploaded = safeItems.length;
        const averageVotes = uploaded ? votes / uploaded : 0;

        const bestPhoto = safeItems.reduce((currentBest, currentPhoto) => {
          if (!currentBest) return currentPhoto;
          if ((currentPhoto.votes || 0) > (currentBest.votes || 0)) return currentPhoto;
          return currentBest;
        }, null);

        const lastPublishedAt = safeItems[0]?.created_at || null;

        setActivity({
          status: 'default',
          uploaded,
          votesReceived: votes,
          averageVotes,
          bestPhoto,
          lastPublishedAt,
        });
      })
      .catch((err) => {
        console.error('Error cargando actividad:', err);
        setActivity(p => ({ ...p, status: 'error' }));
      });
  }, [user?.id]);

  const registeredAt = useMemo(() => formatDate(user?.created_at || profileData?.created_at), [user?.created_at, profileData?.created_at]);
  const communityLabel = profileData?.regions?.name || 'Sin comunidad asignada';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem', fontFamily: "'Inter', sans-serif" }}>
      <header style={{ maxWidth: '1000px', margin: '0 auto 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/app/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', textDecoration: 'none', fontWeight: 600 }}>
          <ArrowLeft size={18} /> Volver al panel
        </Link>
        <Link to="/app/profile/edit" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', color: '#0f172a', textDecoration: 'none', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <Settings size={18} /> Editar Perfil
        </Link>
      </header>

      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gap: '2rem' }}>
        
        <article style={{ background: '#fff', borderRadius: '2rem', padding: '3rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', display: 'flex', gap: '2.5rem', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '100%', background: 'linear-gradient(to left, rgba(59,130,246,0.03), transparent)', pointerEvents: 'none' }} />
          
          <div style={{ width: '140px', height: '140px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', flexShrink: 0 }}>
            {profileData?.avatar_url ? (
              <img src={profileData.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="Avatar" />
            ) : (
              <User size={64} color="#cbd5e1" />
            )}
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ color: '#3b82f6', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Perfil Miembro</p>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
              {profileData?.username || user?.user_metadata?.username || 'Usuario'}
            </h1>
            <p style={{ color: '#64748b', fontSize: '1rem', margin: '0 0 1.5rem' }}>{user?.email}</p>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 1rem', background: '#eff6ff', color: '#2563eb', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 600 }}>
                <MapPin size={14} /> {communityLabel}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 1rem', background: '#f8fafc', color: '#64748b', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 600 }}>
                <Shield size={14} /> Miembro Base
              </div>
            </div>
          </div>
        </article>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          <section style={{ background: '#fff', borderRadius: '2rem', padding: '2rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} color="#3b82f6" /> Tu Impacto
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '1.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>FOTOS</span>
                <strong style={{ fontSize: '1.5rem', color: '#0f172a' }}>{activity.uploaded}</strong>
              </div>
              <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '1.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>VOTOS</span>
                <strong style={{ fontSize: '1.5rem', color: '#0f172a' }}>{activity.votesReceived}</strong>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '1.5rem', color: '#fff' }}>
              <p style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.25rem' }}>Media de Votos</p>
              <strong style={{ fontSize: '1.75rem' }}>{formatVotesAverage(activity.averageVotes)}</strong>
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={12} /> Última: {formatDate(activity.lastPublishedAt)}
              </div>
            </div>
          </section>

          <section style={{ background: '#fff', borderRadius: '2rem', padding: '2rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem' }}>Detalles de Cuenta</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Registrado</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{registeredAt}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
