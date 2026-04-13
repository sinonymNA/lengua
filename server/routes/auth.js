import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) return res.status(400).json({ error: error.message })

  // Create user profile
  if (data.user) {
    const adminClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    await adminClient.from('user_profiles').insert({
      id: data.user.id,
      email: data.user.email,
      current_stage: 'el_desconocido',
      current_city: 'madrid',
      current_episode: 1,
      total_sessions: 0,
    })
  }

  res.json({ user: data.user, session: data.session })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return res.status(401).json({ error: error.message })

  res.json({ user: data.user, session: data.session })
})

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(200).json({ message: 'Logged out' })
  }

  const supabase = getSupabase()
  const { error } = await supabase.auth.signOut()
  if (error) return res.status(400).json({ error: error.message })

  res.json({ message: 'Logged out successfully' })
})

export default router
