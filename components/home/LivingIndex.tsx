"use client";

import Link from "next/link";
import { useState, type PointerEvent } from "react";
import styles from "./LivingIndex.module.css";

type SpecimenKind = "koi" | "octopod" | "course";

type Specimen = {
  id: SpecimenKind;
  index: string;
  name: string;
  type: string;
  description: string;
  prompt: string;
  href: string;
  linkLabel: string;
  layers: string[];
};

const SPECIMENS: Specimen[] = [
  {
    id: "koi",
    index: "01",
    name: "Signal Koi",
    type: "Procedural companion",
    description:
      "A touch-to-wake fish with an interruptible mind, a soft spine and a deliberate resting state.",
    prompt: "Click the fish to follow. Click again to let it rest.",
    href: "/creature-lab",
    linkLabel: "Enter Creature Lab",
    layers: [
      "Second-order body dynamics",
      "Follow / rest behavior contract",
      "Canvas rig with quality governor",
    ],
  },
  {
    id: "octopod",
    index: "02",
    name: "Many-Arm Mind",
    type: "Keyboard creature",
    description:
      "An octopod whose arms solve movement locally while one small brain chooses intent.",
    prompt: "Move with WASD or arrows. Inspect the rig as it adapts.",
    href: "/octopod-lab",
    linkLabel: "Play Octopod Lab",
    layers: [
      "Eight independent appendage chains",
      "Soft-body balance and drag",
      "Keyboard, pointer and reduced-motion paths",
    ],
  },
  {
    id: "course",
    index: "03",
    name: "Motion Field Notes",
    type: "Interactive visual essay",
    description:
      "A noob-to-pro path that makes procedural animation readable before it makes it impressive.",
    prompt: "Change one rule, watch the body react, then explain why.",
    href: "/learning/procedural-animation",
    linkLabel: "Start the course",
    layers: [
      "Playgrounds before terminology",
      "Physics translated into visual intuition",
      "Psychology-backed motion decisions",
    ],
  },
];

function KoiArtwork() {
  return (
    <svg className={styles.artwork} viewBox="0 0 520 620" aria-hidden="true">
      <defs>
        <linearGradient id="living-koi-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1eee5" />
          <stop offset="0.54" stopColor="#ff7951" />
          <stop offset="1" stopColor="#b82e19" />
        </linearGradient>
        <filter
          id="living-koi-glow"
          x="-60%"
          y="-60%"
          width="220%"
          height="220%"
        >
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <g className={styles.koiField}>
        <circle cx="260" cy="304" r="188" />
        <circle cx="260" cy="304" r="128" />
        <path d="M50 365C150 238 289 480 472 246" />
        <path d="M74 205C188 355 318 95 468 350" />
      </g>
      <ellipse
        className={styles.koiGlow}
        cx="272"
        cy="302"
        rx="116"
        ry="190"
        filter="url(#living-koi-glow)"
      />
      <g className={styles.koiFish} transform="rotate(-28 260 310)">
        <path
          className={styles.koiTail}
          d="M258 500C236 548 190 570 154 558C181 530 193 501 191 466C215 463 239 475 258 500Z"
        />
        <path
          className={styles.koiTail}
          d="M260 500C285 547 331 565 367 550C337 524 323 494 322 459C299 460 276 476 260 500Z"
        />
        <path
          className={styles.koiBody}
          d="M261 82C335 87 365 185 351 296C339 393 303 493 260 518C216 491 181 393 170 296C157 184 188 87 261 82Z"
        />
        <path
          className={styles.koiPatch}
          d="M207 150C248 112 319 134 339 199C295 180 264 204 235 235C213 220 202 187 207 150Z"
        />
        <path
          className={styles.koiPatch}
          d="M187 289C221 265 260 285 278 331C241 325 219 349 202 382C185 360 180 325 187 289Z"
        />
        <path
          className={styles.koiPatch}
          d="M273 389C305 356 332 368 337 409C320 449 294 483 260 510C265 462 258 421 273 389Z"
        />
        <path
          className={styles.koiFin}
          d="M176 245C128 264 116 311 143 349C160 321 179 294 204 275Z"
        />
        <path
          className={styles.koiFin}
          d="M347 247C393 267 402 313 376 349C361 319 341 292 316 274Z"
        />
        <path
          className={styles.koiSpine}
          d="M261 126C275 224 279 347 260 474"
        />
        <circle className={styles.koiEye} cx="230" cy="125" r="8" />
        <circle className={styles.koiEye} cx="292" cy="125" r="8" />
      </g>
      <g className={styles.bubbles}>
        <circle cx="115" cy="130" r="7" />
        <circle cx="398" cy="171" r="4" />
        <circle cx="429" cy="420" r="8" />
        <circle cx="116" cy="475" r="4" />
      </g>
    </svg>
  );
}

