import { createClient } from '@supabase/supabase-js'
import { CONFIDENCE_RULES, STAGE_ORDER } from '../../shared/constants.js'

function adminClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

function getStatus(confidence) {
  if (confidence >= 80) return 'acquired'
  if (confidence >= 40) return 'frontier'
  return 'unknown'
}

export async function updateVocabAfterScene(userId, keyWords, behavior) {
  const db = adminClient()

  for (const word of keyWords) {
    if (!word || typeof word !== 'string') continue

    const wordLower = word.toLowerCase().trim()

    const { data: existing } = await db
      .from('words')
      .select('*')
      .eq('user_id', userId)
      .eq('word', wordLower)
      .single()

    let delta = CONFIDENCE_RULES.encounter

    if (behavior.correct && !behavior.freeSpeech) delta += CONFIDENCE_RULES.contextCorrect
    if (behavior.correct && behavior.freeSpeech) delta += CONFIDENCE_RULES.freeSpeechCorrect
    if (!behavior.correct) delta += CONFIDENCE_RULES.sceneMissed
    if (behavior.hesitation) delta += CONFIDENCE_RULES.hesitation

    if (existing) {
      const newConfidence = Math.min(100, Math.max(0, existing.confidence + delta))
      await db
        .from('words')
        .update({
          confidence: newConfidence,
          encounters: existing.encounters + 1,
          last_seen: new Date().toISOString(),
          status: getStatus(newConfidence),
        })
        .eq('id', existing.id)
    } else {
      const initialConfidence = Math.max(0, 5 + delta)
      await db.from('words').insert({
        user_id: userId,
        word: wordLower,
        translation: '',
        confidence: initialConfidence,
        encounters: 1,
        last_seen: new Date().toISOString(),
        status: getStatus(initialConfidence),
      })
    }
  }
}

export async function checkStageAdvance(userId) {
  const db = adminClient()

  const { data: profile } = await db
    .from('user_profiles')
    .select('current_stage')
    .eq('id', userId)
    .single()

  if (!profile) return null

  const currentStageIndex = STAGE_ORDER.indexOf(profile.current_stage)
  if (currentStageIndex === STAGE_ORDER.length - 1) return null

  const nextStage = STAGE_ORDER[currentStageIndex + 1]
  const { STAGES } = await import('../../shared/constants.js')
  const threshold = STAGES[profile.current_stage].minConfidenceToAdvance

  if (!threshold) return null

  const { data: acquiredWords } = await db
    .from('words')
    .select('confidence')
    .eq('user_id', userId)
    .eq('status', 'acquired')

  const totalConfidence = (acquiredWords || []).reduce((sum, w) => sum + w.confidence, 0)

  if (totalConfidence >= threshold) {
    await db
      .from('user_profiles')
      .update({ current_stage: nextStage })
      .eq('id', userId)

    return nextStage
  }

  return null
}
