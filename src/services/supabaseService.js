import { supabase } from '../lib/supabase'

function getAppBaseUrl() {
  const envBase = String(import.meta.env.VITE_APP_URL || '').trim();
  const rawBase = envBase || window.location.origin;
  return rawBase.replace(/\/+$/, '');
}

function parseStrictPositiveInt(value) {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return null;
}

function normalizeUsername(rawValue) {
  const fallback = `user_${Date.now().toString().slice(-6)}`;
  if (typeof rawValue !== 'string' || !rawValue.trim()) return fallback;
  const clean = rawValue
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);
  return clean || fallback;
}

function appendUsernameSuffix(base, suffix) {
  const safeBase = normalizeUsername(base);
  const safeSuffix = String(suffix).replace(/[^a-z0-9]/gi, '').slice(-6).toLowerCase();
  const head = safeBase.slice(0, Math.max(1, 50 - safeSuffix.length - 1));
  return `${head}_${safeSuffix}`;
}

function getAuthAvatarUrl(authUser) {
  const metadata = authUser?.user_metadata || {};
  return metadata.avatar_url || metadata.picture || null;
}

function isConflictError(error) {
  const code = String(error?.code || '');
  const msg = String(error?.message || '').toLowerCase();
  return error?.status === 409 || code === '23505' || msg.includes('duplicate') || msg.includes('unique');
}

function isMissingTableError(error, tableName) {
  const code = String(error?.code || '');
  const msg = String(error?.message || '').toLowerCase();
  const normalizedTableName = String(tableName || '').toLowerCase();
  return (
    error?.status === 404 ||
    code === 'PGRST205' ||
    msg.includes(`'public.${normalizedTableName}'`) ||
    (msg.includes('schema cache') && msg.includes(normalizedTableName)) ||
    msg.includes(`relation "${normalizedTableName}" does not exist`)
  );
}

function getLocalDateOnly(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isThemeCurrentlyActive(theme, today = getLocalDateOnly()) {
  if (!theme?.is_active || !theme?.start_date || !theme?.end_date) return false;
  return String(theme.start_date).slice(0, 10) <= today && String(theme.end_date).slice(0, 10) >= today;
}

function normalizeContestState(contest, today = getLocalDateOnly()) {
  if (!contest) return null;
  return {
    ...contest,
    is_active: isThemeCurrentlyActive(contest, today),
  };
}

async function findBackendUserIdByEmail(email) {
  if (!email) return null;
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('No se pudo resolver backend user id desde users:', error);
    return null;
  }

  return parseStrictPositiveInt(data?.id);
}

async function findBackendUserById(id) {
  if (!id) return null;
  const { data, error } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url, community_id')
    .eq('id', id)
    .maybeSingle();
  if (error) return null;
  return data || null;
}

async function syncBackendAvatarIfMissing(id, avatarUrl) {
  if (!id || !avatarUrl) return null;

  const { data, error } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', id)
    .is('avatar_url', null)
    .select('id, username, display_name, avatar_url, community_id')
    .maybeSingle();

  if (error) {
    console.warn('No se pudo sincronizar avatar_url en users:', error);
    return null;
  }

  return data || null;
}

async function findCommunityNameById(id) {
  if (!id) return null;
  const { data, error } = await supabase
    .from('communities')
    .select('name')
    .eq('id', id)
    .maybeSingle();
  if (error) return null;
  return data?.name || null;
}

async function isUsernameTakenCaseInsensitive(username, email) {
  if (!username) return false;
  const { data, error } = await supabase
    .from('users')
    .select('id, email, username')
    .ilike('username', username);
  if (error || !data?.length) return false;
  return data.some((row) => String(row.email || '').toLowerCase() !== String(email || '').toLowerCase());
}

export async function getBackendUserByEmail(email) {
  if (!email) return null;
  const { data, error } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url, community_id')
    .eq('email', email)
    .maybeSingle();
  if (error) return null;
  if (!data) return null;
  const communityName = await findCommunityNameById(data.community_id);
  return { ...data, community_name: communityName };
}

