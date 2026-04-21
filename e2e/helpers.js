/**
 * Utilidades compartidas para los tests E2E de SnapNation.
 * 
 * Estrategia de sesión:
 * Supabase JS almacena la sesión activa bajo la clave localStorage:
 *   sb-<project-ref>-auth-token
 * donde <project-ref> es el subdominio del proyecto Supabase.
 * 
 * Inyectamos esta clave ANTES de que la página cargue usando
 * page.addInitScript(), lo que hace que el AuthContext de React
 * encuentre una sesión válida al montar.
 */

/** Clave de localStorage que usa Supabase para guardar la sesión */
export const SUPABASE_STORAGE_KEY = 'sb-uiclotdonxwfatqzwsof-auth-token';

/** Usuario ficticio de prueba */
export const fakeUser = {
  id: 'user-uuid-e2e-001',
  email: 'e2e@snapnation.test',
  role: 'authenticated',
  aud: 'authenticated',
  user_metadata: {
    username: 'e2e_tester',
    full_name: 'Test E2E User',
  },
  created_at: '2026-01-01T10:00:00Z',
};

/** Sesión fake válida */
export const fakeSession = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXV1aWQtZTJlLTAwMSIsImVtYWlsIjoiZTJlQHNuYXBuYXRpb24udGVzdCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.fake_signature',
  refresh_token: 'fake-refresh-token-e2e',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: 9999999999,
  user: fakeUser,
};

/**
 * Inyecta una sesión de Supabase válida en localStorage antes de cargar la página.
 * Debe llamarse ANTES de page.goto().
 * 
 * @param {import('@playwright/test').Page} page
 */
export async function injectSession(page) {
  await page.addInitScript(
    ({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
    },
    { key: SUPABASE_STORAGE_KEY, session: fakeSession }
  );
}

/**
 * Mockeamos las rutas de red de Supabase.
 * Llamar ANTES de page.goto().
 * 
 * @param {import('@playwright/test').Page} page
 * @param {object} [overrides] - Datos opcionales para sobrescribir respuestas
 */
export async function mockSupabaseRoutes(page, overrides = {}) {
  const profile = overrides.profile ?? {
    id: fakeUser.id,
    username: 'e2e_tester',
    full_name: 'Test E2E User',
    avatar_url: null,
    region_id: 2,
    created_at: fakeUser.created_at,
  };

  // Validación del token — devuelve el usuario fake
  await page.route('**/auth/v1/user**', async (route) => {
    const method = route.request().method();
    if (method === 'PUT' || method === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...fakeUser, user_metadata: { username: 'e2e_tester', full_name: 'Test E2E User' } }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fakeUser),
      });
    }
  });

  // Refresh de sesión
  await page.route('**/auth/v1/token**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fakeSession),
    });
  });

  // Perfil del usuario
  await page.route('**/rest/v1/profiles**', async (route) => {
    const method = route.request().method();
    if (method === 'PATCH' || method === 'PUT') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(profile),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(profile),
      });
    }
  });

  // Regiones
  await page.route('**/rest/v1/regions**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overrides.regions ?? [
        { id: 1, name: 'Andalucía' },
        { id: 2, name: 'Cataluña' },
        { id: 3, name: 'Madrid' },
      ]),
    });
  });

  // Submissions / actividad del usuario
  await page.route('**/rest/v1/submissions**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overrides.submissions ?? [
        { id: 1, user_id: fakeUser.id, votes: 5, created_at: '2026-03-01T00:00:00Z' },
      ]),
    });
  });

  // Concursos
  await page.route('**/rest/v1/contests**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overrides.contests ?? [
        { id: 1, title: 'Concurso Primavera 2026', is_active: true },
      ]),
    });
  });

  // Categorías
  await page.route('**/rest/v1/categories**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overrides.categories ?? [
        { id: 1, name: 'Paisaje' },
        { id: 2, name: 'Retrato' },
      ]),
    });
  });

  // Winners
  await page.route('**/rest/v1/winners**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overrides.winners ?? []),
    });
  });

  // Themes
  await page.route('**/rest/v1/themes**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overrides.themes ?? []),
    });
  });

  // Storage
  await page.route('**/storage/v1/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ Key: 'fake/path.jpg', publicUrl: 'https://fake-cdn.supabase.co/fake.jpg' }),
    });
  });
}
