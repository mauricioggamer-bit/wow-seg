import type { CharacterSnapshot, SimulationContext, RosterSimulationResult } from '../simulation/types'

export interface Strategy {
  readonly name: string
  optimize(
    roster: CharacterSnapshot[],
    context: SimulationContext,
    simulate: (roster: CharacterSnapshot[], order: string[]) => RosterSimulationResult,
  ): OptimizationPlan
}

export interface OptimizationPlan {
  order: string[]
  totalTime: number
}
