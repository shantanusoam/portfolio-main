"use client";

import { useState } from "react";
import { listAppearancePresets } from "@/lib/mascot/appearance/AppearancePresets";
import { DEFAULT_APPEARANCE_TUNING } from "@/lib/mascot/appearance/AppearanceConfig";
import type {
  AppearanceLayerName,
  AppearancePresetName,
  AppearanceTuningOverrides,
  MascotEngine as MascotEngineContract,
  MascotExpression,
} from "@/lib/mascot/types";
import styles from "./Mascot.module.css";

export interface MascotAppearancePanelProps {
  engine: MascotEngineContract | null;
}

const LAYER_NAMES: AppearanceLayerName[] = [
  "silhouette",
  "print",
  "rim",
  "dots",
  "face",
];

const TUNING_KEYS: Array<{
  key: keyof AppearanceTuningOverrides;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "dotDensity", label: "dot density", min: 0, max: 1, step: 0.05 },
  { key: "bodyOpacity", label: "body opacity", min: 0, max: 1, step: 0.05 },
  { key: "rimWidth", label: "rim width", min: 0, max: 2, step: 0.1 },
  { key: "glowIntensity", label: "glow", min: 0, max: 2, step: 0.1 },
  {
    key: "patternScale",
    label: "pattern scale",
    min: 0.4,
    max: 2.2,
    step: 0.1,
  },
  {
    key: "patternContrast",
    label: "pattern contrast",
    min: 0,
    max: 1,
    step: 0.05,
  },
];

const EXPRESSIONS: MascotExpression[] = [
  "neutral",
  "curious",
  "happy",
  "focused",
  "surprised",
  "squint",
  "sleepy",
  "dizzy",
  "determined",
];

/**
 * Motion-lab-only appearance lab: preset/palette switching, per-layer render
 * toggles, continuous tuning knobs, and an expression override — all wired
 * through the five dev-only MascotEngine appearance methods. Never mounted
 * in production (this file is only imported from app/motion-lab/page.tsx).
 */
export default function MascotAppearancePanel({
  engine,
}: MascotAppearancePanelProps) {
  const [presetId, setPresetId] = useState<AppearancePresetName>("cute-bean");
  const [layers, setLayers] = useState<Record<AppearanceLayerName, boolean>>({
    silhouette: true,
    print: true,
    rim: true,
    dots: true,
    face: true,
  });
  const [tuning, setTuning] = useState<AppearanceTuningOverrides>({
    ...DEFAULT_APPEARANCE_TUNING,
  });
  const [expressionOverride, setExpressionOverride] = useState<
    MascotExpression | "auto"
  >("auto");

  if (!engine) return null;

  return (
    <div className={styles.debugPanel}>
      <div className={styles.debugRow}>
        <span className={styles.debugLabel}>appearance</span>
      </div>

      <div className={styles.debugButtons}>
        {listAppearancePresets().map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={styles.debugButton}
            data-active={presetId === preset.id}
            onClick={() => {
              setPresetId(preset.id);
              engine.setAppearancePreset(preset.id);
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className={styles.debugRow}>
        <span className={styles.debugLabel}>layers</span>
      </div>
      <div className={styles.debugButtons}>
        {LAYER_NAMES.map((layer) => (
          <button
            key={layer}
            type="button"
            className={styles.debugButton}
            data-active={layers[layer]}
            onClick={() => {
              const next = { ...layers, [layer]: !layers[layer] };
              setLayers(next);
              engine.setAppearanceLayers({ [layer]: next[layer] });
            }}
          >
            {layer}
          </button>
        ))}
      </div>

      {TUNING_KEYS.map(({ key, label, min, max, step }) => (
        <div className={styles.debugRow} key={key}>
          <span className={styles.debugLabel}>{label}</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={tuning[key]}
            onChange={(event) => {
              const value = Number(event.target.value);
              const next = { ...tuning, [key]: value };
              setTuning(next);
              engine.setAppearanceTuning({ [key]: value });
            }}
          />
          <span>{tuning[key].toFixed(2)}</span>
        </div>
      ))}

      <div className={styles.debugRow}>
        <span className={styles.debugLabel}>expression</span>
        <select
          className={styles.debugSelect}
          value={expressionOverride}
          onChange={(event) => {
            const value = event.target.value as MascotExpression | "auto";
            setExpressionOverride(value);
            engine.setExpressionOverride(value === "auto" ? null : value);
          }}
        >
          <option value="auto">auto</option>
          {EXPRESSIONS.map((expression) => (
            <option key={expression} value={expression}>
              {expression}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
