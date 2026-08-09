"use client";

import Image from "next/image";
import {
  PointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import styles from "./Experience.module.css";
import diagnosticStyles from "./ExperienceDiagnostics.module.css";

gsap.registerPlugin(ScrollTrigger);

const CAREER_START = new Date("2021-04-02T09:00:00+05:30");

function useCareerClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) return null;

  const elapsed = now.getTime() - CAREER_START.getTime();
  const days = Math.floor(elapsed / 86_400_000);
  const hours = Math.floor((elapsed % 86_400_000) / 3_600_000);
  const minutes = Math.floor((elapsed % 3_600_000) / 60_000);
  const seconds = Math.floor((elapsed % 60_000) / 1000);
  return { days, hours, minutes, seconds };
}

function CareerCounter() {
  const clock = useCareerClock();

  const units: Array<[number | string, string]> = clock
    ? [
        [clock.days, "days"],
        [clock.hours, "hours"],
        [clock.minutes, "minutes"],
        [clock.seconds, clock.seconds === 1 ? "second" : "seconds"],
      ]
    : [
        ["—", "days"],
        ["—", "hours"],
        ["—", "minutes"],
        ["—", "seconds"],
      ];

  return (
    <p className={styles.counter} suppressHydrationWarning>
      {units.map(([value, label]) => (
        <span className={styles.counterUnit} key={label}>
          <strong>{value}</strong> {label}
        </span>
      ))}
    </p>
  );
}

const career = [
  {
    checkpoint: "01",
    company: "Knowbuild",
    logo: "/knowbuild-logo.svg",
    role: "Staff Engineer / Senior Software Developer",
    type: "Full time",
    date: "Jan 2025 — Present",
    summary: "Building digital systems that scale and last.",
    description:
      "Leading product engineering, multi-tenant architecture and modernization for complex business platforms.",
    technologies: ["React", "TypeScript", "TanStack", "Laravel", "AWS"],
    icon: "building",
  },
  {
    checkpoint: "02",
    company: "Niva Bupa Health Insurance",
    qualifier: "via Cognizant / Shephertz",
    logo: "/nivabupa-logo.svg",
    role: "Senior Software Engineer",
    type: "Full time",
    date: "Feb 2025 — Aug 2025",
    summary: "Secure insurance operations and automation.",
    description:
      "Improved platform security, database performance and deployment workflows for high-volume insurance operations.",
    technologies: ["React", "MongoDB", "Docker", "Kubernetes", "Nginx"],
    icon: "shield",
  },
  {
    checkpoint: "03",
    company: "Mobikasa",
    logo: "/mobikasa.png",
    role: "Senior Frontend Developer",
    type: "Full time",
    date: "Oct 2023 — Feb 2025",
    summary: "Commerce systems and polished interfaces.",
    description:
      "Built accessible e-commerce platforms, reusable UI systems and complex visual builders for consumer products.",
    technologies: ["Next.js", "TypeScript", "Tailwind", "Redux", "Framer"],
    icon: "wallet",
  },
  {
    checkpoint: "04",
    company: "The Tarzan Way",
    logo: "/TheTarzanWay.webp",
    role: "Full-stack Developer",
    type: "Full time",
    date: "Feb 2023 — Oct 2023",
    summary: "Creative technology for modern travel.",
    description:
      "Developed itinerary, payment and booking experiences with a Django CMS and high-performance Next.js frontend.",
    technologies: ["Next.js", "Django", "Maps", "Web Workers", "PWA"],
    icon: "tree",
  },
  {
    checkpoint: "05",
    company: "KAL Group",
    logo: "/KalGroup.webp",
    role: "Full-stack Developer",
    type: "Full time",
    date: "Apr 2021 — Feb 2023",
    summary: "The first production systems in the archive.",
    description:
      "Shipped HR, commerce and customer-support systems while growing from associate to full-stack developer.",
    technologies: ["React", "Node.js", "MongoDB", "Sanity", "Socket.io"],
    icon: "network",
  },
];

const skills = [
  ["Frontend Development", 9],
  ["Backend Development", 8],
  ["System Design", 8],
  ["Database & APIs", 8],
  ["DevOps & Deployment", 7],
] as const;

