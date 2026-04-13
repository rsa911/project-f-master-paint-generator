// Approximate masstone sRGB values [0,1] for Golden SoFlat pigments
const MASSTONE = {
  M: [0.863, 0.0,   0.478],  // Quinacridone Magenta ~#DC0079
  Y: [1.0,   0.843, 0.0  ],  // Bismuth Yellow ~#FFD700
  C: [0.0,   0.706, 0.847],  // Phthalo Cyan ~#00B4D8
}

function parseComponents(formulaStr) {
  if (!formulaStr) return []
  if (formulaStr.startsWith('Pure ')) {
    const code = formulaStr.slice(5).trim()
    return [{ code, parts: 1 }]
  }
  return formulaStr.split(':').map(t => {
    const m = t.match(/^(\d+(?:\.\d+)?)([A-Za-z]+)$/)
    return m ? { code: m[2], parts: parseFloat(m[1]) } : null
  }).filter(Boolean)
}

export function cmyToHex(formulaStr) {
  const components = parseComponents(formulaStr)
  if (!components.length) return '#6B7280'

  const total = components.reduce((s, c) => s + c.parts, 0)

  let cParts = 0, mParts = 0, yParts = 0
  let wParts = 0, greyParts = 0, bkParts = 0

  for (const { code, parts } of components) {
    if (code === 'C') cParts += parts
    else if (code === 'M') mParts += parts
    else if (code === 'Y') yParts += parts
    else if (code === 'W') wParts += parts
    else if (code === 'Grey') greyParts += parts
    else if (code === 'Bk') bkParts += parts
  }

  const cmyTotal = cParts + mParts + yParts
  let r, g, b

  if (cmyTotal === 0) {
    const l = wParts > 0 ? 1.0 : greyParts > 0 ? 0.5 : 0.1
    r = g = b = l
  } else {
    const cf = cParts / cmyTotal
    const mf = mParts / cmyTotal
    const yf = yParts / cmyTotal
    r = cf * MASSTONE.C[0] + mf * MASSTONE.M[0] + yf * MASSTONE.Y[0]
    g = cf * MASSTONE.C[1] + mf * MASSTONE.M[1] + yf * MASSTONE.Y[1]
    b = cf * MASSTONE.C[2] + mf * MASSTONE.M[2] + yf * MASSTONE.Y[2]
  }

  // Apply white: lerp toward white
  const wFrac = wParts / total
  r = r + wFrac * (1 - r)
  g = g + wFrac * (1 - g)
  b = b + wFrac * (1 - b)

  // Apply grey: lerp toward mid-grey
  const gFrac = greyParts / total
  r = r + gFrac * (0.5 - r)
  g = g + gFrac * (0.5 - g)
  b = b + gFrac * (0.5 - b)

  // Apply black: darken
  const bkFrac = bkParts / total
  const dark = 1 - bkFrac * 0.85
  r *= dark; g *= dark; b *= dark

  const toHex = v => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}
