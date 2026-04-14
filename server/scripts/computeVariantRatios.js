/**
 * computeVariantRatios.js
 *
 * Recomputes all 72 non-base variant formulas (-T tint, -G tone, -S shadow)
 * using CIELAB perceptual color science so that each variant lands a consistent
 * perceptual step from its base color, regardless of hue or luminance.
 *
 * Targets:
 *   Tint  (-T): L* += 25  (capped at 90 so very light bases don't wash out)
 *   Tone  (-G): chroma *= 0.55  (reduces saturation without major lightness shift)
 *   Shadow(-S): L* -= 25  (floored at 5 so very dark bases still show detail)
 *
 * Formula conventions generated:
 *   Single-pigment base  (Pure Y, Pure M, Pure C): NY:1W / NM:1Grey / NC:1Bk
 *   Compound base (1M:15Y etc.):                   1M:15Y:NW / :NGreY / :NBk
 *
 * Run: node server/scripts/computeVariantRatios.js
 *   (from inside Docker: docker exec masterpaint-generator node server/scripts/computeVariantRatios.js)
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PAINTS_PATH = path.join(__dirname, '../../src/data/paints.json')

// ─────────────────────────────────────────────
// CMY masstone values (sRGB [0,1]) — must match cmyToHex.js
// ─────────────────────────────────────────────
const MASSTONE = {
  M: [0.863, 0.0,   0.478],
  Y: [1.0,   0.843, 0.0  ],
  C: [0.0,   0.706, 0.847],
}

// ─────────────────────────────────────────────
// CIELAB math
// ─────────────────────────────────────────────
function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function rgbToXyz(r, g, b) {
  const rl = srgbToLinear(r), gl = srgbToLinear(g), bl = srgbToLinear(b)
  return [
    0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl,
    0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl,
    0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl,
  ]
}

const Xn = 0.95047, Yn = 1.00000, Zn = 1.08883

function labF(t) { return t > 0.008856 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29 }

function rgbToLab(r, g, b) {
  const [x, y, z] = rgbToXyz(r, g, b)
  const fy = labF(y / Yn)
  const L = 116 * fy - 16
  const a = 500 * (labF(x / Xn) - fy)
  const bStar = 200 * (fy - labF(z / Zn))
  return { L, a, b: bStar, chroma: Math.sqrt(a * a + bStar * bStar) }
}

// ─────────────────────────────────────────────
// CMY → base RGB (no modifier)
// ─────────────────────────────────────────────
function cmyToBaseRgb(cParts, mParts, yParts) {
  const total = cParts + mParts + yParts
  if (total === 0) return [0.5, 0.5, 0.5]
  const cf = cParts / total, mf = mParts / total, yf = yParts / total
  return [
    cf * MASSTONE.C[0] + mf * MASSTONE.M[0] + yf * MASSTONE.Y[0],
    cf * MASSTONE.C[1] + mf * MASSTONE.M[1] + yf * MASSTONE.Y[1],
    cf * MASSTONE.C[2] + mf * MASSTONE.M[2] + yf * MASSTONE.Y[2],
  ]
}

// ─────────────────────────────────────────────
// Apply a modifier fraction to base RGB.
// f = modifier_parts / total_parts  (matches cmyToHex.js logic exactly)
// ─────────────────────────────────────────────
function applyModifier(baseRgb, modType, f) {
  let [r, g, b] = baseRgb
  if (modType === 'W') {
    r += f * (1 - r); g += f * (1 - g); b += f * (1 - b)
  } else if (modType === 'Grey') {
    r += f * (0.5 - r); g += f * (0.5 - g); b += f * (0.5 - b)
  } else if (modType === 'Bk') {
    const dark = 1 - f * 0.85
    r *= dark; g *= dark; b *= dark
  }
  return [r, g, b]
}

// ─────────────────────────────────────────────
// Binary search for modifier fraction that satisfies a CIELAB criterion.
// compareFn(lab) > 0 → f is too low (needs more modifier); ≤ 0 → f is too high.
// ─────────────────────────────────────────────
function binarySearch(baseRgb, modType, compareFn, loInit = 0, hiInit = 0.97) {
  let lo = loInit, hi = hiInit
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2
    const rgb = applyModifier(baseRgb, modType, mid)
    const lab = rgbToLab(...rgb)
    if (compareFn(lab) > 0) lo = mid; else hi = mid
  }
  return (lo + hi) / 2
}

// ─────────────────────────────────────────────
// Parse a base formula (CMY only, no modifiers) → {C, M, Y, total}
// ─────────────────────────────────────────────
function parseBase(formulaStr) {
  if (formulaStr.startsWith('Pure ')) {
    const code = formulaStr.slice(5).trim()
    return { C: code === 'C' ? 1 : 0, M: code === 'M' ? 1 : 0, Y: code === 'Y' ? 1 : 0, total: 1 }
  }
  let C = 0, M = 0, Y = 0
  for (const token of formulaStr.split(':')) {
    const m = token.match(/^(\d+(?:\.\d+)?)([CMY])$/)
    if (m) {
      const v = parseFloat(m[1])
      if (m[2] === 'C') C += v
      else if (m[2] === 'M') M += v
      else if (m[2] === 'Y') Y += v
    }
  }
  return { C, M, Y, total: C + M + Y }
}

// ─────────────────────────────────────────────
// Generate variant formula string from a searched modifier fraction f.
//
// Single-pigment bases (Pure X, one CMY component):
//   Use N:1 ratio → NX:1modifier  where N = round((1-f)/f)
//
// Compound bases (≥2 CMY components):
//   Append modifier → baseStr:Nmodifier  where N = round(f*B/(1-f))
// ─────────────────────────────────────────────
function generateFormula(baseFormulaStr, baseParts, modType, f) {
  const B = baseParts.total
  const componentCount = (baseParts.C > 0 ? 1 : 0) + (baseParts.M > 0 ? 1 : 0) + (baseParts.Y > 0 ? 1 : 0)

  if (componentCount === 1) {
    const code = baseParts.C > 0 ? 'C' : baseParts.M > 0 ? 'M' : 'Y'
    // N:1 ratio → modifier fraction = 1/(N+1)
    const Nraw = (1 - f) / f
    const N = Math.max(1, Math.round(Nraw))
    return `${N}${code}:1${modType}`
  } else {
    // Compound: append N modifier parts to the base formula string
    // modifier fraction = N/(B+N) → N = f*B/(1-f)
    const N = Math.max(1, Math.round((f * B) / (1 - f)))
    return `${baseFormulaStr}:${N}${modType}`
  }
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
const TINT_DELTA_L   = 25    // L* step lightward for tints
const TONE_CHROMA_SCALE = 0.55  // chroma scale for tones
const SHAD_DELTA_L   = 25    // L* step darkward for shadows

const paints = JSON.parse(readFileSync(PAINTS_PATH, 'utf8'))
const baseMap = new Map(
  paints.filter(p => !p.id.includes('-')).map(p => [p.id, p])
)

let changed = 0
const log = []

for (const [baseId, basePaint] of baseMap) {
  const baseParts = parseBase(basePaint.formulaDrops)
  const baseRgb   = cmyToBaseRgb(baseParts.C, baseParts.M, baseParts.Y)
  const baseLab   = rgbToLab(...baseRgb)

  // ── TINT (-T) ──────────────────────────────
  const tintTarget = Math.min(baseLab.L + TINT_DELTA_L, 90)
  const tintF = binarySearch(baseRgb, 'W', lab => lab.L < tintTarget ? 1 : -1)
  const tintFormula = generateFormula(basePaint.formulaDrops, baseParts, 'W', tintF)

  const tintActualLab = rgbToLab(...applyModifier(baseRgb, 'W', tintF))

  // ── TONE (-G) ──────────────────────────────
  const toneTarget = baseLab.chroma * TONE_CHROMA_SCALE
  const toneF = binarySearch(baseRgb, 'Grey', lab => lab.chroma > toneTarget ? 1 : -1)
  const toneFormula = generateFormula(basePaint.formulaDrops, baseParts, 'Grey', toneF)

  const toneActualLab = rgbToLab(...applyModifier(baseRgb, 'Grey', toneF))

  // ── SHADOW (-S) ────────────────────────────
  const shadTarget = Math.max(baseLab.L - SHAD_DELTA_L, 5)
  const shadF = binarySearch(baseRgb, 'Bk', lab => lab.L > shadTarget ? 1 : -1)
  const shadFormula = generateFormula(basePaint.formulaDrops, baseParts, 'Bk', shadF)

  const shadActualLab = rgbToLab(...applyModifier(baseRgb, 'Bk', shadF))

  // ── Apply to paints array ──────────────────
  for (const variant of [
    { suffix: '-T', formula: tintFormula, oldLab: baseLab, newLab: tintActualLab, label: 'tint  ' },
    { suffix: '-G', formula: toneFormula, oldLab: baseLab, newLab: toneActualLab, label: 'tone  ' },
    { suffix: '-S', formula: shadFormula, oldLab: baseLab, newLab: shadActualLab, label: 'shadow' },
  ]) {
    const paint = paints.find(p => p.id === baseId + variant.suffix)
    if (!paint) continue
    const old = paint.formulaDrops
    paint.formulaDrops = variant.formula
    log.push(
      `${(baseId + variant.suffix).padEnd(5)} ${variant.label}  ` +
      `${old.padEnd(22)} → ${variant.formula.padEnd(22)} ` +
      `L*: ${variant.oldLab.L.toFixed(1).padStart(5)} → ${variant.newLab.L.toFixed(1).padStart(5)}  ` +
      `chroma: ${variant.oldLab.chroma.toFixed(1).padStart(5)} → ${variant.newLab.chroma.toFixed(1).padStart(5)}`
    )
    changed++
  }
}

console.log('\nBase             Variant  Old formula             → New formula               L* before → after  Chroma before → after')
console.log('─'.repeat(110))
for (const line of log) console.log(line)
console.log(`\n✓ Updated ${changed} formulas`)

writeFileSync(PAINTS_PATH, JSON.stringify(paints, null, 2) + '\n')
console.log(`✓ Written to ${PAINTS_PATH}`)
console.log('\nNext step: docker exec masterpaint-generator node server/migrate/importPaints.js')
