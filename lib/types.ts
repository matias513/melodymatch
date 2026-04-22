export type AudioFeatures = {
  zcr: number;
  energy: number;
  density: number;
  length: number;
};

export type SearchMatch = {
  title: string;
  artist: string;
  country: string;
  region: string;
  confidence: number;
  summary: string;
};
