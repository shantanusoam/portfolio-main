/**
 * Authored system diagrams for the Selected Work rows.
 *
 * The brief is explicit: the old homepage showed abstract material
 * sculptures labelled "Product evidence" — misleading. Until real redacted
 * captures exist, these hand-drawn diagrams are the honest artifact: they
 * are labelled as *authored diagrams, reconstructed for explanation*, and
 * they carry real labels because they are real explanations.
 *
 * One ink, one accent, mono labels — the diagrams belong to the same world
 * as the courtyard illustration.
 */

const INK = "#173C32";
const INK_SOFT = "rgba(23, 60, 50, 0.62)";
const LINE = "rgba(23, 60, 50, 0.32)";
const PAPER = "#F3EEDC";
const PAPER_DEEP = "#ECE5CC";
const CLAY = "#A14F35";
const SUN = "#D9AA45";
const MONO = "var(--ws-font-mono), ui-monospace, monospace";

function Box({
  x,
  y,
  w = 148,
  h = 46,
  label,
  sub,
  accent,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  label: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="2"
        fill={PAPER}
        stroke={accent ? CLAY : INK}
        strokeWidth={accent ? 1.8 : 1.4}
      />
      <text
        x={x + w / 2}
        y={y + (sub ? 20 : 27)}
        textAnchor="middle"
        fontFamily={MONO}
        fontSize="12.5"
        fill={INK}
        fontWeight={accent ? 600 : 400}
      >
        {label}
      </text>
      {sub ? (
        <text
          x={x + w / 2}
          y={y + 36}
          textAnchor="middle"
          fontFamily={MONO}
          fontSize="10"
          fill={INK_SOFT}
        >
          {sub}
        </text>
      ) : null}
    </g>
  );
}

function Arrow({
  d,
  dashed,
}: {
  d: string;
  dashed?: boolean;
}) {
  return (
    <path
      d={d}
      fill="none"
      stroke={CLAY}
      strokeWidth="1.6"
      strokeDasharray={dashed ? "4 4" : undefined}
      markerEnd="url(#ws-arrow)"
    />
  );
}

function DiagramDefs() {
  return (
    <defs>
      <marker
        id="ws-arrow"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
      >
        <path d="M0 0 L10 5 L0 10 Z" fill={CLAY} />
      </marker>
    </defs>
  );
}

// The diagram plates are the flagship scene's largest quiet panels — they
// carry the same jaali whisper as every other panel on the page (shared
// .panelJaali; keep stroke-opacity in sync — round 2 ruled 0.045 invisible).
const frameStyle = {
  backgroundColor: PAPER_DEEP,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26' height='26'%3E%3Cpath d='M0 26L26 0M0 0l26 26' stroke='%23173C32' stroke-opacity='0.08' stroke-width='1'/%3E%3C/svg%3E")`,
  backgroundSize: "26px 26px",
} as const;

