import { apiRequest } from '../lib/apiClient.js';
import { mapPhotoDetail, mapPhotoSummary } from '../lib/mappers.js';

export async function listPhotos(params = {}) {
  const response = await apiRequest('/photos', {
    query: {
      page: params.page,
      limit: params.limit,
      community_id: params.communityId,
      theme_id: params.themeId,
      category_id: params.categoryId,
      user_id: params.userId,
      sort: params.sort,
    },
  });

  return {
    data: (response.data || []).map(mapPhotoSummary),
    meta: response.meta,
  };
}

export async function getPhotoById(photoId) {
  const response = await apiRequest(`/photos/${photoId}`, { auth: true });
  return mapPhotoDetail(response);
}

export async function createPhoto({ title, description, themeId, categoryId, imageFile }) {
  const form = new FormData();

  form.set('title', title);
  form.set('theme_id', String(themeId));
  form.set('image', imageFile);

  if (description) {
    form.set('description', description);
  }

  if (categoryId) {
    form.set('category_id', String(categoryId));
  }

  return apiRequest('/photos', {
    method: 'POST',
    auth: true,
    body: form,
  });
}