const tools = [
  ["/icons/tech-color/nextdotjs.svg", "Next.js"],
  ["/icons/tech-color/react.svg", "React"],
  ["/icons/tech-color/laravel.svg", "Laravel"],
  ["/icons/tech-color/javascript.svg", "JavaScript"],
  ["/icons/tech-color/typescript.svg", "TypeScript"],
  ["/icons/tech-color/postgresql.svg", "PostgreSQL"],
  ["/icons/tech-color/docker.svg", "Docker"],
  ["/icons/tech-color/aws.svg", "AWS"],
  ["/icons/tech-color/github.svg", "GitHub"],
  ["/icons/tech-color/tailwindcss.svg", "Tailwind"],
  ["/icons/tech-color/figma.svg", "Figma"],
  ["/icons/tech-color/vercel.svg", "Vercel"],
];

// GitHub and Vercel logos ship solid near-black — invert so they read on the dark card.
const invertOnDark = new Set(["GitHub", "Vercel"]);

const wireframeIcons: Record<string, string> = {
  building: "/portfolio-micro-assets/line-icons/blueprint-house.svg",
  shield: "/portfolio-micro-assets/line-icons/wireframe-shield.svg",
  wallet: "/portfolio-micro-assets/line-icons/wireframe-wallet.svg",
  tree: "/portfolio-micro-assets/line-icons/wireframe-tree.svg",
  network: "/portfolio-micro-assets/line-icons/wireframe-circuit.svg",
};

function WireframeIcon({ type }: { type: string }) {
  const src = wireframeIcons[type];
  if (!src) return null;

  return (
    <span className={styles.wireframeIcon} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" width={105} height={105} loading="lazy" />
    </span>
  );
}

