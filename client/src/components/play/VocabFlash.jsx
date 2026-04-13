import { useState, useEffect } from 'react'

export default function VocabFlash({ words, onDone }) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!words || words.length === 0) {
      onDone()
      return
    }

    const showTimer = setTimeout(() => {
      setVisible(false)
      const hideTimer = setTimeout(() => {
        if (index < words.length - 1) {
          setIndex((prev) => prev + 1)
          setVisible(true)
        } else {
          onDone()
        }
      }, 400)
      return () => clearTimeout(hideTimer)
    }, 1800)

    return () => clearTimeout(showTimer)
  }, [index]) // eslint-disable-line

  if (!words || words.length === 0) return null

  const word = words[index]
  if (!word) return null

  const confidence = word.confidence || 0
  const status = confidence >= 80 ? 'acquired' : confidence >= 40 ? 'frontier' : 'unknown'
  const statusColor = status === 'acquired' ? '#5a8a5e' : status === 'frontier' ? '#d4a853' : '#9a8e7e'
  const statusLabel = status === 'acquired' ? 'Acquired' : status === 'frontier' ? 'Learning' : 'New word'

  return (
    <div className="fixed inset-0 bg-[#1a1614]/90 flex items-center justify-center z-50">
      <div
        className={`text-center transition-all duration-300 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Word counter dots */}
        <div className="flex items-center gap-2 justify-center mb-8">
          {words.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i <= index ? 'bg-[#d4a853]' : 'bg-[#3a342e]'
              }`}
            />
          ))}
        </div>

        <p className="font-display text-6xl text-[#f0e8d8] mb-4">{word.word || word}</p>
        {word.translation && (
          <p className="font-body text-2xl text-[#9a8e7e] mb-6">{word.translation}</p>
        )}

        <div className="flex items-center gap-2 justify-center">
          <div className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
          <span className="font-ui text-sm" style={{ color: statusColor }}>
            {statusLabel}
          </span>
        </div>

        {word.confidence !== undefined && (
          <div className="mt-4 w-32 mx-auto">
            <div className="confidence-bar">
              <div
                className="confidence-bar-fill"
                style={{ width: `${word.confidence}%`, background: statusColor }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
