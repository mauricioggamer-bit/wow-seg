import type { SimulationState, SimulationStep, SimulationResult } from './types'

export interface DungeonCompletedPayload {
  step: SimulationStep
  state: SimulationState
}

export interface LevelUpPayload {
  level: number
  state: SimulationState
}

export interface TargetReachedPayload {
  state: SimulationState
}

export interface BreakpointUnlockedPayload {
  breakpoint: string
  state: SimulationState
}

export interface SimulationFinishedPayload {
  result: SimulationResult
}

export interface EventPayloadMap {
  'dungeon-completed': DungeonCompletedPayload
  'level-up': LevelUpPayload
  'target-reached': TargetReachedPayload
  'breakpoint-unlocked': BreakpointUnlockedPayload
  'simulation-finished': SimulationFinishedPayload
}

export type EventName = keyof EventPayloadMap

type Listener<E extends EventName> = (data: EventPayloadMap[E]) => void

export class TypedEventBus {
  private listeners = new Map<string, Set<Listener<any>>>()

  on<E extends EventName>(event: E, handler: Listener<E>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)
    return () => this.off(event, handler)
  }

  off<E extends EventName>(event: E, handler: Listener<E>): void {
    this.listeners.get(event)?.delete(handler)
  }

  emit<E extends EventName>(event: E, data: EventPayloadMap[E]): void {
    this.listeners.get(event)?.forEach(h => h(data))
  }

  clear(): void {
    this.listeners.clear()
  }
}
