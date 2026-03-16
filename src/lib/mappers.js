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
