"use client";

import { useState } from "react";
import styles from "./GardenSecret.module.css";

/** An intentional discovery: no global key sequence, popup or automatic sound. */
export default function GardenSecret() {
  const [found, setFound] = useState(false);
  const discover = () => {
    const garden = document.getElementById("canopy");
    const launch = garden?.querySelector<HTMLButtonElement>(
      "[data-canopy-launch]",
    );
    if (!garden || !launch) return;
    setFound(true);
    // Native scrolling keeps this equally predictable with keyboard and touch.
    garden.scrollIntoView({ behavior: "auto", block: "center" });
    if (launch.getAttribute("aria-expanded") !== "true") launch.click();
    else garden.querySelector<HTMLElement>("[data-canopy-stage]")?.focus();
  };
  return (
    <button
      type="button"
      className={styles.secret}
      onClick={discover}
      aria-controls="canopy"
      aria-label="A small secret: open the Canopy garden game"
    >
      <svg
        viewBox="0 0 28 28"
        width="26"
        height="26"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M14 24V13m0 5C5 18 4 10 5 7c6 0 9 4 9 11Zm0-5C14 6 20 3 25 4c0 6-4 10-11 9Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>
        {found
          ? "You found the little garden."
          : "There’s always a little more to discover."}
      </span>
      <span aria-hidden="true">→</span>
    </button>
  );
}
