import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function clean() {
  console.log('🧹 Limpando tabela Dictionary...')
  try {
    const deleted = await prisma.dictionary.deleteMany({})
    console.log(`✅ Removidos ${deleted.count} registros corrompidos.`)
  } catch (err) {
    console.error('❌ Erro ao limpar banco:', err)
  } finally {
    await prisma.$disconnect()
  }
}

clean()
