import { describe, it, expect } from 'vitest'
import { parseSkipSpecs, applySkipSpecs, stripSkipSpecs } from '../specConditional'

describe('specConditional', () => {
  it('parses a single spec id from a real show string', () => {
    expect(parseSkipSpecs('[spec:259] hide;')).toEqual([259])
  })

  it('parses multiple spec ids joined by /', () => {
    expect(parseSkipSpecs('[spec:259/264] hide;')).toEqual([259, 264])
  })

  it('returns an empty list when there is no skip-spec prefix', () => {
    expect(parseSkipSpecs(undefined)).toEqual([])
    expect(parseSkipSpecs('[combat] hide;')).toEqual([])
  })

  it('applySkipSpecs generates the prefix and strips it when empty', () => {
    expect(applySkipSpecs(undefined, [259])).toBe('[spec:259] hide;')
    expect(applySkipSpecs(undefined, [259, 264])).toBe('[spec:259/264] hide;')
    expect(applySkipSpecs('[spec:259] hide;', [])).toBeUndefined()
  })

  it('preserves any other manually-typed condition that follows the prefix', () => {
    const show = applySkipSpecs('[combat] hide;', [259])
    expect(show).toBe('[spec:259] hide; [combat] hide;')
    expect(parseSkipSpecs(show)).toEqual([259])
    expect(stripSkipSpecs(show)).toBe('[combat] hide;')
  })

  it('round-trips through parse -> apply without losing the trailing condition', () => {
    const original = '[spec:259/264] hide; [mod] show'
    const specs = parseSkipSpecs(original)
    const rest = stripSkipSpecs(original)
    expect(applySkipSpecs(rest, specs)).toBe(original)
  })
})
