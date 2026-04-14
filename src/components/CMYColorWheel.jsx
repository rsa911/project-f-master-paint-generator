import { useMemo, useState } from 'react'
import { hexToHue } from '../utils/colorMath'

// ─── SVG wedge arc path ───────────────────────────────────────────────────────
// centerDeg: slot center angle in degrees (0° = top, clockwise)
// rInner / rOuter: radii in SVG unit space (wheel center = 0,0, full radius ≈ 1)
// gapDeg: visual gap between adjacent wedges
function wedgePath(centerDeg, rInner, rOuter, gapDeg = 0.8) {
  const half = ((15 - gapDeg) / 2) * (Math.PI / 180)
  const θ = (centerDeg - 90) * (Math.PI / 180)   // rotate so 0° is at top
  const a = θ - half
  const b = θ + half
  const cx = Math.cos, cy = Math.sin
  return [
    `M ${cx(a) * rOuter} ${cy(a) * rOuter}`,
    `A ${rOuter} ${rOuter} 0 0 1 ${cx(b) * rOuter} ${cy(b) * rOuter}`,
    `L ${cx(b) * rInner} ${cy(b) * rInner}`,
    `A ${rInner} ${rInner} 0 0 0 ${cx(a) * rInner} ${cy(a) * rInner}`,
    'Z',
  ].join(' ')
}

// Ring layout (rInner, rOuter)
const RINGS = {
  base:   [0.65, 0.97],
  tint:   [0.53, 0.63],
  tone:   [0.44, 0.52],
  shadow: [0.26, 0.42],
}

export default function CMYColorWheel({
  paints = [],       // all paint records — must have .id and .hex
  selectedId = null, // highlight this paint id
  onSelect = null,   // (paint) => void
  size = 400,        // px
  showLabels = false,
  hueMode = 'distributed',  // 'distributed' | 'literal'
}) {
  const [hovered, setHovered] = useState(null)

  // ── Group into 24 families ────────────────────────────────────────────────
  const families = useMemo(() => {
    const byId = Object.fromEntries(paints.map(p => [p.id, p]))
    return paints
      .filter(p => !p.id.includes('-'))    // base paints only
      .map(base => ({
        id:     base.id,
        base,
        tint:   byId[base.id + '-T'] ?? null,
        tone:   byId[base.id + '-G'] ?? null,
        shadow: byId[base.id + '-S'] ?? null,
      }))
  }, [paints])

  // ── Sort families by base hue, then assign slot positions ─────────────────
  const sortedFamilies = useMemo(
    () => [...families].sort((a, b) => {
      const ha = a.base.hex ? hexToHue(a.base.hex) : 0
      const hb = b.base.hex ? hexToHue(b.base.hex) : 0
      return ha - hb
    }),
    [families]
  )

  const slotDeg = (index) => {
    if (hueMode === 'literal') {
      return sortedFamilies[index].base.hex
        ? hexToHue(sortedFamilies[index].base.hex)
        : index * 15
    }
    return (index / sortedFamilies.length) * 360
  }

  // ── Find which slot+ring a given paint belongs to ─────────────────────────
  const paintMeta = useMemo(() => {
    const map = {}
    sortedFamilies.forEach((fam, i) => {
      const deg = slotDeg(i)
      ;[
        { p: fam.base,   ring: 'base'   },
        { p: fam.tint,   ring: 'tint'   },
        { p: fam.tone,   ring: 'tone'   },
        { p: fam.shadow, ring: 'shadow' },
      ].forEach(({ p, ring }) => {
        if (p) map[p.id] = { deg, ring, fam }
      })
    })
    return map
  }, [sortedFamilies, hueMode])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ────────────────────────────────────────────────────────────────
  const hoveredPaint = hovered ? paints.find(p => p.id === hovered) : null

  return (
    <div className="inline-block relative select-none">
      <svg
        viewBox="-1.08 -1.08 2.16 2.16"
        width={size}
        height={size}
        role="img"
        aria-label="CMY Color Wheel"
        className="block"
      >
        {/* Center hub */}
        <circle cx="0" cy="0" r="0.23" fill="#0f172a" stroke="#1e293b" strokeWidth="0.015" />

        {/* Render all wedges, sorted so base is on top (rendered last = top) */}
        {sortedFamilies.map((fam, i) => {
          const deg = slotDeg(i)
          return [
            ['shadow', fam.shadow],
            ['tone',   fam.tone  ],
            ['tint',   fam.tint  ],
            ['base',   fam.base  ],
          ].map(([ringName, paint]) => {
            if (!paint?.hex) return null
            const [rInner, rOuter] = RINGS[ringName]
            const isSelected = paint.id === selectedId
            const isHovered  = paint.id === hovered
            return (
              <path
                key={paint.id}
                d={wedgePath(deg, rInner, rOuter)}
                fill={paint.hex}
                stroke="#0f172a"
                strokeWidth={isSelected ? 0.014 : 0.007}
                opacity={isSelected ? 1 : isHovered ? 1 : 0.88}
                onClick={() => onSelect?.(paint)}
                onMouseEnter={() => setHovered(paint.id)}
                onMouseLeave={() => setHovered(null)}
                className={onSelect ? 'cursor-pointer' : ''}
                role={onSelect ? 'button' : undefined}
                aria-label={paint.name}
                aria-pressed={isSelected}
              />
            )
          })
        })}

        {/* Selected highlight ring */}
        {selectedId && paintMeta[selectedId] && (() => {
          const { deg, ring } = paintMeta[selectedId]
          const [rI, rO] = RINGS[ring]
          return (
            <path
              d={wedgePath(deg, rI - 0.012, rO + 0.012)}
              fill="none"
              stroke="white"
              strokeWidth="0.022"
              opacity="0.75"
              pointerEvents="none"
            />
          )
        })()}

        {/* Family index labels (shown when showLabels=true) */}
        {showLabels && sortedFamilies.map((fam, i) => {
          const deg = slotDeg(i)
          const θ = (deg - 90) * (Math.PI / 180)
          const r = 1.03
          const x = Math.cos(θ) * r
          const y = Math.sin(θ) * r
          return (
            <text
              key={fam.id}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="0.07"
              fill="#64748b"
            >
              {fam.id}
            </text>
          )
        })}
      </svg>

      {/* Tooltip */}
      {hoveredPaint && (
        <div
          className="absolute bottom-1 left-0 right-0 flex justify-center pointer-events-none"
          aria-live="polite"
        >
          <span className="inline-flex items-center gap-1.5 text-xs bg-slate-800/95 border border-slate-700 rounded px-2 py-1 text-slate-300 shadow-lg">
            <span
              className="inline-block w-3 h-3 rounded-full border border-slate-600 flex-shrink-0"
              style={{ backgroundColor: hoveredPaint.hex }}
            />
            <span className="font-mono text-slate-400">{hoveredPaint.id}</span>
            <span>{hoveredPaint.name}</span>
          </span>
        </div>
      )}
    </div>
  )
}
