import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const counts = await prisma.dictionary.groupBy({
    by: ['variant'],
    _count: { _all: true },
    where: { status: 'published' }
  });
  console.log('RECORD_COUNTS_BY_VARIANT:', JSON.stringify(counts, null, 2));
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
