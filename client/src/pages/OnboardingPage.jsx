import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext.jsx'
import { useAudio } from '../context/AudioContext.jsx'
import { useTypewriter } from '../hooks/useTypewriter.js'

const INTRO_STEPS = [
  {
    text: 'You\'re about to enter a world where you don\'t speak the language.',
    delay: 0,
  },
  {
    text: 'Characters will speak to you in Spanish. You\'ll respond.',
    delay: 1500,
  },
  {
    text: 'Don\'t worry about being perfect. Just try.',
    delay: 3000,
  },
]

export default function OnboardingPage() {
  const { authHeader, refreshProfile } = useUser()
  const { speakBrowserTTS } = useAudio()
  const navigate = useNavigate()
  const [step, setStep] = useState('intro') // intro | tutorial | complete
  const [introStep, setIntroStep] = useState(0)
  const [scene, setScene] = useState(null)
  const [loadingScene, setLoadingScene] = useState(false)
  const [sceneIndex, setSceneIndex] = useState(0)
  const [selectedChoice, setSelectedChoice] = useState(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [responses, setResponses] = useState([])

  const { displayedText: introText, done: introDone } = useTypewriter(
    INTRO_STEPS[introStep]?.text || '',
    40
  )

  useEffect(() => {
    if (step !== 'intro') return
    if (!introDone) return
    if (introStep < INTRO_STEPS.length - 1) {
      const timer = setTimeout(() => setIntroStep((prev) => prev + 1), 800)
      return () => clearTimeout(timer)
    }
  }, [introDone, introStep, step])

  async function loadOnboardingScene(index) {
    setLoadingScene(true)
    setSelectedChoice(null)
    setShowFeedback(false)
    try {
      const res = await fetch(`/api/session/onboarding/scene/${index}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ previousResponses: responses }),
      })
      const data = await res.json()
      setScene(data)
      // Speak dialogue
      if (data.character_dialogue) {
        setTimeout(() => speakBrowserTTS(data.character_dialogue, 'es-ES', 0.75), 800)
      }
    } catch (err) {
      console.error('Onboarding scene error', err)
    } finally {
      setLoadingScene(false)
    }
  }

  function startTutorial() {
    setStep('tutorial')
    loadOnboardingScene(0)
  }

  function handleChoice(choice) {
    setSelectedChoice(choice)
    setShowFeedback(true)
    setResponses((prev) => [
      ...prev,
      { scene: sceneIndex, choice: choice.id, correct: choice.is_best },
    ])
  }

  function nextScene() {
    const nextIndex = sceneIndex + 1
    if (nextIndex >= 3) {
      setStep('complete')
    } else {
      setSceneIndex(nextIndex)
      loadOnboardingScene(nextIndex)
    }
  }

  async function finish() {
    await refreshProfile()
    navigate('/dashboard')
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1614] px-6">
        <div className="max-w-lg text-center animate-fade-in">
          <div className="text-6xl mb-6">☕</div>
          <h1 className="font-display text-4xl text-[#d4a853] mb-4">¡Bien hecho!</h1>
          <p className="font-body text-xl text-[#f0e8d8] mb-3">
            Well done. You've taken your first steps.
          </p>
          <p className="font-body text-[#9a8e7e] mb-8 leading-relaxed">
            Your journey begins in Madrid. Your bag has gone missing at the airport.
            You don't speak the language. But you'll manage.
          </p>
          <button onClick={finish} className="btn-primary px-8 py-4 text-base">
            Begin in Madrid →
          </button>
        </div>
      </div>
    )
  }

  if (step === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1614] px-6">
        <div className="max-w-xl text-center">
          <h1 className="font-display text-5xl text-[#d4a853] tracking-widest mb-12 animate-fade-in">
            LENGUA
          </h1>

          <div className="mb-12 h-24 flex items-center justify-center">
            <p className="font-body text-2xl text-[#f0e8d8] leading-relaxed">
              {introText}
              {!introDone && <span className="text-[#d4a853]">|</span>}
            </p>
          </div>

          {introDone && introStep === INTRO_STEPS.length - 1 && (
            <button
              onClick={startTutorial}
              className="btn-primary px-8 py-4 text-base animate-slide-up"
            >
              I'm ready
            </button>
          )}
        </div>
      </div>
    )
  }

  // Tutorial
  return (
    <div className="min-h-screen bg-[#1a1614] flex flex-col">
      {/* Progress */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#3a342e]">
        <span className="font-display text-[#d4a853] tracking-widest">LENGUA</span>
        <span className="font-ui text-xs text-[#9a8e7e]">
          Tutorial · Scene {sceneIndex + 1} of 3
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-2xl mx-auto w-full">
        {loadingScene ? (
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#d4a853] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-ui text-[#9a8e7e] text-sm">Preparing your scene...</p>
          </div>
        ) : scene ? (
          <OnboardingScene
            scene={scene}
            selectedChoice={selectedChoice}
            showFeedback={showFeedback}
            onChoice={handleChoice}
            onNext={nextScene}
          />
        ) : null}
      </div>
    </div>
  )
}

function OnboardingScene({ scene, selectedChoice, showFeedback, onChoice, onNext }) {
  const { displayedText: narrationText, done: narrationDone } = useTypewriter(
    scene.narration || '',
    35
  )
  const { displayedText: dialogueText, done: dialogueDone } = useTypewriter(
    narrationDone ? scene.character_dialogue : '',
    45
  )

  return (
    <div className="w-full space-y-6 scene-enter">
      {/* Narration */}
      {scene.narration && (
        <div className="bg-[#242018]/80 rounded-lg p-5 border-l-2 border-[#d4a853]/30">
          <p className="font-body text-[#9a8e7e] leading-relaxed">
            {narrationText}
            {!narrationDone && <span className="text-[#d4a853]">|</span>}
          </p>
        </div>
      )}

      {/* Character dialogue */}
      {narrationDone && (
        <div className="card-warm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#d4a853]/20 flex items-center justify-center">
              <span className="text-[#d4a853] text-sm">☕</span>
            </div>
            <span className="font-ui text-sm text-[#d4a853]">{scene.character_name}</span>
          </div>
          <p className="font-body text-xl text-[#f0e8d8] mb-2">
            {dialogueText}
            {!dialogueDone && <span className="text-[#d4a853]">|</span>}
          </p>
          {showFeedback && (
            <p className="font-ui text-sm text-[#9a8e7e] italic mt-2">
              "{scene.character_dialogue_translation}"
            </p>
          )}
        </div>
      )}

      {/* Choices */}
      {dialogueDone && !showFeedback && scene.choices && (
        <div className="space-y-3 animate-slide-up">
          <p className="font-ui text-xs text-[#9a8e7e] uppercase tracking-widest">
            How do you respond?
          </p>
          {scene.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => onChoice(choice)}
              className="w-full text-left card-warm p-4 hover:border-[#d4a853]/40 transition-all group"
            >
              <p className="font-body text-lg text-[#f0e8d8] group-hover:text-[#d4a853] transition-colors">
                {choice.spanish}
              </p>
              <p className="font-ui text-xs text-[#9a8e7e] mt-1">{choice.english}</p>
            </button>
          ))}
        </div>
      )}

      {/* Feedback */}
      {showFeedback && selectedChoice && (
        <div
          className={`rounded-lg p-4 border animate-slide-up ${
            selectedChoice.is_best
              ? 'bg-[#5a8a5e]/10 border-[#5a8a5e]/30'
              : 'bg-[#d4a853]/10 border-[#d4a853]/30'
          }`}
        >
          <p className="font-ui text-sm text-[#f0e8d8] mb-2">
            {selectedChoice.character_reaction}
          </p>
          <button onClick={onNext} className="btn-primary text-sm px-5 py-2.5 mt-2">
            Continue →
          </button>
        </div>
      )}
    </div>
  )
}
