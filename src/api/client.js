export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export async function apiFetch(path, options = {}) {
  const { method = 'GET', body, token, headers, isForm } = options;
  const url = path.startsWith('/') ? `${API_BASE}${path}` : `${API_BASE}/${path}`;
  const requestHeaders = new Headers(headers || {});

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  if (body && !isForm) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const error = new Error(payload?.message || 'Error de conexión');
    error.status = response.status;
    error.code = payload?.code;
    error.details = payload?.details;
    throw error;
  }

  return payload;
}
