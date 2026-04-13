import express from 'express'
import bcrypt from 'bcryptjs'
import { userQueries, profileQueries, generateId } from '../db.js'
import { signToken } from '../middleware/auth.js'

const router = express.Router()

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  const existing = userQueries.findByEmail.get(email.toLowerCase())
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists' })
  }

  const id = generateId()
  const password_hash = await bcrypt.hash(password, 10)

  userQueries.insert.run(id, email.toLowerCase(), password_hash)
  profileQueries.insert.run(id)

  const token = signToken(id)
  res.json({ token, user: { id, email: email.toLowerCase() } })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const user = userQueries.findByEmail.get(email.toLowerCase())
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = signToken(user.id)
  res.json({ token, user: { id: user.id, email: user.email } })
})

// POST /api/auth/logout  (client just drops the token — this is a no-op)
router.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out' })
})

export default router
