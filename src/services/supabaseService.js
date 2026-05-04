import { supabase } from '../lib/supabase'

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

function isConflictError(error) {
  const code = String(error?.code || '');
  const msg = String(error?.message || '').toLowerCase();
  return error?.status === 409 || code === '23505' || msg.includes('duplicate') || msg.includes('unique');
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
        community_id: communityId,
        password_hash: '__supabase_auth_managed__',
      },
      {
        username,
        email,
        display_name: displayName || null,
        community_id: communityId,
      },
      {
        username,
        email,
        display_name: displayName || null,
      },
      {
        username,
        email,
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
  const backendUser = await findBackendUserById(id);
  if (!backendUser) return { id };
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
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
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
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
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

    return submissions.map(s => ({
      ...s,
      profiles: profiles?.find(p => p.id === s.user_id) || null,
      contests: contests?.find(c => c.id === s.theme_id) || null,
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

    return {
      ...submission,
      profiles: profile,
      contests: contest,
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
