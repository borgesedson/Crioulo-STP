import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import staticFiles from '@fastify/static'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync, createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import bcrypt from 'bcrypt'
import 'dotenv/config'

// Rotas
import authRoutes from './routes/auth.js'



const __dirname = dirname(fileURLToPath(import.meta.url))
const prisma = new PrismaClient()
const app = Fastify({ 
  logger: {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true }
    }
  } 
})

//── DECORATORS ──────────────────────────────────────────────
app.decorate('prisma', prisma)

app.decorate('authenticate', async (req, reply) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) throw new Error('No token provided')
    
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kriolu-secret-key-2024')
    req.user = decoded
  } catch (err) {
    reply.code(401).send({ error: 'Sessão inválida ou expirada. Faça login novamente.' })
  }
})

app.decorate('adminOnly', async (req, reply) => {
  await app.authenticate(req, reply)
  if (req.user && req.user.role !== 'ADMIN') {
    reply.code(403).send({ error: 'Acesso restrito a administradores.' })
  }
})

//── MIDDLEWARES ─────────────────────────────────────────────
await app.register(cors, { origin: '*' })
await app.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 } })
await app.register(staticFiles, {
  root: join(__dirname, '..', 'public'),
  prefix: '/public/'
})

//── REGISTO DE ROTAS ────────────────────────────────────────
app.register(authRoutes, { prefix: '/api/auth' })

// ── DICIONÁRIO ─────────────────────────────────────────────
app.get('/api/dicionario', async (req, reply) => {
  const { q = '', variante, categoria, page = 1, limit = 20 } = req.query
  const skip = (Number(page) - 1) * Number(limit)

  const where = {
    status: { in: ['active', 'published'] },
    ...(q && {
      OR: [
        { word: { contains: q, mode: 'insensitive' } },
        { translationPt: { contains: q, mode: 'insensitive' } }
      ]
    }),
    ...(variante && variante !== 'Todas' && { variant: variante }),
    ...(categoria && categoria !== 'Todas' && { category: categoria })
  }

  try {
    const [words, total] = await Promise.all([
      prisma.dictionary.findMany({ 
        where, 
        skip, 
        take: Number(limit), 
        include: { _count: { select: { votes: true } } },
        orderBy: { word: 'asc' } 
      }),
      prisma.dictionary.count({ where })
    ])

    return { 
      words, 
      total, 
      page: Number(page), 
      pages: Math.ceil(total / Number(limit)) 
    }
  } catch (error) {
    app.log.error(error)
    return reply.code(500).send({ error: 'Erro ao procurar no dicionário' })
  }
})

