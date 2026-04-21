// @ts-check
import { test, expect } from '@playwright/test';
import { injectSession, mockSupabaseRoutes } from './helpers.js';

/**
 * Suite E2E: Fotografías
 * Flujos cubiertos:
 *  1. La página /app/photos/upload carga con sesión → muestra h1 "Publicar Obra"
 *  2. El formulario tiene un select de concurso con opciones
 *  3. Error si se envía sin rellenar el título
 *  4. Error si se envía sin adjuntar imagen
 *  5. El botón cambia a "Subiendo..." durante el procesamiento
 *  6. La página /winners carga contenido visible sin sesión
 *  7. La página /app/winners carga con sesión sin redirigir
 */

test.describe('Fotografías — Página de subida', () => {

  test.beforeEach(async ({ page }) => {
    // Sesión activa + mocks de API para todas las pruebas de upload
    await injectSession(page);
    await mockSupabaseRoutes(page);
  });

  test('La página /app/photos/upload muestra el formulario correctamente', async ({ page }) => {
    await page.goto('/app/photos/upload');

    // Esperamos que el h1 "Publicar Obra" sea visible
    await expect(page.locator('h1')).toContainText('Publicar Obra', { timeout: 10_000 });

    // Campos esenciales
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.locator('#file-input')).toBeAttached();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('El formulario tiene select de concurso con opciones cargadas', async ({ page }) => {
    await page.goto('/app/photos/upload');

    // Esperamos que los datos del concurso carguen
    const contestSelect = page.locator('select').first();
    await expect(contestSelect).toBeVisible({ timeout: 10_000 });

    // Debe tener al menos 2 options (la vacía + el concurso mockeado)
    const options = await contestSelect.locator('option').count();
    expect(options).toBeGreaterThanOrEqual(2);
  });

  test('Error al enviar sin título', async ({ page }) => {
    await page.goto('/app/photos/upload');

    await expect(page.locator('button[type="submit"]')).toBeVisible({ timeout: 10_000 });

    // Enviamos directamente sin rellenar nada
    await page.click('button[type="submit"]');

    // Mensaje de error debe aparecer (el componente usa texto "obligatorio" o "título")
    const errorMsg = page.locator('text=obligatorio').or(page.locator('text=título')).first();
    await expect(errorMsg).toBeVisible({ timeout: 5_000 });
  });

  test('Error al enviar sin imagen adjunta', async ({ page }) => {
    await page.goto('/app/photos/upload');

    await expect(page.locator('input[type="text"]').first()).toBeVisible({ timeout: 10_000 });

    // Rellenamos el título pero no adjuntamos imagen
    await page.fill('input[type="text"]', 'Mi fotografía de prueba E2E');
    await page.click('button[type="submit"]');

    // Debe mostrar error de imagen
    const errorMsg = page.locator('text=fotografía').or(page.locator('text=imagen')).first();
    await expect(errorMsg).toBeVisible({ timeout: 5_000 });
  });

  test('El botón muestra "Subiendo..." durante el procesamiento', async ({ page }) => {
    // Retrasamos las llamadas de storage para ver el estado de carga
    await page.route('**/storage/v1/**', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ Key: 'fake/test.png' }),
      });
    });

    await page.goto('/app/photos/upload');

    await expect(page.locator('input[type="text"]').first()).toBeVisible({ timeout: 10_000 });

    // Rellenamos el título
    await page.fill('input[type="text"]', 'Test estilo carga');

    // Adjuntamos un fichero PNG mínimo válido (1x1 px)
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    await page.locator('#file-input').setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    });

    // Enviamos
    await page.click('button[type="submit"]');

    // El botón debe decir "Subiendo..."
    await expect(page.locator('button[type="submit"]')).toContainText('Subiendo...', { timeout: 3_000 });
  });

});

test.describe('Fotografías — Página de Ganadores', () => {

  test('La página /winners carga y muestra contenido visible (sin sesión)', async ({ page }) => {
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

    await page.goto('/winners');

    await expect(page).toHaveURL(/\/winners/);
    const mainContent = page.locator('h1, h2').first();
    await expect(mainContent).toBeVisible({ timeout: 8_000 });
  });

  test('La página /app/winners es accesible con sesión activa', async ({ page }) => {
    await injectSession(page);
    await mockSupabaseRoutes(page);

    await page.goto('/app/winners');

    await expect(page).not.toHaveURL(/no-session/);
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
  });

});
