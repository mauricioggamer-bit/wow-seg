import type { Personaje, LevelingConfig } from '../types'
import type { RosterState } from './roster-state'
import {
  getWarbandMentor8090Pct,
  calculateForCharacter,
  getDungeonsNeeded,
  getTimeHours,
} from '../leveling/calculator'

export function computeFutureTimeSaved(
  personaje: Personaje,
  rosterState: RosterState,
  restoDelRoster: Personaje[],
  config: LevelingConfig,
): number {
  if (personaje.nivel >= 90) return 0

  const currentCount90 = rosterState.count90
  const futureCount90 = currentCount90 + 1

  const currentBuff = getWarbandMentor8090Pct(currentCount90)
  const futureBuff = getWarbandMentor8090Pct(futureCount90)
  if (futureBuff <= currentBuff) return 0

  let totalTimeSaved = 0

  for (const other of restoDelRoster) {
    if (other === personaje) continue
    if (!other.planeado_usar) continue
    if (other.nivel < 80 || other.nivel >= 90) continue

    const oldCalc = calculateForCharacter(other, config, currentCount90)
    const newCalc = calculateForCharacter(other, config, futureCount90)
    const xpRemaining = oldCalc.xpRemaining

    const savedDungeons = Math.max(
      0,
      getDungeonsNeeded(xpRemaining, oldCalc.xpPerDungeon) -
        getDungeonsNeeded(xpRemaining, newCalc.xpPerDungeon),
    )
    totalTimeSaved += getTimeHours(savedDungeons, config.duracionDungeon)
  }

  return totalTimeSaved
}
