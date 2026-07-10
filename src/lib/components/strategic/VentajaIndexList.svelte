<script lang="ts">
  import { dataStore } from '../../stores/data'
  import PointStepper from './PointStepper.svelte'
  import type { StrategicIndex, StrategicCategory, EntityType } from '../../types'

  let { entityType, entityId, indexes, categories }: {
    entityType: EntityType
    entityId: string
    indexes: StrategicIndex[]
    categories: StrategicCategory[]
  } = $props()

  let search = $state('')

  function valueFor(indexId: string): number | undefined {
    return dataStore.getStrategicValue(entityType, entityId, indexId)
  }

  function categoryLabel(ctx?: string): string {
    return categories.find(c => c.id === (ctx ?? 'general'))?.label ?? 'General'
  }

  let applicableIndexes = $derived(
    indexes.filter(i => !i.entityTypes || i.entityTypes.includes(entityType))
  )

  let groups = $derived.by(() => {
    const q = search.trim().toLowerCase()
    const filtered = q ? applicableIndexes.filter(i => i.name.toLowerCase().includes(q)) : applicableIndexes
    const byCategory = new Map<string, StrategicIndex[]>()
    for (const idx of filtered) {
      const catId = idx.context ?? 'general'
      if (!byCategory.has(catId)) byCategory.set(catId, [])
      byCategory.get(catId)!.push(idx)
    }
    const orderedCatIds = categories.map(c => c.id).filter(id => byCategory.has(id))
    for (const id of byCategory.keys()) {
      if (!orderedCatIds.includes(id)) orderedCatIds.push(id)
    }
    return orderedCatIds.map(catId => ({
      catId,
      label: categoryLabel(catId),
      items: byCategory.get(catId)!,
    }))
  })

  let total = $derived(
    applicableIndexes.reduce((sum, idx) => sum + (valueFor(idx.id) ?? 0), 0)
  )

  function confirmValue(indexId: string, v: number | undefined) {
    if (v === undefined) dataStore.resetStrategicValue(entityType, entityId, indexId)
    else dataStore.setStrategicValue(entityType, entityId, indexId, v)
  }
</script>

<div class="vil-root">
  <p class="vil-total">Total ventajas propias: <strong>{total} pts</strong></p>
  <input type="text" bind:value={search} placeholder="Buscar ventaja..." class="sv-text-input" />
  <div class="vil-groups">
    {#each groups as group (group.catId)}
      <div class="vil-group">
        <h4 class="ea-subheading">{group.label}</h4>
        <ul class="vil-rows">
          {#each group.items as idx (idx.id)}
            {@const value = valueFor(idx.id)}
            {@const assigned = value !== undefined}
            <li class="vil-row" class:vil-dim={!assigned}>
              <span class="vil-row-label">{idx.name}</span>
              <PointStepper {value} highlight={assigned} onConfirm={(v) => confirmValue(idx.id, v)} />
              {#if assigned}
                <button class="ea-icon-btn ea-icon-danger" title="Quitar" onclick={() => confirmValue(idx.id, undefined)}>✕</button>
              {:else}
                <span class="vil-row-spacer"></span>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/each}
    {#if groups.length === 0}
      <p class="sv-hint">Sin resultados.</p>
    {/if}
  </div>
</div>

<style>
  .vil-root {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .vil-total {
    font-size: 0.6rem;
    color: var(--text-primary);
    margin: 0;
  }
  .vil-groups {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 50vh;
    overflow-y: auto;
  }
  .vil-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .vil-rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .vil-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 3px 4px;
    border-bottom: 1px solid var(--border-subtle);
  }
  .vil-dim {
    opacity: 0.45;
  }
  .vil-dim:focus-within {
    opacity: 1;
  }
  .vil-row-label {
    flex: 1;
    min-width: 0;
    font-size: 0.6rem;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .vil-row-spacer {
    width: 18px;
    display: inline-block;
  }
</style>