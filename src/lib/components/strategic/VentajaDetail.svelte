<script lang="ts">
  import { dataStore } from '../../stores/data'
  import PointStepper from './PointStepper.svelte'
  import type { StrategicIndex } from '../../types'
  import type { EntityKind } from './types'

  let { idx, entityKinds }: { idx: StrategicIndex; entityKinds: EntityKind[] } = $props()

  let entityTabKey = $state<'class' | 'race' | 'profession' | 'task' | 'warband' | 'personaje'>('class')
  let search = $state('')
  let onlyAssigned = $state(true)
  let sortDesc = $state(true)

  let visibleKinds = $derived(
    entityKinds.filter(k => !idx.entityTypes || idx.entityTypes.includes(k.key))
  )

  $effect(() => {
    if (visibleKinds.length > 0 && !visibleKinds.some(k => k.key === entityTabKey)) {
      entityTabKey = visibleKinds[0].key
    }
  })

  let entityTab = $derived(visibleKinds.find(k => k.key === entityTabKey) ?? visibleKinds[0])

  function valueFor(entityId: string): number | undefined {
    return dataStore.getStrategicValue(entityTabKey, entityId, idx.id)
  }

  let rows = $derived.by(() => {
    const q = search.trim().toLowerCase()
    let items = (entityTab?.items ?? []).map(item => ({ item, value: valueFor(item.id) }))
    if (q) items = items.filter(r => r.item.label.toLowerCase().includes(q))
    if (onlyAssigned) items = items.filter(r => r.value !== undefined)
    const assigned = items.filter(r => r.value !== undefined)
    const unassigned = items.filter(r => r.value === undefined)
    assigned.sort((a, b) => sortDesc ? (b.value! - a.value!) : (a.value! - b.value!))
    return [...assigned, ...unassigned]
  })

  function confirmValue(entityId: string, v: number | undefined) {
    if (v === undefined) dataStore.resetStrategicValue(entityTabKey, entityId, idx.id)
    else dataStore.setStrategicValue(entityTabKey, entityId, idx.id, v)
  }
</script>

<div class="vd-root">
  <div class="vd-header">
    <h3 class="vd-title">{idx.name}</h3>
    {#if idx.description}<p class="vd-desc">{idx.description}</p>{/if}
  </div>

  <div class="vd-chips">
    {#each visibleKinds as kind}
      <button class="vd-chip" class:active={entityTabKey === kind.key} onclick={() => entityTabKey = kind.key}>
        {kind.label}
      </button>
    {/each}
  </div>

  <div class="vd-controls">
    <input type="text" bind:value={search} placeholder="Buscar..." class="sv-text-input vd-search" />
    <label class="vd-toggle">
      <input type="checkbox" bind:checked={onlyAssigned} />
      Solo asignados
    </label>
    <button class="sv-btn-reset" onclick={() => sortDesc = !sortDesc}>
      Orden: {sortDesc ? 'Mayor a menor' : 'Menor a mayor'}
    </button>
  </div>

  {#if rows.length === 0}
    <p class="sv-hint">Nada para mostrar. {onlyAssigned ? 'Nadie tiene esta ventaja asignada todavía.' : ''}</p>
  {:else}
    <ul class="vd-rows">
      {#each rows as r (r.item.id)}
        <li class="vd-row">
          <div class="vd-row-label">
            <span>{r.item.label}</span>
            {#if r.item.sub}<span class="vd-row-sub">{r.item.sub}</span>{/if}
          </div>
          <PointStepper value={r.value} highlight={r.value !== undefined} onConfirm={(v) => confirmValue(r.item.id, v)} />
          {#if r.value !== undefined}
            <button class="vl-icon-btn vl-icon-danger" title="Quitar" onclick={() => confirmValue(r.item.id, undefined)}>✕</button>
          {:else}
            <span class="vd-row-spacer"></span>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .vd-root {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .vd-header {
    border-bottom: 1px solid var(--border-subtle);
    padding-bottom: 6px;
  }
  .vd-title {
    font-family: var(--font-heading);
    font-size: 0.75rem;
    color: var(--gold);
    margin: 0;
    letter-spacing: 0.04em;
  }
  .vd-desc {
    font-size: 0.55rem;
    color: var(--text-muted);
    margin: 2px 0 0;
  }
  .vd-chips {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .vd-chip {
    font-size: 0.55rem;
    padding: 3px 8px;
    border: 1px solid var(--border-subtle);
    border-radius: 999px;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
  }
  .vd-chip.active {
    border-color: var(--gold);
    color: var(--gold);
    background: var(--bg-card);
  }
  .vd-controls {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .vd-search {
    flex: 1;
    min-width: 120px;
  }
  .vd-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.55rem;
    color: var(--text-muted);
    white-space: nowrap;
  }
  .vd-rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 60vh;
    overflow-y: auto;
  }
  .vd-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 3px 4px;
    border-bottom: 1px solid var(--border-subtle);
  }
  .vd-row-label {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    font-size: 0.6rem;
    color: var(--text-primary);
  }
  .vd-row-sub {
    font-size: 0.5rem;
    color: var(--text-dim);
  }
  .vd-row-spacer {
    width: 18px;
    display: inline-block;
  }
  .vl-icon-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.6rem;
    padding: 2px 4px;
    border-radius: 3px;
  }
  .vl-icon-btn:hover {
    color: var(--gold);
  }
  .vl-icon-danger:hover {
    color: var(--danger);
  }
</style>
