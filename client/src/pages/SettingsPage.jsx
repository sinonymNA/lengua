import { useUser } from '../context/UserContext.jsx'
import { useAudio } from '../context/AudioContext.jsx'
import NavBar from '../components/ui/NavBar.jsx'
import { STAGES } from '../utils/constants.js'
import { Link } from 'react-router-dom'

export default function SettingsPage() {
  const { profile, user, signOut } = useUser()
  const { muted, toggleMute } = useAudio()

  const stage = profile ? STAGES[profile.current_stage] : null

  return (
    <div className="min-h-screen bg-[#1a1614]">
      <NavBar />

      <main className="max-w-2xl mx-auto px-6 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="font-display text-4xl text-[#f0e8d8] mb-2">Settings</h1>
        </div>

        <div className="space-y-4">
          {/* Account */}
          <section className="card-warm p-6">
            <h2 className="font-display text-xl text-[#f0e8d8] mb-4">Account</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-[#3a342e]">
                <span className="font-ui text-sm text-[#9a8e7e]">Email</span>
                <span className="font-ui text-sm text-[#f0e8d8]">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#3a342e]">
                <span className="font-ui text-sm text-[#9a8e7e]">Status</span>
                <span className="stage-badge">Beta</span>
              </div>
              {stage && (
                <div className="flex justify-between items-center py-2 border-b border-[#3a342e]">
                  <span className="font-ui text-sm text-[#9a8e7e]">Learning stage</span>
                  <span className="font-ui text-sm text-[#d4a853]">
                    {stage.label} · {stage.subtitle}
                  </span>
                </div>
              )}
              {profile && (
                <div className="flex justify-between items-center py-2">
                  <span className="font-ui text-sm text-[#9a8e7e]">Sessions completed</span>
                  <span className="font-ui text-sm text-[#f0e8d8]">
                    {profile.total_sessions}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Audio */}
          <section className="card-warm p-6">
            <h2 className="font-display text-xl text-[#f0e8d8] mb-4">Audio</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-ui text-sm text-[#f0e8d8]">Sound effects & character voices</p>
                <p className="font-ui text-xs text-[#9a8e7e] mt-0.5">
                  Turn off to use the app silently
                </p>
              </div>
              <button
                onClick={toggleMute}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  muted ? 'bg-[#3a342e]' : 'bg-[#d4a853]'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-[#f0e8d8] transition-transform ${
                    muted ? 'left-1' : 'left-7'
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Language */}
          <section className="card-warm p-6">
            <h2 className="font-display text-xl text-[#f0e8d8] mb-4">Language</h2>
            <div className="flex items-center justify-between py-2">
              <span className="font-ui text-sm text-[#9a8e7e]">Your native language</span>
              <span className="font-ui text-sm text-[#f0e8d8]">English</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="font-ui text-sm text-[#9a8e7e]">Learning</span>
              <span className="font-ui text-sm text-[#f0e8d8]">Spanish</span>
            </div>
          </section>

          {/* Danger zone */}
          <section className="card-warm p-6 border-[#c4603a]/20">
            <h2 className="font-display text-xl text-[#c4603a] mb-4">Account actions</h2>
            <button
              onClick={signOut}
              className="btn-secondary text-sm px-5 py-2.5 border-[#c4603a]/30 text-[#c4603a]"
            >
              Sign out
            </button>
          </section>
        </div>

        <div className="mt-8">
          <Link
            to="/dashboard"
            className="font-ui text-sm text-[#9a8e7e] hover:text-[#f0e8d8] transition-colors"
          >
            ← Back to dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}
