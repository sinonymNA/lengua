import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import rateLimit from 'express-rate-limit'

import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import cityRoutes from './routes/cities.js'
import sessionRoutes from './routes/sessions.js'
import vocabRoutes from './routes/vocab.js'
import speechRoutes from './routes/speech.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json())
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
)

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
})
app.use('/api/', apiLimiter)

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'AI request limit reached, please wait a moment.' },
})
app.use('/api/session', aiLimiter)
app.use('/api/speech', aiLimiter)

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/cities', cityRoutes)
app.use('/api/session', sessionRoutes)
app.use('/api/vocab', vocabRoutes)
app.use('/api/speech', speechRoutes)

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
  })
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  })
})

app.listen(PORT, () => {
  console.log(`Lengua server running on port ${PORT}`)
})

export default app
