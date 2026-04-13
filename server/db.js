import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import path from 'path'

const DATA_PATH = process.env.DATA_PATH || path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../data/masterpaint.db'
)

let db

export function getDb() {
  if (!db) throw new Error('DB not initialized. Call initDb() first.')
  return db
}

export function initDb() {
  db = new Database(DATA_PATH)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS colors (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      formula       TEXT NOT NULL,
      formulaRaw    TEXT,
      contrastPaint TEXT,
      hobbyColor    TEXT,
      brand         TEXT,
      highlightId   TEXT,
      costPerBottle REAL DEFAULT 0,
      sortOrder     INTEGER,
      createdAt     TEXT DEFAULT (datetime('now')),
      updatedAt     TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pigments (
      code       TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      product    TEXT,
      pricePerMl REAL DEFAULT 0,
      isCmy      INTEGER DEFAULT 0,
      updatedAt  TEXT DEFAULT (datetime('now'))
    );
  `)

  // Seed pigments if empty
  const { n } = db.prepare('SELECT count(*) as n FROM pigments').get()
  if (n === 0) {
    const ins = db.prepare('INSERT INTO pigments (code, name, product, pricePerMl, isCmy) VALUES (?, ?, ?, ?, ?)')
    db.transaction(() => {
      ins.run('M',       'Quinacridone Magenta',          'Golden SoFlat', 0.16,  1)
      ins.run('Y',       'Bismuth Yellow',                'Golden SoFlat', 0.20,  1)
      ins.run('C',       'Cyan (Phthalo Blue GS + White)','Golden SoFlat', 0.093, 1)
      ins.run('W',       'Titanium White',                'Golden SoFlat', 0.04,  0)
      ins.run('Bk',      'Black',                         'Golden SoFlat', 0.04,  0)
      ins.run('Grey',    'Neutral Grey',                  'Golden SoFlat', 0.04,  0)
      ins.run('Medium',  'Matte Medium',                  'Golden',        0.02,  0)
      ins.run('Flow',    'Flow Improver',                 'Golden',        0.01,  0)
      ins.run('Thinner', 'Acrylic Thinner',               'Golden',        0.01,  0)
    })()
  }

  console.log(`DB ready: ${DATA_PATH}`)
}
