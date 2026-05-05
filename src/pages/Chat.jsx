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
} from '../services/supabaseService';
import { ArrowLeft, MessageCircle, Search, Send } from 'lucide-react';

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

export function Chat() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const currentUserId = useMemo(() => parsePositiveInt(user?.backendId ?? user?.id), [user?.backendId, user?.id]);
  const prefUserId = useMemo(() => parsePositiveInt(params.get('user')), [params]);

  const [contacts, setContacts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesContainerRef = useRef(null);
  const previousMessagesCountRef = useRef(0);
  const activeConversationRef = useRef('');

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
    if (selectedUser?.id || prefUserId || loadingContacts) return;
    if (contacts.length > 0) setSelectedUser(contacts[0]);
  }, [contacts, loadingContacts, prefUserId, selectedUser?.id]);

  useEffect(() => {
    if (!currentUserId || !prefUserId || prefUserId === currentUserId) return;

    async function preloadPreferredUser() {
      try {
        const target = await getUserById(prefUserId);
        if (!target) return;

        setSelectedUser(target);
        setContacts((prev) => {
          if (prev.some((c) => c.id === target.id)) return prev;
          return [target, ...prev];
        });
      } catch (err) {
        console.error('No se pudo cargar usuario de chat preferido:', err);
      }
    }

    preloadPreferredUser();
  }, [currentUserId, prefUserId]);

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

  const handleSelectUser = (profile) => {
    if (!profile?.id) return;
    setSelectedUser(profile);
    setContacts((prev) => {
      if (prev.some((item) => item.id === profile.id)) return prev;
      return [profile, ...prev];
    });
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!currentUserId || !selectedUser?.id || sending) return;

    const targetUser = selectedUser;
    const targetUserId = targetUser.id;
    const normalized = draft.trim();
    if (!normalized) return;

    setSending(true);
    try {
      const created = await sendDirectMessage(currentUserId, targetUserId, normalized);
      const expectedConversationKey = `${currentUserId}:${targetUserId}`;
      if (activeConversationRef.current === expectedConversationKey) {
        setMessages((prev) => (prev.some((m) => m.id === created.id) ? prev : [...prev, created]));
      }
      setDraft('');
      bumpContact(targetUserId, targetUser, created.created_at);
      refreshContacts();
    } catch (err) {
      console.error('No se pudo enviar mensaje:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem', fontFamily: "'Inter', sans-serif" }}>
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
            max-height: 40vh;
          }
          .chat-main {
            height: 58vh;
            min-height: 58vh !important;
          }
        }
      `}</style>
      <header style={{ maxWidth: '1160px', margin: '0 auto 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/app/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#64748b', textDecoration: 'none', fontWeight: 700 }}>
          <ArrowLeft size={18} /> Volver al panel
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>Chat</h1>
      </header>

      <section className="chat-grid" style={{ maxWidth: '1160px', margin: '0 auto' }}>
        <aside className="chat-sidebar" style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'grid', gridTemplateRows: 'auto auto minmax(0, 1fr)' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', minHeight: '76px', boxSizing: 'border-box' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '0.65rem', padding: '0.55rem 0.7rem 0.55rem 2rem', outline: 'none' }}
              />
            </div>
          </div>

          {searchResults.length > 0 && (
            <div style={{ borderBottom: '1px solid #f1f5f9', padding: '0.6rem 0.8rem', display: 'grid', gap: '0.35rem', maxHeight: '180px', overflowY: 'auto' }}>
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
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    borderRadius: '0.6rem',
                    padding: '0.5rem',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {candidate.avatar_url ? <img src={candidate.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontWeight: 700, color: '#475569' }}>{getUserName(candidate).charAt(0).toUpperCase()}</span>}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{getUserName(candidate)}</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{candidate.display_name || 'Participante'}</p>
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
                      borderBottom: '1px solid #f8fafc',
                      background: active ? '#eff6ff' : '#fff',
                      padding: '0.75rem 0.8rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {contact.avatar_url ? <img src={contact.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontWeight: 700, color: '#475569' }}>{getUserName(contact).charAt(0).toUpperCase()}</span>}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{getUserName(contact)}</p>
                      <p style={{ margin: '0.1rem 0 0', fontSize: '0.73rem', color: '#64748b' }}>{formatHour(contact.last_interaction_at)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <article className="chat-main" style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr) auto', height: '100%' }}>
          <header style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', minHeight: '76px', boxSizing: 'border-box' }}>
            {selectedUser ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontWeight: 700, color: '#475569' }}>{getUserName(selectedUser).charAt(0).toUpperCase()}</span>}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>@{getUserName(selectedUser)}</p>
                    <p style={{ margin: 0, fontSize: '0.74rem', color: '#64748b' }}>{selectedUser.display_name || 'Participante'}</p>
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

          <div ref={messagesContainerRef} className="chat-messages" style={{ padding: '1rem', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
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
                  return (
                    <div key={message.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '75%', background: mine ? '#2563eb' : '#fff', color: mine ? '#fff' : '#0f172a', border: mine ? '1px solid #2563eb' : '1px solid #e2e8f0', borderRadius: '0.85rem', padding: '0.55rem 0.7rem' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.35, whiteSpace: 'pre-wrap' }}>{message.content}</p>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.68rem', opacity: mine ? 0.8 : 0.55, textAlign: 'right' }}>{formatHour(message.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleSend} style={{ borderTop: '1px solid #f1f5f9', padding: '0.8rem', display: 'flex', gap: '0.55rem' }}>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={selectedUser ? 'Escribe un mensaje...' : 'Selecciona un usuario para escribir'}
              disabled={!selectedUser || sending}
              maxLength={2000}
              style={{
                flex: 1,
                border: '1px solid #cbd5e1',
                borderRadius: '0.7rem',
                padding: '0.65rem 0.8rem',
                outline: 'none',
                background: !selectedUser ? '#f8fafc' : '#fff',
              }}
            />
            <button
              type="submit"
              disabled={!selectedUser || sending || !draft.trim()}
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
                cursor: !selectedUser || sending || !draft.trim() ? 'not-allowed' : 'pointer',
                opacity: !selectedUser || sending || !draft.trim() ? 0.6 : 1,
              }}
            >
              <Send size={15} /> Enviar
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}
