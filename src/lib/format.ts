export function formatNumber(n: number): string {
  return n.toLocaleString('es-ES')
}

export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}min`
  if (hours < 10) return `${hours.toFixed(1)}h`
  return `${Math.round(hours)}h`
}
