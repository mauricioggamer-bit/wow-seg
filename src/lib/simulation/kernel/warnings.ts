import type { SimulationContext, SimulationWarning } from '../types'

export function computeWarnings(context: SimulationContext): SimulationWarning[] {
  const warnings: SimulationWarning[] = []

  warnings.push({
    code: 'EXTRAPOLATED_MONSTER_XP',
    message: 'La XP de monstruos se escala desde el nivel 80. Puede no reflejar valores reales en otros niveles.',
    level: context.character.nivel,
  })

  if (context.scenario.activeEvent) {
    warnings.push({
      code: 'ACTIVE_EVENT',
      message: `Evento activo: ${context.scenario.activeEvent}. La XP puede diferir.`,
    })
  }

  return warnings
}
