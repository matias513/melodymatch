const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const songs = require("../seed-catalog.json");

async function main() {
  await prisma.song.deleteMany();
  await prisma.song.createMany({
    data: songs.map((song) => ({
      title: song.title,
      artist: song.artist,
      country: song.country,
      region: song.region,
      fingerprint: JSON.stringify(song.fingerprint)
    }))
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
