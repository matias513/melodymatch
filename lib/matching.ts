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

function similarityFromDiff(difference: number, softness = 1) {
  return clamp(1 - difference * softness);
}

function classifyStrengths(input: FingerprintVector, candidate: FingerprintVector) {
  const strengths: string[] = [];

  const densityDiff = diff(input.density, candidate.density);
  const energyDiff = diff(input.energy, candidate.energy);
  const lengthDiff = diff(input.length, candidate.length);
  const zcrDiff = diff(input.zcr, candidate.zcr);

  if (densityDiff <= 0.08) strengths.push("ritmo muy parecido");
  else if (densityDiff <= 0.14) strengths.push("ritmo similar");

  if (energyDiff <= 0.08) strengths.push("energía muy cercana");
  else if (energyDiff <= 0.14) strengths.push("energía similar");

  if (lengthDiff <= 0.10) strengths.push("duración compatible");
  if (zcrDiff <= 0.12) strengths.push("textura vocal parecida");

  return strengths;
}

function buildPenalty(input: FingerprintVector, candidate: FingerprintVector) {
  const densityDiff = diff(input.density, candidate.density);
  const energyDiff = diff(input.energy, candidate.energy);
  const lengthDiff = diff(input.length, candidate.length);
  const zcrDiff = diff(input.zcr, candidate.zcr);

  let penalty = 0;

  if (densityDiff > 0.22) penalty += 0.05;
  if (densityDiff > 0.32) penalty += 0.08;
  if (densityDiff > 0.42) penalty += 0.12;

  if (energyDiff > 0.22) penalty += 0.05;
  if (energyDiff > 0.32) penalty += 0.08;
  if (energyDiff > 0.42) penalty += 0.12;

  if (lengthDiff > 0.20) penalty += 0.03;
  if (lengthDiff > 0.35) penalty += 0.07;
  if (lengthDiff > 0.50) penalty += 0.10;

  if (zcrDiff > 0.28) penalty += 0.02;
  if (zcrDiff > 0.42) penalty += 0.04;

  // Penalización adicional si fallan juntas las 2 features más importantes
  if (densityDiff > 0.30 && energyDiff > 0.30) {
    penalty += 0.10;
  }

  return penalty;
}

function buildBonus(input: FingerprintVector, candidate: FingerprintVector) {
  const densityDiff = diff(input.density, candidate.density);
  const energyDiff = diff(input.energy, candidate.energy);
  const lengthDiff = diff(input.length, candidate.length);
  const zcrDiff = diff(input.zcr, candidate.zcr);

  let bonus = 0;

  if (densityDiff < 0.06) bonus += 0.04;
  if (energyDiff < 0.06) bonus += 0.04;
  if (lengthDiff < 0.08) bonus += 0.02;
  if (zcrDiff < 0.10) bonus += 0.01;

  if (densityDiff < 0.10 && energyDiff < 0.10) {
    bonus += 0.03;
  }

  return bonus;
}

function computeRawScore(input: FingerprintVector, candidate: FingerprintVector) {
  const densityScore = similarityFromDiff(diff(input.density, candidate.density), 1.15);
  const energyScore = similarityFromDiff(diff(input.energy, candidate.energy), 1.1);
  const lengthScore = similarityFromDiff(diff(input.length, candidate.length), 0.95);
  const zcrScore = similarityFromDiff(diff(input.zcr, candidate.zcr), 0.85);

  // Más peso a density y energy
  let score =
    densityScore * 0.36 +
    energyScore * 0.31 +
    lengthScore * 0.20 +
    zcrScore * 0.13;

  const penalty = buildPenalty(input, candidate);
  const bonus = buildBonus(input, candidate);

  score = score + bonus - penalty;

  return {
    score: clamp(score),
    penalties: penalty,
  };
}

