import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para pruebas E2E de SnapNation.
 * Los tests corren contra el servidor de Vite que Playwright lanza automáticamente.
 * Todas las llamadas al backend se interceptan con page.route() en cada test.
 */
export default defineConfig({
  // Directorio donde van los specs E2E.
  testDir: './e2e',

  // Tiempo máximo por test antes de fallar.
  timeout: 20_000,

  // Tiempo máximo para cada expect/assert.
  expect: {
    timeout: 5_000,
  },

  // Ejecutar tests en paralelo dentro del mismo fichero: desactivado para mayor estabilidad.
  fullyParallel: false,

  // Reintentos automáticos en CI (0 en local).
  retries: process.env.CI ? 2 : 0,

  // Número de workers paralelos.
  workers: 1,

  // Reportes: HTML interactivo + resumen en consola.
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  // Opciones compartidas por todos los tests.
  use: {
    // URL base del frontend Vite.
    baseURL: 'http://127.0.0.1:5173',

    // Captura de pantalla sólo en caso de fallo.
    screenshot: 'only-on-failure',

    // Vídeo de la sesión sólo en caso de fallo.
    video: 'retain-on-failure',

    // Trazas de red sólo en el primer reintento.
    trace: 'on-first-retry',

    // Esperar a que el DOM esté listo antes de interactuar.
    actionTimeout: 8_000,
    navigationTimeout: 15_000,
  },

  // Proyectos (navegadores).
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Lanza el servidor de Vite automáticamente si no está corriendo.
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
