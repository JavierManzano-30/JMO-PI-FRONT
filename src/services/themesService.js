import { apiRequest } from '../lib/apiClient.js';

export async function listThemes(params = {}) {
  return apiRequest('/themes', {
    query: {
      page: params.page,
      limit: params.limit,
      is_active: params.isActive,
      community_id: params.communityId,
    },
  });
}

export async function getThemeById(id) {
  return apiRequest(`/themes/${id}`);
}
