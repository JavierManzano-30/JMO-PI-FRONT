import { apiFetch } from './client.js';

export function login(email, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function register({ username, email, password, community_id }) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: { username, email, password, community_id },
  });
}

export function getMe(token) {
  return apiFetch('/users/me', { token });
}

export function updateProfile(token, { display_name, avatar }) {
  const formData = new FormData();
  if (display_name !== undefined) {
    formData.append('display_name', display_name);
  }
  if (avatar) {
    formData.append('avatar', avatar);
  }
  return apiFetch('/users/me', {
    method: 'PATCH',
    token,
    body: formData,
    isForm: true,
  });
}

export function getPhotos(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, value);
    }
  });
  const query = search.toString();
  return apiFetch(`/photos${query ? `?${query}` : ''}`);
}

export function getPhoto(photoId, token) {
  return apiFetch(`/photos/${photoId}`, { token });
}

export function uploadPhoto({ token, title, description, theme_id, category_id, image }) {
  const formData = new FormData();
  formData.append('title', title);
  if (description) {
    formData.append('description', description);
  }
  formData.append('theme_id', theme_id);
  if (category_id) {
    formData.append('category_id', category_id);
  }
  formData.append('image', image);

  return apiFetch('/photos', {
    method: 'POST',
    token,
    body: formData,
    isForm: true,
  });
}

export function votePhoto(token, photoId) {
  return apiFetch('/votes', {
    method: 'POST',
    token,
    body: { photo_id: photoId },
  });
}

export function unvotePhoto(token, photoId) {
  return apiFetch('/votes', {
    method: 'DELETE',
    token,
    body: { photo_id: photoId },
  });
}

export function getThemes(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, value);
    }
  });
  const query = search.toString();
  return apiFetch(`/themes${query ? `?${query}` : ''}`);
}

export function getCommunities(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, value);
    }
  });
  const query = search.toString();
  return apiFetch(`/communities${query ? `?${query}` : ''}`);
}

export function getCategories() {
  return apiFetch('/categories');
}
