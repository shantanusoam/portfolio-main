"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Database,
  GitBranch,
  Indent,
  Outdent,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import type { CaseStudyArtifact } from "@/@types/mission.type";

type ProjectEvidenceDemoProps = {
  artifact: CaseStudyArtifact;
};

type DemoNode = {
  id: string;
  label: string;
  parentId: string | null;
};

type FlatDemoNode = DemoNode & {
  depth: number;
};

const initialTree: DemoNode[] = [
  { id: "crm", label: "CRM", parentId: null },
  { id: "leads", label: "Leads", parentId: "crm" },
  { id: "accounts", label: "Accounts", parentId: "crm" },
  { id: "ops", label: "Operations", parentId: null },
  { id: "orders", label: "Orders", parentId: "ops" },
  { id: "billing", label: "Billing", parentId: "ops" },
];

function flattenTree(
  nodes: DemoNode[],
  parentId: string | null = null,
  depth = 0,
): FlatDemoNode[] {
  return nodes
    .filter((node) => node.parentId === parentId)
    .flatMap((node) => [
      { ...node, depth },
      ...flattenTree(nodes, node.id, depth + 1),
    ]);
}

function moveWithinSiblings(nodes: DemoNode[], nodeId: string, direction: -1 | 1) {
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

function isDescendant(nodes: DemoNode[], maybeChildId: string, maybeParentId: string) {
  let current = nodes.find((node) => node.id === maybeChildId);
  while (current?.parentId) {
    if (current.parentId === maybeParentId) return true;
    current = nodes.find((node) => node.id === current?.parentId);
  }
  return false;
}

function DynamicTreeDemo() {
  const [nodes, setNodes] = useState<DemoNode[]>(initialTree);
  const [selectedId, setSelectedId] = useState("accounts");
  const [lastMove, setLastMove] = useState(
    '{ "nodeId": "accounts", "parentId": "crm", "position": "after", "siblingId": "leads" }',
  );
  const flat = useMemo(() => flattenTree(nodes), [nodes]);
  const selectedIndex = flat.findIndex((node) => node.id === selectedId);

  const commitMove = (nextNodes: DemoNode[], move: Record<string, string | null>) => {
    setNodes(nextNodes);
    setLastMove(JSON.stringify(move, null, 2));
  };

  const moveUp = () => {
    const node = nodes.find((item) => item.id === selectedId);
    const siblings = nodes.filter((item) => item.parentId === node?.parentId);
    const siblingIndex = siblings.findIndex((item) => item.id === selectedId);
    const before = siblings[siblingIndex - 1];
    commitMove(moveWithinSiblings(nodes, selectedId, -1), {
      nodeId: selectedId,
      parentId: node?.parentId ?? null,
      position: before ? "before" : "unchanged",
      siblingId: before?.id ?? null,
    });
  };

  const moveDown = () => {
    const node = nodes.find((item) => item.id === selectedId);
    const siblings = nodes.filter((item) => item.parentId === node?.parentId);
    const siblingIndex = siblings.findIndex((item) => item.id === selectedId);
    const after = siblings[siblingIndex + 1];
    commitMove(moveWithinSiblings(nodes, selectedId, 1), {
      nodeId: selectedId,
      parentId: node?.parentId ?? null,
      position: after ? "after" : "unchanged",
      siblingId: after?.id ?? null,
    });
  };

  const nest = () => {
    const previous = flat[selectedIndex - 1];
    if (!previous || previous.id === selectedId || isDescendant(nodes, previous.id, selectedId)) return;
    const nextNodes = nodes.map((node) =>
      node.id === selectedId ? { ...node, parentId: previous.id } : node,
    );
    commitMove(nextNodes, {
      nodeId: selectedId,
      parentId: previous.id,
      position: "inside",
      siblingId: null,
    });
  };

  const outdent = () => {
    const node = nodes.find((item) => item.id === selectedId);
    const parent = nodes.find((item) => item.id === node?.parentId);
    if (!node || !parent) return;
    const nextNodes = nodes.map((item) =>
      item.id === selectedId ? { ...item, parentId: parent.parentId } : item,
    );
    commitMove(nextNodes, {
      nodeId: selectedId,
      parentId: parent.parentId ?? null,
      position: "after",
      siblingId: parent.id,
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <div
        className="border border-white/15 bg-white/[0.02] p-4"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") moveUp();
          if (event.key === "ArrowDown") moveDown();
          if (event.key === "ArrowRight") nest();
          if (event.key === "ArrowLeft") outdent();
        }}
        aria-label="Semantic tree demo"
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 border border-white/15 px-3 py-2 text-xs text-white/70" onClick={moveUp} type="button">
            <ArrowUp size={13} aria-hidden="true" /> Up
          </button>
          <button className="inline-flex items-center gap-2 border border-white/15 px-3 py-2 text-xs text-white/70" onClick={moveDown} type="button">
            <ArrowDown size={13} aria-hidden="true" /> Down
          </button>
          <button className="inline-flex items-center gap-2 border border-white/15 px-3 py-2 text-xs text-white/70" onClick={nest} type="button">
            <Indent size={13} aria-hidden="true" /> Nest
          </button>
          <button className="inline-flex items-center gap-2 border border-white/15 px-3 py-2 text-xs text-white/70" onClick={outdent} type="button">
            <Outdent size={13} aria-hidden="true" /> Outdent
          </button>
          <button className="inline-flex items-center gap-2 border border-white/15 px-3 py-2 text-xs text-white/70" onClick={() => {
            setNodes(initialTree);
            setSelectedId("accounts");
            setLastMove('{ "nodeId": "accounts", "parentId": "crm", "position": "after", "siblingId": "leads" }');
          }} type="button">
            <RotateCcw size={13} aria-hidden="true" /> Reset
          </button>
        </div>

        <div className="grid gap-2">
          {flat.map((node) => (
            <button
              className={`flex items-center justify-between border px-3 py-2 text-left text-sm transition ${
                node.id === selectedId
                  ? "border-primary bg-primary/10 text-white"
                  : "border-white/10 text-white/55"
              }`}
              key={node.id}
              onClick={() => setSelectedId(node.id)}
              style={{ marginLeft: node.depth * 22 }}
              type="button"
            >
              <span>{node.label}</span>
              <span className="font-mono text-[10px] uppercase text-white/30">
                {node.parentId ?? "root"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="border border-white/15 bg-black/35 p-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
          Last committed semantic move
        </p>
        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-white/65">
          <code>{lastMove}</code>
        </pre>
        <p className="mt-4 text-sm leading-7 text-white/45">
          The demo is intentionally command-driven: pointer dragging and keyboard
          controls should both end as the same node, parent, and sibling-position
          operation.
        </p>
      </div>
    </div>
  );
}

function KnowbuildDemo() {
  const [tenant, setTenant] = useState("acme");
  const [offset, setOffset] = useState(0);
  const visibleRows = Array.from({ length: 12 }, (_, index) => offset + index + 1);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
      <div className="border border-white/15 bg-white/[0.02] p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {["acme", "northstar", "denied"].map((item) => (
            <button
              className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-widest ${
                tenant === item
                  ? "border-primary bg-primary text-black"
                  : "border-white/15 text-white/55"
              }`}
              key={item}
              onClick={() => setTenant(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="grid gap-3">
          {[
            ["Subdomain", `${tenant}.knowbuild.com`],
            ["Tenant context", tenant === "denied" ? "No active tenant permission" : `tenant:${tenant}`],
            ["Route guard", tenant === "denied" ? "blocked before fetch" : "route allowed"],
            ["Resource rule", tenant === "denied" ? "no table data returned" : "scoped table access"],
            ["Query cache", tenant === "denied" ? "not hydrated" : `["orders", "${tenant}"]`],
          ].map(([label, value]) => (
            <div className="grid grid-cols-[130px_1fr] gap-3 border border-white/10 p-3" key={label}>
              <span className="font-mono text-[10px] uppercase tracking-widest text-primary">{label}</span>
              <span className="text-sm text-white/60">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-white/15 bg-black/35 p-4">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
            Virtualized 10k-row surface
          </p>
          <span className="text-xs text-white/40">rendering 12 / 10000 rows</span>
        </div>
        <input
          aria-label="Virtualized table offset"
          className="my-4 w-full"
          max={9988}
          min={0}
          onChange={(event) => setOffset(Number(event.target.value))}
          step={37}
          type="range"
          value={offset}
        />
        <div className="grid max-h-[280px] gap-1 overflow-hidden">
          {visibleRows.map((row) => (
            <div className="grid grid-cols-[80px_1fr_auto] border border-white/10 px-3 py-2 text-xs text-white/55" key={row}>
              <span className="font-mono text-primary/80">#{row}</span>
              <span>{tenant === "denied" ? "permission blocked" : `Scoped operational row for ${tenant}`}</span>
              <span>{tenant === "denied" ? "0ms fetch" : "cached"}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-7 text-white/45">
          This is a sanitized interaction model, not client data. The point is
          the request path and render-window behavior.
        </p>
      </div>
    </div>
  );
}

function NivaDemo() {
  const [active, setActive] = useState("query");
  const panels = {
    query: {
      icon: <Database size={16} aria-hidden="true" />,
      title: "Sanitized query plan",
      rows: [
        ["Before", "Policy lookup risked broad scans under peak traffic."],
        ["Change", "Targeted indexes plus nightly housekeeping."],
        ["After", "Representative lookup latency down by more than 30%."],
      ],
    },
    controls: {
      icon: <ShieldCheck size={16} aria-hidden="true" />,
      title: "Security control matrix",
      rows: [
        ["Identity", "SSO, 2FA, password rotation."],
        ["Network", "IP whitelisting for sensitive portal paths."],
        ["Portal", "XSS and CSRF remediation validated by external testing."],
      ],
    },
    release: {
      icon: <GitBranch size={16} aria-hidden="true" />,
      title: "Blue-green rollback lane",
      rows: [
        ["Build", "Container image promoted through release lane."],
        ["Route", "Nginx/Kubernetes ingress can switch traffic."],
        ["Recover", "Rollback path reduced from about 20 minutes to under 5."],
      ],
    },
  } as const;
  const panel = panels[active as keyof typeof panels];

  return (
    <div className="border border-white/15 bg-white/[0.02] p-4">
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(panels).map(([key, item]) => (
          <button
            className={`inline-flex items-center gap-2 border px-3 py-2 font-mono text-[10px] uppercase tracking-widest ${
              active === key
                ? "border-primary bg-primary text-black"
                : "border-white/15 text-white/55"
            }`}
            key={key}
            onClick={() => setActive(key)}
            type="button"
          >
            {item.icon}
            {key}
          </button>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="border border-white/10 bg-black/25 p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
            {panel.title}
          </p>
          <p className="mt-4 text-sm leading-7 text-white/50">
            All values are sanitized. The public evidence describes the
            decision path and before/after shape without exposing production
            queries, vulnerabilities, or infrastructure identifiers.
          </p>
        </div>
        <div className="grid gap-2">
          {panel.rows.map(([label, value]) => (
            <div className="grid grid-cols-[110px_1fr] gap-3 border border-white/10 p-3" key={label}>
              <span className="font-mono text-[10px] uppercase tracking-widest text-primary">{label}</span>
              <span className="text-sm text-white/60">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProjectEvidenceDemo({ artifact }: ProjectEvidenceDemoProps) {
  if (artifact === "dynamic-tree-demo") return <DynamicTreeDemo />;
  if (artifact === "knowbuild-tenant-flow") return <KnowbuildDemo />;
  if (artifact === "niva-risk-release") return <NivaDemo />;
  return null;
}
