import { seedCatalog } from "@/lib/catalog";
import type { AudioFeatures, SearchMatch } from "@/lib/types";

type FingerprintVector = {
  zcr: number;
  energy: number;
  density: number;
  length: number;
};

type InternalMatch = SearchMatch & {
  rawScore: number;
  penalties: number;
  closeness: number;
  strengths: string[];
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function safeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeFeatures(features: AudioFeatures): FingerprintVector {
  return {
    zcr: clamp(safeNumber(features.zcr)),
    energy: clamp(safeNumber(features.energy)),
    density: clamp(safeNumber(features.density)),
    length: clamp(safeNumber(features.length)),
  };
}

function normalizeFingerprint(fingerprint: unknown): FingerprintVector {
  const values = Array.isArray(fingerprint) ? fingerprint : [];

  return {
    zcr: clamp(safeNumber(values[0])),
    energy: clamp(safeNumber(values[1])),
    density: clamp(safeNumber(values[2])),
    length: clamp(safeNumber(values[3])),
  };
}

function diff(a: number, b: number) {
  return Math.abs(a - b);
}

function componentSimilarity(difference: number, weight = 1) {
  return clamp(1 - difference * weight);
}

function classifyStrengths(input: FingerprintVector, candidate: FingerprintVector) {
  const densityDiff = diff(input.density, candidate.density);
  const energyDiff = diff(input.energy, candidate.energy);
  const lengthDiff = diff(input.length, candidate.length);
  const zcrDiff = diff(input.zcr, candidate.zcr);

  const strengths: string[] = [];

  if (densityDiff <= 0.07) strengths.push("ritmo muy parecido");
  else if (densityDiff <= 0.13) strengths.push("ritmo similar");

  if (energyDiff <= 0.07) strengths.push("energía muy cercana");
  else if (energyDiff <= 0.13) strengths.push("energía similar");

  if (lengthDiff <= 0.09) strengths.push("duración compatible");
  else if (lengthDiff <= 0.15) strengths.push("duración cercana");

  if (zcrDiff <= 0.10) strengths.push("textura vocal parecida");

  return strengths;
}

function buildPenalty(input: FingerprintVector, candidate: FingerprintVector) {
  const densityDiff = diff(input.density, candidate.density);
  const energyDiff = diff(input.energy, candidate.energy);
  const lengthDiff = diff(input.length, candidate.length);
  const zcrDiff = diff(input.zcr, candidate.zcr);

  let penalty = 0;

  if (densityDiff > 0.18) penalty += 0.04;
  if (densityDiff > 0.28) penalty += 0.08;
  if (densityDiff > 0.38) penalty += 0.13;

  if (energyDiff > 0.18) penalty += 0.04;
  if (energyDiff > 0.28) penalty += 0.08;
  if (energyDiff > 0.38) penalty += 0.13;

  if (lengthDiff > 0.18) penalty += 0.03;
  if (lengthDiff > 0.30) penalty += 0.06;
  if (lengthDiff > 0.45) penalty += 0.10;

  if (zcrDiff > 0.24) penalty += 0.015;
  if (zcrDiff > 0.36) penalty += 0.03;
  if (zcrDiff > 0.50) penalty += 0.05;

  // castigo extra si fallan juntas las dos dimensiones más importantes
  if (densityDiff > 0.26 && energyDiff > 0.26) {
    penalty += 0.08;
  }

  if (densityDiff > 0.34 && energyDiff > 0.34) {
    penalty += 0.06;
  }

  return penalty;
}

function buildBonus(input: FingerprintVector, candidate: FingerprintVector) {
  const densityDiff = diff(input.density, candidate.density);
  const energyDiff = diff(input.energy, candidate.energy);
  const lengthDiff = diff(input.length, candidate.length);
  const zcrDiff = diff(input.zcr, candidate.zcr);

  let bonus = 0;

  if (densityDiff < 0.05) bonus += 0.04;
  if (energyDiff < 0.05) bonus += 0.04;
  if (lengthDiff < 0.07) bonus += 0.025;
  if (zcrDiff < 0.08) bonus += 0.015;

  if (densityDiff < 0.09 && energyDiff < 0.09) {
    bonus += 0.035;
  }

  if (densityDiff < 0.12 && energyDiff < 0.12 && lengthDiff < 0.12) {
    bonus += 0.02;
  }

  return bonus;
}

function computeCloseness(input: FingerprintVector, candidate: FingerprintVector) {
  const densityDiff = diff(input.density, candidate.density);
  const energyDiff = diff(input.energy, candidate.energy);
  const lengthDiff = diff(input.length, candidate.length);
  const zcrDiff = diff(input.zcr, candidate.zcr);

  const total =
    densityDiff * 0.36 +
    energyDiff * 0.31 +
    lengthDiff * 0.21 +
    zcrDiff * 0.12;

  return clamp(1 - total);
}

function computeRawScore(input: FingerprintVector, candidate: FingerprintVector) {
  const densityScore = componentSimilarity(diff(input.density, candidate.density), 1.18);
  const energyScore = componentSimilarity(diff(input.energy, candidate.energy), 1.12);
  const lengthScore = componentSimilarity(diff(input.length, candidate.length), 0.96);
  const zcrScore = componentSimilarity(diff(input.zcr, candidate.zcr), 0.82);

  let score =
    densityScore * 0.37 +
    energyScore * 0.31 +
    lengthScore * 0.20 +
    zcrScore * 0.12;

  const penalty = buildPenalty(input, candidate);
  const bonus = buildBonus(input, candidate);

  score = score + bonus - penalty;

  return {
    score: clamp(score),
    penalties: penalty,
  };
}

function confidenceFromScore(score: number, closeness: number) {
  const blended = score * 0.7 + closeness * 0.3;

  if (blended >= 0.95) return 97;
  if (blended >= 0.92) return 94;
  if (blended >= 0.89) return 91;
  if (blended >= 0.86) return 88;
  if (blended >= 0.83) return 84;
  if (blended >= 0.80) return 81;
  if (blended >= 0.77) return 78;
  if (blended >= 0.74) return 75;
  if (blended >= 0.71) return 72;
  if (blended >= 0.68) return 69;
  if (blended >= 0.65) return 66;
  if (blended >= 0.62) return 63;
  if (blended >= 0.58) return 59;

  return Math.max(44, Math.round(blended * 100));
}

function buildSummary(
  confidence: number,
  strengths: string[],
  penalties: number
) {
  if (confidence >= 92) {
    return strengths.length >= 2
      ? `Coincidencia muy fuerte por ${strengths.slice(0, 2).join(" y ")}.`
      : "Coincidencia muy fuerte dentro del catálogo.";
  }

  if (confidence >= 84) {
    return strengths.length >= 2
      ? `Coincidencia sólida por ${strengths.slice(0, 2).join(" y ")}.`
      : strengths.length === 1
        ? `Coincidencia sólida por ${strengths[0]}.`
        : "Coincidencia sólida dentro del catálogo.";
  }

  if (confidence >= 74) {
    return strengths.length > 0
      ? `Buena similitud por ${strengths.slice(0, 2).join(" y ")}.`
      : "Buena similitud general. Una toma más clara puede mejorar el ranking.";
  }

  if (confidence >= 64) {
    return penalties >= 0.12
      ? "Coincidencia posible, pero con diferencias notables. Probá repetir el tarareo."
      : "Coincidencia parcial plausible dentro del catálogo actual.";
  }

  return "Coincidencia baja. Conviene grabar una referencia más clara.";
}

function isPlausibleMatch(match: InternalMatch) {
  if (match.rawScore < 0.48) return false;
  if (match.confidence < 50) return false;
  return true;
}

function diversify(matches: InternalMatch[]) {
  const selected: InternalMatch[] = [];
  const usedTitles = new Set<string>();
  const usedArtists = new Map<string, number>();
  const usedRegions = new Map<string, number>();

  for (const match of matches) {
    const titleKey = match.title.trim().toLowerCase();
    const artistKey = match.artist.trim().toLowerCase();
    const regionKey = match.region.trim().toLowerCase();

    if (usedTitles.has(titleKey)) continue;

    const artistCount = usedArtists.get(artistKey) ?? 0;
    const regionCount = usedRegions.get(regionKey) ?? 0;

    if (artistCount >= 1 && selected.length < 4) continue;
    if (regionCount >= 3 && selected.length < 4) continue;

    selected.push(match);
    usedTitles.add(titleKey);
    usedArtists.set(artistKey, artistCount + 1);
    usedRegions.set(regionKey, regionCount + 1);

    if (selected.length === 5) break;
  }

  if (selected.length < 5) {
    for (const match of matches) {
      const titleKey = match.title.trim().toLowerCase();
      if (usedTitles.has(titleKey)) continue;

      selected.push(match);
      usedTitles.add(titleKey);

      if (selected.length === 5) break;
    }
  }

  return selected;
}

export function matchFromFeatures(features: AudioFeatures): SearchMatch[] {
  const input = normalizeFeatures(features);

  const allMatches: InternalMatch[] = seedCatalog
    .map((song) => {
      const candidate = normalizeFingerprint(song.fingerprint);
      const { score, penalties } = computeRawScore(input, candidate);
      const closeness = computeCloseness(input, candidate);
      const confidence = confidenceFromScore(score, closeness);
      const strengths = classifyStrengths(input, candidate);
      const summary = buildSummary(confidence, strengths, penalties);

      return {
        title: String(song.title),
        artist: String(song.artist),
        country: String(song.country),
        region: String(song.region),
        confidence,
        summary,
        rawScore: score,
        penalties,
        closeness,
        strengths,
      };
    })
    .filter(isPlausibleMatch)
    .sort((a, b) => {
      if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
      if (b.closeness !== a.closeness) return b.closeness - a.closeness;
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return a.penalties - b.penalties;
    });

  const topMatches = diversify(allMatches);

  if (topMatches.length < 5) {
    const fallback = seedCatalog
      .map((song) => {
        const candidate = normalizeFingerprint(song.fingerprint);
        const { score, penalties } = computeRawScore(input, candidate);
        const closeness = computeCloseness(input, candidate);
        const confidence = confidenceFromScore(score, closeness);
        const strengths = classifyStrengths(input, candidate);
        const summary = buildSummary(confidence, strengths, penalties);

        return {
          title: String(song.title),
          artist: String(song.artist),
          country: String(song.country),
          region: String(song.region),
          confidence,
          summary,
          rawScore: score,
          penalties,
          closeness,
          strengths,
        } satisfies InternalMatch;
      })
      .sort((a, b) => {
        if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
        if (b.closeness !== a.closeness) return b.closeness - a.closeness;
        if (b.confidence !== a.confidence) return b.confidence - a.confidence;
        return a.penalties - b.penalties;
      });

    return diversify(fallback)
      .slice(0, 5)
      .map(({ rawScore, penalties, closeness, strengths, ...match }) => match);
  }

  return topMatches
    .slice(0, 5)
    .map(({ rawScore, penalties, closeness, strengths, ...match }) => match);
}
