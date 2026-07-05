import type { SimulationHooks } from './types'

export const defaultHooks: SimulationHooks = {
  beforeDungeon: () => {},
  afterDungeon: () => {},
  beforeLevelUp: () => {},
  afterLevelUp: () => {},
  afterSimulation: () => {},
}
