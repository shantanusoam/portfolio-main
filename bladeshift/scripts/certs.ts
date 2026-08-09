import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import selfsigned from 'selfsigned';

/**
 * A locally-trusted-nowhere self-signed cert, shared by the Vite dev server
 * and the relay. Camera access (getUserMedia) and modern motion-sensor APIs
 * require a secure context, and a LAN IP over plain HTTP doesn't qualify --
 * only `localhost` is exempt -- so a real phone on the same Wi-Fi needs this
 * to reach either server as HTTPS/WSS.
 *
 * The phone will still show an "unsafe/untrusted certificate" warning on
 * first visit to each origin (the game page AND the relay, since browsers
 * trust self-signed certs per host:port, not globally) -- that's expected
 * for a self-signed cert; click through it once per origin.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const certDir = join(__dirname, '..', '.cert');
const keyPath = join(certDir, 'key.pem');
const certPath = join(certDir, 'cert.pem');

function localIps(): string[] {
  const ips = new Set<string>(['127.0.0.1']);
  for (const ifaces of Object.values(networkInterfaces())) {
    for (const iface of ifaces ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) ips.add(iface.address);
    }
  }
  return [...ips];
}

export async function getOrCreateCert(): Promise<{ key: string; cert: string }> {
  if (existsSync(keyPath) && existsSync(certPath)) {
    return { key: readFileSync(keyPath, 'utf-8'), cert: readFileSync(certPath, 'utf-8') };
  }

  const altNames: Array<{ type: 2 | 7; value?: string; ip?: string }> = [
    { type: 2, value: 'localhost' },
    ...localIps().map((ip) => ({ type: 7 as const, ip }))
  ];

  const notBefore = new Date();
  const notAfter = new Date(notBefore);
  notAfter.setFullYear(notAfter.getFullYear() + 10);

  const pems = await selfsigned.generate([{ name: 'commonName', value: 'localhost' }], {
    notBeforeDate: notBefore,
    notAfterDate: notAfter,
    keySize: 2048,
    algorithm: 'sha256',
    extensions: [
      { name: 'basicConstraints', cA: false },
      { name: 'keyUsage', digitalSignature: true, keyEncipherment: true },
      { name: 'subjectAltName', altNames }
    ]
  });

  mkdirSync(certDir, { recursive: true });
  writeFileSync(keyPath, pems.private);
  writeFileSync(certPath, pems.cert);

  return { key: pems.private, cert: pems.cert };
}
