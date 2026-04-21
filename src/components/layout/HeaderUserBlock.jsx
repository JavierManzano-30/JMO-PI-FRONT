import React from 'react';
import { Link } from 'react-router-dom';

export function HeaderUserBlock({ user, onLogout }) {
  const isAdmin = user?.role === 'admin';
  // Gracias a la hidratación en AuthContext, estas propiedades vienen directas de la tabla profiles
  const avatarUrl = user?.avatar_url || user?.user_metadata?.avatar_url;
  const username = user?.username || user?.user_metadata?.username || 'usuario';

  return (
    <div className="top-actions top-actions-authenticated">
      <Link to="/app/profile" className="user-chip" title="Ver perfil">
        <div className="avatar-header-frame" style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {avatarUrl ? (
            <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
          ) : (
            <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', color: '#64748b', fontSize: '0.7rem', fontWeight: 700 }}>
              {username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <span>
          <strong style={{ fontSize: '0.9rem' }}>@{username}</strong>
        </span>
      </Link>
      {isAdmin && <span className="role-chip">Admin</span>}
      <button className="btn btn-ghost" type="button" onClick={onLogout}>
        Cerrar sesión
      </button>
    </div>
  );
}
