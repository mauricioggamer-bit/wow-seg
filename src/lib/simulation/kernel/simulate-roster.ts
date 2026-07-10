import type { CharacterSnapshot, SimulationScenario, SimulationContext, SimulationState, SimulationResult, CharacterResult, RosterSimulationResult, SimulationHooks } from '../types'
import type { LevelingConfig } from '../../types'
import type { GameModel } from '../game-model/types'
import { TypedEventBus } from '../event-bus'
import { createContext, createState } from '../context'
import { simulateCharacter } from './simulate-character'
import { defaultHooks } from '../hooks'

export function simulateRoster(
  roster: CharacterSnapshot[],
  scenario: SimulationScenario,
  config: LevelingConfig,
  gameModel: GameModel,
  order: string[],
  eventBus = new TypedEventBus(),
  hooks: SimulationHooks = defaultHooks,
): RosterSimulationResult {
  let count90 = roster.filter(c => c.nivel >= gameModel.getMaxLevel()).length
  const results: CharacterResult[] = []
  let totalTime = 0

  for (const name of order) {
    const char = roster.find(c => c.nombre === name)
    if (!char) continue

    const context = createContext(char, scenario, config, count90)
    const state = createState(char)
    const result = simulateCharacter(context, state, gameModel, eventBus, hooks)

    results.push({ nombre: char.nombre, result })
    totalTime += result.metrics.totalTime

    if (char.nivel < gameModel.getMaxLevel() && result.finalState.level >= gameModel.getMaxLevel()) {
      count90++
    }
  }

  return { results, totalTime }
}

export function simulateRosterWithContext(
  roster: CharacterSnapshot[],
  baseContext: Omit<SimulationContext, 'character' | 'rosterCount90'>,
  gameModel: GameModel,
  order: string[],
  eventBus = new TypedEventBus(),
  hooks: SimulationHooks = defaultHooks,
): RosterSimulationResult {
  let count90 = roster.filter(c => c.nivel >= gameModel.getMaxLevel()).length
  const results: CharacterResult[] = []
  let totalTime = 0

  for (const name of order) {
    const char = roster.find(c => c.nombre === name)
    if (!char) continue

    const context: SimulationContext = {
      character: { ...char },
      scenario: baseContext.scenario,
      config: baseContext.config,
      rosterCount90: count90,
    }
    const state: SimulationState = createState(char)
    const result = simulateCharacter(context, state, gameModel, eventBus, hooks)

    results.push({ nombre: char.nombre, result })
    totalTime += result.metrics.totalTime

    if (char.nivel < gameModel.getMaxLevel() && result.finalState.level >= gameModel.getMaxLevel()) {
      count90++
    }
  }

  return { results, totalTime }
}
