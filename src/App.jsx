import { useState, useMemo } from 'react'
import paints from './data/paints.json'
import FilterBar from './components/FilterBar'
import VolumeControl from './components/VolumeControl'
import PaintTable from './components/PaintTable'
import RecipeModal from './components/RecipeModal'

export default function App() {
  const [targetVolume, setTargetVolume] = useState(15)
  const [bottlePrice, setBottlePrice] = useState(0)
  const [search, setSearch] = useState('')
  const [brand, setBrand] = useState('All')
  const [variant, setVariant] = useState('All')
  const [selectedPaint, setSelectedPaint] = useState(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const variantSuffix = { 'Tint (-T)': '-T', 'Grey (-G)': '-G', 'Shadow (-S)': '-S' }
    return paints.filter(p => {
      if (search && !p.name.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q) && !p.hobbyColor.toLowerCase().includes(q)) return false
      if (brand !== 'All' && p.brand !== brand) return false
      if (variant === 'Base' && p.id.includes('-')) return false
      if (variant in variantSuffix && !p.id.endsWith(variantSuffix[variant])) return false
      return true
    })
  }, [search, brand, variant])

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
            <p className="text-xs text-slate-500 mt-0.5">CMY color system · {paints.length} recipes</p>
          </div>
          <VolumeControl
            targetVolume={targetVolume}
            setTargetVolume={setTargetVolume}
            bottlePrice={bottlePrice}
            setBottlePrice={setBottlePrice}
          />
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <FilterBar
          search={search}
          setSearch={setSearch}
          brand={brand}
          setBrand={setBrand}
          variant={variant}
          setVariant={setVariant}
        />
      </div>

      {/* Count */}
      <div className="max-w-7xl mx-auto px-4 pb-2">
        <p className="text-xs text-slate-500">
          {filtered.length} of {paints.length} colors
        </p>
      </div>

      {/* Table */}
      <main className="max-w-7xl mx-auto px-4 pb-12">
        <PaintTable
          paints={filtered}
          targetVolume={targetVolume}
          bottlePrice={bottlePrice}
          onSelect={setSelectedPaint}
        />
      </main>

      {/* Modal */}
      {selectedPaint && (
        <RecipeModal
          paint={selectedPaint}
          targetVolume={targetVolume}
          bottlePrice={bottlePrice}
          allPaints={paints}
          onClose={() => setSelectedPaint(null)}
          onNavigate={p => setSelectedPaint(p)}
        />
      )}
    </div>
  )
}
