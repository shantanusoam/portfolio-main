/**
 * The working sketch's state model — the semantic-move logic from the
 * repo's DynamicTreeDemo (components/projects/ProjectEvidenceDemo.tsx),
 * which itself mirrors the dnd-dynamic-tree package's contract: a move is
 * { node, parent, sibling position }, never a visual index change.
 *
 * Pure functions only, so the model can be reasoned about (and tested)
 * without React. The invariant the sketch demonstrates: a node can never
 * become its own ancestor — `isDescendant` guards every nesting move.
 */

export type SketchNode = {
  id: string;
  label: string;
  parentId: string | null;
};

export type FlatSketchNode = SketchNode & { depth: number };

/** Sample data — demonstrative workshop tasks, not a claim of shipped work. */
export const INITIAL_SKETCH: SketchNode[] = [
  { id: "enclosure-build", label: "Enclosure build", parentId: null },
  { id: "enclosure-body", label: "Build the enclosure body", parentId: "enclosure-build" },
  { id: "wire-sensor", label: "Wire the sensor", parentId: "enclosure-body" },
  { id: "documentation", label: "Documentation", parentId: null },
  { id: "assembly-notes", label: "Write assembly notes", parentId: "documentation" },
  { id: "photo-repair", label: "Photograph the repair", parentId: "documentation" },
];

export function flattenSketch(
  nodes: SketchNode[],
  parentId: string | null = null,
  depth = 0,
): FlatSketchNode[] {
  return nodes
    .filter((node) => node.parentId === parentId)
    .flatMap((node) => [
      { ...node, depth },
      ...flattenSketch(nodes, node.id, depth + 1),
    ]);
}

/** Would `maybeAncestorId` sit above `nodeId`? The ancestry guard. */
export function isDescendant(
  nodes: SketchNode[],
  nodeId: string,
  maybeAncestorId: string,
): boolean {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  let currentId: string | null = nodeId;
  while (currentId) {
    const current = byId.get(currentId);
    if (!current) return false;
    if (current.parentId === maybeAncestorId) return true;
    currentId = current.parentId;
  }
  return false;
}

export function moveWithinSiblings(
  nodes: SketchNode[],
  nodeId: string,
  direction: -1 | 1,
): SketchNode[] {
  const node = nodes.find((item) => item.id === nodeId);
  if (!node) return nodes;
  const siblings = nodes.filter((item) => item.parentId === node.parentId);
  const siblingIndex = siblings.findIndex((item) => item.id === nodeId);
  const nextSibling = siblings[siblingIndex + direction];
  if (!nextSibling) return nodes;

  const nodeIndex = nodes.findIndex((item) => item.id === node.id);
  const nextIndex = nodes.findIndex((item) => item.id === nextSibling.id);
  const copy = [...nodes];
  const [removed] = copy.splice(nodeIndex, 1);
  copy.splice(nextIndex, 0, removed);
  return copy;
}

export type SemanticMove = {
  nodeId: string;
  parentId: string | null;
  position: "before" | "after" | "inside" | "unchanged";
  siblingId: string | null;
};

export function describeMove(move: SemanticMove): string {
  return JSON.stringify(move, null, 2);
}
