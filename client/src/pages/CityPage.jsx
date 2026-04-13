import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useUser } from '../context/UserContext.jsx'
import NavBar from '../components/ui/NavBar.jsx'
import { fetchCityEpisodes } from '../utils/api.js'
import { CITY_IMAGES, CITY_NAMES } from '../utils/constants.js'

export default function CityPage() {
  const { citySlug } = useParams()
  const { profile, authHeader } = useUser()
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCityEpisodes(citySlug, authHeader())
      .then(setEpisodes)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [citySlug]) // eslint-disable-line

  const cityName = CITY_NAMES[citySlug] || citySlug
  const heroImage = CITY_IMAGES[citySlug]

  const currentEpisode = profile?.current_city === citySlug
    ? profile?.current_episode || 1
    : 1

  return (
    <div className="min-h-screen bg-[#1a1614]">
      <NavBar />

      {/* Hero */}
      <div className="relative h-72 overflow-hidden">
        {heroImage && (
          <>
            <img src={heroImage} alt={cityName} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a1614]/30 to-[#1a1614]" />
          </>
        )}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
          <h1 className="font-display text-5xl text-[#f0e8d8]">{cityName}</h1>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="font-display text-2xl text-[#f0e8d8] mb-6">Episodes</h2>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-warm h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {episodes.map((episode, i) => {
              const episodeNum = i + 1
              const isCurrent =
                profile?.current_city === citySlug && profile?.current_episode === episodeNum
              const isCompleted = episode.completed
              const isLocked =
                !isCompleted && episodeNum > currentEpisode && !isCurrent

              return (
                <div
                  key={episodeNum}
                  className={`card-warm p-6 flex items-center justify-between transition-all ${
                    isLocked ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-display text-lg ${
                        isCompleted
                          ? 'bg-[#5a8a5e]/20 text-[#5a8a5e]'
                          : isCurrent
                          ? 'bg-[#d4a853]/20 text-[#d4a853]'
                          : 'bg-[#3a342e] text-[#9a8e7e]'
                      }`}
                    >
                      {isCompleted ? '✓' : episodeNum}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display text-lg text-[#f0e8d8]">
                          {episode.title}
                        </h3>
                        {isCurrent && (
                          <span className="stage-badge text-xs">Current</span>
                        )}
                      </div>
                      {episode.subtitle && (
                        <p className="font-body text-sm text-[#9a8e7e] italic mb-1">
                          {episode.subtitle}
                        </p>
                      )}
                      <p className="font-ui text-xs text-[#9a8e7e]">
                        ~{episode.estimatedMinutes} min · {episode.sceneCount} scenes
                      </p>
                    </div>
                  </div>

                  {!isLocked && (
                    <Link to={`/play/${citySlug}/${episodeNum}`}>
                      <button
                        className={`flex-shrink-0 ${
                          isCompleted ? 'btn-secondary text-sm px-4 py-2' : 'btn-primary text-sm px-4 py-2'
                        }`}
                      >
                        {isCompleted ? 'Replay' : isCurrent ? 'Continue →' : 'Start →'}
                      </button>
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-8">
          <Link to="/dashboard" className="font-ui text-sm text-[#9a8e7e] hover:text-[#f0e8d8] transition-colors">
            ← Back to dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}
