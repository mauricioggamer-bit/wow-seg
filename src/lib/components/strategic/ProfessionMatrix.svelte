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

  function profLabel(id: string): string {
    return allProfItems.find(p => p.id === id)?.nombre ?? id
  }

  let racialBonusRows = $derived.by(() => {
    const rows: { race: string; prof: string; bonus: number; note?: string }[] = []
    for (const [race, bonuses] of Object.entries(RACE_PROFESSION_BONUS)) {
      for (const b of bonuses) {
        rows.push({
          race,
          prof: b.profId === '*' ? 'todas las primarias' : profLabel(b.profId),
          bonus: b.bonus,
          note: b.note,
        })
      }
    }
    return rows
  })
</script>

<EntityMatrix entityType="profession" {columns} {indexes} {categories} />

{#if racialBonusRows.length > 0}
  <div class="pmx-bonus-box">
    <h4 class="pmx-bonus-title">Bonos raciales fijos (no forman parte de esta tabla)</h4>
    <ul class="pmx-bonus-list">
      {#each racialBonusRows as r}
        <li>{r.race}: +{r.bonus} en {r.prof}{r.note ? ` (${r.note})` : ''}</li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  .pmx-bonus-box {
    margin-top: 8px;
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    padding: 6px 8px;
  }
  .pmx-bonus-title {
    font-size: 0.6rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0 0 4px;
  }
  .pmx-bonus-list {
    margin: 0;
    padding-left: 16px;
    font-size: 0.55rem;
    color: var(--text-secondary);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
</style>
