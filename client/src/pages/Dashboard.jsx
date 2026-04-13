import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '../context/UserContext.jsx'
import NavBar from '../components/ui/NavBar.jsx'
import VocabMap from '../components/dashboard/VocabMap.jsx'
import CityCard from '../components/dashboard/CityCard.jsx'
import { fetchProgress, fetchCities } from '../utils/api.js'
import { STAGES, CITY_IMAGES } from '../utils/constants.js'

export default function Dashboard() {
  const { profile, authHeader, refreshProfile } = useUser()
  const [progress, setProgress] = useState(null)
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [prog, citiesData] = await Promise.all([
          fetchProgress(authHeader()),
          fetchCities(),
        ])
        setProgress(prog)
        setCities(citiesData)
      } catch (err) {
        console.error('Dashboard load error', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, []) // eslint-disable-line

  const stage = profile ? STAGES[profile.current_stage] : null
  const currentCity = cities.find((c) => c.slug === profile?.current_city)

  return (
    <div className="min-h-screen bg-[#1a1614]">
      <NavBar />

      <main className="max-w-6xl mx-auto px-6 pt-24 pb-16">
        {/* Greeting */}
        <div className="mb-10 animate-fade-in">
          <h1 className="font-display text-4xl text-[#f0e8d8] mb-2">
            Bienvenido de vuelta.
          </h1>
          <p className="font-body text-[#9a8e7e]">Welcome back. Your story continues.</p>
        </div>

        {/* Stage badge + current city */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Current story card */}
          {currentCity && profile && (
            <div
              className="lg:col-span-2 relative overflow-hidden rounded-xl border border-[#d4a853]/20 hover:border-[#d4a853]/40 transition-all group"
              style={{ minHeight: '220px' }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                style={{ backgroundImage: `url(${CITY_IMAGES[currentCity.slug]})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1a1614]/90 to-[#1a1614]/30" />

              <div className="relative p-8 h-full flex flex-col justify-between">
                <div>
                  <p className="font-ui text-xs text-[#d4a853] uppercase tracking-widest mb-1">
                    Current journey
                  </p>
                  <h2 className="font-display text-3xl text-[#f0e8d8] mb-1">
                    {currentCity.name}
                  </h2>
                  <p className="font-ui text-sm text-[#9a8e7e]">
                    Episode {profile.current_episode} of {currentCity.episodes}
                  </p>
                </div>

                <Link
                  to={`/play/${currentCity.slug}/${profile.current_episode}`}
                  className="inline-block mt-4"
                >
                  <button className="btn-primary px-6 py-3">Continue →</button>
                </Link>
              </div>
            </div>
          )}

          {/* Stage badge */}
          {stage && (
            <div className="card-warm p-6 flex flex-col justify-between">
              <div>
                <p className="font-ui text-xs text-[#9a8e7e] uppercase tracking-widest mb-3">
                  Your stage
                </p>
                <h3 className="font-display text-2xl text-[#d4a853] mb-1">
                  {stage.label}
                </h3>
                <p className="font-ui text-sm text-[#9a8e7e] italic mb-4">
                  {stage.subtitle}
                </p>
                <p className="font-body text-sm text-[#9a8e7e] leading-relaxed">
                  {stage.description}
                </p>
              </div>

              {progress && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-ui text-xs text-[#9a8e7e]">Confidence</span>
                    <span className="font-ui text-xs text-[#d4a853]">
                      {progress.vocab?.totalConfidence || 0}
                    </span>
                  </div>
                  <div className="confidence-bar">
                    <div
                      className="confidence-bar-fill bg-[#d4a853]"
                      style={{
                        width: `${Math.min(
                          100,
                          ((progress.vocab?.totalConfidence || 0) / 300) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vocab map */}
        {progress && (
          <div className="mb-8">
            <VocabMap vocab={progress.vocab} />
          </div>
        )}

        {/* Cities */}
        <div>
          <h2 className="font-display text-2xl text-[#f0e8d8] mb-6">Cities</h2>
          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-warm h-56 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {cities.map((city) => {
                const episodeProgress =
                  city.slug === profile?.current_city
                    ? (profile?.current_episode || 1) - 1
                    : 0
                const locked =
                  city.unlocksAt !== null &&
                  !(
                    profile?.current_city === city.slug ||
                    (profile?.current_city === city.unlocksAt?.city &&
                      (profile?.current_episode || 0) > (city.unlocksAt?.episode || 0))
                  )

                return (
                  <CityCard
                    key={city.slug}
                    city={city}
                    episodeProgress={episodeProgress}
                    totalEpisodes={city.episodes}
                    locked={!!locked}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="mt-8 flex items-center gap-4">
          <Link to="/progress" className="btn-secondary text-sm px-5 py-2.5">
            View vocab map
          </Link>
          <Link to="/settings" className="font-ui text-sm text-[#9a8e7e] hover:text-[#f0e8d8] transition-colors">
            Settings
          </Link>
        </div>
      </main>
    </div>
  )
}
