import { Link } from 'react-router-dom'
import { CITY_IMAGES } from '../../utils/constants.js'

export default function CityCard({ city, episodeProgress, totalEpisodes, locked }) {
  const imageUrl = CITY_IMAGES[city.slug] || ''

  return (
    <div
      className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
        locked
          ? 'border-[#3a342e] opacity-60 cursor-not-allowed'
          : 'border-[#d4a853]/20 hover:border-[#d4a853]/40 hover:shadow-warm-lg cursor-pointer'
      }`}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1a1614] via-[#1a1614]/70 to-transparent" />

      {/* Content */}
      <div className="relative p-5 pt-24">
        {locked && (
          <div className="absolute top-4 right-4 bg-[#1a1614]/80 rounded-full px-3 py-1">
            <span className="font-ui text-xs text-[#9a8e7e]">Locked</span>
          </div>
        )}

        <p className="font-ui text-xs text-[#d4a853] uppercase tracking-widest mb-1">
          {city.country}
        </p>
        <h3 className="font-display text-2xl text-[#f0e8d8] mb-2">{city.name}</h3>
        <p className="font-body text-sm text-[#9a8e7e] mb-4 line-clamp-2">{city.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {Array.from({ length: totalEpisodes }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < episodeProgress ? 'bg-[#d4a853]' : 'bg-[#3a342e]'
                }`}
              />
            ))}
          </div>

          {!locked && (
            <Link
              to={`/city/${city.slug}`}
              className="font-ui text-sm text-[#d4a853] hover:text-[#f0e8d8] transition-colors"
            >
              {episodeProgress === 0 ? 'Start →' : 'Continue →'}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
