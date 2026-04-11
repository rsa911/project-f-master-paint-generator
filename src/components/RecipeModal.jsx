import { useRef } from 'react'
import { toPng } from 'html-to-image'
import ColorSwatch from './ColorSwatch'
import { scaleFormula, scaleWash, scaleGlaze, calcCost, PIGMENT_PRICES } from '../utils/formula'
import colorMap from '../constants/colorMap'

function CopyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-slate-700/50">
      <span className="text-xs text-slate-500 uppercase tracking-wide whitespace-nowrap">{label}</span>
      <span className="text-sm text-slate-200 text-right font-mono">{value}</span>
    </div>
  )
}

export default function RecipeModal({ paint, targetVolume, bottlePrice, allPaints, onClose, onNavigate }) {
  const cardRef = useRef(null)

  if (!paint) return null

  const hex = colorMap[paint.id] ?? '#6B7280'
  const formula = scaleFormula(paint.formulaDrops, targetVolume)
  const wash = scaleWash(targetVolume)
  const glaze = scaleGlaze(targetVolume)
  const cost = calcCost(paint.formulaDrops, targetVolume, bottlePrice)
  const costPerMl = (cost / targetVolume).toFixed(3)

  const highlightPaint = paint.highlightId !== 'White'
    ? allPaints.find(p => p.id === paint.highlightId)
    : null

  function buildTextExport() {
    return [
      `=== ${paint.id} — ${paint.name} ===`,
      `Formula: ${formula}`,
      `Wash:    ${wash}`,
      `Glaze:   ${glaze}`,
      `Highlight: ${paint.highlightId === 'White' ? 'Add White' : `${paint.highlightId} ${highlightPaint?.name ?? ''}`}`,
      `Contrast: ${paint.contrastPaint}`,
      `Hobby equivalent: ${paint.hobbyColor} (${paint.brand})`,
      `Cost @ ${targetVolume}ml: $${cost} | $${costPerMl}/ml`,
    ].join('\n')
  }

  async function handleExportPng() {
    if (!cardRef.current) return
    const dataUrl = await toPng(cardRef.current, { backgroundColor: '#1e293b' })
    const a = document.createElement('a')
    a.download = `recipe-${paint.id}-${paint.name.replace(/\s+/g, '-')}.png`
    a.href = dataUrl
    a.click()
  }

  function handleCopyText() {
    navigator.clipboard.writeText(buildTextExport())
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-slate-800 border border-slate-700 shadow-2xl">
        {/* Header */}
        <div
          ref={cardRef}
          className="p-6"
          style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
        >
          {/* Color strip */}
          <div className="h-2 rounded-full mb-5" style={{ backgroundColor: hex }} />

          {/* Title row */}
          <div className="flex items-center gap-4 mb-5">
            <ColorSwatch id={paint.id} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                  {paint.id}
                </span>
                <span className="text-xs text-slate-500">{paint.brand}</span>
              </div>
              <h2 className="text-xl font-semibold text-slate-100 mt-0.5">{paint.name}</h2>
              <p className="text-xs text-slate-500 font-mono">{paint.formulaDrops}</p>
            </div>
          </div>

          {/* Recipe sections */}
          <div className="space-y-4">
            <section>
              <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                Base Mix — {targetVolume}ml
              </h3>
              <p className="text-sm font-mono text-slate-200 bg-slate-900/50 rounded px-3 py-2">
                {formula}
              </p>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Wash</h3>
              <p className="text-sm font-mono text-slate-200 bg-slate-900/50 rounded px-3 py-2">{wash}</p>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Glaze</h3>
              <p className="text-sm font-mono text-slate-200 bg-slate-900/50 rounded px-3 py-2">{glaze}</p>
            </section>

            <div className="space-y-0 bg-slate-900/30 rounded-lg px-3 py-1">
              <Row label="Hobby equivalent" value={`${paint.hobbyColor} (${paint.brand})`} />
              <Row label="Contrast pairing" value={paint.contrastPaint} />
              <Row
                label="Highlight"
                value={
                  paint.highlightId === 'White' ? 'Add White' :
                  `${paint.highlightId}${highlightPaint ? ` — ${highlightPaint.name}` : ''}`
                }
              />
              <Row label={`Cost @ ${targetVolume}ml`} value={`$${cost}`} />
              <Row label="Cost per ml" value={`$${costPerMl}`} />
            </div>

            {paint.highlightId !== 'White' && highlightPaint && (
              <button
                onClick={() => onNavigate(highlightPaint)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors text-left"
              >
                <ColorSwatch id={highlightPaint.id} size="sm" />
                <div>
                  <span className="text-xs text-slate-400">Highlight →</span>
                  <p className="text-sm text-slate-200">
                    {highlightPaint.id} — {highlightPaint.name}
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex gap-2 px-6 py-4 border-t border-slate-700 bg-slate-800">
          <button
            onClick={handleExportPng}
            className="flex-1 flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-medium text-sm rounded px-4 py-2 transition-colors"
          >
            Export PNG
          </button>
          <button
            onClick={handleCopyText}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded px-4 py-2 transition-colors"
          >
            <CopyIcon />
            Copy Text
          </button>
          <button
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-slate-400 text-sm rounded px-4 py-2 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
