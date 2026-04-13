import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '../context/UserContext.jsx'
import NavBar from '../components/ui/NavBar.jsx'
import { fetchVocab } from '../utils/api.js'
import { CONFIDENCE_COLORS } from '../utils/constants.js'

export default function ProgressPage() {
  const { authHeader } = useUser()
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchVocab(authHeader())
      .then(setWords)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line

  const filtered = words
    .filter((w) => filter === 'all' || w.status === filter)
    .filter(
      (w) =>
        !search ||
        w.word.toLowerCase().includes(search.toLowerCase()) ||
        w.translation.toLowerCase().includes(search.toLowerCase())
    )

  const acquired = words.filter((w) => w.status === 'acquired')
  const frontier = words.filter((w) => w.status === 'frontier')
  const unknown = words.filter((w) => w.status === 'unknown')

  return (
    <div className="min-h-screen bg-[#1a1614]">
      <NavBar />

      <main className="max-w-5xl mx-auto px-6 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="font-display text-4xl text-[#f0e8d8] mb-2">Your Vocabulary</h1>
          <p className="font-body text-[#9a8e7e]">
            Words you've encountered on your journey.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Acquired', count: acquired.length, color: '#5a8a5e', status: 'acquired' },
            { label: 'Learning', count: frontier.length, color: '#d4a853', status: 'frontier' },
            { label: 'Encountered', count: unknown.length, color: '#9a8e7e', status: 'unknown' },
          ].map((stat) => (
            <button
              key={stat.status}
              onClick={() => setFilter(filter === stat.status ? 'all' : stat.status)}
              className={`card-warm p-5 text-center transition-all ${
                filter === stat.status ? 'border-[#d4a853]/50' : ''
              }`}
            >
              <div className="font-display text-3xl mb-1" style={{ color: stat.color }}>
                {stat.count}
              </div>
              <div className="font-ui text-sm text-[#9a8e7e]">{stat.label}</div>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search words..."
            className="w-full max-w-sm bg-[#242018] border border-[#3a342e] rounded-lg px-4 py-3 font-ui text-[#f0e8d8] placeholder-[#6b5f51] focus:outline-none focus:border-[#d4a853] transition-colors"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="card-warm h-24 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-body text-[#9a8e7e] text-lg mb-4">
              {words.length === 0
                ? 'No words yet. Start an episode to begin.'
                : 'No words match your filter.'}
            </p>
            {words.length === 0 && (
              <Link to="/dashboard">
                <button className="btn-primary px-6 py-3">Go to dashboard</button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((word) => (
              <WordCard key={word.id} word={word} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function WordCard({ word }) {
  const color = CONFIDENCE_COLORS[word.status] || CONFIDENCE_COLORS.unknown

  return (
    <div className="card-warm p-4">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-body text-lg text-[#f0e8d8] italic">{word.word}</h3>
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
          style={{ background: color }}
        />
      </div>
      {word.translation && (
        <p className="font-ui text-xs text-[#9a8e7e] mb-3">{word.translation}</p>
      )}
      <div className="confidence-bar">
        <div
          className="confidence-bar-fill"
          style={{ width: `${word.confidence}%`, background: color }}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="font-ui text-xs text-[#6b5f51]">{word.encounters}x</span>
        <span className="font-ui text-xs" style={{ color }}>
          {word.confidence}%
        </span>
      </div>
    </div>
  )
}
