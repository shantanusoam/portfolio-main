"use client";

import { useEffect, useState, type MouseEvent } from "react";
import {
  MASCOT_ECOSYSTEM_COMMAND_EVENT,
  MASCOT_ECOSYSTEM_POINTER_HINT_EVENT,
  MASCOT_ECOSYSTEM_STATUS_EVENT,
  type EcosystemCommandDetail,
  type EcosystemPointerHintDetail,
  type EcosystemStatusEventDetail,
} from "@/lib/mascot/ecosystem/events";
import { MEALS_TO_FISSION } from "@/lib/mascot/ecosystem/AnatomyGrowth";
import styles from "./Mascot.module.css";

const INITIAL_STATUS: EcosystemStatusEventDetail = {
  ready: false,
  population: 1,
  activeFry: false,
  activeFryCount: 0,
  growthStage: 0,
  mealsToNextFission: MEALS_TO_FISSION,
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

  useEffect(() => {
    return () => {
      window.dispatchEvent(
        new CustomEvent<EcosystemPointerHintDetail>(
          MASCOT_ECOSYSTEM_POINTER_HINT_EVENT,
          { detail: { overEgg: false } },
        ),
      );
    };
  }, []);

  const disabled =
    !status.ready ||
    status.fissionPhase !== null ||
    status.activeFry ||
    !status.canReleaseFry;
  const label = status.capped
    ? "Release a school of tiny signal fish for the shoal"
    : "Release a school of tiny signal fish";

  function broadcastPointerHint(overEgg: boolean) {
    window.dispatchEvent(
      new CustomEvent<EcosystemPointerHintDetail>(
        MASCOT_ECOSYSTEM_POINTER_HINT_EVENT,
        { detail: { overEgg } },
      ),
    );
  }

  function handleActivate(event: MouseEvent<HTMLButtonElement>) {
    if (status.activeFry) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const detail: EcosystemCommandDetail = {
      intent: "release",
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    window.dispatchEvent(
      new CustomEvent(MASCOT_ECOSYSTEM_COMMAND_EVENT, { detail }),
    );
  }

  function handlePointerEnter() {
    broadcastPointerHint(true);
  }

  function handlePointerLeave() {
    broadcastPointerHint(false);
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
      data-mascot-obstacle="soft"
      data-mascot-interest="roe"
      data-mascot-pointer-suppress="true"
      onClick={handleActivate}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
      onBlur={handlePointerLeave}
    >
      <span className={styles.roeCluster} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className={styles.srStatus} aria-live="polite">
        {status.fissionPhase
          ? "The signal fish is dividing"
          : status.activeFry
            ? `${status.activeFryCount} tiny signal fish are fleeing`
            : `${status.population} fish in the hidden shoal`}
      </span>
    </button>
  );
}
