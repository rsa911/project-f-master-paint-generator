import { useState } from 'react'
import { updatePigment } from '../api'

export default function PigmentPriceEditor({ pigments, onClose, onUpdated }) {
  const [prices, setPrices] = useState(
    Object.fromEntries(pigments.map(p => [p.code, String(p.pricePerMl)]))
  )
  const [saving, setSaving] = useState(null)
  const [error, setError]   = useState(null)

  async function handleSave(code) {
    setSaving(code)
    setError(null)
    try {
      const updated = await updatePigment(code, { pricePerMl: parseFloat(prices[code]) || 0 })
      onUpdated(updated)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(null)
    }
  }

  const cmy  = pigments.filter(p => p.isCmy)
  const rest = pigments.filter(p => !p.isCmy)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-xl bg-slate-800 border border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-base font-semibold text-slate-100">Pigment Prices</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg">✕</button>
        </div>

        <div className="p-6 space-y-6">
          <Section title="Color Pigments (affect cost)" pigments={cmy} prices={prices} setPrices={setPrices} saving={saving} onSave={handleSave} />
          <Section title="Neutrals & Mediums"           pigments={rest} prices={prices} setPrices={setPrices} saving={saving} onSave={handleSave} />

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  )
}

function Section({ title, pigments, prices, setPrices, saving, onSave }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{title}</p>
      <div className="space-y-2">
        {pigments.map(p => (
          <div key={p.code} className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-sm text-slate-200">{p.name}</p>
              <p className="text-xs text-slate-500 font-mono">{p.code} · {p.product}</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">$/ml</span>
              <input
                type="number"
                step="0.001"
                min="0"
                value={prices[p.code] ?? ''}
                onChange={e => setPrices(pr => ({ ...pr, [p.code]: e.target.value }))}
                onBlur={() => onSave(p.code)}
                className="w-20 bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded px-2 py-1 text-right focus:outline-none focus:border-amber-400"
              />
              {saving === p.code && <span className="text-xs text-amber-400">…</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
