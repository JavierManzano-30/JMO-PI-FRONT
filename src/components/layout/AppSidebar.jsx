import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Camera,
  Compass,
  LogIn,
  LogOut,
  MessageCircle,
  Moon,
  PlusSquare,
  Sun,
  Trophy,
  User,
  Shield,
} from 'lucide-react';
import { Brand } from './Brand.jsx';

const iconMap = {
  Galería: Compass,
  Concursos: Trophy,
  Acceso: LogIn,
  Chat: MessageCircle,
  'Subir foto': PlusSquare,
  Perfil: User,
  Admin: Shield,
};

function sidebarClass({ isActive }) {
  return isActive ? 'app-sidebar-link is-active' : 'app-sidebar-link';
}

export function AppSidebar({ homeTo, items = [], user, authActions = [], onLogout, theme = 'light', onToggleTheme }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [suppressHover, setSuppressHover] = useState(false);
  const username = user?.username || user?.user_metadata?.username || 'usuario';
  const avatarUrl = user?.avatar_url || user?.user_metadata?.avatar_url;
  const isDark = theme === 'dark';
  const isAuthenticated = Boolean(user);
  const navigationItems = items.filter((item) => item.label !== 'Perfil');

  const expandSidebar = () => {
    if (!suppressHover) setIsExpanded(true);
  };

  const collapseSidebar = () => {
    setIsExpanded(false);
    setSuppressHover(false);
  };

  const collapseAfterNavigation = () => {
    setIsExpanded(false);
    setSuppressHover(true);
  };

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      collapseSidebar();
    }
  };

  return (
    <aside
      className={`app-sidebar ${isExpanded ? 'is-expanded' : ''}`}
      aria-label="Navegación de la aplicación"
      onMouseEnter={expandSidebar}
      onMouseLeave={collapseSidebar}
      onFocus={expandSidebar}
      onBlur={handleBlur}
    >
      <div className="app-sidebar-brand">
        <Brand to={homeTo} />
      </div>

      <nav className="app-sidebar-nav">
        {navigationItems.map((item) => {
          const Icon = iconMap[item.label] || Camera;
          return (
            <NavLink
              key={item.to}
              className={sidebarClass}
              to={item.to}
              end={Boolean(item.end)}
              aria-label={item.label}
              onClick={collapseAfterNavigation}
            >
              <Icon size={22} strokeWidth={2.2} />
              <span className="app-sidebar-label">{item.label}</span>
              {item.badgeCount > 0 && <span className="app-sidebar-badge" aria-label={`${item.badgeCount} mensajes no leídos`} />}
            </NavLink>
          );
        })}
      </nav>

      <div className="app-sidebar-footer">
        {isAuthenticated ? (
          <NavLink className={sidebarClass} to="/app/profile" aria-label="Perfil" onClick={collapseAfterNavigation}>
            <span className="app-sidebar-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" />
              ) : (
                username.charAt(0).toUpperCase()
              )}
            </span>
            <span className="app-sidebar-label">Perfil</span>
          </NavLink>
        ) : (
          authActions.map((action) => (
            <NavLink
              key={action.to}
              className={`app-sidebar-link ${action.variant === 'primary' ? 'app-sidebar-link-primary' : ''}`}
              to={action.to}
              aria-label={action.label}
              onClick={collapseAfterNavigation}
            >
              {action.variant === 'primary' ? <User size={22} strokeWidth={2.2} /> : <LogIn size={22} strokeWidth={2.2} />}
              <span className="app-sidebar-label">{action.label}</span>
            </NavLink>
          ))
        )}

        <button
          type="button"
          className="app-sidebar-link app-sidebar-button"
          onClick={onToggleTheme}
          aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
        >
          {isDark ? <Sun size={22} strokeWidth={2.2} /> : <Moon size={22} strokeWidth={2.2} />}
          <span className="app-sidebar-label">{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
        </button>

        {isAuthenticated && (
          <button
            type="button"
            className="app-sidebar-link app-sidebar-button"
            onClick={onLogout}
            aria-label="Cerrar sesión"
          >
            <LogOut size={22} strokeWidth={2.2} />
            <span className="app-sidebar-label">Cerrar sesión</span>
          </button>
        )}
      </div>
    </aside>
  );
}
