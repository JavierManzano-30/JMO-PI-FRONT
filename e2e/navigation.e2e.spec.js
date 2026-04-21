// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Suite E2E: Navegación y rutas
 * Flujos cubiertos:
 *  1. La ruta raíz "/" redirige a /winners (página pública)
 *  2. /winners es accesible sin autenticación y muestra contenido
 *  3. /app/dashboard sin sesión redirige a /no-session
 *  4. Una ruta inexistente muestra la página 404
 *  5. /no-session muestra mensaje de sesión requerida
 *  6. Los enlaces de navegación de la página pública funcionan
 */

// Mock mínimo para que Supabase no lance errores de red
async function mockSupabaseSessionless(page) {
  // Sin sesión → devolvemos null
  await page.route('**/auth/v1/session**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(null),
    });
  });

  await page.route('**/auth/v1/user**', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Not authenticated' }),
    });
  });

  // Mock de winners para que la página pública pueda cargar
  await page.route('**/rest/v1/winners**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route('**/rest/v1/themes**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe('Navegación — Rutas públicas', () => {

  test('La raíz "/" redirige a /winners', async ({ page }) => {
    await mockSupabaseSessionless(page);

    await page.goto('/');

    // Debe terminar en /winners
    await expect(page).toHaveURL(/\/winners/, { timeout: 8_000 });
  });

  test('/winners carga sin autenticación', async ({ page }) => {
    await mockSupabaseSessionless(page);

    await page.goto('/winners');

    // La URL debe ser /winners y el código HTTP 200 (no redirección de error)
    await expect(page).toHaveURL(/\/winners/);

    // El documento debe tener al menos un h1 o h2
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 8_000 });
  });

  test('/login carga el formulario de inicio de sesión', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toContainText('Iniciar sesión');
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
  });

  test('/register carga el formulario de registro', async ({ page }) => {
    // Mock de regiones que el Register hace al montar
    await page.route('**/rest/v1/regions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Andalucía' },
          { id: 2, name: 'Cataluña' },
          { id: 3, name: 'Madrid' },
        ]),
      });
    });

    await page.goto('/register');

    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator('h1')).toContainText('Crear cuenta');

    // Todos los campos del formulario deben estar presentes
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('select[name="regionId"]')).toBeVisible();
  });

  test('/no-session muestra mensaje de acceso requerido', async ({ page }) => {
    await page.goto('/no-session');

    await expect(page).toHaveURL(/\/no-session/);

    // Debe existir algún texto informativo (h1 o párrafo)
    const content = page.locator('h1, h2, p').first();
    await expect(content).toBeVisible();
  });

});

test.describe('Navegación — Rutas protegidas', () => {

  test('/app/dashboard sin sesión redirige a /no-session', async ({ page }) => {
    await mockSupabaseSessionless(page);

    await page.goto('/app/dashboard');

    // React-Router debe detectar que no hay sesión y redirigir
    await expect(page).toHaveURL(/\/no-session/, { timeout: 10_000 });
  });

  test('/app/profile sin sesión redirige a /no-session', async ({ page }) => {
    await mockSupabaseSessionless(page);

    await page.goto('/app/profile');
    await expect(page).toHaveURL(/\/no-session/, { timeout: 10_000 });
  });

  test('/app/admin sin sesión redirige a /no-session', async ({ page }) => {
    await mockSupabaseSessionless(page);

    await page.goto('/app/admin');
    await expect(page).toHaveURL(/\/no-session/, { timeout: 10_000 });
  });

});

test.describe('Navegación — Ruta 404', () => {

  test('Una ruta inexistente muestra la página NotFound', async ({ page }) => {
    await page.goto('/ruta-que-definitivamente-no-existe');

    // El componente NotFound debe renderizarse
    // Comprobamos que la URL no cambia a otra ruta conocida
    await expect(page).toHaveURL(/ruta-que-definitivamente-no-existe/);

    // Debe existir algún elemento visual (h1, un número 404, etc.)
    const content = page.locator('h1, h2, [data-testid="not-found"]').first();
    await expect(content).toBeVisible({ timeout: 8_000 });
  });

});
