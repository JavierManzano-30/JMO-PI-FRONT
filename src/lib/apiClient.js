import { getStoredToken } from './session.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

function toQueryString(params) {
  const search = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });

  const queryString = search.toString();
  return queryString ? `?${queryString}` : '';
}

export class ApiError extends Error {
  constructor(message, status, code, details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  if (response.status === 204) {
    return null;
  }

  return response.text();
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    query,
    body,
    headers = {},
    auth = false,
    token,
  } = options;

  const finalHeaders = new Headers(headers);
  const hasFormDataBody = body instanceof FormData;

  if (!hasFormDataBody) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  if (auth) {
    const authToken = token || getStoredToken();
    if (authToken) {
      finalHeaders.set('Authorization', `Bearer ${authToken}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}${toQueryString(query)}`, {
    method,
    headers: finalHeaders,
    body: body ? (hasFormDataBody ? body : JSON.stringify(body)) : undefined,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    if (payload && typeof payload === 'object') {
      throw new ApiError(
        payload.message || 'Error de API',
        response.status,
        payload.code || 'API_ERROR',
        payload.details || []
      );
    }

    throw new ApiError('Error de API', response.status, 'API_ERROR', []);
  }

  return payload;
}
