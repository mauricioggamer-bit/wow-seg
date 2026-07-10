<script lang="ts">
  import { PERS_RACE_INFO, PERS_RACES_BY_COLUMN } from '../../constants'
  import EntityMatrix from './EntityMatrix.svelte'
  import type { StrategicIndex, StrategicCategory } from '../../types'

  let { indexes, categories }: {
    indexes: StrategicIndex[]
    categories: StrategicCategory[]
  } = $props()

  const allianceRaces = new Set([...(PERS_RACES_BY_COLUMN['alliance-trad'] ?? []), ...(PERS_RACES_BY_COLUMN['alliance-allied'] ?? [])])
  const hordeRaces = new Set([...(PERS_RACES_BY_COLUMN['horde-trad'] ?? []), ...(PERS_RACES_BY_COLUMN['horde-allied'] ?? [])])

  function colorFor(race: string): string {
    const inA = allianceRaces.has(race)
    const inH = hordeRaces.has(race)
    if (inA && !inH) return 'var(--alliance)'
    if (inH && !inA) return 'var(--horde)'
    return 'var(--gold)'
  }

  let columns = $derived(
    Object.keys(PERS_RACE_INFO)
      .map(race => ({
        id: race,
        label: race,
        color: colorFor(race),
        icon: PERS_RACE_INFO[race]?.icon || '❓',
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  )
</script>

<EntityMatrix entityType="race" {columns} {indexes} {categories} />
