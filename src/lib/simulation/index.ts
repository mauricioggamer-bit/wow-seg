export type {
  CharacterSnapshot,
  GlobalBuff,
  SimulationScenario,
  SimulationContext,
  ActiveBuff,
  SimulationState,
  ModifierContribution,
  DungeonXpBreakdown,
  SimulationStep,
  SimulationMetrics,
  SimulationWarning,
  EventLogEntry,
  SimulationResult,
  CharacterResult,
  RosterSimulationResult,
  SimulationHooks,
} from './types'

export { TypedEventBus } from './event-bus'
export type { DungeonCompletedPayload, LevelUpPayload, TargetReachedPayload, BreakpointUnlockedPayload, SimulationFinishedPayload, EventPayloadMap, EventName } from './event-bus'

export {
  getXpForLevel,
  getDungeonXpForLevel,
  getMonsterXpForLevel,
  getXpOverrides,
  saveXpOverrides,
  clearXpOverrides,
  getDungeonXpOverrides,
  saveDungeonXpOverrides,
  clearDungeonXpOverrides,
} from './tables'

export type { GameModel, LevelUpEffects } from './game-model'
export { WoWRetailModel } from './game-model/wow-retail'

export { createContext, createState, createLevelState } from './context'

export { buildBreakdown } from './breakdown'

export { getDungeonXpAtLevel, getBuffPercentages, getXpRequired } from './domain'

export { defaultHooks } from './hooks'

export { simulateCharacter, simulateRoster, simulateRosterWithContext, computeMetrics, computeWarnings } from './kernel'
