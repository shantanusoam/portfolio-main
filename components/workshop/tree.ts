// Semantic move model adapted from ProjectEvidenceDemo. Rendering never owns state.
export type WorkshopNode = {
  id: string;
  label: string;
  parentId: string | null;
};
export type Move = "up" | "down" | "in" | "out";
export const initialNodes: WorkshopNode[] = [
  { id: "prototype", label: "Prototype", parentId: null },
  { id: "enclosure", label: "Build enclosure", parentId: "prototype" },
  { id: "sensor", label: "Wire sensor", parentId: "prototype" },
  { id: "share", label: "Share the work", parentId: null },
  { id: "docs", label: "Write documentation", parentId: "share" },
];
export function flatten(
  nodes: WorkshopNode[],
  parentId: string | null = null,
  depth = 0,
): (WorkshopNode & { depth: number })[] {
  return nodes
    .filter((n) => n.parentId === parentId)
    .flatMap((n) => [{ ...n, depth }, ...flatten(nodes, n.id, depth + 1)]);
}
export function moveNode(
  nodes: WorkshopNode[],
  id: string,
  move: Move,
): WorkshopNode[] {
  const node = nodes.find((n) => n.id === id);
  if (!node) return nodes;
  const siblings = nodes.filter((n) => n.parentId === node.parentId);
  const index = siblings.findIndex((n) => n.id === id);
  if (move === "up" || move === "down") {
    const target = siblings[index + (move === "up" ? -1 : 1)];
    if (!target) return nodes;
    const next = nodes.filter((n) => n.id !== id);
    next.splice(
      next.findIndex((n) => n.id === target.id) + (move === "down" ? 1 : 0),
      0,
      node,
    );
    return next;
  }
  if (move === "in") {
    // Only nest inside a preceding sibling: a descendant can never be its target.
    const parent = siblings[index - 1];
    if (!parent) return nodes;
    return nodes.map((n) => (n.id === id ? { ...n, parentId: parent.id } : n));
  }
  const parent = nodes.find((n) => n.id === node.parentId);
  if (!parent) return nodes;
  const next = nodes.filter((n) => n.id !== id);
  next.splice(next.findIndex((n) => n.id === parent.id) + 1, 0, {
    ...node,
    parentId: parent.parentId,
  });
  return next;
}
