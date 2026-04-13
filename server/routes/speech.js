import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { generateSpeech } from '../services/elevenlabs.js'
import { evaluateFreeResponse } from '../services/claude.js'

const router = express.Router()

// POST /api/speech/generate
router.post('/generate', requireAuth, async (req, res) => {
  const { text, voiceId, speed } = req.body
  if (!text || !voiceId) {
    return res.status(400).json({ error: 'text and voiceId are required' })
  }

  try {
    const audioBuffer = await generateSpeech(text, voiceId, speed || 1.0)
    res.set('Content-Type', 'audio/mpeg')
    res.send(audioBuffer)
  } catch (err) {
    console.error('Speech generation error:', err)
    // Return error so client can fall back to browser TTS
    res.status(503).json({ error: 'Speech service unavailable', fallback: true })
  }
})

// POST /api/speech/evaluate
router.post('/evaluate', requireAuth, async (req, res) => {
  const { characterDialogue, userTranscript, keyWords, stage } = req.body
  if (!characterDialogue || !userTranscript) {
    return res.status(400).json({ error: 'characterDialogue and userTranscript are required' })
  }

  try {
    const result = await evaluateFreeResponse(
      characterDialogue,
      userTranscript,
      keyWords || [],
      stage || 'el_residente'
    )
    res.json(result)
  } catch (err) {
    console.error('Evaluation error:', err)
    res.status(500).json({ error: 'Evaluation failed' })
  }
})

export default router
