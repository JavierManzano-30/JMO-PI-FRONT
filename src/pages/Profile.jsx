import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.jsx';
import { listPhotos } from '../services/photosService.js';

export function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ uploaded: 0, votesReceived: 0 });

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    listPhotos({ userId: user.id, limit: 100 })
      .then((response) => {
        const items = response.data || [];
        const votes = items.reduce((total, photo) => total + (photo.votes || 0), 0);
        setStats({ uploaded: items.length, votesReceived: votes });
      })
      .catch(() => setStats({ uploaded: 0, votesReceived: 0 }));
  }, [user?.id]);

  return (
    <div className="split">
      <div className="card">
        <h2 className="section-title">Perfil</h2>
        <p className="section-subtitle">Datos reales de tu cuenta.</p>
        <img className="avatar" src={user?.avatarUrl} alt="Perfil" style={{ marginBottom: 12 }} />
        <div className="list">
          <div className="list-item">
            <span>Nombre visible</span>
            <strong>{user?.displayName}</strong>
          </div>
          <div className="list-item">
            <span>Usuario</span>
            <strong>{user?.username}</strong>
          </div>
          <div className="list-item">
            <span>Email</span>
            <strong>{user?.email}</strong>
          </div>
          <div className="list-item">
            <span>Rol</span>
            <strong>{user?.role}</strong>
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
            <span>Fotos subidas</span>
            <strong>{stats.uploaded}</strong>
          </div>
          <div className="list-item">
            <span>Votos recibidos</span>
            <strong>{stats.votesReceived}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
