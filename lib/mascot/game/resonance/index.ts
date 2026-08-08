/**
 * Public API for hero fracture + DomShadowProxy world (V2 Phases 6–7).
 *
 * Starting fracture:
 *   const transition = new HeroFractureTransition({ heroRoot, onPlaying })
 *   transition.beginFromAccessibleTrigger() // or beginFromSlingshot()
 *   // each frame: transition.update(dt); transition.draw(ctx)
 *
 * Reading proxies:
 *   transition.getProxies()
 *   transition.getWorld()
 *   transition.getPhase()
 */

export type {
  FracturePhase,
  HeroProxyObject,
  HeroProxyType,
  WeaverGameState,
} from "./types";
export {
  createEmptyWeaverState,
  HERO_PROXY_CAP_DESKTOP,
  HERO_PROXY_CAP_MOBILE,
  HERO_PROXY_POOL_CAPACITY,
} from "./types";

export {
  snapshotHeroProxies,
  getProxyPoolCapacity,
  resetProxyPoolForTests,
  type SnapshotHeroProxiesOptions,
  type SnapshotElement,
  type SnapshotRoot,
} from "./HeroProxySnapshot";

export {
  DomShadowProxyWorld,
  type DomShadowProxyWorldOptions,
  type ProxyDrawContext,
} from "./DomShadowProxyWorld";

export {
  HeroFractureTransition,
  FRACTURE_ATTR,
  type FractureEntryMode,
  type FractureAttrTarget,
  type HeroFractureTransitionOptions,
} from "./HeroFractureTransition";

export { WEAVER_CONFIG, type WeaverConfig } from "./WeaverConfig";
export {
  createGameRoot,
  integrateGameRoot,
  circleVsCenteredRect,
  bounceRootOffSegment,
  type GameRoot,
} from "./WeaverPhysics";
export {
  WeaveStringSystem,
  resetWeaveStringIdsForTests,
  type WeaveString,
  type WeavePreview,
} from "./WeaveStringSystem";
export { FragmentCollector, type CollectionEvent } from "./FragmentCollector";
export {
  ResonanceWeaverRuntime,
  type ResonanceWeaverRuntimeOptions,
  type WeaverSnapshot,
} from "./ResonanceWeaverRuntime";
