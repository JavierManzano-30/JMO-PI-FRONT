import { apiRequest } from '../lib/apiClient.js';
import { mapUser } from '../lib/mappers.js';

export async function getMe() {
  const response = await apiRequest('/users/me', { auth: true });
  return mapUser(response);
}

export async function updateMe({ displayName, avatarFile }) {
  const form = new FormData();

  if (displayName !== undefined) {
    form.set('display_name', displayName);
  }

  if (avatarFile) {
    form.set('avatar', avatarFile);
  }

  const response = await apiRequest('/users/me', {
    method: 'PATCH',
    auth: true,
    body: form,
  });

  return mapUser(response);
}
