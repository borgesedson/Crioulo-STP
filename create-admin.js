import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import 'dotenv/config'

const prisma = new PrismaClient()

async function createAdmin() {
  const email = 'dossantosborges701@gmail.com'; // EDITAR AQUI
  const password = 'Margarida03@'; // EDITAR AQUI
  const name = 'Admin Crioulo STP';

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
      where: { email },
      update: {
        role: 'ADMIN',
        password: hashedPassword
      },
      create: {
        email,
        name,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    console.log(`✅ Admin criado/atualizado com sucesso: ${admin.email}`);
    console.log(`🔑 Role: ${admin.role}`);
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
