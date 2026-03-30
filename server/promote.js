const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function promote(email) {
  try {
    const user = await prisma.user.update({
      where: { email: email },
      data: { role: 'ADMIN' },
    });
    console.log(`SUCESSO: O utilizador ${email} agora é ADMIN.`);
  } catch (error) {
    if (error.code === 'P2025') {
      console.error(`ERRO: O email ${email} não foi encontrado na base de dados.`);
    } else {
      console.error('ERRO:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Pega o email dos argumentos ou usa o padrão
const targetEmail = process.argv[2] || 'edson@crioulo.stp'; 
promote(targetEmail);
