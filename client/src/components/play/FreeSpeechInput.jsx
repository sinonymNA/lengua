import { useState, useEffect } from 'react'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition.js'

export default function FreeSpeechInput({ onSubmit, disabled }) {
  const { transcript, listening, error, supported, startListening, stopListening, reset } =
    useSpeechRecognition('es-ES')
  const [manualText, setManualText] = useState('')
  const [showManual, setShowManual] = useState(false)

  useEffect(() => {
    if (!supported) setShowManual(true)
  }, [supported])

  function handleMicClick() {
    if (listening) {
      stopListening()
    } else {
      reset()
      startListening()
    }
  }

  function handleSubmit() {
    const text = (showManual ? manualText : transcript).trim()
    if (!text) return
    onSubmit(text)
    reset()
    setManualText('')
  }

  return (
    <div className="max-w-2xl mx-auto w-full animate-slide-up">
      <p className="font-ui text-xs text-[#9a8e7e] uppercase tracking-widest mb-4">
        Respond in Spanish
      </p>

      {!showManual ? (
        <div className="space-y-4">
          {/* Mic button */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleMicClick}
              disabled={disabled}
              className={`relative w-20 h-20 rounded-full border-2 transition-all duration-300 ${
                listening
                  ? 'bg-[#c4603a]/20 border-[#c4603a] animate-glow-pulse'
                  : 'bg-[#242018] border-[#3a342e] hover:border-[#d4a853]/50'
              } flex items-center justify-center disabled:opacity-50`}
            >
              {listening ? (
                <span className="text-2xl animate-pulse">🎤</span>
              ) : (
                <span className="text-2xl text-[#9a8e7e]">🎙</span>
              )}
              {listening && (
                <span className="absolute inset-0 rounded-full border-2 border-[#c4603a] animate-ping opacity-40" />
              )}
            </button>

            {listening ? (
              <p className="font-ui text-sm text-[#c4603a] mt-3 animate-pulse">
                Listening...
              </p>
            ) : (
              <p className="font-ui text-sm text-[#9a8e7e] mt-3">
                Tap to speak
              </p>
            )}
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="card-warm p-4 text-center animate-slide-up">
              <p className="font-body text-lg text-[#f0e8d8] italic">{transcript}</p>
              <button
                onClick={handleSubmit}
                disabled={disabled}
                className="btn-primary text-sm px-6 py-2.5 mt-3 disabled:opacity-50"
              >
                Submit →
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="font-ui text-sm text-[#c4603a]/80 text-center">{error}</p>
          )}

          {/* Fallback to text */}
          <div className="text-center">
            <button
              onClick={() => setShowManual(true)}
              className="font-ui text-xs text-[#9a8e7e] hover:text-[#d4a853] transition-colors"
            >
              Can't use mic? Type instead
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Type your response in Spanish..."
            rows={3}
            className="w-full bg-[#242018] border border-[#3a342e] rounded-xl px-4 py-3 font-body text-lg text-[#f0e8d8] placeholder-[#6b5f51] focus:outline-none focus:border-[#d4a853] transition-colors resize-none"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={!manualText.trim() || disabled}
              className="btn-primary text-sm px-6 py-2.5 disabled:opacity-50"
            >
              Submit →
            </button>
            {supported && (
              <button
                onClick={() => setShowManual(false)}
                className="font-ui text-sm text-[#9a8e7e] hover:text-[#d4a853] transition-colors"
              >
                Use mic instead
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
