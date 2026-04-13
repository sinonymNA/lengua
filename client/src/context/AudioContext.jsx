import { createContext, useContext, useState, useRef, useCallback } from 'react'

const AudioContext = createContext(null)

export function AudioProvider({ children }) {
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem('lengua_muted') === 'true' } catch { return false }
  })
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef(null)
  const synthRef = useRef(null)

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev
      try { localStorage.setItem('lengua_muted', String(next)) } catch {}
      if (next && audioRef.current) audioRef.current.pause()
      return next
    })
  }, [])

  const playAudio = useCallback(
    async (audioBuffer) => {
      if (muted) return
      try {
        const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
        const url = URL.createObjectURL(blob)
        if (audioRef.current) {
          audioRef.current.pause()
          URL.revokeObjectURL(audioRef.current.src)
        }
        const audio = new Audio(url)
        audioRef.current = audio
        audio.onplay = () => setPlaying(true)
        audio.onended = () => {
          setPlaying(false)
          URL.revokeObjectURL(url)
        }
        audio.onerror = () => setPlaying(false)
        await audio.play()
      } catch (err) {
        console.error('Audio playback error:', err)
        setPlaying(false)
      }
    },
    [muted]
  )

  const speakBrowserTTS = useCallback(
    (text, lang = 'es-ES', rate = 0.85) => {
      if (muted) return
      if (!window.speechSynthesis) return
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = rate
      utterance.onstart = () => setPlaying(true)
      utterance.onend = () => setPlaying(false)
      utterance.onerror = () => setPlaying(false)
      synthRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [muted]
  )

  const stop = useCallback(() => {
    if (audioRef.current) audioRef.current.pause()
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setPlaying(false)
  }, [])

  return (
    <AudioContext.Provider
      value={{ muted, toggleMute, playing, playAudio, speakBrowserTTS, stop }}
    >
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const ctx = useContext(AudioContext)
  if (!ctx) throw new Error('useAudio must be used within AudioProvider')
  return ctx
}
