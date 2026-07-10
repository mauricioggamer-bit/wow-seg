<script lang="ts">
  import { dataStore } from '../../stores/data'
  import { PROFESSION_STRATEGIC_VALUE, STRATEGIC_CONTEXTS } from '../../constants'
  import type { StrategicIndex, StrategicContext, EntityType } from '../../types'

  let { entityType, entityId, entityLabel, indexes }: {
    entityType: EntityType
    entityId: string
    entityLabel: string
    indexes: StrategicIndex[]
  } = $props()

  function contextLabel(ctx?: StrategicContext): string {
    return STRATEGIC_CONTEXTS.find(c => c.id === (ctx ?? 'general'))?.label ?? 'General'
  }

  let assigned = $derived(
    indexes
      .map(idx => ({ idx, value: dataStore.getStrategicValue(entityType, entityId, idx.id) }))
      .filter((r): r is { idx: StrategicIndex; value: number } => r.value !== undefined)
  )
  let unassigned = $derived(indexes.filter(idx => dataStore.getStrategicValue(entityType, entityId, idx.id) === undefined))

  let pickerId = $state('')

  function addPicked() {
    if (!pickerId) return
    dataStore.setStrategicValue(entityType, entityId, pickerId, 50)
    pickerId = ''
  }

  function save(indexId: string, el: EventTarget & HTMLInputElement) {
    const raw = el.value.trim()
    if (raw === '') { dataStore.resetStrategicValue(entityType, entityId, indexId); return }
    const v = parseInt(raw)
    if (!isNaN(v) && v >= 0) dataStore.setStrategicValue(entityType, entityId, indexId, v)
  }

  function quitar(indexId: string) {
    dataStore.resetStrategicValue(entityType, entityId, indexId)
  }

  let professionDefault = $derived(entityType === 'profession' ? (PROFESSION_STRATEGIC_VALUE[entityId] ?? 0) : null)
</script>

<div class="ea-root">
  <h3 class="ea-title">{entityLabel}</h3>

  {#if professionDefault !== null && professionDefault > 0}
    <p class="sv-hint">Valor base fijo de esta profesión (no editable acá): +{professionDefault} pts en "General".</p>
  {/if}

  {#if assigned.length === 0}
    <p class="sv-hint">Sin ventajas asignadas todavía.</p>
  {:else}
    <ul class="ea-rows">
      {#each assigned as r (r.idx.id)}
        <li class="ea-row">
          <div class="ea-row-label">
            <span>{r.idx.name}</span>
            <span class="ea-row-context">{contextLabel(r.idx.context)}</span>
          </div>
          <input type="number" min="0" max="100"
            value={r.value}
            onchange={(e) => save(r.idx.id, e.currentTarget)}
            class="sv-input sv-overridden" />
          <button class="ea-icon-btn ea-icon-danger" title="Quitar" onclick={() => quitar(r.idx.id)}>✕ Quitar</button>
        </li>
      {/each}
    </ul>
  {/if}

  {#if unassigned.length > 0}
    <div class="ea-add-row">
      <select bind:value={pickerId} class="sv-text-input ea-picker">
        <option value="">+ Añadir ventaja...</option>
        {#each unassigned as idx}
          <option value={idx.id}>{idx.name}</option>
        {/each}
      </select>
      <button class="sv-btn-add" onclick={addPicked} disabled={!pickerId}>Agregar</button>
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
  .ea-rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .ea-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px;
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
  }
  .ea-row-label {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    font-size: 0.6rem;
    color: var(--text-primary);
  }
  .ea-row-context {
    font-size: 0.5rem;
    color: var(--text-dim);
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
  .ea-add-row {
    display: flex;
    gap: 4px;
    align-items: center;
    padding-top: 4px;
    border-top: 1px solid var(--border-subtle);
  }
  .ea-picker {
    flex: 1;
    min-width: 140px;
  }
</style>