function CareerDiagnostics() {
  return (
    <div className={diagnosticStyles.diagnostics}>
      <span
        className={`${diagnosticStyles.cornerBracket} ${diagnosticStyles.cornerTL}`}
        aria-hidden="true"
      />
      <span
        className={`${diagnosticStyles.cornerBracket} ${diagnosticStyles.cornerTR}`}
        aria-hidden="true"
      />
      <span
        className={`${diagnosticStyles.cornerBracket} ${diagnosticStyles.cornerBR}`}
        aria-hidden="true"
      />
      <span
        className={`${diagnosticStyles.cornerBracket} ${diagnosticStyles.cornerBL}`}
        aria-hidden="true"
      />

      <div className={diagnosticStyles.upperRow}>
        <div className={diagnosticStyles.skillsPanel}>
          <h3>{"// Core skills"}</h3>
          {skills.map(([name, score]) => (
            <div className={diagnosticStyles.skillRow} key={name}>
              <span>{name}</span>
              <div
                className={diagnosticStyles.skillLights}
                aria-label={`${score} out of 10`}
              >
                {Array.from({ length: 10 }).map((_, index) => (
                  <i key={index} data-active={index < score} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={diagnosticStyles.toolsPanel}>
          <h3>{"// Tools & technologies"}</h3>
          <div className={diagnosticStyles.toolGrid}>
            {tools.map(([icon, tool]) => (
              <div
                className={diagnosticStyles.toolCell}
                key={tool}
                title={tool}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={icon}
                  alt={tool}
                  width={22}
                  height={22}
                  loading="lazy"
                  className={
                    invertOnDark.has(tool)
                      ? diagnosticStyles.toolIconInvert
                      : undefined
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div className={diagnosticStyles.achievementsPanel}>
          <h3>{"// Achievements"}</h3>
          <div className={diagnosticStyles.achievementsBody}>
            <ul>
              <li>Delivered 25+ production grade projects across industries.</li>
              <li>Built systems that serve thousands of daily active users.</li>
              <li>Reduced deployment time by 60% with automation.</li>
              <li>Consistently write clean, maintainable and scalable code.</li>
            </ul>
            <span className={diagnosticStyles.blueprintStrip} aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/portfolio-micro-assets/marks/coordinate-ticks.svg"
                alt=""
                width={32}
                height={16}
                className={diagnosticStyles.blueprintTicks}
              />
              <i className={diagnosticStyles.blueprintNode} style={{ top: "30%" }} />
              <i className={diagnosticStyles.blueprintNode} style={{ top: "58%" }} />
              <i className={diagnosticStyles.blueprintNode} style={{ top: "82%" }} />
            </span>
          </div>
        </div>
      </div>

      <div className={diagnosticStyles.rowDivider} aria-hidden="true" />

      <div className={diagnosticStyles.lowerRow}>
        <blockquote className={diagnosticStyles.quote}>
          <span aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/portfolio-micro-assets/marks/quote-marks.svg"
              alt=""
              width={110}
              height={80}
            />
          </span>
          I don&apos;t just write code.
          <br />
          I solve problems, build systems
          <br />
          and craft digital experiences
          <br />
          that make an impact.
          <cite>— Shantanu Soam</cite>
        </blockquote>

        <div className={diagnosticStyles.focusPanel}>
          <h3>{"// Current focus"}</h3>
          <p>
            Building scalable products, exploring AI integrations and pushing the
            boundaries of interactive web experiences.
          </p>
          <div className={diagnosticStyles.processRail}>
            {["Build", "Learn", "Ship", "Repeat"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div className={diagnosticStyles.statusPanel}>
          <div className={diagnosticStyles.statusCard}>
            <span>
              <i className={diagnosticStyles.statusDot} aria-hidden="true" />
              System status
            </span>
            <p>
              Always learning.
              <br />
              Always building.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Experience() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (!sectionRef.current || prefersReducedMotion) return;

    const context = gsap.context(() => {
      gsap.utils
        .toArray<HTMLElement>(`.${styles.timelineItem}`)
        .forEach((item) => {
          gsap.from(item, {
            opacity: 0,
            y: 32,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: item,
              start: "top 82%",
              once: true,
            },
          });
        });

      // Instrumentation boot-up: lit skill indicators fill left-to-right,
      // row by row, like a hardware self-test.
      gsap.from(`.${diagnosticStyles.skillLights} i[data-active="true"]`, {
        scaleY: 0,
        opacity: 0,
        transformOrigin: "bottom",
        stagger: 0.035,
        duration: 0.3,
        ease: "power2.out",
        scrollTrigger: {
          trigger: `.${diagnosticStyles.diagnostics}`,
          start: "top 78%",
          once: true,
        },
      });

      gsap.from(`.${diagnosticStyles.toolCell}`, {
        opacity: 0,
        y: 14,
        stagger: 0.05,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: `.${diagnosticStyles.diagnostics}`,
          start: "top 78%",
          once: true,
        },
      });
    }, sectionRef);

    return () => context.revert();
  }, [prefersReducedMotion]);

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--pointer-x",
      `${event.clientX - bounds.left}px`,
    );
    event.currentTarget.style.setProperty(
      "--pointer-y",
      `${event.clientY - bounds.top}px`,
    );
  }

  return (
    <section
      ref={sectionRef}
      id="trail-map"
      className={styles.section}
      onPointerMove={handlePointerMove}
    >
      <header className={styles.header}>
        <CareerCounter />
        <p className={styles.counterCaption}>Years of building epic stuff.</p>
        <div className={styles.logoRack}>
          <span className={styles.rackBolt} data-corner="tl" aria-hidden="true" />
          <span className={styles.rackBolt} data-corner="tr" aria-hidden="true" />
          <span className={styles.rackBolt} data-corner="br" aria-hidden="true" />
          <span className={styles.rackBolt} data-corner="bl" aria-hidden="true" />
          {career.map((item) => (
            <span className={styles.logoTile} key={item.checkpoint}>
              <Image
                src={item.logo}
                alt={`${item.company} logo`}
                width={150}
                height={70}
                className={styles.logo}
              />
            </span>
          ))}
        </div>
      </header>

      <div className={styles.timeline}>
        {career.map((item) => (
          <article className={styles.timelineItem} key={item.checkpoint}>
            <span className={styles.timelineNode} />
            <div className={styles.companyColumn}>
              <span className={styles.checkpoint}>
                Checkpoint {item.checkpoint}
              </span>
              <h3>{item.company}</h3>
              {item.qualifier && <strong>({item.qualifier})</strong>}
              <p>{item.summary}</p>
              <WireframeIcon type={item.icon} />
            </div>

            <div className={styles.roleColumn}>
              <div className={styles.roleHeader}>
                <div>
                  <h4>{item.role}</h4>
                  <span>{item.type}</span>
                </div>
                <time>{item.date}</time>
              </div>
              <p className={styles.description}>{item.description}</p>
              <div className={styles.technologies}>
                {item.technologies.map((technology) => (
                  <span key={technology}>{technology}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      <CareerDiagnostics />
    </section>
  );
}
