import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const TOKEN_KEY = 'lengua_token'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
  })

  // On mount, validate the stored token by fetching the profile
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    fetchProfile(token)
  }, []) // eslint-disable-line

  async function fetchProfile(t) {
    try {
      const res = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${t}` },
      })
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setUser({ id: data.id, email: data.email })
      } else {
        // Token is invalid or expired — clear it
        clearSession()
      }
    } catch {
      // Network error — keep the token but don't crash
    } finally {
      setLoading(false)
    }
  }

  function saveSession(t, userData) {
    try { localStorage.setItem(TOKEN_KEY, t) } catch {}
    setToken(t)
    setUser(userData)
  }

  function clearSession() {
    try { localStorage.removeItem(TOKEN_KEY) } catch {}
    setToken(null)
    setUser(null)
    setProfile(null)
  }

  async function signUp(email, password) {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Signup failed')
    saveSession(data.token, data.user)
    await fetchProfile(data.token)
    return data
  }

  async function signIn(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    saveSession(data.token, data.user)
    await fetchProfile(data.token)
    return data
  }

  async function signOut() {
    // Fire-and-forget — the server logout is a no-op anyway
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    clearSession()
  }

  const authHeader = useCallback(() => {
    if (!token) return {}
    return { Authorization: `Bearer ${token}` }
  }, [token])

  async function refreshProfile() {
    if (token) await fetchProfile(token)
  }

  return (
    <UserContext.Provider
      value={{ user, profile, loading, token, signUp, signIn, signOut, authHeader, refreshProfile }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
