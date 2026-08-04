import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { getOrCreateCert } from './scripts/certs';

export default defineConfig(async () => ({
  root: '.',
  // Prevent Vite's upward postcss-config search from picking up the parent
  // portfolio repo's Tailwind config -- this project is deliberately isolated.
  css: {
    postcss: {
      plugins: []
    }
  },
  server: {
    port: 5183,
    strictPort: true,
    // Listen on the LAN, not just localhost -- the phone controller and QR
    // pairing flow need a phone on the same Wi-Fi to reach this dev server.
    host: true,
    // HTTPS is required for getUserMedia (webcam) and modern motion-sensor
    // APIs on anything but localhost -- a plain LAN IP over HTTP won't get
    // camera or DeviceMotion/DeviceOrientation access on a real phone.
    https: await getOrCreateCert()
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        controller: fileURLToPath(new URL('./controller/index.html', import.meta.url))
      }
    }
  }
}));