/** Knowbuild — the request path and the state split that made it safe. */
export function KnowbuildDiagram() {
  return (
    <figure style={frameStyle}>
      <svg
        viewBox="0 0 560 420"
        role="img"
        aria-label="Authored diagram: a tenant request flows through the subdomain resolver, permission module and query cache into a virtualized view, with server state and UI state on separate sides of a line."
        style={{ display: "block", width: "100%", height: "auto" }}
      >
        <DiagramDefs />
        <text x="32" y="42" fontFamily={MONO} fontSize="11" fill={INK_SOFT} letterSpacing="2">
          REQUEST PATH — MULTI-TENANT CRM/ERP
        </text>
        <line x1="32" y1="56" x2="528" y2="56" stroke={LINE} strokeWidth="1" />

        <Box x={32} y={92} label="Subdomain resolver" sub="tenant from host" />
        <Box x={230} y={92} label="Permission module" sub="explicit decisions" />
        <Box x={32} y={238} label="Query cache" sub="server state · TanStack" />
        <Box x={230} y={238} label="Virtualized view" sub="10k rows / window" accent />

        <Arrow d="M180 115 L228 115" />
        <Arrow d="M304 140 C304 190 142 186 106 236" />
        <text x="212" y="196" fontFamily={MONO} fontSize="10" fill={INK_SOFT}>
          allowed query only
        </text>
        <Arrow d="M180 261 L228 261" />

        {/* the decision: one line, two kinds of state */}
        <line
          x1="205"
          y1="80"
          x2="205"
          y2="330"
          stroke={INK}
          strokeWidth="1.2"
          strokeDasharray="3 5"
        />
        <text x="118" y="352" textAnchor="middle" fontFamily={MONO} fontSize="10.5" fill={INK_SOFT}>
          SERVER STATE
        </text>
        <text x="360" y="352" textAnchor="middle" fontFamily={MONO} fontSize="10.5" fill={INK_SOFT}>
          UI STATE (REDUX)
        </text>
        <text x="528" y="352" textAnchor="end" fontFamily={MONO} fontSize="10.5" fill={CLAY}>
          split by ownership
        </text>

        <text x="32" y="396" fontFamily={MONO} fontSize="10" fill={INK_SOFT}>
          ~40% fewer redundant API calls after the split
        </text>
        <rect x="392" y="20" width="136" height="22" rx="2" fill={SUN} opacity="0.9" stroke={INK} strokeWidth="0.75" />
        <text x="460" y="35" textAnchor="middle" fontFamily={MONO} fontSize="10" fill={INK}>
          BUDGET IN CI
        </text>
      </svg>
      <figcaption
        style={{
          fontFamily: MONO,
          fontSize: "0.625rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: INK_SOFT,
          padding: "10px 2px 0",
        }}
      >
        Authored diagram — reconstructed for explanation
      </figcaption>
    </figure>
  );
}

/** Niva Bupa — the performance rail and the blue-green release rail. */
export function NivaDiagram() {
  return (
    <figure style={frameStyle}>
      <svg
        viewBox="0 0 560 420"
        role="img"
        aria-label="Authored diagram: policy lookups hit targeted indexes on the performance rail while releases move through a container into an ingress that can switch traffic between blue and green slots for a fast rollback."
        style={{ display: "block", width: "100%", height: "auto" }}
      >
        <DiagramDefs />
        <text x="32" y="42" fontFamily={MONO} fontSize="11" fill={INK_SOFT} letterSpacing="2">
          TWO RAILS — LIVE HEALTHCARE PLATFORM
        </text>
        <line x1="32" y1="56" x2="528" y2="56" stroke={LINE} strokeWidth="1" />

        {/* rail 1: performance */}
        <Box x={32} y={86} label="Policy lookup" sub="peak traffic" />
        <Box x={230} y={86} label="Targeted index" sub="+ housekeeping" accent />
        <text x="438" y="112" textAnchor="middle" fontFamily={MONO} fontSize="15" fill={CLAY} fontWeight="600">
          −30%
        </text>
        <text x="438" y="128" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill={INK_SOFT}>
          PEAK LATENCY
        </text>
        <Arrow d="M180 109 L228 109" />

        {/* rail 2: release */}
        <Box x={32} y={210} label="Build" sub="container image" />
        <Box x={230} y={210} label="Ingress" sub="nginx / k8s" />
        <Box x={418} y={170} w={110} h={40} label="BLUE" sub="live" />
        <Box x={418} y={248} w={110} h={40} label="GREEN" sub="rehearsed" />
        <Arrow d="M180 233 L228 233" />
        <Arrow d="M378 226 L416 196" />
        <Arrow d="M378 240 L416 264" />
        {/* rollback: traffic hands back from GREEN to BLUE along one dashed line */}
        <path
          d="M473 244 L473 214"
          fill="none"
          stroke={CLAY}
          strokeWidth="1.6"
          strokeDasharray="4 4"
          markerEnd="url(#ws-arrow)"
        />
        <text x="483" y="234" fontFamily={MONO} fontSize="10" fill={INK_SOFT}>
          rollback
        </text>

        <text x="32" y="330" fontFamily={MONO} fontSize="10.5" fill={INK_SOFT}>
          Traffic switches slots; the old slot stays warm.
        </text>
        <text x="32" y="396" fontFamily={MONO} fontSize="10" fill={INK_SOFT}>
          Rollback: about 20 minutes → under 5, rehearsed
        </text>
        <rect x="392" y="20" width="136" height="22" rx="2" fill={SUN} opacity="0.9" stroke={INK} strokeWidth="0.75" />
        <text x="460" y="35" textAnchor="middle" fontFamily={MONO} fontSize="10" fill={INK}>
          PEN-TEST PASSED
        </text>
      </svg>
      <figcaption
        style={{
          fontFamily: MONO,
          fontSize: "0.625rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: INK_SOFT,
          padding: "10px 2px 0",
        }}
      >
        Authored diagram — reconstructed for explanation
      </figcaption>
    </figure>
  );
}

