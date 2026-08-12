"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CommandPaletteTrigger } from "@/components/command-palette/CommandPalette";
import { SSLogo } from "@/components/ss-logo/SSLogo";
import styles from "./archive.module.css";

const archiveRoutes = [
  { href: "/blog", label: "Blog" },
  { href: "/inspo", label: "Inspo" },
  { href: "/worth-your-time", label: "Worth your time" },
  { href: "/raq", label: "RAQ" },
];

function LogoMark() {
  return <SSLogo className={styles.logoMark} animated={false} decorative />;
}

export default function ArchiveShell({ children }: { children: ReactNode }) {
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

        <div className={styles.headerActions}>
          <CommandPaletteTrigger />
          <Link className={styles.homeLink} href="/">
            Portfolio ↗
          </Link>
        </div>
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
