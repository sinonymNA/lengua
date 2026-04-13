import { createHash } from 'crypto'
import { mkdir, writeFile, readFile, access } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE_DIR = path.join(__dirname, '../../.cache/speech')

async function ensureCacheDir() {
  try {
    await mkdir(CACHE_DIR, { recursive: true })
  } catch {}
}

function getCacheKey(text, voiceId, speed) {
  return createHash('md5').update(`${text}|${voiceId}|${speed}`).digest('hex')
}

async function getCachedAudio(cacheKey) {
  const filePath = path.join(CACHE_DIR, `${cacheKey}.mp3`)
  try {
    await access(filePath)
    return await readFile(filePath)
  } catch {
    return null
  }
}

async function setCachedAudio(cacheKey, buffer) {
  await ensureCacheDir()
  const filePath = path.join(CACHE_DIR, `${cacheKey}.mp3`)
  await writeFile(filePath, buffer)
}

export async function generateSpeech(text, voiceId, speed = 1.0) {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured')
  }

  const cacheKey = getCacheKey(text, voiceId, speed)
  const cached = await getCachedAudio(cacheKey)
  if (cached) return cached

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          speed,
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  await setCachedAudio(cacheKey, buffer)

  return buffer
}

export function getVoiceId(characterId) {
  const voiceMap = {
    airport_agent: process.env.MADRID_ELENA_VOICE_ID,
    fellow_traveler: process.env.MADRID_MIGUEL_VOICE_ID,
    metro_worker: process.env.MADRID_ELENA_VOICE_ID,
    commuter: process.env.MADRID_MIGUEL_VOICE_ID,
    vendor: process.env.MADRID_ELENA_VOICE_ID,
    chef: process.env.MADRID_MIGUEL_VOICE_ID,
    abuela: process.env.MADRID_ELENA_VOICE_ID,
    taxi_driver: process.env.MADRID_MIGUEL_VOICE_ID,
    waiter: process.env.MADRID_MIGUEL_VOICE_ID,
    diner: process.env.MADRID_ELENA_VOICE_ID,
    customs_officer: process.env.MEXICO_SOFIA_VOICE_ID,
    traveler: process.env.MEXICO_CARLOS_VOICE_ID,
    uber_driver: process.env.MEXICO_CARLOS_VOICE_ID,
    clerk: process.env.MEXICO_SOFIA_VOICE_ID,
    coach: process.env.MEXICO_CARLOS_VOICE_ID,
    barista: process.env.MEXICO_SOFIA_VOICE_ID,
    dock_worker: process.env.BUENOS_AIRES_RODRIGO_VOICE_ID,
    tourist: process.env.BUENOS_AIRES_VALENTINA_VOICE_ID,
    bus_driver: process.env.BUENOS_AIRES_RODRIGO_VOICE_ID,
    dealer: process.env.BUENOS_AIRES_RODRIGO_VOICE_ID,
    instructor: process.env.BUENOS_AIRES_VALENTINA_VOICE_ID,
  }
  return voiceMap[characterId] || process.env.MADRID_ELENA_VOICE_ID
}
