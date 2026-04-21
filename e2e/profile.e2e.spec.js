// @ts-check
import { test, expect } from '@playwright/test';
import { injectSession, mockSupabaseRoutes, fakeUser } from './helpers.js';

/**
 * Suite E2E: Perfil de usuario
 * Flujos cubiertos:
 *  1. /app/profile muestra nombre de usuario con sesión
 *  2. /app/profile muestra sección de estadísticas
 *  3. Existe enlace a "Editar Perfil"
 *  4. Sin sesión redirige a /no-session
 *  5. /app/profile/edit carga el formulario de edición
 *  6. El formulario tiene el botón "Guardar Perfil"
 *  7. Editar nombre y guardar muestra estado "Guardando..."
 *  8. El botón Volver regresa a /app/profile
 */

test.describe('Perfil — Visualización', () => {

  test('/app/profile sin sesión redirige a /no-session', async ({ page }) => {
    // IMPORTANTE: Aquí NO llamamos a injectSession ni mockSupabaseRoutes
    // para que Supabase encuentre el localStorage vacío.
    await page.goto('/app/profile');
    await expect(page).toHaveURL(/\/no-session/, { timeout: 10_000 });
  });

  test.describe('Usuario Autenticado', () => {
    test.beforeEach(async ({ page }) => {
      await injectSession(page);
      await mockSupabaseRoutes(page);
    });

    test('La página /app/profile muestra los datos del usuario', async ({ page }) => {
      await page.goto('/app/profile');

      // Esperamos a que el nombre de usuario aparezca en algún elemento
      // El Profile muestra profileData.username o user.user_metadata.username
      const usernameEl = page.locator('text=e2e_tester').first();
      await expect(usernameEl).toBeVisible({ timeout: 12_000 });
    });

    test('La página de perfil muestra la sección de estadísticas', async ({ page }) => {
      await page.goto('/app/profile');

      // La sección "Tu Impacto" contiene las métricas FOTOS y VOTOS
      const fotos = page.locator('text=FOTOS').first();
      await expect(fotos).toBeVisible({ timeout: 12_000 });
    });

    test('Existe el enlace "Editar Perfil" en la página de perfil', async ({ page }) => {
      await page.goto('/app/profile');

      const editLink = page.locator('a[href="/app/profile/edit"]');
      await expect(editLink).toBeVisible({ timeout: 10_000 });
    });
  });

});

test.describe('Perfil — Edición', () => {

  test.beforeEach(async ({ page }) => {
    await injectSession(page);
    await mockSupabaseRoutes(page);
  });

  test('La página /app/profile/edit se carga con el formulario de edición', async ({ page }) => {
    await page.goto('/app/profile/edit');

    // El formulario debe tener al menos un input de texto visible
    // (el de username o nombre completo)
    await expect(page.locator('input[placeholder*="javier"]')
      .or(page.locator('input[placeholder*="usuario"]'))
      .or(page.locator('input[placeholder*="ej:"]'))
      .first()
    ).toBeVisible({ timeout: 12_000 });

    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('El formulario de edición tiene el botón "Guardar Perfil"', async ({ page }) => {
    await page.goto('/app/profile/edit');

    const saveBtn = page.locator('button[type="submit"]');
    await expect(saveBtn).toBeVisible({ timeout: 10_000 });
    await expect(saveBtn).toContainText(/Guardar/i);
  });

  test('Al guardar el botón muestra "Guardando cambios..."', async ({ page }) => {
    // Ralentizamos la respuesta del update para ver el estado transitorio
    await page.route('**/auth/v1/user**', async (route) => {
      const method = route.request().method();
      if (method === 'PUT' || method === 'PATCH') {
        await new Promise((r) => setTimeout(r, 1500));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(fakeUser),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(fakeUser),
        });
      }
    });

    await page.goto('/app/profile/edit');

    const firstInput = page.locator('input[placeholder*="javier"]')
      .or(page.locator('input[placeholder*="usuario"]'))
      .or(page.locator('input[placeholder*="ej:"]'))
      .first();
    await expect(firstInput).toBeVisible({ timeout: 12_000 });

    // Modificamos el valor
    await firstInput.clear();
    await firstInput.fill('nuevo_nombre_e2e');

    // Guardamos
    const saveBtn = page.locator('button[type="submit"]');
    await saveBtn.click();

    // Debe mostrarse "Guardando cambios..."
    await expect(saveBtn).toContainText(/Guardando/i, { timeout: 3_000 });
  });

  test('El botón Volver navega hacia /app/profile', async ({ page }) => {
    await page.goto('/app/profile/edit');

    // Esperamos a que la página cargue (el botón back es el primero de la nav)
    const backBtn = page.locator('button').filter({ hasText: /Volver/i }).first();
    await expect(backBtn).toBeVisible({ timeout: 12_000 });

    await backBtn.click();

    await expect(page).toHaveURL(/\/app\/profile$/, { timeout: 8_000 });
  });

});
