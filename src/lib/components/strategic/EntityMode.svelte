<script lang="ts">
  import EntityAssignments from './EntityAssignments.svelte'
  import type { StrategicIndex } from '../../types'
  import type { EntityKind } from './types'

  let { entityKinds, indexes }: { entityKinds: EntityKind[]; indexes: StrategicIndex[] } = $props()

  let typeKey = $state<'class' | 'race' | 'profession' | 'task' | 'warband' | 'personaje'>('class')
  let search = $state('')
  let selectedId = $state<string | null>(null)

  let kind = $derived(entityKinds.find(k => k.key === typeKey) ?? entityKinds[0])
  let items = $derived.by(() => {
    const q = search.trim().toLowerCase()
    const list = kind?.items ?? []
    return q ? list.filter(i => i.label.toLowerCase().includes(q)) : list
  })

  function selectType(key: typeof typeKey) {
    typeKey = key
    selectedId = null
    search = ''
  }

  let selectedItem = $derived(items.find(i => i.id === selectedId) ?? kind?.items.find(i => i.id === selectedId))
</script>

<div class="em-root">
  <div class="em-chips">
    {#each entityKinds as k}
      <button class="vd-chip" class:active={typeKey === k.key} onclick={() => selectType(k.key)}>
        {k.label}
      </button>
    {/each}
  </div>

  <div class="em-body">
    <div class="em-master">
      {#if kind && kind.items.length > 1}
        <input type="text" bind:value={search} placeholder="Buscar..." class="sv-text-input" />
      {/if}
      <ul class="em-list">
        {#each items as item (item.id)}
          <li>
            <button class="em-item" class:active={selectedId === item.id} onclick={() => selectedId = item.id}>
              <span>{item.label}</span>
              {#if item.sub}<span class="em-item-sub">{item.sub}</span>{/if}
            </button>
          </li>
        {/each}
        {#if items.length === 0}
          <li class="sv-hint">Sin resultados.</li>
        {/if}
      </ul>
    </div>

    <div class="em-detail">
      {#if selectedItem}
        <EntityAssignments entityType={typeKey} entityId={selectedItem.id} entityLabel={selectedItem.label} {indexes} />
      {:else}
        <p class="sv-hint">Elegí {kind?.label.toLowerCase()} de la lista para ver y gestionar sus ventajas.</p>
      {/if}
    </div>
  </div>
</div>

<style>
  .em-root {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .em-chips {
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
  .em-body {
    display: grid;
    grid-template-columns: minmax(160px, 220px) 1fr;
    gap: 10px;
    min-width: 0;
  }
  .em-master {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .em-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 60vh;
    overflow-y: auto;
  }
  .em-item {
    display: flex;
    flex-direction: column;
    width: 100%;
    text-align: left;
    padding: 5px 6px;
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-sm);
    background: transparent;
    color: var(--text-primary);
    cursor: pointer;
    font-size: 0.6rem;
  }
  .em-item.active {
    border-color: var(--gold);
    background: var(--bg-card);
    color: var(--gold);
  }
  .em-item-sub {
    font-size: 0.5rem;
    color: var(--text-dim);
  }
  .em-detail {
    min-width: 0;
    border-left: 1px solid var(--border-subtle);
    padding-left: 10px;
  }
  @media (max-width: 640px) {
    .em-body {
      grid-template-columns: 1fr;
    }
    .em-detail {
      border-left: none;
      padding-left: 0;
      border-top: 1px solid var(--border-subtle);
      padding-top: 8px;
    }
  }
</style>
