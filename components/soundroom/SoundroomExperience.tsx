"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import {
  useSoundroomEngine,
  useSoundroomPlayer,
} from "@/hooks/useSoundroomEngine";
import {
  SOUNDROOM_OPEN_EVENT,
  type SoundroomOpenDetail,
  type SoundroomOpenView,
} from "@/lib/audio/discovery";
import {
  publishSoundroomEnergy,
  publishSoundroomSilence,
} from "@/lib/audio/reactiveBridge";
import SoundroomMiniPlayer from "./SoundroomMiniPlayer";
import SoundroomOverlay from "./SoundroomOverlay";
import styles from "./Soundroom.module.css";

export default function SoundroomExperience({
  initialView = "mini",
  justDiscovered = false,
}: {
  initialView?: SoundroomOpenView;
  justDiscovered?: boolean;
}) {
  const engine = useSoundroomEngine();
  const snapshot = useSoundroomPlayer(engine);
  const reducedMotion = usePrefersReducedMotion();
  const [compact, setCompact] = useState(!justDiscovered);
  const [roomOpen, setRoomOpen] = useState(initialView !== "mini");
  const [openView, setOpenView] = useState<SoundroomOpenView>(initialView);
  const [showDiscovery, setShowDiscovery] = useState(justDiscovered);
  const receivedInitialView = useRef(false);

  const openRoom = (view: SoundroomOpenView) => {
    setOpenView(view);
    if (view === "mini") {
      setRoomOpen(false);
      setCompact(false);
      return;
    }
    setCompact(false);
    setRoomOpen(true);
  };

  useEffect(() => {
    if (!receivedInitialView.current) {
      receivedInitialView.current = true;
      if (initialView === "mini") return;
    }
    openRoom(initialView);
  }, [initialView]);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const detail = (event as CustomEvent<SoundroomOpenDetail>).detail;
      openRoom(detail?.view ?? "room");
    };
    window.addEventListener(SOUNDROOM_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(SOUNDROOM_OPEN_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    if (!showDiscovery) return undefined;
    const timer = window.setTimeout(() => setShowDiscovery(false), 2100);
    return () => window.clearTimeout(timer);
  }, [showDiscovery]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--soundroom-accent",
      snapshot.currentTrack?.accent ?? "#ff6946",
    );
    document.body.dataset.soundroomPlaying = String(snapshot.isPlaying);
    return () => {
      delete document.body.dataset.soundroomPlaying;
    };
  }, [snapshot.currentTrack?.accent, snapshot.isPlaying]);

  useEffect(() => {
    if (!snapshot.isPlaying || !snapshot.reactiveEnabled || reducedMotion) {
      publishSoundroomSilence();
      return undefined;
    }

    let frame = 0;
    let lastPublish = 0;
    let visible = document.visibilityState === "visible";
    const tick = (timestamp: number) => {
      frame = 0;
      if (!visible) return;
      if (timestamp - lastPublish >= 32) {
        lastPublish = timestamp;
        publishSoundroomEnergy(engine.getEnergySnapshot(), {
          intensity: snapshot.reactiveIntensity,
          enabled: snapshot.reactiveEnabled,
          playing: snapshot.isPlaying,
          track: snapshot.currentTrack,
        });
      }
      frame = window.requestAnimationFrame(tick);
    };
    const handleVisibility = () => {
      visible = document.visibilityState === "visible";
      if (!visible && frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
        publishSoundroomSilence();
      } else if (visible && !frame) {
        frame = window.requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    frame = window.requestAnimationFrame(tick);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", handleVisibility);
      publishSoundroomSilence();
    };
  }, [
    engine,
    reducedMotion,
    snapshot.currentTrack,
    snapshot.isPlaying,
    snapshot.reactiveEnabled,
    snapshot.reactiveIntensity,
  ]);

  return (
    <>
      <AnimatePresence initial={false}>
        {!roomOpen ? (
          <SoundroomMiniPlayer
            key="soundroom-mini"
            engine={engine}
            snapshot={snapshot}
            compact={compact}
            onCompactChange={setCompact}
            onOpen={openRoom}
          />
        ) : null}
        {roomOpen ? (
          <SoundroomOverlay
            key="soundroom-overlay"
            engine={engine}
            snapshot={snapshot}
            openView={openView}
            reducedMotion={reducedMotion}
            onClose={() => {
              setRoomOpen(false);
              setCompact(false);
            }}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {showDiscovery ? (
          <div className={styles.discoveryToast} role="status">
            <span />
            You found a quieter door. Try a local record.
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
