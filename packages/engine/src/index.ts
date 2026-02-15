import baseTVs from './base_tvs.json' assert { type: 'json' };

export type Regime = '4H' | '6H' | '8H';

export interface TVBaseRecord {
  size_inches: number;
  diagonal_inches: number;
  distance_4h_m: number;
  distance_6h_m: number;
  distance_8h_m: number;
}

export interface StudyInput {
  projectName: string;
  clientName: string;
  roomName: string;
  viewingDistanceM: number;
}

export interface StudyRecommendation {
  regime: Regime;
  recommendedSizeInches: number;
  maxDistanceM: number;
  withinSpec: boolean;
}

const dataset = [...(baseTVs as TVBaseRecord[])].sort((a, b) => a.size_inches - b.size_inches);

function distanceByRegime(item: TVBaseRecord, regime: Regime): number {
  if (regime === '4H') return item.distance_4h_m;
  if (regime === '6H') return item.distance_6h_m;
  return item.distance_8h_m;
}

export function getBaseTVs(): TVBaseRecord[] {
  return dataset;
}

export function calculateBySize(sizeInches: number): TVBaseRecord {
  const exact = dataset.find((row) => row.size_inches === sizeInches);
  if (exact) return exact;

  const smaller = [...dataset].reverse().find((row) => row.size_inches < sizeInches);
  const bigger = dataset.find((row) => row.size_inches > sizeInches);

  if (!smaller || !bigger) {
    throw new Error(`Tamanho ${sizeInches} fora da faixa suportada.`);
  }

  const ratio = (sizeInches - smaller.size_inches) / (bigger.size_inches - smaller.size_inches);

  return {
    size_inches: sizeInches,
    diagonal_inches: smaller.diagonal_inches + ratio * (bigger.diagonal_inches - smaller.diagonal_inches),
    distance_4h_m: smaller.distance_4h_m + ratio * (bigger.distance_4h_m - smaller.distance_4h_m),
    distance_6h_m: smaller.distance_6h_m + ratio * (bigger.distance_6h_m - smaller.distance_6h_m),
    distance_8h_m: smaller.distance_8h_m + ratio * (bigger.distance_8h_m - smaller.distance_8h_m)
  };
}

export function recommendByDistance(viewingDistanceM: number, regime: Regime): StudyRecommendation {
  const match = dataset.find((row) => distanceByRegime(row, regime) >= viewingDistanceM) ?? dataset[dataset.length - 1];
  const maxDistanceM = distanceByRegime(match, regime);

  return {
    regime,
    recommendedSizeInches: match.size_inches,
    maxDistanceM,
    withinSpec: viewingDistanceM <= maxDistanceM
  };
}

export function createStudy(input: StudyInput) {
  const recommendations: StudyRecommendation[] = (['4H', '6H', '8H'] as Regime[]).map((regime) =>
    recommendByDistance(input.viewingDistanceM, regime)
  );

  return {
    ...input,
    recommendations,
    generatedAt: new Date().toISOString()
  };
}
