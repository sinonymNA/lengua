import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { wordQueries, generateId } from '../db.js'

const router = express.Router()

function getStatus(confidence) {
  if (confidence >= 80) return 'acquired'
  if (confidence >= 40) return 'frontier'
  return 'unknown'
}

// GET /api/vocab
router.get('/', requireAuth, (req, res) => {
  const { city } = req.query
  const words = city
    ? wordQueries.findByCity.all(req.user.id, city)
    : wordQueries.findAll.all(req.user.id)
  res.json(words)
})

// POST /api/vocab/encounter
router.post('/encounter', requireAuth, (req, res) => {
  const { word, translation, city } = req.body
  if (!word) return res.status(400).json({ error: 'word is required' })

  const wordLower = word.toLowerCase().trim()
  const existing = wordQueries.findByWord.get(req.user.id, wordLower)

  if (existing) {
    const newConf = Math.min(100, existing.confidence + 5)
    wordQueries.update.run(newConf, getStatus(newConf), existing.id)
    return res.json(wordQueries.findByWord.get(req.user.id, wordLower))
  }

  const id = generateId()
  wordQueries.insert.run(id, req.user.id, wordLower, translation || '', city || '', 5, getStatus(5))
  res.json(wordQueries.findByWord.get(req.user.id, wordLower))
})

export default router
