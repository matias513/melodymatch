import { seedCatalog } from "@/lib/catalog";
import type { AudioFeatures, SearchMatch } from "@/lib/types";

function similarity(a: number[], b: number[]) {
  const distance = Math.sqrt(a.reduce((sum, value, index) => sum + Math.pow(value - b[index], 2), 0));
  return Math.max(0, 100 - distance * 120);
}

export function matchFromFeatures(features: AudioFeatures): SearchMatch[] {
  const input = [features.zcr, features.energy, features.density, features.length];

  return seedCatalog
    .map((song) => {
      const confidence = Math.round(similarity(input, song.fingerprint));
      const summary =
        confidence >= 85
          ? "Coincidencia fuerte con el patrón rítmico y la energía general."
          : confidence >= 72
            ? "Hay una similitud buena. Probá tararear una frase más clara para afinar el resultado."
            : "Posible coincidencia parcial dentro del catálogo curado.";

      return {
      title: String(song.title),
artist: String(song.artist),
country: String(song.country),
region: String(song.region),
        confidence,
        summary
      } satisfies SearchMatch;
    })
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
}