async function createBackendUser(authUser) {
  const email = authUser?.email;
  if (!email) return null;

  const metadata = authUser?.user_metadata || {};
  const communityId = parseStrictPositiveInt(metadata.region_id);
  const baseUsername =
    metadata.username ||
    metadata.user_name ||
    metadata.preferred_username ||
    email.split('@')[0];
  const normalizedBaseUsername = normalizeUsername(baseUsername);
  const displayName = metadata.full_name || metadata.name || baseUsername;
  const avatarUrl = getAuthAvatarUrl(authUser);
  const baseTaken = await isUsernameTakenCaseInsensitive(normalizedBaseUsername, email);
  const usernameCandidates = [];
  usernameCandidates.push(baseTaken
    ? appendUsernameSuffix(normalizedBaseUsername, authUser?.id || Date.now())
    : normalizedBaseUsername);
  usernameCandidates.push(appendUsernameSuffix(normalizedBaseUsername, Date.now()));
  usernameCandidates.push(appendUsernameSuffix(normalizedBaseUsername, Math.random().toString(36).slice(2, 8)));
  const uniqueUsernames = [...new Set(usernameCandidates)];

  let lastError = null;
  for (const username of uniqueUsernames) {
    const attempts = [
      {
        username,
        email,
        display_name: displayName || null,
        avatar_url: avatarUrl,
        community_id: communityId,
        password_hash: '__supabase_auth_managed__',
      },
      {
        username,
        email,
        display_name: displayName || null,
        avatar_url: avatarUrl,
        community_id: communityId,
      },
      {
        username,
        email,
        display_name: displayName || null,
        avatar_url: avatarUrl,
      },
      {
        username,
        email,
        avatar_url: avatarUrl,
      },
    ];

    for (const payload of attempts) {
      const attempt = await supabase
        .from('users')
        .insert([payload])
        .select('id')
        .single();

      if (!attempt.error) {
        return parseStrictPositiveInt(attempt.data?.id);
      }

      lastError = attempt.error;

      if (isConflictError(attempt.error)) {
        const existingId = await findBackendUserIdByEmail(email);
        if (existingId) return existingId;
        continue;
      }
    }
  }

  console.warn('No se pudo crear usuario en tabla users:', lastError);
  return null;
}

export async function resolveBackendUserId(authUser, { createIfMissing = true } = {}) {
  const fromMetadata = parseStrictPositiveInt(authUser?.user_metadata?.backend_user_id);
  if (fromMetadata) return fromMetadata;

  const fromId = parseStrictPositiveInt(authUser?.id);
  if (fromId) return fromId;

  const email = authUser?.email;
  if (!email) return null;
  let resolvedId = await findBackendUserIdByEmail(email);
  if (resolvedId || !createIfMissing) return resolvedId;

  const createdId = await createBackendUser(authUser);
  if (createdId) return createdId;

  resolvedId = await findBackendUserIdByEmail(email);
  return resolvedId;
}

export async function resolveBackendUser(authUser, { createIfMissing = true } = {}) {
  const id = await resolveBackendUserId(authUser, { createIfMissing });
  if (!id) return null;
  let backendUser = await findBackendUserById(id);
  if (!backendUser) return { id };
  const authAvatarUrl = getAuthAvatarUrl(authUser);
  if (!backendUser.avatar_url && authAvatarUrl) {
    backendUser = await syncBackendAvatarIfMissing(id, authAvatarUrl) || { ...backendUser, avatar_url: authAvatarUrl };
  }
  const communityName = await findCommunityNameById(backendUser.community_id);
  return {
    ...backendUser,
    id: parseStrictPositiveInt(backendUser.id),
    community_name: communityName,
  };
}

/**
 * --- AUTENTICACIÓN ---
 */

export async function signUp(email, password, username, fullName) {
  const emailRedirectTo = `${getAppBaseUrl()}/login`

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        username,
        full_name: fullName
      }
    }
  })

  if (error) throw error
  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error
  return data
}

/**
 * --- LECTURA DE DATOS ---
 */

export async function getContests() {
  const today = getLocalDateOnly();
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', today)
    .gte('end_date', today)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(theme => normalizeContestState(theme, today)).filter(theme => theme?.is_active)
}

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

