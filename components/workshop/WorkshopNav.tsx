"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import resumeLink from "@/constants/resume";
import styles from "./WorkshopNav.module.css";
import shared from "./WorkshopShared.module.css";

const LINKS = [
  { href: "#work", label: "Work" },
  { href: "#lab", label: "Lab" },
  { href: "#notes", label: "Notes" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

/**
 * The workshop's navigation: five plain destinations and a quiet CV link,
 * per the brief. The bar starts transparent over the paper and gains a
 * hairline + a paper veil only once you scroll — the morning light stays
 * uninterrupted at the top of the page.
 */
export default function WorkshopNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // The veil is driven by a 16px sentinel at the top of the document,
  // watched with IntersectionObserver — unlike a scroll listener it also
  // answers anchor jumps, history restores and print correctly.
  useEffect(() => {
    const sentinel = document.getElementById("ws-nav-sentinel");
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { rootMargin: "-1px 0px 0px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Menu overlay locks body scroll and escapes with Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <>
      <div id="ws-nav-sentinel" className={styles.sentinel} aria-hidden="true" />
      <nav
        aria-label="Primary"
        className={`${styles.nav} ${scrolled || menuOpen ? styles.navScrolled : ""}`}
      >
        <div className={styles.inner}>
          <Link href="/#top" className={styles.wordmark} onClick={() => setMenuOpen(false)}>
            <span className={styles.notch} aria-hidden="true" />
            Shantanu&nbsp;Soam
          </Link>

          <div className={styles.links}>
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={styles.link}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className={styles.utility}>
            <a
              href={resumeLink}
              target="_blank"
              rel="noreferrer"
              className={shared.quietLink}
            >
              CV
            </a>
            <button
              type="button"
              className={styles.menuButton}
              aria-expanded={menuOpen}
              aria-controls="workshop-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </nav>

      <div
        id="workshop-menu"
        className={`${styles.menu} ${menuOpen ? styles.menuOpen : ""}`}
        aria-hidden={!menuOpen}
      >
        <ul className={styles.menuList}>
          {LINKS.map((link, index) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={styles.menuLink}
                style={{ transitionDelay: menuOpen ? `${80 + index * 45}ms` : "0ms" }}
                tabIndex={menuOpen ? 0 : -1}
                onClick={() => setMenuOpen(false)}
              >
                <span className={styles.menuIndex}>0{index + 1}</span>
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <a
              href={resumeLink}
              target="_blank"
              rel="noreferrer"
              className={styles.menuCv}
              tabIndex={menuOpen ? 0 : -1}
              onClick={() => setMenuOpen(false)}
            >
              <span className={styles.menuIndex}>06</span>
              Curriculum vitae ↗
            </a>
          </li>
        </ul>
        <p className={styles.menuMeta}>
          Useful software. A future worth building.
        </p>
      </div>
    </>
  );
}
