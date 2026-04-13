import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { generateScene, evaluateFreeResponse, generateOnboardingScene } from '../services/claude.js'
import { updateVocabAfterScene } from '../services/vocab.js'
import { profileQueries, sessionQueries, wordQueries, generateId } from '../db.js'
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function loadEpisodeSkeleton(city, episode) {
  const citySlug = city.replace(/-/g, '_')
  const filePath = path.join(__dirname, '../data/episodes', `${citySlug}_${episode}.json`)
  try {
    return JSON.parse(await readFile(filePath, 'utf-8'))
  } catch {
    return null
  }
}

// POST /api/session/start
router.post('/start', requireAuth, (req, res) => {
  const { city, episode } = req.body
  if (!city || !episode) return res.status(400).json({ error: 'city and episode are required' })

  const id = generateId()
  sessionQueries.insert.run(id, req.user.id, city, episode)
  profileQueries.incrementSessions.run(req.user.id)
  profileQueries.updateCity.run(city, episode, req.user.id)

  res.json({ session_id: id })
})

// GET /api/session/:id/scene/:n
router.get('/:id/scene/:n', requireAuth, async (req, res) => {
  const session = sessionQueries.findById.get(req.params.id, req.user.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })

  const sceneIndex = parseInt(req.params.n)
  const profile = profileQueries.findById.get(req.user.id)
  const allWords = wordQueries.findAll.all(req.user.id)

  const vocab = {
    acquired: allWords.filter((w) => w.status === 'acquired').map((w) => w.word),
    frontier: allWords.filter((w) => w.status === 'frontier').map((w) => w.word),
  }

  const skeleton = await loadEpisodeSkeleton(session.city, session.episode)
  if (!skeleton) return res.status(404).json({ error: 'Episode skeleton not found' })

  const choicesMade = JSON.parse(session.choices_made || '[]')
  const previousScenes = choicesMade
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
    sessionQueries.updateScene.run(sceneIndex, session.id)
    res.json(scene)
  } catch (err) {
    console.error('Scene generation error:', err)
    res.status(500).json({ error: 'Failed to generate scene. Please try again.' })
  }
})

// POST /api/session/:id/respond
router.post('/:id/respond', requireAuth, async (req, res) => {
  const session = sessionQueries.findById.get(req.params.id, req.user.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })

  const { scene_index, choice_id, free_text, key_words, scene_summary, time_taken } = req.body
  const profile = profileQueries.findById.get(req.user.id)

  let is_correct = false
  let feedback = null
  let confidence_delta = 0

  if (choice_id) {
    is_correct = req.body.is_correct || false
    confidence_delta = is_correct ? 10 : -5
  } else if (free_text) {
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
    } catch {
      is_correct = true
      confidence_delta = 5
      feedback = 'Could not evaluate — counting as understood.'
    }
  }

  // Append to choices_made
  const choicesMade = JSON.parse(session.choices_made || '[]')
  choicesMade.push({
    scene: scene_index,
    choice: choice_id || free_text,
    correct: is_correct,
    time_taken: time_taken || 0,
    scene_summary: scene_summary || '',
  })

  // Merge words_encountered (deduplicated)
  const wordsEncountered = JSON.parse(session.words_encountered || '[]')
  const newWords = [...new Set([...wordsEncountered, ...(key_words || [])])]

  sessionQueries.updateChoices.run(
    JSON.stringify(choicesMade),
    JSON.stringify(newWords),
    session.id
  )

  // Update vocab confidence
  if (key_words?.length) {
    await updateVocabAfterScene(req.user.id, key_words, {
      correct: is_correct,
      hesitation: (time_taken || 0) > 4000,
      freeSpeech: !!free_text,
    })
  }

  res.json({ is_correct, feedback, confidence_delta })
})

// POST /api/session/:id/complete
router.post('/:id/complete', requireAuth, async (req, res) => {
  const session = sessionQueries.findById.get(req.params.id, req.user.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })

  sessionQueries.complete.run(session.id)

  const wordsEncountered = JSON.parse(session.words_encountered || '[]')
  const allWords = wordQueries.findAll.all(req.user.id)
  const sessionWords = allWords.filter((w) => wordsEncountered.includes(w.word))
  const acquiredWords = allWords.filter((w) => w.status === 'acquired')
  const totalConfidence = acquiredWords.reduce((sum, w) => sum + w.confidence, 0)

  const profile = profileQueries.findById.get(req.user.id)
  const nextEpisode = Math.max(session.episode + 1, profile?.current_episode || 1)
  profileQueries.updateEpisode.run(nextEpisode, req.user.id)

  res.json({
    completed: true,
    wordsEncountered: sessionWords,
    totalConfidence,
    nextEpisode,
  })
})

// POST /api/session/onboarding/scene/:n
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
