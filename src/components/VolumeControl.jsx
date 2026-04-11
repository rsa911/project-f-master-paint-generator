export default function VolumeControl({ targetVolume, setTargetVolume, bottlePrice, setBottlePrice }) {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-400 whitespace-nowrap">Target Volume</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="1"
            max="100"
            step="0.5"
            value={targetVolume}
            onChange={e => setTargetVolume(Math.max(0.5, parseFloat(e.target.value) || 15))}
            className="w-20 bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-amber-400 font-mono text-center focus:outline-none focus:border-amber-400"
          />
          <span className="text-xs text-slate-500">ml</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-400 whitespace-nowrap">Bottle Price</label>
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500">$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={bottlePrice}
            onChange={e => setBottlePrice(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-20 bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-amber-400 font-mono text-center focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>
    </div>
  )
}
