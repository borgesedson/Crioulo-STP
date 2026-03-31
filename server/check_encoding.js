import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const words = await prisma.dictionary.findMany({
    where: {
      OR: [
        { word: { contains: 'Ant', mode: 'insensitive' } },
        { translationPt: { contains: 'Ant', mode: 'insensitive' } },
        { translationPt: { contains: 'biol', mode: 'insensitive' } }
      ]
    }
  });
  console.log('ENCODING_CHECK_WORDS:', JSON.stringify(words, null, 2));
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
