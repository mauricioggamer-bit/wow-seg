/**
 * Encodes/decodes the "skip by spec" prefix OPie's ring editor merges into a
 * slice's `show` conditional (see RingEdit.lua's skipSpecs dropdown): a
 * leading `[spec:ID1/ID2] hide;` clause, using global specialization IDs
 * (see specTable.ts). Parsing/generating is tolerant of any other manually
 * typed conditions that follow it in `show` — those are preserved as-is.
 */
const SPEC_PREFIX_RE = /^\[spec:([\d/]+)\]\s*hide;\s*/

export function parseSkipSpecs(show: string | undefined): number[] {
  if (!show) return []
  const m = show.match(SPEC_PREFIX_RE)
  if (!m) return []
  return m[1].split('/').map(Number).filter((n) => !isNaN(n))
}

export function stripSkipSpecs(show: string | undefined): string {
  return (show ?? '').replace(SPEC_PREFIX_RE, '')
}

export function applySkipSpecs(show: string | undefined, specIds: number[]): string | undefined {
  const rest = stripSkipSpecs(show)
  if (specIds.length === 0) return rest || undefined
  const prefix = `[spec:${specIds.join('/')}] hide;`
  return rest ? `${prefix} ${rest}` : prefix
}
