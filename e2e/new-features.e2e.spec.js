// @ts-check
import { test, expect } from '@playwright/test';
import { injectSession, mockSupabaseRoutes } from './helpers.js';

test.describe('Nuevas funciones UI', () => {
  test.beforeEach(async ({ page }) => {
    await injectSession(page);
    await mockSupabaseRoutes(page);
  });

  test('el modo oscuro se activa, persiste y cambia el logo del header', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('snapnation:theme', 'light');
    });

    await page.goto('/app/dashboard');

    const themeToggle = page.getByRole('button', { name: /activar modo oscuro/i });
    await expect(themeToggle).toBeVisible({ timeout: 10_000 });

    await themeToggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('.brand-logo')).toHaveAttribute('src', /logo-propio-blanco/);

    const storedTheme = await page.evaluate(() => localStorage.getItem('snapnation:theme'));
    expect(storedTheme).toBe('dark');
  });

  test('las páginas usan layout plano sin el contenedor decorativo global', async ({ page }) => {
    await page.goto('/app/profile/edit');

    const main = page.locator('main.page');
    await expect(main).toHaveClass(/page--plain/);
  });

  test('subir foto limita título y descripción y bloquea el resize del textarea', async ({ page }) => {
    await page.goto('/app/photos/upload');

    const titleInput = page.getByPlaceholder('Ej. Luces de mi ciudad');
    const descriptionInput = page.getByPlaceholder('¿Qué te inspiró a tomar esta foto?');

    await titleInput.fill('T'.repeat(120));
    await descriptionInput.fill('D'.repeat(650));

    await expect(titleInput).toHaveValue('T'.repeat(80));
    await expect(descriptionInput).toHaveValue('D'.repeat(500));
    await expect(descriptionInput).toHaveJSProperty('maxLength', 500);

    const textareaResize = await descriptionInput.evaluate((node) => getComputedStyle(node).resize);
    expect(textareaResize).toBe('none');
  });

  test('los comentarios tienen límite real de caracteres', async ({ page }) => {
    await page.goto('/app/photos/101');

    const commentInput = page.getByPlaceholder('Escribe algo sobre esta obra...');
    await expect(commentInput).toBeVisible({ timeout: 10_000 });

    await commentInput.fill('C'.repeat(400));

    await expect(commentInput).toHaveValue('C'.repeat(280));
    await expect(commentInput).toHaveJSProperty('maxLength', 280);
    await expect(page.getByText('280/280')).toBeVisible();
  });

  test('el chat móvil abre primero la lista y después la conversación', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 760 });
    await page.goto('/app/chat');

    await expect(page.getByText('@victor_98').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByPlaceholder('Buscar usuarios...')).toBeVisible();
    await expect(page.getByText('Selecciona un usuario para empezar a chatear.')).not.toBeVisible();

    await page.getByText('@victor_98').first().click();

    await expect(page.getByRole('button', { name: 'Volver a mensajes' })).toBeVisible();
    await expect(page.getByText('Ver perfil')).toBeVisible();
    await expect(page.getByPlaceholder('Escribe un mensaje...')).toBeVisible();
  });

  test('las publicaciones compartidas en chat se renderizan como tarjeta', async ({ page }) => {
    await page.goto('/app/chat?user=2');

    await expect(page.getByText('Ver publicación').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.chat-messages img').first()).toBeVisible();
  });

  test('se puede abrir el panel de compartir desde galería y enviar a un usuario', async ({ page }) => {
    await page.goto('/app/dashboard');

    await page.locator('.share-btn').first().click();

    await expect(page.getByText('Compartir en chat')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('@victor_98').first()).toBeVisible();

    await page.getByRole('button', { name: 'Enviar' }).first().click();

    await expect(page.getByText(/Publicación enviada a @victor_98/i)).toBeVisible({ timeout: 10_000 });
  });

  test('FINALIZADO y Ver concurso no se pisan en concursos cerrados', async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 900 });
    await page.goto('/app/contests');

    const closedCard = page.locator('.theme-bracket.is-closed').first();
    await expect(closedCard).toBeVisible({ timeout: 10_000 });

    const label = closedCard.locator('.closed-label').first();
    const link = closedCard.getByRole('link', { name: /ver concurso/i }).first();
    await expect(label).toBeVisible();
    await expect(link).toBeVisible();

    const labelBox = await label.boundingBox();
    const linkBox = await link.boundingBox();
    expect(labelBox).not.toBeNull();
    expect(linkBox).not.toBeNull();

    if (labelBox && linkBox) {
      const overlaps =
        labelBox.x < linkBox.x + linkBox.width &&
        labelBox.x + labelBox.width > linkBox.x &&
        labelBox.y < linkBox.y + linkBox.height &&
        labelBox.y + labelBox.height > linkBox.y;
      expect(overlaps).toBe(false);
    }
  });
});
