import { useState, useMemo } from 'react'
import ColorSwatch from './ColorSwatch'
import PaintCard from './PaintCard'
import { scaleFormula, calcCost } from '../utils/formula'

const COLS = [
  { key: 'id',           label: 'ID',           mono: true },
  { key: 'swatch',       label: '',             mono: false, nosort: true },
  { key: 'name',         label: 'Name',         mono: false },
  { key: 'formula',      label: 'Formula',      mono: true,  nosort: true },
  { key: 'brand',        label: 'Brand',        mono: false },
  { key: 'hobbyColor',   label: 'Hobby Match',  mono: false },
  { key: 'contrastPaint',label: 'Contrast',     mono: false },
  { key: 'cost',         label: 'Cost',         mono: true },
  { key: 'actions',      label: '',             mono: false, nosort: true },
]

function SortIcon({ dir }) {
  return <span className="ml-1 text-amber-400 text-xs">{dir === 'asc' ? '▲' : '▼'}</span>
}

export default function PaintTable({
  paints, targetVolume, bottlePrice, pigmentPrices,
  onSelect, onEdit, onDelete, onAdd,
}) {
  const [sortKey, setSortKey] = useState('id')
  const [sortDir, setSortDir] = useState('asc')

  function handleSort(key) {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = useMemo(() => {
    return [...paints].sort((a, b) => {
      let av, bv
      if (sortKey === 'cost') {
        av = calcCost(a.formula, targetVolume, bottlePrice, pigmentPrices)
        bv = calcCost(b.formula, targetVolume, bottlePrice, pigmentPrices)
      } else if (sortKey === 'id') {
        av = a.sortOrder ?? 9999
        bv = b.sortOrder ?? 9999
      } else {
        av = a[sortKey] ?? ''
        bv = b[sortKey] ?? ''
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [paints, sortKey, sortDir, targetVolume, bottlePrice, pigmentPrices])

  return (
    <>
      {/* Mobile: card grid */}
      <div className="grid gap-3 sm:grid-cols-2 md:hidden">
        {sorted.map(paint => (
          <PaintCard
            key={paint.id}
            paint={paint}
            targetVolume={targetVolume}
            bottlePrice={bottlePrice}
            pigmentPrices={pigmentPrices}
            onClick={onSelect}
          />
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-700">
        <div className="flex justify-end px-4 py-2 bg-slate-800/50 border-b border-slate-700">
          <button
            onClick={onAdd}
            className="text-xs bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold px-3 py-1.5 rounded transition-colors"
          >
            + Add Color
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700">
              {COLS.map(col => (
                <th
                  key={col.key}
                  onClick={() => !col.nosort && handleSort(col.key)}
                  className={`px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap select-none ${
                    !col.nosort ? 'cursor-pointer hover:text-slate-200' : ''
                  }`}
                >
                  {col.label}
                  {sortKey === col.key && <SortIcon dir={sortDir} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((paint, i) => {
              const formulaStr = scaleFormula(paint.formula, targetVolume)
              const cost = calcCost(paint.formula, targetVolume, bottlePrice, pigmentPrices)
              return (
                <tr
                  key={paint.id}
                  className={`border-b border-slate-700/50 ${
                    i % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-800/30'
                  }`}
                >
                  <td
                    className="px-4 py-3 font-mono text-amber-400 text-xs cursor-pointer hover:text-amber-300"
                    onClick={() => onSelect(paint)}
                  >{paint.id}</td>
                  <td className="px-2 py-3 cursor-pointer" onClick={() => onSelect(paint)}>
                    <ColorSwatch hex={paint.hex} size="sm" />
                  </td>
                  <td
                    className="px-4 py-3 text-slate-100 font-medium cursor-pointer hover:text-white"
                    onClick={() => onSelect(paint)}
                  >{paint.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-xs max-w-[220px] truncate">{formulaStr}</td>
                  <td className="px-4 py-3 text-slate-400">{paint.brand}</td>
                  <td className="px-4 py-3 text-slate-400 max-w-[140px] truncate">{paint.hobbyColor}</td>
                  <td className="px-4 py-3 text-slate-400 max-w-[140px] truncate">{paint.contrastPaint}</td>
                  <td className="px-4 py-3 font-mono text-slate-300 text-xs">${cost}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={e => { e.stopPropagation(); onEdit(paint) }}
                        className="text-xs text-slate-400 hover:text-amber-400 px-2 py-1 rounded hover:bg-slate-700 transition-colors"
                        title="Edit"
                      >✎</button>
                      <button
                        onClick={e => { e.stopPropagation(); onDelete(paint) }}
                        className="text-xs text-slate-400 hover:text-red-400 px-2 py-1 rounded hover:bg-slate-700 transition-colors"
                        title="Delete"
                      >✕</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="py-16 text-center text-slate-500 text-sm">No colors match your filters.</div>
        )}
      </div>
    </>
  )
}