/** dnd-dynamic-tree — intent, projection, commit; the ancestry guard. */
export function TreeDiagram() {
  return (
    <figure style={frameStyle}>
      <svg
        viewBox="0 0 560 420"
        role="img"
        aria-label="Authored diagram: a drag intent naming node, parent and sibling becomes a projection preview, and only a reducer commit changes canonical state; an ancestry guard blocks a node from becoming its own ancestor."
        style={{ display: "block", width: "100%", height: "auto" }}
      >
        <DiagramDefs />
        <text x="32" y="42" fontFamily={MONO} fontSize="11" fill={INK_SOFT} letterSpacing="2">
          A MOVE, IN THREE MOMENTS
        </text>
        <line x1="32" y1="56" x2="528" y2="56" stroke={LINE} strokeWidth="1" />

        <Box x={32} y={92} w={150} h={56} label="1 — Intent" sub="{ node, parent, sibling }" accent />
        <Box x={222} y={92} w={140} h={56} label="2 — Projection" sub="preview only" />
        <Box x={402} y={92} w={126} h={56} label="3 — Commit" sub="one reducer write" />
        <Arrow d="M182 120 L220 120" />
        <Arrow d="M362 120 L400 120" />
        <Arrow d="M465 150 C465 190 300 180 240 176" dashed />
        <text x="286" y="172" fontFamily={MONO} fontSize="10" fill={INK_SOFT}>
          preview ≠ state
        </text>

        {/* a small tree, mid-arrangement */}
        <g fontFamily={MONO} fontSize="11.5" fill={INK}>
          <rect x="92" y="238" width="128" height="30" rx="2" fill={PAPER} stroke={INK} strokeWidth="1.2" />
          <text x="106" y="258">crm</text>
          <rect x="128" y="286" width="128" height="30" rx="2" fill={PAPER} stroke={CLAY} strokeWidth="1.6" />
          <text x="142" y="306">leads</text>
          <rect x="128" y="334" width="128" height="30" rx="2" fill={PAPER} stroke={INK} strokeWidth="1.2" strokeDasharray="4 3" />
          <text x="142" y="354">accounts</text>
          <path d="M156 268 L156 284 M156 316 L156 332" stroke={LINE} strokeWidth="1.2" fill="none" />
        </g>
        <text x="290" y="266" fontFamily={MONO} fontSize="10.5" fill={INK_SOFT}>
          dashed = projected,
        </text>
        <text x="290" y="284" fontFamily={MONO} fontSize="10.5" fill={INK_SOFT}>
          not yet committed
        </text>
        <text x="290" y="330" fontFamily={MONO} fontSize="10.5" fill={CLAY}>
          guard: a node can never
        </text>
        <text x="290" y="348" fontFamily={MONO} fontSize="10.5" fill={CLAY}>
          become its own ancestor
        </text>
      </svg>
      <figcaption
        style={{
          fontFamily: MONO,
          fontSize: "0.625rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: INK_SOFT,
          padding: "10px 2px 0",
        }}
      >
        Authored diagram — reconstructed for explanation
      </figcaption>
    </figure>
  );
}
