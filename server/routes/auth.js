import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

export default async function authRoutes(fastify, options) {
  const prisma = fastify.prisma

  // ── REGISTO ───────────────────────────────────────────────
  fastify.post('/register', async (req, reply) => {
    const { email, password, name, country, inviteCode, securityAnswer } = req.body

    // Validação de convite (Anti-Spam)
    if (inviteCode !== 'CRIOULO2024' && inviteCode !== 'STP-PRESERVA') {
      return reply.code(403).send({ error: 'Código de convite inválido.' })
    }

    const userExists = await prisma.user.findUnique({ where: { email } })
    if (userExists) return reply.code(400).send({ error: 'Este email já está registado.' })

    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Geração de Chave de Recuperação (Amulet)
    const rawRecoveryKey = uuidv4().split('-')[0].toUpperCase() // Ex: 7H9X42
    const hashedRecoveryKey = await bcrypt.hash(rawRecoveryKey, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        country,
        recoveryKey: hashedRecoveryKey,
        role: 'USER'
      }
    })

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'kriolu-secret-key-2024')

    return { 
      success: true, 
      token, 
      user: { name: user.name, xp: user.xpTotal, role: user.role },
      recoveryKey: rawRecoveryKey // Mostrado apenas uma vez no registo
    }
  })

  // ── LOGIN ──────────────────────────────────────────────────
  fastify.post('/login', async (req, reply) => {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return reply.code(401).send({ error: 'Credenciais inválidas.' })

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) return reply.code(401).send({ error: 'Credenciais inválidas.' })

    // Lógica de Streak (Simplificada)
    let newStreak = user.streakAtual
    const lastActivity = user.lastActivityAt ? new Date(user.lastActivityAt) : null
    const today = new Date()
    
    if (lastActivity) {
      const diffDays = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) newStreak += 1
      else if (diffDays > 1) newStreak = 1
    } else {
      newStreak = 1
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastActivityAt: today,
        streakAtual: newStreak 
      }
    })

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'kriolu-secret-key-2024')

    return { 
      success: true, 
      token, 
      user: { name: user.name, xp: user.xpTotal, role: user.role, streak: newStreak } 
    }
  })

  // ── RECUPERAÇÃO DE CONTA (VIA RECOVERY KEY) ───────────────
  fastify.post('/recover', async (req, reply) => {
    const { email, recoveryKey, newPassword } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.recoveryKey) return reply.code(404).send({ error: 'Utilizador não encontrado.' })

    const isKeyValid = await bcrypt.compare(recoveryKey.toUpperCase(), user.recoveryKey)
    if (!isKeyValid) return reply.code(401).send({ error: 'Chave de recuperação inválida.' })

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword }
    })

    return { success: true, message: 'Password atualizada com sucesso.' }
  })
}
