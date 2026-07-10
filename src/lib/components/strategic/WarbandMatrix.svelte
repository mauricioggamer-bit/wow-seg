<script lang="ts">
  import EntityMatrix from './EntityMatrix.svelte'
  import type { StrategicIndex, StrategicCategory, Warband } from '../../types'

  let { indexes, categories, warbands }: {
    indexes: StrategicIndex[]
    categories: StrategicCategory[]
    warbands: Warband[]
  } = $props()

  let columns = $derived(
    warbands
      .map(w => ({
        id: w.nombre,
        label: w.nombre,
        color: 'var(--gold)',
        icon: '🛡',
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  )
</script>

<EntityMatrix entityType="warband" {columns} {indexes} {categories} />
