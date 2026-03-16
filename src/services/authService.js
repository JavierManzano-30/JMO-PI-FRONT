import { apiRequest } from '../lib/apiClient.js';
import { mapUser } from '../lib/mappers.js';

export async function login(payload) {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: payload,
  });

  return {
    token: response.token,
    user: mapUser(response.user),
  };
}

export async function register(payload) {
  const response = await apiRequest('/auth/register', {
    method: 'POST',
    body: payload,
  });

  return {
    token: response.token,
    user: mapUser(response.user),
  };
}