export async function getRegions() {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

/**
 * --- SUBIDA DE IMÁGENES Y SUBMISSIONS ---
 */

export async function uploadImage(file, userId) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'snapnation');
  formData.append('public_id', `${userId}-${Date.now()}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Error al subir a Cloudinary');
  }

  const result = await response.json();
  return result.secure_url;
}

export async function createSubmission({
  userId,
  contestId,
  categoryId,
  regionId,
  imageUrl,
  title,
  description
}) {
  const { data: contest, error: contestError } = await supabase
    .from('themes')
    .select('id, is_active, start_date, end_date')
    .eq('id', contestId)
    .maybeSingle();

  if (contestError) throw contestError
  if (!isThemeCurrentlyActive(contest)) {
    throw new Error('Este concurso ya no está activo. Solo puedes subir fotos a concursos abiertos.');
  }

  const { data, error } = await supabase
    .from('photos')
    .insert([
      {
        user_id: userId,
        theme_id: contestId,
        category_id: categoryId,
        community_id: regionId,
        image_url: imageUrl,
        title,
        description
      }
    ])
    .select()

  if (error) throw error
  return data
}

/**
 * --- LECTURA DE FOTOS (SUBMISSIONS) ---
 */

export async function getSubmissions(filters = {}, currentUserId = null) {
  try {
    let simpleQuery = supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.contestId) simpleQuery = simpleQuery.eq('theme_id', filters.contestId);
    if (filters.categoryId) simpleQuery = simpleQuery.eq('category_id', filters.categoryId);
    if (filters.regionId) simpleQuery = simpleQuery.eq('community_id', filters.regionId);

    const { data: submissions, error: simpleError } = await simpleQuery;
    if (simpleError) throw simpleError;
    if (!submissions || submissions.length === 0) return [];

    const numericCurrentUserId = Number.parseInt(currentUserId, 10);
    const canResolveUserVotes = Number.isInteger(numericCurrentUserId) && numericCurrentUserId > 0;

    // Obtenemos los IDs únicos
    const userIds = [...new Set(submissions.map(s => s.user_id).filter(Boolean))];
    const contestIds = [...new Set(submissions.map(s => s.theme_id).filter(Boolean))];
    const categoryIds = [...new Set(submissions.map(s => s.category_id).filter(Boolean))];
    const submissionIds = submissions.map(s => s.id);

    // Ejecutamos todas las consultas secundarias en PARALELO para mayor velocidad
    const [
      { data: profiles },
      { data: contests },
      { data: categories },
      { data: allVotes },
      { data: userVotes }
    ] = await Promise.all([
      userIds.length > 0 ? supabase.from('users').select('*').in('id', userIds) : Promise.resolve({ data: [] }),
      contestIds.length > 0 ? supabase.from('themes').select('*').in('id', contestIds) : Promise.resolve({ data: [] }),
      categoryIds.length > 0 ? supabase.from('categories').select('*').in('id', categoryIds) : Promise.resolve({ data: [] }),
      submissionIds.length > 0 ? supabase.from('votes').select('photo_id').in('photo_id', submissionIds) : Promise.resolve({ data: [] }),
      (canResolveUserVotes && submissionIds.length > 0) ? supabase.from('votes').select('photo_id').eq('user_id', numericCurrentUserId).in('photo_id', submissionIds) : Promise.resolve({ data: [] })
    ]);

    const today = getLocalDateOnly();

    return submissions.map(s => ({
      ...s,
      profiles: profiles?.find(p => p.id === s.user_id) || null,
      contests: normalizeContestState(contests?.find(c => c.id === s.theme_id), today),
      categories: categories?.find(c => c.id === s.category_id) || null,
      voteCount: allVotes?.filter(v => v.photo_id === s.id).length || 0,
      hasVoted: userVotes ? userVotes.some(v => v.photo_id === s.id) : false
    }));
  } catch (err) {
    console.error("Error en getSubmissions:", err);
    throw err;
  }
}

export async function getSubmissionById(id) {
  try {
    // 1. Intentamos la consulta simple de la foto primero
    const { data: submission, error: subError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', id)
      .single();

    if (subError) throw subError;

    // Ejecutamos consultas en PARALELO
    const [
      { data: profile },
      { data: contest },
      { data: category },
      { data: reg }
    ] = await Promise.all([
      submission.user_id ? supabase.from('users').select('*').eq('id', submission.user_id).single() : Promise.resolve({ data: null }),
      submission.theme_id ? supabase.from('themes').select('*').eq('id', submission.theme_id).single() : Promise.resolve({ data: null }),
      submission.category_id ? supabase.from('categories').select('*').eq('id', submission.category_id).single() : Promise.resolve({ data: null }),
      submission.community_id ? supabase.from('communities').select('name').eq('id', submission.community_id).maybeSingle() : Promise.resolve({ data: null })
    ]);

    let regionName = 'Comunidad desconocida';
    if (reg && reg.name) regionName = reg.name;

    const today = getLocalDateOnly();

    return {
      ...submission,
      profiles: profile,
      contests: normalizeContestState(contest, today),
      categories: category,
      regions: { name: regionName }
    };
  } catch (err) {
    console.error("Error en getSubmissionById:", err);
    throw err;
  }
}

/**
 * --- COMENTARIOS ---
 */

export async function getComments(photoId) {
  const { data: comments, error } = await supabase
    .from('comments')
    .select('*')
    .eq('photo_id', photoId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  
  if (!comments || comments.length === 0) return [];
  
  const userIds = [...new Set(comments.map(c => c.user_id))];
  const { data: profiles } = await supabase.from('users').select('*').in('id', userIds);
  
  return comments.map(c => ({
    ...c,
    profiles: profiles?.find(p => p.id === c.user_id) || null
  }));
}

export async function addComment(photoId, userId, content) {
  const { data: comment, error } = await supabase
    .from('comments')
    .insert([
      {
        photo_id: photoId,
        user_id: userId,
        content
      }
    ])
    .select()
    .single();

  if (error) throw error;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  return {
    ...comment,
    profiles: profile
  };
}

export async function deleteComment(commentId) {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
  return true;
}

/**
 * --- SOCIAL: USUARIOS, SEGUIDORES Y CHAT ---
 */

function sanitizeMessageContent(value) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 2000);
}

export async function getUserById(userId) {
  const parsedUserId = parseStrictPositiveInt(userId);
  if (!parsedUserId) return null;

  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, display_name, avatar_url, role, community_id, created_at')
    .eq('id', parsedUserId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const communityName = await findCommunityNameById(data.community_id);
  return {
    ...data,
    community_name: communityName,
  };
}

export async function searchUsers(query = '', { excludeUserId = null, limit = 20 } = {}) {
  const normalizedQuery = String(query || '').trim();
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 50);

  let request = supabase
    .from('users')
    .select('id, username, display_name, avatar_url, community_id')
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (normalizedQuery) {
    request = request.or(
      `username.ilike.%${normalizedQuery}%,display_name.ilike.%${normalizedQuery}%`
    );
  }

  const parsedExclude = parseStrictPositiveInt(excludeUserId);
  if (parsedExclude) {
    request = request.neq('id', parsedExclude);
  }

  const { data, error } = await request;
  if (error) throw error;
  return data || [];
}

export async function followUser(followerId, followingId) {
  const parsedFollowerId = parseStrictPositiveInt(followerId);
  const parsedFollowingId = parseStrictPositiveInt(followingId);

  if (!parsedFollowerId || !parsedFollowingId || parsedFollowerId === parsedFollowingId) {
    return false;
  }

  const { error } = await supabase
    .from('user_follows')
    .upsert(
      [{ follower_id: parsedFollowerId, following_id: parsedFollowingId }],
      { onConflict: 'follower_id,following_id', ignoreDuplicates: true }
    );

  if (error) {
    if (isMissingTableError(error, 'user_follows')) {
      throw new Error('La funcionalidad de seguidores no está activada en la base de datos.');
    }
    throw error;
  }
  return true;
}

export async function unfollowUser(followerId, followingId) {
  const parsedFollowerId = parseStrictPositiveInt(followerId);
  const parsedFollowingId = parseStrictPositiveInt(followingId);

  if (!parsedFollowerId || !parsedFollowingId || parsedFollowerId === parsedFollowingId) {
    return false;
  }

  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', parsedFollowerId)
    .eq('following_id', parsedFollowingId);

  if (error) {
    if (isMissingTableError(error, 'user_follows')) {
      throw new Error('La funcionalidad de seguidores no está activada en la base de datos.');
    }
    throw error;
  }
  return true;
}

export async function isFollowingUser(followerId, followingId) {
  const parsedFollowerId = parseStrictPositiveInt(followerId);
  const parsedFollowingId = parseStrictPositiveInt(followingId);

  if (!parsedFollowerId || !parsedFollowingId || parsedFollowerId === parsedFollowingId) {
    return false;
  }

  const { data, error } = await supabase
    .from('user_follows')
    .select('id')
    .eq('follower_id', parsedFollowerId)
    .eq('following_id', parsedFollowingId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error, 'user_follows')) {
      return false;
    }
    throw error;
  }
  return Boolean(data?.id);
}

export async function getFollowStats(userId) {
  const parsedUserId = parseStrictPositiveInt(userId);
  if (!parsedUserId) {
    return { followers: 0, following: 0 };
  }

  const [{ count: followersCount, error: followersError }, { count: followingCount, error: followingError }] =
    await Promise.all([
      supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', parsedUserId),
      supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', parsedUserId),
    ]);

  if (followersError || followingError) {
    const missingFollowersTable = isMissingTableError(followersError, 'user_follows');
    const missingFollowingTable = isMissingTableError(followingError, 'user_follows');
    if (missingFollowersTable || missingFollowingTable) {
      return { followers: 0, following: 0 };
    }
    if (followersError) throw followersError;
    if (followingError) throw followingError;
  }

  return {
    followers: Number(followersCount || 0),
    following: Number(followingCount || 0),
  };
}

async function mapUsersByIds(userIds) {
  const uniqueUserIds = [...new Set((userIds || []).map((id) => parseStrictPositiveInt(id)).filter(Boolean))];
  if (uniqueUserIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url, community_id')
    .in('id', uniqueUserIds);

  if (error) throw error;

  return new Map((data || []).map((row) => [row.id, row]));
}

export async function getFollowers(userId, { limit = 40 } = {}) {
  const parsedUserId = parseStrictPositiveInt(userId);
  if (!parsedUserId) return [];

  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 40, 1), 100);
  const { data, error } = await supabase
    .from('user_follows')
    .select('follower_id, created_at')
    .eq('following_id', parsedUserId)
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (error) {
    if (isMissingTableError(error, 'user_follows')) {
      return [];
    }
    throw error;
  }
  if (!data?.length) return [];

  const usersMap = await mapUsersByIds(data.map((row) => row.follower_id));
  return data
    .map((row) => {
      const profile = usersMap.get(row.follower_id);
      return profile ? { ...profile, followed_at: row.created_at } : null;
    })
    .filter(Boolean);
}

export async function getFollowing(userId, { limit = 40 } = {}) {
  const parsedUserId = parseStrictPositiveInt(userId);
  if (!parsedUserId) return [];

  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 40, 1), 100);
  const { data, error } = await supabase
    .from('user_follows')
    .select('following_id, created_at')
    .eq('follower_id', parsedUserId)
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (error) {
    if (isMissingTableError(error, 'user_follows')) {
      return [];
    }
    throw error;
  }
  if (!data?.length) return [];

  const usersMap = await mapUsersByIds(data.map((row) => row.following_id));
  return data
    .map((row) => {
      const profile = usersMap.get(row.following_id);
      return profile ? { ...profile, followed_at: row.created_at } : null;
    })
    .filter(Boolean);
}

export async function sendDirectMessage(senderId, receiverId, content) {
  const parsedSenderId = parseStrictPositiveInt(senderId);
  const parsedReceiverId = parseStrictPositiveInt(receiverId);
  const normalizedContent = sanitizeMessageContent(content);

  if (!parsedSenderId || !parsedReceiverId || parsedSenderId === parsedReceiverId || !normalizedContent) {
    throw new Error('Mensaje inválido');
  }

  const { data, error } = await supabase
    .from('direct_messages')
    .insert([{ sender_id: parsedSenderId, receiver_id: parsedReceiverId, content: normalizedContent }])
    .select('id, sender_id, receiver_id, content, created_at')
    .single();

  if (error) {
    if (isMissingTableError(error, 'direct_messages')) {
      throw new Error('El chat no está activado en la base de datos.');
    }
    throw error;
  }
  return data;
}

export async function getConversationMessages(currentUserId, otherUserId, { limit = 100 } = {}) {
  const parsedCurrentUserId = parseStrictPositiveInt(currentUserId);
  const parsedOtherUserId = parseStrictPositiveInt(otherUserId);
  if (!parsedCurrentUserId || !parsedOtherUserId) return [];

  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 100, 1), 300);
  const filters =
    `and(sender_id.eq.${parsedCurrentUserId},receiver_id.eq.${parsedOtherUserId}),` +
    `and(sender_id.eq.${parsedOtherUserId},receiver_id.eq.${parsedCurrentUserId})`;

  const { data, error } = await supabase
    .from('direct_messages')
    .select('id, sender_id, receiver_id, content, created_at')
    .or(filters)
    // Traemos primero los más recientes y luego reordenamos en cliente para mostrar cronológico.
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(safeLimit);

  if (error) {
    if (isMissingTableError(error, 'direct_messages')) {
      return [];
    }
    throw error;
  }

  return (data || []).slice().reverse();
}

export async function getChatContacts(currentUserId, { limit = 60 } = {}) {
  const parsedCurrentUserId = parseStrictPositiveInt(currentUserId);
  if (!parsedCurrentUserId) return [];

  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 60, 1), 150);
  const { data: messages, error: messagesError } = await supabase
    .from('direct_messages')
    .select('sender_id, receiver_id, created_at')
    .or(`sender_id.eq.${parsedCurrentUserId},receiver_id.eq.${parsedCurrentUserId}`)
    .order('created_at', { ascending: false })
    .limit(600);

  if (messagesError) {
    if (isMissingTableError(messagesError, 'direct_messages')) {
      return [];
    }
    throw messagesError;
  }

  const lastInteractionByUser = new Map();
  for (const message of messages || []) {
    const otherUserId = message.sender_id === parsedCurrentUserId ? message.receiver_id : message.sender_id;
    if (!parseStrictPositiveInt(otherUserId)) continue;
    const known = lastInteractionByUser.get(otherUserId);
    const candidate = message.created_at || null;
    if (!known || (candidate && known < candidate)) {
      lastInteractionByUser.set(otherUserId, candidate);
    }
  }

  const following = await getFollowing(parsedCurrentUserId, { limit: 120 });
  for (const profile of following) {
    if (!lastInteractionByUser.has(profile.id)) {
      lastInteractionByUser.set(profile.id, null);
    }
  }

  const userIds = [...lastInteractionByUser.keys()].slice(0, safeLimit);
  if (userIds.length === 0) return [];

  const usersMap = await mapUsersByIds(userIds);
  const contacts = userIds
    .map((id) => {
      const profile = usersMap.get(id);
      if (!profile) return null;
      return {
        ...profile,
        last_interaction_at: lastInteractionByUser.get(id),
      };
    })
    .filter(Boolean);

  contacts.sort((a, b) => {
    const at = a.last_interaction_at ? new Date(a.last_interaction_at).getTime() : 0;
    const bt = b.last_interaction_at ? new Date(b.last_interaction_at).getTime() : 0;
    return bt - at;
  });

  return contacts;
}

export function subscribeToConversation(currentUserId, otherUserId, onMessage) {
  const parsedCurrentUserId = parseStrictPositiveInt(currentUserId);
  const parsedOtherUserId = parseStrictPositiveInt(otherUserId);
  if (!parsedCurrentUserId || !parsedOtherUserId || typeof onMessage !== 'function') {
    return () => {};
  }

  const channelName = `dm:${parsedCurrentUserId}:${parsedOtherUserId}:${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'direct_messages' },
      (payload) => {
        const message = payload?.new;
        if (!message) return;

        const senderId = parseStrictPositiveInt(message.sender_id);
        const receiverId = parseStrictPositiveInt(message.receiver_id);
        const matchA = senderId === parsedCurrentUserId && receiverId === parsedOtherUserId;
        const matchB = senderId === parsedOtherUserId && receiverId === parsedCurrentUserId;
        if (matchA || matchB) {
          onMessage(message);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function getUnreadDirectMessagesCount(currentUserId, { since = null } = {}) {
  const parsedCurrentUserId = parseStrictPositiveInt(currentUserId);
  if (!parsedCurrentUserId) return 0;

  let query = supabase
    .from('direct_messages')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', parsedCurrentUserId)
    .neq('sender_id', parsedCurrentUserId);

  if (since) {
    query = query.gt('created_at', since);
  }

  const { count, error } = await query;
  if (error) {
    if (isMissingTableError(error, 'direct_messages')) return 0;
    throw error;
  }
  return Number(count || 0);
}

export function subscribeToIncomingDirectMessages(currentUserId, onMessage) {
  const parsedCurrentUserId = parseStrictPositiveInt(currentUserId);
  if (!parsedCurrentUserId || typeof onMessage !== 'function') {
    return () => {};
  }

  const channelName = `dm:incoming:${parsedCurrentUserId}:${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'direct_messages' },
      (payload) => {
        const message = payload?.new;
        if (!message) return;

        const senderId = parseStrictPositiveInt(message.sender_id);
        const receiverId = parseStrictPositiveInt(message.receiver_id);
        if (receiverId === parsedCurrentUserId && senderId !== parsedCurrentUserId) {
          onMessage(message);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
