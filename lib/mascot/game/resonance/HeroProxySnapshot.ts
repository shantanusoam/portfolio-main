/**
 * One-shot hero geometry snapshot for DomShadowProxyWorld (V2 §12–13, §39).
 * Curated selectors only — never every DOM node. All getBoundingClientRect
 * calls happen here; the game loop must not re-measure.
 */

import { SeededRandom } from "../../core/SeededRandom";
import { clamp } from "../../core/NumericGuards";
import {
  HERO_PROXY_CAP_DESKTOP,
  HERO_PROXY_CAP_MOBILE,
  HERO_PROXY_POOL_CAPACITY,
  type HeroProxyObject,
  type HeroProxyType,
} from "./types";

export interface SnapshotHeroProxiesOptions {
  seed?: number;
  /** Override auto cap (still clamped to pool capacity). */
  maxProxies?: number;
  isMobile?: boolean;
  rng?: SeededRandom;
}

/** Duck-typed element — avoids `instanceof HTMLElement` so Node tests work. */
export interface SnapshotElement {
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
  getBoundingClientRect(): {
    left: number;
    top: number;
    width: number;
    height: number;
    right?: number;
    bottom?: number;
  };
  textContent?: string | null;
  style?: { color?: string };
}

export interface SnapshotRoot {
  querySelectorAll(selectors: string): ArrayLike<SnapshotElement>;
}

const PROXY_ATTR = "data-mascot-proxy";
const PERCH_ATTR = "data-mascot-perch";

const TYPE_PRIORITY: Record<HeroProxyType, number> = {
  letter: 0,
  word: 1,
  bar: 2,
  string: 3,
  dot: 4,
  buttonEdge: 5,
  decorativeLine: 6,
};

function createEmptyProxy(slot: number): HeroProxyObject {
  return {
    id: `proxy-slot-${slot}`,
    sourceElement: null,
    type: "dot",
    homeX: 0,
    homeY: 0,
    x: 0,
    y: 0,
    previousX: 0,
    previousY: 0,
    velocityX: 0,
    velocityY: 0,
    rotation: 0,
    angularVelocity: 0,
    width: 0,
    height: 0,
    opacity: 0,
    collected: false,
    label: "",
    fillStyle: "rgba(245, 251, 255, 0.92)",
  };
}

/** Fixed-capacity pool — reused across transitions; never grows unbounded. */
const proxyPool: HeroProxyObject[] = Array.from(
  { length: HERO_PROXY_POOL_CAPACITY },
  (_, i) => createEmptyProxy(i),
);

export function getProxyPoolCapacity(): number {
  return proxyPool.length;
}

export function resetProxyPoolForTests(): void {
  for (let i = 0; i < proxyPool.length; i += 1) {
    Object.assign(proxyPool[i], createEmptyProxy(i));
  }
}

function resolveProxyType(el: SnapshotElement): HeroProxyType | null {
  const explicit = el.getAttribute(PROXY_ATTR);
  if (explicit !== null) {
    if (
      explicit === "letter" ||
      explicit === "word" ||
      explicit === "bar" ||
      explicit === "string" ||
      explicit === "dot" ||
      explicit === "buttonEdge" ||
      explicit === "decorativeLine"
    ) {
      return explicit;
    }
    // Bare data-mascot-proxy="" / unknown → treat as decorative
    return "decorativeLine";
  }

  if (el.hasAttribute(PERCH_ATTR)) return "bar";
  return null;
}

function readLabel(el: SnapshotElement, type: HeroProxyType): string {
  const fromAttr = el.getAttribute("data-proxy-label");
  if (fromAttr != null && fromAttr.length > 0) return fromAttr;
  if (type === "letter" || type === "word") {
    const text = (el.textContent ?? "").trim();
    return text.length <= 24 ? text : text.slice(0, 24);
  }
  return "";
}

function readFill(el: SnapshotElement, type: HeroProxyType): string {
  if (type === "bar" || type === "decorativeLine") {
    return "rgba(255, 255, 255, 0.28)";
  }
  if (type === "dot") return "rgba(56, 242, 216, 0.75)";
  if (type === "string") return "rgba(56, 242, 216, 0.55)";
  const color = el.style?.color;
  if (color && color.length > 0) return color;
  return "rgba(245, 251, 255, 0.92)";
}

