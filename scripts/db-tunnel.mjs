import { spawn } from "node:child_process";

const REQUIRED_ENV = [
  "DB_TUNNEL_SSH_HOST",
  "DB_TUNNEL_SSH_USER",
  "DB_TUNNEL_TARGET_HOST",
];
const missing = REQUIRED_ENV.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(
    `Missing tunnel configuration: ${missing.join(", ")}. ` +
      "Set these environment variables before running npm run db:tunnel.",
  );
  process.exit(1);
}

function readPort(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`${name} must be an integer between 1 and 65535.`);
  }
  return value;
}

function readIdentifier(name) {
  const value = process.env[name];
  if (!value || !/^[a-zA-Z0-9._-]+$/.test(value)) {
    throw new Error(`${name} contains unsupported characters.`);
  }
  return value;
}

const sshHost = readIdentifier("DB_TUNNEL_SSH_HOST");
const sshUser = readIdentifier("DB_TUNNEL_SSH_USER");
const targetHost = readIdentifier("DB_TUNNEL_TARGET_HOST");
const localPort = readPort("DB_TUNNEL_LOCAL_PORT", 5433);
const targetPort = readPort("DB_TUNNEL_TARGET_PORT", 5432);

const tunnel = spawn(
  "ssh",
  [
    "-F",
    "/dev/null",
    "-N",
    "-L",
    `${localPort}:${targetHost}:${targetPort}`,
    `${sshUser}@${sshHost}`,
  ],
  { stdio: "inherit" },
);

tunnel.once("error", (error) => {
  console.error(`Unable to start SSH tunnel: ${error.message}`);
  process.exitCode = 1;
});
tunnel.once("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => tunnel.kill(signal));
}
