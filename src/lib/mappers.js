export function mapUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.display_name || user.username,
    avatarUrl: user.avatar_url || '/assets/photos/foto-perfil.jpg',
    role: user.role,
    communityId: user.community_id,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export function mapPhotoSummary(photo) {
  return {
    id: String(photo.id),
    rawId: photo.id,
    image: photo.image_url,
    thumb: photo.thumb_url || photo.image_url,
    title: photo.title,
    description: photo.description,
    userId: photo.user_id,
    username: photo.username,
    displayName: photo.user_display_name || photo.username,
    communityName: photo.community_name,
    categoryName: photo.category_name,
    votes: photo.votes_count || 0,
    hasUserVoted: Boolean(photo.has_user_voted),
    createdAt: photo.created_at,
  };
}

export function mapPhotoDetail(photo) {
  return {
    id: String(photo.id),
    rawId: photo.id,
    title: photo.title,
    description: photo.description,
    image: photo.image_url,
    thumb: photo.thumb_url || photo.image_url,
    votes: photo.votes_count || 0,
    hasUserVoted: Boolean(photo.has_user_voted),
    createdAt: photo.created_at,
    user: mapUser(photo.user),
    theme: photo.theme,
    category: photo.category,
  };
}

export function mapWinnerEntry(entry) {
  return {
    themeId: entry.theme_id,
    themeTitle: entry.theme_title,
    themeStartDate: entry.theme_start_date,
    themeEndDate: entry.theme_end_date,
    themeIsActive: entry.theme_is_active,
    communityName: entry.community_name,
    photoId: entry.photo_id,
    photoTitle: entry.photo_title,
    image: entry.image_url,
    thumb: entry.thumb_url || entry.image_url,
    authorDisplayName: entry.author_display_name,
    votes: entry.votes_count,
    rank: entry.rank_position,
    isOfficialWinner: Boolean(entry.is_official_winner),
  };
}

export function mapComment(comment) {
  return {
    id: comment.id,
    photoId: comment.photo_id,
    userId: comment.user_id,
    content: comment.content,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
    user: {
      id: comment.user?.id,
      username: comment.user?.username,
      displayName: comment.user?.display_name || comment.user?.username || 'Usuario',
      avatarUrl: comment.user?.avatar_url || '/assets/photos/foto-perfil.jpg',
    },
    canDelete: Boolean(comment.can_delete),
  };
}

export function mapRankingEntry(entry) {
  return {
    photoId: entry.photo_id,
    photoTitle: entry.photo_title,
    image: entry.image_url,
    thumb: entry.thumb_url || entry.image_url,
    userId: entry.user_id,
    authorDisplayName: entry.author_display_name,
    votes: entry.votes_count || 0,
    rank: entry.rank_position,
    isOfficialWinner: Boolean(entry.is_official_winner),
  };
}