function confidenceFromScore(score: number) {
  // Curva más exigente. No regala 90+ fácilmente.
  if (score >= 0.95) return 97;
  if (score >= 0.92) return 94;
  if (score >= 0.89) return 91;
  if (score >= 0.86) return 88;
  if (score >= 0.83) return 84;
  if (score >= 0.80) return 81;
  if (score >= 0.77) return 78;
  if (score >= 0.74) return 75;
  if (score >= 0.71) return 72;
  if (score >= 0.68) return 69;
  if (score >= 0.65) return 66;
  if (score >= 0.62) return 63;
  if (score >= 0.58) return 59;

  return Math.max(45, Math.round(score * 100));
}

function buildSummary(
  confidence: number,
  strengths: string[],
  penalties: number
) {
  if (confidence >= 92) {
    if (strengths.length >= 2) {
      return `Coincidencia muy fuerte por ${strengths.slice(0, 2).join(" y ")}.`;
    }
    return "Coincidencia muy fuerte dentro del catálogo curado.";
  }

  if (confidence >= 84) {
    if (strengths.length >= 2) {
      return `Coincidencia sólida por ${strengths.slice(0, 2).join(" y ")}.`;
    }
    if (strengths.length === 1) {
      return `Coincidencia sólida por ${strengths[0]}.`;
    }
    return "Coincidencia sólida dentro del catálogo curado.";
  }

  if (confidence >= 74) {
    if (strengths.length > 0) {
      return `Buena similitud por ${strengths.slice(0, 2).join(" y ")}.`;
    }
    return "Buena similitud general. Probá una toma más estable para afinar.";
  }

  if (confidence >= 64) {
    if (penalties >= 0.12) {
      return "Coincidencia posible, pero con diferencias notables. Probá repetir el tarareo.";
    }
    return "Coincidencia parcial plausible dentro del catálogo actual.";
  }

  return "Coincidencia baja. Conviene grabar una referencia más clara.";
}

function isPlausibleMatch(match: InternalMatch) {
  if (match.rawScore < 0.50) return false;
  if (match.confidence < 52) return false;
  return true;
}

function diversify(matches: InternalMatch[]) {
  const selected: InternalMatch[] = [];
  const usedTitles = new Set<string>();
  const usedArtists = new Map<string, number>();
  const usedCountries = new Map<string, number>();

  for (const match of matches) {
    const titleKey = match.title.trim().toLowerCase();
    const artistKey = match.artist.trim().toLowerCase();
    const countryKey = match.country.trim().toLowerCase();

    if (usedTitles.has(titleKey)) continue;

    const artistCount = usedArtists.get(artistKey) ?? 0;
    const countryCount = usedCountries.get(countryKey) ?? 0;

    // Evita que el top quede demasiado clonado
    if (artistCount >= 1 && selected.length < 4) continue;
    if (countryCount >= 3 && selected.length < 4) continue;

    selected.push(match);
    usedTitles.add(titleKey);
    usedArtists.set(artistKey, artistCount + 1);
    usedCountries.set(countryKey, countryCount + 1);

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
      const confidence = confidenceFromScore(score);
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
        strengths,
      };
    })
    .filter(isPlausibleMatch)
    .sort((a, b) => {
      if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return a.penalties - b.penalties;
    });

  const topMatches = diversify(allMatches);

  // Fallback si el catálogo actual no alcanza a dar 5 plausibles
  if (topMatches.length < 5) {
    const fallback = seedCatalog
      .map((song) => {
        const candidate = normalizeFingerprint(song.fingerprint);
        const { score, penalties } = computeRawScore(input, candidate);
        const confidence = confidenceFromScore(score);
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
          strengths,
        } satisfies InternalMatch;
      })
      .sort((a, b) => {
        if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
        if (b.confidence !== a.confidence) return b.confidence - a.confidence;
        return a.penalties - b.penalties;
      });

    return diversify(fallback)
      .slice(0, 5)
      .map(({ rawScore, penalties, strengths, ...match }) => match);
  }

  return topMatches
    .slice(0, 5)
    .map(({ rawScore, penalties, strengths, ...match }) => match);
}
