<script lang="ts">
  import { dataStore } from '../../stores/data'
  import VentajaEditModal from './VentajaEditModal.svelte'
  import type { StrategicIndex, StrategicCategory } from '../../types'

  let { indexes, categories, selectedId = $bindable<string | null>(null) }: {
    indexes: StrategicIndex[]
    categories: StrategicCategory[]
    selectedId?: string | null
  } = $props()

  let newName = $state('')
  let newDesc = $state('')
  let newContext = $state('general')
  let addError = $state('')

  function contextLabel(ctx?: string): string {
    return categories.find(c => c.id === (ctx ?? 'general'))?.label ?? 'General'
  }

  function addIndex() {
    const name = newName.trim()
    if (!name) return
    const id = 'idx_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_')
    const ok = dataStore.addIndex({ id, name, description: newDesc.trim(), context: newContext })
    if (!ok) {
      addError = `Ya existe una ventaja con el id "${id}" (nombre demasiado parecido a otra). Elegí otro nombre.`
      return
    }
    addError = ''
    newName = ''
    newDesc = ''
    newContext = 'general'
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
    <input type="text" bind:value={newName} placeholder="Nombre de la ventaja" class="sv-text-input" />
    <input type="text" bind:value={newDesc} placeholder="Descripción (opcional)" class="sv-text-input sv-text-wide" />
    <select bind:value={newContext} class="sv-text-input">
      {#each categories as ctx}
        <option value={ctx.id}>{ctx.label}</option>
      {/each}
    </select>
    <button class="sv-btn-add" onclick={addIndex}>+ Añadir</button>
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