interface Candidate {
  element: SnapshotElement;
  type: HeroProxyType;
  rect: { left: number; top: number; width: number; height: number };
}

function collectCandidates(root: SnapshotRoot): Candidate[] {
  const seen = new Set<SnapshotElement>();
  const out: Candidate[] = [];

  const nodes = root.querySelectorAll(`[${PROXY_ATTR}], [${PERCH_ATTR}]`);

  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (!node || typeof node.getBoundingClientRect !== "function") continue;
    if (seen.has(node)) continue;
    const type = resolveProxyType(node);
    if (!type) continue;
    seen.add(node);
    // Reason: measure ONCE here — DomShadowProxyWorld never calls this again.
    const rect = node.getBoundingClientRect();
    if (rect.width < 0.5 && rect.height < 0.5) continue;
    out.push({ element: node, type, rect });
  }

  out.sort(
    (a, b) =>
      TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type] ||
      a.rect.top - b.rect.top ||
      a.rect.left - b.rect.left,
  );
  return out;
}

function resolveMaxProxies(options: SnapshotHeroProxiesOptions): number {
  if (options.maxProxies != null && Number.isFinite(options.maxProxies)) {
    return clamp(Math.floor(options.maxProxies), 1, HERO_PROXY_POOL_CAPACITY);
  }
  const mobile =
    options.isMobile ??
    (typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 768px)").matches);
  return mobile ? HERO_PROXY_CAP_MOBILE : HERO_PROXY_CAP_DESKTOP;
}

function fillProxyFromCandidate(
  proxy: HeroProxyObject,
  candidate: Candidate,
  index: number,
  rng: SeededRandom,
): void {
  const { rect, type, element } = candidate;
  const cx = rect.left + rect.width * 0.5;
  const cy = rect.top + rect.height * 0.5;
  const angle = rng.angle();
  const speed = rng.range(40, 160);

  proxy.id = `hero-proxy-${index}`;
  // Cast: live DOM passes HTMLElement; tests pass duck-typed stubs.
  proxy.sourceElement = element as unknown as HTMLElement;
  proxy.type = type;
  proxy.homeX = cx;
  proxy.homeY = cy;
  proxy.x = cx;
  proxy.y = cy;
  proxy.previousX = cx;
  proxy.previousY = cy;
  proxy.velocityX = Math.cos(angle) * speed;
  proxy.velocityY = Math.sin(angle) * speed * 0.35 - rng.range(20, 80);
  proxy.rotation = 0;
  proxy.angularVelocity = rng.range(-2.2, 2.2);
  proxy.width = Math.max(2, rect.width);
  proxy.height = Math.max(2, rect.height);
  proxy.opacity = 1;
  proxy.collected = false;
  proxy.label = readLabel(element, type);
  proxy.fillStyle = readFill(element, type);
}

/**
 * Snapshot curated hero visuals into pooled `HeroProxyObject`s.
 * Returns a slice of the shared pool (length ≤ cap) — do not retain across
 * a second snapshot without copying; callers should hand off to
 * DomShadowProxyWorld immediately.
 */
export function snapshotHeroProxies(
  root: SnapshotRoot,
  options: SnapshotHeroProxiesOptions = {},
): HeroProxyObject[] {
  const max = resolveMaxProxies(options);
  const rng = options.rng ?? new SeededRandom(options.seed ?? 0x5e2d_c0de);
  const candidates = collectCandidates(root);
  const count = Math.min(candidates.length, max, proxyPool.length);
  const result: HeroProxyObject[] = [];

  for (let i = 0; i < count; i += 1) {
    const proxy = proxyPool[i];
    fillProxyFromCandidate(proxy, candidates[i], i, rng);
    result.push(proxy);
  }

  // Clear unused pool slots so stale geometry cannot leak into a later draw.
  for (let i = count; i < proxyPool.length; i += 1) {
    Object.assign(proxyPool[i], createEmptyProxy(i));
  }

  return result;
}
