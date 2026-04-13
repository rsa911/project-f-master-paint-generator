import { Router } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  res.json(getDb().prepare('SELECT * FROM pigments ORDER BY isCmy DESC, code ASC').all())
})

router.put('/:code', (req, res) => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM pigments WHERE code = ?').get(req.params.code)
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const { pricePerMl, name, product } = req.body
  db.prepare(`
    UPDATE pigments SET pricePerMl=?, name=?, product=?, updatedAt=datetime('now') WHERE code=?
  `).run(
    pricePerMl ?? existing.pricePerMl,
    name ?? existing.name,
    product ?? existing.product,
    req.params.code
  )
  res.json(db.prepare('SELECT * FROM pigments WHERE code = ?').get(req.params.code))
})

export default router
