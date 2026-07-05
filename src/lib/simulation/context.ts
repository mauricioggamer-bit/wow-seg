import type { SimulationContext, SimulationState, CharacterSnapshot, SimulationScenario } from './types'
import type { LevelingConfig } from '../types'

export function createContext(
  character: CharacterSnapshot,
  scenario: SimulationScenario,
  config: LevelingConfig,
  rosterCount90 = 0,
): SimulationContext {
  return {
    character: { ...character },
    scenario: { ...scenario },
    config: { ...config },
    rosterCount90,
  }
}

export function createState(character: CharacterSnapshot): SimulationState {
  return {
    level: character.nivel,
    xp: character.xp,
    totalTime: 0,
    totalDungeons: 0,
    totalXP: 0,
    activeBuffs: [],
    breakpointsUnlocked: [],
  }
}
