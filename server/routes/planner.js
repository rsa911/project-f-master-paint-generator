import { Router } from 'express'
import { getDb } from '../db.js'

const router = Router()

function parseFormula(formulaStr) {
  if (!formulaStr) return []
  if (formulaStr.startsWith('Pure ')) {
    return [{ code: formulaStr.slice(5).trim(), parts: 1 }]
  }
  return formulaStr.split(':').map(t => {
    const m = t.match(/^(\d+(?:\.\d+)?)([A-Za-z]+)$/)
    return m ? { code: m[2], parts: parseFloat(m[1]) } : null
  }).filter(Boolean)
}

router.post('/', (req, res) => {
  const db = getDb()
  const { selections } = req.body

  if (!Array.isArray(selections) || selections.length === 0) {
    return res.status(400).json({ error: 'selections must be a non-empty array' })
  }

  const pigmentMap = {}
  db.prepare('SELECT * FROM pigments').all().forEach(p => { pigmentMap[p.code] = p })

  const totals = {}   // code → { code, name, ml, cost }
  const colorBreakdown = []

  for (const { colorId, volume } of selections) {
    const color = db.prepare('SELECT * FROM colors WHERE id = ?').get(colorId)
    if (!color) continue

    const components = parseFormula(color.formula)
    const totalParts = components.reduce((s, c) => s + c.parts, 0)
    const colorIngredients = []

    for (const { code, parts } of components) {
      const ml = Math.round((parts / totalParts) * volume * 100) / 100
      const p = pigmentMap[code]
      const cost = Math.round(ml * (p?.pricePerMl ?? 0) * 1000) / 1000

      if (!totals[code]) totals[code] = { code, name: p?.name ?? code, ml: 0, cost: 0 }
      totals[code].ml   = Math.round((totals[code].ml   + ml)   * 100) / 100
      totals[code].cost = Math.round((totals[code].cost + cost)  * 1000) / 1000
      colorIngredients.push({ code, ml })
    }

    const colorCost = colorIngredients.reduce(
      (s, i) => s + (pigmentMap[i.code]?.pricePerMl ?? 0) * i.ml, 0
    )
    colorBreakdown.push({
      colorId,
      name: color.name,
      volume,
      ingredients: colorIngredients,
      cost: Math.round(colorCost * 100) / 100,
    })
  }

  const ingredients = Object.values(totals).sort((a, b) => a.code < b.code ? -1 : 1)
  const totalCost = Math.round(ingredients.reduce((s, i) => s + i.cost, 0) * 100) / 100

  res.json({ ingredients, totalCost, colorBreakdown })
})

export default router
