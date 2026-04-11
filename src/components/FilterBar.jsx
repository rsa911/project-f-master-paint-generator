const BRANDS = ['All', 'AK', 'Citadel', 'AP']
const VARIANTS = ['All', 'Base', 'Tint (-T)', 'Grey (-G)', 'Shadow (-S)']

export default function FilterBar({ search, setSearch, brand, setBrand, variant, setVariant }) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <input
        type="text"
        placeholder="Search colors…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="flex-1 min-w-[160px] bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
      />

      {/* Brand filter */}
      <div className="flex gap-1">
        {BRANDS.map(b => (
          <button
            key={b}
            onClick={() => setBrand(b)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              brand === b
                ? 'bg-amber-400 text-slate-900'
                : 'bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-700'
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Variant filter */}
      <div className="flex gap-1">
        {VARIANTS.map(v => (
          <button
            key={v}
            onClick={() => setVariant(v)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              variant === v
                ? 'bg-amber-400 text-slate-900'
                : 'bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-700'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}
