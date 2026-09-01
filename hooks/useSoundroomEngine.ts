"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  getSoundroomEngine,
  type SoundroomEngine,
} from "@/lib/audio/SoundroomEngine";

export function useSoundroomEngine(): SoundroomEngine {
  const engine = useMemo(() => getSoundroomEngine(), []);
  useEffect(() => {
    engine.hydrate().catch(() => undefined);
  }, [engine]);
  return engine;
}

export function useSoundroomPlayer(engine: SoundroomEngine) {
  return useSyncExternalStore(
    engine.subscribe,
    engine.getSnapshot,
    engine.getServerSnapshot,
  );
}
