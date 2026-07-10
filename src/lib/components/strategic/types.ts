import type { EntityType } from '../../types'

export interface EntityItem {
  id: string
  label: string
  sub?: string
}

export interface EntityKind {
  key: EntityType
  label: string
  items: EntityItem[]
}
