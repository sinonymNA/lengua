# LENGUA

> *"Step inside the language."*

An AI-powered immersive Spanish language learning app that drops you into a city where nobody speaks your language. No drills. No flashcards. Just you, trying to survive — and slowly understanding everything.

---

## What it is

Lengua uses **comprehensible input** — the same way children acquire language — delivered through cinematic, choose-your-own-adventure audio narratives. Characters speak Spanish. You respond. The story advances. Language is acquired through immersion, not memorization.

**Three cities. Fifteen episodes. Four learning stages.**

- **Madrid** — 5 episodes: airport, metro, market, getting lost, dinner
- **Mexico City** — 5 episodes: customs, rideshare, convenience store, park, café
- **Buenos Aires** — 5 episodes: port, bus, feria, tango, farewell

**Four stages of fluency:**
1. *El Desconocido* (The Stranger) — English narration, simple Spanish, multiple choice
2. *El Visitante* (The Visitor) — Less narration, longer dialogue, still choices
3. *El Residente* (The Resident) — Minimal narration, free speech unlocks
4. *El Habitante* (The Local) — Full immersion, native speed, free speech only

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL + Auth) |
| AI / Story Engine | Anthropic Claude (claude-sonnet-4-20250514) |
| Character Voices | ElevenLabs API |
| Speech Input | Web Speech API (browser-native) |
| Deployment | Railway + Docker |

---

## Setup

### Prerequisites

- Node.js 20+
- A Supabase project
- An Anthropic API key
- An ElevenLabs API key (optional — falls back to browser TTS)

### 1. Clone and install

```bash
git clone https://github.com/sinonymna/lengua
cd lengua
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` in the project root and fill in your keys:

```bash
cp .env.example .env
```

For the React client, copy `client/.env.example` to `client/.env`:

```bash
cp client/.env.example client/.env
```

Required variables:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic (required)
ANTHROPIC_API_KEY=sk-ant-...

# ElevenLabs (optional — app falls back to browser TTS if missing)
ELEVENLABS_API_KEY=
MADRID_ELENA_VOICE_ID=
MADRID_MIGUEL_VOICE_ID=
MEXICO_SOFIA_VOICE_ID=
MEXICO_CARLOS_VOICE_ID=
BUENOS_AIRES_VALENTINA_VOICE_ID=
BUENOS_AIRES_RODRIGO_VOICE_ID=

# App
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

Client `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set up Supabase

Run the migration in `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor.

Enable **Email Auth** in Supabase > Authentication > Providers.

### 4. Run locally

```bash
# Runs both frontend (port 5173) and backend (port 3000)
npm run dev
```

The Vite dev server proxies `/api/*` requests to the Express server.

### 5. Build for production

```bash
npm run build
npm start
```

The built client files are served statically from the Express server.

---

## Deployment (Railway)

1. Push to GitHub
2. Create a new Railway project from the repo
3. Set all environment variables in Railway > Variables
4. Deploy — Railway uses the `Dockerfile` automatically

Or use the included `railway.toml`:

```bash
railway up
```

---

## Project Structure

```
/lengua
  /client                    — React frontend (Vite)
    /src
      /components
        /ui                  — Shared UI components
        /play               — Play screen components
        /dashboard          — Dashboard components
      /pages                 — Route pages
      /context               — React context providers
      /hooks                 — Custom hooks
      /utils                 — API helpers, constants
  /server                    — Express backend
    /routes                  — API route handlers
    /services
      claude.js              — Story engine (scene generation)
      elevenlabs.js          — TTS service with caching
      vocab.js               — Vocabulary tracking
    /middleware              — Auth middleware
    /data/episodes           — 15 episode skeleton JSONs
  /shared
    constants.js             — Stage definitions, city data
  /supabase
    /migrations              — PostgreSQL schema
  Dockerfile
  railway.toml
```

---

## How the Story Engine Works

Each episode has a **skeleton** — a JSON file defining the premise, setting, characters, target vocabulary, and dramatic arc. When a user enters a scene, the skeleton is sent to Claude along with:

- The user's current learning stage
- Their acquired and frontier vocabulary
- Summaries of previous scenes (for narrative continuity)

Claude generates the scene dynamically: narration, character dialogue, response choices (or evaluates free speech), character reactions, and vocab highlights.

This means every playthrough is unique, every scene is contextually appropriate to the learner's level, and the story evolves based on choices made.

---

## The Vocab Graph

Words are tracked with a confidence score (0–100):
- **0–39**: Unknown — word just appeared
- **40–79**: Frontier — learning in progress
- **80–100**: Acquired — yours

Confidence updates after every scene based on behavior: correct responses, hesitation, replaying audio, using words in free speech.

When the total confidence across acquired words crosses a threshold, the user advances to the next stage.

---

## ElevenLabs Voice Setup

Each city has 2 characters, each mapped to an ElevenLabs voice ID. To configure:

1. Create voices in ElevenLabs (or use existing voice IDs)
2. Add the voice IDs to your `.env`:
   ```
   MADRID_ELENA_VOICE_ID=<voice-id>
   MADRID_MIGUEL_VOICE_ID=<voice-id>
   # etc.
   ```

If ElevenLabs is not configured, the app automatically falls back to the browser's built-in Web Speech API synthesis.

---

## Design

Lengua is deliberately not an EdTech app. No cartoons, no XP bars, no streaks.

The aesthetic is cinematic — warm charcoal backgrounds, gold accents, Playfair Display for titles, Crimson Pro for narration text. The play screen is a full-screen immersive experience with typewriter narration, character dialogue, and ambient city imagery.

Key design decisions:
- Typewriter effect for narration — slow enough to feel like reading a novel
- ElevenLabs character voices — each character has a consistent voice across a city
- Film grain overlay on all backgrounds — subtle, adds texture
- No hard white anywhere — everything is warm cream or off-white
- Vocab flash between scenes — words appear briefly, then the story continues

---

*Built with Anthropic Claude Code.*
