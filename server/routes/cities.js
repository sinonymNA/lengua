import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { CITIES } from '../../shared/constants.js'
import { sessionQueries } from '../db.js'
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function loadEpisodeSkeleton(city, episode) {
  const citySlug = city.replace(/-/g, '_')
  const filePath = path.join(__dirname, '../data/episodes', `${citySlug}_${episode}.json`)
  try {
    return JSON.parse(await readFile(filePath, 'utf-8'))
  } catch {
    return null
  }
}

// GET /api/cities
router.get('/', (_req, res) => res.json(CITIES))

// GET /api/cities/:slug
router.get('/:slug', (req, res) => {
  const city = CITIES.find((c) => c.slug === req.params.slug)
  if (!city) return res.status(404).json({ error: 'City not found' })
  res.json(city)
})

// GET /api/cities/:slug/episodes
router.get('/:slug/episodes', requireAuth, async (req, res) => {
  const city = CITIES.find((c) => c.slug === req.params.slug)
  if (!city) return res.status(404).json({ error: 'City not found' })

  const episodes = []
  for (let i = 1; i <= city.episodes; i++) {
    const skeleton = await loadEpisodeSkeleton(city.slug, i)
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

  const completed = sessionQueries.findCompleted.all(req.user.id, req.params.slug)
  const completedNums = new Set(completed.map((s) => s.episode))

  res.json(episodes.map((ep) => ({ ...ep, completed: completedNums.has(ep.number) })))
})

// GET /api/cities/:slug/episodes/:num
router.get('/:slug/episodes/:num', requireAuth, async (req, res) => {
  const skeleton = await loadEpisodeSkeleton(req.params.slug, parseInt(req.params.num))
  if (!skeleton) return res.status(404).json({ error: 'Episode not found' })
  res.json(skeleton)
})

export default router
