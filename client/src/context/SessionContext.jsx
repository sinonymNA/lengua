import { createContext, useContext, useState, useCallback } from 'react'
import { useUser } from './UserContext.jsx'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const { authHeader } = useUser()
  const [sessionId, setSessionId] = useState(null)
  const [currentScene, setCurrentScene] = useState(null)
  const [sceneIndex, setSceneIndex] = useState(0)
  const [sceneHistory, setSceneHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const startSession = useCallback(
    async (city, episode) => {
      setLoading(true)
      setError(null)
      setSceneHistory([])
      setSceneIndex(0)
      setCurrentScene(null)
      try {
        const res = await fetch('/api/session/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify({ city, episode }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setSessionId(data.session_id)
        return data.session_id
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [authHeader]
  )

  const loadScene = useCallback(
    async (sid, index) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/session/${sid}/scene/${index}`, {
          headers: authHeader(),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setCurrentScene(data)
        setSceneIndex(index)
        return data
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [authHeader]
  )

  const respond = useCallback(
    async (sid, responseData) => {
      try {
        const res = await fetch(`/api/session/${sid}/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify(responseData),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        return data
      } catch (err) {
        console.error('Response error:', err)
        throw err
      }
    },
    [authHeader]
  )

  const completeSession = useCallback(
    async (sid) => {
      const res = await fetch(`/api/session/${sid}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      return data
    },
    [authHeader]
  )

  const addToHistory = useCallback((scene) => {
    setSceneHistory((prev) => [...prev, scene])
  }, [])

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        currentScene,
        sceneIndex,
        sceneHistory,
        loading,
        error,
        startSession,
        loadScene,
        respond,
        completeSession,
        addToHistory,
        setCurrentScene,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
