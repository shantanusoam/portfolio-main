/**
 * Mobile / touch-primary viewports should keep the hero strings playable by
 * finger, but the fish must not collide with them — body plucks feel noisy
 * and fight touch scrolling on small screens.
 */

export const MOBILE_STRING_CONTACT_MAX_WIDTH = 768;

export function shouldDisableMascotStringContacts(
  cssWidth: number,
  matchMediaFn?: ((query: string) => MediaQueryList) | null,
): boolean {
  if (Number.isFinite(cssWidth) && cssWidth > 0 && cssWidth <= MOBILE_STRING_CONTACT_MAX_WIDTH) {
    return true;
  }

  const matchMedia =
    matchMediaFn ??
    (typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia.bind(window)
      : null);

  if (!matchMedia) return false;

  try {
    // Primary input is a finger — tablets in landscape included.
    return matchMedia("(hover: none) and (pointer: coarse)").matches;
  } catch {
    return false;
  }
}