function OctopodArtwork() {
  const tentacles = [
    "M239 333C170 375 122 444 90 535",
    "M257 342C213 408 195 483 181 558",
    "M276 343C267 425 274 497 257 577",
    "M294 341C330 418 337 494 322 571",
    "M311 332C377 385 399 462 388 545",
    "M324 315C410 343 453 406 458 486",
    "M220 316C145 325 95 365 58 431",
    "M333 294C419 285 463 325 482 384",
  ];

  return (
    <svg className={styles.artwork} viewBox="0 0 520 620" aria-hidden="true">
      <defs>
        <radialGradient id="living-octo-fill" cx="38%" cy="28%" r="76%">
          <stop offset="0" stopColor="#a8f4e6" />
          <stop offset="0.5" stopColor="#2faca1" />
          <stop offset="1" stopColor="#123d4b" />
        </radialGradient>
      </defs>
      <g className={styles.octoGrid}>
        {Array.from({ length: 7 }, (_, index) => (
          <path key={index} d={`M60 ${126 + index * 62}H460`} />
        ))}
        {Array.from({ length: 7 }, (_, index) => (
          <path key={index} d={`M${74 + index * 62} 90V552`} />
        ))}
      </g>
      <g className={styles.octoRig}>
        {tentacles.map((path, index) => (
          <g key={path}>
            <path className={styles.tentacleShadow} d={path} />
            <path
              className={styles.tentacle}
              d={path}
              style={{ animationDelay: `${index * -0.19}s` }}
            />
          </g>
        ))}
        <path
          className={styles.octoHead}
          d="M168 278C168 166 209 99 278 99C347 99 389 168 382 278C378 345 342 376 276 376C210 376 168 344 168 278Z"
        />
        <path
          className={styles.octoCore}
          d="M225 206C248 179 309 178 335 211C349 231 347 278 328 302C304 330 247 328 223 299C203 275 205 229 225 206Z"
        />
        <circle className={styles.octoEye} cx="247" cy="240" r="10" />
        <circle className={styles.octoEye} cx="311" cy="240" r="10" />
        <path
          className={styles.octoMouth}
          d="M263 286C273 294 286 294 296 285"
        />
        <g className={styles.octoNodes}>
          <circle cx="278" cy="140" r="5" />
          <circle cx="220" cy="320" r="5" />
          <circle cx="335" cy="320" r="5" />
          <circle cx="90" cy="535" r="5" />
          <circle cx="458" cy="486" r="5" />
        </g>
      </g>
    </svg>
  );
}

function CourseArtwork() {
  return (
    <svg className={styles.artwork} viewBox="0 0 520 620" aria-hidden="true">
      <defs>
        <linearGradient id="living-course-line" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd071" />
          <stop offset="0.55" stopColor="#ff5d2f" />
          <stop offset="1" stopColor="#9d2bff" />
        </linearGradient>
      </defs>
      <g className={styles.courseContours}>
        <path d="M56 458C146 322 126 166 273 112C388 70 488 193 443 316C401 431 288 488 170 540" />
        <path d="M86 468C163 343 159 211 280 166C375 131 447 221 411 317C377 407 285 450 187 513" />
        <path d="M120 479C185 374 190 262 287 225C359 198 409 262 381 328C354 393 284 423 210 481" />
      </g>
      <path
        className={styles.coursePathGhost}
        d="M66 515C111 440 134 383 189 375C251 365 219 277 289 264C347 253 338 171 449 111"
      />
      <path
        className={styles.coursePath}
        d="M66 515C111 440 134 383 189 375C251 365 219 277 289 264C347 253 338 171 449 111"
      />
      <g className={styles.courseNodes}>
        <g transform="translate(66 515)">
          <circle r="23" />
          <text y="4">01</text>
        </g>
        <g transform="translate(189 375)">
          <circle r="25" />
          <text y="4">02</text>
        </g>
        <g transform="translate(289 264)">
          <circle r="27" />
          <text y="4">03</text>
        </g>
        <g transform="translate(449 111)">
          <circle r="31" />
          <text y="4">PRO</text>
        </g>
      </g>
      <g className={styles.courseVectors}>
        <path d="M91 514l43-2" />
        <path d="M213 371l48-41" />
        <path d="M315 257l54-44" />
      </g>
      <text className={styles.courseEquation} x="58" y="92">
        intent → force → motion → feeling
      </text>
      <text className={styles.courseCaption} x="58" y="120">
        change one rule at a time
      </text>
    </svg>
  );
}

