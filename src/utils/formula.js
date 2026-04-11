const PIGMENT_NAMES = {
  C: 'Cyan',
  M: 'Magenta',
  Y: 'Yellow',
  W: 'White',
  Grey: 'Neutral Grey',
  Bk: 'Black',
}

// Pigment prices per ml (C, M, Y only — neutralizers are not costed)
export const PIGMENT_PRICES = { Y: 0.20, M: 0.16, C: 0.093 }

const round1 = v => Math.round(v * 10) / 10

// Parse token like "3M" or "40M" or "1Grey" → { pigment, parts }
function parseToken(token) {
  const m = token.match(/^(\d+)(.+)$/)
  if (!m) return null
  return { pigment: PIGMENT_NAMES[m[2]] ?? m[2], code: m[2], parts: parseInt(m[1]) }
}

/**
 * Parse formulaDrops string into [{pigment, code, parts}]
 * Handles:
 *   "Pure Y"           → single pigment
 *   "3M:5Y:1W"         → colon-separated
 *   "9[3M:5Y]:1Bk"     → shadow pattern
 */
export function parseRatio(formulaDrops) {
  if (formulaDrops.startsWith('Pure ')) {
    const code = formulaDrops.slice(5).trim()
    return [{ pigment: PIGMENT_NAMES[code] ?? code, code, parts: 1 }]
  }

  // Shadow: "9[3M:5Y]:1Bk" or "9M:1Bk" (simplified shadow for single-pigment base)
  const shadowMatch = formulaDrops.match(/^(\d+)\[(.+?)\]:(\d+)Bk$/)
  if (shadowMatch) {
    const outerParts = parseInt(shadowMatch[1])
    const blackParts = parseInt(shadowMatch[3])
    const total = outerParts + blackParts
    const inner = parseRatio(shadowMatch[2])
    const innerTotal = inner.reduce((s, c) => s + c.parts, 0)
    const result = inner.map(c => ({
      ...c,
      parts: (c.parts / innerTotal) * outerParts,
    }))
    result.push({ pigment: 'Black', code: 'Bk', parts: blackParts })
    return result
  }

  // Simple colon-separated (may include trailing :1Bk for e.g. "9M:1Bk")
  return formulaDrops.split(':').map(parseToken).filter(Boolean)
}

/**
 * Scale formula to targetVolume and return display string.
 * e.g. scaleFormula("3M:5Y", 15) → "5.6 ml Magenta : 9.4 ml Yellow"
 */
export function scaleFormula(formulaDrops, targetVolume) {
  const components = parseRatio(formulaDrops)
  const total = components.reduce((s, c) => s + c.parts, 0)
  return components
    .map(c => `${round1((c.parts / total) * targetVolume)} ml ${c.pigment}`)
    .join(' : ')
}

// Fixed wash/glaze ratios (25.3% base, 10% base — constant across all 96 entries)
export const WASH_RATIO = 3.8 / 15
export const GLAZE_RATIO = 1.5 / 15

export function scaleWash(targetVolume) {
  const base = round1(targetVolume * WASH_RATIO)
  const medium = round1(targetVolume - base)
  return `${base} ml base + ${medium} ml Contrast Medium`
}

export function scaleGlaze(targetVolume) {
  const base = round1(targetVolume * GLAZE_RATIO)
  const medium = round1(targetVolume - base)
  return `${base} ml base + ${medium} ml Glaze Medium`
}

/**
 * Strip neutralizers (W, Grey, Bk) to get CMY-only parts for cost.
 * Mirrors the sheet's REGEXREPLACE logic.
 */
function getCMYParts(formulaDrops) {
  // Shadow wrapper: "9[3M:5Y]:1Bk" → "3M:5Y"
  let f = formulaDrops
    .replace(/^(\d+)\[/, '')
    .replace(/\]:(\d+)Bk$/, '')
    .replace(/^Pure /, '')
    .replace(/:1(W|Grey)$/, '')

  if (!f.includes(':')) {
    const code = f.replace(/^\d+/, '') || f
    const parts = parseInt(f) || 1
    if (!PIGMENT_PRICES[code]) return []
    return [{ code, parts }]
  }

  return f
    .split(':')
    .map(t => {
      const m = t.match(/^(\d+)([A-Za-z]+)$/)
      if (!m) return null
      return { code: m[2], parts: parseInt(m[1]) }
    })
    .filter(c => c && PIGMENT_PRICES[c.code] !== undefined)
}

/**
 * Calculate total cost for a given formula, volume, and bottle overhead.
 * cost = inkCost + bottlePrice
 * inkCost = sum(cmyFraction × volume × pricePerMl)
 */
export function calcCost(formulaDrops, targetVolume, bottlePrice) {
  const parts = getCMYParts(formulaDrops)
  if (!parts.length) return round1(bottlePrice)
  const total = parts.reduce((s, c) => s + c.parts, 0)
  const inkCost = parts.reduce(
    (s, c) => s + (c.parts / total) * targetVolume * PIGMENT_PRICES[c.code],
    0
  )
  return round1(inkCost + bottlePrice)
}
