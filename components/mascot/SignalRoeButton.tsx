"use client";

import { useEffect, useState, type MouseEvent } from "react";
import {
  MASCOT_ECOSYSTEM_COMMAND_EVENT,
  MASCOT_ECOSYSTEM_STATUS_EVENT,
  type EcosystemCommandDetail,
  type EcosystemStatusEventDetail,
} from "@/lib/mascot/ecosystem/events";
import styles from "./Mascot.module.css";

const INITIAL_STATUS: EcosystemStatusEventDetail = {
  ready: false,
  population: 1,
  activeFry: false,
  growthStage: 0,
  mealsToNextFission: 3,
  fissionPhase: null,
  capped: false,
  canReleaseFry: false,
};

export default function SignalRoeButton() {
  const [status, setStatus] = useState(INITIAL_STATUS);

  useEffect(() => {
    const handleStatus = (event: Event) => {
      const detail = (event as CustomEvent<EcosystemStatusEventDetail>).detail;
      if (detail) setStatus(detail);
    };
    window.addEventListener(MASCOT_ECOSYSTEM_STATUS_EVENT, handleStatus);
    return () =>
      window.removeEventListener(MASCOT_ECOSYSTEM_STATUS_EVENT, handleStatus);
  }, []);

  const disabled =
    !status.ready ||
    status.fissionPhase !== null ||
    (!status.activeFry && !status.canReleaseFry);
  const label = status.activeFry
    ? "Call the mascot toward the tiny signal fish"
    : status.capped
      ? "Release a tiny signal fish for the shoal"
      : "Release a tiny signal fish";

  function handleActivate(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const detail: EcosystemCommandDetail = {
      intent: status.activeFry ? "call" : "release",
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    window.dispatchEvent(
      new CustomEvent(MASCOT_ECOSYSTEM_COMMAND_EVENT, { detail }),
    );
  }

  return (
    <button
      type="button"
      className={styles.roeButton}
      aria-label={label}
      title="Something is hiding here"
      disabled={disabled}
      data-ready={status.ready}
      data-active={status.activeFry}
      data-population={status.population}
      onClick={handleActivate}
    >
      <span className={styles.roeCluster} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className={styles.srStatus} aria-live="polite">
        {status.fissionPhase
          ? "The signal fish is dividing"
          : `${status.population} fish in the hidden shoal`}
      </span>
    </button>
  );
}