function SpecimenArtwork({ kind }: { kind: SpecimenKind }) {
  if (kind === "koi") return <KoiArtwork />;
  if (kind === "octopod") return <OctopodArtwork />;
  return <CourseArtwork />;
}

function setCardPointer(event: PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  event.currentTarget.style.setProperty("--pointer-x", x.toFixed(3));
  event.currentTarget.style.setProperty("--pointer-y", y.toFixed(3));
}

function resetCardPointer(event: PointerEvent<HTMLElement>) {
  event.currentTarget.style.setProperty("--pointer-x", "0");
  event.currentTarget.style.setProperty("--pointer-y", "0");
}

export default function LivingIndex() {
  const [inspected, setInspected] = useState<SpecimenKind | null>(null);

  return (
    <section className={styles.section} id="living-index">
      <header className={styles.heading}>
        <p className={styles.eyebrow}>00.7 / Living index</p>
        <div>
          <h2>Art that exposes the system underneath.</h2>
          <p>
            Three playable specimens connect the expressive surface to the
            engineering decisions that make it move, rest and respond.
          </p>
        </div>
      </header>

      <div className={styles.specimenGrid}>
        {SPECIMENS.map((specimen) => {
          const isInspected = inspected === specimen.id;
          return (
            <article
              key={specimen.id}
              className={styles.card}
              data-kind={specimen.id}
              data-inspected={isInspected}
              onPointerMove={setCardPointer}
              onPointerLeave={resetCardPointer}
              data-mascot-interest="project"
            >
              <div className={styles.stage}>
                <div className={styles.stageMeta}>
                  <span>Specimen {specimen.index}</span>
                  <span>{specimen.type}</span>
                </div>
                <SpecimenArtwork kind={specimen.id} />
                <span className={styles.stagePrompt}>{specimen.prompt}</span>
                <span className={styles.crosshair} aria-hidden="true" />
              </div>

              <div className={styles.copy}>
                <p className={styles.cardIndex}>
                  {specimen.index} / Live study
                </p>
                <h3>{specimen.name}</h3>
                <p className={styles.description}>{specimen.description}</p>

                <button
                  className={styles.inspectButton}
                  type="button"
                  aria-expanded={isInspected}
                  onClick={() =>
                    setInspected((current) =>
                      current === specimen.id ? null : specimen.id,
                    )
                  }
                >
                  <span>{isInspected ? "Close X-Ray" : "Inspect system"}</span>
                  <span aria-hidden="true">{isInspected ? "−" : "+"}</span>
                </button>

                <div className={styles.layers} aria-hidden={!isInspected}>
                  <p>System layers</p>
                  <ul>
                    {specimen.layers.map((layer) => (
                      <li key={layer}>{layer}</li>
                    ))}
                  </ul>
                </div>

                <Link className={styles.enterLink} href={specimen.href}>
                  {specimen.linkLabel} <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <div className={styles.note}>
        <span>Gallery rule / 01</span>
        <p>
          Every animated object must answer three questions: what input woke it,
          what rule shapes its motion, and how can the visitor stop it?
        </p>
        <Link href="/learning/procedural-animation">
          Learn the full method ↗
        </Link>
      </div>
    </section>
  );
}
