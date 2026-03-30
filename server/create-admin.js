import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// 👇 ALTERA AQUI OS DADOS DO TEU ADMIN 👇
const EMAIL_ADMIN = "dossantosborges701@gmail.com";
const PASSWORD_ADMIN = "Margarida03@";
const NOME_ADMIN = "Engenheiro Edson";
// 👆 --------------------------------- 👆

async function createAdmin() {
  if (EMAIL_ADMIN === "oteuemail@gmail.com") {
    console.error('⚠️ Por favor, altera o EMAIL_ADMIN e PASSWORD_ADMIN dentro do ficheiro create-admin.js antes de executar.');
    process.exit(1);
  }

  try {
    const hashedPassword = await bcrypt.hash(PASSWORD_ADMIN, 10);

    const admin = await prisma.user.upsert({
      where: { email: EMAIL_ADMIN },
      update: {
        password: hashedPassword,
        name: NOME_ADMIN,
        role: 'ADMIN' // Certifica-te de que está definido como Admin
      },
      create: {
        email: EMAIL_ADMIN,
        password: hashedPassword,
        name: NOME_ADMIN,
        role: 'ADMIN'
      }
    });

    console.log(`\n✅ Sucesso! O Administrador [${admin.email}] foi criado/atualizado com sucesso.`);
    console.log('Agora podes iniciar sessão no portal e aceder à aba exclusiva "Painel Admin".\n');
  } catch (error) {
    console.error('❌ Erro ao criar administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
