/**
 * Utilidades compartidas para los tests E2E de SnapNation.
 * Los tests interceptan Supabase, Cloudinary y la API propia para no depender
 * de servicios externos.
 */

export const SUPABASE_STORAGE_KEY = 'sb-uiclotdonxwfatqzwsof-auth-token';

export const fakeUser = {
  id: 'user-uuid-e2e-001',
  email: 'e2e@snapnation.test',
  role: 'authenticated',
  aud: 'authenticated',
  user_metadata: {
    backend_user_id: 1,
    username: 'e2e_tester',
    full_name: 'Test E2E User',
  },
  created_at: '2026-01-01T10:00:00Z',
};

export const fakeSession = {
  access_token: 'fake-e2e-access-token',
  refresh_token: 'fake-refresh-token-e2e',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: 9999999999,
  user: fakeUser,
};

export const mockUsers = [
  {
    id: 1,
    username: 'e2e_tester',
    email: 'e2e@snapnation.test',
    display_name: 'Test E2E User',
    avatar_url: null,
    community_id: 1,
    created_at: '2026-01-01T10:00:00Z',
  },
  {
    id: 2,
    username: 'victor_98',
    email: 'victor@snapnation.test',
    display_name: 'Victor_98',
    avatar_url: '/assets/photos/foto-perfil.jpg',
    community_id: 1,
    created_at: '2026-01-02T10:00:00Z',
  },
  {
    id: 3,
    username: 'barto',
    email: 'barto@snapnation.test',
    display_name: 'barto',
    avatar_url: null,
    community_id: 2,
    created_at: '2026-01-03T10:00:00Z',
  },
];

export const mockCommunities = [
  { id: 1, name: 'Andalucía' },
  { id: 2, name: 'Cataluña' },
  { id: 3, name: 'Madrid' },
];

export const mockThemes = [
  { id: 1, title: 'LIBRE', is_active: true, created_at: '2026-05-01T10:00:00Z' },
  { id: 2, title: 'LIBRE2', is_active: false, created_at: '2026-04-01T10:00:00Z' },
];

export const mockCategories = [
  { id: 1, name: 'Retrato' },
  { id: 2, name: 'Naturaleza' },
  { id: 3, name: 'Urbano' },
];

export const mockPhotos = [
  {
    id: 101,
    user_id: 2,
    theme_id: 1,
    category_id: 2,
    community_id: 1,
    title: 'Algo',
    description: 'Una publicación de prueba',
    image_url: '/assets/photos/imagen1.jpg',
    created_at: '2026-05-04T21:14:00Z',
    is_deleted: false,
  },
  {
    id: 102,
    user_id: 1,
    theme_id: 1,
    category_id: 1,
    community_id: 1,
    title: 'Con el capitán',
    description: 'Otra publicación de prueba',
    image_url: '/assets/photos/imagen2.jpg',
    created_at: '2026-05-04T22:14:00Z',
    is_deleted: false,
  },
  {
    id: 103,
    user_id: 3,
    theme_id: 2,
    category_id: 1,
    community_id: 2,
    title: 'Paisajes espectaculares',
    description: 'Finalizada',
    image_url: '/assets/photos/imagen3.jpg',
    created_at: '2026-04-04T22:14:00Z',
    is_deleted: false,
  },
];

export const mockDirectMessages = [
  {
    id: 1,
    sender_id: 2,
    receiver_id: 1,
    content: 'Hola desde el test',
    created_at: '2026-05-07T12:30:00Z',
  },
  {
    id: 2,
    sender_id: 1,
    receiver_id: 2,
    content: '📸 Algo\nhttp://127.0.0.1:5173/photos/101\n__shared_photo__:101',
    created_at: '2026-05-07T12:35:00Z',
  },
];

