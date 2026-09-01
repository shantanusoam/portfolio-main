import type { EnergySnapshot } from "./types";

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function averageBand(
  bins: Uint8Array,
  sampleRate: number,
  fftSize: number,
  lowHz: number,
  highHz: number,
): number {
  const hzPerBin = sampleRate / fftSize;
  const start = Math.max(0, Math.floor(lowHz / hzPerBin));
  const end = Math.min(bins.length - 1, Math.ceil(highHz / hzPerBin));
  let total = 0;
  for (let index = start; index <= end; index += 1) total += bins[index];
  return clampUnit(total / Math.max(1, end - start + 1) / 255);
}

export class AudioAnalyser {
  private readonly waveform: Uint8Array;
  private readonly frequencyBins: Uint8Array;
  private readonly snapshot: EnergySnapshot;

  constructor(
    private readonly analyser: AnalyserNode,
    private readonly sampleRate: number,
  ) {
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.78;
    this.waveform = new Uint8Array(this.analyser.fftSize);
    this.frequencyBins = new Uint8Array(this.analyser.frequencyBinCount);
    this.snapshot = {
      bassEnergy: 0,
      lowMidEnergy: 0,
      midEnergy: 0,
      highEnergy: 0,
      overallEnergy: 0,
      smoothedEnergy: 0,
      waveform: this.waveform,
      frequencyBins: this.frequencyBins,
      timestamp: 0,
    };
  }

  read(timestamp = performance.now()): EnergySnapshot {
    this.analyser.getByteTimeDomainData(this.waveform);
    this.analyser.getByteFrequencyData(this.frequencyBins);

    let sumSquares = 0;
    for (let index = 0; index < this.waveform.length; index += 1) {
      const centered = (this.waveform[index] - 128) / 128;
      sumSquares += centered * centered;
    }
    const rms = Math.sqrt(sumSquares / Math.max(1, this.waveform.length));
    const bass = averageBand(
      this.frequencyBins,
      this.sampleRate,
      this.analyser.fftSize,
      28,
      180,
    );
    const lowMid = averageBand(
      this.frequencyBins,
      this.sampleRate,
      this.analyser.fftSize,
      180,
      620,
    );
    const mid = averageBand(
      this.frequencyBins,
      this.sampleRate,
      this.analyser.fftSize,
      620,
      2_800,
    );
    const high = averageBand(
      this.frequencyBins,
      this.sampleRate,
      this.analyser.fftSize,
      2_800,
      12_000,
    );
    const overall = clampUnit(rms * 2.25 + (bass + lowMid + mid + high) * 0.07);

    this.snapshot.bassEnergy = bass;
    this.snapshot.lowMidEnergy = lowMid;
    this.snapshot.midEnergy = mid;
    this.snapshot.highEnergy = high;
    this.snapshot.overallEnergy = overall;
    this.snapshot.smoothedEnergy +=
      (overall - this.snapshot.smoothedEnergy) *
      (overall > this.snapshot.smoothedEnergy ? 0.28 : 0.08);
    this.snapshot.timestamp = timestamp;
    return this.snapshot;
  }

  reset(): void {
    this.snapshot.bassEnergy = 0;
    this.snapshot.lowMidEnergy = 0;
    this.snapshot.midEnergy = 0;
    this.snapshot.highEnergy = 0;
    this.snapshot.overallEnergy = 0;
    this.snapshot.smoothedEnergy = 0;
  }
}
