import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

function adminClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

// GET /api/vocab — user's full vocab graph
router.get('/', requireAuth, async (req, res) => {
  const { city } = req.query
  let query = adminClient()
    .from('words')
    .select('*')
    .eq('user_id', req.user.id)
    .order('last_seen', { ascending: false })

  if (city) {
    query = query.eq('city', city)
  }

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })

  res.json(data || [])
})

// POST /api/vocab/encounter — log word encounter
router.post('/encounter', requireAuth, async (req, res) => {
  const { word, translation, city } = req.body
  if (!word) return res.status(400).json({ error: 'word is required' })

  const db = adminClient()

  // Check if word exists
  const { data: existing } = await db
    .from('words')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('word', word.toLowerCase())
    .single()

  if (existing) {
    const newConfidence = Math.min(100, existing.confidence + 5)
    const newStatus =
      newConfidence >= 80
        ? 'acquired'
        : newConfidence >= 40
        ? 'frontier'
        : 'unknown'

    const { data, error } = await db
      .from('words')
      .update({
        confidence: newConfidence,
        encounters: existing.encounters + 1,
        last_seen: new Date().toISOString(),
        status: newStatus,
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  // Insert new word
  const { data, error } = await db
    .from('words')
    .insert({
      user_id: req.user.id,
      word: word.toLowerCase(),
      translation: translation || '',
      city: city || '',
      confidence: 5,
      encounters: 1,
      last_seen: new Date().toISOString(),
      status: 'unknown',
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

export default router
