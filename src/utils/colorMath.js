// Perceptual color science utilities — CIELAB (D65), used by the color wheel
// and any component that needs perceptual color distances or hue angles.

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function rgbToXyz(r, g, b) {
  const rl = srgbToLinear(r)
  const gl = srgbToLinear(g)
  const bl = srgbToLinear(b)
  // IEC 61966-2-1 sRGB to CIE XYZ (D65)
  return [
    0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl,
    0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl,
    0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl,
  ]
}

// D65 reference white
const Xn = 0.95047
const Yn = 1.00000
const Zn = 1.08883

function labF(t) {
  return t > 0.008856 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29
}

function xyzToLab(x, y, z) {
  const fy = labF(y / Yn)
  const L = 116 * fy - 16
  const a = 500 * (labF(x / Xn) - fy)
  const b = 200 * (fy - labF(z / Zn))
  return { L, a, b, chroma: Math.sqrt(a * a + b * b) }
}

/**
 * Convert a CSS hex color to CIELAB.
 * @param {string} hex  e.g. '#DC0079'
 * @returns {{ L: number, a: number, b: number, chroma: number }}
 */
export function hexToLab(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const [x, y, z] = rgbToXyz(r, g, b)
  return xyzToLab(x, y, z)
}

/**
 * Return the HSL hue angle (0–360°) for a hex color.
 * Used to sort paint families around the color wheel.
 */
export function hexToHue(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  if (d === 0) return 0
  let h
  if (max === r)      h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else                h = (r - g) / d + 4
  return ((h / 6) * 360 + 360) % 360
}
