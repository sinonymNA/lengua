import { Link, useLocation } from 'react-router-dom'
import { useUser } from '../../context/UserContext.jsx'
import { STAGES } from '../../utils/constants.js'

export default function NavBar() {
  const { profile, signOut } = useUser()
  const location = useLocation()

  const stage = profile ? STAGES[profile.current_stage] : null

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-[#1a1614] to-transparent">
      <Link to="/dashboard" className="font-display text-2xl text-[#d4a853] tracking-widest hover:opacity-80 transition-opacity">
        LENGUA
      </Link>

      <div className="flex items-center gap-6">
        {stage && (
          <span className="stage-badge hidden sm:flex">
            {stage.label}
          </span>
        )}
        <Link
          to="/progress"
          className={`font-ui text-sm transition-colors ${
            location.pathname === '/progress'
              ? 'text-[#d4a853]'
              : 'text-[#9a8e7e] hover:text-[#f0e8d8]'
          }`}
        >
          Progress
        </Link>
        <Link
          to="/settings"
          className={`font-ui text-sm transition-colors ${
            location.pathname === '/settings'
              ? 'text-[#d4a853]'
              : 'text-[#9a8e7e] hover:text-[#f0e8d8]'
          }`}
        >
          Settings
        </Link>
        <button
          onClick={signOut}
          className="font-ui text-sm text-[#9a8e7e] hover:text-[#f0e8d8] transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
