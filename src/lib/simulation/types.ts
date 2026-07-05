import type { LevelingConfig } from '../types'

export interface CharacterSnapshot {
  nombre: string
  clase: string
  nivel: number
  xp: number
  objetivo: number
  timewaysPct: number
}

export interface GlobalBuff {
  id: string
  name: string
  pct: number
}

export interface SimulationScenario {
  expansion: string
  version: string
  activeEvent: string | null
  dungeonDuration: number
  globalBuffs: GlobalBuff[]
}

export interface SimulationContext {
  readonly character: CharacterSnapshot
  readonly scenario: SimulationScenario
  readonly config: LevelingConfig
  readonly rosterCount90: number
}

export interface ActiveBuff {
  id: string
  name: string
  pct: number
  source: 'monsters' | 'reward' | 'both'
}

export interface SimulationState {
  level: number
  xp: number
  totalTime: number
  totalDungeons: number
  totalXP: number
  activeBuffs: ActiveBuff[]
  breakpointsUnlocked: string[]
}

export interface ModifierContribution {
  id: string
  name: string
  pct: number
  contribution: number
  runningTotal: number
}

export interface DungeonXpBreakdown {
  baseRewardXP: number
  baseMonsterXP: number
  totalBaseXP: number
  rewardModifiers: ModifierContribution[]
  monsterModifiers: ModifierContribution[]
  totalXP: number
}

export interface SimulationStep {
  dungeonNumber: number
  levelBefore: number
  levelAfter: number
  xpBefore: number
  xpAfter: number
  rewardXP: number
  monsterXP: number
  totalXP: number
  modifiers: ModifierContribution[]
  activeBuffs: ActiveBuff[]
  cumulativeTime: number
  cumulativeDungeons: number
  cumulativeXP: number
  breakpointsUnlocked: string[]
  eventsGenerated: string[]
}

export interface SimulationMetrics {
  totalXP: number
  totalTime: number
  totalDungeons: number
  xpPerHour: number
  xpPerDungeon: number
  averageDungeonTime: number
  dungeonsPerLevel: Record<number, number>
  efficiency: number
  xpPerLevel: Record<number, number>
}

export interface SimulationWarning {
  code: string
  message: string
  level?: number
}

export interface EventLogEntry {
  type: string
  timestamp: number
  data: unknown
}

export interface SimulationResult {
  context: SimulationContext
  finalState: SimulationState
  history: SimulationStep[]
  metrics: SimulationMetrics
  warnings: SimulationWarning[]
  generatedEvents: EventLogEntry[]
}

export interface CharacterResult {
  nombre: string
  result: SimulationResult
}

export interface RosterSimulationResult {
  results: CharacterResult[]
  totalTime: number
}

export interface SimulationHooks {
  beforeDungeon?: (state: SimulationState, context: SimulationContext) => void
  afterDungeon?: (state: SimulationState, step: SimulationStep, context: SimulationContext) => void
  beforeLevelUp?: (state: SimulationState, context: SimulationContext) => void
  afterLevelUp?: (state: SimulationState, context: SimulationContext) => void
  afterSimulation?: (result: SimulationResult) => void
}
