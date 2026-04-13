import { wordQueries, generateId } from '../db.js'
import { CONFIDENCE_RULES, STAGE_ORDER } from '../../shared/constants.js'
import { profileQueries } from '../db.js'
import { STAGES } from '../../shared/constants.js'

function getStatus(confidence) {
  if (confidence >= 80) return 'acquired'
  if (confidence >= 40) return 'frontier'
  return 'unknown'
}

export async function updateVocabAfterScene(userId, keyWords, behavior) {
  for (const word of keyWords) {
    if (!word || typeof word !== 'string') continue

    const wordLower = word.toLowerCase().trim()
    const existing = wordQueries.findByWord.get(userId, wordLower)

    let delta = CONFIDENCE_RULES.encounter
    if (behavior.correct && !behavior.freeSpeech) delta += CONFIDENCE_RULES.contextCorrect
    if (behavior.correct && behavior.freeSpeech)  delta += CONFIDENCE_RULES.freeSpeechCorrect
    if (!behavior.correct)  delta += CONFIDENCE_RULES.sceneMissed
    if (behavior.hesitation) delta += CONFIDENCE_RULES.hesitation

    if (existing) {
      const newConf = Math.min(100, Math.max(0, existing.confidence + delta))
      wordQueries.update.run(newConf, getStatus(newConf), existing.id)
    } else {
      const initConf = Math.max(0, 5 + delta)
      const id = generateId()
      wordQueries.insert.run(id, userId, wordLower, '', '', initConf, getStatus(initConf))
    }
  }
}

export function checkStageAdvance(userId) {
  const profile = profileQueries.findById.get(userId)
  if (!profile) return null

  const currentIndex = STAGE_ORDER.indexOf(profile.current_stage)
  if (currentIndex === STAGE_ORDER.length - 1) return null

  const threshold = STAGES[profile.current_stage].minConfidenceToAdvance
  if (!threshold) return null

  const acquired = wordQueries.findAcquired.all(userId)
  const totalConfidence = acquired.reduce((sum, w) => sum + w.confidence, 0)

  if (totalConfidence >= threshold) {
    const nextStage = STAGE_ORDER[currentIndex + 1]
    profileQueries.updateStage.run(nextStage, userId)
    return nextStage
  }

  return null
}
