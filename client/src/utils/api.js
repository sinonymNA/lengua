export async function apiFetch(path, options = {}, authHeader = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...(options.headers || {}),
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`)
  return data
}

export async function generateSpeechAudio(text, voiceId, speed, authHeader) {
  const res = await fetch('/api/speech/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({ text, voiceId, speed }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Speech generation failed')
  }
  return await res.arrayBuffer()
}

export async function evaluateSpeech(payload, authHeader) {
  return apiFetch('/api/speech/evaluate', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, authHeader)
}

export async function fetchVocab(authHeader, city) {
  const url = city ? `/api/vocab?city=${city}` : '/api/vocab'
  return apiFetch(url, {}, authHeader)
}

export async function fetchCities() {
  return apiFetch('/api/cities')
}

export async function fetchCityEpisodes(slug, authHeader) {
  return apiFetch(`/api/cities/${slug}/episodes`, {}, authHeader)
}

export async function fetchProgress(authHeader) {
  return apiFetch('/api/user/progress', {}, authHeader)
}
