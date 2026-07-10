<script lang="ts">
  import { dataStore } from '../../stores/data'
  import { PROFESSION_STRATEGIC_VALUE, RACE_PROFESSION_BONUS } from '../../constants'
  import { calculateStrategicValue } from '../../leveling/strategicValue'
  import StrategicBreakdown from '../leveling/StrategicBreakdown.svelte'
  import PointStepper from './PointStepper.svelte'
  import type { StrategicIndex, StrategicCategory, EntityType, Personaje, LevelingConfig } from '../../types'

  let { entityType, entityId, entityLabel, indexes, categories, personajeData, levelingCtx }: {
    entityType: EntityType
    entityId: string
    entityLabel: string
    indexes: StrategicIndex[]
    categories: StrategicCategory[]
    personajeData?: Personaje
    levelingCtx?: { config: LevelingConfig; roster: Personaje[]; count90: number }
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

  let professionDefault = $derived(entityType === 'profession' ? (PROFESSION_STRATEGIC_VALUE[entityId] ?? 0) : null)

  let professionRaceBonuses = $derived.by(() => {
    if (entityType !== 'profession') return []
    const result: { race: string; bonus: number; note?: string }[] = []
    for (const [race, bonuses] of Object.entries(RACE_PROFESSION_BONUS)) {
      for (const b of bonuses) {
        if (b.profId === entityId || b.profId === '*') {
          result.push({ race, bonus: b.bonus, note: b.note })
        }
      }
    }
    return result
  })

  let strategicResult = $derived(
    entityType === 'personaje' && personajeData && levelingCtx
      ? calculateStrategicValue(personajeData, levelingCtx.config, levelingCtx.roster, levelingCtx.count90)
      : null
  )
</script>

<div class="ea-root">
  <h3 class="ea-title">{entityLabel}</h3>
  <p class="ea-total">Total ventajas propias: <strong>{total} pts</strong></p>

  {#if professionDefault !== null && professionDefault > 0}
    <p class="sv-hint">Valor base fijo de esta profesión (no editable acá): +{professionDefault} pts en "General".</p>
  {/if}

  {#if entityType === 'profession' && professionRaceBonuses.length > 0}
    <div class="ea-bonus-box">
      <h4 class="ea-subheading">Razas que benefician esta profesión</h4>
      <ul class="ea-bonus-list">
        {#each professionRaceBonuses as b}
          <li>{b.race}: +{b.bonus}{b.note ? ` (${b.note})` : ''}</li>
        {/each}
      </ul>
    </div>
  {/if}

  <input type="text" bind:value={search} placeholder="Buscar ventaja..." class="sv-text-input" />

  <div class="ea-groups">
    {#each groups as group (group.catId)}
      <div class="ea-group">
        <h4 class="ea-subheading">{group.label}</h4>
        <ul class="ea-rows">
          {#each group.items as idx (idx.id)}
            {@const value = valueFor(idx.id)}
            {@const assigned = value !== undefined}
            <li class="ea-row" class:ea-dim={!assigned}>
              <span class="ea-row-label">{idx.name}</span>
              <PointStepper {value} highlight={assigned} onConfirm={(v) => confirmValue(idx.id, v)} />
              {#if assigned}
                <button class="ea-icon-btn ea-icon-danger" title="Quitar" onclick={() => confirmValue(idx.id, undefined)}>✕</button>
              {:else}
                <span class="ea-row-spacer"></span>
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

  {#if strategicResult}
    <div class="ea-breakdown">
      <h4 class="ea-subheading">Desglose completo (igual que en Leveling)</h4>
      <StrategicBreakdown strategic={strategicResult} />
    </div>
  {/if}
</div>

<style>
  .ea-root {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .ea-title {
    font-family: var(--font-heading);
    font-size: 0.75rem;
    color: var(--gold);
    margin: 0;
    letter-spacing: 0.04em;
    border-bottom: 1px solid var(--border-subtle);
    padding-bottom: 6px;
  }
  .ea-total {
    font-size: 0.6rem;
    color: var(--text-primary);
    margin: 0;
  }
  .ea-bonus-box {
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    padding: 6px;
  }
  .ea-bonus-list {
    margin: 0;
    padding-left: 16px;
    font-size: 0.55rem;
    color: var(--text-muted);
  }
  .ea-subheading {
    font-size: 0.6rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0 0 4px;
  }
  .ea-groups {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 50vh;
    overflow-y: auto;
  }
  .ea-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .ea-rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .ea-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 3px 4px;
    border-bottom: 1px solid var(--border-subtle);
  }
  .ea-row.ea-dim {
    opacity: 0.45;
  }
  .ea-row.ea-dim:focus-within {
    opacity: 1;
  }
  .ea-row-label {
    flex: 1;
    min-width: 0;
    font-size: 0.6rem;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ea-row-spacer {
    width: 18px;
    display: inline-block;
  }
  .ea-icon-btn {
    background: transparent;
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.5rem;
    padding: 3px 6px;
    white-space: nowrap;
  }
  .ea-icon-danger:hover {
    border-color: var(--danger);
    color: var(--danger);
  }
  .ea-breakdown {
    border-top: 1px solid var(--border-subtle);
    padding-top: 8px;
  }
</style>
