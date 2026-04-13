import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { createClient } from '@supabase/supabase-js'
import { CITIES } from '../../shared/constants.js'
import { readdir, readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

function adminClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

async function loadEpisodeSkeleton(city, episode) {
  const filePath = path.join(
    __dirname,
    '../data/episodes',
    `${city}_${episode}.json`
  )
  try {
    const content = await readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

// GET /api/cities
router.get('/', async (req, res) => {
  res.json(CITIES)
})

// GET /api/cities/:slug
router.get('/:slug', async (req, res) => {
  const city = CITIES.find((c) => c.slug === req.params.slug)
  if (!city) return res.status(404).json({ error: 'City not found' })
  res.json(city)
})

// GET /api/cities/:slug/episodes
router.get('/:slug/episodes', requireAuth, async (req, res) => {
  const city = CITIES.find((c) => c.slug === req.params.slug)
  if (!city) return res.status(404).json({ error: 'City not found' })

  const citySlug = req.params.slug.replace('-', '_')
  const episodes = []
  for (let i = 1; i <= city.episodes; i++) {
    const skeleton = await loadEpisodeSkeleton(citySlug, i)
    if (skeleton) {
      episodes.push({
        number: i,
        title: skeleton.title,
        subtitle: skeleton.subtitle,
        premise: skeleton.premise,
        sceneCount: skeleton.sceneCount,
        estimatedMinutes: skeleton.sceneCount * 2,
      })
    }
  }

  // Get user completion data
  const { data: sessions } = await adminClient()
    .from('sessions')
    .select('episode, completed')
    .eq('user_id', req.user.id)
    .eq('city', req.params.slug)

  const completedEpisodes = new Set(
    (sessions || []).filter((s) => s.completed).map((s) => s.episode)
  )

  const result = episodes.map((ep) => ({
    ...ep,
    completed: completedEpisodes.has(ep.number),
  }))

  res.json(result)
})

// GET /api/cities/:slug/episodes/:num
router.get('/:slug/episodes/:num', requireAuth, async (req, res) => {
  const citySlug = req.params.slug.replace('-', '_')
  const skeleton = await loadEpisodeSkeleton(citySlug, parseInt(req.params.num))
  if (!skeleton) return res.status(404).json({ error: 'Episode not found' })

  res.json(skeleton)
})

export default router
