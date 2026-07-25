export const CHORDS = [
  {
    name: "C major",
    shortName: "C",
    strings: [
      ["C3", 130.81],
      ["G3", 196],
      ["C4", 261.63],
      ["E4", 329.63],
      ["G4", 392],
      ["C5", 523.25],
    ],
  },
  {
    name: "A minor",
    shortName: "Am",
    strings: [
      ["A2", 110],
      ["E3", 164.81],
      ["A3", 220],
      ["C4", 261.63],
      ["E4", 329.63],
      ["A4", 440],
    ],
  },
  {
    name: "F major",
    shortName: "F",
    strings: [
      ["F2", 87.31],
      ["C3", 130.81],
      ["F3", 174.61],
      ["A3", 220],
      ["C4", 261.63],
      ["F4", 349.23],
    ],
  },
  {
    name: "G major",
    shortName: "G",
    strings: [
      ["G2", 98],
      ["D3", 146.83],
      ["G3", 196],
      ["B3", 246.94],
      ["D4", 293.66],
      ["G4", 392],
    ],
  },
] as const;

export type PluckBufferCache = Map<number, AudioBuffer>;

function createKarplusStrongBuffer(
  context: AudioContext,
  frequency: number
): AudioBuffer {
  const duration = 2.2;
  const frameCount = Math.floor(context.sampleRate * duration);
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const samples = buffer.getChannelData(0);
  const period = Math.max(2, Math.round(context.sampleRate / frequency));
  const damping = frequency < 150 ? 0.997 : 0.994;

  for (let frame = 0; frame < period; frame += 1) {
    samples[frame] = Math.random() * 2 - 1;
  }

  // Reason: averaging each delayed sample with its neighbor models energy
  // travelling along a string, producing a natural pitch and decaying timbre.
  for (let frame = period; frame < frameCount; frame += 1) {
    const delayedFrame = frame - period;
    samples[frame] =
      damping *
      0.5 *
      (samples[delayedFrame] + samples[delayedFrame + 1]);
  }

  return buffer;
}

export function playPhysicalString({
  context,
  cache,
  frequency,
  intensity,
  pan,
}: {
  context: AudioContext;
  cache: PluckBufferCache;
  frequency: number;
  intensity: number;
  pan: number;
}) {
  const now = context.currentTime;
  const level = Math.min(Math.max(intensity, 0.12), 1);
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const output = context.createGain();
  const stereo = context.createStereoPanner();
  const cacheKey = Math.round(frequency * 100);

  let buffer = cache.get(cacheKey);
  if (!buffer) {
    buffer = createKarplusStrongBuffer(context, frequency);
    cache.set(cacheKey, buffer);
  }

  source.buffer = buffer;
  source.playbackRate.value = 1 + (Math.random() - 0.5) * 0.003;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(
    Math.min(1200 + level * 3600, context.sampleRate * 0.4),
    now
  );
  filter.frequency.setTargetAtTime(900, now + 0.02, 0.45);
  filter.Q.value = 0.55;
  output.gain.setValueAtTime(0.0001, now);
  output.gain.exponentialRampToValueAtTime(0.22 * level, now + 0.004);
  output.gain.exponentialRampToValueAtTime(0.0001, now + 2.15);
  stereo.pan.value = Math.min(Math.max(pan, -0.75), 0.75);

  source.connect(filter).connect(output).connect(stereo).connect(context.destination);
  source.start(now);
  source.stop(now + 2.2);
  source.addEventListener("ended", () => {
    source.disconnect();
    filter.disconnect();
    output.disconnect();
    stereo.disconnect();
  });
}
