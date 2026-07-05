import type { Decision, Strategy } from './strategy'

export function swapPositions(strategy: Strategy, i: number, j: number): Strategy {
  const n = strategy.decisiones.length
  if (i === j || i < 0 || j < 0 || i >= n || j >= n) return strategy
  const decisiones = [...strategy.decisiones]
  const tmp = decisiones[i]
  decisiones[i] = decisiones[j]
  decisiones[j] = tmp
  const reindexed: Decision[] = decisiones.map((d, idx) => ({
    personaje: d.personaje,
    accion: d.accion,
    ordenPrioridad: idx + 1,
  }))
  return { nombre: strategy.nombre, decisiones: reindexed }
}

export function changeAccion(
  strategy: Strategy,
  i: number,
  nuevaAccion: Decision['accion'],
): Strategy {
  const n = strategy.decisiones.length
  if (i < 0 || i >= n) return strategy
  const currentAction = strategy.decisiones[i].accion
  if (currentAction === nuevaAccion) return strategy
  const decisiones: Decision[] = strategy.decisiones.map((d, idx) =>
    idx === i ? { personaje: d.personaje, accion: nuevaAccion, ordenPrioridad: d.ordenPrioridad } : d,
  )
  return { nombre: strategy.nombre, decisiones }
}

const ALL_ACTIONS: Decision['accion'][] = ['subir-a-90', 'subir-a-80', 'saltear']

function pickOtherAction(current: Decision['accion'], rng: () => number): Decision['accion'] {
  const others = ALL_ACTIONS.filter(a => a !== current)
  return others[Math.floor(rng() * others.length)]
}

function encodeKey(decisiones: Decision[]): string {
  let key = ''
  for (let i = 0; i < decisiones.length; i++) {
    if (i > 0) key += '|'
    key += decisiones[i].personaje.nombre + ':' + decisiones[i].accion
  }
  return key
}

function sampleIndexBiased(rng: () => number, n: number, activeWindowSize: number): number {
  if (activeWindowSize <= 0 || activeWindowSize >= n) return Math.floor(rng() * n)
  if (rng() < 0.8) {
    return Math.floor(rng() * activeWindowSize)
  }
  return activeWindowSize + Math.floor(rng() * (n - activeWindowSize))
}

export function generateNeighbors(
  strategy: Strategy,
  rng: () => number,
  maxNeighbors: number,
  activeWindowSize?: number,
): Strategy[] {
  const n = strategy.decisiones.length
  if (n <= 1) return []

  const neighbors: Strategy[] = []
  const seen = new Set<string>()

  const activeWindow = activeWindowSize ?? n

  const maxAttempts = Math.max(maxNeighbors * 5, 50)
  for (let attempt = 0; attempt < maxAttempts && neighbors.length < maxNeighbors; attempt++) {
    const isSwap = n >= 2 && rng() < 0.7
    let candidate: Strategy

    if (isSwap) {
      const i = sampleIndexBiased(rng, n, activeWindow)
      let j = sampleIndexBiased(rng, n, activeWindow)
      while (j === i) j = sampleIndexBiased(rng, n, activeWindow)
      candidate = swapPositions(strategy, i, j)
    } else {
      const i = sampleIndexBiased(rng, n, activeWindow)
      const currentAction = strategy.decisiones[i].accion
      const nuevaAccion = pickOtherAction(currentAction, rng)
      candidate = changeAccion(strategy, i, nuevaAccion)
    }

    const key = encodeKey(candidate.decisiones)
    if (!seen.has(key)) {
      seen.add(key)
      neighbors.push(candidate)
    }
  }

  return neighbors
}
