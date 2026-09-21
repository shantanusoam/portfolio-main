/** One demand-driven clock shared by the director and visible shader surfaces. */
export type Frame = {
  time: number;
  progress: number;
  velocity: number;
  x: number;
  y: number;
  enabled: boolean;
};
export const frame: Frame = {
  time: 0,
  progress: 0,
  velocity: 0,
  x: 0,
  y: 0,
  enabled: false,
};
const listeners = new Set<(frame: Frame) => void>();
let request = 0;
let until = 0;
export function wake(duration = 650) {
  until = Math.max(until, performance.now() + duration);
  if (!request && !document.hidden) request = requestAnimationFrame(tick);
}
function tick(time: number) {
  request = 0;
  if (document.hidden) return;
  frame.time = time;
  listeners.forEach((listener) => listener(frame));
  if (time < until) request = requestAnimationFrame(tick);
}
export function subscribe(listener: (frame: Frame) => void) {
  listeners.add(listener);
  wake();
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      cancelAnimationFrame(request);
      request = 0;
      until = 0;
    }
  };
}
const stops = [
  { bg: [10, 25, 18], accent: [222, 231, 176], name: "Morning light" },
  { bg: [15, 30, 22], accent: [229, 222, 170], name: "A little warmth" },
  { bg: [22, 30, 23], accent: [235, 207, 172], name: "Golden hour" },
  { bg: [29, 27, 30], accent: [230, 189, 190], name: "A softer sky" },
  { bg: [19, 27, 28], accent: [192, 216, 197], name: "Still water" },
  { bg: [15, 26, 23], accent: [209, 223, 184], name: "Coming home" },
  { bg: [26, 31, 22], accent: [244, 218, 175], name: "First light" },
];
export function timeOfDay(progress: number) {
  const p =
    Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0)) *
    (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(p));
  const t = p - i;
  const mix = (key: "bg" | "accent") =>
    stops[i][key]
      .map((v, n) => Math.round(v + (stops[i + 1][key][n] - v) * t))
      .join(",");
  return {
    background: `rgb(${mix("bg")})`,
    accent: `rgb(${mix("accent")})`,
    name: stops[Math.round(p)].name,
  };
}
