import { describe, it, expect } from 'vitest'
import { createSeededRng } from '../seeded-rng'

describe('createSeededRng', () => {
  it('produces deterministic sequence for same seed', () => {
    const rng1 = createSeededRng(42)
    const rng2 = createSeededRng(42)
    for (let i = 0; i < 100; i++) {
      expect(rng1()).toBe(rng2())
    }
  })

  it('produces different sequences for different seeds', () => {
    const rng1 = createSeededRng(1)
    const rng2 = createSeededRng(2)
    const s1 = Array.from({ length: 10 }, () => rng1())
    const s2 = Array.from({ length: 10 }, () => rng2())
    expect(s1).not.toEqual(s2)
  })

  it('produces values in [0, 1) range', () => {
    const rng = createSeededRng(12345)
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('produces varied values (not all same)', () => {
    const rng = createSeededRng(99)
    const values = Array.from({ length: 50 }, () => rng())
    const unique = new Set(values.map(v => Math.floor(v * 100)))
    expect(unique.size).toBeGreaterThan(10)
  })

  it('supports seed 0', () => {
    const rng = createSeededRng(0)
    const v = rng()
    expect(v).toBeGreaterThanOrEqual(0)
    expect(v).toBeLessThan(1)
  })
})
