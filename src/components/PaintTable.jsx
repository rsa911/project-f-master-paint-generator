import { useState, useMemo } from 'react'
import ColorSwatch from './ColorSwatch'
import PaintCard from './PaintCard'
import { scaleFormula, calcCost } from '../utils/formula'

const COLS = [
  { key: 'id',    label: 'ID',      mono: true },
  { key: 'swatch',label: '',        mono: false, nosort: true },
  { key: 'name',  label: 'Name',    mono: false },
  { key: 'formula', label: 'Formula', mono: true, nosort: true },
  { key: 'brand', label: 'Brand',   mono: false },
  { key: 'hobbyColor', label: 'Hobby Match', mono: false },
  { key: 'contrastPaint', label: 'Contrast', mono: false },
  { key: 'cost',  label: 'Cost',    mono: true },
]

function SortIcon({ dir }) {
  return (
    <span className="ml-1 text-amber-400 text-xs">{dir === 'asc' ? '▲' : '▼'}</span>
  )
}

export default function PaintTable({ paints, targetVolume, bottlePrice, onSelect }) {
  const [sortKey, setSortKey] = useState('id')
  const [sortDir, setSortDir] = useState('asc')

  function handleSort(key) {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    return [...paints].sort((a, b) => {
      let av, bv
      if (sortKey === 'cost') {
        av = calcCost(a.formulaDrops, targetVolume, bottlePrice)
        bv = calcCost(b.formulaDrops, targetVolume, bottlePrice)
      } else if (sortKey === 'id') {
        // Sort numerically by family number, then by variant
        const varOrder = { '': 0, '-T': 1, '-G': 2, '-S': 3 }
        const parseId = id => {
          const m = id.match(/^(\d+)(-[TGS])?$/)
          return m ? [parseInt(m[1]), varOrder[m[2] ?? '']] : [999, 0]
        }
        const [an, ao] = parseId(a.id)
        const [bn, bo] = parseId(b.id)
        av = an * 10 + ao
        bv = bn * 10 + bo
      } else {
        av = a[sortKey] ?? ''
        bv = b[sortKey] ?? ''
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [paints, sortKey, sortDir, targetVolume, bottlePrice])

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
            onClick={onSelect}
          />
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-700">
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
              const formula = scaleFormula(paint.formulaDrops, targetVolume)
              const cost = calcCost(paint.formulaDrops, targetVolume, bottlePrice)
              return (
                <tr
                  key={paint.id}
                  onClick={() => onSelect(paint)}
                  className={`cursor-pointer border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors ${
                    i % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-800/30'
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-amber-400 text-xs">{paint.id}</td>
                  <td className="px-2 py-3">
                    <ColorSwatch id={paint.id} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-slate-100 font-medium">{paint.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-xs max-w-[220px] truncate">{formula}</td>
                  <td className="px-4 py-3 text-slate-400">{paint.brand}</td>
                  <td className="px-4 py-3 text-slate-400 max-w-[140px] truncate">{paint.hobbyColor}</td>
                  <td className="px-4 py-3 text-slate-400 max-w-[140px] truncate">{paint.contrastPaint}</td>
                  <td className="px-4 py-3 font-mono text-slate-300 text-xs">${cost}</td>
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
