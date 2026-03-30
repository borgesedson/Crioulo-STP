import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Iniciando vinculação de contribuições órfãs (ESM + ENV)...');

  // 1. Achar o utilizador Edson J (ou o primeiro admin, se o nome variar)
  const user = await prisma.user.findFirst({
    where: { 
      OR: [
        { name: { contains: 'Edson' } },
        { role: 'ADMIN' }
      ]
    }
  });

  if (!user) {
    console.error('❌ Utilizador de destino não encontrado! Verifica se a base de dados está acessível.');
    return;
  }

  console.log(`✅ Utilizador alvo: ${user.name} (${user.id})`);

  // 2. Vincular contribuições Approved que estão sem userId
  const fixed = await prisma.contribution.updateMany({
    where: { 
      status: 'approved',
      userId: null
    },
    data: {
      userId: user.id
    }
  });

  console.log(`✨ Sucesso! ${fixed.count} contribuições vinculadas.`);
}

main()
  .catch((e) => {
    console.error('❌ Erro durante a execução:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
