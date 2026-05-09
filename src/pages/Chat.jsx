import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  getChatContacts,
  getConversationMessages,
  sendDirectMessage,
  searchUsers,
  getUserById,
  subscribeToConversation,
  getSubmissionById,
} from '../services/supabaseService';
import { ArrowLeft, MessageCircle, Search, Send, X } from 'lucide-react';

function parsePositiveInt(value) {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return null;
}

function getUserName(profile) {
  if (!profile) return 'Participante';
  return profile.username || profile.display_name || `usuario_${profile.id}`;
}

function formatHour(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function parseSharedPhotoMessage(content) {
  const text = String(content || '');
  const markerMatch = text.match(/__shared_photo__:(\d+)/);
  if (markerMatch) {
    const photoId = parsePositiveInt(markerMatch[1]);
    const titleMatch = text.match(/📸\s+([^\n]+)/);
    const linkMatch = text.match(/https?:\/\/[^\s]+\/photos\/\d+/);
    return {
      photoId,
      title: titleMatch?.[1]?.trim() || 'Publicación compartida',
      url: linkMatch?.[0] || null,
      path: photoId ? `/photos/${photoId}` : null,
      plainText: text.replace(/__shared_photo__:\d+\s*/g, '').trim(),
    };
  }

  const oldMatch = text.match(/📸\s+([^\n]+)\n(https?:\/\/[^\s]+\/photos\/(\d+))/);
  if (oldMatch) {
    return {
      photoId: parsePositiveInt(oldMatch[3]),
      title: oldMatch[1].trim(),
      url: oldMatch[2],
      path: parsePositiveInt(oldMatch[3]) ? `/photos/${parsePositiveInt(oldMatch[3])}` : null,
      plainText: text.replace(oldMatch[0], '').trim(),
    };
  }

  return null;
}

export function Chat() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const currentUserId = useMemo(() => parsePositiveInt(user?.backendId ?? user?.id), [user?.backendId, user?.id]);
  const prefUserId = useMemo(() => parsePositiveInt(params.get('user')), [params]);
  const sharePhotoId = useMemo(() => parsePositiveInt(params.get('share')), [params]);

  const [contacts, setContacts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 980px)').matches);
  const [mobileScreen, setMobileScreen] = useState('list');
  const [sharedPost, setSharedPost] = useState(null);
  const [sharedPreviewById, setSharedPreviewById] = useState({});
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'light');

  const messagesContainerRef = useRef(null);
  const previousMessagesCountRef = useRef(0);
  const activeConversationRef = useRef('');
  const isDark = theme === 'dark';
  const colors = useMemo(() => ({
    pageBg: isDark ? '#0b1220' : '#f8fafc',
    panelBg: isDark ? '#111b2e' : '#fff',
    panelSoft: isDark ? '#18253c' : '#f8fafc',
    border: isDark ? '#2a3a56' : '#e2e8f0',
    borderSoft: isDark ? '#22314a' : '#f1f5f9',
    text: isDark ? '#e6eefb' : '#0f172a',
    muted: isDark ? '#9db0cf' : '#64748b',
    inputBg: isDark ? '#0f182a' : '#fff',
    inputDisabledBg: isDark ? '#131f33' : '#f8fafc',
    incomingBg: isDark ? '#18253c' : '#fff',
  }), [isDark]);

  const refreshContacts = useCallback(
    async ({ showLoader = false } = {}) => {
      if (!currentUserId) return [];

      if (showLoader) setLoadingContacts(true);
      try {
        const data = await getChatContacts(currentUserId);
        const nextContacts = data || [];
        setContacts(nextContacts);
        return nextContacts;
      } catch (err) {
        console.error('No se pudieron cargar contactos:', err);
        setContacts([]);
        return [];
      } finally {
        if (showLoader) setLoadingContacts(false);
      }
    },
    [currentUserId]
  );

  const bumpContact = useCallback((userId, profile, interactionAt) => {
    const parsedUserId = parsePositiveInt(userId);
    if (!parsedUserId) return;

    setContacts((prev) => {
      const existing = prev.find((item) => item.id === parsedUserId) || null;
      const merged = {
        ...(existing || {}),
        ...(profile || {}),
        id: parsedUserId,
        last_interaction_at: interactionAt || existing?.last_interaction_at || null,
      };
      const rest = prev.filter((item) => item.id !== parsedUserId);
      return [merged, ...rest];
    });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    refreshContacts({ showLoader: true });
  }, [currentUserId, refreshContacts]);

  useEffect(() => {
    if (isMobile || selectedUser?.id || prefUserId || loadingContacts) return;
    if (contacts.length > 0) setSelectedUser(contacts[0]);
  }, [contacts, isMobile, loadingContacts, prefUserId, selectedUser?.id]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 980px)');
    const onChange = (event) => setIsMobile(event.matches);
    media.addEventListener('change', onChange);
    setIsMobile(media.matches);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setMobileScreen('chat');
      return;
    }
    if (prefUserId) {
      setMobileScreen('chat');
      return;
    }
    setMobileScreen('list');
  }, [isMobile, prefUserId]);

  useEffect(() => {
    if (!currentUserId || !prefUserId || prefUserId === currentUserId) return;

    async function preloadPreferredUser() {
      try {
        const target = await getUserById(prefUserId);
        if (!target) return;

        setSelectedUser(target);
        if (isMobile) setMobileScreen('chat');
        setContacts((prev) => {
          if (prev.some((c) => c.id === target.id)) return prev;
          return [target, ...prev];
        });
      } catch (err) {
        console.error('No se pudo cargar usuario de chat preferido:', err);
      }
    }

    preloadPreferredUser();
  }, [currentUserId, isMobile, prefUserId]);

  useEffect(() => {
    if (!sharePhotoId) {
      setSharedPost(null);
      return;
    }

    let cancelled = false;
    async function loadSharedPost() {
      try {
        const post = await getSubmissionById(sharePhotoId);
        if (!cancelled) setSharedPost(post || { id: sharePhotoId });
      } catch (error) {
        console.error('No se pudo cargar la publicación a compartir:', error);
        if (!cancelled) setSharedPost({ id: sharePhotoId });
      }
    }

    loadSharedPost();
    return () => {
      cancelled = true;
    };
  }, [sharePhotoId]);

  useEffect(() => {
    if (!currentUserId || !selectedUser?.id) {
      activeConversationRef.current = '';
      setMessages([]);
      setLoadingConversation(false);
      previousMessagesCountRef.current = 0;
      return;
    }

    let isCancelled = false;
    const conversationKey = `${currentUserId}:${selectedUser.id}`;
    activeConversationRef.current = conversationKey;
    setLoadingConversation(true);
    setMessages([]);

    async function loadConversation() {
      try {
        const data = await getConversationMessages(currentUserId, selectedUser.id);
        if (!isCancelled && activeConversationRef.current === conversationKey) {
          setMessages(data || []);
        }
      } catch (err) {
        console.error('No se pudo cargar la conversación:', err);
        if (!isCancelled && activeConversationRef.current === conversationKey) setMessages([]);
      } finally {
        if (!isCancelled && activeConversationRef.current === conversationKey) setLoadingConversation(false);
      }
    }

    loadConversation();

    const unsubscribe = subscribeToConversation(currentUserId, selectedUser.id, (message) => {
      if (activeConversationRef.current !== conversationKey) return;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      bumpContact(selectedUser.id, selectedUser, message.created_at);
    });

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, [bumpContact, currentUserId, selectedUser?.id]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const behavior = previousMessagesCountRef.current === 0 ? 'auto' : 'smooth';
    container.scrollTo({ top: container.scrollHeight, behavior });
    previousMessagesCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (!currentUserId) return;

    const normalized = String(search || '').trim();
    if (normalized.length < 2) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;

    async function runSearch() {
      try {
        const results = await searchUsers(normalized, { excludeUserId: currentUserId, limit: 12 });
        if (!cancelled) setSearchResults(results || []);
      } catch (err) {
        console.error('No se pudo buscar usuarios:', err);
        if (!cancelled) setSearchResults([]);
      }
    }

    runSearch();

    return () => {
      cancelled = true;
    };
  }, [search, currentUserId]);

  useEffect(() => {
    const onThemeChange = (event) => {
      const next = event?.detail || document.documentElement.getAttribute('data-theme') || 'light';
      setTheme(next);
    };
    window.addEventListener('snapnation:theme-change', onThemeChange);
    return () => window.removeEventListener('snapnation:theme-change', onThemeChange);
  }, []);

  useEffect(() => {
    const ids = new Set();
    messages.forEach((message) => {
      const parsed = parseSharedPhotoMessage(message?.content);
      if (parsed?.photoId && !sharedPreviewById[parsed.photoId]) ids.add(parsed.photoId);
    });
    if (ids.size === 0) return;

    let cancelled = false;
    async function loadMissingSharedPreviews() {
      const entries = await Promise.all(
        [...ids].map(async (id) => {
          try {
            const post = await getSubmissionById(id);
            return [id, post || null];
          } catch {
            return [id, null];
          }
        })
      );
      if (cancelled) return;
      setSharedPreviewById((prev) => {
        const next = { ...prev };
        entries.forEach(([id, post]) => {
          next[id] = post;
        });
        return next;
      });
    }

    loadMissingSharedPreviews();
    return () => {
      cancelled = true;
    };
  }, [messages, sharedPreviewById]);

  const handleSelectUser = (profile) => {
    if (!profile?.id) return;
    setSelectedUser(profile);
    if (isMobile) setMobileScreen('chat');
    setContacts((prev) => {
      if (prev.some((item) => item.id === profile.id)) return prev;
      return [profile, ...prev];
    });
  };

  const clearShareParam = useCallback(() => {
    const next = new URLSearchParams(params);
    next.delete('share');
    setParams(next, { replace: true });
  }, [params, setParams]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!currentUserId || !selectedUser?.id || sending) return;

    const targetUser = selectedUser;
    const targetUserId = targetUser.id;
    const normalized = draft.trim();
    const sharedLink = sharePhotoId ? `${window.location.origin}/photos/${sharePhotoId}` : '';
    const sharedCaption = sharedPost?.title ? `📸 ${sharedPost.title}` : '📸 Mira esta publicación';
    const sharePayload = sharePhotoId ? `__shared_photo__:${sharePhotoId}\n${sharedCaption}\n${sharedLink}` : '';
    const messageToSend = normalized && sharePayload ? `${normalized}\n\n${sharePayload}` : (normalized || sharePayload);
    if (!messageToSend.trim()) return;

    setSending(true);
    try {
      const created = await sendDirectMessage(currentUserId, targetUserId, messageToSend);
      const expectedConversationKey = `${currentUserId}:${targetUserId}`;
      if (activeConversationRef.current === expectedConversationKey) {
        setMessages((prev) => (prev.some((m) => m.id === created.id) ? prev : [...prev, created]));
      }
      setDraft('');
      if (sharePhotoId) {
        setSharedPost(null);
        clearShareParam();
      }
      bumpContact(targetUserId, targetUser, created.created_at);
      refreshContacts();
    } catch (err) {
      console.error('No se pudo enviar mensaje:', err);
    } finally {
      setSending(false);
    }
  };

  const isMobileConversationView = isMobile && mobileScreen === 'chat' && selectedUser;

  const handleBackToChatList = () => {
    setMobileScreen('list');
    setParams((previousParams) => {
      const nextParams = new URLSearchParams(previousParams);
      nextParams.delete('user');
      nextParams.delete('share');
      return nextParams;
    }, { replace: true });
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.pageBg, padding: '1.5rem', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .chat-grid {
          display: grid;
          grid-template-columns: 320px minmax(0, 1fr);
          gap: 1rem;
          height: min(78vh, 760px);
          min-height: 520px;
          align-items: stretch;
        }
        .chat-sidebar,
        .chat-main,
        .chat-sidebar-list,
        .chat-messages {
          min-height: 0;
        }
        @media (max-width: 980px) {
          .chat-grid {
            grid-template-columns: 1fr;
            height: auto;
            min-height: 0;
          }
          .chat-sidebar {
            max-height: 75vh;
          }
          .chat-main {
            height: 75vh;
            min-height: 75vh !important;
          }
          .chat-main.mobile-hidden,
          .chat-sidebar.mobile-hidden {
            display: none !important;
          }
        }
      `}</style>
      <header style={{ maxWidth: '1160px', margin: '0 auto 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {isMobileConversationView ? (
          <button type="button" className="back-link" onClick={handleBackToChatList}>
            <ArrowLeft size={18} /> Volver
          </button>
        ) : (
          <Link to="/app/dashboard" className="back-link">
            <ArrowLeft size={18} /> Volver al panel
          </Link>
        )}
        <h1 style={{ margin: 0, fontSize: '1.4rem', color: colors.text }}>Chat</h1>
      </header>

      <section className="chat-grid" style={{ maxWidth: '1160px', margin: '0 auto' }}>
        <aside className={`chat-sidebar ${isMobile && mobileScreen === 'chat' ? 'mobile-hidden' : ''}`} style={{ background: colors.panelBg, borderRadius: '1rem', border: `1px solid ${colors.border}`, overflow: 'hidden', display: 'grid', gridTemplateRows: 'auto auto minmax(0, 1fr)' }}>
          {isMobile && (
            <div style={{ padding: '0.8rem 1rem 0.4rem', borderBottom: `1px solid ${colors.borderSoft}` }}>
              <p style={{ margin: 0, fontWeight: 900, color: colors.text }}>Mensajes</p>
            </div>
          )}
          <div style={{ padding: '1rem', borderBottom: `1px solid ${colors.borderSoft}`, minHeight: '76px', boxSizing: 'border-box' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${colors.border}`, borderRadius: '0.65rem', padding: '0.55rem 0.7rem 0.55rem 2rem', outline: 'none', background: colors.inputBg, color: colors.text }}
              />
            </div>
          </div>

          {searchResults.length > 0 && (
            <div style={{ borderBottom: `1px solid ${colors.borderSoft}`, padding: '0.6rem 0.8rem', display: 'grid', gap: '0.35rem', maxHeight: '180px', overflowY: 'auto' }}>
              {searchResults.map((candidate) => (
                <button
                  key={`search-${candidate.id}`}
                  type="button"
                  onClick={() => handleSelectUser(candidate)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textAlign: 'left',
                    border: `1px solid ${colors.border}`,
                    background: colors.panelSoft,
                    borderRadius: '0.6rem',
                    padding: '0.5rem',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {candidate.avatar_url ? <img src={candidate.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontWeight: 700, color: '#475569' }}>{getUserName(candidate).charAt(0).toUpperCase()}</span>}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{getUserName(candidate)}</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: colors.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{candidate.display_name || 'Participante'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="chat-sidebar-list" style={{ overflowY: 'auto', display: 'grid', alignContent: 'start' }}>
            {loadingContacts ? (
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem', padding: '1rem' }}>
                Cargando conversaciones...
              </p>
            ) : contacts.length === 0 ? (
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem', padding: '1rem' }}>
                No hay conversaciones todavía.
              </p>
            ) : (
              contacts.map((contact) => {
                const active = selectedUser?.id === contact.id;
                return (
                  <button
                    key={`contact-${contact.id}`}
                    type="button"
                    onClick={() => handleSelectUser(contact)}
                    style={{
                      display: 'flex',
                      width: '100%',
                      alignItems: 'center',
                      gap: '0.65rem',
                      border: 'none',
                      borderBottom: `1px solid ${colors.borderSoft}`,
                      background: active ? (isDark ? '#213252' : '#eff6ff') : colors.panelBg,
                      padding: '0.75rem 0.8rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {contact.avatar_url ? <img src={contact.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontWeight: 700, color: '#475569' }}>{getUserName(contact).charAt(0).toUpperCase()}</span>}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{getUserName(contact)}</p>
                      <p style={{ margin: '0.1rem 0 0', fontSize: '0.73rem', color: colors.muted }}>{formatHour(contact.last_interaction_at)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <article className={`chat-main ${isMobile && mobileScreen !== 'chat' ? 'mobile-hidden' : ''}`} style={{ background: colors.panelBg, borderRadius: '1rem', border: `1px solid ${colors.border}`, display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr) auto', height: '100%' }}>
          <header style={{ padding: '1rem', borderBottom: `1px solid ${colors.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', minHeight: '76px', boxSizing: 'border-box' }}>
            {selectedUser ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  {isMobile && (
                    <button
                      type="button"
                      onClick={() => setMobileScreen('list')}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: 0, display: 'inline-flex', alignItems: 'center' }}
                      aria-label="Volver a mensajes"
                    >
                      <ArrowLeft size={18} />
                    </button>
                  )}
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontWeight: 700, color: '#475569' }}>{getUserName(selectedUser).charAt(0).toUpperCase()}</span>}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: colors.text }}>@{getUserName(selectedUser)}</p>
                    <p style={{ margin: 0, fontSize: '0.74rem', color: colors.muted }}>{selectedUser.display_name || 'Participante'}</p>
                  </div>
                </div>
                <Link to={`/app/users/${selectedUser.id}`} style={{ textDecoration: 'none', color: '#2563eb', fontSize: '0.84rem', fontWeight: 700 }}>
                  Ver perfil
                </Link>
              </>
            ) : (
              <p style={{ margin: 0, color: '#64748b' }}>Selecciona un usuario para empezar a chatear.</p>
            )}
          </header>

          <div ref={messagesContainerRef} className="chat-messages" style={{ padding: '1rem', overflowY: 'auto', background: colors.panelSoft, display: 'flex', flexDirection: 'column' }}>
            {!selectedUser ? (
              <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#64748b' }}>
                <div style={{ textAlign: 'center' }}>
                  <MessageCircle size={34} color="#94a3b8" />
                  <p style={{ marginTop: '0.6rem' }}>Busca un usuario o abre una conversación.</p>
                </div>
              </div>
            ) : loadingConversation ? (
              <p style={{ color: '#64748b', margin: 0 }}>Cargando conversación...</p>
            ) : messages.length === 0 ? (
              <p style={{ color: '#64748b', margin: 'auto 0 0' }}>No hay mensajes aún. Escribe el primero.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {messages.map((message) => {
                  const mine = message.sender_id === currentUserId;
                  const shared = parseSharedPhotoMessage(message.content);
                  const sharedPreview = shared?.photoId ? sharedPreviewById[shared.photoId] : null;
                  return (
                    <div key={message.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '75%', background: mine ? '#2563eb' : colors.incomingBg, color: mine ? '#fff' : colors.text, border: mine ? '1px solid #2563eb' : `1px solid ${colors.border}`, borderRadius: '0.85rem', padding: '0.55rem 0.7rem' }}>
                        {shared ? (
                          <div style={{ display: 'grid', gap: '0.45rem' }}>
                            {shared.plainText && (
                              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.35, whiteSpace: 'pre-wrap' }}>{shared.plainText}</p>
                            )}
                            <Link
                              to={shared.path || `/photos/${shared.photoId}`}
                              style={{
                                textDecoration: 'none',
                                color: mine ? '#fff' : '#0f172a',
                                background: mine ? 'rgba(255,255,255,0.14)' : '#f8fafc',
                                border: mine ? '1px solid rgba(255,255,255,0.26)' : '1px solid #e2e8f0',
                                borderRadius: '0.8rem',
                                overflow: 'hidden',
                                display: 'grid',
                              }}
                            >
                              {sharedPreview?.image_url && (
                                <img
                                  src={sharedPreview.image_url}
                                  alt={shared.title}
                                  style={{ width: '100%', height: '170px', objectFit: 'cover', display: 'block' }}
                                />
                              )}
                              <div style={{ padding: '0.55rem 0.65rem' }}>
                                <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800 }}>📸 {shared.title}</p>
                                <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', opacity: mine ? 0.85 : 0.6 }}>
                                  Ver publicación
                                </p>
                              </div>
                            </Link>
                          </div>
                        ) : (
                          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.35, whiteSpace: 'pre-wrap' }}>{message.content}</p>
                        )}
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.68rem', opacity: mine ? 0.8 : 0.55, textAlign: 'right' }}>{formatHour(message.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleSend} style={{ borderTop: `1px solid ${colors.borderSoft}`, padding: '0.8rem', display: 'grid', gap: '0.5rem' }}>
            {sharedPost && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.7rem', padding: '0.45rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '100%' }}>
                <span style={{ fontSize: '0.76rem', color: '#1e3a8a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Compartiendo: {sharedPost?.title || `Publicación #${sharePhotoId}`}
                </span>
                <button type="button" onClick={() => { setSharedPost(null); clearShareParam(); }} style={{ border: 'none', background: 'transparent', color: '#1e3a8a', padding: 0, cursor: 'pointer' }} aria-label="Quitar publicación compartida">
                  <X size={14} />
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.55rem' }}>
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={selectedUser ? (sharedPost ? 'Añade un texto opcional...' : 'Escribe un mensaje...') : 'Selecciona un usuario para escribir'}
                disabled={!selectedUser || sending}
                maxLength={2000}
                style={{
                  flex: 1,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '0.7rem',
                  padding: '0.65rem 0.8rem',
                  outline: 'none',
                  background: !selectedUser ? colors.inputDisabledBg : colors.inputBg,
                  color: colors.text,
                }}
              />
              <button
                type="submit"
                disabled={!selectedUser || sending || (!draft.trim() && !sharePhotoId)}
                style={{
                  border: 'none',
                  borderRadius: '0.7rem',
                  padding: '0.65rem 0.9rem',
                  background: '#2563eb',
                  color: '#fff',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: !selectedUser || sending || (!draft.trim() && !sharePhotoId) ? 'not-allowed' : 'pointer',
                  opacity: !selectedUser || sending || (!draft.trim() && !sharePhotoId) ? 0.6 : 1,
                }}
              >
                <Send size={15} /> Enviar
              </button>
            </div>
          </form>
        </article>
      </section>
    </div>
  );
}
