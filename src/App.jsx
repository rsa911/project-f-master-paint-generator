import { useState, useEffect, useMemo } from 'react'
import FilterBar from './components/FilterBar'
import VolumeControl from './components/VolumeControl'
import PaintTable from './components/PaintTable'
import RecipeModal from './components/RecipeModal'
import ColorEditor from './components/ColorEditor'
import PigmentPriceEditor from './components/PigmentPriceEditor'
import ProductionPlanner from './components/ProductionPlanner'
import { getColors, deleteColor, getPigments } from './api'

export default function App() {
  const [tab, setTab] = useState('colors') // 'colors' | 'planner'
  const [paints, setPaints]     = useState([])
  const [pigments, setPigments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [targetVolume, setTargetVolume] = useState(15)
  const [bottlePrice, setBottlePrice]   = useState(0)

  const [search, setSearch]   = useState('')
  const [brand, setBrand]     = useState('All')
  const [variant, setVariant] = useState('All')

  const [selectedPaint,   setSelectedPaint]   = useState(null) // RecipeModal
  const [editingPaint,    setEditingPaint]     = useState(null) // ColorEditor: null=closed, {}=new, paint=edit
  const [showPigmentEditor, setShowPigmentEditor] = useState(false)
  const [deletingPaint,   setDeletingPaint]   = useState(null) // confirm delete

  // Load data on mount
  useEffect(() => {
    Promise.all([getColors(), getPigments()])
      .then(([colors, pigs]) => {
        setPaints(colors)
        setPigments(pigs)
      })
      .catch(e => setLoadError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const pigmentPrices = useMemo(
    () => Object.fromEntries(pigments.map(p => [p.code, p.pricePerMl])),
    [pigments]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const variantSuffix = { 'Tint (-T)': '-T', 'Grey (-G)': '-G', 'Shadow (-S)': '-S' }
    return paints.filter(p => {
      if (search && !p.name.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q) && !(p.hobbyColor ?? '').toLowerCase().includes(q)) return false
      if (brand !== 'All' && p.brand !== brand) return false
      if (variant === 'Base' && p.id.includes('-')) return false
      if (variant in variantSuffix && !p.id.endsWith(variantSuffix[variant])) return false
      return true
    })
  }, [paints, search, brand, variant])

  function handleColorSaved(saved) {
    setPaints(ps => {
      const idx = ps.findIndex(p => p.id === saved.id)
      return idx >= 0
        ? ps.map(p => p.id === saved.id ? saved : p)
        : [...ps, saved]
    })
    setEditingPaint(null)
    // If the edited paint is currently selected in modal, update it
    if (selectedPaint?.id === saved.id) setSelectedPaint(saved)
  }

  function handlePigmentUpdated(updated) {
    setPigments(ps => ps.map(p => p.code === updated.code ? updated : p))
  }

  async function handleDelete(paint) {
    try {
      await deleteColor(paint.id)
      setPaints(ps => ps.filter(p => p.id !== paint.id))
      if (selectedPaint?.id === paint.id) setSelectedPaint(null)
    } catch (e) {
      alert(`Delete failed: ${e.message}`)
    } finally {
      setDeletingPaint(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap gap-4 items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              <span className="text-amber-400">Masterpaint</span>
              <span className="text-slate-400 font-normal"> Generator</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              CMY color system · {loading ? '…' : `${paints.length} recipes`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <VolumeControl
              targetVolume={targetVolume}
              setTargetVolume={setTargetVolume}
              bottlePrice={bottlePrice}
              setBottlePrice={setBottlePrice}
            />
            <button
              onClick={() => setShowPigmentEditor(true)}
              className="text-xs text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded transition-colors"
              title="Edit pigment prices"
            >
              ⚗ Prices
            </button>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 pb-0">
          {[['colors', 'Colors'], ['planner', 'Production Planner']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`text-sm px-4 py-2 border-b-2 transition-colors ${
                tab === key
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {loadError && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="rounded-lg bg-red-400/10 border border-red-400/20 px-4 py-3 text-sm text-red-400">
            Failed to load data: {loadError}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-24">
          <p className="text-slate-500 text-sm">Loading…</p>
        </div>
      )}

      {!loading && tab === 'colors' && (
        <>
          <div className="max-w-7xl mx-auto px-4 py-4">
            <FilterBar
              search={search} setSearch={setSearch}
              brand={brand}   setBrand={setBrand}
              variant={variant} setVariant={setVariant}
            />
          </div>
          <div className="max-w-7xl mx-auto px-4 pb-2">
            <p className="text-xs text-slate-500">{filtered.length} of {paints.length} colors</p>
          </div>
          <main className="max-w-7xl mx-auto px-4 pb-12">
            <PaintTable
              paints={filtered}
              targetVolume={targetVolume}
              bottlePrice={bottlePrice}
              pigmentPrices={pigmentPrices}
              onSelect={setSelectedPaint}
              onEdit={p => setEditingPaint(p)}
              onDelete={p => setDeletingPaint(p)}
              onAdd={() => setEditingPaint({})}
            />
          </main>
        </>
      )}

      {!loading && tab === 'planner' && (
        <div className="pt-6">
          <ProductionPlanner
            paints={paints}
            defaultVolume={targetVolume}
            pigmentPrices={pigmentPrices}
          />
        </div>
      )}

      {/* Recipe modal */}
      {selectedPaint && (
        <RecipeModal
          paint={selectedPaint}
          targetVolume={targetVolume}
          bottlePrice={bottlePrice}
          pigmentPrices={pigmentPrices}
          allPaints={paints}
          onClose={() => setSelectedPaint(null)}
          onNavigate={p => setSelectedPaint(p)}
          onEdit={p => { setSelectedPaint(null); setEditingPaint(p) }}
        />
      )}

      {/* Color editor modal */}
      {editingPaint !== null && (
        <ColorEditor
          paint={Object.keys(editingPaint).length > 0 ? editingPaint : null}
          onClose={() => setEditingPaint(null)}
          onSaved={handleColorSaved}
        />
      )}

      {/* Pigment price editor */}
      {showPigmentEditor && (
        <PigmentPriceEditor
          pigments={pigments}
          onClose={() => setShowPigmentEditor(false)}
          onUpdated={handlePigmentUpdated}
        />
      )}

      {/* Delete confirmation */}
      {deletingPaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-slate-800 border border-slate-700 shadow-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-100">Delete Color</h2>
            <p className="text-sm text-slate-400">
              Delete <span className="text-amber-400 font-mono">{deletingPaint.id}</span> — {deletingPaint.name}? This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeletingPaint(null)}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded px-4 py-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingPaint)}
                className="bg-red-500 hover:bg-red-400 text-white text-sm font-semibold rounded px-4 py-2 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
