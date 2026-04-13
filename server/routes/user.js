import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { createClient } from '@supabase/supabase-js'
import { STAGES, STAGE_ORDER } from '../../shared/constants.js'

const router = express.Router()

function adminClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

// GET /api/user/profile
router.get('/profile', requireAuth, async (req, res) => {
  const { data, error } = await adminClient()
    .from('user_profiles')
    .select('*')
    .eq('id', req.user.id)
    .single()

  if (error) return res.status(404).json({ error: 'Profile not found' })
  res.json(data)
})

// GET /api/user/progress
router.get('/progress', requireAuth, async (req, res) => {
  const db = adminClient()

  const [profileResult, vocabResult, sessionsResult] = await Promise.all([
    db.from('user_profiles').select('*').eq('id', req.user.id).single(),
    db.from('words').select('*').eq('user_id', req.user.id),
    db
      .from('sessions')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('completed', true)
      .order('completed_at', { ascending: false })
      .limit(10),
  ])

  const vocab = vocabResult.data || []
  const acquired = vocab.filter((w) => w.status === 'acquired')
  const frontier = vocab.filter((w) => w.status === 'frontier')
  const unknown = vocab.filter((w) => w.status === 'unknown')
  const totalConfidence = acquired.reduce((sum, w) => sum + w.confidence, 0)

  res.json({
    profile: profileResult.data,
    vocab: {
      acquired: acquired.length,
      frontier: frontier.length,
      unknown: unknown.length,
      total: vocab.length,
      totalConfidence,
    },
    recentSessions: sessionsResult.data || [],
  })
})

// PUT /api/user/stage
router.put('/stage', requireAuth, async (req, res) => {
  const { stage } = req.body
  if (!STAGES[stage]) {
    return res.status(400).json({ error: 'Invalid stage' })
  }

  const { data, error } = await adminClient()
    .from('user_profiles')
    .update({ current_stage: stage })
    .eq('id', req.user.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// PUT /api/user/profile
router.put('/profile', requireAuth, async (req, res) => {
  const { current_city, current_episode } = req.body
  const updates = {}
  if (current_city) updates.current_city = current_city
  if (current_episode) updates.current_episode = current_episode

  const { data, error } = await adminClient()
    .from('user_profiles')
    .update(updates)
    .eq('id', req.user.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

export default router
