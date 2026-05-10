import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  User, 
  Camera, 
  MapPin, 
  Mail, 
  ArrowLeft, 
  Save, 
  ShieldCheck,
  FileUp,
  X,
  CheckCircle2
} from 'lucide-react';
import { uploadImage } from '../services/supabaseService';

const tokens = {
  colors: {
    bg: 'var(--bg-page)',
    card: 'var(--surface)',
    accent: '#2563eb',
    text: 'var(--text)',
    textMuted: 'var(--muted)',
    border: 'var(--border)',
    success: '#10b981',
    warning: '#f59e0b'
  },
  fonts: {
    display: "'Outfit', sans-serif",
  }
};

const USERNAME_MAX_LENGTH = 20;
const DISPLAY_NAME_MAX_LENGTH = 100;

function normalizeUsername(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, USERNAME_MAX_LENGTH);
}

function normalizeDisplayName(value) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, DISPLAY_NAME_MAX_LENGTH);
}

const s = {
  container: {
    maxWidth: '1000px',
    margin: '4rem auto',
    padding: '0 1.5rem',
    display: 'grid',
    gridTemplateColumns: '350px 1fr',
    gap: '3rem',
    fontFamily: tokens.fonts.display,
  },
  avatarCard: {
    background: tokens.colors.card,
    borderRadius: '2rem',
    padding: '3rem 2rem',
    textAlign: 'center',
    border: `1px solid ${tokens.colors.border}`,
    height: 'fit-content',
    boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
  },
  avatarFrame: {
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    margin: '0 auto 1.5rem',
    overflow: 'hidden',
    border: `6px solid var(--surface-soft)`,
    position: 'relative',
    background: 'var(--surface-soft)',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  formSide: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  card: {
    background: tokens.colors.card,
    borderRadius: '2rem',
    padding: '2.5rem',
    border: `1px solid ${tokens.colors.border}`,
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 800,
    color: tokens.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '0.75rem',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '1rem 1.5rem',
    borderRadius: '1rem',
    border: `2px solid ${tokens.colors.border}`,
    background: 'var(--surface-soft)',
    color: 'var(--text)',
    fontSize: '1rem',
    fontWeight: 500,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  badge: {
    padding: '0.75rem 1.25rem',
    background: 'var(--surface-soft)',
    borderRadius: '1rem',
    border: `1px solid ${tokens.colors.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: 0,
    fontSize: '0.875rem',
    color: tokens.colors.text,
    boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
  },
  btnSave: {
    background: '#0b1324',
    color: '#fff',
    padding: '1.25rem 2.5rem',
    borderRadius: '1rem',
    border: 'none',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    justifyContent: 'center',
    boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
  },
  regionRequest: {
    marginTop: '1.5rem',
    background: 'rgba(37, 99, 235, 0.08)',
    borderRadius: '1.5rem',
    padding: '1.5rem',
    border: `1px dashed ${tokens.colors.accent}`,
  }
};

export function ProfileEdit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    fullName: user?.full_name || '',
    avatarUrl: user?.avatar_url || '',
    regionName: user?.regionName || 'Buscando...'
  });
  const [loading, setLoading] = useState(!user);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.avatar_url || '');

  // Estado para la solicitud de cambio de región
  const [showRegionRequest, setShowRegionRequest] = useState(false);
  const [docFile, setDocFile] = useState(null);
  const [docPreview, setDocPreview] = useState(null);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        fullName: user.full_name || '',
        avatarUrl: user.avatar_url || '',
        regionName: user.regionName || 'Sin región'
      });
      setPreviewUrl(user.avatar_url || '');
      setLoading(false);
    }
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDocChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocFile(file);
      setDocPreview(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const sanitizedUsername = normalizeUsername(profileData.username);
      const sanitizedDisplayName = normalizeDisplayName(profileData.fullName);

      if (sanitizedUsername.length < 3) {
        setFormError('El nombre de usuario debe tener entre 3 y 50 caracteres.');
        return;
      }

      if (!sanitizedDisplayName) {
        setFormError('El alias no puede estar vacío.');
        return;
      }

      setFormError('');

      let finalAvatarUrl = profileData.avatarUrl;
      if (avatarFile) {
        finalAvatarUrl = await uploadImage(avatarFile, user.id);
      }

      const numericUserId = Number.isInteger(user?.backendId) && user.backendId > 0 ? user.backendId : null;
      const canUpdateBackendUser = Number.isInteger(numericUserId) && numericUserId > 0;

      // 1. Si el usuario está enlazado con el backend (id numérica), actualizamos su registro.
      if (canUpdateBackendUser) {
        const { error: dbError } = await supabase
          .from('users')
          .update({
            username: sanitizedUsername,
            display_name: sanitizedDisplayName,
            avatar_url: finalAvatarUrl
          })
          .eq('id', numericUserId);

        if (dbError) throw dbError;
      }

      // 2. Actualizamos los metadatos de Auth (Sistema)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          username: sanitizedUsername,
          full_name: sanitizedDisplayName,
          avatar_url: finalAvatarUrl
        }
      });

      if (authError) throw authError;

      // 3. Si hay un documento de región, lo simulamos/guardamos (puedes ampliar esto con una tabla de requests)
      if (docFile) {
        await uploadImage(docFile, `doc-${user.id}`);
        // Aquí iría la lógica para insertar en 'region_requests'
      }

      navigate('/app/profile');
    } catch (err) {
      console.error(err);
      alert('Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '10rem', color: 'var(--text)' }}>Cargando datos maestros...</div>;

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', color: 'var(--text)' }}>
      <nav style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <Link to="/app/profile" className="back-link">
          <ArrowLeft size={18} /> Volver
        </Link>
      </nav>

      <main style={s.container}>
        {/* Columna Izquierda: Avatar */}
        <div style={s.avatarCard}>
          <label style={{ ...s.avatarFrame, cursor: 'pointer', display: 'block', margin: '0 auto 1.5rem' }}>
            {previewUrl ? (
              <img src={previewUrl} style={s.image} alt="Preview" />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={80} color="#cbd5e1" />
              </div>
            )}
            <div style={{ 
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 0.2s',
            }} className="avatar-overlay">
              <Camera size={32} color="#fff" />
            </div>
            <input type="file" style={{ display: 'none' }} onChange={handleFileChange} />
          </label>
          
          <style>{`
            label:hover .avatar-overlay { opacity: 1 !important; }
          `}</style>

          <h2
            title={profileData.username ? `@${normalizeUsername(profileData.username)}` : undefined}
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              margin: '0 0 0.5rem',
              color: 'var(--text)',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {profileData.username ? `@${normalizeUsername(profileData.username)}` : 'Configura tu usuario'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: tokens.colors.textMuted, margin: 0 }}>Visualiza cómo te verán los demás.</p>
        </div>

        {/* Columna Derecha: Formulario */}
        <form onSubmit={handleSubmit} style={s.formSide}>
          <div style={s.card}>
            <div style={{ marginBottom: '2rem' }}>
              <label style={s.label}>Nombre de usuario</label>
              <input 
                style={s.input} 
                value={profileData.username} 
                onChange={e => setProfileData({...profileData, username: normalizeUsername(e.target.value)})}
                placeholder="ej: javier_dev"
                minLength={3}
                maxLength={USERNAME_MAX_LENGTH}
                autoComplete="username"
              />
              <div style={{ marginTop: '0.45rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', color: tokens.colors.textMuted, fontSize: '0.78rem' }}>
                <span>Solo letras, números y guion bajo.</span>
                <span>{profileData.username.length}/{USERNAME_MAX_LENGTH}</span>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={s.label}>Nombre completo o Alias</label>
              <input 
                style={s.input} 
                value={profileData.fullName} 
                onChange={e => setProfileData({...profileData, fullName: e.target.value.slice(0, DISPLAY_NAME_MAX_LENGTH)})}
                placeholder="Tu nombre real o artístico"
                maxLength={DISPLAY_NAME_MAX_LENGTH}
              />
              <div style={{ marginTop: '0.45rem', textAlign: 'right', color: tokens.colors.textMuted, fontSize: '0.78rem' }}>
                {profileData.fullName.length}/{DISPLAY_NAME_MAX_LENGTH}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', margin: '2rem 0', pt: '2rem' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              <div style={s.badge}>
                <Mail size={16} color={tokens.colors.textMuted} />
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user?.email}>
                  {user?.email}
                </span>
              </div>
              <div style={{ ...s.badge, justifyContent: 'space-between', flex: 1, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                  <MapPin size={16} color={tokens.colors.accent} style={{ flex: '0 0 auto' }} />
                  <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={profileData.regionName}>
                    {profileData.regionName}
                  </span>
                </div>
                {!showRegionRequest && (
                  <button 
                    type="button" 
                    onClick={() => setShowRegionRequest(true)}
                    style={{ background: 'none', border: 'none', color: tokens.colors.accent, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>
                    Solicitar traslado
                  </button>
                )}
              </div>
            </div>

            {/* Zona de solicitud de cambio de región */}
            {showRegionRequest && (
              <div style={s.regionRequest}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: tokens.colors.accent }}>
                    <ShieldCheck size={18} />
                    <span style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Solicitud de Validación</span>
                  </div>
                  <button type="button" onClick={() => setShowRegionRequest(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={18} color={tokens.colors.textMuted} />
                  </button>
                </div>
                
                {!requestSent ? (
                  <>
                    <p style={{ fontSize: '0.85rem', color: tokens.colors.textMuted, marginBottom: '1rem', lineHeight: 1.5 }}>
                      Para cambiar de Comunidad Autónoma, necesitamos verificar tu nueva residencia. Sube una foto de tu <strong>DNI</strong> o <strong>Certificado de Empadronamiento</strong>.
                    </p>
                    <label style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                      padding: '1.25rem', border: `2px dashed ${tokens.colors.accent}`, borderRadius: '1rem',
                      cursor: 'pointer', background: 'var(--surface-soft)', color: tokens.colors.accent, fontWeight: 700
                    }}>
                      <FileUp size={20} />
                      {docPreview ? docPreview : 'Seleccionar Documento'}
                      <input type="file" style={{ display: 'none' }} onChange={handleDocChange} />
                    </label>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <CheckCircle2 size={40} color={tokens.colors.success} style={{ marginBottom: '1rem' }} />
                    <p style={{ fontWeight: 700, color: tokens.colors.text, margin: 0 }}>Documento enviado con éxito</p>
                    <p style={{ fontSize: '0.8rem', color: tokens.colors.textMuted }}>Nuestro equipo lo revisará en las próximas 24h.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {formError && (
            <p style={{ margin: '0.85rem 0 0', color: '#ef4444', fontSize: '0.9rem', fontWeight: 700 }}>
              {formError}
            </p>
          )}

          <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '1.5rem', borderRadius: '1.5rem', border: `1px solid rgba(37, 99, 235, 0.25)` }}>
            <p style={{ fontSize: '0.9rem', color: tokens.colors.accent, lineHeight: 1.6, margin: 0 }}>
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Recordatorio:</strong> 
              Los cambios que realices aquí se verán reflejados inmediatamente en todas tus fotografías publicadas y en tus votos activos.
            </p>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            style={{ ...s.btnSave, opacity: saving ? 0.7 : 1 }}>
            <Save size={20} />
            {saving ? 'Guardando cambios...' : 'Guardar Perfil'}
          </button>
        </form>
      </main>
    </div>
  );
}
