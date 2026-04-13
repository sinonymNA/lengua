import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext.jsx'

export default function Login() {
  const { signIn } = useUser()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signIn(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#1a1614]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="font-display text-4xl text-[#d4a853] tracking-widest">
            LENGUA
          </Link>
          <p className="font-body text-[#9a8e7e] mt-2">Welcome back.</p>
        </div>

        <form onSubmit={handleSubmit} className="card-warm p-8 space-y-5">
          {error && (
            <div className="bg-[#c4603a]/10 border border-[#c4603a]/30 rounded-lg p-3">
              <p className="font-ui text-sm text-[#c4603a]">{error}</p>
            </div>
          )}

          <div>
            <label className="block font-ui text-sm text-[#9a8e7e] mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full bg-[#1a1614] border border-[#3a342e] rounded-lg px-4 py-3 font-ui text-[#f0e8d8] placeholder-[#6b5f51] focus:outline-none focus:border-[#d4a853] transition-colors"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block font-ui text-sm text-[#9a8e7e] mb-2">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="w-full bg-[#1a1614] border border-[#3a342e] rounded-lg px-4 py-3 font-ui text-[#f0e8d8] placeholder-[#6b5f51] focus:outline-none focus:border-[#d4a853] transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center font-ui text-sm text-[#9a8e7e] mt-6">
          New here?{' '}
          <Link to="/signup" className="text-[#d4a853] hover:text-[#f0e8d8] transition-colors">
            Begin your journey
          </Link>
        </p>
      </div>
    </div>
  )
}
