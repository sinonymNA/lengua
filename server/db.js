import Database from 'better-sqlite3'
import path from 'path'
import { mkdirSync } from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// In production use DATABASE_PATH env var (mount a Railway volume there)
// In dev, store next to the server
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../data/lengua.db')

// Ensure the directory exists
mkdirSync(path.dirname(dbPath), { recursive: true })

const db = new Database(dbPath)

// Performance pragmas
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    email       TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_profiles (
    id              TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_stage   TEXT NOT NULL DEFAULT 'el_desconocido',
    current_city    TEXT NOT NULL DEFAULT 'madrid',
    current_episode INTEGER NOT NULL DEFAULT 1,
    total_sessions  INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS words (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word        TEXT NOT NULL,
    translation TEXT NOT NULL DEFAULT '',
    city        TEXT NOT NULL DEFAULT '',
    confidence  INTEGER NOT NULL DEFAULT 0,
    encounters  INTEGER NOT NULL DEFAULT 0,
    last_seen   TEXT NOT NULL DEFAULT (datetime('now')),
    status      TEXT NOT NULL DEFAULT 'unknown',
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, word)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id                TEXT PRIMARY KEY,
    user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    city              TEXT NOT NULL,
    episode           INTEGER NOT NULL,
    scene_index       INTEGER NOT NULL DEFAULT 0,
    choices_made      TEXT NOT NULL DEFAULT '[]',
    words_encountered TEXT NOT NULL DEFAULT '[]',
    completed         INTEGER NOT NULL DEFAULT 0,
    started_at        TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at      TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_words_user ON words(user_id);
  CREATE INDEX IF NOT EXISTS idx_words_user_word ON words(user_id, word);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_city ON sessions(user_id, city, episode);
`)

// ── Helpers ───────────────────────────────────────────────────────────────────

export function generateId() {
  // Simple UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// ── User queries ──────────────────────────────────────────────────────────────

export const userQueries = {
  findByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  findById: db.prepare('SELECT * FROM users WHERE id = ?'),
  insert: db.prepare(
    'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)'
  ),
}

// ── Profile queries ───────────────────────────────────────────────────────────

export const profileQueries = {
  findById: db.prepare('SELECT * FROM user_profiles WHERE id = ?'),
  insert: db.prepare(
    `INSERT INTO user_profiles (id, current_stage, current_city, current_episode, total_sessions)
     VALUES (?, 'el_desconocido', 'madrid', 1, 0)`
  ),
  update: db.prepare(
    `UPDATE user_profiles
     SET current_stage = ?, current_city = ?, current_episode = ?, updated_at = datetime('now')
     WHERE id = ?`
  ),
  updateStage: db.prepare(
    `UPDATE user_profiles SET current_stage = ?, updated_at = datetime('now') WHERE id = ?`
  ),
  updateCity: db.prepare(
    `UPDATE user_profiles SET current_city = ?, current_episode = ?, updated_at = datetime('now') WHERE id = ?`
  ),
  incrementSessions: db.prepare(
    `UPDATE user_profiles SET total_sessions = total_sessions + 1 WHERE id = ?`
  ),
  updateEpisode: db.prepare(
    `UPDATE user_profiles SET current_episode = ?, updated_at = datetime('now') WHERE id = ?`
  ),
}

// ── Word queries ──────────────────────────────────────────────────────────────

export const wordQueries = {
  findAll: db.prepare('SELECT * FROM words WHERE user_id = ? ORDER BY last_seen DESC'),
  findByCity: db.prepare('SELECT * FROM words WHERE user_id = ? AND city = ? ORDER BY last_seen DESC'),
  findByWord: db.prepare('SELECT * FROM words WHERE user_id = ? AND word = ?'),
  findAcquired: db.prepare("SELECT * FROM words WHERE user_id = ? AND status = 'acquired'"),
  insert: db.prepare(
    `INSERT INTO words (id, user_id, word, translation, city, confidence, encounters, last_seen, status)
     VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), ?)`
  ),
  update: db.prepare(
    `UPDATE words
     SET confidence = ?, encounters = encounters + 1, last_seen = datetime('now'), status = ?
     WHERE id = ?`
  ),
}

// ── Session queries ───────────────────────────────────────────────────────────

export const sessionQueries = {
  findById: db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?'),
  findCompleted: db.prepare(
    'SELECT * FROM sessions WHERE user_id = ? AND city = ? AND completed = 1'
  ),
  insert: db.prepare(
    `INSERT INTO sessions (id, user_id, city, episode, scene_index, choices_made, words_encountered)
     VALUES (?, ?, ?, ?, 0, '[]', '[]')`
  ),
  updateScene: db.prepare('UPDATE sessions SET scene_index = ? WHERE id = ?'),
  updateChoices: db.prepare('UPDATE sessions SET choices_made = ?, words_encountered = ? WHERE id = ?'),
  complete: db.prepare(
    `UPDATE sessions SET completed = 1, completed_at = datetime('now') WHERE id = ?`
  ),
  findRecentCompleted: db.prepare(
    `SELECT * FROM sessions WHERE user_id = ? AND completed = 1
     ORDER BY completed_at DESC LIMIT 10`
  ),
}

export default db
