import { useState, useMemo } from 'react'
import ColorSwatch from './ColorSwatch'
import { runPlanner } from '../api'

export default function ProductionPlanner({ paints, defaultVolume, pigmentPrices }) {
  const [selections, setSelections] = useState({}) // { colorId: volume }
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return paints
    return paints.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    )
  }, [paints, search])

  const selectedCount = Object.keys(selections).length

  function toggleColor(id) {
    setSelections(s => {
      const next = { ...s }
      if (next[id] !== undefined) {
        delete next[id]
      } else {
        next[id] = defaultVolume
      }
      return next
    })
    setResult(null)
  }

  function setVolume(id, vol) {
    setSelections(s => ({ ...s, [id]: Math.max(1, parseInt(vol) || 1) }))
    setResult(null)
  }

  function selectAll() {
    const next = {}
    paints.forEach(p => { next[p.id] = defaultVolume })
    setSelections(next)
    setResult(null)
  }

  function clearAll() {
    setSelections({})
    setResult(null)
  }

  async function calculate() {
    if (selectedCount === 0) return
    setRunning(true)
    setError(null)
    try {
      const payload = Object.entries(selections).map(([colorId, volume]) => ({ colorId, volume }))
      const data = await runPlanner(payload)
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12 space-y-6">
      {/* Top controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded transition-colors"
          >
            Select All ({paints.length})
          </button>
          <button
            onClick={clearAll}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded transition-colors"
          >
            Clear
          </button>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter colors…"
            className="bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded px-3 py-1.5 placeholder-slate-500 focus:outline-none focus:border-amber-400 w-48"
          />
          <button
            onClick={calculate}
            disabled={selectedCount === 0 || running}
            className="bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-900 font-semibold text-sm px-4 py-1.5 rounded transition-colors"
          >
            {running ? 'Calculating…' : `Calculate (${selectedCount})`}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Color selector */}
        <div className="rounded-xl border border-slate-700 overflow-hidden">
          <div className="bg-slate-800 px-4 py-2.5 border-b border-slate-700">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Select Colors to Produce
            </p>
          </div>
          <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-700/50">
            {filtered.map(paint => {
              const checked = selections[paint.id] !== undefined
              return (
                <div
                  key={paint.id}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                    checked ? 'bg-amber-400/5' : 'hover:bg-slate-800/60'
                  }`}
                  onClick={() => toggleColor(paint.id)}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}}
                    className="accent-amber-400 w-4 h-4 cursor-pointer"
                  />
                  <ColorSwatch hex={paint.hex} size="sm" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-mono text-amber-400 mr-2">{paint.id}</span>
                    <span className="text-sm text-slate-200 truncate">{paint.name}</span>
                  </div>
                  {checked && (
                    <div
                      className="flex items-center gap-1"
                      onClick={e => e.stopPropagation()}
                    >
                      <input
                        type="number"
                        min="1"
                        value={selections[paint.id]}
                        onChange={e => setVolume(paint.id, e.target.value)}
                        className="w-16 bg-slate-700 border border-slate-600 text-slate-100 text-xs rounded px-2 py-1 text-right focus:outline-none focus:border-amber-400"
                      />
                      <span className="text-xs text-slate-500">ml</span>
                    </div>
                  )}
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="py-8 text-center text-slate-500 text-sm">No colors match.</div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-400/10 border border-red-400/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {!result && !error && (
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 flex items-center justify-center h-48">
              <p className="text-slate-500 text-sm">
                {selectedCount === 0 ? 'Select colors to get started.' : 'Click Calculate to see ingredient totals.'}
              </p>
            </div>
          )}

          {result && (
            <>
              {/* Ingredient totals */}
              <div className="rounded-xl border border-slate-700 overflow-hidden">
                <div className="bg-slate-800 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Bulk Ingredients to Buy
                  </p>
                  <span className="text-xs text-amber-400 font-mono">
                    Total: ${result.totalCost}
                  </span>
                </div>
                <div className="divide-y divide-slate-700/50">
                  {result.ingredients.map(ing => (
                    <div key={ing.code} className="flex items-center justify-between px-4 py-2.5">
                      <div>
                        <span className="text-sm text-slate-200">{ing.name}</span>
                        <span className="text-xs text-slate-500 font-mono ml-2">{ing.code}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono text-slate-100">{ing.ml} ml</span>
                        {ing.cost > 0 && (
                          <span className="text-xs text-slate-500 ml-2">${ing.cost}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Per-color breakdown */}
              <div className="rounded-xl border border-slate-700 overflow-hidden">
                <div className="bg-slate-800 px-4 py-2.5 border-b border-slate-700">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Per-Color Breakdown
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-700/50">
                  {result.colorBreakdown.map(cb => (
                    <div key={cb.colorId} className="px-4 py-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono text-amber-400">{cb.colorId}</span>
                        <span className="text-xs text-slate-500">{cb.volume}ml · ${cb.cost}</span>
                      </div>
                      <p className="text-xs font-mono text-slate-400">
                        {cb.ingredients.map(i => `${i.ml}ml ${i.code}`).join(' · ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
