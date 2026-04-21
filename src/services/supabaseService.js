import { supabase } from '../lib/supabase'

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
    .from('contests')
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
    .from('regions')
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
    .from('submissions')
    .insert([
      {
        user_id: userId,
        contest_id: contestId,
        category_id: categoryId,
        region_id: regionId,
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
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.contestId) simpleQuery = simpleQuery.eq('contest_id', filters.contestId);
    if (filters.categoryId) simpleQuery = simpleQuery.eq('category_id', filters.categoryId);
    if (filters.regionId) simpleQuery = simpleQuery.eq('region_id', filters.regionId);

    const { data: submissions, error: simpleError } = await simpleQuery;
    if (simpleError) throw simpleError;

    // 1. Hidratamos los perfiles "a mano"
    const userIds = [...new Set(submissions.map(s => s.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
    
    // 2. Hidratamos los VOTOS (Conteo global)
    const submissionIds = submissions.map(s => s.id);
    const { data: allVotes } = await supabase
      .from('votes')
      .select('submission_id')
      .in('submission_id', submissionIds);

    // 3. Chequeamos si el usuario actual ha votado estas fotos
    let userVotes = [];
    if (currentUserId && submissionIds.length > 0) {
      const { data: uv } = await supabase
        .from('votes')
        .select('submission_id')
        .eq('user_id', currentUserId)
        .in('submission_id', submissionIds);
      userVotes = uv || [];
    }
    
    return submissions.map(s => ({
      ...s,
      profiles: profiles?.find(p => p.id === s.user_id) || null,
      voteCount: allVotes?.filter(v => v.submission_id === s.id).length || 0,
      hasVoted: userVotes.some(v => v.submission_id === s.id)
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
      .from('submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (subError) throw subError;

    // 2. Traemos el perfil del autor de forma INDEPENDIENTE
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', submission.user_id)
      .single();

    // 3. Traemos la región de forma INDEPENDIENTE
    let regionName = 'Comunidad desconocida';
    if (submission.region_id || profile?.region_id) {
      const { data: reg } = await supabase
        .from('regions')
        .select('name')
        .eq('id', submission.region_id || profile?.region_id)
        .single();
      if (reg) regionName = reg.name;
    }

    return {
      ...submission,
      profiles: profile,
      regions: { name: regionName }
    };
  } catch (err) {
    console.error("Error en getSubmissionById:", err);
    throw err;
  }
}
