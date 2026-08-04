import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
    launchOptions: {
      // Fake camera device + auto-grant permission, so the webcam-adapter
      // test doesn't need a real camera. Harmless for tests that never call
      // getUserMedia.
      args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']
    }
  },
  webServer: [
    {
      command: 'npm run build && npm run preview',
      url: 'http://localhost:4173',
      reuseExistingServer: false,
      timeout: 120_000
    },
    {
      command: 'npx tsx server/relay.ts',
      url: 'http://localhost:8787',
      reuseExistingServer: false,
      timeout: 30_000
    }
  ]
});
