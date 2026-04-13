import { useState, useEffect } from 'react'
import { useTypewriter } from '../../hooks/useTypewriter.js'
import { useAudio } from '../../context/AudioContext.jsx'
import { useUser } from '../../context/UserContext.jsx'

const EMOTION_ICONS = {
  friendly: '😊',
  confused: '😕',
  urgent: '😰',
  warm: '🤗',
  neutral: '😐',
}

export default function CharacterDialogue({
  scene,
  speechSpeed = 0.85,
  showTranslation,
  onSpeechReady,
  onTypewriterDone,
}) {
  const { authHeader } = useUser()
  const { playAudio, speakBrowserTTS, muted } = useAudio()
  const [audioLoaded, setAudioLoaded] = useState(false)
  const [audioError, setAudioError] = useState(false)

  const { displayedText, done, skip } = useTypewriter(
    scene.character_dialogue,
    45,
    onTypewriterDone
  )

  useEffect(() => {
    if (!scene.character_dialogue) return
    loadAndPlayAudio()
  }, [scene.character_dialogue]) // eslint-disable-line

  async function loadAndPlayAudio() {
    if (muted) return
    setAudioLoaded(false)
    setAudioError(false)

    // Try ElevenLabs first
    try {
      const res = await fetch('/api/speech/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          text: scene.character_dialogue,
          voiceId: getVoiceIdForCharacter(scene.character_id),
          speed: speechSpeed,
        }),
      })

      if (res.ok) {
        const buffer = await res.arrayBuffer()
        await playAudio(buffer)
        setAudioLoaded(true)
        if (onSpeechReady) onSpeechReady()
        return
      }
    } catch (err) {
      console.warn('ElevenLabs unavailable, using browser TTS', err)
    }

    // Fallback to browser TTS
    setAudioError(true)
    speakBrowserTTS(scene.character_dialogue, 'es-ES', speechSpeed * 0.85)
    if (onSpeechReady) onSpeechReady()
  }

  function getVoiceIdForCharacter(charId) {
    // Server resolves actual voice IDs — just pass the character ID
    // The server's elevenlabs service maps character IDs to env var voice IDs
    return charId || 'default'
  }

  async function replay() {
    loadAndPlayAudio()
  }

  const emotionIcon = EMOTION_ICONS[scene.emotional_tone] || '😐'

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Character header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#d4a853]/15 border border-[#d4a853]/25 flex items-center justify-center text-lg">
          {emotionIcon}
        </div>
        <div>
          <span className="font-ui text-sm font-medium text-[#d4a853]">
            {scene.character_name}
          </span>
          {audioError && (
            <span className="ml-2 font-ui text-xs text-[#9a8e7e]">(browser voice)</span>
          )}
        </div>
        <button
          onClick={replay}
          className="ml-auto p-2 rounded-full hover:bg-[#d4a853]/10 transition-colors group"
          title="Replay audio"
        >
          <span className="text-[#9a8e7e] group-hover:text-[#d4a853] transition-colors">
            🔊
          </span>
        </button>
      </div>

      {/* Dialogue */}
      <div className="card-warm p-6">
        <p className="font-body text-2xl text-[#f0e8d8] leading-relaxed mb-1">
          {displayedText}
          {!done && <span className="animate-pulse text-[#d4a853]"> |</span>}
        </p>

        {!done && (
          <button
            onClick={skip}
            className="font-ui text-xs text-[#9a8e7e] hover:text-[#d4a853] transition-colors mt-2"
          >
            skip →
          </button>
        )}

        {/* Translation */}
        {showTranslation && scene.character_dialogue_translation && (
          <div className="mt-3 pt-3 border-t border-[#3a342e]">
            <p className="font-ui text-sm text-[#9a8e7e] italic">
              "{scene.character_dialogue_translation}"
            </p>
          </div>
        )}
      </div>

      {/* Key words hint */}
      {scene.key_words?.length > 0 && done && (
        <div className="flex flex-wrap gap-2 mt-3">
          {scene.key_words.map((word) => (
            <span
              key={word}
              className="font-body text-sm text-[#d4a853] italic bg-[#d4a853]/8 px-3 py-1 rounded-full border border-[#d4a853]/15"
            >
              {word}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
