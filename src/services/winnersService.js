import { apiRequest } from '../lib/apiClient.js';
import { mapWinnerEntry } from '../lib/mappers.js';

export async function listWinners(params = {}) {
  const response = await apiRequest('/winners', {
    query: {
      page: params.page,
      limit: params.limit,
      theme_id: params.themeId,
      community_id: params.communityId,
      include_active: params.includeActive,
      theme_state: params.themeState,
      official_only: params.officialOnly,
      rank_limit: params.rankLimit,
    },
  });

  return {
    data: (response.data || []).map(mapWinnerEntry),
    meta: response.meta,
  };
}