export async function injectSession(page) {
  await page.addInitScript(
    ({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
    },
    { key: SUPABASE_STORAGE_KEY, session: fakeSession }
  );
}

function parseFilter(query, key) {
  const raw = query.get(key);
  if (!raw) return null;
  if (raw.startsWith('eq.')) return raw.slice(3);
  if (raw.startsWith('ilike.')) return raw.slice(6).replaceAll('*', '').toLowerCase();
  if (raw.startsWith('in.(') && raw.endsWith(')')) return raw.slice(4, -1).split(',').map((value) => value.trim());
  return raw;
}

function isSingleObjectRequest(headers) {
  return String(headers.accept || '').includes('application/vnd.pgrst.object+json');
}

function applyCommonFilters(table, rows, url) {
  const query = url.searchParams;
  let result = [...rows];

  for (const key of ['id', 'user_id', 'theme_id', 'category_id', 'community_id', 'sender_id', 'receiver_id', 'follower_id', 'following_id']) {
    const value = parseFilter(query, key);
    if (!value) continue;
    if (Array.isArray(value)) {
      const set = new Set(value.map(String));
      result = result.filter((row) => set.has(String(row[key])));
    } else {
      result = result.filter((row) => String(row[key]) === String(value));
    }
  }

  const usernameSearch = parseFilter(query, 'username');
  if (usernameSearch && table === 'users') {
    result = result.filter((row) => String(row.username || '').toLowerCase().includes(usernameSearch));
  }

  const emailFilter = parseFilter(query, 'email');
  if (emailFilter && table === 'users') {
    result = result.filter((row) => String(row.email || '') === String(emailFilter));
  }

  const isDeleted = parseFilter(query, 'is_deleted');
  if (isDeleted !== null && table === 'photos') {
    result = result.filter((row) => String(row.is_deleted) === String(isDeleted));
  }

  return result;
}

function withRelations(photo) {
  const user = mockUsers.find((item) => item.id === photo.user_id) || null;
  const theme = mockThemes.find((item) => item.id === photo.theme_id) || null;
  const category = mockCategories.find((item) => item.id === photo.category_id) || null;
  const community = mockCommunities.find((item) => item.id === photo.community_id) || null;
  const votes = photo.id === 101 ? 4 : photo.id === 102 ? 2 : 1;

  return {
    ...photo,
    profiles: user,
    users: user,
    contests: theme,
    themes: theme,
    categories: category,
    communities: community,
    votes_count: votes,
    hasVoted: false,
  };
}

async function fulfillJson(route, body, status = 200, extraHeaders = {}) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: extraHeaders,
    body: body === null ? '' : JSON.stringify(body),
  });
}

async function mockRestRoute(route, overrides) {
  const request = route.request();
  const url = new URL(request.url());
  const table = url.pathname.split('/rest/v1/')[1]?.split('/')[0];
  const method = request.method();
  const headers = request.headers();

  const tables = {
    users: overrides.users ?? mockUsers,
    communities: overrides.communities ?? mockCommunities,
    regions: overrides.communities ?? mockCommunities,
    themes: overrides.themes ?? mockThemes,
    contests: overrides.themes ?? mockThemes,
    categories: overrides.categories ?? mockCategories,
    photos: overrides.photos ?? mockPhotos,
    votes: overrides.votes ?? [{ photo_id: 101, user_id: 1 }],
    comments: overrides.comments ?? [
      { id: 1, photo_id: 101, user_id: 2, content: 'Buen encuadre', created_at: '2026-05-04T22:20:00Z' },
    ],
    user_follows: overrides.userFollows ?? [
      { follower_id: 1, following_id: 2, created_at: '2026-05-05T10:00:00Z' },
    ],
    direct_messages: overrides.directMessages ?? mockDirectMessages,
  };

  if (method === 'HEAD') {
    return fulfillJson(route, null, 200, { 'content-range': `0-0/${tables[table]?.length || 0}` });
  }

  if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
    if (table === 'direct_messages') {
      const payload = JSON.parse(request.postData() || '[]');
      const row = Array.isArray(payload) ? payload[0] : payload;
      return fulfillJson(route, {
        id: 999,
        created_at: '2026-05-07T13:00:00Z',
        ...row,
      });
    }
    if (table === 'comments') {
      const payload = JSON.parse(request.postData() || '[]');
      const row = Array.isArray(payload) ? payload[0] : payload;
      return fulfillJson(route, {
        id: 99,
        created_at: '2026-05-07T13:00:00Z',
        ...row,
        profiles: mockUsers.find((item) => item.id === row.user_id) || mockUsers[0],
      });
    }
    if (table === 'photos') {
      const payload = JSON.parse(request.postData() || '[]');
      const row = Array.isArray(payload) ? payload[0] : payload;
      return fulfillJson(route, [{ id: 999, created_at: '2026-05-07T13:00:00Z', ...row }]);
    }
    return fulfillJson(route, {});
  }

  if (method === 'DELETE') {
    return fulfillJson(route, {});
  }

  const rows = applyCommonFilters(table, tables[table] || [], url).map((row) => {
    if (table === 'photos') return withRelations(row);
    if (table === 'comments') {
      return {
        ...row,
        profiles: mockUsers.find((user) => user.id === row.user_id) || null,
      };
    }
    return row;
  });

  if (isSingleObjectRequest(headers)) {
    return fulfillJson(route, rows[0] || null);
  }

  return fulfillJson(route, rows);
}

