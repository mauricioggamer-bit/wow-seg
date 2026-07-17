import type { Personaje } from '../types'

export function tieneMainCrafter(roster: Personaje[], profesionId: string): boolean {
  return roster.some(p =>
    p.profesiones?.some(pr =>
      pr.id === profesionId && (pr.rol === '1ro' || pr.esMainCrafter === true || (pr.completadas.length > 0 && pr.rol !== '2do'))
    ) ?? false
  )
}

export function computeCoberturaProfesiones(
  roster: Personaje[],
  profesionIds: string[],
): number {
  return profesionIds.filter(id => tieneMainCrafter(roster, id)).length
}
