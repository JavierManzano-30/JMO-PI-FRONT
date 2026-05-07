// @ts-check
import { test, expect } from '@playwright/test';
import { injectSession, mockSupabaseRoutes, fakeSession } from './helpers.js';

const emailInput = 'input[name="email"]';
const passwordInput = 'input[name="password"]';

/**
 * Suite E2E: Autenticación
 * Flujos cubiertos:
 *  1. Pantalla de login se carga con campos correctos
 *  2. Login con credenciales válidas redirige al dashboard
 *  3. Login con credenciales inválidas muestra alerta de error
 *  4. Enlace a registro visible en login
 *  5. Estado "Validando..." durante el submit
 *  6. Ruta protegida sin sesión redirige a /no-session
 */

test.describe('Autenticación — Formulario de Login', () => {

  test('Pantalla de login se carga correctamente', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h1')).toContainText('Iniciar sesión');
    await expect(page.locator(emailInput)).toBeVisible();
    await expect(page.locator(passwordInput)).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Login con credenciales válidas redirige al dashboard', async ({ page }) => {
    // 1. Mockeamos el endpoint de autenticación de Supabase
    await page.route('**/auth/v1/token**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fakeSession),
      });
    });

    // 2. Resto de rutas de red necesarias para que el dashboard cargue
    await mockSupabaseRoutes(page);

    await page.goto('/login');

    await page.fill(emailInput, 'e2e@snapnation.test');
    await page.fill(passwordInput, 'contraseñaSegura123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/app\/dashboard/, { timeout: 12_000 });
  });

  test('Login con credenciales inválidas muestra mensaje de error', async ({ page }) => {
    await page.route('**/auth/v1/token**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
      });
    });

    await page.goto('/login');

    await page.fill(emailInput, 'mal@test.com');
    await page.fill(passwordInput, 'clave-incorrecta');
    await page.click('button[type="submit"]');

    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible({ timeout: 8_000 });
  });

  test('Enlace a registro es visible en la página de login', async ({ page }) => {
    await page.goto('/login');

    const registerLink = page.locator('a[href="/register"]');
    await expect(registerLink).toBeVisible();
  });

  test('Botón muestra estado "Validando..." durante el submit', async ({ page }) => {
    await page.route('**/auth/v1/token**', async (route) => {
      // Retrasamos para poder observar el estado de carga
      await new Promise((r) => setTimeout(r, 1500));
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant' }),
      });
    });

    await page.goto('/login');
    await page.fill(emailInput, 'demo@test.com');
    await page.fill(passwordInput, '12345678');

    await page.click('button[type="submit"]');
    await expect(page.locator('button[type="submit"]')).toContainText('Validando...', { timeout: 2_000 });
  });

});

test.describe('Autenticación — Rutas protegidas', () => {

  test('/app/dashboard sin sesión redirige a /no-session', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page).toHaveURL(/\/no-session/, { timeout: 8_000 });
  });

  test('/app/profile sin sesión redirige a /no-session', async ({ page }) => {
    await page.goto('/app/profile');
    await expect(page).toHaveURL(/\/no-session/, { timeout: 8_000 });
  });

  test('Con sesión activa, /app/dashboard carga sin redirigir', async ({ page }) => {
    // Inyectamos sesión en localStorage ANTES de navegar
    await injectSession(page);
    await mockSupabaseRoutes(page);

    await page.goto('/app/dashboard');

    // No debe redirigir a /no-session
    await expect(page).not.toHaveURL(/no-session/, { timeout: 8_000 });
    // Debe renderizar algún elemento de la UI del dashboard
    await expect(page.locator('body')).not.toBeEmpty();
  });

});
