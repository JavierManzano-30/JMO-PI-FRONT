// @ts-check
import { test, expect } from '@playwright/test';
import { mockSupabaseSessionless } from './helpers.js';

/**
 * Suite E2E: Navegación y rutas
 * Flujos cubiertos:
 *  1. La ruta raíz "/" redirige a /gallery (página pública)
 *  2. /contests es accesible sin autenticación y muestra contenido
 *  3. /app/dashboard sin sesión redirige a /no-session
 *  4. Una ruta inexistente muestra la página 404
 *  5. /no-session muestra mensaje de sesión requerida
 *  6. Los enlaces de navegación de la página pública funcionan
 */

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe('Navegación — Rutas públicas', () => {

  test('La raíz "/" redirige a /gallery', async ({ page }) => {
    await mockSupabaseSessionless(page);

    await page.goto('/');

    await expect(page).toHaveURL(/\/gallery/, { timeout: 8_000 });
  });

  test('/contests carga sin autenticación', async ({ page }) => {
    await mockSupabaseSessionless(page);

    await page.goto('/contests');

    await expect(page).toHaveURL(/\/contests/);

    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 8_000 });
  });

  test('/login carga el formulario de inicio de sesión', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toContainText('Iniciar sesión');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('/register carga el formulario de registro', async ({ page }) => {
    await mockSupabaseSessionless(page);

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
