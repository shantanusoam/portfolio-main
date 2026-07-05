import { LabExperiment, SensorChannel } from '@/@types/lab.type';

// Purely synthetic telemetry — this is a simulated readout, not a real
// hardware feed, by design. Ranges are just plausible for the sensor named.
export const sensorChannels: SensorChannel[] = [
  { id: 'temperature', label: 'Temperature', unit: '°C', min: 18, max: 32, decimals: 1 },
  { id: 'motion', label: 'Motion', unit: '', min: 0, max: 1, decimals: 0 },
  { id: 'distance', label: 'Distance', unit: 'cm', min: 8, max: 180, decimals: 0 },
  { id: 'latency', label: 'Cloud Inference Latency', unit: 'ms', min: 40, max: 220, decimals: 0 },
];

export const experiments: LabExperiment[] = [
  // Real: this Spline scene has been sitting commented-out in Hero.tsx since
  // before this redesign — surfacing it here instead of leaving it dead.
  {
    id: 'spline-scene',
    title: '3D Spline Scene Experiment',
    description:
      'An interactive 3D scene built in Spline, prototyped for the site hero.',
    tech: ['Spline', 'react-spline'],
    link: 'https://prod.spline.design/WTbnS8VGbbw4NYlj/scene.splinecode',
  },
  // PLACEHOLDER-PENDING-REAL-CONTENT: swap in real Rive/motion experiment
  // details and links once available.
  {
    id: 'rive-demo-1',
    title: '[PLACEHOLDER] Rive state-machine experiment',
    description: '[PLACEHOLDER] one-line description pending.',
    tech: ['Rive'],
    isPlaceholder: true,
  },
  // Real — see the full write-up at /projects/hardware-prototypes. The
  // telemetry readout above stays simulated; this entry is the honest label
  // pointing at the actual hands-on hardware work behind it.
  {
    id: 'sensor-robotics',
    title: 'Sensor-Driven Robotic Prototypes',
    description:
      'Arduino/Raspberry Pi builds combining ultrasonic, motion, temperature, and environmental sensors with real-time control logic and edge-AI inference tradeoffs. Full write-up under Mission Select.',
    tech: ['Arduino', 'Raspberry Pi', 'Edge AI'],
    link: '/projects/hardware-prototypes',
  },
];
