export const stitchStages = ["Stitch", "Component", "Pattern", "System"];

// Real quote — pulled directly from the Mobikasa entry in
// constants/experiences.ts, not invented. This section is about real,
// already-shipped design-system work, so nothing here is a placeholder.
export const patternLibraryQuote =
  "Designed and developed a reusable component library using ShadCN and Tailwind with CVA and Framer Motion — dynamic tables, comboboxes, tooltips, trees, timelines, and multi-image selectors. Reduced code duplication by 15% and boosted developer productivity by 10%.";

// 6x4 grid; value = the stage (1-indexed into stitchStages) at which that
// cell lights up. Loosely composes from a single stitch, to a button-shaped
// cluster, to a card-shaped block, to a full dashboard-like grid.
export const stitchGridStages: number[] = [
  4, 4, 3, 3, 4, 4,
  4, 2, 2, 2, 3, 4,
  4, 3, 1, 3, 3, 4,
  4, 4, 3, 3, 4, 4,
];
