import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.jsx';

export function Profile() {
  const { profile, user, refreshUser } = useAuth();

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <div className="split">
      <div className="card">
        <h2 className="section-title">Perfil</h2>
        <p className="section-subtitle">Tus datos y estadisticas recientes.</p>
        <img className="avatar" src={profile.avatar} alt="Perfil" style={{ marginBottom: 12 }} />
        <div className="helper" style={{ marginBottom: 12 }}>
          {profile.bio || 'Comparte tu historia visual con la comunidad.'}
        </div>
        <div className="list">
          <div className="list-item">
            <span>Nombre</span>
            <strong>{user?.display_name || user?.username || profile.name || 'Sin nombre'}</strong>
          </div>
          <div className="list-item">
            <span>Email</span>
            <strong>{user?.email || 'Sin email'}</strong>
          </div>
          <div className="list-item">
            <span>Comunidad</span>
            <strong>{user?.community_id ? `#${user.community_id}` : 'Sin comunidad'}</strong>
          </div>
          <div className="list-item">
            <span>Rol</span>
            <strong>{user?.role || 'user'}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
          <Link className="btn" to="/app/profile/edit">
            Editar perfil
          </Link>
          <Link className="btn outline" to="/app/dashboard">
            Volver
          </Link>
        </div>
      </div>
      <div className="card">
        <h3 className="card-title">Actividad</h3>
        <div className="list">
          <div className="list-item">
            <span>Ultima subida</span>
            <strong>Hace 2 dias</strong>
          </div>
          <div className="list-item">
            <span>Mejor puesto</span>
            <strong>#3</strong>
          </div>
          <div className="list-item">
            <span>Seguidores</span>
            <strong>128</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
