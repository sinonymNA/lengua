import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useUser } from '../context/UserContext.jsx'
import { SessionProvider, useSession } from '../context/SessionContext.jsx'
import { STAGES, CITY_IMAGES, CITY_NAMES } from '../utils/constants.js'
import NarrationBlock from '../components/play/NarrationBlock.jsx'
import CharacterDialogue from '../components/play/CharacterDialogue.jsx'
import ChoiceButtons from '../components/play/ChoiceButtons.jsx'
import FreeSpeechInput from '../components/play/FreeSpeechInput.jsx'
import FeedbackPanel from '../components/play/FeedbackPanel.jsx'
import VocabFlash from '../components/play/VocabFlash.jsx'
import EpisodeComplete from '../components/play/EpisodeComplete.jsx'
import LoadingScreen from '../components/ui/LoadingScreen.jsx'
import ErrorMessage from '../components/ui/ErrorMessage.jsx'

export default function PlayPage() {
  return (
    <SessionProvider>
      <PlayPageInner />
    </SessionProvider>
  )
}

// Scene phases
const PHASE = {
  LOADING: 'loading',
  NARRATION: 'narration',
  DIALOGUE: 'dialogue',
  RESPONSE: 'response',
  FEEDBACK: 'feedback',
  VOCAB_FLASH: 'vocab_flash',
  COMPLETE: 'complete',
}

