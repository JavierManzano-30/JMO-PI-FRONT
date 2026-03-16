import { apiRequest } from '../lib/apiClient.js';

export function createVote(photoId) {
  return apiRequest('/votes', {
    method: 'POST',
    auth: true,
    body: { photo_id: Number(photoId) },
  });
}

export function deleteVote(photoId) {
  return apiRequest('/votes', {
    method: 'DELETE',
    auth: true,
    body: { photo_id: Number(photoId) },
  });
}
