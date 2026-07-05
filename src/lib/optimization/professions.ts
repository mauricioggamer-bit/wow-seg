import type { Personaje } from '../types'

export interface MainCrafterConfig {
  maxLevel: number
  mainCrafterLevel: number
}

export function getMainCrafterThreshold(config?: MainCrafterConfig): number {
  return config?.mainCrafterLevel ?? 100
}

export function tieneMainCrafter(roster: Personaje[], profesionId: string): boolean {
  const threshold = getMainCrafterThreshold()
  return roster.some(p =>
    p.profesiones?.some(pr =>
      pr.id === profesionId && (pr.esMainCrafter === true || pr.nivel >= threshold)
    ) ?? false
  )
}

export function computeCoberturaProfesiones(
  roster: Personaje[],
  profesionIds: string[],
): number {
  return profesionIds.filter(id => tieneMainCrafter(roster, id)).length
}
