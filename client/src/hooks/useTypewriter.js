import { useState, useEffect, useRef } from 'react'

export function useTypewriter(text, speed = 35, onComplete = null) {
  const [displayedText, setDisplayedText] = useState('')
  const [done, setDone] = useState(false)
  const indexRef = useRef(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!text) {
      setDisplayedText('')
      setDone(true)
      return
    }

    setDisplayedText('')
    setDone(false)
    indexRef.current = 0

    const type = () => {
      if (indexRef.current < text.length) {
        const char = text[indexRef.current]
        setDisplayedText((prev) => prev + char)
        indexRef.current++
        // Vary speed slightly for natural feel — pause longer at punctuation
        const delay = '.!?'.includes(char) ? speed * 8 : ',;:'.includes(char) ? speed * 3 : speed
        timerRef.current = setTimeout(type, delay)
      } else {
        setDone(true)
        if (onComplete) onComplete()
      }
    }

    timerRef.current = setTimeout(type, 300) // initial delay

    return () => {
      clearTimeout(timerRef.current)
    }
  }, [text]) // eslint-disable-line react-hooks/exhaustive-deps

  const skip = () => {
    clearTimeout(timerRef.current)
    setDisplayedText(text)
    setDone(true)
    indexRef.current = text?.length || 0
    if (onComplete) onComplete()
  }

  return { displayedText, done, skip }
}
