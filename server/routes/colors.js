import { Router } from 'express'
import { getDb } from '../db.js'
import { cmyToHex } from '../cmyToHex.js'

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

function withHex(row) {
  if (!row) return null
  return { ...row, hex: cmyToHex(row.formula) }
}

const router = Router()

router.get('/', (req, res) => {
  const db = getDb()
  const where = []
  const params = []

  if (req.query.search) {
    where.push('(lower(name) LIKE ? OR lower(id) LIKE ? OR lower(hobbyColor) LIKE ?)')
    const q = `%${req.query.search.toLowerCase()}%`
    params.push(q, q, q)
  }
  if (req.query.brand && req.query.brand !== 'All') {
    where.push('brand = ?')
    params.push(req.query.brand)
  }
  if (req.query.variant) {
    const v = req.query.variant
    if (v === 'Base')       where.push("id NOT LIKE '%-T' AND id NOT LIKE '%-G' AND id NOT LIKE '%-S'")
    else if (v === 'Tint (-T)')   where.push("id LIKE '%-T'")
    else if (v === 'Grey (-G)')   where.push("id LIKE '%-G'")
    else if (v === 'Shadow (-S)') where.push("id LIKE '%-S'")
  }

  let sql = 'SELECT * FROM colors'
  if (where.length) sql += ' WHERE ' + where.join(' AND ')
  sql += ' ORDER BY sortOrder ASC, id ASC'

  res.json(db.prepare(sql).all(...params).map(withHex))
})

router.get('/:id', (req, res) => {
  const row = getDb().prepare('SELECT * FROM colors WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(withHex(row))
})

router.post('/', (req, res) => {
  const db = getDb()
  const { id, name, formula, contrastPaint, hobbyColor, brand, highlightId, costPerBottle, sortOrder } = req.body
  if (!id || !name || !formula) return res.status(400).json({ error: 'id, name, formula required' })

  const normalized = expandShade(formula)
  try {
    db.prepare(`
      INSERT INTO colors (id, name, formula, formulaRaw, contrastPaint, hobbyColor, brand, highlightId, costPerBottle, sortOrder)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, normalized, formula !== normalized ? formula : null,
           contrastPaint ?? null, hobbyColor ?? null, brand ?? null,
           highlightId ?? null, costPerBottle ?? 0, sortOrder ?? null)
    res.status(201).json(withHex(db.prepare('SELECT * FROM colors WHERE id = ?').get(id)))
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') return res.status(409).json({ error: 'ID already exists' })
    throw e
  }
})

router.put('/:id', (req, res) => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM colors WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const { name, formula, contrastPaint, hobbyColor, brand, highlightId, costPerBottle, sortOrder } = req.body
  const normalized = formula ? expandShade(formula) : existing.formula
  const raw = formula && formula !== normalized ? formula : existing.formulaRaw

  db.prepare(`
    UPDATE colors SET name=?, formula=?, formulaRaw=?, contrastPaint=?, hobbyColor=?,
      brand=?, highlightId=?, costPerBottle=?, sortOrder=?, updatedAt=datetime('now')
    WHERE id=?
  `).run(
    name ?? existing.name, normalized, raw,
    contrastPaint ?? existing.contrastPaint, hobbyColor ?? existing.hobbyColor,
    brand ?? existing.brand, highlightId ?? existing.highlightId,
    costPerBottle ?? existing.costPerBottle, sortOrder ?? existing.sortOrder,
    req.params.id
  )

  res.json(withHex(db.prepare('SELECT * FROM colors WHERE id = ?').get(req.params.id)))
})

router.delete('/:id', (req, res) => {
  const result = getDb().prepare('DELETE FROM colors WHERE id = ?').run(req.params.id)
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true })
})

export default router