// ── CONTRIBUIÇÕES ────────────────────────────────────────────
app.post('/api/contribuicoes', async (req, reply) => {
  // Tentativa de autenticação opcional
  let userId = null
  try {
    const authHeader = req.headers.authorization
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kriolu-secret-key-2024')
      userId = decoded.id
    }
  } catch (e) {}

  try {
    const parts = req.parts()
    const fields = {}
    let audioUrl = null

    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'audio') {
        const uploadsDir = join(__dirname, '..', 'public', 'uploads')
        if (!existsSync(uploadsDir)) await mkdir(uploadsDir, { recursive: true })
        
        const ext = part.filename.split('.').pop()
        const filename = `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
        const filepath = join(uploadsDir, filename)
        
        // Use streams for better performance
        await pipeline(part.file, createWriteStream(filepath))
        audioUrl = `/public/uploads/${filename}`
      } else if (part.type === 'field') {
        fields[part.fieldname] = part.value
      }
    }

    // Validação de Campos Obrigatórios
    if (!fields.category || !fields.culturalNotes) {
      return reply.code(400).send({ error: 'Categoria e Notas Culturais são obrigatórias.' })
    }

    const contribution = await prisma.contribution.create({
      data: {
        userId,
        contributorName: fields.contributorName || null,
        contributorEmail: fields.contributorEmail || null,
        contributorCountry: fields.contributorCountry || null,
        variant: fields.variant,
        tipo: fields.tipo,
        wordKriolu: fields.word || fields.wordKriolu, // Suporte a 'word' vindo do form
        category: fields.category,
        translationPt: fields.translation || fields.translationPt, // Suporte a 'translation' vindo do form
        exampleKriolu: fields.example || fields.exampleKriolu,
        examplePt: fields.exampleTranslation || fields.examplePt,
        culturalNotes: fields.culturalNotes,
        phonetic: fields.phonetic || null,
        audioUrl
      }
    })

    // Atribuir XP se logado
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { xpTotal: { increment: 5 } }
      })
    }

    return reply.code(201).send({ success: true, id: contribution.id })
  } catch (error) {
    app.log.error(error)
    return reply.code(500).send({ error: 'Erro ao submeter contribuição' })
  }
})

// ── MINHAS CONTRIBUIÇÕES (UTILIZADOR LOGADO) ────────────────
app.get('/api/user/contribuicoes', async (req, reply) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return reply.code(401).send({ error: 'Não autorizado' })

  try {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kriolu-secret-key-2024')
    
    const minhasContribuicoes = await prisma.contribution.findMany({
      where: { userId: decoded.id },
      orderBy: { createdAt: 'desc' }
    })

    return { contribuicoes: minhasContribuicoes }
  } catch (error) {
    app.log.error(error)
    return reply.code(401).send({ error: 'Sessão inválida ou expirada' })
  }
})

// ── PERFIL E DEFINIÇÕES (UTILIZADOR LOGADO) ────────────────
app.get('/api/user/perfil', { preHandler: [app.authenticate] }, async (req, reply) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        contributions: { orderBy: { createdAt: 'desc' } },
        votes: {
          where: { value: 1, dictionaryId: { not: null } },
          include: { dictionary: true }
        }
      }
    })

    if (!user) return reply.code(404).send({ error: 'Utilizador não encontrado' })

    // Remover informações sensíveis
    const { password, recoveryKey, ...safeUser } = user

    return { 
      user: safeUser,
      favorites: user.votes.map(v => v.dictionary),
      contributions: user.contributions
    }
  } catch (error) {
    app.log.error(error)
    return reply.code(500).send({ error: 'Erro ao carregar perfil do utilizador' })
  }
})

// ── FAVORITOS (TOGGLE) ──────────────────────────────────────
app.post('/api/user/favorito', { preHandler: [app.authenticate] }, async (req, reply) => {
  const { dictionaryId } = req.body
  const userId = req.user.id

  try {
    const existing = await prisma.vote.findUnique({
      where: {
        userId_dictionaryId: {
          userId,
          dictionaryId
        }
      }
    })

    if (existing) {
      await prisma.vote.delete({
        where: { id: existing.id }
      })
      return { favorited: false }
    } else {
      await prisma.vote.create({
        data: {
          userId,
          dictionaryId,
          value: 1
        }
      })
      return { favorited: true }
    }
  } catch (error) {
    app.log.error(error)
    return reply.code(500).send({ error: 'Erro ao atualizar favorito' })
  }
})

app.put('/api/user/settings', { preHandler: [app.authenticate] }, async (req, reply) => {
  const { name, password } = req.body
  try {
    const data = {}
    if (name) data.name = name
    if (password) {
      data.password = await bcrypt.hash(password, 10)
    }

    if (Object.keys(data).length > 0) {
      await prisma.user.update({
        where: { id: req.user.id },
        data
      })
    }
    return { success: true }
  } catch (error) {
    app.log.error(error)
    return reply.code(500).send({ error: 'Erro ao atualizar definições' })
  }
})

app.get('/api/licoes', async (req, reply) => {
  try {
    const { nivel = 'A1' } = req.query
    const lessons = await prisma.lesson.findMany({
      where: { nivel },
      orderBy: { orderIndex: 'asc' }
    })
    return { lessons }
  } catch (error) {
    app.log.error(error)
    return reply.code(500).send({ error: 'Erro ao carregar lições' })
  }
})

// ── ADMIN ───────────────────────────────────────────────────
app.get('/api/admin/stats', { preHandler: [app.adminOnly] }, async (req, reply) => {
  try {
    const [totalWords, pendingTerms, totalUsers] = await Promise.all([
      prisma.dictionary.count(),
      prisma.contribution.count({ where: { status: 'pending' } }),
      prisma.user.count()
    ])
    return { totalWords, pendingTerms, totalUsers }
  } catch (error) {
    return reply.code(500).send({ error: 'Erro ao carregar estatísticas' })
  }
})

app.get('/api/admin/contribuicoes', { preHandler: [app.adminOnly] }, async (req, reply) => {
  try {
    const pending = await prisma.contribution.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    })
    return { pending }
  } catch (error) {
    return reply.code(500).send({ error: 'Erro ao carregar administração' })
  }
})

//── NOVO: DASHBOARD DE CONTRIBUIDORES ───────────────────────
app.get('/api/admin/dashboard', { preHandler: [app.adminOnly] }, async (req, reply) => {
  try {
    // Buscar utilizadores e as suas contribuições aprovadas
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        contributions: {
          where: { status: 'approved' },
          select: { id: true }
        }
      }
    })

    // Processar ranking em memória (mais preciso para filtros específicos no Prisma)
    const topContributors = users
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        approvedCount: u.contributions.length
      }))
      .filter(u => u.approvedCount > 0)
      .sort((a, b) => b.approvedCount - a.approvedCount)
      .slice(0, 5)

    // Distribuição por variante (apenas do dicionário ativo)
    const statsByVariant = await prisma.dictionary.groupBy({
      by: ['variant'],
      _count: { _all: true }
    })

    return { topContributors, statsByVariant }
  } catch (error) {
    app.log.error(error)
    return reply.code(500).send({ error: 'Erro ao carregar dashboard' })
  }
})

//── NOVO: GESTÃO DE UTILIZADORES ────────────────────────────
app.get('/api/admin/users', { preHandler: [app.adminOnly] }, async (req, reply) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { contributions: true } }
      }
    })
    return { users }
  } catch (error) {
    return reply.code(500).send({ error: 'Erro ao carregar utilizadores' })
  }
})

app.patch('/api/admin/users/:id/role', { preHandler: [app.adminOnly] }, async (req, reply) => {
  const { id } = req.params
  const { role } = req.body

  if (!['USER', 'ADMIN'].includes(role)) {
    return reply.code(400).send({ error: 'Role inválido' })
  }

  try {
    await prisma.user.update({
      where: { id },
      data: { role }
    })
    return { success: true }
  } catch (error) {
    return reply.code(500).send({ error: 'Erro ao atualizar cargo' })
  }
})

app.post('/api/admin/decisao', { preHandler: [app.adminOnly] }, async (req, reply) => {
  const { id, decisao, editedData } = req.body 

  try {
    const contribution = await prisma.contribution.findUnique({ where: { id } })
    if (!contribution) return reply.code(404).send({ error: 'Contribuição não encontrada' })

    if (decisao === 'approve') {
      const word = editedData?.word || contribution.wordKriolu
      const variant = editedData?.variant || contribution.variant

      // 1. Verificar se o termo já existe para deduplicação / enriquecimento
      const existing = await prisma.dictionary.findFirst({
        where: { word, variant }
      })

      if (existing) {
        // Enriquecer (Merge): Preencher o que está vazio
        await prisma.dictionary.update({
          where: { id: existing.id },
          data: {
            phonetic: existing.phonetic || editedData?.phonetic || contribution.phonetic,
            category: existing.category || editedData?.category || contribution.category,
            translationPt: existing.translationPt || editedData?.translationPt || contribution.translationPt,
            exampleKriolu: existing.exampleKriolu || editedData?.exampleKriolu || contribution.exampleKriolu,
            examplePt: existing.examplePt || editedData?.examplePt || contribution.examplePt,
            culturalNotes: existing.culturalNotes || editedData?.culturalNotes || contribution.culturalNotes, // Adicionado Cultural Notes
            audioUrl: existing.audioUrl || contribution.audioUrl,
            status: 'active' // Garantir que termo enriquecido fica visível
          }
        })
        app.log.info({ dictionaryId: existing.id }, 'Termo enriquecido no dicionário')
      } else {
        // Criar novo registro
        const entry = await prisma.dictionary.create({
          data: {
            word,
            phonetic: editedData?.phonetic || contribution.phonetic,
            category: editedData?.category || contribution.category,
            variant,
            translationPt: editedData?.translationPt || contribution.translationPt,
            exampleKriolu: editedData?.exampleKriolu || contribution.exampleKriolu,
            examplePt: editedData?.examplePt || contribution.examplePt,
            culturalNotes: editedData?.culturalNotes || contribution.culturalNotes, // Adicionado Cultural Notes
            audioUrl: contribution.audioUrl,
            status: 'active'
          }
        })
        app.log.info({ dictionaryId: entry.id }, 'Novo termo criado no dicionário')
      }

      // Atualizar status da contribuição independente se criou ou atualizou o dicionário
      await prisma.contribution.update({
        where: { id },
        data: { status: 'approved' }
      })
    } else if (decisao === 'reject') {
      await prisma.contribution.update({
        where: { id },
        data: { status: 'rejected' }
      })
    }

    return { success: true }
  } catch (error) {
    app.log.error(error)
    return reply.code(500).send({ error: 'Erro ao processar decisão' })
  }
})


// ── SERVE HTML EXPLÍCITOS (Fallback) ────────────────────────
app.get('/admin.html', async (req, reply) => {
  return reply.sendFile('admin.html', join(__dirname, '..'))
})

app.get('/perfil.html', async (req, reply) => {
  return reply.sendFile('perfil.html', join(__dirname, '..'))
})

app.get('/*', async (req, reply) => {
  return reply.sendFile('index.html', join(__dirname, '..'))
})

const start = async () => {
  try {
    const port = process.env.PORT || 3000
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`🇸🇹 Kriolu STP ativo em: http://localhost:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}
start()
