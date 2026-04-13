import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function EpisodeComplete({ result, citySlug, episodeNumber }) {
  const [revealedWords, setRevealedWords] = useState([])
  const words = result?.wordsEncountered || []
  const nextEpisode = result?.nextEpisode

  useEffect(() => {
    words.forEach((word, i) => {
      setTimeout(() => {
        setRevealedWords((prev) => [...prev, word])
      }, i * 200 + 400)
    })
  }, []) // eslint-disable-line

  return (
    <div className="fixed inset-0 bg-[#1a1614] flex flex-col items-center justify-center px-6 z-40 animate-fade-in">
      <div className="max-w-lg w-full text-center">
        <div className="text-5xl mb-6 animate-float">🌟</div>
        <h1 className="font-display text-5xl text-[#d4a853] mb-3">¡Bien hecho!</h1>
        <p className="font-body text-xl text-[#f0e8d8] mb-2">Episode {episodeNumber} complete.</p>
        <p className="font-body text-[#9a8e7e] mb-8">
          Well done. Every word you heard, you now carry with you.
        </p>

        {words.length > 0 && (
          <div className="mb-8">
            <p className="font-ui text-xs text-[#9a8e7e] uppercase tracking-widest mb-4">
              Words from this episode
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {revealedWords.map((word) => {
                const status =
                  word.confidence >= 80
                    ? 'acquired'
                    : word.confidence >= 40
                    ? 'frontier'
                    : 'unknown'
                const color =
                  status === 'acquired'
                    ? '#5a8a5e'
                    : status === 'frontier'
                    ? '#d4a853'
                    : '#9a8e7e'
                return (
                  <span
                    key={word.id || word.word}
                    className="font-body text-base px-3 py-1.5 rounded-full border animate-slide-up"
                    style={{
                      color,
                      borderColor: `${color}30`,
                      background: `${color}10`,
                    }}
                  >
                    {word.word}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {nextEpisode && nextEpisode <= 5 && (
            <Link to={`/play/${citySlug}/${nextEpisode}`}>
              <button className="btn-primary px-8 py-3 w-full sm:w-auto">
                Next Episode →
              </button>
            </Link>
          )}
          <Link to={`/city/${citySlug}`}>
            <button className="btn-secondary px-8 py-3 w-full sm:w-auto">
              Return to {citySlug === 'madrid' ? 'Madrid' : citySlug === 'mexico-city' ? 'Mexico City' : 'Buenos Aires'}
            </button>
          </Link>
        </div>

        <div className="mt-6">
          <Link to="/dashboard" className="font-ui text-sm text-[#9a8e7e] hover:text-[#f0e8d8] transition-colors">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
