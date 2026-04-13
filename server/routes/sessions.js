import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { createClient } from '@supabase/supabase-js'
import { generateScene, evaluateFreeResponse, generateOnboardingScene } from '../services/claude.js'
import { updateVocabAfterScene } from '../services/vocab.js'
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

function adminClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

async function loadEpisodeSkeleton(city, episode) {
  const citySlug = city.replace('-', '_')
  const filePath = path.join(
    __dirname,
    '../data/episodes',
    `${citySlug}_${episode}.json`
  )
  try {
    const content = await readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

// POST /api/session/start
router.post('/start', requireAuth, async (req, res) => {
  const { city, episode } = req.body
  if (!city || !episode) {
    return res.status(400).json({ error: 'city and episode are required' })
  }

  const db = adminClient()

  // Create session record
  const { data: session, error } = await db
    .from('sessions')
    .insert({
      user_id: req.user.id,
      city,
      episode,
      scene_index: 0,
      choices_made: [],
      words_encountered: [],
      completed: false,
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Update user profile
  await db
    .from('user_profiles')
    .update({
      current_city: city,
      current_episode: episode,
      total_sessions: db.rpc('increment', { row_id: req.user.id }),
    })
    .eq('id', req.user.id)

  res.json({ session_id: session.id })
})

// GET /api/session/:id/scene/:n
router.get('/:id/scene/:n', requireAuth, async (req, res) => {
  const db = adminClient()
  const sceneIndex = parseInt(req.params.n)

  // Load session
  const { data: session, error: sessionError } = await db
    .from('sessions')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single()

  if (sessionError || !session) {
    return res.status(404).json({ error: 'Session not found' })
  }

  // Load user profile for stage
  const { data: profile } = await db
    .from('user_profiles')
    .select('current_stage')
    .eq('id', req.user.id)
    .single()

  // Load user vocab
  const { data: words } = await db
    .from('words')
    .select('word, status, confidence')
    .eq('user_id', req.user.id)

  const vocab = {
    acquired: (words || []).filter((w) => w.status === 'acquired').map((w) => w.word),
    frontier: (words || []).filter((w) => w.status === 'frontier').map((w) => w.word),
  }

  // Load episode skeleton
  const skeleton = await loadEpisodeSkeleton(session.city, session.episode)
  if (!skeleton) {
    return res.status(404).json({ error: 'Episode skeleton not found' })
  }

  const previousScenes = (session.choices_made || [])
    .filter((c) => c.scene_summary)
    .map((c) => ({ summary: c.scene_summary }))

  try {
    const scene = await generateScene(
      skeleton,
      sceneIndex,
      profile?.current_stage || 'el_desconocido',
      vocab,
      previousScenes
    )

    // Update session scene_index
    await db
      .from('sessions')
      .update({ scene_index: sceneIndex })
      .eq('id', session.id)

    res.json(scene)
  } catch (err) {
    console.error('Scene generation error:', err)
    res.status(500).json({ error: 'Failed to generate scene. Please try again.' })
  }
})

// POST /api/session/:id/respond
router.post('/:id/respond', requireAuth, async (req, res) => {
  const db = adminClient()
  const { scene_index, choice_id, free_text, key_words, scene_summary, time_taken } =
    req.body

  // Load session
  const { data: session } = await db
    .from('sessions')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single()

  if (!session) return res.status(404).json({ error: 'Session not found' })

  // Load profile for stage
  const { data: profile } = await db
    .from('user_profiles')
    .select('current_stage')
    .eq('id', req.user.id)
    .single()

  let is_correct = false
  let feedback = null
  let confidence_delta = 0

  if (choice_id) {
    // Multiple choice — correctness determined by the scene data sent from client
    is_correct = req.body.is_correct || false
    confidence_delta = is_correct ? 10 : -5
  } else if (free_text) {
    // Free speech — evaluate with Claude
    try {
      const evaluation = await evaluateFreeResponse(
        req.body.character_dialogue,
        free_text,
        key_words || [],
        profile?.current_stage || 'el_residente'
      )
      is_correct = evaluation.understood
      confidence_delta = evaluation.confidence_delta
      feedback = evaluation.feedback
    } catch (err) {
      console.error('Evaluation error:', err)
      is_correct = true
      confidence_delta = 5
      feedback = 'Could not evaluate response — counting as understood.'
    }
  }

  // Record choice
  const choices_made = [
    ...(session.choices_made || []),
    {
      scene: scene_index,
      choice: choice_id || free_text,
      correct: is_correct,
      time_taken: time_taken || 0,
      scene_summary: scene_summary || '',
    },
  ]

  // Update session
  await db
    .from('sessions')
    .update({ choices_made })
    .eq('id', session.id)

  // Update vocab
  if (key_words?.length) {
    await updateVocabAfterScene(req.user.id, key_words, {
      correct: is_correct,
      hesitation: time_taken > 4000,
      freeSpeech: !!free_text,
    })
  }

  // Check for words_encountered update
  const words_encountered = [
    ...(session.words_encountered || []),
    ...(key_words || []),
  ]
  const unique_words = [...new Set(words_encountered)]
  await db.from('sessions').update({ words_encountered: unique_words }).eq('id', session.id)

  res.json({ is_correct, feedback, confidence_delta })
})

// POST /api/session/:id/complete
router.post('/:id/complete', requireAuth, async (req, res) => {
  const db = adminClient()

  const { data: session } = await db
    .from('sessions')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single()

  if (!session) return res.status(404).json({ error: 'Session not found' })

  await db
    .from('sessions')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', session.id)

  // Get updated vocab stats
  const { data: words } = await db
    .from('words')
    .select('word, translation, confidence, status')
    .eq('user_id', req.user.id)
    .in('word', session.words_encountered || [])

  // Check if user should advance stage
  const { data: allWords } = await db
    .from('words')
    .select('confidence, status')
    .eq('user_id', req.user.id)

  const { data: profile } = await db
    .from('user_profiles')
    .select('current_stage, current_city, current_episode')
    .eq('id', req.user.id)
    .single()

  const acquiredWords = (allWords || []).filter((w) => w.status === 'acquired')
  const totalConfidence = acquiredWords.reduce((sum, w) => sum + w.confidence, 0)

  // Update user episode progress
  const nextEpisode = Math.max(session.episode + 1, profile?.current_episode || 1)
  await db
    .from('user_profiles')
    .update({ current_episode: nextEpisode })
    .eq('id', req.user.id)

  res.json({
    completed: true,
    wordsEncountered: words || [],
    totalConfidence,
    nextEpisode,
  })
})

// POST /api/session/onboarding/scene/:n — onboarding tutorial scenes
router.post('/onboarding/scene/:n', requireAuth, async (req, res) => {
  const sceneIndex = parseInt(req.params.n)
  const { previousResponses } = req.body || {}

  try {
    const scene = await generateOnboardingScene(sceneIndex, previousResponses || [])
    res.json(scene)
  } catch (err) {
    console.error('Onboarding scene error:', err)
    res.status(500).json({ error: 'Failed to generate onboarding scene.' })
  }
})

export default router
