import { apiRequest } from '../lib/apiClient.js';
import { mapPhotoDetail, mapPhotoSummary, mapRankingEntry } from '../lib/mappers.js';

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

export async function deletePhoto(photoId) {
  return apiRequest(`/photos/${photoId}`, {
    method: 'DELETE',
    auth: true,
  });
}

export async function getPhotoRanking(photoId, params = {}) {
  const response = await apiRequest(`/photos/${photoId}/ranking`, {
    auth: true,
    query: {
      limit: params.limit,
    },
  });

  return {
    photo: {
      id: String(response.photo?.id),
      rawId: response.photo?.id,
      title: response.photo?.title,
      description: response.photo?.description,
      image: response.photo?.image_url,
      thumb: response.photo?.thumb_url || response.photo?.image_url,
      votes: response.photo?.votes_count || 0,
      createdAt: response.photo?.created_at,
      authorDisplayName: response.photo?.author_display_name,
      userId: response.photo?.user_id,
      communityId: response.photo?.community_id,
      communityName: response.photo?.community_name,
    },
    theme: response.theme
      ? {
        id: response.theme.id,
        title: response.theme.title,
        description: response.theme.description,
        startDate: response.theme.start_date,
        endDate: response.theme.end_date,
        isActive: response.theme.is_active,
        communityId: response.theme.community_id,
        communityName: response.theme.community_name,
      }
      : null,
    ranking: response.ranking
      ? {
        photoId: response.ranking.photo_id,
        rank: response.ranking.rank_position,
        totalEntries: response.ranking.total_entries,
        votes: response.ranking.votes_count || 0,
        isOfficialWinner: Boolean(response.ranking.is_official_winner),
      }
      : null,
    leaderboard: (response.leaderboard || []).map(mapRankingEntry),
  };
}
