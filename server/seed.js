import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 A semear a base de dados do Kriolu STP...')

  // 0. Utilizador Admin Inicial
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const hashedKey = await bcrypt.hash('ADMIN-KEY-2024', 10)
  
  await prisma.user.upsert({
    where: { email: 'admin@kriolustp.st' },
    update: {},
    create: {
      email: 'admin@kriolustp.st',
      password: hashedPassword,
      name: 'Administrador Kriolu',
      role: 'ADMIN',
      recoveryKey: hashedKey,
      xpTotal: 1000,
      nivel: 'Expert'
    }
  })

  // 1. Dicionário Inicial
  const words = [
    {
      word: 'Bô dji bô',
      translationPt: 'Bom dia',
      variant: 'Forro',
      phonetic: '/bo dʒi bo/',
      exampleKriolu: 'Bô dji bô, m\'fala co bô.',
      examplePt: 'Bom dia, falo contigo.',
      category: 'Saudação'
    },
    {
      word: 'Cuá',
      translationPt: 'Coisa',
      variant: 'Angolar',
      phonetic: '/kwa/',
      exampleKriolu: 'N\'ka sê cuá dji n\'ka fá.',
      examplePt: 'Não é coisa que eu faça.',
      category: 'Substantivo'
    },
    {
      word: 'Mionga',
      translationPt: 'Mar',
      variant: 'Forro',
      phonetic: '/mi\'on.ga/',
      exampleKriolu: 'Mionga sê muala dji n\'ka fê.',
      examplePt: 'O mar é mulher que eu fiz.',
      category: 'Substantivo'
    },
    {
      word: 'Êntchi',
      translationPt: 'Hoje',
      variant: 'Lung\'iê',
      phonetic: '/e\'ntʃi/',
      exampleKriolu: 'Êntchi m\'be mionga.',
      examplePt: 'Hoje vou ao mar.',
      category: 'Advérbio'
    }
  ]

  for (const w of words) {
    await prisma.dictionary.create({
      data: {
        ...w,
        status: 'published'
      }
    })
  }

  // 2. Lições Iniciais
  const lessons = [
    {
      title: 'Saudações Básicas',
      nivel: 'A1',
      durationMin: 5,
      xpReward: 10,
      orderIndex: 1,
      content: {
        vocabulary: [
          { kr: 'Bô dji bô', pt: 'Bom dia' },
          { kr: 'Bô fála bô', pt: 'Boa tarde' }
        ],
        quiz: [
          { 
            q: 'Como se diz "Bom dia" em Forro?', 
            options: ['Bô dji bô', 'Cuá muala', 'Êntchi be'], 
            correct: 0 
          }
        ]
      }
    },
    {
      title: 'Números e Quantia',
      nivel: 'A1',
      durationMin: 8,
      xpReward: 15,
      orderIndex: 2,
      content: {}
    }
  ]

  for (const l of lessons) {
    await prisma.lesson.create({
      data: l
    })
  }

  // 3. Badges Iniciais
  const badges = [
    { name: 'Pioneiro', icon: '🏆', description: 'Um dos primeiros 100 utilizadores da plataforma.' },
    { name: 'Guardião do Forro', icon: '🌿', description: 'Completou todas as lições de Forro A1.' },
    { name: 'Poliglota STP', icon: '🌍', description: 'Contribuiu com termos para todas as variantes.' }
  ]

  for (const b of badges) {
    await prisma.badge.upsert({
      where: { name: b.name },
      update: {},
      create: b
    })
  }

  console.log('✅ Base de dados semeada com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
