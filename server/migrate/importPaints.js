import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import Database from 'better-sqlite3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = process.env.DATA_PATH || path.join(__dirname, '../../data/masterpaint.db')
const PAINTS_PATH = path.join(__dirname, '../../src/data/paints.json')

function expandShade(formula) {
  const m = formula.match(/^(\d+)\[(.+?)\]:(\d+)Bk$/)
  if (!m) return formula
  const mult = parseInt(m[1])
  const inner = m[2].startsWith('Pure ')
    ? [{ code: m[2].slice(5).trim(), parts: 1 }]
    : m[2].split(':').map(t => {
        const r = t.match(/^(\d+)([A-Za-z]+)$/)
        return r ? { code: r[2], parts: parseInt(r[1]) } : null
      }).filter(Boolean)
  return inner.map(t => `${t.parts * mult}${t.code}`).join(':') + `:${m[3]}Bk`
}

function getSortOrder(id) {
  const m = id.match(/^(\d+)(-([TGS]))?$/)
  if (!m) return 9999
  const varOff = { undefined: 0, T: 1, G: 2, S: 3 }[m[3]] ?? 0
  return parseInt(m[1]) * 10 + varOff
}

console.log(`Migrating to: ${DATA_PATH}`)
console.log(`Source: ${PAINTS_PATH}`)

const db = new Database(DATA_PATH)
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

const paints = JSON.parse(readFileSync(PAINTS_PATH, 'utf8'))
const ins = db.prepare(`
  INSERT OR REPLACE INTO colors
    (id, name, formula, formulaRaw, contrastPaint, hobbyColor, brand, highlightId, costPerBottle, sortOrder)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

db.transaction(() => {
  for (const p of paints) {
    const normalized = expandShade(p.formulaDrops)
    const raw = normalized !== p.formulaDrops ? p.formulaDrops : null
    ins.run(p.id, p.name, normalized, raw, p.contrastPaint, p.hobbyColor,
            p.brand, p.highlightId, p.costPerBottle ?? 0, getSortOrder(p.id))
  }
})()
console.log(`Imported ${paints.length} colors`)

const { n } = db.prepare('SELECT count(*) as n FROM pigments').get()
if (n === 0) {
  const inp = db.prepare('INSERT INTO pigments (code, name, product, pricePerMl, isCmy) VALUES (?, ?, ?, ?, ?)')
  db.transaction(() => {
    inp.run('M',       'Quinacridone Magenta',           'Golden SoFlat', 0.16,  1)
    inp.run('Y',       'Bismuth Yellow',                 'Golden SoFlat', 0.20,  1)
    inp.run('C',       'Cyan (Phthalo Blue GS + White)', 'Golden SoFlat', 0.093, 1)
    inp.run('W',       'Titanium White',                 'Golden SoFlat', 0.04,  0)
    inp.run('Bk',      'Black',                          'Golden SoFlat', 0.04,  0)
    inp.run('Grey',    'Neutral Grey',                   'Golden SoFlat', 0.04,  0)
    inp.run('Medium',  'Matte Medium',                   'Golden',        0.02,  0)
    inp.run('Flow',    'Flow Improver',                  'Golden',        0.01,  0)
    inp.run('Thinner', 'Acrylic Thinner',                'Golden',        0.01,  0)
  })()
  console.log('Seeded 9 pigments')
} else {
  console.log(`Pigments already present (${n}), skipping seed`)
}

db.close()
console.log('Migration complete.')
