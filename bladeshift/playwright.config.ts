import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'https://localhost:4173',
    headless: true,
    // Both servers use a locally-generated self-signed cert (see
    // scripts/certs.ts) -- required for getUserMedia/motion-sensor access
    // on a real phone, but means the browser has to be told to trust it.
    ignoreHTTPSErrors: true,
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
      url: 'https://localhost:4173',
      ignoreHTTPSErrors: true,
      reuseExistingServer: false,
      timeout: 120_000
    },
    {
      command: 'npx tsx server/relay.ts',
      url: 'https://localhost:8787',
      ignoreHTTPSErrors: true,
      reuseExistingServer: false,
      timeout: 30_000
    }
  ]
});
