<script lang="ts">
  import { PROFESIONES } from '../../constants/profesiones'
  import { RACE_PROFESSION_BONUS } from '../../constants'
  import EntityMatrix from './EntityMatrix.svelte'
  import type { StrategicIndex, StrategicCategory } from '../../types'

  let { indexes, categories }: {
    indexes: StrategicIndex[]
    categories: StrategicCategory[]
  } = $props()

  let allProfItems = $derived([...PROFESIONES, { id: 'cocina', nombre: 'Cocina', icon: '🍳' }])

  let columns = $derived(
    allProfItems
      .map(p => ({
        id: p.id,
        label: p.nombre,
        color: 'var(--gold)',
        icon: p.icon,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  )

  let racialBonusRows = $derived.by(() => {
    const rows: { label: string; values: Record<string, number> }[] = []
    for (const [race, bonuses] of Object.entries(RACE_PROFESSION_BONUS)) {
      const values: Record<string, number> = {}
      for (const b of bonuses) {
        if (b.profId === '*') {
          for (const p of PROFESIONES) values[p.id] = (values[p.id] ?? 0) + b.bonus
        } else {
          values[b.profId] = (values[b.profId] ?? 0) + b.bonus
        }
      }
      rows.push({ label: race, values })
    }
    return rows
  })
</script>

<EntityMatrix entityType="profession" {columns} {indexes} {categories} extraRows={racialBonusRows} extraRowsLabel="Bonos raciales fijos" />
