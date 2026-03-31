import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Database for Accented Characters ---');
    const samples = await prisma.dictionary.findMany({
        where: {
            OR: [
                { translationPt: { contains: 'ã' } },
                { translationPt: { contains: 'õ' } },
                { translationPt: { contains: 'ê' } },
                { word: { contains: 'â' } }
            ]
        },
        take: 5
    });

    if (samples.length === 0) {
        console.log('❌ No accented characters found in samples. Checking total count...');
    } else {
        console.log('✅ Found accented characters:');
        samples.forEach(s => {
            console.log(`[${s.variant}] ${s.word} -> ${s.translationPt}`);
        });
    }

    const total = await prisma.dictionary.count();
    console.log('Total Records:', total);

    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
