import { apiRequest } from '../lib/apiClient.js';
import { mapComment } from '../lib/mappers.js';

export async function listPhotoComments(photoId, params = {}) {
  const response = await apiRequest(`/photos/${photoId}/comments`, {
    auth: true,
    query: {
      page: params.page,
      limit: params.limit,
    },
  });

  return {
    data: (response.data || []).map(mapComment),
    meta: response.meta,
  };
}

export async function createPhotoComment(photoId, content) {
  const response = await apiRequest(`/photos/${photoId}/comments`, {
    method: 'POST',
    auth: true,
    body: { content },
  });
  return mapComment(response);
}

export async function deletePhotoComment(photoId, commentId) {
  return apiRequest(`/photos/${photoId}/comments/${commentId}`, {
    method: 'DELETE',
    auth: true,
  });
}
