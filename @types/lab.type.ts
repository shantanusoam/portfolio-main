export type SensorChannel = {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  decimals: number;
};

export type LabExperiment = {
  id: string;
  title: string;
  description: string;
  tech: string[];
  link?: string;
  isPlaceholder?: boolean;
};