function winnersPayload(overrides = {}) {
  const data = overrides.winners ?? [
    {
      theme_id: 1,
      theme_title: 'LIBRE',
      theme_is_active: true,
      community_name: 'Andalucía',
      photo_id: 102,
      photo_title: 'Con el capitán',
      image_url: '/assets/photos/imagen2.jpg',
      thumb_url: '/assets/photos/imagen2.jpg',
      author_display_name: 'Javier Manzano',
      votes_count: 3,
      rank_position: 1,
      is_official_winner: false,
    },
    {
      theme_id: 2,
      theme_title: 'Paisajes espectaculares',
      theme_is_active: false,
      community_name: 'Cataluña',
      photo_id: 103,
      photo_title: 'Paisaje finalizado',
      image_url: '/assets/photos/imagen3.jpg',
      thumb_url: '/assets/photos/imagen3.jpg',
      author_display_name: 'barto',
      votes_count: 2,
      rank_position: 1,
      is_official_winner: true,
    },
  ];

  return {
    data,
    meta: { page: 1, total_pages: 1, total: data.length },
  };
}

export async function mockSupabaseRoutes(page, overrides = {}) {
  await page.route('**/auth/v1/user**', async (route) => {
    if (['PUT', 'PATCH'].includes(route.request().method())) {
      return fulfillJson(route, fakeUser);
    }
    return fulfillJson(route, fakeUser);
  });

  await page.route('**/auth/v1/token**', async (route) => fulfillJson(route, fakeSession));

  await page.route('**/rest/v1/**', async (route) => mockRestRoute(route, overrides));

  await page.route('**/api/v1/communities**', async (route) => fulfillJson(route, {
    data: overrides.communities ?? mockCommunities,
    meta: { page: 1, total_pages: 1, total: (overrides.communities ?? mockCommunities).length },
  }));

  await page.route('**/api/v1/winners**', async (route) => fulfillJson(route, winnersPayload(overrides)));

  await page.route('https://api.cloudinary.com/**', async (route) => fulfillJson(route, {
    secure_url: 'https://res.cloudinary.com/demo/image/upload/snapnation/e2e.jpg',
  }));

  await page.route('**/storage/v1/**', async (route) => fulfillJson(route, {
    Key: 'fake/path.jpg',
    publicUrl: 'https://fake-cdn.supabase.co/fake.jpg',
  }));
}

export async function mockSupabaseSessionless(page) {
  await page.addInitScript(() => {
    localStorage.removeItem('sb-uiclotdonxwfatqzwsof-auth-token');
  });

  await page.route('**/auth/v1/user**', async (route) => fulfillJson(route, { message: 'Not authenticated' }, 401));
  await page.route('**/auth/v1/token**', async (route) => fulfillJson(route, {}, 401));
  await page.route('**/rest/v1/**', async (route) => mockRestRoute(route, {}));
  await page.route('**/api/v1/communities**', async (route) => fulfillJson(route, {
    data: mockCommunities,
    meta: { page: 1, total_pages: 1, total: mockCommunities.length },
  }));
  await page.route('**/api/v1/winners**', async (route) => fulfillJson(route, winnersPayload({})));
}
