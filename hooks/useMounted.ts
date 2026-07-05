import { useEffect, useState } from "react";

/**
 * Returns false on the server AND on the client's very first render (before
 * effects run), then true shortly after. Use this to gate any conditional
 * mount/unmount decision that depends on a value which can legitimately
 * differ between server and client (like usePrefersReducedMotion, whose
 * SSR default is `true` but resolves synchronously to the real preference
 * on the client) — without it, React sees a different DOM structure between
 * the server-rendered HTML and the client's first paint, fails hydration,
 * and throws away the whole root to re-render client-side from scratch.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

export default useMounted;
