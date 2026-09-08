import { spawn } from "node:child_process";
import { createRequire } from "node:module";

// Accept the preview supervisor's Vite-style flags while keeping Next's normal
// development command and every user-supplied argument.
const require = createRequire(import.meta.url);
const args = process.argv.slice(2).flatMap((argument) => {
  if (argument === "--strictPort") return [];
  if (argument === "--host") return ["--hostname"];
  if (argument.startsWith("--host="))
    return ["--hostname=" + argument.slice(7)];
  return [argument];
});
const child = spawn(
  process.execPath,
  [require.resolve("next/dist/bin/next"), "dev", ...args],
  {
    stdio: "inherit",
    env: process.env,
  },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("error", (error) => {
  process.stderr.write(error.message + "\n");
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 0;
});
