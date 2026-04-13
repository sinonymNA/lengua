import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { profileQueries, wordQueries, sessionQueries } from '../db.js'
import { STAGES } from '../../shared/constants.js'

const router = express.Router()

// GET /api/user/profile
router.get('/profile', requireAuth, (req, res) => {
  const profile = profileQueries.findById.get(req.user.id)
  if (!profile) return res.status(404).json({ error: 'Profile not found' })
  res.json({ ...profile, email: req.user.email })
})

// GET /api/user/progress
router.get('/progress', requireAuth, (req, res) => {
  const profile = profileQueries.findById.get(req.user.id)
  const vocab = wordQueries.findAll.all(req.user.id)
  const sessions = sessionQueries.findRecentCompleted.all(req.user.id)

  const acquired = vocab.filter((w) => w.status === 'acquired')
  const frontier = vocab.filter((w) => w.status === 'frontier')
  const unknown  = vocab.filter((w) => w.status === 'unknown')
  const totalConfidence = acquired.reduce((sum, w) => sum + w.confidence, 0)

  res.json({
    profile: { ...profile, email: req.user.email },
    vocab: {
      acquired: acquired.length,
      frontier: frontier.length,
      unknown:  unknown.length,
      total: vocab.length,
      totalConfidence,
    },
    recentSessions: sessions,
  })
})

// PUT /api/user/stage
router.put('/stage', requireAuth, (req, res) => {
  const { stage } = req.body
  if (!STAGES[stage]) return res.status(400).json({ error: 'Invalid stage' })
  profileQueries.updateStage.run(stage, req.user.id)
  const profile = profileQueries.findById.get(req.user.id)
  res.json(profile)
})

// PUT /api/user/profile
router.put('/profile', requireAuth, (req, res) => {
  const { current_city, current_episode } = req.body
  const profile = profileQueries.findById.get(req.user.id)
  profileQueries.updateCity.run(
    current_city  ?? profile.current_city,
    current_episode ?? profile.current_episode,
    req.user.id
  )
  res.json(profileQueries.findById.get(req.user.id))
})

export default router
