import colorMap from '../constants/colorMap'

export default function ColorSwatch({ id, size = 'sm', className = '' }) {
  const hex = colorMap[id] ?? '#6B7280'

  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  }

  return (
    <span
      className={`inline-block rounded-full border border-slate-600 flex-shrink-0 ${sizeClasses[size] ?? sizeClasses.sm} ${className}`}
      style={{ backgroundColor: hex }}
      title={hex}
    />
  )
}
