#!/usr/bin/env bash
# Refreshes the self-hosted MediaPipe assets in public/mediapipe/ (see
# CameraHandAdapter.ts for why these are self-hosted instead of fetched from
# jsdelivr/Google Storage at runtime). Re-run after bumping the
# @mediapipe/tasks-vision dependency version.
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p public/mediapipe/wasm
cp node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.js public/mediapipe/wasm/
cp node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.wasm public/mediapipe/wasm/

curl -sL \
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task" \
  -o public/mediapipe/hand_landmarker.task

echo "Updated public/mediapipe/ ($(du -sh public/mediapipe | cut -f1))"
