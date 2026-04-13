import ColorSwatch from './ColorSwatch'
import { scaleFormula, calcCost } from '../utils/formula'

export default function PaintCard({ paint, targetVolume, bottlePrice, pigmentPrices, onClick }) {
  const formula = scaleFormula(paint.formula, targetVolume)
  const cost = calcCost(paint.formula, targetVolume, bottlePrice, pigmentPrices)

  return (
    <button
      onClick={() => onClick(paint)}
      className="w-full text-left bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-amber-400/50 rounded-xl p-4 transition-all"
    >
      <div className="flex items-start gap-3">
        <ColorSwatch hex={paint.hex} size="md" className="mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-amber-400">{paint.id}</span>
            <span className="text-xs text-slate-500">{paint.brand}</span>
          </div>
          <p className="text-sm font-medium text-slate-100 truncate">{paint.name}</p>
          <p className="text-xs font-mono text-slate-500 mt-1 truncate">{formula}</p>
        </div>
        <span className="text-xs text-slate-400 font-mono whitespace-nowrap">${cost}</span>
      </div>
    </button>
  )
}
