import jwt from 'jsonwebtoken'
import { userQueries } from '../db.js'

function jwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is not set')
  return secret
}

export function signToken(userId) {
  return jwt.sign({ sub: userId }, jwtSecret(), { expiresIn: '30d' })
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, jwtSecret())
    const user = userQueries.findById.get(payload.sub)
    if (!user) return res.status(401).json({ error: 'User not found' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