function PlayPageInner() {
  const { citySlug, episodeNumber } = useParams()
  const { profile, authHeader } = useUser()
  const { startSession, loadScene, respond, completeSession } = useSession()
  const navigate = useNavigate()

  const [phase, setPhase] = useState(PHASE.LOADING)
  const [sessionId, setSessionId] = useState(null)
  const [scene, setScene] = useState(null)
  const [sceneIndex, setSceneIndex] = useState(0)
  const [totalScenes, setTotalScenes] = useState(6)
  const [feedback, setFeedback] = useState(null)
  const [selectedChoice, setSelectedChoice] = useState(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const [vocabWords, setVocabWords] = useState([])
  const [episodeResult, setEpisodeResult] = useState(null)
  const [episodeInfo, setEpisodeInfo] = useState(null)
  const [error, setError] = useState(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [narrationDone, setNarrationDone] = useState(false)

  const episodeNum = parseInt(episodeNumber)
  const stage = profile ? STAGES[profile.current_stage] : STAGES.el_desconocido
  const narrationOpacity = stage?.narrationOpacity ?? 1
  const choicesVisible = stage?.choicesVisible ?? true
  const freeSpeak = stage?.freeSpeak ?? false
  const speechSpeed = stage?.speechSpeed ?? 0.85

  // Start session on mount
  useEffect(() => {
    initSession()
  }, [citySlug, episodeNum]) // eslint-disable-line

  // Load episode info
  useEffect(() => {
    fetch(`/api/cities/${citySlug}/episodes/${episodeNum}`, {
      headers: authHeader(),
    })
      .then((r) => r.json())
      .then((data) => {
        setEpisodeInfo(data)
        setTotalScenes(data.sceneCount || 6)
      })
      .catch(console.error)
  }, [citySlug, episodeNum]) // eslint-disable-line

  async function initSession() {
    setPhase(PHASE.LOADING)
    setError(null)
    try {
      const sid = await startSession(citySlug, episodeNum)
      setSessionId(sid)
      await loadNextScene(sid, 0)
    } catch (err) {
      setError('Failed to start episode. Please try again.')
    }
  }

  async function loadNextScene(sid, index) {
    setPhase(PHASE.LOADING)
    setFeedback(null)
    setSelectedChoice(null)
    setShowTranslation(false)
    setNarrationDone(false)
    try {
      const sceneData = await loadScene(sid, index)
      setScene(sceneData)
      setSceneIndex(index)
      // If no narration or opacity is 0, skip straight to dialogue
      if (!sceneData.narration || narrationOpacity === 0) {
        setPhase(PHASE.DIALOGUE)
      } else {
        setPhase(PHASE.NARRATION)
      }
    } catch (err) {
      setError(err.message || 'Failed to load scene. Please try again.')
    }
  }

  function onNarrationDone() {
    setNarrationDone(true)
    setTimeout(() => setPhase(PHASE.DIALOGUE), 600)
  }

  function onDialogueDone() {
    setTimeout(() => setPhase(PHASE.RESPONSE), 400)
  }

  async function handleChoice(choice, timeTaken) {
    setSelectedChoice(choice)
    setShowTranslation(true)

    try {
      await respond(sessionId, {
        scene_index: sceneIndex,
        choice_id: choice.id,
        is_correct: choice.is_best,
        key_words: scene.key_words || [],
        scene_summary: scene.summary || '',
        time_taken: timeTaken,
      })
    } catch (err) {
      console.error('Respond error', err)
    }

    setFeedback({
      isCorrect: choice.is_best,
      reaction: choice.character_reaction,
      translation: scene.character_dialogue_translation,
    })
    setPhase(PHASE.FEEDBACK)
  }

  async function handleFreeSpeech(transcript) {
    setShowTranslation(true)
    try {
      const result = await respond(sessionId, {
        scene_index: sceneIndex,
        free_text: transcript,
        character_dialogue: scene.character_dialogue,
        key_words: scene.key_words || [],
        scene_summary: scene.summary || '',
        time_taken: 0,
      })
      setFeedback({
        isCorrect: result.is_correct,
        reaction: result.feedback || (result.is_correct ? 'The character nods, understanding you.' : 'The character looks uncertain — try rephrasing.'),
        translation: scene.character_dialogue_translation,
      })
    } catch (err) {
      setFeedback({
        isCorrect: true,
        reaction: 'The story continues.',
        translation: scene.character_dialogue_translation,
      })
    }
    setPhase(PHASE.FEEDBACK)
  }

  function onFeedbackContinue() {
    // Show vocab flash
    const words = (scene.key_words || []).map((w) => ({ word: w, confidence: 5 }))
    setVocabWords(words)
    setPhase(PHASE.VOCAB_FLASH)
  }

  async function onVocabFlashDone() {
    const nextIndex = sceneIndex + 1
    if (nextIndex >= totalScenes) {
      // Episode complete
      try {
        const result = await completeSession(sessionId)
        setEpisodeResult(result)
        setPhase(PHASE.COMPLETE)
      } catch (err) {
        setEpisodeResult({ completed: true, wordsEncountered: [], nextEpisode: episodeNum + 1 })
        setPhase(PHASE.COMPLETE)
      }
    } else {
      await loadNextScene(sessionId, nextIndex)
    }
  }

  const heroImage = CITY_IMAGES[citySlug]
  const cityName = CITY_NAMES[citySlug] || citySlug

  if (phase === PHASE.COMPLETE && episodeResult) {
    return (
      <EpisodeComplete
        result={episodeResult}
        citySlug={citySlug}
        episodeNumber={episodeNum}
      />
    )
  }

  if (phase === PHASE.VOCAB_FLASH) {
    return <VocabFlash words={vocabWords} onDone={onVocabFlashDone} />
  }

  return (
    <div className="min-h-screen bg-[#1a1614] flex flex-col relative overflow-hidden">
      {/* Background image (subtle) */}
      {heroImage && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-8"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1614]/80 to-[#1a1614]" />
      <div className="absolute inset-0 bg-vignette opacity-60" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[#3a342e]/50">
        <div className="flex items-center gap-3">
          <span className="font-display text-[#d4a853] tracking-widest text-lg">LENGUA</span>
          <span className="text-[#3a342e]">·</span>
          <span className="font-ui text-sm text-[#9a8e7e]">
            {cityName} · Ep. {episodeNum}
            {episodeInfo?.title ? ` · ${episodeInfo.title}` : ''}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Scene counter */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalScenes }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i < sceneIndex
                    ? 'bg-[#d4a853]'
                    : i === sceneIndex
                    ? 'bg-[#d4a853]/60'
                    : 'bg-[#3a342e]'
                }`}
              />
            ))}
          </div>
          <span className="font-ui text-xs text-[#9a8e7e] hidden sm:block">
            Scene {sceneIndex + 1} of {totalScenes}
          </span>

          {/* Exit */}
          <button
            onClick={() => setShowExitConfirm(true)}
            className="font-ui text-sm text-[#9a8e7e] hover:text-[#f0e8d8] transition-colors"
          >
            Exit
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 py-8 max-w-3xl mx-auto w-full gap-6">
        {/* Loading */}
        {phase === PHASE.LOADING && (
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#d4a853] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-ui text-[#9a8e7e] text-sm">
              {sceneIndex === 0 ? 'Setting the scene...' : 'The story continues...'}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <ErrorMessage
            message={error}
            onRetry={() => loadNextScene(sessionId, sceneIndex)}
          />
        )}

        {/* Scene content */}
        {scene && phase !== PHASE.LOADING && !error && (
          <>
            {/* Setting description */}
            {phase === PHASE.NARRATION && scene.setting_description && (
              <p className="font-ui text-xs text-[#9a8e7e] text-center uppercase tracking-widest">
                {scene.setting_description}
              </p>
            )}

            {/* Narration */}
            {(phase === PHASE.NARRATION || narrationDone) && scene.narration && narrationOpacity > 0 && (
              <NarrationBlock
                text={scene.narration}
                opacity={narrationOpacity}
                onDone={onNarrationDone}
              />
            )}

            {/* Dialogue */}
            {(phase === PHASE.DIALOGUE ||
              phase === PHASE.RESPONSE ||
              phase === PHASE.FEEDBACK) && (
              <CharacterDialogue
                scene={scene}
                speechSpeed={speechSpeed}
                showTranslation={showTranslation}
                onTypewriterDone={onDialogueDone}
              />
            )}

            {/* Response area */}
            {phase === PHASE.RESPONSE && (
              <>
                {choicesVisible && scene.choices ? (
                  <ChoiceButtons
                    choices={scene.choices}
                    onSelect={handleChoice}
                    disabled={false}
                  />
                ) : freeSpeak ? (
                  <FreeSpeechInput onSubmit={handleFreeSpeech} />
                ) : null}
              </>
            )}

            {/* Feedback */}
            {phase === PHASE.FEEDBACK && feedback && (
              <FeedbackPanel
                isCorrect={feedback.isCorrect}
                reaction={feedback.reaction}
                translation={feedback.translation}
                onContinue={onFeedbackContinue}
              />
            )}
          </>
        )}
      </main>

      {/* Stage indicator */}
      <footer className="relative z-10 px-6 py-3 border-t border-[#3a342e]/30 flex items-center justify-between">
        <span className="stage-badge text-xs">
          {stage?.label || 'El Desconocido'}
        </span>
        {scene?.emotional_tone && (
          <span className="font-ui text-xs text-[#9a8e7e] capitalize hidden sm:block">
            {scene.emotional_tone}
          </span>
        )}
      </footer>

      {/* Exit confirmation */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-[#1a1614]/90 flex items-center justify-center z-50 px-6">
          <div className="card-warm p-8 max-w-sm w-full text-center animate-slide-up">
            <h3 className="font-display text-2xl text-[#f0e8d8] mb-3">Leave episode?</h3>
            <p className="font-body text-[#9a8e7e] mb-6">
              Your progress through this scene won't be saved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="btn-secondary flex-1 py-3"
              >
                Keep going
              </button>
              <Link to={`/city/${citySlug}`} className="flex-1">
                <button className="btn-primary w-full py-3 bg-[#c4603a] hover:bg-[#a84d2e]">
                  Leave
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
