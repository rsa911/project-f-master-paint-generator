import { useState } from 'react'
import ColorSwatch from './ColorSwatch'
import CMYColorWheel from './CMYColorWheel'
import { cmyToHex } from '../utils/cmyToHex'
import { createColor, updateColor } from '../api'

const BRANDS = ['AK', 'Citadel', 'AP', 'Other']

export default function ColorEditor({ paint, allPaints = [], onClose, onSaved }) {
  const isEdit = Boolean(paint)
  const [form, setForm] = useState({
    id:           paint?.id           ?? '',
    name:         paint?.name         ?? '',
    formula:      paint?.formula      ?? '',
    contrastPaint:paint?.contrastPaint ?? '',
    hobbyColor:   paint?.hobbyColor   ?? '',
    brand:        paint?.brand        ?? 'AK',
    highlightId:  paint?.highlightId  ?? '',
    costPerBottle:paint?.costPerBottle ?? '',
  })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const previewHex = form.formula ? cmyToHex(form.formula) : '#6B7280'

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const data = {
        ...form,
        costPerBottle: form.costPerBottle !== '' ? parseFloat(form.costPerBottle) : 0,
      }
      const saved = isEdit
        ? await updateColor(paint.id, data)
        : await createColor(data)
      onSaved(saved)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-slate-800 border border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-base font-semibold text-slate-100">
            {isEdit ? `Edit — ${paint.id}` : 'Add Color'}
          </h2>
          <ColorSwatch hex={previewHex} size="md" />
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="ID" required disabled={isEdit} value={form.id} onChange={v => set('id', v)} placeholder="e.g. 13-S" />
            <Field label="Name" required value={form.name} onChange={v => set('name', v)} placeholder="e.g. Deep Olive" />
          </div>

          <Field
            label="Formula"
            required
            value={form.formula}
            onChange={v => set('formula', v)}
            placeholder="e.g. 1M:3Y:4W  or  1M:3Y:3Bk"
            hint={previewHex}
          />

          {allPaints.length > 0 && (
            <details className="group">
              <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300 select-none list-none flex items-center gap-1">
                <span className="transition-transform group-open:rotate-90 inline-block">▶</span>
                Color Wheel Picker
              </summary>
              <div className="mt-2 flex justify-center">
                <CMYColorWheel
                  paints={allPaints}
                  selectedId={paint?.id}
                  onSelect={p => set('formula', p.formula)}
                  size={260}
                />
              </div>
              <p className="text-xs text-slate-500 text-center mt-1">
                Click a wedge to copy its formula into the field above
              </p>
            </details>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Contrast Paint" value={form.contrastPaint} onChange={v => set('contrastPaint', v)} />
            <Field label="Hobby Color"    value={form.hobbyColor}    onChange={v => set('hobbyColor', v)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Brand</label>
              <select
                value={form.brand}
                onChange={e => set('brand', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded px-3 py-2 focus:outline-none focus:border-amber-400"
              >
                {BRANDS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <Field label="Highlight ID" value={form.highlightId} onChange={v => set('highlightId', v)} placeholder="e.g. 3-T or White" />
          </div>

          <Field
            label="Cost per Bottle ($)"
            type="number"
            step="0.01"
            value={form.costPerBottle}
            onChange={v => set('costPerBottle', v)}
            placeholder="0.00"
          />

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 rounded px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-900 font-semibold text-sm rounded px-4 py-2 transition-colors"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Color'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded px-4 py-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, required, disabled, placeholder, hint, type = 'text', step }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">
        {label}{required && <span className="text-amber-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        step={step}
        required={required}
        disabled={disabled}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded px-3 py-2 placeholder-slate-500 focus:outline-none focus:border-amber-400 disabled:opacity-50"
      />
      {hint && <p className="text-xs text-slate-500 mt-0.5 font-mono">{hint}</p>}
    </div>
  )
}
