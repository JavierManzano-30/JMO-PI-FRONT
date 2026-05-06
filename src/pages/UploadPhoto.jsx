import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  uploadImage, 
  createSubmission, 
  getContests, 
  getCategories, 
  getRegions 
} from '../services/supabaseService';
import { useAuth } from '../hooks/useAuth';
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Camera, 
  ArrowLeft, 
  Image as ImageIcon,
  Tag,
  MapPin,
  Trophy,
  RefreshCw
} from 'lucide-react';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_TITLE_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 500;

const s = {
  container: {
    minHeight: '100vh',
    background: '#fafafa',
    padding: '2rem',
    display: 'flex',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: '64rem',
    background: '#fff',
    borderRadius: '2rem',
    boxShadow: '0 20px 50px -12px rgba(0,0,0,0.05)',
    display: 'flex',
    overflow: 'hidden',
  },
  formSection: {
    flex: 1,
    padding: '3rem',
    borderRight: '1px solid #f1f5f9',
  },
  previewSection: {
    width: '35%',
    padding: '3rem',
    background: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  header: {
    marginBottom: '2.5rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 800,
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: '#64748b',
    marginTop: '0.5rem',
    fontSize: '0.875rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  input: {
    padding: '0.875rem 1rem',
    borderRadius: '0.75rem',
    border: '2px solid #e2e8f0',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  select: {
    padding: '0.875rem 1rem',
    borderRadius: '0.75rem',
    border: '2px solid #e2e8f0',
    fontSize: '0.875rem',
    background: '#fff',
    outline: 'none',
  },
  dropzone: (hasFile, isDragging) => ({
    border: `2px dashed ${isDragging ? '#2563eb' : (hasFile ? '#3b82f6' : '#cbd5e1')}`,
    borderRadius: '1.25rem',
    padding: hasFile ? '4px' : '2.5rem',
    textAlign: 'center',
    background: isDragging ? 'rgba(37,99,235,0.05)' : (hasFile ? 'rgba(59,130,246,0.02)' : '#fff'),
    cursor: 'pointer',
    transition: 'all 0.2s',
    transform: isDragging ? 'scale(1.02)' : 'scale(1)',
    position: 'relative',
    minHeight: '180px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  }),
  submitBtn: {
    marginTop: '1rem',
    padding: '1rem',
    borderRadius: '1rem',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    boxShadow: '0 10px 20px -5px rgba(37,99,235,0.3)',
  },
};

export function UploadPhoto() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const rawBackendUserId = user?.backendId ?? user?.id;
  const backendUserId = typeof rawBackendUserId === 'number'
    ? (Number.isInteger(rawBackendUserId) && rawBackendUserId > 0 ? rawBackendUserId : null)
    : (typeof rawBackendUserId === 'string' && /^\d+$/.test(rawBackendUserId) ? Number(rawBackendUserId) : null);
  const canWriteData = Number.isInteger(backendUserId) && backendUserId > 0;

  const [options, setOptions] = useState({ contests: [], categories: [], regions: [] });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contestId: '',
    categoryId: '',
    regionId: '',
  });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // 1. Cargar opciones básicas
  useEffect(() => {
    async function loadData() {
      try {
        const [c, cat, reg] = await Promise.all([
          getContests(), getCategories(), getRegions()
        ]);
        setOptions({ contests: c, categories: cat, regions: reg });
        if (c.length > 0) {
          setFormData(prev => ({ ...prev, contestId: String(c[0].id) }));
        }
        if (reg.length > 0) {
          setFormData(prev => ({ ...prev, regionId: prev.regionId || String(reg[0].id) }));
        }
      } catch (err) {
        console.error(err);
        setError('Error al conectar con la base de datos.');
      }
    }
    loadData();
  }, []);

  const processFile = (selected) => {
    if (!selected) return;

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError('Formato no válido. Usa JPG, PNG o WebP.');
      setFile(null);
      setPreviewUrl('');
      return;
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setError('La imagen es demasiado pesada (máx 5MB).');
      setFile(null);
      setPreviewUrl('');
      return;
    }

    setFile(selected);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
    setError('');
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canWriteData) return setError('Tu cuenta actual no está enlazada para subir fotos en esta base de datos.');
    if (!file) return setError('Es obligatorio subir una fotografía.');
    if (!formData.title) return setError('Escribe un título para tu obra.');
    if (!formData.contestId) return setError('Selecciona el concurso en el que participas.');

    setLoading(true);
    setError('');

    try {
      const publicUrl = await uploadImage(file, user?.authId || user?.id || 'guest');
      await createSubmission({
        userId: backendUserId,
        contestId: formData.contestId,
        categoryId: formData.categoryId || null,
        regionId: formData.regionId || null,
        imageUrl: publicUrl,
        title: formData.title,
        description: formData.description
      });
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.message || 'Fallo inesperado al publicar la obra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container" style={s.container}>
      <style>{`
        .upload-input:focus { border-color: #3b82f6 !important; }
        .upload-submit:hover { background: #1d4ed8 !important; transform: translateY(-2px); }
        .upload-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .back-link:hover { color: #2563eb !important; }
        .dropzone-overlay { opacity: 0; transition: opacity 0.2s; }
        .dropzone-container:hover .dropzone-overlay { opacity: 1; }

        .upload-shell {
          width: 100%;
          max-width: 64rem;
        }

        .upload-card {
          width: 100%;
        }

        .upload-form-section-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .upload-side-card {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          background: #fff;
          padding: 1.5rem;
          border-radius: 1.25rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 8px 20px -12px rgba(15, 23, 42, 0.22);
        }

        .upload-preview-title {
          margin: 0.25rem 0;
          font-size: 1.125rem;
          font-weight: 800;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 980px) {
          .upload-shell {
            max-width: 100%;
          }

          .upload-card {
            flex-direction: column;
          }

          .upload-form-pane {
            border-right: none !important;
            border-bottom: 1px solid #f1f5f9;
            padding: 2rem 1.25rem !important;
          }

          .upload-preview-pane {
            width: 100% !important;
            padding: 1.5rem 1.25rem !important;
          }
        }

        @media (max-width: 760px) {
          .upload-container {
            padding: 0.75rem !important;
          }

          .upload-card {
            border-radius: 1.1rem !important;
          }

          .upload-form-pane {
            padding: 1.15rem !important;
          }

          .upload-preview-pane {
            padding: 1rem !important;
            gap: 0.8rem !important;
          }

          .upload-form-section-grid {
            grid-template-columns: 1fr;
            gap: 0.9rem;
          }

          .upload-side-card {
            padding: 1rem;
            gap: 0.9rem;
            border-radius: 1rem;
          }

          .upload-title {
            font-size: 1.7rem !important;
          }
        }
      `}</style>
      
      <div className="upload-shell">
      <div className="upload-card" style={s.card}>
        {/* Formulario Izquierda */}
        <div className="upload-form-pane" style={s.formSection}>
          <header style={s.header}>
            <Link to="/app/dashboard" className="back-link" style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              color: '#64748b', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem' 
            }}>
              <ArrowLeft size={16} /> Volver al panel
            </Link>
            <h1 className="upload-title" style={s.title}>Publicar Obra</h1>
            <p style={s.subtitle}>Configura los detalles de tu participación.</p>
          </header>

          <form onSubmit={handleSubmit} style={s.form}>
            {/* Título y Descripción */}
            <div style={s.inputGroup}>
              <label style={s.label}>Título de la obra</label>
              <input 
                type="text" 
                className="upload-input"
                style={s.input} 
                placeholder="Ej. Luces de mi ciudad"
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value.slice(0, MAX_TITLE_LENGTH) }))}
                maxLength={MAX_TITLE_LENGTH}
                required
              />
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', textAlign: 'right' }}>{formData.title.length}/{MAX_TITLE_LENGTH}</span>
            </div>

            <div style={s.inputGroup}>
              <label style={s.label}>Descripción</label>
              <textarea 
                className="upload-input"
                style={{ ...s.input, minHeight: '80px', resize: 'vertical' }} 
                placeholder="¿Qué te inspiró a tomar esta foto?"
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value.slice(0, MAX_DESCRIPTION_LENGTH) }))}
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', textAlign: 'right' }}>{formData.description.length}/{MAX_DESCRIPTION_LENGTH}</span>
            </div>

            {/* Selectores */}
            <div className="upload-form-section-grid">
              <div style={s.inputGroup}>
                <label style={s.label}><Trophy size={14} /> Concurso</label>
                <select style={s.select} value={formData.contestId} onChange={e => setFormData(p => ({ ...p, contestId: e.target.value }))} required>
                  <option value="">Selecciona concurso</option>
                  {options.contests.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div style={s.inputGroup}>
                <label style={s.label}><Tag size={14} /> Categoría (opcional)</label>
                <select style={s.select} value={formData.categoryId} onChange={e => setFormData(p => ({ ...p, categoryId: e.target.value }))}>
                  <option value="">Sin categoría (recomendado)</option>
                  {options.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Para concursos temáticos te recomendamos dejarlo en sin categoría.
                </span>
              </div>
            </div>

            {/* Dropzone con Vista Previa Integrada */}
            <div 
              className="dropzone-container"
              style={s.dropzone(!!file, isDragging)} 
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
            >
              <input id="file-input" type="file" style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
              
              {file ? (
                <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '180px' }}>
                  <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '1rem' }} alt="Preview" />
                  <div className="dropzone-overlay" style={{ 
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                    color: '#fff', gap: '0.5rem', borderRadius: '1rem', backdropFilter: 'blur(2px)'
                  }}>
                    <RefreshCw size={32} />
                    <p style={{ fontWeight: 700 }}>Hacer clic para cambiar imagen</p>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#94a3b8' }}>
                  <Upload size={32} style={{ marginBottom: '0.5rem' }} />
                  <p style={{ fontWeight: 600 }}>{isDragging ? 'Suelta aquí' : 'Haz clic o arrastra una imagen'}</p>
                </div>
              )}
            </div>

            {error && (
              <div style={{ padding: '0.875rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <button type="submit" className="upload-submit" disabled={loading} style={s.submitBtn}>
              {loading ? 'Subiendo...' : 'Publicar Fotografía'}
            </button>
          </form>
        </div>

        {/* Resumen Derecha */}
        <div className="upload-preview-pane" style={s.previewSection}>
          <h2 style={{ ...s.label, color: '#64748b' }}>Ficha de Publicación</h2>
          
          <div className="upload-side-card">
            <div>
              <label style={s.label}>Título</label>
              <p className="upload-preview-title">{formData.title || '-'}</p>
            </div>
            <div>
              <label style={s.label}>Concurso</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                <Trophy size={14} color="#f59e0b" />
                {options.contests.find(c => String(c.id) === String(formData.contestId))?.title || 'Pendiente'}
              </div>
            </div>
            <div>
              <label style={s.label}>Región</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                <MapPin size={14} color="#3b82f6" />
                {options.regions.find(r => String(r.id) === String(formData.regionId))?.name || 'Localizando...'}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
