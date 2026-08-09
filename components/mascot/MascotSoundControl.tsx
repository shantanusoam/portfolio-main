"use client";

import { useEffect, useState } from "react";
import type { MascotEngine as MascotEngineContract } from "@/lib/mascot/types";
import styles from "./Mascot.module.css";

const SOUND_PREFERENCE_KEY = "mascot-sound-enabled";
const HINT_DISMISSED_KEY = "mascot-sound-hint-dismissed";

export interface MascotSoundControlProps {
  engine: MascotEngineContract | null;
  /**
   * Shows a small "tap to hear strings" hint until dismissed or sound is
   * turned on. Purely visual — this component knows nothing about specific
   * strings or contacts; wiring it to a real pluck is the coordinator's job
   * once string-contact detection exists.
   */
  showHint?: boolean;
}

function readStoredPreference(): boolean {
  try {
    return window.localStorage.getItem(SOUND_PREFERENCE_KEY) === "true";
  } catch {
    return false;
  }
}

function readHintDismissed(): boolean {
  try {
    return window.localStorage.getItem(HINT_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

function storePreference(enabled: boolean): void {
  try {
    window.localStorage.setItem(SOUND_PREFERENCE_KEY, String(enabled));
  } catch {
    // Storage can be unavailable in privacy-restricted browsing contexts.
  }
}

function storeHintDismissed(): void {
  try {
    window.localStorage.setItem(HINT_DISMISSED_KEY, "true");
  } catch {
    // ignore
  }
}

/**
 * Sound On/Off control for the mascot's own string-contact-triggered notes
 * — a separate, independently-activated audio system from the hand-played
 * hero instrument. Only the persisted *mute preference* is stored; an
 * `AudioContext` is never persisted and never created before this button is
 * clicked (spec: "Audio must be explicitly activated").
 *
 * Every page load starts silent regardless of the stored preference — the
 * preference only pre-sets this button's initial label so a returning
 * visitor who previously opted in doesn't see a confusing "Sound Off"
 * default. The first click is always the one and only place this subsystem
 * calls `engine.setSoundEnabled(true)`, satisfying the platform's
 * user-gesture requirement every session.
 */
export default function MascotSoundControl({
  engine,
  showHint = true,
}: MascotSoundControlProps) {
  const [hydrated, setHydrated] = useState(false);
  const [wantsSound, setWantsSound] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setWantsSound(readStoredPreference());
    setHintVisible(showHint && !readHintDismissed());
    setHydrated(true);
  }, [showHint]);

  const dismissHint = () => {
    setHintVisible(false);
    storeHintDismissed();
  };

  const handleClick = () => {
    if (!engine || pending) return;
    const next = !wantsSound;
    setWantsSound(next);
    storePreference(next);
    if (hintVisible) dismissHint();

    setPending(true);
    engine
      .setSoundEnabled(next)
      .catch(() => undefined)
      .finally(() => setPending(false));
  };

  const label = wantsSound ? "Sound On" : "Sound Off";
  const status = !hydrated
    ? ""
    : wantsSound
      ? "Mascot string sounds are on"
      : "Mascot string sounds are off";

  return (
    <div className={styles.soundControl}>
      <button
        type="button"
        className={styles.soundToggle}
        role="switch"
        aria-checked={wantsSound}
        aria-label="Toggle mascot string sound"
        data-active={wantsSound}
        onClick={handleClick}
        disabled={!engine}
      >
        {label}
      </button>
      {hintVisible && (
        <div className={styles.soundHint} role="status">
          <span>Tap to hear the strings</span>
          <button
            type="button"
            className={styles.soundHintDismiss}
            aria-label="Dismiss sound hint"
            onClick={dismissHint}
          >
            Dismiss
          </button>
        </div>
      )}
      <span className={styles.srStatus} aria-live="polite">
        {status}
      </span>
    </div>
  );
}
