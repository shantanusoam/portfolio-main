export interface LivingDeviceHints {
  reducedMotion: boolean;
  forcedColors: boolean;
  webgpu: boolean;
  cores: number;
  memory?: number;
  saveData?: boolean;
}

export function selectLivingDeviceTier(hints: LivingDeviceHints) {
  const low =
    hints.reducedMotion ||
    hints.forcedColors ||
    !hints.webgpu ||
    hints.saveData ||
    (hints.cores > 0 && hints.cores <= 4) ||
    (hints.memory !== undefined && hints.memory <= 4);
  const high = !low && hints.cores >= 12 && (hints.memory ?? 0) >= 8;
  return {
    tier: low ? "low" : high ? "high" : "balanced",
    attemptWebGpu: !low,
    highQuality: high,
    dprCap: low ? 0.85 : high ? 1.25 : 1,
    frameIntervalMs: high ? 1000 / 60 : 1000 / 30,
  } as const;
}

export function readLivingDeviceTier(reducedMotion: boolean) {
  const browser = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  return selectLivingDeviceTier({
    reducedMotion,
    forcedColors: matchMedia("(forced-colors: active)").matches,
    webgpu: "gpu" in navigator,
    cores: navigator.hardwareConcurrency || 0,
    memory: browser.deviceMemory,
    saveData: browser.connection?.saveData,
  });
}
