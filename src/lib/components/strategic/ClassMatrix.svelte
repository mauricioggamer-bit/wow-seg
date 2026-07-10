<script lang="ts">
  import { CLASS_MAP, PERS_CLASS_COLORS, PERS_CLASS_ICONS } from '../../constants'
  import EntityMatrix from './EntityMatrix.svelte'
  import type { StrategicIndex, StrategicCategory } from '../../types'

  let { indexes, categories }: {
    indexes: StrategicIndex[]
    categories: StrategicCategory[]
  } = $props()

  let columns = $derived(
    Object.entries(CLASS_MAP)
      .map(([label, key]) => ({
        id: label,
        label,
        color: PERS_CLASS_COLORS[key] || '#c69b3a',
        icon: PERS_CLASS_ICONS[key] || '❓',
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  )
</script>

<EntityMatrix entityType="class" {columns} {indexes} {categories} />
