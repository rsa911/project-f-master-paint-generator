const PIGMENT_NAMES = {
  C: 'Cyan',
  M: 'Magenta',
  Y: 'Yellow',
  W: 'White',
  Grey: 'Neutral Grey',
  Bk: 'Black',
}

// Default pigment prices per ml (C, M, Y only — used when API prices not yet loaded)
export const PIGMENT_PRICES = { Y: 0.20, M: 0.16, C: 0.093 }

const round1 = v => Math.round(v * 10) / 10

// Parse token like "3M" or "1Grey" → { pigment, code, parts }
function parseToken(token) {
  const m = token.match(/^(\d+(?:\.\d+)?)(.+)$/)
  if (!m) return null
  return { pigment: PIGMENT_NAMES[m[2]] ?? m[2], code: m[2], parts: parseFloat(m[1]) }
}

/**
 * Expand bracket shade notation to flat form.
 * "9[3M:5Y]:1Bk" → "27M:45Y:1Bk"
 * Already-flat formulas are returned unchanged.
 */
export function expandShade(formula) {
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

/**
 * Parse formula string into [{pigment, code, parts}].
 * Handles: "Pure Y", "3M:5Y:1W", "9[3M:5Y]:1Bk" (bracket notation, legacy)
 */
export function parseRatio(formulaDrops) {
  if (!formulaDrops) return []

  if (formulaDrops.startsWith('Pure ')) {
    const code = formulaDrops.slice(5).trim()
    return [{ pigment: PIGMENT_NAMES[code] ?? code, code, parts: 1 }]
  }

  // Legacy bracket shade: "9[3M:5Y]:1Bk" — expand then parse
  const shadowMatch = formulaDrops.match(/^(\d+)\[(.+?)\]:(\d+)Bk$/)
  if (shadowMatch) {
    return parseRatio(expandShade(formulaDrops))
  }

  return formulaDrops.split(':').map(parseToken).filter(Boolean)
}

/**
 * Scale formula to targetVolume, return display string.
 * e.g. scaleFormula("3M:5Y", 15) → "5.6 ml Magenta : 9.4 ml Yellow"
 */
export function scaleFormula(formula, targetVolume) {
  const components = parseRatio(formula)
  const total = components.reduce((s, c) => s + c.parts, 0)
  return components
    .map(c => `${round1((c.parts / total) * targetVolume)} ml ${c.pigment}`)
    .join(' : ')
}

export const WASH_RATIO  = 3.8 / 15
export const GLAZE_RATIO = 1.5 / 15

export function scaleWash(targetVolume) {
  const base = round1(targetVolume * WASH_RATIO)
  return `${base} ml base + ${round1(targetVolume - base)} ml Contrast Medium`
}

export function scaleGlaze(targetVolume) {
  const base = round1(targetVolume * GLAZE_RATIO)
  return `${base} ml base + ${round1(targetVolume - base)} ml Glaze Medium`
}

/**
 * Return only the CMY parts for cost calculation.
 * Accepts a pigmentPrices map {code: pricePerMl} — only codes present are costed.
 */
function getCMYParts(formula, pigmentPrices) {
  return parseRatio(formula).filter(c => pigmentPrices[c.code] !== undefined)
}

/**
 * Calculate total cost for a formula at a given volume.
 * pigmentPrices defaults to PIGMENT_PRICES if not provided.
 */
export function calcCost(formula, targetVolume, bottlePrice, pigmentPrices = PIGMENT_PRICES) {
  const parts = getCMYParts(formula, pigmentPrices)
  if (!parts.length) return round1(bottlePrice)
  const total = parts.reduce((s, c) => s + c.parts, 0)
  const inkCost = parts.reduce(
    (s, c) => s + (c.parts / total) * targetVolume * pigmentPrices[c.code],
    0
  )
  return round1(inkCost + bottlePrice)
}
