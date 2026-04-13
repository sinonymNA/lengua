import { Link } from 'react-router-dom'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=1600&q=80'

const FEATURES = [
  {
    icon: '🎭',
    title: 'Live inside the story',
    description:
      'Immersive audio narratives where you are the main character. Every decision shapes the scene.',
  },
  {
    icon: '🧠',
    title: 'Learn like a child',
    description:
      'Comprehensible input: words in context, not flashcards. Your brain acquires language naturally.',
  },
  {
    icon: '🗺️',
    title: 'Every city is a classroom',
    description:
      'Madrid, Mexico City, Buenos Aires — three cities, fifteen episodes, one language.',
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#1a1614] vignette">
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1614]/60 via-[#1a1614]/40 to-[#1a1614]" />

        {/* Content */}
        <div className="relative z-10 max-w-3xl animate-fade-in-slow">
          <p className="font-ui text-[#d4a853] text-sm uppercase tracking-[0.3em] mb-6">
            Language Learning, Reimagined
          </p>
          <h1 className="font-display text-7xl md:text-8xl text-[#f0e8d8] mb-6 leading-none">
            LENGUA
          </h1>
          <p className="font-body text-2xl md:text-3xl text-[#f0e8d8] italic mb-4">
            "Step inside the language."
          </p>
          <p className="font-body text-lg text-[#9a8e7e] max-w-xl mx-auto mb-12 leading-relaxed">
            The first language app that puts you in the story. No drills. No XP bars.
            Just you, trying to survive in a city where nobody speaks your language.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <button className="btn-primary text-base px-8 py-4 w-full sm:w-auto">
                Begin Your Journey
              </button>
            </Link>
            <Link to="/login">
              <button className="btn-secondary text-base px-8 py-4 w-full sm:w-auto">
                Sign in
              </button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-0.5 h-12 bg-gradient-to-b from-[#d4a853]/50 to-transparent mx-auto" />
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-3 gap-8">
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className="card-warm p-8 text-center animate-slide-up"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="font-display text-xl text-[#f0e8d8] mb-3">
                {feature.title}
              </h3>
              <p className="font-body text-[#9a8e7e] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Cities preview */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="font-display text-3xl text-[#f0e8d8] text-center mb-3">
          Three Cities. One Language.
        </h2>
        <p className="font-body text-[#9a8e7e] text-center mb-12">
          Each city has its own rhythm, accent, and cast of characters.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'Madrid', country: 'Spain', img: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=600&q=80' },
            { name: 'Mexico City', country: 'Mexico', img: 'https://images.unsplash.com/photo-1518659526054-190340b32735?w=600&q=80' },
            { name: 'Buenos Aires', country: 'Argentina', img: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=600&q=80' },
          ].map((city) => (
            <div key={city.name} className="relative overflow-hidden rounded-xl aspect-[4/3] group">
              <img
                src={city.img}
                alt={city.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1614] to-transparent" />
              <div className="absolute bottom-4 left-4">
                <p className="font-ui text-xs text-[#d4a853] uppercase tracking-widest">{city.country}</p>
                <h3 className="font-display text-2xl text-[#f0e8d8]">{city.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-[#d4a853]/10 py-16 text-center px-6">
        <h2 className="font-display text-4xl text-[#f0e8d8] mb-4">Ready to begin?</h2>
        <p className="font-body text-[#9a8e7e] mb-8">
          Your story starts in Madrid. Your bag has gone missing. You don't speak the language.
        </p>
        <Link to="/signup">
          <button className="btn-primary text-base px-10 py-4">
            Start for free
          </button>
        </Link>
        <p className="font-ui text-xs text-[#9a8e7e] mt-6">
          No credit card required · Currently in beta
        </p>
      </section>
    </div>
  )
}
