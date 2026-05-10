import { getStoredToken } from './session.js';
import { supabase } from './supabase.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000/api/v1' : '');
export { API_BASE_URL };

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

async function getAuthToken(explicitToken) {
  if (explicitToken) {
    return explicitToken;
  }

  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || getStoredToken();
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  const preview = text.replace(/\s+/g, ' ').trim().slice(0, 120);

  throw new ApiError(
    preview.startsWith('<!doctype html') || preview.startsWith('<html')
      ? 'La API no esta disponible en la URL configurada.'
      : 'La API devolvio una respuesta no valida.',
    response.status,
    'INVALID_API_RESPONSE',
    []
  );
}

export async function apiRequest(path, options = {}) {
  if (!API_BASE_URL) {
    throw new ApiError(
      'Falta configurar VITE_API_URL con la URL publica del backend.',
      0,
      'MISSING_API_URL',
      []
    );
  }

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
    const authToken = await getAuthToken(token);
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

export function getApiOrigin() {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return 'http://localhost:3000';
  }
}
