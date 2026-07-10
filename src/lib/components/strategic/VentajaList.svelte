<script lang="ts">
  import { dataStore } from '../../stores/data'
  import VentajaEditModal from './VentajaEditModal.svelte'
  import { ENTITY_TYPE_LABELS } from '../../constants'
  import type { StrategicIndex, StrategicCategory, EntityType } from '../../types'

  let { indexes, categories, selectedId = $bindable<string | null>(null) }: {
    indexes: StrategicIndex[]
    categories: StrategicCategory[]
    selectedId?: string | null
  } = $props()

  let newName = $state('')
  let newDesc = $state('')
  let newContext = $state('general')
  let newEntityTypes = $state<Set<EntityType>>(new Set(ENTITY_TYPE_LABELS.map(e => e.key)))
  let addError = $state('')

  function contextLabel(ctx?: string): string {
    return categories.find(c => c.id === (ctx ?? 'general'))?.label ?? 'General'
  }

  function toggleNewType(key: EntityType) {
    const next = new Set(newEntityTypes)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    newEntityTypes = next
  }

  function addIndex() {
    const name = newName.trim()
    if (!name) return
    const id = 'idx_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_')
    const ok = dataStore.addIndex({ id, name, description: newDesc.trim(), context: newContext, entityTypes: [...newEntityTypes] })
    if (!ok) {
      addError = `Ya existe una ventaja con el id "${id}" (nombre demasiado parecido a otra). Elegí otro nombre.`
      return
    }
    addError = ''
    newName = ''
    newDesc = ''
    newContext = 'general'
    newEntityTypes = new Set(ENTITY_TYPE_LABELS.map(e => e.key))
    selectedId = id
  }

  function delIndex(idx: StrategicIndex, e: MouseEvent) {
    e.stopPropagation()
    if (confirm(`Eliminar ventaja "${idx.name}"? Se borran sus valores en todas las entidades.`)) {
      dataStore.deleteIndex(idx.id)
      if (selectedId === idx.id) selectedId = null
    }
  }

  let editModalOpen = $state(false)
  let editingIdx = $state<StrategicIndex | null>(null)
  function openEdit(idx: StrategicIndex, e: MouseEvent) {
    e.stopPropagation()
    editingIdx = idx
    editModalOpen = true
  }
</script>

<div class="vl-root">
  <div class="vl-add-row">
    <input type="text" bind:value={newName} placeholder="Nombre de la ventaja" class="sv-text-input"
      onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addIndex() } }} />
    <input type="text" bind:value={newDesc} placeholder="Descripción (opcional)" class="sv-text-input sv-text-wide" />
    <select bind:value={newContext} class="sv-text-input">
      {#each categories as ctx}
        <option value={ctx.id}>{ctx.label}</option>
      {/each}
    </select>
    <button class="sv-btn-add" onclick={addIndex}>+ Añadir</button>
  </div>
  <div class="vl-checks">
    {#each ENTITY_TYPE_LABELS as et}
      <label class="vl-check">
        <input type="checkbox" checked={newEntityTypes.has(et.key)} onchange={() => toggleNewType(et.key)} />
        {et.label}
      </label>
    {/each}
  </div>
  {#if addError}
    <p class="sv-error">{addError}</p>
  {/if}

  {#if indexes.length === 0}
    <p class="sv-hint">No hay ventajas definidas. Crea una para empezar.</p>
  {:else}
    <ul class="vl-list">
      {#each indexes as idx}
        <li>
          <div
            class="vl-item"
            class:active={selectedId === idx.id}
            role="button"
            tabindex="0"
            onclick={() => selectedId = idx.id}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectedId = idx.id } }}
          >
            <span class="vl-name">{idx.name}</span>
            <span class="vl-context">{contextLabel(idx.context)}</span>
            <span class="vl-actions">
              <button class="vl-icon-btn" title="Editar" onclick={(e) => openEdit(idx, e)}>✎</button>
              {#if idx.id !== 'general'}
                <button class="vl-icon-btn vl-icon-danger" title="Eliminar" onclick={(e) => delIndex(idx, e)}>🗑</button>
              {/if}
            </span>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<VentajaEditModal bind:open={editModalOpen} idx={editingIdx} {categories} />

<style>
  .vl-root {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .vl-add-row {
    display: flex;
    gap: 4px;
    align-items: center;
    flex-wrap: wrap;
  }
  .vl-checks {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .vl-check {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 0.55rem;
    color: var(--text-secondary);
  }
  .vl-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-y: auto;
  }
  .vl-item {
    display: flex;
    align-items: center;
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
  .vl-item.active {
    border-color: var(--gold);
    background: var(--bg-card);
  }
  .vl-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .vl-context {
    font-size: 0.5rem;
    color: var(--text-dim);
    white-space: nowrap;
  }
  .vl-actions {
    display: flex;
    gap: 2px;
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
