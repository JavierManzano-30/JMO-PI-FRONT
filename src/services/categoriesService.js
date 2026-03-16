import { apiRequest } from '../lib/apiClient.js';

export async function listCategories() {
  return apiRequest('/categories');
}
