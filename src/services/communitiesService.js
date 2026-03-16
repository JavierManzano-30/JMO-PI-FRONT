import { apiRequest } from '../lib/apiClient.js';

export async function listCommunities(params = {}) {
  return apiRequest('/communities', {
    query: {
      page: params.page,
      limit: params.limit,
    },
  });
}
