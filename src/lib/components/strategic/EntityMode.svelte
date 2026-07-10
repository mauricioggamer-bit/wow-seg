<script lang="ts">
  import EntityAssignments from './EntityAssignments.svelte'
  import { calculateStrategicValue } from '../../leveling/strategicValue'
  import type { StrategicIndex, StrategicCategory, Personaje, LevelingConfig } from '../../types'
  import type { EntityKind } from './types'

  let { kind, indexes, categories, personajes, levelingCtx }: {
    kind: EntityKind
    indexes: StrategicIndex[]
    categories: StrategicCategory[]
    personajes?: Personaje[]
    levelingCtx?: { config: LevelingConfig; roster: Personaje[]; count90: number }
  } = $props()

  let search = $state('')
  let selectedId = $state<string | null>(null)
  let prevKind = $state<string | null>(null)

  $effect(() => {
    if (kind.key !== prevKind) {
      prevKind = kind.key
      selectedId = null
      search = ''
    }
  })

  let items = $derived.by(() => {
    const q = search.trim().toLowerCase()
    return q ? kind.items.filter(i => i.label.toLowerCase().includes(q)) : kind.items
  })

  let selectedItem = $derived(kind.items.find(i => i.id === selectedId))
  let selectedPersonaje = $derived(
    kind.key === 'personaje' ? personajes?.find(p => p.nombre === selectedId) : undefined
  )

  let scoreMap = $derived.by(() => {
    if (kind.key !== 'personaje' || !levelingCtx || !personajes) return null
    const map = new Map<string, number>()
    for (const p of personajes) {
      map.set(p.nombre, calculateStrategicValue(p, levelingCtx.config, levelingCtx.roster, levelingCtx.count90).totalScore)
    }
    return map
  })
</script>

<div class="em-root">
  <div class="em-body">
    <div class="em-master">
      {#if kind.items.length > 1}
        <input type="text" bind:value={search} placeholder="Buscar..." class="sv-text-input" />
      {/if}
      <ul class="em-list">
        {#each items as item (item.id)}
          <li>
            <button class="em-item" class:active={selectedId === item.id} onclick={() => selectedId = item.id}>
              <span class="em-item-main">
                <span>{item.label}</span>
                {#if item.sub}<span class="em-item-sub">{item.sub}</span>{/if}
              </span>
              {#if scoreMap}
                <span class="em-score">{scoreMap.get(item.id)?.toFixed(0) ?? '—'}</span>
              {/if}
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
        <EntityAssignments
          entityType={kind.key}
          entityId={selectedItem.id}
          entityLabel={selectedItem.label}
          {indexes}
          {categories}
          personajeData={selectedPersonaje}
          {levelingCtx}
        />
      {:else}
        <p class="sv-hint">Elegí {kind.label.toLowerCase()} de la lista para ver y gestionar sus ventajas.</p>
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
  .em-body {
    display: grid;
    grid-template-columns: minmax(160px, 240px) 1fr;
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
    max-height: 65vh;
    overflow-y: auto;
  }
  .em-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
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
  .em-item-main {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .em-item-sub {
    font-size: 0.5rem;
    color: var(--text-dim);
  }
  .em-score {
    font-size: 0.55rem;
    color: var(--gold);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
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
