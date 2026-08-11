"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./archive.module.css";

const archiveRoutes = [
  { href: "/blog", label: "Blog" },
  { href: "/inspo", label: "Inspo" },
  { href: "/worth-your-time", label: "Worth your time" },
  { href: "/raq", label: "RAQ" },
];

function LogoMark() {
  return (
    <svg
      className={styles.logoMark}
      viewBox="0 0 137 137"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M137 0H0V82.5H41.3223L61.6612 62.1612L79.3388 79.8388L51.6777 107.5H0V137H137V0Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function ArchiveShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <Link
          className={styles.brand}
          href="/blog"
          aria-label="Signal Archive home"
        >
          <LogoMark />
          <span>Signal Archive</span>
        </Link>

        <nav className={styles.nav} aria-label="Signal Archive">
          {archiveRoutes.map((route) => {
            const active =
              pathname === route.href || pathname.startsWith(`${route.href}/`);
            return (
              <Link
                key={route.href}
                className={`${styles.navLink} ${
                  active ? styles.navLinkActive : ""
                }`}
                href={route.href}
                aria-current={active ? "page" : undefined}
              >
                {route.label}
              </Link>
            );
          })}
        </nav>

        <Link className={styles.homeLink} href="/">
          Portfolio ↗
        </Link>
      </header>

      {children}

      <footer className={styles.footer}>
        <p>Shantanu Soam · Signal Archive</p>
        <nav aria-label="Archive footer">
          {archiveRoutes.map((route) => (
            <Link
              className={styles.textLink}
              href={route.href}
              key={route.href}
            >
              {route.label}
            </Link>
          ))}
        </nav>
        <p>Made to be revisited</p>
      </footer>
    </div>
  );
}
