const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const songs = require("../seed-catalog.json");

function isValidFingerprint(value) {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  );
}

function normalizeSong(song) {
  return {
    title: String(song.title ?? "").trim(),
    artist: String(song.artist ?? "").trim(),
    country: String(song.country ?? "").trim(),
    region: String(song.region ?? "").trim(),
    fingerprint: JSON.stringify(song.fingerprint),
  };
}

async function main() {
  const validSongs = songs
    .filter((song) => song && song.title && song.artist && isValidFingerprint(song.fingerprint))
    .map(normalizeSong)
    .filter(
      (song) =>
        song.title.length > 0 &&
        song.artist.length > 0 &&
        song.country.length > 0 &&
        song.region.length > 0
    );

  const seen = new Set();
  const uniqueSongs = validSongs.filter((song) => {
    const key = `${song.title.toLowerCase()}__${song.artist.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  await prisma.song.deleteMany();

  if (uniqueSongs.length > 0) {
    await prisma.song.createMany({
      data: uniqueSongs,
      skipDuplicates: true,
    });
  }

  console.log(`Seed completado: ${uniqueSongs.length} canciones cargadas.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Error al ejecutar el seed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
